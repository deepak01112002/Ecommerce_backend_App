# 🎯 MANUAL API TESTING GUIDE FOR POSTMAN

## 🔧 SETUP INSTRUCTIONS

### **Environment Setup**
1. Create new environment in Postman
2. Add variables:
   - `base_url`: http://localhost:8080/api
   - `admin_token`: (will be set after login)

### **Authentication Flow**
1. First run Admin Login to get token
2. Copy token from response
3. Set token in environment variable
4. Use `{{admin_token}}` in Authorization headers

---

## 📋 ALL API ENDPOINTS WITH REAL RESPONSES


## 🔐 AUTHENTICATION APIS

### **1. Admin Login**

- **Method:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**
```json
{
  "email": "admin@admin.com",
  "password": "Admin@123"
}
```
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "687bd97d3548474946dd9f6c",
      "firstName": "Admin",
      "lastName": "User",
      "fullName": "Admin User",
      "email": "admin@admin.com",
      "phone": "9999999999",
      "role": "admin",
      "isActive": true,
      "emailVerified": false,
      "loyaltyPoints": 0,
      "totalSpent": 0,
      "orderCount": 0,
      "customerTier": "bronze",
      "lastLogin": "2025-07-21T16:18:53.526Z",
      "createdAt": "2025-07-19T17:44:29.189Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2JkOTdkMzU0ODQ3NDk0NmRkOWY2YyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzExNDczMywiZXhwIjoxNzUzNzE5NTMzfQ.BHeozFjGPyfAUNLfA1JB8gu91aOhbRDyHdPOaz0KmJk",
    "expires_in": "7d"
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:53.568Z",
    "request_id": "9646b1d6-a61c-44f0-947d-5b4298d3d17b",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 📊 DASHBOARD APIS

### **1. Quick Stats**

- **Method:** GET
- **URL:** `{{base_url}}/admin/dashboard/quick-stats`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Quick stats retrieved successfully",
  "data": {
    "quickStats": {
      "pendingOrders": 12,
      "lowStockItems": 0,
      "unreadNotifications": 0,
      "openTickets": 0,
      "pendingReturns": 0
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:53.814Z",
    "request_id": "bba3485f-13b1-43a9-afa7-895061c1d20d",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 📦 PRODUCTS APIS

### **1. Get All Products**

- **Method:** GET
- **URL:** `{{base_url}}/products?page=1&limit=5`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "687a980f30b6cc535c479e31",
        "id": "687a980f30b6cc535c479e31",
        "name": "Meditation Clothes Item 2 - Standard Material Standard Size",
        "description": "Premium meditation clothes item 2 crafted from high-quality standard material. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.",
        "short_description": "Premium standard material meditation clothes item 2 in standard size size",
        "slug": "meditation-clothes-item-2-standard-material-standard-size-2",
        "price": 837,
        "original_price": 1120,
        "discount_percentage": 25,
        "discount_amount": 283,
        "images": [
          "/images/products/meditation-clothes/meditation-clothes-item-2-1.jpg",
          "/images/products/meditation-clothes/meditation-clothes-item-2-2.jpg"
        ],
        "category": {
          "_id": "687a980d30b6cc535c4797fc",
          "id": "687a980d30b6cc535c4797fc",
          "name": "Meditation Clothes",
          "slug": "meditation-clothes",
          "path": "clothing-textiles/meditation-clothes"
        },
        "brand": "Blessed Designs",
        "rating": 5,
        "review_count": 2,
        "stock": 103,
        "min_order_quantity": 1,
        "max_order_quantity": 8,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_in_stock": true,
        "is_active": true,
        "is_featured": false,
        "is_bestseller": false,
        "is_new_arrival": true,
        "is_favorite": false,
        "view_count": 364,
        "sales_count": 22,
        "tags": [
          "meditation clothes",
          "standard material",
          "standard size",
          "religious",
          "spiritual",
          "handcrafted",
          "blesseddesigns"
        ],
        "created_at": "2025-07-18T18:53:03.361Z",
        "updated_at": "2025-07-19T16:52:10.948Z"
      },
      {
        "_id": "687a980f30b6cc535c479e43",
        "id": "687a980f30b6cc535c479e43",
        "name": "Festival Wear Item 3 - Standard Material Standard Size",
        "description": "Premium festival wear item 3 crafted from high-quality standard material. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.",
        "short_description": "Premium standard material festival wear item 3 in standard size size",
        "slug": "festival-wear-item-3-standard-material-standard-size-3",
        "price": 921,
        "original_price": 1372,
        "discount_percentage": 33,
        "discount_amount": 451,
        "images": [
          "/images/products/festival-wear/festival-wear-item-3-1.jpg",
          "/images/products/festival-wear/festival-wear-item-3-2.jpg"
        ],
        "category": {
          "_id": "687a980d30b6cc535c479801",
          "id": "687a980d30b6cc535c479801",
          "name": "Festival Wear",
          "slug": "festival-wear",
          "path": "clothing-textiles/festival-wear"
        },
        "brand": "Blessed Designs",
        "rating": 4.061717572300492,
        "review_count": 18,
        "stock": 49,
        "min_order_quantity": 1,
        "max_order_quantity": 7,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_in_stock": true,
        "is_active": true,
        "is_featured": false,
        "is_bestseller": true,
        "is_new_arrival": false,
        "is_favorite": false,
        "view_count": 904,
        "sales_count": 54,
        "tags": [
          "festival wear",
          "standard material",
          "standard size",
          "religious",
          "spiritual",
          "handcrafted",
          "blesseddesigns"
        ],
        "created_at": "2025-07-18T18:53:03.361Z",
        "updated_at": "2025-07-18T18:53:03.361Z"
      },
      {
        "_id": "687a980f30b6cc535c479e52",
        "id": "687a980f30b6cc535c479e52",
        "name": "Temple Cloth Item 3 - Standard Material Standard Size",
        "description": "Premium temple cloth item 3 crafted from high-quality standard material. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.",
        "short_description": "Premium standard material temple cloth item 3 in standard size size",
        "slug": "temple-cloth-item-3-standard-material-standard-size-3",
        "price": 1277,
        "original_price": 1569,
        "discount_percentage": 19,
        "discount_amount": 292,
        "images": [
          "/images/products/temple-cloth/temple-cloth-item-3-1.jpg",
          "/images/products/temple-cloth/temple-cloth-item-3-2.jpg"
        ],
        "category": {
          "_id": "687a980d30b6cc535c479806",
          "id": "687a980d30b6cc535c479806",
          "name": "Temple Cloth",
          "slug": "temple-cloth",
          "path": "clothing-textiles/temple-cloth"
        },
        "brand": "Divine Crafts",
        "rating": 3.7515605542029804,
        "review_count": 0,
        "stock": 90,
        "min_order_quantity": 1,
        "max_order_quantity": 5,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_in_stock": true,
        "is_active": true,
        "is_featured": false,
        "is_bestseller": true,
        "is_new_arrival": true,
        "is_favorite": false,
        "view_count": 742,
        "sales_count": 16,
        "tags": [
          "temple cloth",
          "standard material",
          "standard size",
          "religious",
          "spiritual",
          "handcrafted",
          "divinecrafts"
        ],
        "created_at": "2025-07-18T18:53:03.361Z",
        "updated_at": "2025-07-18T18:53:03.361Z"
      },
      {
        "_id": "687a980f30b6cc535c479e55",
        "id": "687a980f30b6cc535c479e55",
        "name": "Temple Cloth Item 4 - Standard Material Standard Size",
        "description": "Premium temple cloth item 4 crafted from high-quality standard material. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.",
        "short_description": "Premium standard material temple cloth item 4 in standard size size",
        "slug": "temple-cloth-item-4-standard-material-standard-size-4",
        "price": 1095,
        "original_price": 1513,
        "discount_percentage": 28,
        "discount_amount": 418,
        "images": [
          "/images/products/temple-cloth/temple-cloth-item-4-1.jpg",
          "/images/products/temple-cloth/temple-cloth-item-4-2.jpg"
        ],
        "category": {
          "_id": "687a980d30b6cc535c479806",
          "id": "687a980d30b6cc535c479806",
          "name": "Temple Cloth",
          "slug": "temple-cloth",
          "path": "clothing-textiles/temple-cloth"
        },
        "brand": "Sacred Arts",
        "rating": 4.814832273169925,
        "review_count": 20,
        "stock": 107,
        "min_order_quantity": 1,
        "max_order_quantity": 7,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_in_stock": true,
        "is_active": true,
        "is_featured": true,
        "is_bestseller": false,
        "is_new_arrival": false,
        "is_favorite": false,
        "view_count": 287,
        "sales_count": 32,
        "tags": [
          "temple cloth",
          "standard material",
          "standard size",
          "religious",
          "spiritual",
          "handcrafted",
          "sacredarts"
        ],
        "created_at": "2025-07-18T18:53:03.361Z",
        "updated_at": "2025-07-18T18:53:03.361Z"
      },
      {
        "_id": "687a980f30b6cc535c479e5b",
        "id": "687a980f30b6cc535c479e5b",
        "name": "Bed Sheets Item 1 - Standard Material Standard Size",
        "description": "Premium bed sheets item 1 crafted from high-quality standard material. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.",
        "short_description": "Premium standard material bed sheets item 1 in standard size size",
        "slug": "bed-sheets-item-1-standard-material-standard-size-1",
        "price": 1265,
        "original_price": 1783,
        "discount_percentage": 29,
        "discount_amount": 518,
        "images": [
          "/images/products/bed-sheets/bed-sheets-item-1-1.jpg",
          "/images/products/bed-sheets/bed-sheets-item-1-2.jpg"
        ],
        "category": {
          "_id": "687a980e30b6cc535c47980b",
          "id": "687a980e30b6cc535c47980b",
          "name": "Bed Sheets",
          "slug": "bed-sheets",
          "path": "clothing-textiles/bed-sheets"
        },
        "brand": "Sacred Arts",
        "rating": 4.788914928413005,
        "review_count": 34,
        "stock": 78,
        "min_order_quantity": 1,
        "max_order_quantity": 14,
        "availability": "in_stock",
        "stock_status": "in_stock",
        "is_in_stock": true,
        "is_active": true,
        "is_featured": false,
        "is_bestseller": false,
        "is_new_arrival": true,
        "is_favorite": false,
        "view_count": 765,
        "sales_count": 59,
        "tags": [
          "bed sheets",
          "standard material",
          "standard size",
          "religious",
          "spiritual",
          "handcrafted",
          "sacredarts"
        ],
        "created_at": "2025-07-18T18:53:03.361Z",
        "updated_at": "2025-07-18T18:53:03.361Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 5,
      "total": 525,
      "total_pages": 105,
      "has_next_page": true,
      "has_prev_page": false
    },
    "filters": {
      "category": null,
      "subcategory": null,
      "search": null,
      "price_range": null,
      "rating": null,
      "brand": null,
      "tags": null,
      "sort_by": "createdAt",
      "sort_order": "desc",
      "features": {
        "featured": false,
        "bestseller": false,
        "new_arrival": false,
        "on_sale": false,
        "in_stock": false
      }
    },
    "meta": {
      "total_found": 525,
      "showing": 5,
      "search_query": null
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:54.072Z",
    "request_id": "fd602b22-2b2a-4816-964a-1b0eb465cb84",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 📁 CATEGORIES APIS

### **1. Get All Categories**

- **Method:** GET
- **URL:** `{{base_url}}/categories`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "0": {
      "_id": "687a980130b6cc535c479680",
      "id": "687a980130b6cc535c479680",
      "name": "Aarti Items",
      "description": "High quality aarti items for religious and spiritual use",
      "slug": "aarti-items",
      "image": "/images/categories/aarti-items.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:49.624Z",
      "updated_at": "2025-07-18T18:52:49.737Z"
    },
    "1": {
      "_id": "687a980830b6cc535c47976b",
      "id": "687a980830b6cc535c47976b",
      "name": "Amulets",
      "description": "High quality amulets for religious and spiritual use",
      "slug": "amulets",
      "image": "/images/categories/amulets.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.956Z",
      "updated_at": "2025-07-18T18:52:57.074Z"
    },
    "2": {
      "_id": "687a980930b6cc535c47977f",
      "id": "687a980930b6cc535c47977f",
      "name": "Anklets",
      "description": "High quality anklets for religious and spiritual use",
      "slug": "anklets",
      "image": "/images/categories/anklets.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.604Z",
      "updated_at": "2025-07-18T18:52:57.722Z"
    },
    "3": {
      "_id": "687a980e30b6cc535c47980b",
      "id": "687a980e30b6cc535c47980b",
      "name": "Bed Sheets",
      "description": "High quality bed sheets for religious and spiritual use",
      "slug": "bed-sheets",
      "image": "/images/categories/bed-sheets.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.034Z",
      "updated_at": "2025-07-18T18:53:02.151Z"
    },
    "4": {
      "_id": "687a980530b6cc535c4796fd",
      "id": "687a980530b6cc535c4796fd",
      "name": "Bhagavad Gita",
      "description": "High quality bhagavad gita for religious and spiritual use",
      "slug": "bhagavad-gita",
      "image": "/images/categories/bhagavad-gita.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.514Z",
      "updated_at": "2025-07-18T18:52:53.633Z"
    },
    "5": {
      "_id": "687a980e30b6cc535c479824",
      "id": "687a980e30b6cc535c479824",
      "name": "Blankets",
      "description": "High quality blankets for religious and spiritual use",
      "slug": "blankets",
      "image": "/images/categories/blankets.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.855Z",
      "updated_at": "2025-07-18T18:53:02.974Z"
    },
    "6": {
      "_id": "687a980930b6cc535c479770",
      "id": "687a980930b6cc535c479770",
      "name": "Bracelets",
      "description": "High quality bracelets for religious and spiritual use",
      "slug": "bracelets",
      "image": "/images/categories/bracelets.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.115Z",
      "updated_at": "2025-07-18T18:52:57.238Z"
    },
    "7": {
      "_id": "687a97ff30b6cc535c479653",
      "id": "687a97ff30b6cc535c479653",
      "name": "Brahma Murtis",
      "description": "High quality brahma murtis for religious and spiritual use",
      "slug": "brahma-murtis",
      "image": "/images/categories/brahma-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.979Z",
      "updated_at": "2025-07-18T18:52:48.089Z"
    },
    "8": {
      "_id": "687a980330b6cc535c4796ad",
      "id": "687a980330b6cc535c4796ad",
      "name": "Camphor",
      "description": "High quality camphor for religious and spiritual use",
      "slug": "camphor",
      "image": "/images/categories/camphor.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.022Z",
      "updated_at": "2025-07-18T18:52:51.137Z"
    },
    "9": {
      "_id": "687a980a30b6cc535c4797a7",
      "id": "687a980a30b6cc535c4797a7",
      "name": "Candle Holders",
      "description": "High quality candle holders for religious and spiritual use",
      "slug": "candle-holders",
      "image": "/images/categories/candle-holders.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.868Z",
      "updated_at": "2025-07-18T18:52:58.981Z"
    },
    "10": {
      "_id": "687a980030b6cc535c479662",
      "id": "687a980030b6cc535c479662",
      "name": "Chandra Murtis",
      "description": "High quality chandra murtis for religious and spiritual use",
      "slug": "chandra-murtis",
      "image": "/images/categories/chandra-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.432Z",
      "updated_at": "2025-07-18T18:52:48.547Z"
    },
    "11": {
      "_id": "687a980b30b6cc535c4797b6",
      "id": "687a980b30b6cc535c4797b6",
      "name": "Clocks",
      "description": "High quality clocks for religious and spiritual use",
      "slug": "clocks",
      "image": "/images/categories/clocks.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.328Z",
      "updated_at": "2025-07-18T18:52:59.441Z"
    },
    "12": {
      "_id": "687a97fe30b6cc535c4795fd",
      "id": "687a97fe30b6cc535c4795fd",
      "name": "Clothing & Textiles",
      "description": "Premium clothing & textiles for spiritual and religious purposes",
      "slug": "clothing-textiles",
      "image": "/images/categories/clothing-&-textiles.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980c30b6cc535c4797de",
          "id": "687a980c30b6cc535c4797de",
          "name": "Dhoti & Kurta",
          "slug": "dhoti-kurta"
        },
        {
          "_id": "687a980c30b6cc535c4797e3",
          "id": "687a980c30b6cc535c4797e3",
          "name": "Sarees",
          "slug": "sarees"
        },
        {
          "_id": "687a980c30b6cc535c4797e8",
          "id": "687a980c30b6cc535c4797e8",
          "name": "Shawls",
          "slug": "shawls"
        },
        {
          "_id": "687a980d30b6cc535c4797ed",
          "id": "687a980d30b6cc535c4797ed",
          "name": "Scarves",
          "slug": "scarves"
        },
        {
          "_id": "687a980d30b6cc535c4797f2",
          "id": "687a980d30b6cc535c4797f2",
          "name": "Prayer Caps",
          "slug": "prayer-caps"
        },
        {
          "_id": "687a980d30b6cc535c4797f7",
          "id": "687a980d30b6cc535c4797f7",
          "name": "Religious T-Shirts",
          "slug": "religious-t-shirts"
        },
        {
          "_id": "687a980d30b6cc535c4797fc",
          "id": "687a980d30b6cc535c4797fc",
          "name": "Meditation Clothes",
          "slug": "meditation-clothes"
        },
        {
          "_id": "687a980d30b6cc535c479801",
          "id": "687a980d30b6cc535c479801",
          "name": "Festival Wear",
          "slug": "festival-wear"
        },
        {
          "_id": "687a980d30b6cc535c479806",
          "id": "687a980d30b6cc535c479806",
          "name": "Temple Cloth",
          "slug": "temple-cloth"
        },
        {
          "_id": "687a980e30b6cc535c47980b",
          "id": "687a980e30b6cc535c47980b",
          "name": "Bed Sheets",
          "slug": "bed-sheets"
        },
        {
          "_id": "687a980e30b6cc535c479810",
          "id": "687a980e30b6cc535c479810",
          "name": "Pillow Covers",
          "slug": "pillow-covers"
        },
        {
          "_id": "687a980e30b6cc535c479815",
          "id": "687a980e30b6cc535c479815",
          "name": "Curtains",
          "slug": "curtains"
        },
        {
          "_id": "687a980e30b6cc535c47981a",
          "id": "687a980e30b6cc535c47981a",
          "name": "Table Cloth",
          "slug": "table-cloth"
        },
        {
          "_id": "687a980e30b6cc535c47981f",
          "id": "687a980e30b6cc535c47981f",
          "name": "Towels",
          "slug": "towels"
        },
        {
          "_id": "687a980e30b6cc535c479824",
          "id": "687a980e30b6cc535c479824",
          "name": "Blankets",
          "slug": "blankets"
        }
      ],
      "created_at": "2025-07-18T18:52:46.142Z",
      "updated_at": "2025-07-18T18:52:46.218Z"
    },
    "13": {
      "_id": "687a980e30b6cc535c479815",
      "id": "687a980e30b6cc535c479815",
      "name": "Curtains",
      "description": "High quality curtains for religious and spiritual use",
      "slug": "curtains",
      "image": "/images/categories/curtains.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.361Z",
      "updated_at": "2025-07-18T18:53:02.481Z"
    },
    "14": {
      "_id": "687a980a30b6cc535c47979d",
      "id": "687a980a30b6cc535c47979d",
      "name": "Decorative Plates",
      "description": "High quality decorative plates for religious and spiritual use",
      "slug": "decorative-plates",
      "image": "/images/categories/decorative-plates.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.559Z",
      "updated_at": "2025-07-18T18:52:58.672Z"
    },
    "15": {
      "_id": "687a980830b6cc535c47974d",
      "id": "687a980830b6cc535c47974d",
      "name": "Deity Ornaments",
      "description": "High quality deity ornaments for religious and spiritual use",
      "slug": "deity-ornaments",
      "image": "/images/categories/deity-ornaments.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.013Z",
      "updated_at": "2025-07-18T18:52:56.131Z"
    },
    "16": {
      "_id": "687a980630b6cc535c47971b",
      "id": "687a980630b6cc535c47971b",
      "name": "Devotional Songs",
      "description": "High quality devotional songs for religious and spiritual use",
      "slug": "devotional-songs",
      "image": "/images/categories/devotional-songs.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.449Z",
      "updated_at": "2025-07-18T18:52:54.563Z"
    },
    "17": {
      "_id": "687a980c30b6cc535c4797de",
      "id": "687a980c30b6cc535c4797de",
      "name": "Dhoti & Kurta",
      "description": "High quality dhoti & kurta for religious and spiritual use",
      "slug": "dhoti-kurta",
      "image": "/images/categories/dhoti-&-kurta.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.587Z",
      "updated_at": "2025-07-18T18:53:00.705Z"
    },
    "18": {
      "_id": "687a980030b6cc535c479671",
      "id": "687a980030b6cc535c479671",
      "name": "Diyas & Lamps",
      "description": "High quality diyas & lamps for religious and spiritual use",
      "slug": "diyas-lamps",
      "image": "/images/categories/diyas-&-lamps.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.907Z",
      "updated_at": "2025-07-18T18:52:49.029Z"
    },
    "19": {
      "_id": "687a980b30b6cc535c4797c0",
      "id": "687a980b30b6cc535c4797c0",
      "name": "Door Hangings",
      "description": "High quality door hangings for religious and spiritual use",
      "slug": "door-hangings",
      "image": "/images/categories/door-hangings.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.634Z",
      "updated_at": "2025-07-18T18:52:59.748Z"
    },
    "20": {
      "_id": "687a97fe30b6cc535c479620",
      "id": "687a97fe30b6cc535c479620",
      "name": "Durga Murtis",
      "description": "High quality durga murtis for religious and spiritual use",
      "slug": "durga-murtis",
      "image": "/images/categories/durga-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:46.723Z",
      "updated_at": "2025-07-18T18:52:46.837Z"
    },
    "21": {
      "_id": "687a980930b6cc535c47977a",
      "id": "687a980930b6cc535c47977a",
      "name": "Earrings",
      "description": "High quality earrings for religious and spiritual use",
      "slug": "earrings",
      "image": "/images/categories/earrings.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.444Z",
      "updated_at": "2025-07-18T18:52:57.562Z"
    },
    "22": {
      "_id": "687a980c30b6cc535c4797d4",
      "id": "687a980c30b6cc535c4797d4",
      "name": "Festival Decorations",
      "description": "High quality festival decorations for religious and spiritual use",
      "slug": "festival-decorations",
      "image": "/images/categories/festival-decorations.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.268Z",
      "updated_at": "2025-07-18T18:53:00.386Z"
    },
    "23": {
      "_id": "687a980d30b6cc535c479801",
      "id": "687a980d30b6cc535c479801",
      "name": "Festival Wear",
      "description": "High quality festival wear for religious and spiritual use",
      "slug": "festival-wear",
      "image": "/images/categories/festival-wear.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.710Z",
      "updated_at": "2025-07-18T18:53:01.830Z"
    },
    "24": {
      "_id": "687a980b30b6cc535c4797ca",
      "id": "687a980b30b6cc535c4797ca",
      "name": "Floor Decorations",
      "description": "High quality floor decorations for religious and spiritual use",
      "slug": "floor-decorations",
      "image": "/images/categories/floor-decorations.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.946Z",
      "updated_at": "2025-07-18T18:53:00.064Z"
    },
    "25": {
      "_id": "687a97fe30b6cc535c479603",
      "id": "687a97fe30b6cc535c479603",
      "name": "Ganesha Murtis",
      "description": "High quality ganesha murtis for religious and spiritual use",
      "slug": "ganesha-murtis",
      "image": "/images/categories/ganesha-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:46.258Z",
      "updated_at": "2025-07-18T18:52:46.373Z"
    },
    "26": {
      "_id": "687a980c30b6cc535c4797cf",
      "id": "687a980c30b6cc535c4797cf",
      "name": "Garden Decorations",
      "description": "High quality garden decorations for religious and spiritual use",
      "slug": "garden-decorations",
      "image": "/images/categories/garden-decorations.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.106Z",
      "updated_at": "2025-07-18T18:53:00.225Z"
    },
    "27": {
      "_id": "687a980830b6cc535c479766",
      "id": "687a980830b6cc535c479766",
      "name": "Gemstones",
      "description": "High quality gemstones for religious and spiritual use",
      "slug": "gemstones",
      "image": "/images/categories/gemstones.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.796Z",
      "updated_at": "2025-07-18T18:52:56.914Z"
    },
    "28": {
      "_id": "687a980a30b6cc535c47978e",
      "id": "687a980a30b6cc535c47978e",
      "name": "Hair Accessories",
      "description": "High quality hair accessories for religious and spiritual use",
      "slug": "hair-accessories",
      "image": "/images/categories/hair-accessories.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.089Z",
      "updated_at": "2025-07-18T18:52:58.201Z"
    },
    "29": {
      "_id": "687a97fe30b6cc535c479627",
      "id": "687a97fe30b6cc535c479627",
      "name": "Hanuman Murtis",
      "description": "High quality hanuman murtis for religious and spiritual use",
      "slug": "hanuman-murtis",
      "image": "/images/categories/hanuman-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:46.876Z",
      "updated_at": "2025-07-18T18:52:46.998Z"
    },
    "30": {
      "_id": "687a97fd30b6cc535c4795c0",
      "id": "687a97fd30b6cc535c4795c0",
      "name": "Hindu Deities",
      "description": "Premium hindu deities for spiritual and religious purposes",
      "slug": "hindu-deities",
      "image": "/images/categories/hindu-deities.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a97fe30b6cc535c479603",
          "id": "687a97fe30b6cc535c479603",
          "name": "Ganesha Murtis",
          "slug": "ganesha-murtis"
        },
        {
          "_id": "687a97fe30b6cc535c47960c",
          "id": "687a97fe30b6cc535c47960c",
          "name": "Krishna Murtis",
          "slug": "krishna-murtis"
        },
        {
          "_id": "687a97fe30b6cc535c479617",
          "id": "687a97fe30b6cc535c479617",
          "name": "Shiva Murtis",
          "slug": "shiva-murtis"
        },
        {
          "_id": "687a97fe30b6cc535c479620",
          "id": "687a97fe30b6cc535c479620",
          "name": "Durga Murtis",
          "slug": "durga-murtis"
        },
        {
          "_id": "687a97fe30b6cc535c479627",
          "id": "687a97fe30b6cc535c479627",
          "name": "Hanuman Murtis",
          "slug": "hanuman-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c47962f",
          "id": "687a97ff30b6cc535c47962f",
          "name": "Lakshmi Murtis",
          "slug": "lakshmi-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c479636",
          "id": "687a97ff30b6cc535c479636",
          "name": "Saraswati Murtis",
          "slug": "saraswati-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c47963e",
          "id": "687a97ff30b6cc535c47963e",
          "name": "Rama Murtis",
          "slug": "rama-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c479644",
          "id": "687a97ff30b6cc535c479644",
          "name": "Vishnu Murtis",
          "slug": "vishnu-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c479649",
          "id": "687a97ff30b6cc535c479649",
          "name": "Kali Murtis",
          "slug": "kali-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c47964e",
          "id": "687a97ff30b6cc535c47964e",
          "name": "Parvati Murtis",
          "slug": "parvati-murtis"
        },
        {
          "_id": "687a97ff30b6cc535c479653",
          "id": "687a97ff30b6cc535c479653",
          "name": "Brahma Murtis",
          "slug": "brahma-murtis"
        },
        {
          "_id": "687a980030b6cc535c479658",
          "id": "687a980030b6cc535c479658",
          "name": "Indra Murtis",
          "slug": "indra-murtis"
        },
        {
          "_id": "687a980030b6cc535c47965d",
          "id": "687a980030b6cc535c47965d",
          "name": "Surya Murtis",
          "slug": "surya-murtis"
        },
        {
          "_id": "687a980030b6cc535c479662",
          "id": "687a980030b6cc535c479662",
          "name": "Chandra Murtis",
          "slug": "chandra-murtis"
        }
      ],
      "created_at": "2025-07-18T18:52:45.417Z",
      "updated_at": "2025-07-18T18:52:45.499Z"
    },
    "31": {
      "_id": "687a980230b6cc535c4796a3",
      "id": "687a980230b6cc535c4796a3",
      "name": "Holy Water Containers",
      "description": "High quality holy water containers for religious and spiritual use",
      "slug": "holy-water-containers",
      "image": "/images/categories/holy-water-containers.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.703Z",
      "updated_at": "2025-07-18T18:52:50.826Z"
    },
    "32": {
      "_id": "687a97fe30b6cc535c4795f5",
      "id": "687a97fe30b6cc535c4795f5",
      "name": "Home Decor",
      "description": "Premium home decor for spiritual and religious purposes",
      "slug": "home-decor",
      "image": "/images/categories/home-decor.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980a30b6cc535c479793",
          "id": "687a980a30b6cc535c479793",
          "name": "Wall Hangings",
          "slug": "wall-hangings"
        },
        {
          "_id": "687a980a30b6cc535c479798",
          "id": "687a980a30b6cc535c479798",
          "name": "Rangoli Items",
          "slug": "rangoli-items"
        },
        {
          "_id": "687a980a30b6cc535c47979d",
          "id": "687a980a30b6cc535c47979d",
          "name": "Decorative Plates",
          "slug": "decorative-plates"
        },
        {
          "_id": "687a980a30b6cc535c4797a2",
          "id": "687a980a30b6cc535c4797a2",
          "name": "Vases",
          "slug": "vases"
        },
        {
          "_id": "687a980a30b6cc535c4797a7",
          "id": "687a980a30b6cc535c4797a7",
          "name": "Candle Holders",
          "slug": "candle-holders"
        },
        {
          "_id": "687a980b30b6cc535c4797ac",
          "id": "687a980b30b6cc535c4797ac",
          "name": "Photo Frames",
          "slug": "photo-frames"
        },
        {
          "_id": "687a980b30b6cc535c4797b1",
          "id": "687a980b30b6cc535c4797b1",
          "name": "Mirrors",
          "slug": "mirrors"
        },
        {
          "_id": "687a980b30b6cc535c4797b6",
          "id": "687a980b30b6cc535c4797b6",
          "name": "Clocks",
          "slug": "clocks"
        },
        {
          "_id": "687a980b30b6cc535c4797bb",
          "id": "687a980b30b6cc535c4797bb",
          "name": "Wind Chimes",
          "slug": "wind-chimes"
        },
        {
          "_id": "687a980b30b6cc535c4797c0",
          "id": "687a980b30b6cc535c4797c0",
          "name": "Door Hangings",
          "slug": "door-hangings"
        },
        {
          "_id": "687a980b30b6cc535c4797c5",
          "id": "687a980b30b6cc535c4797c5",
          "name": "Table Decorations",
          "slug": "table-decorations"
        },
        {
          "_id": "687a980b30b6cc535c4797ca",
          "id": "687a980b30b6cc535c4797ca",
          "name": "Floor Decorations",
          "slug": "floor-decorations"
        },
        {
          "_id": "687a980c30b6cc535c4797cf",
          "id": "687a980c30b6cc535c4797cf",
          "name": "Garden Decorations",
          "slug": "garden-decorations"
        },
        {
          "_id": "687a980c30b6cc535c4797d4",
          "id": "687a980c30b6cc535c4797d4",
          "name": "Festival Decorations",
          "slug": "festival-decorations"
        },
        {
          "_id": "687a980c30b6cc535c4797d9",
          "id": "687a980c30b6cc535c4797d9",
          "name": "Seasonal Items",
          "slug": "seasonal-items"
        }
      ],
      "created_at": "2025-07-18T18:52:46.028Z",
      "updated_at": "2025-07-18T18:52:46.103Z"
    },
    "33": {
      "_id": "687a980030b6cc535c47966c",
      "id": "687a980030b6cc535c47966c",
      "name": "Incense Sticks",
      "description": "High quality incense sticks for religious and spiritual use",
      "slug": "incense-sticks",
      "image": "/images/categories/incense-sticks.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.744Z",
      "updated_at": "2025-07-18T18:52:48.864Z"
    },
    "34": {
      "_id": "687a980030b6cc535c479658",
      "id": "687a980030b6cc535c479658",
      "name": "Indra Murtis",
      "description": "High quality indra murtis for religious and spiritual use",
      "slug": "indra-murtis",
      "image": "/images/categories/indra-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.127Z",
      "updated_at": "2025-07-18T18:52:48.240Z"
    },
    "35": {
      "_id": "687a97fd30b6cc535c4795ec",
      "id": "687a97fd30b6cc535c4795ec",
      "name": "Jewelry & Ornaments",
      "description": "Premium jewelry & ornaments for spiritual and religious purposes",
      "slug": "jewelry-ornaments",
      "image": "/images/categories/jewelry-&-ornaments.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980730b6cc535c479748",
          "id": "687a980730b6cc535c479748",
          "name": "Temple Jewelry",
          "slug": "temple-jewelry"
        },
        {
          "_id": "687a980830b6cc535c47974d",
          "id": "687a980830b6cc535c47974d",
          "name": "Deity Ornaments",
          "slug": "deity-ornaments"
        },
        {
          "_id": "687a980830b6cc535c479752",
          "id": "687a980830b6cc535c479752",
          "name": "Sacred Rings",
          "slug": "sacred-rings"
        },
        {
          "_id": "687a980830b6cc535c479757",
          "id": "687a980830b6cc535c479757",
          "name": "Religious Pendants",
          "slug": "religious-pendants"
        },
        {
          "_id": "687a980830b6cc535c47975c",
          "id": "687a980830b6cc535c47975c",
          "name": "Prayer Beads",
          "slug": "prayer-beads"
        },
        {
          "_id": "687a980830b6cc535c479761",
          "id": "687a980830b6cc535c479761",
          "name": "Rudraksha",
          "slug": "rudraksha"
        },
        {
          "_id": "687a980830b6cc535c479766",
          "id": "687a980830b6cc535c479766",
          "name": "Gemstones",
          "slug": "gemstones"
        },
        {
          "_id": "687a980830b6cc535c47976b",
          "id": "687a980830b6cc535c47976b",
          "name": "Amulets",
          "slug": "amulets"
        },
        {
          "_id": "687a980930b6cc535c479770",
          "id": "687a980930b6cc535c479770",
          "name": "Bracelets",
          "slug": "bracelets"
        },
        {
          "_id": "687a980930b6cc535c479775",
          "id": "687a980930b6cc535c479775",
          "name": "Necklaces",
          "slug": "necklaces"
        },
        {
          "_id": "687a980930b6cc535c47977a",
          "id": "687a980930b6cc535c47977a",
          "name": "Earrings",
          "slug": "earrings"
        },
        {
          "_id": "687a980930b6cc535c47977f",
          "id": "687a980930b6cc535c47977f",
          "name": "Anklets",
          "slug": "anklets"
        },
        {
          "_id": "687a980930b6cc535c479784",
          "id": "687a980930b6cc535c479784",
          "name": "Nose Rings",
          "slug": "nose-rings"
        },
        {
          "_id": "687a980930b6cc535c479789",
          "id": "687a980930b6cc535c479789",
          "name": "Toe Rings",
          "slug": "toe-rings"
        },
        {
          "_id": "687a980a30b6cc535c47978e",
          "id": "687a980a30b6cc535c47978e",
          "name": "Hair Accessories",
          "slug": "hair-accessories"
        }
      ],
      "created_at": "2025-07-18T18:52:45.913Z",
      "updated_at": "2025-07-18T18:52:45.988Z"
    },
    "36": {
      "_id": "687a980130b6cc535c47967b",
      "id": "687a980130b6cc535c47967b",
      "name": "Kalash & Lota",
      "description": "High quality kalash & lota for religious and spiritual use",
      "slug": "kalash-lota",
      "image": "/images/categories/kalash-&-lota.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:49.221Z",
      "updated_at": "2025-07-18T18:52:49.335Z"
    },
    "37": {
      "_id": "687a97ff30b6cc535c479649",
      "id": "687a97ff30b6cc535c479649",
      "name": "Kali Murtis",
      "description": "High quality kali murtis for religious and spiritual use",
      "slug": "kali-murtis",
      "image": "/images/categories/kali-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.676Z",
      "updated_at": "2025-07-18T18:52:47.787Z"
    },
    "38": {
      "_id": "687a97fe30b6cc535c47960c",
      "id": "687a97fe30b6cc535c47960c",
      "name": "Krishna Murtis",
      "description": "High quality krishna murtis for religious and spiritual use",
      "slug": "krishna-murtis",
      "image": "/images/categories/krishna-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:46.415Z",
      "updated_at": "2025-07-18T18:52:46.528Z"
    },
    "39": {
      "_id": "687a97ff30b6cc535c47962f",
      "id": "687a97ff30b6cc535c47962f",
      "name": "Lakshmi Murtis",
      "description": "High quality lakshmi murtis for religious and spiritual use",
      "slug": "lakshmi-murtis",
      "image": "/images/categories/lakshmi-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.039Z",
      "updated_at": "2025-07-18T18:52:47.152Z"
    },
    "40": {
      "_id": "687a980530b6cc535c479707",
      "id": "687a980530b6cc535c479707",
      "name": "Mahabharata",
      "description": "High quality mahabharata for religious and spiritual use",
      "slug": "mahabharata",
      "image": "/images/categories/mahabharata.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.827Z",
      "updated_at": "2025-07-18T18:52:53.941Z"
    },
    "41": {
      "_id": "687a980630b6cc535c47972a",
      "id": "687a980630b6cc535c47972a",
      "name": "Mantras",
      "description": "High quality mantras for religious and spiritual use",
      "slug": "mantras",
      "image": "/images/categories/mantras.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.920Z",
      "updated_at": "2025-07-18T18:52:55.034Z"
    },
    "42": {
      "_id": "687a980730b6cc535c47972f",
      "id": "687a980730b6cc535c47972f",
      "name": "Meditation Books",
      "description": "High quality meditation books for religious and spiritual use",
      "slug": "meditation-books",
      "image": "/images/categories/meditation-books.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.079Z",
      "updated_at": "2025-07-18T18:52:55.198Z"
    },
    "43": {
      "_id": "687a980d30b6cc535c4797fc",
      "id": "687a980d30b6cc535c4797fc",
      "name": "Meditation Clothes",
      "description": "High quality meditation clothes for religious and spiritual use",
      "slug": "meditation-clothes",
      "image": "/images/categories/meditation-clothes.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.548Z",
      "updated_at": "2025-07-18T18:53:01.667Z"
    },
    "44": {
      "_id": "687a980b30b6cc535c4797b1",
      "id": "687a980b30b6cc535c4797b1",
      "name": "Mirrors",
      "description": "High quality mirrors for religious and spiritual use",
      "slug": "mirrors",
      "image": "/images/categories/mirrors.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.175Z",
      "updated_at": "2025-07-18T18:52:59.289Z"
    },
    "45": {
      "_id": "687a980930b6cc535c479775",
      "id": "687a980930b6cc535c479775",
      "name": "Necklaces",
      "description": "High quality necklaces for religious and spiritual use",
      "slug": "necklaces",
      "image": "/images/categories/necklaces.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.280Z",
      "updated_at": "2025-07-18T18:52:57.401Z"
    },
    "46": {
      "_id": "687a980930b6cc535c479784",
      "id": "687a980930b6cc535c479784",
      "name": "Nose Rings",
      "description": "High quality nose rings for religious and spiritual use",
      "slug": "nose-rings",
      "image": "/images/categories/nose-rings.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.762Z",
      "updated_at": "2025-07-18T18:52:57.882Z"
    },
    "47": {
      "_id": "687a980230b6cc535c4796a8",
      "id": "687a980230b6cc535c4796a8",
      "name": "Offering Plates",
      "description": "High quality offering plates for religious and spiritual use",
      "slug": "offering-plates",
      "image": "/images/categories/offering-plates.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.867Z",
      "updated_at": "2025-07-18T18:52:50.982Z"
    },
    "48": {
      "_id": "687a97ff30b6cc535c47964e",
      "id": "687a97ff30b6cc535c47964e",
      "name": "Parvati Murtis",
      "description": "High quality parvati murtis for religious and spiritual use",
      "slug": "parvati-murtis",
      "image": "/images/categories/parvati-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.826Z",
      "updated_at": "2025-07-18T18:52:47.940Z"
    },
    "49": {
      "_id": "687a980730b6cc535c479739",
      "id": "687a980730b6cc535c479739",
      "name": "Philosophy Books",
      "description": "High quality philosophy books for religious and spiritual use",
      "slug": "philosophy-books",
      "image": "/images/categories/philosophy-books.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.390Z",
      "updated_at": "2025-07-18T18:52:55.505Z"
    },
    "50": {
      "_id": "687a980b30b6cc535c4797ac",
      "id": "687a980b30b6cc535c4797ac",
      "name": "Photo Frames",
      "description": "High quality photo frames for religious and spiritual use",
      "slug": "photo-frames",
      "image": "/images/categories/photo-frames.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.020Z",
      "updated_at": "2025-07-18T18:52:59.133Z"
    },
    "51": {
      "_id": "687a980e30b6cc535c479810",
      "id": "687a980e30b6cc535c479810",
      "name": "Pillow Covers",
      "description": "High quality pillow covers for religious and spiritual use",
      "slug": "pillow-covers",
      "image": "/images/categories/pillow-covers.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.192Z",
      "updated_at": "2025-07-18T18:53:02.319Z"
    },
    "52": {
      "_id": "687a980830b6cc535c47975c",
      "id": "687a980830b6cc535c47975c",
      "name": "Prayer Beads",
      "description": "High quality prayer beads for religious and spiritual use",
      "slug": "prayer-beads",
      "image": "/images/categories/prayer-beads.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.472Z",
      "updated_at": "2025-07-18T18:52:56.585Z"
    },
    "53": {
      "_id": "687a980630b6cc535c479720",
      "id": "687a980630b6cc535c479720",
      "name": "Prayer Books",
      "description": "High quality prayer books for religious and spiritual use",
      "slug": "prayer-books",
      "image": "/images/categories/prayer-books.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.603Z",
      "updated_at": "2025-07-18T18:52:54.725Z"
    },
    "54": {
      "_id": "687a980d30b6cc535c4797f2",
      "id": "687a980d30b6cc535c4797f2",
      "name": "Prayer Caps",
      "description": "High quality prayer caps for religious and spiritual use",
      "slug": "prayer-caps",
      "image": "/images/categories/prayer-caps.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.223Z",
      "updated_at": "2025-07-18T18:53:01.341Z"
    },
    "55": {
      "_id": "687a980230b6cc535c479699",
      "id": "687a980230b6cc535c479699",
      "name": "Prayer Mats",
      "description": "High quality prayer mats for religious and spiritual use",
      "slug": "prayer-mats",
      "image": "/images/categories/prayer-mats.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.397Z",
      "updated_at": "2025-07-18T18:52:50.510Z"
    },
    "56": {
      "_id": "687a980230b6cc535c47969e",
      "id": "687a980230b6cc535c47969e",
      "name": "Puja Accessories",
      "description": "High quality puja accessories for religious and spiritual use",
      "slug": "puja-accessories",
      "image": "/images/categories/puja-accessories.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.550Z",
      "updated_at": "2025-07-18T18:52:50.663Z"
    },
    "57": {
      "_id": "687a980130b6cc535c479676",
      "id": "687a980130b6cc535c479676",
      "name": "Puja Bells",
      "description": "High quality puja bells for religious and spiritual use",
      "slug": "puja-bells",
      "image": "/images/categories/puja-bells.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:49.069Z",
      "updated_at": "2025-07-18T18:52:49.181Z"
    },
    "58": {
      "_id": "687a980230b6cc535c479694",
      "id": "687a980230b6cc535c479694",
      "name": "Puja Books",
      "description": "High quality puja books for religious and spiritual use",
      "slug": "puja-books",
      "image": "/images/categories/puja-books.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.244Z",
      "updated_at": "2025-07-18T18:52:50.357Z"
    },
    "59": {
      "_id": "687a980130b6cc535c479685",
      "id": "687a980130b6cc535c479685",
      "name": "Puja Flowers",
      "description": "High quality puja flowers for religious and spiritual use",
      "slug": "puja-flowers",
      "image": "/images/categories/puja-flowers.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:49.776Z",
      "updated_at": "2025-07-18T18:52:49.889Z"
    },
    "60": {
      "_id": "687a97fd30b6cc535c4795cc",
      "id": "687a97fd30b6cc535c4795cc",
      "name": "Puja Items",
      "description": "Premium puja items for spiritual and religious purposes",
      "slug": "puja-items",
      "image": "/images/categories/puja-items.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980030b6cc535c479667",
          "id": "687a980030b6cc535c479667",
          "name": "Puja Thalis",
          "slug": "puja-thalis"
        },
        {
          "_id": "687a980030b6cc535c47966c",
          "id": "687a980030b6cc535c47966c",
          "name": "Incense Sticks",
          "slug": "incense-sticks"
        },
        {
          "_id": "687a980030b6cc535c479671",
          "id": "687a980030b6cc535c479671",
          "name": "Diyas & Lamps",
          "slug": "diyas-lamps"
        },
        {
          "_id": "687a980130b6cc535c479676",
          "id": "687a980130b6cc535c479676",
          "name": "Puja Bells",
          "slug": "puja-bells"
        },
        {
          "_id": "687a980130b6cc535c47967b",
          "id": "687a980130b6cc535c47967b",
          "name": "Kalash & Lota",
          "slug": "kalash-lota"
        },
        {
          "_id": "687a980130b6cc535c479680",
          "id": "687a980130b6cc535c479680",
          "name": "Aarti Items",
          "slug": "aarti-items"
        },
        {
          "_id": "687a980130b6cc535c479685",
          "id": "687a980130b6cc535c479685",
          "name": "Puja Flowers",
          "slug": "puja-flowers"
        },
        {
          "_id": "687a980130b6cc535c47968a",
          "id": "687a980130b6cc535c47968a",
          "name": "Sacred Threads",
          "slug": "sacred-threads"
        },
        {
          "_id": "687a980230b6cc535c47968f",
          "id": "687a980230b6cc535c47968f",
          "name": "Tilak & Kumkum",
          "slug": "tilak-kumkum"
        },
        {
          "_id": "687a980230b6cc535c479694",
          "id": "687a980230b6cc535c479694",
          "name": "Puja Books",
          "slug": "puja-books"
        },
        {
          "_id": "687a980230b6cc535c479699",
          "id": "687a980230b6cc535c479699",
          "name": "Prayer Mats",
          "slug": "prayer-mats"
        },
        {
          "_id": "687a980230b6cc535c47969e",
          "id": "687a980230b6cc535c47969e",
          "name": "Puja Accessories",
          "slug": "puja-accessories"
        },
        {
          "_id": "687a980230b6cc535c4796a3",
          "id": "687a980230b6cc535c4796a3",
          "name": "Holy Water Containers",
          "slug": "holy-water-containers"
        },
        {
          "_id": "687a980230b6cc535c4796a8",
          "id": "687a980230b6cc535c4796a8",
          "name": "Offering Plates",
          "slug": "offering-plates"
        },
        {
          "_id": "687a980330b6cc535c4796ad",
          "id": "687a980330b6cc535c4796ad",
          "name": "Camphor",
          "slug": "camphor"
        }
      ],
      "created_at": "2025-07-18T18:52:45.540Z",
      "updated_at": "2025-07-18T18:52:45.622Z"
    },
    "61": {
      "_id": "687a980030b6cc535c479667",
      "id": "687a980030b6cc535c479667",
      "name": "Puja Thalis",
      "description": "High quality puja thalis for religious and spiritual use",
      "slug": "puja-thalis",
      "image": "/images/categories/puja-thalis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.588Z",
      "updated_at": "2025-07-18T18:52:48.704Z"
    },
    "62": {
      "_id": "687a980530b6cc535c47970c",
      "id": "687a980530b6cc535c47970c",
      "name": "Puranas",
      "description": "High quality puranas for religious and spiritual use",
      "slug": "puranas",
      "image": "/images/categories/puranas.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.980Z",
      "updated_at": "2025-07-18T18:52:54.094Z"
    },
    "63": {
      "_id": "687a97ff30b6cc535c47963e",
      "id": "687a97ff30b6cc535c47963e",
      "name": "Rama Murtis",
      "description": "High quality rama murtis for religious and spiritual use",
      "slug": "rama-murtis",
      "image": "/images/categories/rama-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.347Z",
      "updated_at": "2025-07-18T18:52:47.480Z"
    },
    "64": {
      "_id": "687a980530b6cc535c479702",
      "id": "687a980530b6cc535c479702",
      "name": "Ramayana",
      "description": "High quality ramayana for religious and spiritual use",
      "slug": "ramayana",
      "image": "/images/categories/ramayana.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.674Z",
      "updated_at": "2025-07-18T18:52:53.787Z"
    },
    "65": {
      "_id": "687a980a30b6cc535c479798",
      "id": "687a980a30b6cc535c479798",
      "name": "Rangoli Items",
      "description": "High quality rangoli items for religious and spiritual use",
      "slug": "rangoli-items",
      "image": "/images/categories/rangoli-items.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.397Z",
      "updated_at": "2025-07-18T18:52:58.518Z"
    },
    "66": {
      "_id": "687a980830b6cc535c479757",
      "id": "687a980830b6cc535c479757",
      "name": "Religious Pendants",
      "description": "High quality religious pendants for religious and spiritual use",
      "slug": "religious-pendants",
      "image": "/images/categories/religious-pendants.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.320Z",
      "updated_at": "2025-07-18T18:52:56.433Z"
    },
    "67": {
      "_id": "687a980730b6cc535c47973e",
      "id": "687a980730b6cc535c47973e",
      "name": "Religious Stories",
      "description": "High quality religious stories for religious and spiritual use",
      "slug": "religious-stories",
      "image": "/images/categories/religious-stories.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.546Z",
      "updated_at": "2025-07-18T18:52:55.660Z"
    },
    "68": {
      "_id": "687a980d30b6cc535c4797f7",
      "id": "687a980d30b6cc535c4797f7",
      "name": "Religious T-Shirts",
      "description": "High quality religious t-shirts for religious and spiritual use",
      "slug": "religious-t-shirts",
      "image": "/images/categories/religious-t-shirts.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.384Z",
      "updated_at": "2025-07-18T18:53:01.506Z"
    },
    "69": {
      "_id": "687a980830b6cc535c479761",
      "id": "687a980830b6cc535c479761",
      "name": "Rudraksha",
      "description": "High quality rudraksha for religious and spiritual use",
      "slug": "rudraksha",
      "image": "/images/categories/rudraksha.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.640Z",
      "updated_at": "2025-07-18T18:52:56.755Z"
    },
    "70": {
      "_id": "687a980830b6cc535c479752",
      "id": "687a980830b6cc535c479752",
      "name": "Sacred Rings",
      "description": "High quality sacred rings for religious and spiritual use",
      "slug": "sacred-rings",
      "image": "/images/categories/sacred-rings.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:56.171Z",
      "updated_at": "2025-07-18T18:52:56.281Z"
    },
    "71": {
      "_id": "687a980730b6cc535c479743",
      "id": "687a980730b6cc535c479743",
      "name": "Sacred Texts",
      "description": "High quality sacred texts for religious and spiritual use",
      "slug": "sacred-texts",
      "image": "/images/categories/sacred-texts.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.702Z",
      "updated_at": "2025-07-18T18:52:55.818Z"
    },
    "72": {
      "_id": "687a980130b6cc535c47968a",
      "id": "687a980130b6cc535c47968a",
      "name": "Sacred Threads",
      "description": "High quality sacred threads for religious and spiritual use",
      "slug": "sacred-threads",
      "image": "/images/categories/sacred-threads.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:49.929Z",
      "updated_at": "2025-07-18T18:52:50.046Z"
    },
    "73": {
      "_id": "687a97ff30b6cc535c479636",
      "id": "687a97ff30b6cc535c479636",
      "name": "Saraswati Murtis",
      "description": "High quality saraswati murtis for religious and spiritual use",
      "slug": "saraswati-murtis",
      "image": "/images/categories/saraswati-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.193Z",
      "updated_at": "2025-07-18T18:52:47.307Z"
    },
    "74": {
      "_id": "687a980c30b6cc535c4797e3",
      "id": "687a980c30b6cc535c4797e3",
      "name": "Sarees",
      "description": "High quality sarees for religious and spiritual use",
      "slug": "sarees",
      "image": "/images/categories/sarees.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.747Z",
      "updated_at": "2025-07-18T18:53:00.864Z"
    },
    "75": {
      "_id": "687a980d30b6cc535c4797ed",
      "id": "687a980d30b6cc535c4797ed",
      "name": "Scarves",
      "description": "High quality scarves for religious and spiritual use",
      "slug": "scarves",
      "image": "/images/categories/scarves.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.068Z",
      "updated_at": "2025-07-18T18:53:01.182Z"
    },
    "76": {
      "_id": "687a980c30b6cc535c4797d9",
      "id": "687a980c30b6cc535c4797d9",
      "name": "Seasonal Items",
      "description": "High quality seasonal items for religious and spiritual use",
      "slug": "seasonal-items",
      "image": "/images/categories/seasonal-items.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.427Z",
      "updated_at": "2025-07-18T18:53:00.545Z"
    },
    "77": {
      "_id": "687a980c30b6cc535c4797e8",
      "id": "687a980c30b6cc535c4797e8",
      "name": "Shawls",
      "description": "High quality shawls for religious and spiritual use",
      "slug": "shawls",
      "image": "/images/categories/shawls.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:00.905Z",
      "updated_at": "2025-07-18T18:53:01.020Z"
    },
    "78": {
      "_id": "687a97fe30b6cc535c479617",
      "id": "687a97fe30b6cc535c479617",
      "name": "Shiva Murtis",
      "description": "High quality shiva murtis for religious and spiritual use",
      "slug": "shiva-murtis",
      "image": "/images/categories/shiva-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:46.570Z",
      "updated_at": "2025-07-18T18:52:46.683Z"
    },
    "79": {
      "_id": "687a97fd30b6cc535c4795e3",
      "id": "687a97fd30b6cc535c4795e3",
      "name": "Spiritual Books",
      "description": "Premium spiritual books for spiritual and religious purposes",
      "slug": "spiritual-books",
      "image": "/images/categories/spiritual-books.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980530b6cc535c4796fd",
          "id": "687a980530b6cc535c4796fd",
          "name": "Bhagavad Gita",
          "slug": "bhagavad-gita"
        },
        {
          "_id": "687a980530b6cc535c479702",
          "id": "687a980530b6cc535c479702",
          "name": "Ramayana",
          "slug": "ramayana"
        },
        {
          "_id": "687a980530b6cc535c479707",
          "id": "687a980530b6cc535c479707",
          "name": "Mahabharata",
          "slug": "mahabharata"
        },
        {
          "_id": "687a980530b6cc535c47970c",
          "id": "687a980530b6cc535c47970c",
          "name": "Puranas",
          "slug": "puranas"
        },
        {
          "_id": "687a980630b6cc535c479711",
          "id": "687a980630b6cc535c479711",
          "name": "Vedas",
          "slug": "vedas"
        },
        {
          "_id": "687a980630b6cc535c479716",
          "id": "687a980630b6cc535c479716",
          "name": "Upanishads",
          "slug": "upanishads"
        },
        {
          "_id": "687a980630b6cc535c47971b",
          "id": "687a980630b6cc535c47971b",
          "name": "Devotional Songs",
          "slug": "devotional-songs"
        },
        {
          "_id": "687a980630b6cc535c479720",
          "id": "687a980630b6cc535c479720",
          "name": "Prayer Books",
          "slug": "prayer-books"
        },
        {
          "_id": "687a980630b6cc535c479725",
          "id": "687a980630b6cc535c479725",
          "name": "Spiritual Guides",
          "slug": "spiritual-guides"
        },
        {
          "_id": "687a980630b6cc535c47972a",
          "id": "687a980630b6cc535c47972a",
          "name": "Mantras",
          "slug": "mantras"
        },
        {
          "_id": "687a980730b6cc535c47972f",
          "id": "687a980730b6cc535c47972f",
          "name": "Meditation Books",
          "slug": "meditation-books"
        },
        {
          "_id": "687a980730b6cc535c479734",
          "id": "687a980730b6cc535c479734",
          "name": "Yoga Books",
          "slug": "yoga-books"
        },
        {
          "_id": "687a980730b6cc535c479739",
          "id": "687a980730b6cc535c479739",
          "name": "Philosophy Books",
          "slug": "philosophy-books"
        },
        {
          "_id": "687a980730b6cc535c47973e",
          "id": "687a980730b6cc535c47973e",
          "name": "Religious Stories",
          "slug": "religious-stories"
        },
        {
          "_id": "687a980730b6cc535c479743",
          "id": "687a980730b6cc535c479743",
          "name": "Sacred Texts",
          "slug": "sacred-texts"
        }
      ],
      "created_at": "2025-07-18T18:52:45.796Z",
      "updated_at": "2025-07-18T18:52:45.873Z"
    },
    "80": {
      "_id": "687a980630b6cc535c479725",
      "id": "687a980630b6cc535c479725",
      "name": "Spiritual Guides",
      "description": "High quality spiritual guides for religious and spiritual use",
      "slug": "spiritual-guides",
      "image": "/images/categories/spiritual-guides.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.764Z",
      "updated_at": "2025-07-18T18:52:54.880Z"
    },
    "81": {
      "_id": "687a980030b6cc535c47965d",
      "id": "687a980030b6cc535c47965d",
      "name": "Surya Murtis",
      "description": "High quality surya murtis for religious and spiritual use",
      "slug": "surya-murtis",
      "image": "/images/categories/surya-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:48.279Z",
      "updated_at": "2025-07-18T18:52:48.391Z"
    },
    "82": {
      "_id": "687a980e30b6cc535c47981a",
      "id": "687a980e30b6cc535c47981a",
      "name": "Table Cloth",
      "description": "High quality table cloth for religious and spiritual use",
      "slug": "table-cloth",
      "image": "/images/categories/table-cloth.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.523Z",
      "updated_at": "2025-07-18T18:53:02.640Z"
    },
    "83": {
      "_id": "687a980b30b6cc535c4797c5",
      "id": "687a980b30b6cc535c4797c5",
      "name": "Table Decorations",
      "description": "High quality table decorations for religious and spiritual use",
      "slug": "table-decorations",
      "image": "/images/categories/table-decorations.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.788Z",
      "updated_at": "2025-07-18T18:52:59.905Z"
    },
    "84": {
      "_id": "687a97fd30b6cc535c4795d8",
      "id": "687a97fd30b6cc535c4795d8",
      "name": "Temple Accessories",
      "description": "Premium temple accessories for spiritual and religious purposes",
      "slug": "temple-accessories",
      "image": "/images/categories/temple-accessories.jpg",
      "parent": null,
      "product_count": 0,
      "subcategories": [
        {
          "_id": "687a980330b6cc535c4796b2",
          "id": "687a980330b6cc535c4796b2",
          "name": "Temple Doors",
          "slug": "temple-doors"
        },
        {
          "_id": "687a980330b6cc535c4796b7",
          "id": "687a980330b6cc535c4796b7",
          "name": "Temple Pillars",
          "slug": "temple-pillars"
        },
        {
          "_id": "687a980330b6cc535c4796bc",
          "id": "687a980330b6cc535c4796bc",
          "name": "Temple Decorations",
          "slug": "temple-decorations"
        },
        {
          "_id": "687a980330b6cc535c4796c1",
          "id": "687a980330b6cc535c4796c1",
          "name": "Temple Curtains",
          "slug": "temple-curtains"
        },
        {
          "_id": "687a980330b6cc535c4796c6",
          "id": "687a980330b6cc535c4796c6",
          "name": "Temple Carpets",
          "slug": "temple-carpets"
        },
        {
          "_id": "687a980330b6cc535c4796cb",
          "id": "687a980330b6cc535c4796cb",
          "name": "Temple Lighting",
          "slug": "temple-lighting"
        },
        {
          "_id": "687a980430b6cc535c4796d0",
          "id": "687a980430b6cc535c4796d0",
          "name": "Temple Furniture",
          "slug": "temple-furniture"
        },
        {
          "_id": "687a980430b6cc535c4796d5",
          "id": "687a980430b6cc535c4796d5",
          "name": "Temple Storage",
          "slug": "temple-storage"
        },
        {
          "_id": "687a980430b6cc535c4796da",
          "id": "687a980430b6cc535c4796da",
          "name": "Temple Cleaning",
          "slug": "temple-cleaning"
        },
        {
          "_id": "687a980430b6cc535c4796df",
          "id": "687a980430b6cc535c4796df",
          "name": "Temple Security",
          "slug": "temple-security"
        },
        {
          "_id": "687a980430b6cc535c4796e4",
          "id": "687a980430b6cc535c4796e4",
          "name": "Temple Sound Systems",
          "slug": "temple-sound-systems"
        },
        {
          "_id": "687a980430b6cc535c4796e9",
          "id": "687a980430b6cc535c4796e9",
          "name": "Temple Clocks",
          "slug": "temple-clocks"
        },
        {
          "_id": "687a980530b6cc535c4796ee",
          "id": "687a980530b6cc535c4796ee",
          "name": "Temple Mirrors",
          "slug": "temple-mirrors"
        },
        {
          "_id": "687a980530b6cc535c4796f3",
          "id": "687a980530b6cc535c4796f3",
          "name": "Temple Paintings",
          "slug": "temple-paintings"
        },
        {
          "_id": "687a980530b6cc535c4796f8",
          "id": "687a980530b6cc535c4796f8",
          "name": "Temple Plants",
          "slug": "temple-plants"
        }
      ],
      "created_at": "2025-07-18T18:52:45.661Z",
      "updated_at": "2025-07-18T18:52:45.757Z"
    },
    "85": {
      "_id": "687a980330b6cc535c4796c6",
      "id": "687a980330b6cc535c4796c6",
      "name": "Temple Carpets",
      "description": "High quality temple carpets for religious and spiritual use",
      "slug": "temple-carpets",
      "image": "/images/categories/temple-carpets.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.788Z",
      "updated_at": "2025-07-18T18:52:51.910Z"
    },
    "86": {
      "_id": "687a980430b6cc535c4796da",
      "id": "687a980430b6cc535c4796da",
      "name": "Temple Cleaning",
      "description": "High quality temple cleaning for religious and spiritual use",
      "slug": "temple-cleaning",
      "image": "/images/categories/temple-cleaning.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.423Z",
      "updated_at": "2025-07-18T18:52:52.539Z"
    },
    "87": {
      "_id": "687a980430b6cc535c4796e9",
      "id": "687a980430b6cc535c4796e9",
      "name": "Temple Clocks",
      "description": "High quality temple clocks for religious and spiritual use",
      "slug": "temple-clocks",
      "image": "/images/categories/temple-clocks.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.893Z",
      "updated_at": "2025-07-18T18:52:53.009Z"
    },
    "88": {
      "_id": "687a980d30b6cc535c479806",
      "id": "687a980d30b6cc535c479806",
      "name": "Temple Cloth",
      "description": "High quality temple cloth for religious and spiritual use",
      "slug": "temple-cloth",
      "image": "/images/categories/temple-cloth.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:01.873Z",
      "updated_at": "2025-07-18T18:53:01.992Z"
    },
    "89": {
      "_id": "687a980330b6cc535c4796c1",
      "id": "687a980330b6cc535c4796c1",
      "name": "Temple Curtains",
      "description": "High quality temple curtains for religious and spiritual use",
      "slug": "temple-curtains",
      "image": "/images/categories/temple-curtains.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.634Z",
      "updated_at": "2025-07-18T18:52:51.747Z"
    },
    "90": {
      "_id": "687a980330b6cc535c4796bc",
      "id": "687a980330b6cc535c4796bc",
      "name": "Temple Decorations",
      "description": "High quality temple decorations for religious and spiritual use",
      "slug": "temple-decorations",
      "image": "/images/categories/temple-decorations.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.482Z",
      "updated_at": "2025-07-18T18:52:51.595Z"
    },
    "91": {
      "_id": "687a980330b6cc535c4796b2",
      "id": "687a980330b6cc535c4796b2",
      "name": "Temple Doors",
      "description": "High quality temple doors for religious and spiritual use",
      "slug": "temple-doors",
      "image": "/images/categories/temple-doors.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.177Z",
      "updated_at": "2025-07-18T18:52:51.293Z"
    },
    "92": {
      "_id": "687a980430b6cc535c4796d0",
      "id": "687a980430b6cc535c4796d0",
      "name": "Temple Furniture",
      "description": "High quality temple furniture for religious and spiritual use",
      "slug": "temple-furniture",
      "image": "/images/categories/temple-furniture.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.110Z",
      "updated_at": "2025-07-18T18:52:52.225Z"
    },
    "93": {
      "_id": "687a980730b6cc535c479748",
      "id": "687a980730b6cc535c479748",
      "name": "Temple Jewelry",
      "description": "High quality temple jewelry for religious and spiritual use",
      "slug": "temple-jewelry",
      "image": "/images/categories/temple-jewelry.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.858Z",
      "updated_at": "2025-07-18T18:52:55.972Z"
    },
    "94": {
      "_id": "687a980330b6cc535c4796cb",
      "id": "687a980330b6cc535c4796cb",
      "name": "Temple Lighting",
      "description": "High quality temple lighting for religious and spiritual use",
      "slug": "temple-lighting",
      "image": "/images/categories/temple-lighting.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.952Z",
      "updated_at": "2025-07-18T18:52:52.068Z"
    },
    "95": {
      "_id": "687a980530b6cc535c4796ee",
      "id": "687a980530b6cc535c4796ee",
      "name": "Temple Mirrors",
      "description": "High quality temple mirrors for religious and spiritual use",
      "slug": "temple-mirrors",
      "image": "/images/categories/temple-mirrors.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.050Z",
      "updated_at": "2025-07-18T18:52:53.164Z"
    },
    "96": {
      "_id": "687a980530b6cc535c4796f3",
      "id": "687a980530b6cc535c4796f3",
      "name": "Temple Paintings",
      "description": "High quality temple paintings for religious and spiritual use",
      "slug": "temple-paintings",
      "image": "/images/categories/temple-paintings.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.205Z",
      "updated_at": "2025-07-18T18:52:53.319Z"
    },
    "97": {
      "_id": "687a980330b6cc535c4796b7",
      "id": "687a980330b6cc535c4796b7",
      "name": "Temple Pillars",
      "description": "High quality temple pillars for religious and spiritual use",
      "slug": "temple-pillars",
      "image": "/images/categories/temple-pillars.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:51.332Z",
      "updated_at": "2025-07-18T18:52:51.443Z"
    },
    "98": {
      "_id": "687a980530b6cc535c4796f8",
      "id": "687a980530b6cc535c4796f8",
      "name": "Temple Plants",
      "description": "High quality temple plants for religious and spiritual use",
      "slug": "temple-plants",
      "image": "/images/categories/temple-plants.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:53.358Z",
      "updated_at": "2025-07-18T18:52:53.475Z"
    },
    "99": {
      "_id": "687a980430b6cc535c4796df",
      "id": "687a980430b6cc535c4796df",
      "name": "Temple Security",
      "description": "High quality temple security for religious and spiritual use",
      "slug": "temple-security",
      "image": "/images/categories/temple-security.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.581Z",
      "updated_at": "2025-07-18T18:52:52.696Z"
    },
    "100": {
      "_id": "687a980430b6cc535c4796e4",
      "id": "687a980430b6cc535c4796e4",
      "name": "Temple Sound Systems",
      "description": "High quality temple sound systems for religious and spiritual use",
      "slug": "temple-sound-systems",
      "image": "/images/categories/temple-sound-systems.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.738Z",
      "updated_at": "2025-07-18T18:52:52.853Z"
    },
    "101": {
      "_id": "687a980430b6cc535c4796d5",
      "id": "687a980430b6cc535c4796d5",
      "name": "Temple Storage",
      "description": "High quality temple storage for religious and spiritual use",
      "slug": "temple-storage",
      "image": "/images/categories/temple-storage.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795d8",
        "id": "687a97fd30b6cc535c4795d8",
        "name": "Temple Accessories",
        "slug": "temple-accessories"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:52.265Z",
      "updated_at": "2025-07-18T18:52:52.381Z"
    },
    "102": {
      "_id": "687bd930e67a1ae52cc8465c",
      "id": "687bd930e67a1ae52cc8465c",
      "name": "Test Category",
      "description": "Test category for system testing",
      "slug": "test-category",
      "parent": null,
      "product_count": 0,
      "subcategories": [],
      "created_at": "2025-07-19T17:43:12.301Z",
      "updated_at": "2025-07-19T17:43:12.382Z"
    },
    "103": {
      "_id": "687a980230b6cc535c47968f",
      "id": "687a980230b6cc535c47968f",
      "name": "Tilak & Kumkum",
      "description": "High quality tilak & kumkum for religious and spiritual use",
      "slug": "tilak-kumkum",
      "image": "/images/categories/tilak-&-kumkum.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795cc",
        "id": "687a97fd30b6cc535c4795cc",
        "name": "Puja Items",
        "slug": "puja-items"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:50.093Z",
      "updated_at": "2025-07-18T18:52:50.206Z"
    },
    "104": {
      "_id": "687a980930b6cc535c479789",
      "id": "687a980930b6cc535c479789",
      "name": "Toe Rings",
      "description": "High quality toe rings for religious and spiritual use",
      "slug": "toe-rings",
      "image": "/images/categories/toe-rings.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795ec",
        "id": "687a97fd30b6cc535c4795ec",
        "name": "Jewelry & Ornaments",
        "slug": "jewelry-ornaments"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:57.922Z",
      "updated_at": "2025-07-18T18:52:58.047Z"
    },
    "105": {
      "_id": "687a980e30b6cc535c47981f",
      "id": "687a980e30b6cc535c47981f",
      "name": "Towels",
      "description": "High quality towels for religious and spiritual use",
      "slug": "towels",
      "image": "/images/categories/towels.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795fd",
        "id": "687a97fe30b6cc535c4795fd",
        "name": "Clothing & Textiles",
        "slug": "clothing-textiles"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:53:02.698Z",
      "updated_at": "2025-07-18T18:53:02.815Z"
    },
    "106": {
      "_id": "687a980630b6cc535c479716",
      "id": "687a980630b6cc535c479716",
      "name": "Upanishads",
      "description": "High quality upanishads for religious and spiritual use",
      "slug": "upanishads",
      "image": "/images/categories/upanishads.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.290Z",
      "updated_at": "2025-07-18T18:52:54.409Z"
    },
    "107": {
      "_id": "687a980a30b6cc535c4797a2",
      "id": "687a980a30b6cc535c4797a2",
      "name": "Vases",
      "description": "High quality vases for religious and spiritual use",
      "slug": "vases",
      "image": "/images/categories/vases.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.713Z",
      "updated_at": "2025-07-18T18:52:58.827Z"
    },
    "108": {
      "_id": "687a980630b6cc535c479711",
      "id": "687a980630b6cc535c479711",
      "name": "Vedas",
      "description": "High quality vedas for religious and spiritual use",
      "slug": "vedas",
      "image": "/images/categories/vedas.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:54.134Z",
      "updated_at": "2025-07-18T18:52:54.249Z"
    },
    "109": {
      "_id": "687a97ff30b6cc535c479644",
      "id": "687a97ff30b6cc535c479644",
      "name": "Vishnu Murtis",
      "description": "High quality vishnu murtis for religious and spiritual use",
      "slug": "vishnu-murtis",
      "image": "/images/categories/vishnu-murtis.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795c0",
        "id": "687a97fd30b6cc535c4795c0",
        "name": "Hindu Deities",
        "slug": "hindu-deities"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:47.519Z",
      "updated_at": "2025-07-18T18:52:47.636Z"
    },
    "110": {
      "_id": "687a980a30b6cc535c479793",
      "id": "687a980a30b6cc535c479793",
      "name": "Wall Hangings",
      "description": "High quality wall hangings for religious and spiritual use",
      "slug": "wall-hangings",
      "image": "/images/categories/wall-hangings.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:58.242Z",
      "updated_at": "2025-07-18T18:52:58.357Z"
    },
    "111": {
      "_id": "687a980b30b6cc535c4797bb",
      "id": "687a980b30b6cc535c4797bb",
      "name": "Wind Chimes",
      "description": "High quality wind chimes for religious and spiritual use",
      "slug": "wind-chimes",
      "image": "/images/categories/wind-chimes.jpg",
      "parent": {
        "_id": "687a97fe30b6cc535c4795f5",
        "id": "687a97fe30b6cc535c4795f5",
        "name": "Home Decor",
        "slug": "home-decor"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:59.481Z",
      "updated_at": "2025-07-18T18:52:59.595Z"
    },
    "112": {
      "_id": "687a980730b6cc535c479734",
      "id": "687a980730b6cc535c479734",
      "name": "Yoga Books",
      "description": "High quality yoga books for religious and spiritual use",
      "slug": "yoga-books",
      "image": "/images/categories/yoga-books.jpg",
      "parent": {
        "_id": "687a97fd30b6cc535c4795e3",
        "id": "687a97fd30b6cc535c4795e3",
        "name": "Spiritual Books",
        "slug": "spiritual-books"
      },
      "product_count": 5,
      "subcategories": [],
      "created_at": "2025-07-18T18:52:55.236Z",
      "updated_at": "2025-07-18T18:52:55.350Z"
    },
    "categories": []
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:56.528Z",
    "request_id": "323d3126-4242-46af-96e2-340b189ac188",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 🛒 ORDERS APIS

### **1. Get All Orders**

- **Method:** GET
- **URL:** `{{base_url}}/orders?page=1&limit=5`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "total": 0,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:56.655Z",
    "request_id": "c782c3bf-8dac-4830-84bd-5186728b3055",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## ⚙️ BUSINESS SETTINGS APIS

### **1. Get Business Settings**

- **Method:** GET
- **URL:** `{{base_url}}/admin/business-settings`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Business settings retrieved successfully",
  "data": {
    "businessSettings": {
      "general": {
        "siteName": "Ghanshyam Murti Bhandar",
        "siteDescription": "Premium Religious Items & Spiritual Products",
        "siteUrl": "https://ghanshyammurti.com",
        "adminEmail": "admin@ghanshyammurti.com",
        "supportEmail": "support@ghanshyammurti.com",
        "contactPhone": "+91-9999999999",
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "language": "en",
        "maintenanceMode": false,
        "maintenanceMessage": "Site is under maintenance. Please check back later."
      },
      "business": {
        "companyAddress": {
          "street": "Shop Address",
          "city": "City",
          "state": "State",
          "postalCode": "000000",
          "country": "India"
        },
        "companyName": "Ghanshyam Murti Bhandar",
        "gstin": "09ABCDE1234F1Z5",
        "pan": "PAN_TO_BE_UPDATED",
        "businessType": "retail",
        "establishedYear": 2020
      },
      "tax": {
        "enableGST": true,
        "defaultGSTRate": 18,
        "companyGSTIN": "GSTIN_TO_BE_UPDATED",
        "enableTaxInclusive": false,
        "taxCalculationMethod": "exclusive",
        "enableReverseCharge": false,
        "tdsApplicable": false,
        "tdsRate": 0
      },
      "gst": {
        "companyGSTDetails": {
          "address": {
            "street": "Shop Address",
            "city": "City",
            "state": "State",
            "pincode": "000000",
            "country": "India"
          },
          "gstin": "29ABCDE1234F1Z5",
          "legalName": "Ghanshyam Murti Bhandar",
          "stateCode": "00",
          "gstType": "regular",
          "isActive": true
        },
        "taxRules": {
          "interStateTax": "IGST",
          "intraStateTax": "CGST_SGST",
          "reverseChargeThreshold": 0,
          "tdsApplicable": false,
          "tdsRate": 0,
          "tcsApplicable": false,
          "tcsRate": 0
        },
        "invoiceConfig": {
          "invoicePrefix": "INV",
          "invoiceNumberFormat": "YYYYMM####",
          "financialYearStart": 4,
          "dueDays": 30,
          "lateFeePercentage": 0
        },
        "complianceSettings": {
          "gstr1FilingFrequency": "monthly",
          "gstr3bFilingFrequency": "monthly",
          "annualReturnRequired": true,
          "auditRequired": false,
          "auditThreshold": 10000000
        },
        "ewayBillConfig": {
          "threshold": 50000,
          "isEnabled": true,
          "validityDays": 1
        },
        "_id": "687be1733d74eabe8ed1bc69",
        "gstRates": [
          {
            "rate": 0,
            "description": "Nil Rate",
            "applicableCategories": [],
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6a"
          },
          {
            "rate": 5,
            "description": "Essential Items",
            "applicableCategories": [],
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6b"
          },
          {
            "rate": 12,
            "description": "Standard Items",
            "applicableCategories": [],
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6c"
          },
          {
            "rate": 18,
            "description": "Most Items",
            "applicableCategories": [],
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6d"
          },
          {
            "rate": 28,
            "description": "Luxury Items",
            "applicableCategories": [],
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6e"
          }
        ],
        "hsnCodes": [
          {
            "code": "9999",
            "description": "Other miscellaneous items",
            "gstRate": 18,
            "isActive": true,
            "_id": "687be1733d74eabe8ed1bc6f"
          }
        ],
        "lastUpdated": "2025-07-19T18:18:27.813Z",
        "createdAt": "2025-07-19T18:18:27.815Z",
        "updatedAt": "2025-07-19T18:18:27.815Z",
        "__v": 0
      }
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:56.825Z",
    "request_id": "c998bdd3-fecd-4c9b-ae6a-b2b001d03bad",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---

### **2. Update Company Info**

- **Method:** PUT
- **URL:** `{{base_url}}/admin/business-settings/company`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Body (JSON):**
```json
{
  "companyName": "Ghanshyam Murti Bhandar",
  "gstin": "09ABCDE1234F1Z5",
  "contactPhone": "+91-9999999999"
}
```
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Company information updated successfully",
  "data": {
    "companyInfo": {
      "general": {
        "siteName": "Ghanshyam Murti Bhandar",
        "siteDescription": "Premium Religious Items & Spiritual Products",
        "siteUrl": "https://ghanshyammurti.com",
        "adminEmail": "admin@ghanshyammurti.com",
        "supportEmail": "support@ghanshyammurti.com",
        "contactPhone": "+91-9999999999",
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "language": "en",
        "maintenanceMode": false,
        "maintenanceMessage": "Site is under maintenance. Please check back later."
      },
      "business": {
        "companyAddress": {
          "street": "Shop Address",
          "city": "City",
          "state": "State",
          "postalCode": "000000",
          "country": "India"
        },
        "companyName": "Ghanshyam Murti Bhandar",
        "gstin": "09ABCDE1234F1Z5",
        "pan": "PAN_TO_BE_UPDATED",
        "businessType": "retail",
        "establishedYear": 2020
      }
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:56.997Z",
    "request_id": "f960ae7c-1e6b-4a30-ab3c-8a96b66d7a32",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 🚀 ADVANCED FEATURES APIS

### **1. Invoices**

- **Method:** GET
- **URL:** `{{base_url}}/invoices`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": {
    "invoices": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "total": 0,
      "hasNext": false,
      "hasPrev": false
    },
    "summary": {
      "totalInvoices": 0,
      "totalAmount": 0,
      "paidAmount": 0,
      "pendingAmount": 0
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:57.163Z",
    "request_id": "06deed16-6e3d-49e4-bf1c-5e257420f35e",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---

### **2. Suppliers**

- **Method:** GET
- **URL:** `{{base_url}}/suppliers`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": {
    "suppliers": [
      {
        "_id": "687bd94307b2b734740bcfec",
        "name": "Test Supplier Ltd",
        "code": "SUP0001",
        "type": "distributor",
        "contactInfo": {
          "primaryContact": {
            "name": "John Doe",
            "phone": "9876543210",
            "email": "john@testsupplier.com"
          },
          "alternateContact": {},
          "companyEmail": "info@testsupplier.com"
        },
        "defaultBillingAddress": {
          "type": "billing",
          "street": "123 Test Street",
          "city": "Test City",
          "state": "Test State",
          "country": "India",
          "postalCode": "123456",
          "isDefault": true,
          "_id": "687bd94307b2b734740bcfed",
          "id": "687bd94307b2b734740bcfed"
        },
        "defaultShippingAddress": {
          "type": "billing",
          "street": "123 Test Street",
          "city": "Test City",
          "state": "Test State",
          "country": "India",
          "postalCode": "123456",
          "isDefault": true,
          "_id": "687bd94307b2b734740bcfed",
          "id": "687bd94307b2b734740bcfed"
        },
        "businessInfo": {
          "gstin": "29ABCDE1234F1Z5",
          "pan": "ABCDE1234F",
          "businessType": "proprietorship"
        },
        "financialInfo": {
          "creditLimit": 0,
          "creditDays": 30,
          "currentBalance": 0,
          "totalPurchases": 0,
          "totalPayments": 0,
          "paymentTerms": "credit"
        },
        "outstandingBalance": 0,
        "performance": {
          "rating": 3,
          "onTimeDeliveryRate": 0,
          "qualityRating": 3,
          "totalOrders": 0,
          "completedOrders": 0,
          "cancelledOrders": 0,
          "averageLeadTime": 7
        },
        "performanceScore": 1.7999999999999998,
        "status": "active",
        "isApproved": true,
        "productCategories": [],
        "createdAt": "2025-07-19T17:43:31.125Z",
        "updatedAt": "2025-07-19T17:43:31.333Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "total": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:57.367Z",
    "request_id": "77c184db-3a22-4b5f-8ead-da9477a45853",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---

### **3. Inventory Dashboard**

- **Method:** GET
- **URL:** `{{base_url}}/inventory/dashboard`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Inventory dashboard retrieved successfully",
  "data": {
    "dashboard": {
      "summary": {
        "totalProducts": 0,
        "totalStock": 0,
        "totalValue": 0,
        "lowStockCount": 0,
        "outOfStockCount": 0,
        "reorderCount": 0
      },
      "lowStockItems": [],
      "reorderItems": [],
      "recentMovements": [],
      "statusDistribution": []
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:57.669Z",
    "request_id": "6c3c0bed-3277-4e92-9f8a-013374b7a5de",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---

### **4. Notifications**

- **Method:** GET
- **URL:** `{{base_url}}/notifications`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "total": 0,
      "hasNext": false,
      "hasPrev": false
    },
    "unreadCount": 0
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:57.841Z",
    "request_id": "b04f93c2-81da-499c-88df-175a6b5771db",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---

### **5. System Settings**

- **Method:** GET
- **URL:** `{{base_url}}/settings`
- **Headers:**
  - `Authorization: Bearer {{admin_token}}`
- **Expected Status:** 200
- **Expected Response:**
```json
{
  "success": true,
  "message": "System settings retrieved successfully",
  "data": {
    "settings": {
      "general": {
        "siteName": "Ghanshyam Murti Bhandar",
        "siteDescription": "Premium Religious Items & Spiritual Products",
        "siteUrl": "https://ghanshyammurti.com",
        "adminEmail": "admin@ghanshyammurti.com",
        "supportEmail": "support@ghanshyammurti.com",
        "contactPhone": "+91-9999999999",
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "language": "en",
        "maintenanceMode": false,
        "maintenanceMessage": "Site is under maintenance. Please check back later."
      },
      "business": {
        "companyAddress": {
          "street": "Shop Address",
          "city": "City",
          "state": "State",
          "postalCode": "000000",
          "country": "India"
        },
        "companyName": "Ghanshyam Murti Bhandar",
        "gstin": "09ABCDE1234F1Z5",
        "pan": "PAN_TO_BE_UPDATED",
        "businessType": "retail",
        "establishedYear": 2020
      },
      "order": {
        "orderPrefix": "ORD",
        "orderNumberFormat": "YYYYMM####",
        "minOrderAmount": 100,
        "maxOrderAmount": 50000,
        "autoConfirmOrders": false,
        "orderConfirmationTime": 24,
        "allowGuestCheckout": true,
        "requirePhoneVerification": false,
        "maxItemsPerOrder": 50,
        "orderCancellationWindow": 24
      },
      "payment": {
        "enableCOD": true,
        "enableOnlinePayment": true,
        "enableWalletPayment": true,
        "codCharges": 50,
        "codMinAmount": 0,
        "codMaxAmount": 10000,
        "paymentGateway": "razorpay",
        "autoRefundDays": 7,
        "walletCashbackPercentage": 1
      },
      "shipping": {
        "enableFreeShipping": true,
        "freeShippingMinAmount": 500,
        "defaultShippingCharge": 50,
        "expressShippingCharge": 100,
        "maxShippingWeight": 50,
        "shippingCalculationMethod": "weight",
        "enableShiprocket": true,
        "defaultCourierPartner": "auto",
        "packagingCharges": 0,
        "handlingCharges": 0
      },
      "inventory": {
        "enableStockManagement": true,
        "allowBackorders": false,
        "lowStockThreshold": 10,
        "outOfStockThreshold": 0,
        "enableStockAlerts": true,
        "stockAlertEmail": "inventory@ghanshyammurti.com",
        "autoUpdateStock": true,
        "reserveStockDuration": 30
      },
      "tax": {
        "enableGST": true,
        "defaultGSTRate": 18,
        "companyGSTIN": "GSTIN_TO_BE_UPDATED",
        "enableTaxInclusive": false,
        "taxCalculationMethod": "exclusive",
        "enableReverseCharge": false,
        "tdsApplicable": false,
        "tdsRate": 0
      },
      "notification": {
        "enableEmailNotifications": true,
        "enableSMSNotifications": true,
        "enablePushNotifications": true,
        "emailProvider": "smtp",
        "smsProvider": "twilio",
        "notificationRetryAttempts": 3,
        "notificationRetryDelay": 5,
        "adminNotificationEmail": "admin@ghanshyammurti.com"
      },
      "returnRefund": {
        "enableReturns": true,
        "returnWindow": 7,
        "enableExchanges": true,
        "exchangeWindow": 7,
        "autoApproveReturns": false,
        "returnShippingCharge": 0,
        "refundProcessingDays": 5,
        "enableStoreCredit": true,
        "storeCreditExpiry": 365
      },
      "security": {
        "enableTwoFactorAuth": false,
        "sessionTimeout": 30,
        "maxLoginAttempts": 5,
        "lockoutDuration": 15,
        "passwordMinLength": 8,
        "requirePasswordChange": false,
        "passwordChangeInterval": 90,
        "enableCaptcha": false
      },
      "seo": {
        "enableSEO": true,
        "defaultMetaTitle": "Ghanshyam Murti Bhandar - Religious Items",
        "defaultMetaDescription": "Premium religious items and spiritual products",
        "defaultMetaKeywords": "religious items, spiritual products, murti, pooja items",
        "enableSitemap": true,
        "enableRobotsTxt": true,
        "googleAnalyticsId": "",
        "googleTagManagerId": "",
        "facebookPixelId": ""
      },
      "socialMedia": {
        "socialMediaLinks": {
          "facebook": "",
          "instagram": "",
          "twitter": "",
          "youtube": "",
          "whatsapp": ""
        },
        "enableSocialLogin": false,
        "facebookAppId": "",
        "googleClientId": ""
      },
      "api": {
        "enableAPIAccess": true,
        "apiRateLimit": 1000,
        "enableAPILogging": true,
        "apiVersion": "v1",
        "enableWebhooks": true,
        "webhookRetryAttempts": 3
      },
      "backup": {
        "enableAutoBackup": true,
        "backupFrequency": "daily",
        "backupRetentionDays": 30,
        "backupLocation": "local",
        "enableCloudBackup": false,
        "cloudProvider": "aws"
      },
      "performance": {
        "enableCaching": true,
        "cacheExpiry": 3600,
        "enableCompression": true,
        "enableCDN": false,
        "cdnUrl": "",
        "maxFileUploadSize": 10,
        "enableImageOptimization": true
      },
      "features": {
        "enableWishlist": true,
        "enableReviews": true,
        "enableCoupons": true,
        "enableLoyaltyProgram": true,
        "enableReferralProgram": false,
        "enableMultiVendor": false,
        "enableSubscriptions": false,
        "enableAffiliateProgram": false
      },
      "lastUpdated": "2025-07-19T18:16:15.876Z",
      "version": "1.0.0"
    }
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-21T16:18:57.965Z",
    "request_id": "13c65980-6efc-4b39-87d9-7fa641d03268",
    "version": "1.0",
    "platform": "unknown"
  }
}
```

---


## 🎯 TESTING WORKFLOW

### **Step 1: Authentication** 🔐
1. **Admin Login**
   - Method: POST
   - URL: `{{base_url}}/auth/login`
   - Body: {"email": "admin@admin.com", "password": "Admin@123"}
   - Copy token from response
   - Set `admin_token` environment variable

2. **Verify Profile**
   - Method: GET
   - URL: `{{base_url}}/auth/profile`
   - Headers: Authorization: Bearer {{admin_token}}

### **Step 2: Dashboard Testing** 📊
1. **Quick Stats**
   - Method: GET
   - URL: `{{base_url}}/admin/dashboard/quick-stats`
   - Should show pending orders, low stock items, etc.

### **Step 3: Product Management** 📦
1. **Get Products**
   - Method: GET
   - URL: `{{base_url}}/products?page=1&limit=10`
   - Should return products with pagination

2. **Search Products**
   - Method: GET
   - URL: `{{base_url}}/products?search=iphone&page=1&limit=5`

### **Step 4: Category Management** 📁
1. **Get Categories**
   - Method: GET
   - URL: `{{base_url}}/categories`
   - Should return all categories

### **Step 5: Order Management** 🛒
1. **Get Orders**
   - Method: GET
   - URL: `{{base_url}}/orders?page=1&limit=10`
   - Should return orders with pagination

### **Step 6: Business Settings** ⚙️
1. **Get Settings**
   - Method: GET
   - URL: `{{base_url}}/admin/business-settings`

2. **Update Company Info**
   - Method: PUT
   - URL: `{{base_url}}/admin/business-settings/company`
   - Body: Company details JSON

### **Step 7: Advanced Features** 🚀
1. Test all advanced APIs:
   - Invoices
   - Suppliers
   - Inventory
   - Notifications
   - System Settings

---

## 📊 RESPONSE FORMAT

All APIs return responses in this standard format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Actual response data
  },
  "meta": {
    "timestamp": "2025-07-19T19:45:00.000Z",
    "request_id": "unique-id",
    "version": "1.0"
  }
}
```

---

## 🔍 TROUBLESHOOTING

### **Common Issues:**
1. **401 Unauthorized:** Token expired or invalid
   - Solution: Re-login and get new token

2. **429 Too Many Requests:** Rate limiting
   - Solution: Wait a few seconds between requests

3. **404 Not Found:** Endpoint doesn't exist
   - Solution: Check URL spelling and method

4. **500 Internal Server Error:** Server issue
   - Solution: Check server logs and database connection

---

## 🎯 SUCCESS CRITERIA

### **Authentication:** ✅
- Login returns JWT token
- Profile returns user details
- Token works for protected routes

### **Dashboard:** ✅
- Quick stats show real numbers
- Data is current and accurate

### **CRUD Operations:** ✅
- GET requests return data with pagination
- POST requests create new records
- PUT requests update existing records
- DELETE requests remove records

### **Business Settings:** ✅
- Settings can be retrieved
- Settings can be updated
- Changes are persisted

---

**🎯 READY FOR COMPLETE MANUAL TESTING! 🎯**

**Use this guide to test all APIs manually in Postman with real data and responses!**
