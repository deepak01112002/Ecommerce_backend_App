# 🚀 **COMPLETE API DOCUMENTATION**
## Ghanshyam Murti Bhandar - Ecommerce Platform

**Base URL:** `http://localhost:8080/api`  
**Version:** 1.0  
**Last Updated:** July 18, 2025

---

## 📋 **Table of Contents**
1. [Authentication APIs](#authentication-apis)
2. [Categories APIs](#categories-apis)
3. [Products APIs](#products-apis)
4. [Cart APIs](#cart-apis)
5. [Orders APIs](#orders-apis)
6. [Reviews APIs](#reviews-apis)
7. [Coupons APIs](#coupons-apis)
8. [Wishlist APIs](#wishlist-apis)
9. [Users APIs](#users-apis)
10. [Error Handling](#error-handling)

---

## 🔐 **Authentication APIs**

### **1. Register User**
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
  "phone": "9876543210"
}
```

**Response (201):**
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
      "phone": "9876543210",
      "role": "user",
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2025-07-18T19:30:00.000Z"
    },
    "token": "jwt_token_here",
    "expires_in": "7d"
  },
  "message": "User registered successfully"
}
```

### **2. Login User**
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

**Response (200):**
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
      "phone": "9876543210",
      "role": "user",
      "loyaltyPoints": 0,
      "totalSpent": 0,
      "orderCount": 0,
      "customerTier": "bronze",
      "lastLogin": "2025-07-18T19:30:00.000Z"
    },
    "token": "jwt_token_here",
    "expires_in": "7d"
  },
  "message": "Login successful"
}
```

---

## 📂 **Categories APIs**

### **1. Get All Categories**
```http
GET /api/categories
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50)
- `parent` (string): Parent category ID
- `level` (integer): Category level (0 for main categories)

**Response (200):**
```json
{
  "success": true,
  "data": [
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
      "isActive": true,
      "isFeatured": true,
      "sortOrder": 1,
      "createdAt": "2025-07-18T18:53:00.000Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

### **2. Get Category Tree (Hierarchical)**
```http
GET /api/categories/tree
```

**Query Parameters:**
- `maxDepth` (integer): Maximum tree depth (default: 3)
- `featured` (boolean): Only featured categories
- `includeProducts` (boolean): Include featured products

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "main_category_id",
        "name": "Hindu Deities",
        "slug": "hindu-deities",
        "level": 0,
        "hasChildren": true,
        "subcategories": [
          {
            "_id": "sub_category_id",
            "name": "Ganesha Murtis",
            "slug": "ganesha-murtis",
            "level": 1,
            "productCount": 25
          }
        ]
      }
    ]
  },
  "message": "Category tree retrieved successfully"
}
```

---

## 🛍️ **Products APIs**

### **1. Get All Products (Advanced Filtering)**
```http
GET /api/products
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 12)
- `category` (string): Category ID or slug
- `search` (string): Search query
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `rating` (number): Minimum rating
- `sortBy` (string): Sort field (price, rating, newest, etc.)
- `sortOrder` (string): asc/desc
- `featured` (boolean): Featured products only
- `inStock` (boolean): In-stock products only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Brass Ganesha Murti - Premium Large",
        "slug": "brass-ganesha-murti-premium-large",
        "description": "Premium brass ganesha murti...",
        "price": 1299,
        "originalPrice": 1599,
        "discountPercentage": 19,
        "images": ["/images/products/ganesha-1.jpg"],
        "category": {
          "_id": "category_id",
          "name": "Ganesha Murtis",
          "slug": "ganesha-murtis"
        },
        "brand": "Divine Crafts",
        "rating": 4.5,
        "reviewCount": 23,
        "stock": 45,
        "isActive": true,
        "isFeatured": true,
        "tags": ["ganesha", "brass", "large"],
        "createdAt": "2025-07-18T18:53:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 44,
      "total": 525,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Products retrieved successfully"
}
```

### **2. Get Single Product**
```http
GET /api/products/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "product_id",
      "name": "Brass Ganesha Murti - Premium Large",
      "description": "Detailed product description...",
      "price": 1299,
      "originalPrice": 1599,
      "discountPercentage": 19,
      "images": ["/images/products/ganesha-1.jpg"],
      "category": {
        "_id": "category_id",
        "name": "Ganesha Murtis",
        "slug": "ganesha-murtis"
      },
      "rating": 4.5,
      "reviewCount": 23,
      "stock": 45,
      "variants": [
        {
          "name": "Size",
          "value": "Large",
          "price": 1299,
          "stock": 45
        }
      ],
      "specifications": {
        "material": "Brass",
        "height": "12 inches",
        "weight": "2.5 kg"
      },
      "relatedProducts": [...]
    }
  },
  "message": "Product details retrieved successfully"
}
```

---

## 🛒 **Cart APIs**

### **1. Get User Cart**
```http
GET /api/cart
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "cart_id",
      "items": [
        {
          "_id": "item_id",
          "product": {
            "_id": "product_id",
            "name": "Brass Ganesha Murti",
            "price": 1299,
            "image": "/images/products/ganesha-1.jpg"
          },
          "quantity": 2,
          "variant": "Large",
          "totalPrice": 2598
        }
      ],
      "summary": {
        "totalItems": 2,
        "subtotal": 2598,
        "tax": 467.64,
        "shipping": 0,
        "total": 3065.64
      }
    }
  },
  "message": "Cart retrieved successfully"
}
```

### **2. Add Item to Cart**
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

**Response (200):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "_id": "cart_id",
    "items": [...],
    "updatedAt": "2025-07-18T19:30:00.000Z"
  }
}
```

### **3. Update Cart Item**
```http
PUT /api/cart/update/:itemId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### **4. Remove Cart Item**
```http
DELETE /api/cart/remove/:itemId
Authorization: Bearer <token>
```

---

## 📦 **Orders APIs**

### **1. Create Order**
```http
POST /api/orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "phone": "9876543210"
  },
  "paymentInfo": {
    "method": "cod"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD2507190001",
      "status": "pending",
      "items": [
        {
          "product": "product_id",
          "quantity": 2,
          "unitPrice": 1299,
          "totalPrice": 2598
        }
      ],
      "pricing": {
        "subtotal": 2598,
        "tax": 467.64,
        "shipping": 0,
        "total": 3065.64
      },
      "shippingAddress": {...},
      "paymentInfo": {
        "method": "cod",
        "status": "pending"
      },
      "createdAt": "2025-07-18T19:30:00.000Z"
    }
  },
  "message": "Order created successfully"
}
```

### **2. Get User Orders**
```http
GET /api/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Order status filter

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD2507190001",
        "status": "pending",
        "totalItems": 2,
        "pricing": {
          "total": 3065.64
        },
        "paymentInfo": {
          "method": "cod",
          "status": "pending"
        },
        "createdAt": "2025-07-18T19:30:00.000Z",
        "items": [...]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "total": 1
    }
  },
  "message": "Orders retrieved successfully"
}
```

---

## ⭐ **Reviews APIs**

### **1. Get Product Reviews**
```http
GET /api/reviews/product/:productId
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "review_id",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "rating": 5,
      "comment": "Excellent product! Very satisfied.",
      "isVerifiedPurchase": true,
      "createdAt": "2025-07-18T19:30:00.000Z"
    }
  ],
  "message": "Reviews retrieved successfully"
}
```

### **2. Add Product Review**
```http
POST /api/reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "product_id",
  "rating": 5,
  "comment": "Excellent product! Very satisfied."
}
```

---

## 🎟️ **Coupons APIs**

### **1. Get Available Coupons**
```http
GET /api/coupons
```

### **2. Validate Coupon**
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

## 💝 **Wishlist APIs**

### **1. Get User Wishlist**
```http
GET /api/wishlist
Authorization: Bearer <token>
```

### **2. Add to Wishlist**
```http
POST /api/wishlist/add
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "product_id"
}
```

### **3. Remove from Wishlist**
```http
DELETE /api/wishlist/remove/:productId
Authorization: Bearer <token>
```

---

## 👥 **Users APIs**

### **1. Get User Profile**
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### **2. Update User Profile**
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

---

## ❌ **Error Handling**

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "meta": {
    "timestamp": "2025-07-18T19:30:00.000Z",
    "request_id": "unique_request_id"
  }
}
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## 🔑 **Authentication**

Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Token expires in 7 days. Refresh by logging in again.

---

## 📊 **Database Statistics**
- **Categories:** 112 (7 main + 105 subcategories)
- **Products:** 525+ with full specifications
- **Users:** 50+ registered users
- **Reviews:** 200+ product reviews
- **Coupons:** 5 active discount codes

---

## ✅ **All APIs Tested & Working**
- ✅ Authentication (Register/Login)
- ✅ Categories (List/Tree/Search)
- ✅ Products (List/Details/Filter/Search)
- ✅ Cart (Add/Update/Remove/Get)
- ✅ Orders (Create/List/Details)
- ✅ Reviews (Add/List)
- ✅ Coupons (List/Validate)
- ✅ Wishlist (Add/Remove/List)

**🎉 Complete API system ready for production use!**
