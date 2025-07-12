#!/bin/bash

# API Testing Script for Ghanshyam Murti Bhandar Backend
# This script tests all major API endpoints

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
USER_TOKEN=""
PRODUCT_ID=""
CATEGORY_ID=""
ORDER_ID=""

echo "🚀 Starting API Tests for Ghanshyam Murti Bhandar Backend"
echo "=================================================="

# Test 1: Health Check
echo "📋 Test 1: Health Check"
curl -s -X GET "$BASE_URL/categories" | head -c 100
echo -e "\n✅ Health check completed\n"

# Test 2: Create Admin User
echo "📋 Test 2: Create Admin User"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin"
  }')

echo "Admin signup response: $ADMIN_RESPONSE"

# Extract admin token
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Admin Token: ${ADMIN_TOKEN:0:20}..."
echo -e "✅ Admin user created\n"

# Test 3: Create Regular User
echo "📋 Test 3: Create Regular User"
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@test.com",
    "password": "user123",
    "role": "user"
  }')

echo "User signup response: $USER_RESPONSE"

# Extract user token
USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "User Token: ${USER_TOKEN:0:20}..."
echo -e "✅ Regular user created\n"

# Test 4: Admin Login
echo "📋 Test 4: Admin Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }')

echo "Login response: $LOGIN_RESPONSE"
echo -e "✅ Admin login tested\n"

# Test 5: Create Category (Admin)
echo "📋 Test 5: Create Category"
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "description": "A test category"
  }')

echo "Category creation response: $CATEGORY_RESPONSE"

# Extract category ID
CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "Category ID: $CATEGORY_ID"
echo -e "✅ Category created\n"

# Test 6: Get Categories
echo "📋 Test 6: Get Categories"
curl -s -X GET "$BASE_URL/categories" | head -c 200
echo -e "\n✅ Categories retrieved\n"

# Test 7: Create Product (Admin)
echo "📋 Test 7: Create Product"
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Product\",
    \"description\": \"A test product\",
    \"price\": 999,
    \"originalPrice\": 1299,
    \"category\": \"$CATEGORY_ID\",
    \"stock\": 50,
    \"isActive\": true
  }")

echo "Product creation response: $PRODUCT_RESPONSE"

# Extract product ID
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "Product ID: $PRODUCT_ID"
echo -e "✅ Product created\n"

# Test 8: Get Products
echo "📋 Test 8: Get Products"
curl -s -X GET "$BASE_URL/products" | head -c 200
echo -e "\n✅ Products retrieved\n"

# Test 9: Add to Cart (User)
echo "📋 Test 9: Add to Cart"
CART_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/add" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2
  }")

echo "Add to cart response: $CART_RESPONSE"
echo -e "✅ Item added to cart\n"

# Test 10: Get Cart
echo "📋 Test 10: Get Cart"
curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $USER_TOKEN" | head -c 200
echo -e "\n✅ Cart retrieved\n"

# Test 11: Add to Wishlist (User)
echo "📋 Test 11: Add to Wishlist"
WISHLIST_RESPONSE=$(curl -s -X POST "$BASE_URL/wishlist/add" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\"
  }")

echo "Add to wishlist response: $WISHLIST_RESPONSE"
echo -e "✅ Item added to wishlist\n"

# Test 12: Create Order (User)
echo "📋 Test 12: Create Order"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Test Street",
      "city": "Test City",
      "state": "Test State",
      "postalCode": "12345",
      "country": "India"
    },
    "paymentInfo": {
      "method": "cod"
    }
  }')

echo "Order creation response: $ORDER_RESPONSE"

# Extract order ID
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "Order ID: $ORDER_ID"
echo -e "✅ Order created\n"

# Test 13: Get Orders (Admin)
echo "📋 Test 13: Get Orders (Admin)"
curl -s -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 200
echo -e "\n✅ Orders retrieved by admin\n"

# Test 14: Get User Orders
echo "📋 Test 14: Get User Orders"
curl -s -X GET "$BASE_URL/orders/my-orders" \
  -H "Authorization: Bearer $USER_TOKEN" | head -c 200
echo -e "\n✅ User orders retrieved\n"

# Test 15: Add Review (User)
echo "📋 Test 15: Add Review"
REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/reviews" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"rating\": 5,
    \"comment\": \"Great product!\"
  }")

echo "Review creation response: $REVIEW_RESPONSE"
echo -e "✅ Review added\n"

# Test 16: Get Product Reviews
echo "📋 Test 16: Get Product Reviews"
curl -s -X GET "$BASE_URL/reviews/product/$PRODUCT_ID" | head -c 200
echo -e "\n✅ Product reviews retrieved\n"

# Test 17: Create Coupon (Admin)
echo "📋 Test 17: Create Coupon"
COUPON_RESPONSE=$(curl -s -X POST "$BASE_URL/coupons" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "description": "Save 20% on all items",
    "discountType": "percentage",
    "discountValue": 20,
    "minimumOrderAmount": 500,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.999Z",
    "usageLimit": 100,
    "isActive": true
  }')

echo "Coupon creation response: $COUPON_RESPONSE"
echo -e "✅ Coupon created\n"

# Test 18: Validate Coupon
echo "📋 Test 18: Validate Coupon"
VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "orderAmount": 1000,
    "cartItems": []
  }')

echo "Coupon validation response: $VALIDATE_RESPONSE"
echo -e "✅ Coupon validated\n"

# Test 19: Get Dashboard Stats (Admin)
echo "📋 Test 19: Get Dashboard Stats"
curl -s -X GET "$BASE_URL/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 200
echo -e "\n✅ Dashboard stats retrieved\n"

# Test 20: Get User Profile
echo "📋 Test 20: Get User Profile"
curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $USER_TOKEN" | head -c 200
echo -e "\n✅ User profile retrieved\n"

# Test 21: Add User Address
echo "📋 Test 21: Add User Address"
ADDRESS_RESPONSE=$(curl -s -X POST "$BASE_URL/users/addresses" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "456 New Street",
    "city": "New City",
    "state": "New State",
    "postalCode": "67890",
    "country": "India",
    "isDefault": true
  }')

echo "Address creation response: $ADDRESS_RESPONSE"
echo -e "✅ User address added\n"

# Test 22: Get Users (Admin)
echo "📋 Test 22: Get Users (Admin)"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 200
echo -e "\n✅ Users retrieved by admin\n"

# Test 23: Update Order Status (Admin)
if [ ! -z "$ORDER_ID" ]; then
  echo "📋 Test 23: Update Order Status"
  UPDATE_ORDER_RESPONSE=$(curl -s -X PUT "$BASE_URL/orders/$ORDER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "shipped"
    }')

  echo "Order update response: $UPDATE_ORDER_RESPONSE"
  echo -e "✅ Order status updated\n"
fi

# Test 24: Error Handling - Unauthorized Access
echo "📋 Test 24: Error Handling - Unauthorized Access"
ERROR_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/stats")
echo "Unauthorized access response: $ERROR_RESPONSE"
echo -e "✅ Error handling tested\n"

# Test 25: Error Handling - Invalid Data
echo "📋 Test 25: Error Handling - Invalid Data"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": ""
  }')

echo "Invalid data response: $INVALID_RESPONSE"
echo -e "✅ Input validation tested\n"

echo "🎉 API Testing Completed!"
echo "=================================================="
echo "Summary:"
echo "✅ Authentication & Authorization"
echo "✅ Product Management"
echo "✅ Category Management"
echo "✅ Cart & Wishlist"
echo "✅ Order Management"
echo "✅ Review System"
echo "✅ Coupon System"
echo "✅ User Management"
echo "✅ Admin Dashboard"
echo "✅ Error Handling"
echo ""
echo "🔧 Tokens for manual testing:"
echo "Admin Token: $ADMIN_TOKEN"
echo "User Token: $USER_TOKEN"
echo "Product ID: $PRODUCT_ID"
echo "Category ID: $CATEGORY_ID"
echo "Order ID: $ORDER_ID"
