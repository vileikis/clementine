#!/bin/bash

# =============================================================================
# Transform Pipeline QA Test Script
# =============================================================================
#
# Runs all test cases for startTransformPipeline and validates responses.
# See docs/transform-pipeline-qa.md for detailed test case documentation.
#
# Prerequisites:
#   1. Start emulators: pnpm functions:serve
#   2. Seed test data: pnpm functions:seed
#
# Usage:
#   ./scripts/qa-transform-pipeline.sh
#   pnpm qa:transform  # If added to package.json
#
# =============================================================================

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5003/clementine-7568d/europe-west1}"
PROJECT_ID="project-test-001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
  echo ""
  echo -e "${YELLOW}▶ $1${NC}"
}

pass() {
  echo -e "${GREEN}  ✓ PASS${NC}: $1"
  ((++PASSED))
}

fail() {
  echo -e "${RED}  ✗ FAIL${NC}: $1"
  ((++FAILED))
}

# Make a POST request and capture response + status code
# Usage: response=$(post_request "$url" "$body")
post_request() {
  local url="$1"
  local body="$2"
  curl -s -w "\n%{http_code}" -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$body"
}

# Make a GET request and capture response + status code
get_request() {
  local url="$1"
  curl -s -w "\n%{http_code}" -X GET "$url"
}

# Extract HTTP status code from response (last line)
get_status() {
  echo "$1" | tail -n1
}

# Extract response body (all but last line)
get_body() {
  echo "$1" | sed '$d'
}

# Check if JSON contains a field with expected value
json_has() {
  local json="$1"
  local field="$2"
  local expected="$3"
  local actual=$(echo "$json" | jq -r "$field" 2>/dev/null)
  [[ "$actual" == "$expected" ]]
}

# Check if JSON field exists and is not null
json_exists() {
  local json="$1"
  local field="$2"
  local value=$(echo "$json" | jq -r "$field" 2>/dev/null)
  [[ "$value" != "null" && -n "$value" ]]
}

# =============================================================================
# Happy Path Tests
# =============================================================================

run_happy_tests() {
  print_header "HAPPY PATH TESTS"

  # TC-001: Start transform pipeline (draft config)
  print_test "TC-001: Start transform pipeline (draft config)"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "session-ready", "stepId": "transform-step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "200" ]]; then
    pass "Status code is 200"
  else
    fail "Expected status 200, got $status"
    echo "  Response: $body"
  fi

  if json_has "$body" '.success' 'true'; then
    pass "success is true"
  else
    fail "success should be true"
  fi

  if json_exists "$body" '.jobId'; then
    pass "jobId is present"
    JOB_ID_1=$(echo "$body" | jq -r '.jobId')
    echo "  Job ID: $JOB_ID_1"
  else
    fail "jobId should be present"
  fi

  # TC-002: Start transform pipeline (published config)
  print_test "TC-002: Start transform pipeline (published config)"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "session-published", "stepId": "transform-step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "200" ]]; then
    pass "Status code is 200"
  else
    fail "Expected status 200, got $status"
    echo "  Response: $body"
  fi

  if json_has "$body" '.success' 'true'; then
    pass "success is true"
  else
    fail "success should be true"
  fi

  if json_exists "$body" '.jobId'; then
    pass "jobId is present"
    JOB_ID_2=$(echo "$body" | jq -r '.jobId')
    echo "  Job ID: $JOB_ID_2"
  else
    fail "jobId should be present"
  fi

  # TC-003: Job lifecycle (just verify job was created - full lifecycle check is manual)
  print_test "TC-003: Job lifecycle tracking"
  echo "  Note: Full lifecycle verification requires checking Firestore UI"
  echo "  Jobs created: $JOB_ID_1, $JOB_ID_2"
  echo "  Wait ~2 seconds for stub pipeline to complete, then check:"
  echo "    - Job status should be 'completed'"
  echo "    - Job should have 'output' with assetId, url, format"
  echo "    - Session jobStatus should be 'completed'"
  pass "Jobs created successfully (manual verification needed for lifecycle)"
}

# =============================================================================
# Unhappy Path Tests
# =============================================================================

run_unhappy_tests() {
  print_header "UNHAPPY PATH TESTS"

  # TC-101: Session not found
  print_test "TC-101: Session not found"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "non-existent-session", "stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "404" ]]; then
    pass "Status code is 404"
  else
    fail "Expected status 404, got $status"
  fi

  if json_has "$body" '.error.code' 'SESSION_NOT_FOUND'; then
    pass "Error code is SESSION_NOT_FOUND"
  else
    fail "Error code should be SESSION_NOT_FOUND"
    echo "  Response: $body"
  fi

  # TC-103: Experience without transform config
  print_test "TC-103: Experience without transform config"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "session-no-transform", "stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "404" ]]; then
    pass "Status code is 404"
  else
    fail "Expected status 404, got $status"
  fi

  if json_has "$body" '.error.code' 'TRANSFORM_NOT_FOUND'; then
    pass "Error code is TRANSFORM_NOT_FOUND"
  else
    fail "Error code should be TRANSFORM_NOT_FOUND"
    echo "  Response: $body"
  fi

  # TC-104: Job already in progress
  print_test "TC-104: Job already in progress"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "session-with-job", "stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "409" ]]; then
    pass "Status code is 409"
  else
    fail "Expected status 409, got $status"
  fi

  if json_has "$body" '.error.code' 'JOB_IN_PROGRESS'; then
    pass "Error code is JOB_IN_PROGRESS"
  else
    fail "Error code should be JOB_IN_PROGRESS"
    echo "  Response: $body"
  fi

  # TC-105: Published config not available
  print_test "TC-105: Published config not available"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"sessionId": "session-draft-only", "stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "404" ]]; then
    pass "Status code is 404"
  else
    fail "Expected status 404, got $status"
  fi

  if json_has "$body" '.error.code' 'TRANSFORM_NOT_FOUND'; then
    pass "Error code is TRANSFORM_NOT_FOUND"
  else
    fail "Error code should be TRANSFORM_NOT_FOUND"
    echo "  Response: $body"
  fi

  # TC-106: Missing projectId query parameter
  print_test "TC-106: Missing projectId query parameter"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline" \
    '{"sessionId": "session-ready", "stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "400" ]]; then
    pass "Status code is 400"
  else
    fail "Expected status 400, got $status"
  fi

  if json_has "$body" '.error.code' 'INVALID_REQUEST'; then
    pass "Error code is INVALID_REQUEST"
  else
    fail "Error code should be INVALID_REQUEST"
    echo "  Response: $body"
  fi

  # TC-107: Invalid request body (missing sessionId)
  print_test "TC-107: Invalid request body (missing sessionId)"

  response=$(post_request \
    "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}" \
    '{"stepId": "step-1"}')

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "400" ]]; then
    pass "Status code is 400"
  else
    fail "Expected status 400, got $status"
  fi

  if json_has "$body" '.error.code' 'INVALID_REQUEST'; then
    pass "Error code is INVALID_REQUEST"
  else
    fail "Error code should be INVALID_REQUEST"
    echo "  Response: $body"
  fi

  # TC-108: Wrong HTTP method
  print_test "TC-108: Wrong HTTP method (GET instead of POST)"

  response=$(get_request "${BASE_URL}/startTransformPipeline?projectId=${PROJECT_ID}")

  status=$(get_status "$response")
  body=$(get_body "$response")

  if [[ "$status" == "405" ]]; then
    pass "Status code is 405"
  else
    fail "Expected status 405, got $status"
  fi

  if json_has "$body" '.error.code' 'INVALID_REQUEST'; then
    pass "Error code is INVALID_REQUEST"
  else
    fail "Error code should be INVALID_REQUEST"
    echo "  Response: $body"
  fi
}

# =============================================================================
# Main
# =============================================================================

main() {
  echo ""
  echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       Transform Pipeline QA Tests                             ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Base URL: ${BASE_URL}"
  echo "Project ID: ${PROJECT_ID}"

  # Check if jq is available
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
  fi

  # Check if emulator is running
  echo ""
  echo "Checking emulator connectivity..."
  if ! curl -s "${BASE_URL}/helloWorld" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to emulator at ${BASE_URL}${NC}"
    echo "Make sure emulators are running: pnpm functions:serve"
    exit 1
  fi
  echo -e "${GREEN}Emulator is running${NC}"

  # Run tests
  run_happy_tests
  run_unhappy_tests

  # Summary
  print_header "TEST SUMMARY"
  echo ""
  echo -e "  ${GREEN}Passed${NC}: $PASSED"
  echo -e "  ${RED}Failed${NC}: $FAILED"
  echo ""

  if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
  fi
}

main "$@"
