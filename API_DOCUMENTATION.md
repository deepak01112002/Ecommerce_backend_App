# Ghanshyam Murti Bhandar - Complete API Documentation

## Overview
This is a comprehensive ecommerce API for religious and spiritual products with advanced features including nested categories, product filtering, user management, orders, reviews, and more.

**Base URL:** `http://localhost:8080/api`

## Database Statistics
- **Categories:** 112 (7 main categories with 15 subcategories each)
- **Products:** 525+ products across all categories
- **Users:** 50 users (1 admin + 49 customers)
- **Reviews:** 200+ product reviews
- **Coupons:** 5 active discount coupons

---

## 🏷️ Categories API

### 1. Get All Categories (Flat Structure)
```http
GET /api/categories
```

**Query Parameters:**
- `include_products` (boolean): Include product count for each category
- `parent_only` (boolean): Return only main categories (level 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "category_id",
        "name": "Hindu Deities",
        "slug": "hindu-deities",
        "description": "Premium hindu deities for spiritual purposes",
        "image": "/images/categories/hindu-deities.jpg",
        "icon": "fas fa-om",
        "color": "#FF6B35",
        "level": 0,
        "path": "hindu-deities",
        "parent": null,
        "product_count": 75,
        "subcategories": [...],
        "is_featured": true,
        "sort_order": 1
      }
    ],
    "total": 112,
    "structure": "flat"
  },
  "message": "Categories retrieved successfully"
}
```

### 2. Get Category Tree (Hierarchical Structure)
```http
GET /api/categories/tree
```

**Query Parameters:**
- `featured` (boolean): Return only featured categories
- `includeProducts` (boolean): Include featured products for each category
- `maxDepth` (integer, 1-5): Maximum tree depth
- `minProductCount` (integer): Minimum products required per category

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "main_category_id",
        "name": "Hindu Deities",
        "slug": "hindu-deities",
        "description": "Premium hindu deities for spiritual purposes",
        "image": "/images/categories/hindu-deities.jpg",
        "icon": "fas fa-om",
        "color": "#FF6B35",
        "level": 0,
        "product_count": 75,
        "has_children": true,
        "children": [
          {
            "_id": "sub_category_id",
            "name": "Ganesha Murtis",
            "slug": "ganesha-murtis",
            "level": 1,
            "product_count": 25,
            "featured_products": [...] // If includeProducts=true
          }
        ]
      }
    ],
    "meta": {
      "total_categories": 112,
      "total_products": 525,
      "tree_depth": 2,
      "featured_only": false,
      "includes_products": false
    }
  },
  "message": "Category tree retrieved successfully"
}
```

### 3. Get Featured Categories
```http
GET /api/categories/featured?limit=6
```

### 4. Search Categories
```http
GET /api/categories/search?q=ganesha&limit=10
```

### 5. Get Category Breadcrumb
```http
GET /api/categories/breadcrumb/ganesha-murtis
```

---

## 🛍️ Products API

### 1. Get All Products (Advanced Filtering)
```http
GET /api/products
```

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 12): Products per page
- `category` (string): Category ID or slug
- `subcategory` (string): Subcategory ID or slug
- `search` (string): Text search query
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `rating` (number): Minimum rating filter
- `brand` (string): Brand filter
- `tags` (string/array): Tags filter
- `sort_by` (string): Sort field (price, rating, newest, popularity, etc.)
- `sort_order` (string): asc/desc
- `is_featured` (boolean): Featured products only
- `is_bestseller` (boolean): Bestseller products only
- `is_new_arrival` (boolean): New arrival products only
- `is_on_sale` (boolean): Discounted products only
- `in_stock` (boolean): In-stock products only
- `availability` (string): Availability status
- `include_variants` (boolean): Include product variants

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Brass Ganesha Murti - Premium Large",
        "slug": "brass-ganesha-murti-premium-large-1",
        "description": "Premium brass ganesha murti crafted from high-quality brass...",
        "short_description": "Premium brass ganesha murti in large size",
        "price": 1299,
        "original_price": 1599,
        "discount_percentage": 19,
        "discount_amount": 300,
        "images": ["/images/products/ganesha-murtis/brass-ganesha-murti-1.jpg"],
        "category": {
          "_id": "category_id",
          "name": "Ganesha Murtis",
          "slug": "ganesha-murtis",
          "path": "hindu-deities/ganesha-murtis"
        },
        "brand": "Divine Crafts",
        "rating": 4.5,
        "review_count": 23,
        "stock": 45,
        "min_order_quantity": 1,
        "max_order_quantity": 5,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_featured": true,
        "is_bestseller": true,
        "is_new_arrival": false,
        "is_favorite": false,
        "view_count": 1250,
        "sales_count": 89,
        "tags": ["ganesha", "brass", "large", "religious"],
        "variants": [...], // If include_variants=true
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 525,
      "total_pages": 44,
      "has_next_page": true,
      "has_prev_page": false
    },
    "filters": {
      "category": "ganesha-murtis",
      "search": null,
      "price_range": {"min": 500, "max": 5000},
      "sort_by": "newest",
      "features": {
        "featured": false,
        "bestseller": false,
        "new_arrival": false,
        "on_sale": false,
        "in_stock": true
      }
    },
    "meta": {
      "total_found": 525,
      "showing": 12,
      "search_query": null
    }
  },
  "message": "Products retrieved successfully"
}
```

### 2. Get Single Product
```http
GET /api/products/:id
```

### 3. Get Product Recommendations
```http
GET /api/products/:id/recommendations?type=related&limit=6
```

**Types:** `related`, `similar`, `frequently_bought`, `trending`

### 4. Get Product Filters for Category
```http
GET /api/products/filters?category=ganesha-murtis
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": {
      "price_range": {"min": 299, "max": 9999},
      "brands": ["Divine Crafts", "Sacred Arts", "Spiritual Creations"],
      "tags": ["ganesha", "brass", "marble", "handcrafted"],
      "ratings": [4, 4.5, 5],
      "sort_options": [
        {"value": "newest", "label": "Newest First"},
        {"value": "price_low_high", "label": "Price: Low to High"},
        {"value": "rating_high_low", "label": "Highest Rated"}
      ]
    },
    "category": "ganesha-murtis"
  }
}
```

### 5. Search Products
```http
GET /api/products/search?q=brass ganesha&page=1&limit=12
```

---

## 👥 Users API

### 1. Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91-9876543210"
}
```

### 2. Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+91-9876543210",
      "role": "user",
      "status": "active",
      "emailVerified": true,
      "loyaltyPoints": 150,
      "totalSpent": 5000,
      "orderCount": 3,
      "customerTier": "silver"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

### 3. Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### 4. Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

---

## 🛒 Cart API

### 1. Get User Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

### 2. Add Item to Cart
```http
POST /api/cart/add
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "variant": "Large"
}
```

### 3. Update Cart Item
```http
PUT /api/cart/update/:itemId
Authorization: Bearer <token>
```

### 4. Remove Cart Item
```http
DELETE /api/cart/remove/:itemId
Authorization: Bearer <token>
```

---

## 📦 Orders API

### 1. Create Order
```http
POST /api/orders
Authorization: Bearer <token>
```

### 2. Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

### 3. Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

---

## ⭐ Reviews API

### 1. Get Product Reviews
```http
GET /api/reviews/product/:productId
```

### 2. Add Product Review
```http
POST /api/reviews
Authorization: Bearer <token>
```

---

## 🎟️ Coupons API

### 1. Get Available Coupons
```http
GET /api/coupons
```

### 2. Validate Coupon
```http
POST /api/coupons/validate
```

**Request Body:**
```json
{
  "code": "WELCOME10",
  "orderAmount": 1500
}
```

---

## 💝 Wishlist API

### 1. Get User Wishlist
```http
GET /api/wishlist
Authorization: Bearer <token>
```

### 2. Add to Wishlist
```http
POST /api/wishlist/add
Authorization: Bearer <token>
```

### 3. Remove from Wishlist
```http
DELETE /api/wishlist/remove/:productId
Authorization: Bearer <token>
```

---

## 🔍 Search API

### 1. Global Search
```http
GET /api/search?q=ganesha&type=all
```

**Types:** `products`, `categories`, `all`

---

## 📊 Analytics API (Admin Only)

### 1. Get Dashboard Stats
```http
GET /api/admin/analytics/dashboard
Authorization: Bearer <admin_token>
```

### 2. Get Product Analytics
```http
GET /api/products/:id/analytics
Authorization: Bearer <admin_token>
```

---

## Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting
- General APIs: 100 requests per 15 minutes
- Auth APIs: 5 requests per 15 minutes per IP

## Pagination
All list endpoints support pagination with consistent format:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

## Sorting
Most list endpoints support sorting:
- `sort_by`: Field to sort by
- `sort_order`: `asc` or `desc`

## Filtering
Advanced filtering available on product and category endpoints with multiple filter combinations.
