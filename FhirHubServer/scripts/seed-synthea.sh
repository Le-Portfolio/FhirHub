#!/bin/bash

# HAPI FHIR Seed with Synthea Data
# Usage: ./scripts/seed-synthea.sh [hapi_url] [num_patients]

HAPI_URL="${1:-http://localhost:8080}"
NUM_PATIENTS="${2:-10}"
SYNTHEA_VERSION="v3.3.0"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNTHEA_DIR="$SCRIPT_DIR/../.synthea"
OUTPUT_DIR="$SYNTHEA_DIR/output/fhir"

echo "================================================"
echo "Seeding HAPI FHIR with Synthea Data"
echo "HAPI URL: $HAPI_URL"
echo "Patients: $NUM_PATIENTS"
echo "================================================"
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}Java is required but not installed.${NC}"
    echo "Please install Java 11 or higher and try again."
    exit 1
fi

# Wait for HAPI to be ready
echo "Checking HAPI FHIR availability..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s "$HAPI_URL/fhir/metadata" > /dev/null 2>&1; then
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

# Generate synthetic patient data
echo ""
echo "Generating $NUM_PATIENTS synthetic patients..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

cd "$SYNTHEA_DIR"
java -jar synthea-with-dependencies.jar \
    -p "$NUM_PATIENTS" \
    --exporter.fhir.export true \
    --exporter.fhir.bulk_data false \
    --exporter.fhir.use_shr_extensions false \
    --exporter.hospital.fhir.export true \
    --exporter.practitioner.fhir.export true \
    --exporter.ccda.export false \
    --exporter.csv.export false \
    --exporter.text.export false \
    --exporter.baseDirectory "$SYNTHEA_DIR/output" \
    Illinois

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Synthea data${NC}"
    exit 1
fi

echo -e "${GREEN}Generated synthetic patient data${NC}"

# Upload to HAPI FHIR
echo ""
echo "Uploading to HAPI FHIR..."

uploaded=0
failed=0

# Upload hospital and practitioner bundles first (they're referenced by patient bundles)
for file in "$OUTPUT_DIR"/hospitalInformation*.json "$OUTPUT_DIR"/practitionerInformation*.json; do
    if [ -f "$file" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null \
            -X POST "$HAPI_URL/fhir" \
            -H "Content-Type: application/fhir+json" \
            -d @"$file")

        if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
            ((uploaded++))
            echo -e "${GREEN}✓${NC} Uploaded: $(basename "$file") (reference data)"
        else
            ((failed++))
            echo -e "${YELLOW}!${NC} Warning: $(basename "$file") (HTTP $response) - continuing anyway"
        fi
    fi
done

# Upload patient bundles
for file in "$OUTPUT_DIR"/*.json; do
    # Skip hospital and practitioner files (already uploaded)
    case "$(basename "$file")" in
        hospitalInformation*|practitionerInformation*) continue ;;
    esac
    if [ -f "$file" ]; then
        # Upload as a transaction bundle
        response=$(curl -s -w "%{http_code}" -o /dev/null \
            -X POST "$HAPI_URL/fhir" \
            -H "Content-Type: application/fhir+json" \
            -d @"$file")

        if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
            ((uploaded++))
            echo -e "${GREEN}✓${NC} Uploaded: $(basename "$file")"
        else
            ((failed++))
            echo -e "${RED}✗${NC} Failed: $(basename "$file") (HTTP $response)"
        fi
    fi
done

echo ""
echo "================================================"
echo "Synthea Seeding Complete"
echo "================================================"
echo -e "Uploaded: ${GREEN}$uploaded${NC} bundles"
echo -e "Failed: ${RED}$failed${NC} bundles"
echo ""

# Show counts
echo "Resource counts in HAPI:"
for resource in Patient Condition Observation MedicationRequest Encounter DiagnosticReport; do
    count=$(curl -s "$HAPI_URL/fhir/$resource?_summary=count" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' || echo "0")
    echo "  $resource: $count"
done

echo ""
echo "Verify with: curl $HAPI_URL/fhir/Patient?_count=5"
