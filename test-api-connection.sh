#!/bin/bash

# WhizUnik Portal - API Connection Test Script
# Run this script to test your API configuration

echo "🔍 Testing WhizUnik Portal API Configuration..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="https://portal.whizunikhub.com"
FRONTEND_URL="https://whizunikhub.com"
LOCAL_API="http://localhost:80"

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo "URL: $url"
    
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" -H "Origin: $FRONTEND_URL" "$url")
    
    # Extract status code and response time
    status_code=$(echo "$response" | tail -n 2 | head -n 1)
    time_total=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -2)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - Status: $status_code, Time: ${time_total}s"
        if [ "$expected_status" = "200" ]; then
            echo "Response preview: $(echo "$body" | head -c 100)..."
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - Status: $status_code (Expected: $expected_status)"
        echo "Response: $body"
    fi
}

test_cors() {
    local url=$1
    local description=$2
    
    echo -e "\n${BLUE}Testing CORS:${NC} $description"
    echo "URL: $url"
    
    # Test preflight request
    response=$(curl -s -I -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        "$url")
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✅ CORS CONFIGURED${NC}"
        echo "CORS Headers found:"
        echo "$response" | grep "Access-Control" || echo "None found"
    else
        echo -e "${RED}❌ CORS NOT CONFIGURED${NC}"
        echo "Response headers:"
        echo "$response"
    fi
}

# Start tests
echo -e "${YELLOW}Starting API connectivity tests...${NC}"
echo "Frontend Origin: $FRONTEND_URL"
echo "API Base URL: $API_BASE"

# Test 1: Basic health check
test_endpoint "$API_BASE/health" "Backend Health Check"

# Test 2: API health check
test_endpoint "$API_BASE/api/health" "API Health Check"

# Test 3: CORS on health endpoint
test_cors "$API_BASE/api/health" "API Health Endpoint"

# Test 4: CORS on auth endpoint
test_cors "$API_BASE/api/auth/login" "Login Endpoint"

# Test 5: Invalid login attempt (should return 400/401, not 500)
echo -e "\n${BLUE}Testing:${NC} Login Endpoint with Invalid Credentials"
login_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"email":"test@test.com","password":"wrongpassword"}' \
    "$API_BASE/api/auth/login")

login_status=$(echo "$login_response" | tail -n 1)
login_body=$(echo "$login_response" | head -n -1)

if [ "$login_status" = "401" ] || [ "$login_status" = "400" ]; then
    echo -e "${GREEN}✅ LOGIN ENDPOINT WORKING${NC} - Status: $login_status"
    echo "Response: $(echo "$login_body" | head -c 100)..."
else
    echo -e "${RED}❌ LOGIN ENDPOINT ISSUE${NC} - Status: $login_status"
    echo "Response: $login_body"
fi

# Test 6: Local port accessibility
echo -e "\n${BLUE}Testing:${NC} Local Port 80 Access"
if curl -s --connect-timeout 5 "$LOCAL_API/health" > /dev/null; then
    echo -e "${GREEN}✅ LOCAL PORT 80 ACCESSIBLE${NC}"
else
    echo -e "${RED}❌ LOCAL PORT 80 NOT ACCESSIBLE${NC} - Backend may not be running"
fi

# Test 7: Original port check
echo -e "\n${BLUE}Testing:${NC} Port 5003 Direct Access (legacy)"
if curl -s --connect-timeout 5 "$API_BASE:5003/health" > /dev/null; then
    echo -e "${YELLOW}⚠️  PORT 5003 STILL ACCESSIBLE${NC} (Should migrate to port 80)"
else
    echo -e "${GREEN}✅ PORT 5003 NOT ACCESSIBLE${NC} (Correctly migrated to port 80)"
fi

# Test 7: SSL Certificate
echo -e "\n${BLUE}Testing:${NC} SSL Certificate"
ssl_info=$(curl -s -I "$API_BASE/health" | head -n 1)
if echo "$ssl_info" | grep -q "200"; then
    echo -e "${GREEN}✅ SSL WORKING${NC}"
else
    echo -e "${RED}❌ SSL ISSUE${NC}"
    echo "Response: $ssl_info"
fi

# Summary
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo "1. If health checks fail: Check if your backend is running"
echo "2. If CORS fails: Check CORS_ORIGIN in backend/.env.production"
echo "3. If login fails with 500: Check database connection"
echo "4. If SSL fails: Setup SSL certificate with certbot"

echo -e "\n${BLUE}Next steps if issues found:${NC}"
echo "• Check backend logs: pm2 logs whizunik-backend"
echo "• Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "• Verify environment: cat backend/.env.production"
echo "• Test directly: curl http://localhost:5003/health"

echo -e "\n${GREEN}Test completed!${NC}"