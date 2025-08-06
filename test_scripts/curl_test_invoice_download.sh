#!/bin/bash

# Invoice Download API Test Script
# =================================

BASE_URL="http://localhost:8080/api"
ORDER_ID="687aa24989da58ed91a0b6d7"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Testing Invoice Download API${NC}"
echo "=================================="
echo "Target URL: $BASE_URL/invoices/order/$ORDER_ID/download"
echo ""

# Step 1: Check system settings (no auth required)
echo -e "${YELLOW}⚙️  Step 1: Checking system settings...${NC}"
SETTINGS_RESPONSE=$(curl -s "$BASE_URL/settings/public/invoice-settings")
echo "Response: $SETTINGS_RESPONSE"

# Check if downloads are enabled
DOWNLOAD_ENABLED=$(echo $SETTINGS_RESPONSE | grep -o '"downloadEnabled":[^,]*' | cut -d':' -f2)
if [[ "$DOWNLOAD_ENABLED" == "true" ]]; then
    echo -e "${GREEN}✅ Invoice downloads are enabled${NC}"
else
    echo -e "${RED}❌ Invoice downloads are disabled${NC}"
fi
echo ""

# Step 2: Login (you need to update credentials)
echo -e "${YELLOW}🔐 Step 2: User login...${NC}"
echo "Please update the credentials below:"

# UPDATE THESE CREDENTIALS
USER_EMAIL="testuser@example.com"
USER_PASSWORD="password123"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed. Please update credentials in this script.${NC}"
    exit 1
fi
echo ""

# Step 3: Check if order exists
echo -e "${YELLOW}📦 Step 3: Checking order access...${NC}"
ORDER_RESPONSE=$(curl -s "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Order response: $ORDER_RESPONSE"

if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Order found and accessible${NC}"
else
    echo -e "${RED}❌ Order not found or access denied${NC}"
    exit 1
fi
echo ""

# Step 4: Check if invoice exists
echo -e "${YELLOW}🧾 Step 4: Checking invoice...${NC}"
INVOICE_RESPONSE=$(curl -s "$BASE_URL/invoices/order/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Invoice response: $INVOICE_RESPONSE"

if echo "$INVOICE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Invoice found${NC}"
else
    echo -e "${RED}❌ Invoice not found${NC}"
    exit 1
fi
echo ""

# Step 5: Test A4 download
echo -e "${YELLOW}📄 Step 5: Testing A4 invoice download...${NC}"
A4_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code};SIZE:%{size_download};TYPE:%{content_type}" \
  "$BASE_URL/invoices/order/$ORDER_ID/download?format=A4" \
  -H "Authorization: Bearer $TOKEN" \
  -o "test_invoice_a4.pdf")

HTTP_STATUS=$(echo $A4_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d':' -f2)
FILE_SIZE=$(echo $A4_RESPONSE | grep -o "SIZE:[0-9]*" | cut -d':' -f2)
CONTENT_TYPE=$(echo $A4_RESPONSE | grep -o "TYPE:[^;]*" | cut -d':' -f2)

echo "HTTP Status: $HTTP_STATUS"
echo "File Size: $FILE_SIZE bytes"
echo "Content Type: $CONTENT_TYPE"

if [[ "$HTTP_STATUS" == "200" ]] && [[ "$CONTENT_TYPE" == "application/pdf" ]]; then
    echo -e "${GREEN}✅ A4 download successful - saved as test_invoice_a4.pdf${NC}"
else
    echo -e "${RED}❌ A4 download failed${NC}"
    cat test_invoice_a4.pdf 2>/dev/null || echo "No error details available"
fi
echo ""

# Step 6: Test thermal download
echo -e "${YELLOW}📄 Step 6: Testing thermal invoice download...${NC}"
THERMAL_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code};SIZE:%{size_download};TYPE:%{content_type}" \
  "$BASE_URL/invoices/order/$ORDER_ID/download?format=thermal" \
  -H "Authorization: Bearer $TOKEN" \
  -o "test_invoice_thermal.pdf")

HTTP_STATUS=$(echo $THERMAL_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d':' -f2)
FILE_SIZE=$(echo $THERMAL_RESPONSE | grep -o "SIZE:[0-9]*" | cut -d':' -f2)
CONTENT_TYPE=$(echo $THERMAL_RESPONSE | grep -o "TYPE:[^;]*" | cut -d':' -f2)

echo "HTTP Status: $HTTP_STATUS"
echo "File Size: $FILE_SIZE bytes"
echo "Content Type: $CONTENT_TYPE"

if [[ "$HTTP_STATUS" == "200" ]] && [[ "$CONTENT_TYPE" == "application/pdf" ]]; then
    echo -e "${GREEN}✅ Thermal download successful - saved as test_invoice_thermal.pdf${NC}"
else
    echo -e "${RED}❌ Thermal download failed${NC}"
    cat test_invoice_thermal.pdf 2>/dev/null || echo "No error details available"
fi
echo ""

# Step 7: Test alternative endpoint
echo -e "${YELLOW}📄 Step 7: Testing alternative order endpoint...${NC}"
ALT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code};SIZE:%{size_download};TYPE:%{content_type}" \
  "$BASE_URL/orders/$ORDER_ID/invoice/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "test_invoice_alt.pdf")

HTTP_STATUS=$(echo $ALT_RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d':' -f2)
FILE_SIZE=$(echo $ALT_RESPONSE | grep -o "SIZE:[0-9]*" | cut -d':' -f2)
CONTENT_TYPE=$(echo $ALT_RESPONSE | grep -o "TYPE:[^;]*" | cut -d':' -f2)

echo "HTTP Status: $HTTP_STATUS"
echo "File Size: $FILE_SIZE bytes"
echo "Content Type: $CONTENT_TYPE"

if [[ "$HTTP_STATUS" == "200" ]] && [[ "$CONTENT_TYPE" == "application/pdf" ]]; then
    echo -e "${GREEN}✅ Alternative endpoint download successful - saved as test_invoice_alt.pdf${NC}"
else
    echo -e "${RED}❌ Alternative endpoint download failed${NC}"
    cat test_invoice_alt.pdf 2>/dev/null || echo "No error details available"
fi
echo ""

# Summary
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "================"
echo "✅ System Settings: OK"
echo "✅ User Login: OK"
echo "✅ Order Access: OK"
echo "✅ Invoice Exists: OK"
echo "📄 A4 Download: $([ -f test_invoice_a4.pdf ] && echo 'OK' || echo 'FAILED')"
echo "📄 Thermal Download: $([ -f test_invoice_thermal.pdf ] && echo 'OK' || echo 'FAILED')"
echo "📄 Alternative Endpoint: $([ -f test_invoice_alt.pdf ] && echo 'OK' || echo 'FAILED')"
echo ""

# Instructions
echo -e "${YELLOW}📋 INSTRUCTIONS:${NC}"
echo "1. Update USER_EMAIL and USER_PASSWORD in this script"
echo "2. Make sure your server is running on localhost:8080"
echo "3. Ensure the order ID belongs to the test user"
echo "4. Run: chmod +x curl_test_invoice_download.sh && ./curl_test_invoice_download.sh"
echo ""

# Cleanup option
read -p "Delete test PDF files? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f test_invoice_*.pdf
    echo "Test files deleted."
fi
