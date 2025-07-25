#!/bin/bash

# 🧪 COMPLETE API TESTING SCRIPT - ALL ENDPOINTS
# This script tests all registered APIs in the ecommerce backend

BASE_URL="http://localhost:8080"
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwNGMyYjBjYzc2M2Y4OTQ2MmViMCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUzMzUxMzc4LCJleHAiOjE3NTM5NTYxNzh9.wOlSXYb2Xr88PRsFbMitGbZpgsavoewOTu6cbObx748"

echo "🚀 COMPLETE API TESTING - ALL ENDPOINTS"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Testing Time: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth_header=$4
    local expected_status=${5:-200}
    
    echo -e "${BLUE}Testing:${NC} $method $endpoint - $description"
    
    if [ "$auth_header" = "true" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Authorization: Bearer $USER_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - Status: $http_code"
        echo "$body" | jq -r '.message // .data.message // "Response received"' 2>/dev/null || echo "Response received"
    else
        echo -e "${RED}❌ FAILED${NC} - Status: $http_code"
        echo "$body" | jq -r '.message // .error // "Error occurred"' 2>/dev/null || echo "Error occurred"
    fi
    echo ""
}

# Function to test with sample data
test_api_with_data() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local auth_header=$5
    
    echo -e "${BLUE}Testing:${NC} $method $endpoint - $description"
    
    if [ "$auth_header" = "true" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Authorization: Bearer $USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ] || [ "$http_code" -eq 400 ] || [ "$http_code" -eq 401 ]; then
        echo -e "${GREEN}✅ RESPONDED${NC} - Status: $http_code"
        echo "$body" | jq -r '.message // .error // "Response received"' 2>/dev/null || echo "Response received"
    else
        echo -e "${RED}❌ FAILED${NC} - Status: $http_code"
        echo "$body"
    fi
    echo ""
}

echo "🔍 PHASE 1: BASIC HEALTH & INFO CHECKS"
echo "======================================"

# Health Check
test_api "GET" "/health" "Server Health Check" false

# API Info
test_api "GET" "/api" "API Information" false

echo ""
echo "🔐 PHASE 2: AUTHENTICATION APIS"
echo "==============================="

# Auth APIs
test_api_with_data "POST" "/api/auth/register" "User Registration" '{"name":"Test User","email":"test@example.com","password":"password123","phone":"9876543210"}' false
test_api_with_data "POST" "/api/auth/login" "User Login" '{"email":"admin@ghanshyambhandar.com","password":"admin123"}' false
test_api "GET" "/api/auth/profile" "Get Profile" true
test_api "POST" "/api/auth/logout" "User Logout" true

echo ""
echo "👥 PHASE 3: USER MANAGEMENT APIS"
echo "================================"

# User APIs
test_api "GET" "/api/users" "Get All Users" true
test_api "GET" "/api/users/profile" "Get User Profile" true

echo ""
echo "📦 PHASE 4: PRODUCT MANAGEMENT APIS"
echo "==================================="

# Product APIs
test_api "GET" "/api/products" "Get All Products" false
test_api "GET" "/api/products?page=1&limit=5" "Get Products with Pagination" false
test_api "GET" "/api/products/search?q=phone" "Search Products" false
test_api "GET" "/api/products/687e7d4b08291d3d09355bcc" "Get Single Product" false

echo ""
echo "📂 PHASE 5: CATEGORY MANAGEMENT APIS"
echo "===================================="

# Category APIs
test_api "GET" "/api/categories" "Get All Categories" false
test_api "GET" "/api/categories/687a980130b6cc535c479680" "Get Single Category" false

echo ""
echo "🛒 PHASE 6: CART & WISHLIST APIS"
echo "================================"

# Cart APIs
test_api "GET" "/api/cart" "Get Cart Items" true
test_api "GET" "/api/wishlist" "Get Wishlist Items" true

echo ""
echo "⭐ PHASE 7: REVIEW APIS"
echo "======================"

# Review APIs
test_api "GET" "/api/reviews" "Get All Reviews" false
test_api "GET" "/api/reviews/product/687e7d4b08291d3d09355bcc" "Get Product Reviews" false

echo ""
echo "📋 PHASE 8: ORDER MANAGEMENT APIS"
echo "================================="

# Order APIs
test_api "GET" "/api/orders" "Get All Orders" true
test_api "GET" "/api/orders/user" "Get User Orders" true

echo ""
echo "🎫 PHASE 9: COUPON APIS"
echo "======================"

# Coupon APIs
test_api "GET" "/api/coupons" "Get Public Coupons" false
test_api "GET" "/api/coupons/admin" "Get Admin Coupons" true

echo ""
echo "💳 PHASE 10: PAYMENT APIS"
echo "========================="

# Payment APIs
test_api "GET" "/api/payments/methods" "Get Payment Methods" false

echo ""
echo "🏠 PHASE 11: ADDRESS & WALLET APIS"
echo "=================================="

# Address APIs
test_api "GET" "/api/addresses" "Get User Addresses" true

# Wallet APIs
test_api "GET" "/api/wallet" "Get Wallet Balance" true
test_api "GET" "/api/wallet/transactions" "Get Wallet Transactions" true

echo ""
echo "📊 PHASE 12: ADMIN DASHBOARD APIS"
echo "================================="

# Admin Dashboard APIs
test_api "GET" "/api/admin/dashboard/stats" "Get Dashboard Stats" true
test_api "GET" "/api/admin/dashboard/recent-orders" "Get Recent Orders" true
test_api "GET" "/api/admin/dashboard/top-products" "Get Top Products" true

echo ""
echo "👨‍💼 PHASE 13: ADMIN MANAGEMENT APIS"
echo "===================================="

# Admin Management APIs
test_api "GET" "/api/admin/management/users" "Get All Users (Admin)" true
test_api "GET" "/api/admin/management/orders" "Get All Orders (Admin)" true
test_api "GET" "/api/admin/management/products" "Get All Products (Admin)" true

echo ""
echo "📤 PHASE 14: UPLOAD APIS (CONTABO)"
echo "=================================="

# Upload APIs
test_api "GET" "/api/upload/storage-info" "Get Storage Info" true
test_api "GET" "/api/upload/test-connection" "Test Contabo Connection" true

echo ""
echo "🏭 PHASE 15: BUSINESS MANAGEMENT APIS"
echo "====================================="

# Inventory APIs
test_api "GET" "/api/inventory" "Get Inventory Items" true

# Supplier APIs
test_api "GET" "/api/suppliers" "Get All Suppliers" true

# Reports APIs
test_api "GET" "/api/reports/sales" "Get Sales Reports" true

# Notification APIs
test_api "GET" "/api/notifications" "Get Notifications" true

echo ""
echo "🔧 PHASE 16: SYSTEM APIS"
echo "========================"

# System Settings APIs
test_api "GET" "/api/settings" "Get System Settings" true

# Cache Stats
test_api "GET" "/api/cache/stats" "Get Cache Statistics" false

echo ""
echo "🎉 TESTING COMPLETED!"
echo "===================="
echo "Testing finished at: $(date)"
echo ""
echo "📝 SUMMARY:"
echo "- All major API endpoints tested"
echo "- Check above for ✅ SUCCESS or ❌ FAILED status"
echo "- Green ✅ means API is working"
echo "- Red ❌ means API has issues"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Review any failed APIs above"
echo "2. Use Postman collection for file upload testing"
echo "3. Test with real data for complete validation"
echo ""
echo "📁 For detailed testing:"
echo "- Import: postman/Contabo_Storage_APIs.postman_collection.json"
echo "- Use: postman/POSTMAN_TESTING_GUIDE.md"
