#!/bin/bash

# Synthea Data Seeding Script for HAPI FHIR Server
# This script downloads or generates Synthea patient data and loads it into HAPI FHIR

set -e

HAPI_FHIR_URL="${HAPI_FHIR_URL:-http://localhost:8080/fhir}"
SYNTHEA_VERSION="3.2.0"
PATIENT_COUNT="${PATIENT_COUNT:-50}"
SEED="${SEED:-12345}"
OUTPUT_DIR="./synthea-output"
SYNTHEA_JAR="synthea-with-dependencies.jar"

echo "=== FhirHub Synthea Data Seeder ==="
echo "HAPI FHIR URL: $HAPI_FHIR_URL"
echo "Patient Count: $PATIENT_COUNT"
echo ""

# Check if HAPI FHIR is available
check_hapi_fhir() {
    echo "Checking HAPI FHIR server availability..."
    if curl -s -f "${HAPI_FHIR_URL}/metadata" > /dev/null 2>&1; then
        echo "✓ HAPI FHIR server is available"
        return 0
    else
        echo "✗ HAPI FHIR server is not available at ${HAPI_FHIR_URL}"
        echo "  Please ensure the server is running (docker-compose up -d)"
        return 1
    fi
}

# Download Synthea if not present
download_synthea() {
    if [ -f "$SYNTHEA_JAR" ]; then
        echo "✓ Synthea JAR already exists"
        return 0
    fi

    echo "Downloading Synthea ${SYNTHEA_VERSION}..."
    curl -L -o "$SYNTHEA_JAR" \
        "https://github.com/synthetichealth/synthea/releases/download/v${SYNTHEA_VERSION}/synthea-with-dependencies.jar"
    echo "✓ Synthea downloaded"
}

# Generate Synthea data
generate_data() {
    echo ""
    echo "Generating synthetic patient data..."
    echo "This may take a few minutes..."

    # Clean previous output
    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"

    # Run Synthea with FHIR R4 export
    java -jar "$SYNTHEA_JAR" \
        -p "$PATIENT_COUNT" \
        -s "$SEED" \
        --exporter.fhir.export true \
        --exporter.fhir.use_us_core_ig true \
        --exporter.baseDirectory "$OUTPUT_DIR" \
        --exporter.years_of_history 5 \
        --generate.only_alive_patients true \
        Massachusetts

    echo "✓ Generated $PATIENT_COUNT patients"
}

# Load data into HAPI FHIR
load_data() {
    echo ""
    echo "Loading data into HAPI FHIR..."

    local fhir_dir="$OUTPUT_DIR/fhir"
    local total_files=$(ls -1 "$fhir_dir"/*.json 2>/dev/null | wc -l | tr -d ' ')
    local loaded=0
    local failed=0

    if [ "$total_files" -eq 0 ]; then
        echo "No FHIR bundles found in $fhir_dir"
        return 1
    fi

    echo "Found $total_files FHIR bundles to load"

    for bundle_file in "$fhir_dir"/*.json; do
        local filename=$(basename "$bundle_file")

        # Skip practitioner and hospital info files
        if [[ "$filename" == "practitionerInformation"* ]] || [[ "$filename" == "hospitalInformation"* ]]; then
            echo "  Skipping $filename (reference data)"
            continue
        fi

        echo -n "  Loading $filename... "

        # POST the bundle as a transaction
        local response=$(curl -s -w "\n%{http_code}" -X POST "$HAPI_FHIR_URL" \
            -H "Content-Type: application/fhir+json" \
            -d @"$bundle_file")

        local http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
            echo "✓"
            ((loaded++))
        else
            echo "✗ (HTTP $http_code)"
            ((failed++))
        fi
    done

    echo ""
    echo "=== Loading Complete ==="
    echo "Loaded: $loaded bundles"
    echo "Failed: $failed bundles"
}

# Download pre-generated Synthea samples (alternative to generating)
download_sample_data() {
    echo "Downloading pre-generated Synthea sample data..."

    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/fhir"

    # Download sample bundles from Synthea's sample data repository
    local SAMPLE_URL="https://synthetichealth.github.io/synthea-sample-data/downloads/synthea_sample_data_fhir_r4_sep2019.zip"

    echo "Downloading sample data (this may take a while)..."
    curl -L -o synthea-sample.zip "$SAMPLE_URL"

    echo "Extracting..."
    unzip -q synthea-sample.zip -d "$OUTPUT_DIR/fhir"
    rm synthea-sample.zip

    echo "✓ Sample data downloaded"
}

# Quick seed with minimal data for development
quick_seed() {
    echo "Quick seeding with minimal test data..."

    # Create a simple test patient bundle
    local test_bundle=$(cat <<'EOF'
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-001",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-001",
        "identifier": [
          {
            "type": {
              "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]
            },
            "value": "MRN-001234"
          }
        ],
        "active": true,
        "name": [{"family": "Smith", "given": ["John", "Robert"]}],
        "gender": "male",
        "birthDate": "1985-03-15",
        "telecom": [
          {"system": "phone", "value": "(555) 123-4567"},
          {"system": "email", "value": "john.smith@email.com"}
        ],
        "address": [{"line": ["123 Main St"], "city": "Springfield", "state": "IL", "postalCode": "62701"}]
      },
      "request": {"method": "PUT", "url": "Patient/patient-001"}
    },
    {
      "fullUrl": "urn:uuid:patient-002",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-002",
        "identifier": [
          {
            "type": {
              "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]
            },
            "value": "MRN-001235"
          }
        ],
        "active": true,
        "name": [{"family": "Davis", "given": ["Emily"]}],
        "gender": "female",
        "birthDate": "1992-07-22",
        "telecom": [
          {"system": "phone", "value": "(555) 234-5678"},
          {"system": "email", "value": "emily.davis@email.com"}
        ],
        "address": [{"line": ["456 Oak Ave"], "city": "Springfield", "state": "IL", "postalCode": "62702"}]
      },
      "request": {"method": "PUT", "url": "Patient/patient-002"}
    },
    {
      "fullUrl": "urn:uuid:condition-001",
      "resource": {
        "resourceType": "Condition",
        "id": "condition-001",
        "clinicalStatus": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
        },
        "verificationStatus": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed"}]
        },
        "code": {
          "coding": [{"system": "http://snomed.info/sct", "code": "44054006", "display": "Type 2 Diabetes Mellitus"}],
          "text": "Type 2 Diabetes Mellitus"
        },
        "subject": {"reference": "Patient/patient-001"},
        "onsetDateTime": "2020-06-15"
      },
      "request": {"method": "PUT", "url": "Condition/condition-001"}
    },
    {
      "fullUrl": "urn:uuid:observation-001",
      "resource": {
        "resourceType": "Observation",
        "id": "observation-001",
        "status": "final",
        "category": [
          {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]
          }
        ],
        "code": {
          "coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}],
          "text": "Blood Pressure"
        },
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-15T10:30:00Z",
        "component": [
          {
            "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic BP"}]},
            "valueQuantity": {"value": 120, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
          },
          {
            "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic BP"}]},
            "valueQuantity": {"value": 80, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
          }
        ]
      },
      "request": {"method": "PUT", "url": "Observation/observation-001"}
    },
    {
      "fullUrl": "urn:uuid:observation-002",
      "resource": {
        "resourceType": "Observation",
        "id": "observation-002",
        "status": "final",
        "category": [
          {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]
          }
        ],
        "code": {
          "coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}],
          "text": "Heart Rate"
        },
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-15T10:30:00Z",
        "valueQuantity": {"value": 72, "unit": "bpm", "system": "http://unitsofmeasure.org", "code": "/min"}
      },
      "request": {"method": "PUT", "url": "Observation/observation-002"}
    },
    {
      "fullUrl": "urn:uuid:medication-001",
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "medication-001",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975", "display": "Metformin 500mg"}],
          "text": "Metformin 500mg"
        },
        "subject": {"reference": "Patient/patient-001"},
        "authoredOn": "2020-06-20",
        "dosageInstruction": [
          {
            "timing": {"repeat": {"frequency": 2, "period": 1, "periodUnit": "d"}},
            "doseAndRate": [{"doseQuantity": {"value": 500, "unit": "mg"}}],
            "patientInstruction": "Take with meals"
          }
        ]
      },
      "request": {"method": "PUT", "url": "MedicationRequest/medication-001"}
    }
  ]
}
EOF
)

    echo "Loading test data..."
    local response=$(curl -s -w "\n%{http_code}" -X POST "$HAPI_FHIR_URL" \
        -H "Content-Type: application/fhir+json" \
        -d "$test_bundle")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✓ Test data loaded successfully"
    else
        echo "✗ Failed to load test data (HTTP $http_code)"
        echo "$response" | head -n -1
        return 1
    fi
}

# Verify loaded data
verify_data() {
    echo ""
    echo "Verifying loaded data..."

    local patient_count=$(curl -s "${HAPI_FHIR_URL}/Patient?_summary=count" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    local obs_count=$(curl -s "${HAPI_FHIR_URL}/Observation?_summary=count" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    local cond_count=$(curl -s "${HAPI_FHIR_URL}/Condition?_summary=count" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')

    echo "=== Data Summary ==="
    echo "Patients: ${patient_count:-0}"
    echo "Observations: ${obs_count:-0}"
    echo "Conditions: ${cond_count:-0}"
}

# Main execution
main() {
    local mode="${1:-quick}"

    case "$mode" in
        quick)
            check_hapi_fhir || exit 1
            quick_seed
            verify_data
            ;;
        generate)
            check_hapi_fhir || exit 1
            download_synthea
            generate_data
            load_data
            verify_data
            ;;
        sample)
            check_hapi_fhir || exit 1
            download_sample_data
            load_data
            verify_data
            ;;
        verify)
            check_hapi_fhir || exit 1
            verify_data
            ;;
        *)
            echo "Usage: $0 [quick|generate|sample|verify]"
            echo ""
            echo "Modes:"
            echo "  quick    - Load minimal test data (default, fastest)"
            echo "  generate - Generate fresh Synthea data (requires Java)"
            echo "  sample   - Download pre-generated Synthea samples"
            echo "  verify   - Just verify existing data"
            exit 1
            ;;
    esac
}

main "$@"
