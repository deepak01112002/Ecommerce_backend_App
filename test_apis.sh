#!/bin/bash

# 🧪 Quick API Testing Script for Contabo Storage APIs
# Run this script to quickly test all major endpoints

BASE_URL="http://localhost:8080"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2JkOTdkMzU0ODQ3NDk0NmRkOWY2YyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzEyNDExNywiZXhwIjoxNzUzNzI4OTE3fQ.6RiSm_fw_XV9VmTZoQam4IDVPhBJCBFDvNlFi35ok8o"

echo "🚀 Testing Contabo Storage APIs..."
echo "=================================="

# Test 1: Server Health
echo "1. Testing Server Health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Storage Info
echo "2. Testing Storage Info..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/upload/storage-info" | jq '.'
echo ""

# Test 3: Connection Test
echo "3. Testing Contabo Connection..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/upload/test-connection" | jq '.'
echo ""

# Test 4: Get Products
echo "4. Testing Get Products..."
curl -s "$BASE_URL/api/products?limit=5" | jq '.data.products[0] | {_id, name, images}'
echo ""

# Test 5: Get Categories
echo "5. Testing Get Categories..."
curl -s "$BASE_URL/api/categories" | jq '.data[0] | {_id, name, image}'
echo ""

# Test 6: Admin Dashboard Stats
echo "6. Testing Admin Dashboard..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/admin/dashboard/stats" | jq '.data'
echo ""

echo "✅ Basic API tests completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Import Postman collection for file upload testing"
echo "2. Test image uploads with actual files"
echo "3. Verify Contabo URLs in responses"
echo ""
echo "📁 Postman Files:"
echo "- Collection: postman/Contabo_Storage_APIs.postman_collection.json"
echo "- Environment: postman/Contabo_Environment.postman_environment.json"
echo "- Guide: postman/POSTMAN_TESTING_GUIDE.md"
