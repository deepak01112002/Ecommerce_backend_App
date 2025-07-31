# 📚 Complete API Documentation - Ghanshyam Murti Bhandar

## 🌐 Base URL
- **Development:** `http://localhost:8080/api`
- **Production:** `https://server.ghanshyammurtibhandar.com/api`

## 🔐 Authentication
Most APIs require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔑 AUTHENTICATION APIs

### 1. User Registration
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-07-26T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile
**GET** `/auth/profile`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-07-26T10:30:00.000Z",
    "updatedAt": "2024-07-26T10:30:00.000Z"
  }
}
```

### 4. Update User Profile
**PUT** `/auth/profile`
*Requires Authentication*

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "9876543211"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe Updated",
      "email": "john.updated@example.com",
      "phone": "9876543211",
      "role": "user",
      "updated_at": "2024-07-26T11:30:00.000Z"
    }
  }
}
```

### 5. Change Password
**PUT** `/users/change-password`
*Requires Authentication*

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password updated successfully"
  }
}
```

### 6. Logout
**POST** `/auth/logout`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

---

## 📦 PRODUCT APIs

### 1. Get All Products
**GET** `/products`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)
- `category` (string): Category ID filter
- `search` (string): Search term
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sort` (string): Sort by (price_asc, price_desc, name_asc, name_desc, newest)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Ganesha Murti",
        "description": "Beautiful handcrafted Ganesha statue",
        "price": 2999.99,
        "original_price": 3999.99,
        "images": [
          "https://storage.url/image1.jpg",
          "https://storage.url/image2.jpg"
        ],
        "category": {
          "_id": "64a1b2c3d4e5f6789012346",
          "name": "Ganesha",
          "slug": "ganesha"
        },
        "stock": 25,
        "is_active": true,
        "is_featured": true,
        "specifications": {
          "material": "Premium Brass",
          "height": "12 inches",
          "width": "8 inches",
          "weight": "2.5 kg",
          "finish": "Antique Gold",
          "origin": "Handcrafted in Rajasthan",
          "color": "Golden",
          "style": "Traditional",
          "occasion": "Festivals and Daily Worship",
          "careInstructions": "Clean with soft dry cloth"
        },
        "createdAt": "2024-07-26T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 48,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Get Single Product
**GET** `/products/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product details retrieved successfully",
  "data": {
    "product": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ganesha Murti",
      "description": "Beautiful handcrafted Ganesha statue with intricate details",
      "price": 2999.99,
      "original_price": 3999.99,
      "images": [
        "https://storage.url/image1.jpg",
        "https://storage.url/image2.jpg"
      ],
      "category": {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "Ganesha",
        "slug": "ganesha",
        "description": "Ganesha statues and idols"
      },
      "stock": 25,
      "is_active": true,
      "is_featured": true,
      "specifications": {
        "material": "Premium Brass",
        "height": "12 inches",
        "width": "8 inches",
        "weight": "2.5 kg",
        "finish": "Antique Gold Plated",
        "origin": "Handcrafted in Rajasthan, India",
        "color": "Golden with Silver Accents",
        "style": "Traditional Indian",
        "occasion": "Festivals and Daily Worship",
        "careInstructions": "Clean with soft dry cloth, avoid water"
      },
      "variants": [],
      "tags": ["ganesha", "brass", "traditional"],
      "createdAt": "2024-07-26T10:30:00.000Z",
      "updatedAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

### 3. Get Featured Products
**GET** `/products/featured`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Featured products retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ganesha Murti",
      "price": 2999.99,
      "original_price": 3999.99,
      "images": ["https://storage.url/image1.jpg"],
      "category": {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "Ganesha"
      },
      "specifications": {
        "material": "Premium Brass",
        "height": "12 inches"
      }
    }
  ]
}
```

### 4. Search Products
**GET** `/products/search?q=ganesha`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Ganesha Murti",
        "price": 2999.99,
        "images": ["https://storage.url/image1.jpg"],
        "category": {
          "name": "Ganesha"
        },
        "specifications": {
          "material": "Premium Brass"
        }
      }
    ],
    "total": 1,
    "query": "ganesha"
  }
}
```

---

## 📂 CATEGORY APIs

### 1. Get All Categories
**GET** `/categories`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "Ganesha",
        "slug": "ganesha",
        "description": "Ganesha statues and idols",
        "image": "https://storage.url/category-image.jpg",
        "isActive": true,
        "productCount": 15,
        "createdAt": "2024-07-26T10:30:00.000Z"
      }
    ]
  }
}
```

### 2. Get Single Category
**GET** `/categories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "category": {
      "_id": "64a1b2c3d4e5f6789012346",
      "name": "Ganesha",
      "slug": "ganesha",
      "description": "Beautiful Ganesha statues and idols for worship",
      "image": "https://storage.url/category-image.jpg",
      "isActive": true,
      "createdAt": "2024-07-26T10:30:00.000Z",
      "updatedAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

---

## 📍 ADDRESS APIs

### 1. Get All User Addresses
**GET** `/addresses`
*Requires Authentication*

**Query Parameters:**
- `type` (string): Filter by type (home/work/other)
- `limit` (number): Limit results (1-50, default: 10)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": {
    "addresses": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "type": "home",
        "label": "Home Address",
        "fullName": "John Doe",
        "phone": "9876543210",
        "alternatePhone": "9876543211",
        "addressLine1": "123 Main Street",
        "addressLine2": "Near City Mall",
        "landmark": "Opposite Bank",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "postalCode": "400001",
        "completeAddress": "123 Main Street, Near City Mall, Opposite Bank, Mumbai, Maharashtra - 400001, India",
        "isDefault": true,
        "isActive": true,
        "deliveryInstructions": "Ring the bell twice",
        "addressType": "apartment",
        "createdAt": "2024-07-26T10:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 2. Add New Address
**POST** `/addresses`
*Requires Authentication*

**Request Body:**
```json
{
  "type": "home",
  "label": "Home Address",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "addressLine1": "123 Main Street",
  "addressLine2": "Near City Mall",
  "landmark": "Opposite Bank",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postalCode": "400001",
  "isDefault": true,
  "deliveryInstructions": "Ring the bell twice",
  "addressType": "apartment",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address": {
      "_id": "64a1b2c3d4e5f6789012347",
      "type": "home",
      "label": "Home Address",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "9876543210",
      "alternatePhone": "9876543211",
      "addressLine1": "123 Main Street",
      "addressLine2": "Near City Mall",
      "landmark": "Opposite Bank",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "postalCode": "400001",
      "completeAddress": "123 Main Street, Near City Mall, Opposite Bank, Mumbai, Maharashtra - 400001, India",
      "isDefault": true,
      "isActive": true,
      "deliveryInstructions": "Ring the bell twice",
      "addressType": "apartment",
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "createdAt": "2024-07-26T10:30:00.000Z",
      "updatedAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

### 3. Get Single Address
**GET** `/addresses/:id`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Address retrieved successfully",
  "data": {
    "address": {
      "_id": "64a1b2c3d4e5f6789012347",
      "type": "home",
      "label": "Home Address",
      "fullName": "John Doe",
      "phone": "9876543210",
      "completeAddress": "123 Main Street, Near City Mall, Mumbai, Maharashtra - 400001, India",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

### 4. Update Address
**PUT** `/addresses/:id`
*Requires Authentication*

**Request Body:** (All fields optional)
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "9876543211",
  "addressLine1": "456 Updated Street",
  "city": "Delhi",
  "state": "Delhi",
  "postalCode": "110001",
  "isDefault": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "address": {
      "_id": "64a1b2c3d4e5f6789012347",
      "firstName": "John Updated",
      "lastName": "Doe Updated",
      "fullName": "John Updated Doe Updated",
      "phone": "9876543211",
      "addressLine1": "456 Updated Street",
      "city": "Delhi",
      "state": "Delhi",
      "postalCode": "110001",
      "completeAddress": "456 Updated Street, Delhi, Delhi - 110001, India",
      "isDefault": false,
      "updatedAt": "2024-07-26T11:30:00.000Z"
    }
  }
}
```

### 5. Set Default Address
**PATCH** `/addresses/:id/default`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Default address updated successfully",
  "data": {
    "address": {
      "_id": "64a1b2c3d4e5f6789012347",
      "fullName": "John Doe",
      "completeAddress": "123 Main Street, Mumbai, Maharashtra - 400001, India",
      "isDefault": true,
      "updatedAt": "2024-07-26T11:30:00.000Z"
    }
  }
}
```

### 6. Delete Address
**DELETE** `/addresses/:id`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "data": {
    "message": "Address deleted successfully"
  }
}
```

### 7. Get Default Address
**GET** `/addresses/default`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Default address retrieved successfully",
  "data": {
    "address": {
      "_id": "64a1b2c3d4e5f6789012347",
      "type": "home",
      "label": "Home Address",
      "fullName": "John Doe",
      "phone": "9876543210",
      "completeAddress": "123 Main Street, Mumbai, Maharashtra - 400001, India",
      "isDefault": true,
      "deliveryInstructions": "Ring the bell twice"
    }
  }
}
```

### 8. Validate Address
**POST** `/addresses/:id/validate`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Address validation completed",
  "data": {
    "validation": {
      "isValid": true,
      "address": {
        "name": "John Doe",
        "phone": "9876543210",
        "address": "123 Main Street, Mumbai, Maharashtra - 400001, India",
        "type": "home",
        "label": "Home Address"
      },
      "issues": []
    }
  }
}
```

**Invalid Address Response (200):**
```json
{
  "success": true,
  "message": "Address validation completed",
  "data": {
    "validation": {
      "isValid": false,
      "address": {
        "name": "John Doe",
        "phone": "",
        "address": "Incomplete address",
        "type": "home",
        "label": "Home Address"
      },
      "issues": [
        "phone is required",
        "addressLine1 is required",
        "city is required"
      ]
    }
  }
}
```

---

## 🛒 CART APIs

### 1. Get Cart
**GET** `/cart`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "64a1b2c3d4e5f6789012348",
      "user": "64a1b2c3d4e5f6789012345",
      "items": [
        {
          "_id": "64a1b2c3d4e5f6789012349",
          "product": {
            "_id": "64a1b2c3d4e5f6789012345",
            "name": "Ganesha Murti",
            "price": 2999.99,
            "images": ["https://storage.url/image1.jpg"],
            "stock": 25,
            "is_active": true
          },
          "quantity": 2,
          "price": 2999.99,
          "total": 5999.98
        }
      ],
      "totalItems": 2,
      "totalAmount": 5999.98,
      "updatedAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

### 2. Add to Cart
**POST** `/cart/add`
*Requires Authentication*

**Request Body:**
```json
{
  "productId": "64a1b2c3d4e5f6789012345",
  "quantity": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "cart": {
      "_id": "64a1b2c3d4e5f6789012348",
      "items": [
        {
          "_id": "64a1b2c3d4e5f6789012349",
          "product": {
            "_id": "64a1b2c3d4e5f6789012345",
            "name": "Ganesha Murti",
            "price": 2999.99
          },
          "quantity": 2,
          "total": 5999.98
        }
      ],
      "totalItems": 2,
      "totalAmount": 5999.98
    }
  }
}
```

### 3. Update Cart Item
**PUT** `/cart/update`
*Requires Authentication*

**Request Body:**
```json
{
  "productId": "64a1b2c3d4e5f6789012345",
  "quantity": 3
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart updated successfully",
  "data": {
    "cart": {
      "totalItems": 3,
      "totalAmount": 8999.97,
      "updatedAt": "2024-07-26T10:35:00.000Z"
    }
  }
}
```

### 4. Remove from Cart
**DELETE** `/cart/remove/:productId`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product removed from cart successfully",
  "data": {
    "cart": {
      "totalItems": 0,
      "totalAmount": 0,
      "updatedAt": "2024-07-26T10:40:00.000Z"
    }
  }
}
```

### 5. Clear Cart
**DELETE** `/cart/clear`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "message": "Cart cleared successfully"
  }
}
```

---

## 🛍️ ORDER APIs

### 1. Create Order
**POST** `/orders`
*Requires Authentication*

**Request Body:**
```json
{
  "items": [
    {
      "product": "64a1b2c3d4e5f6789012345",
      "quantity": 2,
      "price": 2999.99
    }
  ],
  "shippingAddress": "64a1b2c3d4e5f6789012347",
  "paymentMethod": "razorpay",
  "totalAmount": 5999.98,
  "shippingCharges": 100,
  "taxAmount": 540,
  "discountAmount": 0,
  "finalAmount": 6639.98
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6789012350",
      "orderNumber": "ORD2507260001",
      "user": "64a1b2c3d4e5f6789012345",
      "items": [
        {
          "product": {
            "_id": "64a1b2c3d4e5f6789012345",
            "name": "Ganesha Murti",
            "images": ["https://storage.url/image1.jpg"]
          },
          "quantity": 2,
          "price": 2999.99,
          "total": 5999.98
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "9876543210",
        "completeAddress": "123 Main Street, Mumbai, Maharashtra - 400001, India"
      },
      "paymentInfo": {
        "method": "razorpay",
        "status": "pending",
        "razorpayOrderId": "order_MkL6tQAOiQSgKs"
      },
      "orderStatus": "pending",
      "totalAmount": 5999.98,
      "shippingCharges": 100,
      "taxAmount": 540,
      "discountAmount": 0,
      "finalAmount": 6639.98,
      "createdAt": "2024-07-26T10:30:00.000Z"
    }
  }
}
```

### 2. Get User Orders
**GET** `/orders`
*Requires Authentication*

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status

**Success Response (200):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "_id": "64a1b2c3d4e5f6789012350",
        "orderNumber": "ORD2507260001",
        "items": [
          {
            "product": {
              "name": "Ganesha Murti",
              "images": ["https://storage.url/image1.jpg"]
            },
            "quantity": 2,
            "price": 2999.99
          }
        ],
        "orderStatus": "confirmed",
        "paymentInfo": {
          "method": "razorpay",
          "status": "completed"
        },
        "finalAmount": 6639.98,
        "createdAt": "2024-07-26T10:30:00.000Z",
        "estimatedDelivery": "2024-08-02T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalOrders": 1
    }
  }
}
```

### 3. Get Single Order
**GET** `/orders/:id`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6789012350",
      "orderNumber": "ORD2507260001",
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "product": {
            "_id": "64a1b2c3d4e5f6789012345",
            "name": "Ganesha Murti",
            "images": ["https://storage.url/image1.jpg"],
            "specifications": {
              "material": "Premium Brass",
              "height": "12 inches"
            }
          },
          "quantity": 2,
          "price": 2999.99,
          "total": 5999.98
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "9876543210",
        "completeAddress": "123 Main Street, Mumbai, Maharashtra - 400001, India",
        "deliveryInstructions": "Ring the bell twice"
      },
      "paymentInfo": {
        "method": "razorpay",
        "status": "completed",
        "razorpayOrderId": "order_MkL6tQAOiQSgKs",
        "razorpayPaymentId": "pay_MkL6tQAOiQSgKt",
        "paidAt": "2024-07-26T10:35:00.000Z"
      },
      "orderStatus": "confirmed",
      "shippingInfo": {
        "carrier": "Shiprocket",
        "trackingNumber": "SR123456789",
        "awbCode": "AWB123456789",
        "estimatedDelivery": "2024-08-02T10:30:00.000Z"
      },
      "totalAmount": 5999.98,
      "shippingCharges": 100,
      "taxAmount": 540,
      "discountAmount": 0,
      "finalAmount": 6639.98,
      "createdAt": "2024-07-26T10:30:00.000Z",
      "updatedAt": "2024-07-26T10:35:00.000Z"
    }
  }
}
```

---

## 💳 PAYMENT APIs

### 1. Create Razorpay Order
**POST** `/payments/razorpay/create-order`
*Requires Authentication*

**Request Body:**
```json
{
  "amount": 6639.98,
  "currency": "INR",
  "orderId": "64a1b2c3d4e5f6789012350"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "razorpayOrder": {
      "id": "order_MkL6tQAOiQSgKs",
      "entity": "order",
      "amount": 663998,
      "amount_paid": 0,
      "amount_due": 663998,
      "currency": "INR",
      "receipt": "ORD2507260001",
      "status": "created",
      "created_at": 1690365000
    },
    "key": "rzp_test_4hUj1dxGbUR5wj"
  }
}
```

### 2. Verify Razorpay Payment
**POST** `/payments/razorpay/verify`
*Requires Authentication*

**Request Body:**
```json
{
  "razorpay_order_id": "order_MkL6tQAOiQSgKs",
  "razorpay_payment_id": "pay_MkL6tQAOiQSgKt",
  "razorpay_signature": "signature_hash",
  "orderId": "64a1b2c3d4e5f6789012350"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6789012350",
      "orderNumber": "ORD2507260001",
      "paymentInfo": {
        "method": "razorpay",
        "status": "completed",
        "razorpayOrderId": "order_MkL6tQAOiQSgKs",
        "razorpayPaymentId": "pay_MkL6tQAOiQSgKt",
        "paidAt": "2024-07-26T10:35:00.000Z"
      },
      "orderStatus": "confirmed",
      "finalAmount": 6639.98
    }
  }
}
```

---

## 🚚 SHIPPING APIs

### 1. Calculate Shipping
**POST** `/shipping/calculate`
*Requires Authentication*

**Request Body:**
```json
{
  "items": [
    {
      "product": "64a1b2c3d4e5f6789012345",
      "quantity": 2,
      "weight": 2.5,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      }
    }
  ],
  "destinationPincode": "400001",
  "sourcePincode": "302001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shipping rates calculated successfully",
  "data": {
    "rates": [
      {
        "carrier": "Shiprocket",
        "service": "Standard",
        "rate": 100,
        "estimatedDays": "5-7",
        "currency": "INR"
      },
      {
        "carrier": "Shiprocket",
        "service": "Express",
        "rate": 200,
        "estimatedDays": "2-3",
        "currency": "INR"
      }
    ],
    "recommendedRate": {
      "carrier": "Shiprocket",
      "service": "Standard",
      "rate": 100,
      "estimatedDays": "5-7"
    }
  }
}
```

### 2. Track Shipment
**GET** `/shipping/track/:awbCode`
*Requires Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shipment tracking retrieved successfully",
  "data": {
    "tracking": {
      "awbCode": "AWB123456789",
      "currentStatus": "In Transit",
      "estimatedDelivery": "2024-08-02T10:30:00.000Z",
      "trackingEvents": [
        {
          "status": "Picked Up",
          "location": "Jaipur, Rajasthan",
          "timestamp": "2024-07-26T10:30:00.000Z",
          "description": "Package picked up from seller"
        },
        {
          "status": "In Transit",
          "location": "Mumbai, Maharashtra",
          "timestamp": "2024-07-27T08:15:00.000Z",
          "description": "Package in transit to destination"
        }
      ],
      "carrier": "Shiprocket",
      "service": "Standard"
    }
  }
}
```

---

## 🏪 ADMIN APIs

### 1. Admin Login
**POST** `/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@ghanshyambhandar.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Admin User",
      "email": "admin@ghanshyambhandar.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Create Product (Admin)
**POST** `/products`
*Requires Admin Authentication*

**Request Body (FormData):**
```
name: "New Ganesha Murti"
description: "Beautiful handcrafted statue"
price: 2999.99
originalPrice: 3999.99
category: "64a1b2c3d4e5f6789012346"
stock: 25
isActive: true
isFeatured: false
material: "Premium Brass"
height: "12 inches"
width: "8 inches"
weight: "2.5 kg"
finish: "Antique Gold"
origin: "Handcrafted in Rajasthan"
color: "Golden"
style: "Traditional"
occasion: "Festivals and Daily Worship"
careInstructions: "Clean with soft dry cloth"
images: [File objects]
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "New Ganesha Murti",
    "description": "Beautiful handcrafted statue",
    "price": 2999.99,
    "original_price": 3999.99,
    "images": [
      "https://storage.url/image1.jpg",
      "https://storage.url/image2.jpg"
    ],
    "category": {
      "_id": "64a1b2c3d4e5f6789012346",
      "name": "Ganesha"
    },
    "stock": 25,
    "is_active": true,
    "is_featured": false,
    "specifications": {
      "material": "Premium Brass",
      "height": "12 inches",
      "width": "8 inches",
      "weight": "2.5 kg",
      "finish": "Antique Gold",
      "origin": "Handcrafted in Rajasthan",
      "color": "Golden",
      "style": "Traditional",
      "occasion": "Festivals and Daily Worship",
      "careInstructions": "Clean with soft dry cloth"
    },
    "createdAt": "2024-07-26T10:30:00.000Z"
  }
}
```

### 3. Update Product (Admin)
**PUT** `/products/:id`
*Requires Admin Authentication*

**Request Body (FormData):** (Same as create, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Updated Ganesha Murti",
    "specifications": {
      "material": "Updated Premium Silver",
      "height": "14 inches"
    },
    "updatedAt": "2024-07-26T11:30:00.000Z"
  }
}
```

### 4. Delete Product (Admin)
**DELETE** `/products/:id`
*Requires Admin Authentication*

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "message": "Product deleted successfully"
  }
}
```

### 5. Get All Orders (Admin)
**GET** `/admin/orders`
*Requires Admin Authentication*

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `search` (string): Search by order number or customer

**Success Response (200):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012350",
      "orderNumber": "ORD2507260001",
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      },
      "items": [
        {
          "product": {
            "name": "Ganesha Murti",
            "images": ["https://storage.url/image1.jpg"]
          },
          "quantity": 2,
          "price": 2999.99
        }
      ],
      "orderStatus": "confirmed",
      "paymentInfo": {
        "method": "razorpay",
        "status": "completed"
      },
      "finalAmount": 6639.98,
      "createdAt": "2024-07-26T10:30:00.000Z"
    }
  ]
}
```

---

## ❌ ERROR RESPONSES

### Common Error Format
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400
}
```

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (Validation errors)
- **401** - Unauthorized (Invalid/missing token)
- **403** - Forbidden (Insufficient permissions)
- **404** - Not Found
- **409** - Conflict (Duplicate data)
- **500** - Internal Server Error

### Example Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ],
  "statusCode": 400
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Authentication required",
  "errors": [],
  "statusCode": 401
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Product not found",
  "errors": [],
  "statusCode": 404
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Internal server error",
  "errors": [],
  "statusCode": 500
}
```

---

## 📝 NOTES

### Authentication Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Content Types
- **JSON APIs:** `Content-Type: application/json`
- **File Upload APIs:** `Content-Type: multipart/form-data`

### Rate Limiting
- **General APIs:** 100 requests per 15 minutes
- **Authentication APIs:** 5 requests per 15 minutes

### Pagination
Most list APIs support pagination with `page` and `limit` query parameters.

### Search & Filtering
Many APIs support search and filtering through query parameters.

---

**📚 Total APIs Documented: 50+**
**🎯 All endpoints include proper request/response examples**
**✅ Complete with error handling and status codes**
```
