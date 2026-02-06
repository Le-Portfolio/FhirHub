#!/bin/bash

# HAPI FHIR Seed with Synthea Data (Docker-based, no Java required)
# Usage: ./seed-synthea.sh [num_patients]

NUM_PATIENTS="${1:-10}"
SYNTHEA_VERSION="v3.3.0"
HAPI_INTERNAL_URL="http://fhirhub-hapi:8080"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNTHEA_DIR="$SCRIPT_DIR/../.synthea"
OUTPUT_DIR="$SYNTHEA_DIR/output/fhir"

echo "================================================"
echo "Seeding HAPI FHIR with Synthea Data"
echo "Patients: $NUM_PATIENTS"
echo "================================================"
echo ""

# Find the Docker network that hapi-fhir is on
HAPI_CONTAINER=$(docker ps --filter "name=hapi" --format '{{.Names}}' | head -1)
if [ -z "$HAPI_CONTAINER" ]; then
    echo -e "${RED}HAPI FHIR container not found. Is it running?${NC}"
    echo "Start it with: docker compose up -d hapi-fhir"
    exit 1
fi

DOCKER_NETWORK=$(docker inspect "$HAPI_CONTAINER" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
if [ -z "$DOCKER_NETWORK" ]; then
    echo -e "${RED}Could not detect Docker network for $HAPI_CONTAINER${NC}"
    exit 1
fi
echo "Using Docker network: $DOCKER_NETWORK"
echo "HAPI container: $HAPI_CONTAINER"
echo ""

# Wait for HAPI to be ready
echo "Checking HAPI FHIR availability..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker run --rm --network "$DOCKER_NETWORK" curlimages/curl \
        -sf "$HAPI_INTERNAL_URL/fhir/metadata" > /dev/null 2>&1; then
        echo -e "${GREEN}HAPI FHIR is ready!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for HAPI FHIR... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}HAPI FHIR did not become available${NC}"
    exit 1
fi

# Download Synthea if not present
if [ ! -f "$SYNTHEA_DIR/synthea-with-dependencies.jar" ]; then
    echo ""
    echo "Downloading Synthea..."
    mkdir -p "$SYNTHEA_DIR"
    curl -L -o "$SYNTHEA_DIR/synthea-with-dependencies.jar" \
        "https://github.com/synthetichealth/synthea/releases/download/$SYNTHEA_VERSION/synthea-with-dependencies.jar"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download Synthea${NC}"
        exit 1
    fi
    echo -e "${GREEN}Synthea downloaded successfully${NC}"
fi

# Generate synthetic patient data using Docker (no local Java needed)
echo ""
echo "Generating $NUM_PATIENTS synthetic patients..."
docker run --rm -v "$SYNTHEA_DIR:/synthea" alpine rm -rf /synthea/output/fhir
mkdir -p "$OUTPUT_DIR"

docker run --rm \
    -v "$SYNTHEA_DIR:/synthea" \
    eclipse-temurin:17-jre \
    java -jar /synthea/synthea-with-dependencies.jar \
        -p "$NUM_PATIENTS" \
        --exporter.fhir.export true \
        --exporter.fhir.bulk_data false \
        --exporter.fhir.use_shr_extensions false \
        --exporter.hospital.fhir.export true \
        --exporter.practitioner.fhir.export true \
        --exporter.ccda.export false \
        --exporter.csv.export false \
        --exporter.text.export false \
        --exporter.baseDirectory /synthea/output \
        Illinois

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Synthea data${NC}"
    exit 1
fi

echo -e "${GREEN}Generated synthetic patient data${NC}"

# Upload to HAPI FHIR via Docker
echo ""
echo "Uploading to HAPI FHIR..."

uploaded=0
failed=0

upload_bundle() {
    local file="$1"
    local label="$2"
    local filename
    filename=$(basename "$file")

    response=$(docker run --rm \
        --network "$DOCKER_NETWORK" \
        -v "$file:/data/$filename:ro" \
        curlimages/curl \
        -sf -w "%{http_code}" -o /dev/null \
        -X POST "$HAPI_INTERNAL_URL/fhir" \
        -H "Content-Type: application/fhir+json" \
        -d @"/data/$filename")

    if [ "$response" -eq 200 ] 2>/dev/null || [ "$response" -eq 201 ] 2>/dev/null; then
        ((uploaded++))
        echo -e "${GREEN}✓${NC} Uploaded: $filename $label"
    else
        ((failed++))
        echo -e "${RED}✗${NC} Failed: $filename (HTTP $response) $label"
    fi
}

# Upload hospital and practitioner bundles first
for file in "$OUTPUT_DIR"/hospitalInformation*.json "$OUTPUT_DIR"/practitionerInformation*.json; do
    [ -f "$file" ] && upload_bundle "$file" "(reference data)"
done

# Upload patient bundles
for file in "$OUTPUT_DIR"/*.json; do
    case "$(basename "$file")" in
        hospitalInformation*|practitionerInformation*) continue ;;
    esac
    [ -f "$file" ] && upload_bundle "$file" ""
done

echo ""
echo "================================================"
echo "Synthea Seeding Complete"
echo "================================================"
echo -e "Uploaded: ${GREEN}$uploaded${NC} bundles"
echo -e "Failed: ${RED}$failed${NC} bundles"
echo ""

# Show resource counts
echo "Resource counts in HAPI:"
for resource in Patient Condition Observation MedicationRequest Encounter DiagnosticReport; do
    count=$(docker run --rm --network "$DOCKER_NETWORK" curlimages/curl \
        -sf "$HAPI_INTERNAL_URL/fhir/$resource?_summary=count" 2>/dev/null \
        | grep -o '"total":[0-9]*' | grep -o '[0-9]*' || echo "0")
    echo "  $resource: $count"
done

echo ""
echo -e "${GREEN}Done!${NC}"
