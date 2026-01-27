#!/bin/bash

# HAPI FHIR Seed Data Script
# Usage: ./scripts/seed-hapi.sh [hapi_url]

HAPI_URL="${1:-http://localhost:8080}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "Seeding HAPI FHIR Server"
echo "URL: $HAPI_URL"
echo "================================================"
echo ""

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

echo ""
echo "Creating sample patients..."

# Patient 1: John Smith
curl -s -X POST "$HAPI_URL/fhir/Patient" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Patient",
        "id": "patient-001",
        "identifier": [{"system": "http://hospital.example/mrn", "value": "MRN-001234"}],
        "name": [{"family": "Smith", "given": ["John"]}],
        "gender": "male",
        "birthDate": "1985-03-15",
        "telecom": [
            {"system": "phone", "value": "(555) 123-4567"},
            {"system": "email", "value": "john.smith@email.com"}
        ],
        "address": [{"line": ["123 Main St"], "city": "Springfield", "state": "IL", "postalCode": "62701"}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Patient: John Smith"

# Patient 2: Emily Davis
curl -s -X POST "$HAPI_URL/fhir/Patient" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Patient",
        "id": "patient-002",
        "identifier": [{"system": "http://hospital.example/mrn", "value": "MRN-001235"}],
        "name": [{"family": "Davis", "given": ["Emily"]}],
        "gender": "female",
        "birthDate": "1992-07-22",
        "telecom": [
            {"system": "phone", "value": "(555) 234-5678"},
            {"system": "email", "value": "emily.davis@email.com"}
        ],
        "address": [{"line": ["456 Oak Ave"], "city": "Springfield", "state": "IL", "postalCode": "62702"}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Patient: Emily Davis"

# Patient 3: Robert Johnson
curl -s -X POST "$HAPI_URL/fhir/Patient" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Patient",
        "id": "patient-003",
        "identifier": [{"system": "http://hospital.example/mrn", "value": "MRN-001236"}],
        "name": [{"family": "Johnson", "given": ["Robert"]}],
        "gender": "male",
        "birthDate": "1978-11-08",
        "telecom": [
            {"system": "phone", "value": "(555) 345-6789"},
            {"system": "email", "value": "robert.johnson@email.com"}
        ],
        "address": [{"line": ["789 Pine Rd"], "city": "Springfield", "state": "IL", "postalCode": "62703"}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Patient: Robert Johnson"

echo ""
echo "Creating sample conditions..."

# Condition: Type 2 Diabetes for John Smith
curl -s -X POST "$HAPI_URL/fhir/Condition" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Condition",
        "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
        "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed"}]},
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10-cm", "code": "E11.9", "display": "Type 2 diabetes mellitus without complications"}], "text": "Type 2 Diabetes Mellitus"},
        "subject": {"reference": "Patient/patient-001"},
        "onsetDateTime": "2020-06-15"
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Condition: Type 2 Diabetes"

# Condition: Hypertension for John Smith
curl -s -X POST "$HAPI_URL/fhir/Condition" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Condition",
        "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
        "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed"}]},
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10-cm", "code": "I10", "display": "Essential (primary) hypertension"}], "text": "Essential Hypertension"},
        "subject": {"reference": "Patient/patient-001"},
        "onsetDateTime": "2019-03-20"
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Condition: Hypertension"

echo ""
echo "Creating sample observations (vitals)..."

# Blood Pressure Observation
curl -s -X POST "$HAPI_URL/fhir/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Observation",
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
        "code": {"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}]},
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-15T10:30:00Z",
        "component": [
            {
                "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                "valueQuantity": {"value": 120, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
            },
            {
                "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                "valueQuantity": {"value": 80, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
            }
        ]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Observation: Blood Pressure 120/80"

# Heart Rate Observation
curl -s -X POST "$HAPI_URL/fhir/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Observation",
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
        "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]},
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-15T10:30:00Z",
        "valueQuantity": {"value": 72, "unit": "/min", "system": "http://unitsofmeasure.org", "code": "/min"}
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Observation: Heart Rate 72 bpm"

echo ""
echo "Creating sample medications..."

# Medication Request: Metformin
curl -s -X POST "$HAPI_URL/fhir/MedicationRequest" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {"coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "861007", "display": "metformin hydrochloride 500 MG Oral Tablet"}], "text": "Metformin 500mg"},
        "subject": {"reference": "Patient/patient-001"},
        "authoredOn": "2020-06-20",
        "dosageInstruction": [{"text": "Take 500mg twice daily with meals", "timing": {"repeat": {"frequency": 2, "period": 1, "periodUnit": "d"}}}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created MedicationRequest: Metformin 500mg"

# Medication Request: Lisinopril
curl -s -X POST "$HAPI_URL/fhir/MedicationRequest" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {"coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "314076", "display": "lisinopril 10 MG Oral Tablet"}], "text": "Lisinopril 10mg"},
        "subject": {"reference": "Patient/patient-001"},
        "authoredOn": "2019-03-25",
        "dosageInstruction": [{"text": "Take 10mg once daily in the morning", "timing": {"repeat": {"frequency": 1, "period": 1, "periodUnit": "d"}}}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created MedicationRequest: Lisinopril 10mg"

echo ""
echo "Creating sample lab results..."

# Lab: Glucose
curl -s -X POST "$HAPI_URL/fhir/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Observation",
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
        "code": {"coding": [{"system": "http://loinc.org", "code": "2345-7", "display": "Glucose [Mass/volume] in Serum or Plasma"}], "text": "Glucose"},
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-10T08:00:00Z",
        "valueQuantity": {"value": 105, "unit": "mg/dL", "system": "http://unitsofmeasure.org", "code": "mg/dL"},
        "interpretation": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", "code": "H", "display": "High"}]}],
        "referenceRange": [{"low": {"value": 70, "unit": "mg/dL"}, "high": {"value": 100, "unit": "mg/dL"}}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Observation: Glucose 105 mg/dL"

# Lab: HbA1c
curl -s -X POST "$HAPI_URL/fhir/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d '{
        "resourceType": "Observation",
        "status": "final",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
        "code": {"coding": [{"system": "http://loinc.org", "code": "4548-4", "display": "Hemoglobin A1c/Hemoglobin.total in Blood"}], "text": "Hemoglobin A1c"},
        "subject": {"reference": "Patient/patient-001"},
        "effectiveDateTime": "2024-01-10T08:00:00Z",
        "valueQuantity": {"value": 6.8, "unit": "%", "system": "http://unitsofmeasure.org", "code": "%"},
        "interpretation": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", "code": "H", "display": "High"}]}],
        "referenceRange": [{"high": {"value": 5.7, "unit": "%"}}]
    }' > /dev/null && echo -e "${GREEN}✓${NC} Created Observation: HbA1c 6.8%"

echo ""
echo "================================================"
echo -e "${GREEN}HAPI FHIR seeding complete!${NC}"
echo "================================================"
echo ""
echo "Verify with: curl $HAPI_URL/fhir/Patient"
