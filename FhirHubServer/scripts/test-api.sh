#!/bin/bash

# API Test Script for FhirHub Backend
# Usage: ./scripts/test-api.sh [base_url]

BASE_URL="${1:-http://localhost:5197}"
HAPI_URL="${2:-http://localhost:8080}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "FhirHub API Test Suite"
echo "API URL: $BASE_URL"
echo "HAPI URL: $HAPI_URL"
echo "================================================"
echo ""

passed=0
failed=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="${4:-200}"
    local data="$5"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $name (HTTP $status_code)"
        ((passed++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - $name (Expected: $expected_status, Got: $status_code)"
        echo "  Response: $body"
        ((failed++))
        return 1
    fi
}

# ========================================
# Dashboard Endpoints (5 tests)
# ========================================
echo -e "\n${YELLOW}=== Dashboard Endpoints ===${NC}"

test_endpoint "GET /api/dashboard/metrics" \
    "GET" "/api/dashboard/metrics"

test_endpoint "GET /api/dashboard/alerts" \
    "GET" "/api/dashboard/alerts"

test_endpoint "GET /api/dashboard/alerts with limit" \
    "GET" "/api/dashboard/alerts?limit=5"

test_endpoint "GET /api/dashboard/activities" \
    "GET" "/api/dashboard/activities"

test_endpoint "GET /api/dashboard/activities with limit" \
    "GET" "/api/dashboard/activities?limit=3"

# ========================================
# Patient Endpoints (9 tests)
# ========================================
echo -e "\n${YELLOW}=== Patient Endpoints ===${NC}"

test_endpoint "GET /api/patients" \
    "GET" "/api/patients"

test_endpoint "GET /api/patients with pagination" \
    "GET" "/api/patients?page=1&pageSize=2"

test_endpoint "GET /api/patients with search" \
    "GET" "/api/patients?query=John"

test_endpoint "GET /api/patients/summaries" \
    "GET" "/api/patients/summaries"

test_endpoint "GET /api/patients/{id}" \
    "GET" "/api/patients/patient-001"

test_endpoint "GET /api/patients/{id} - not found" \
    "GET" "/api/patients/nonexistent" 404

test_endpoint "GET /api/patients/{id}/vitals" \
    "GET" "/api/patients/patient-001/vitals"

test_endpoint "GET /api/patients/{id}/vitals/chart" \
    "GET" "/api/patients/patient-001/vitals/chart"

test_endpoint "GET /api/patients/{id}/conditions" \
    "GET" "/api/patients/patient-001/conditions"

test_endpoint "GET /api/patients/{id}/conditions with includeResolved" \
    "GET" "/api/patients/patient-001/conditions?includeResolved=true"

test_endpoint "GET /api/patients/{id}/medications" \
    "GET" "/api/patients/patient-001/medications"

test_endpoint "GET /api/patients/{id}/medications with includeDiscontinued" \
    "GET" "/api/patients/patient-001/medications?includeDiscontinued=true"

test_endpoint "GET /api/patients/{id}/labs" \
    "GET" "/api/patients/patient-001/labs"

test_endpoint "GET /api/patients/{id}/timeline" \
    "GET" "/api/patients/patient-001/timeline"

# ========================================
# Export Endpoints (6 tests)
# ========================================
echo -e "\n${YELLOW}=== Export Endpoints ===${NC}"

test_endpoint "GET /api/exports" \
    "GET" "/api/exports"

test_endpoint "GET /api/exports/{id}" \
    "GET" "/api/exports/export-001"

test_endpoint "GET /api/exports/{id} - not found" \
    "GET" "/api/exports/nonexistent" 404

test_endpoint "POST /api/exports" \
    "POST" "/api/exports" 201 \
    '{"resourceTypes":["Patient","Observation"],"format":"ndjson","includeReferences":true}'

test_endpoint "POST /api/exports/{id}/cancel" \
    "POST" "/api/exports/export-002/cancel" 204

test_endpoint "POST /api/exports/{id}/retry" \
    "POST" "/api/exports/export-003/retry"

# ========================================
# HAPI FHIR Tests (if available)
# ========================================
echo -e "\n${YELLOW}=== HAPI FHIR Server ===${NC}"

hapi_response=$(curl -s -o /dev/null -w "%{http_code}" "$HAPI_URL/fhir/metadata" 2>/dev/null)
if [ "$hapi_response" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} - HAPI FHIR Server is running"
    ((passed++))

    # Test creating a patient in HAPI
    create_patient=$(curl -s -w "\n%{http_code}" -X POST "$HAPI_URL/fhir/Patient" \
        -H "Content-Type: application/fhir+json" \
        -d '{
            "resourceType": "Patient",
            "name": [{"family": "TestPatient", "given": ["Docker"]}],
            "gender": "male",
            "birthDate": "1990-01-01"
        }')

    create_status=$(echo "$create_patient" | tail -n1)
    if [ "$create_status" -eq 201 ]; then
        echo -e "${GREEN}✓ PASS${NC} - Create Patient in HAPI FHIR"
        ((passed++))
    else
        echo -e "${RED}✗ FAIL${NC} - Create Patient in HAPI FHIR (HTTP $create_status)"
        ((failed++))
    fi

    # Test reading patients from HAPI
    read_patients=$(curl -s -o /dev/null -w "%{http_code}" "$HAPI_URL/fhir/Patient")
    if [ "$read_patients" -eq 200 ]; then
        echo -e "${GREEN}✓ PASS${NC} - Read Patients from HAPI FHIR"
        ((passed++))
    else
        echo -e "${RED}✗ FAIL${NC} - Read Patients from HAPI FHIR (HTTP $read_patients)"
        ((failed++))
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} - HAPI FHIR Server not available at $HAPI_URL"
fi

# ========================================
# Summary
# ========================================
echo ""
echo "================================================"
echo "Test Summary"
echo "================================================"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
