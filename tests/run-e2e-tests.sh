#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII art banner for visual impact
echo -e "${BLUE}"
echo "================================================================"
echo "                 DELIVERY APP END-TO-END TESTS                   "
echo "================================================================"
echo -e "${NC}"

# Set test environment variables
echo -e "${YELLOW}Setting up test environment...${NC}"
export NODE_ENV=test
export JWT_SECRET=test-secret
export JWT_EXPIRES_IN=1h
export PORT=3001
export TEST_MODE=e2e

# Generate a timestamp for log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="tests/logs"
LOG_FILE="${LOG_DIR}/e2e_tests_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to clean up before exit
function cleanup {
  echo -e "\n${YELLOW}Cleaning up test environment...${NC}"
  # Add any cleanup tasks here if needed
}

# Register the cleanup function on script exit
trap cleanup EXIT

# Print test information
echo -e "${BLUE}Test Information:${NC}"
echo -e "Date/Time: $(date)"
echo -e "Environment: ${NODE_ENV}"
echo -e "Log File: ${LOG_FILE}"
echo -e "${YELLOW}Starting end-to-end tests...${NC}\n"

# Run the tests using npm script and capture output
echo -e "${BLUE}Running end-to-end tests...${NC}"
(npm test -- tests/simplified-e2e.test.js --detectOpenHandles | tee "$LOG_FILE") || true

# Check the test result
TEST_RESULT=${PIPESTATUS[0]}
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}✅ End-to-end tests passed successfully!${NC}"
  echo -e "${BLUE}A full test log is available at:${NC} $LOG_FILE"
else
  echo -e "\n${RED}❌ End-to-end tests failed with exit code $TEST_RESULT.${NC}"
  echo -e "${YELLOW}Please check the log file for details:${NC} $LOG_FILE"
  
  # Extract failed tests from the log file
  echo -e "\n${RED}Failed tests:${NC}"
  grep -E "FAIL|Error:" "$LOG_FILE" | tail -10
fi

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}                 END-TO-END TESTS COMPLETE                      ${NC}"
echo -e "${BLUE}================================================================${NC}"

# Return the test result
exit $TEST_RESULT 