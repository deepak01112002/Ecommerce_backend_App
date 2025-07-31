# 🚀 API Quick Reference - Ghanshyam Murti Bhandar

## 🌐 Base URLs
- **Development:** `http://localhost:8080/api`
- **Production:** `https://server.ghanshyammurtibhandar.com/api`

---

## 📋 API ENDPOINTS SUMMARY

### 🔑 AUTHENTICATION (6 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | ❌ |
| POST | `/auth/login` | User login | ❌ |
| GET | `/auth/profile` | Get user profile | ✅ |
| PUT | `/auth/profile` | Update user profile | ✅ |
| PUT | `/users/change-password` | Change password | ✅ |
| POST | `/auth/logout` | User logout | ✅ |

### 📦 PRODUCTS (8 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with pagination, search, filters) | ❌ |
| GET | `/products/:id` | Get single product details | ❌ |
| GET | `/products/featured` | Get featured products | ❌ |
| GET | `/products/search?q=term` | Search products | ❌ |
| POST | `/products` | Create product (Admin) | ✅ Admin |
| PUT | `/products/:id` | Update product (Admin) | ✅ Admin |
| DELETE | `/products/:id` | Delete product (Admin) | ✅ Admin |
| PATCH | `/products/:id/toggle-status` | Toggle product status (Admin) | ✅ Admin |

### 📂 CATEGORIES (6 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | ❌ |
| GET | `/categories/:id` | Get single category | ❌ |
| POST | `/categories` | Create category (Admin) | ✅ Admin |
| PUT | `/categories/:id` | Update category (Admin) | ✅ Admin |
| DELETE | `/categories/:id` | Delete category (Admin) | ✅ Admin |
| GET | `/categories/:id/products` | Get products by category | ❌ |

### 📍 ADDRESSES (8 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/addresses` | Get all user addresses | ✅ |
| POST | `/addresses` | Add new address | ✅ |
| GET | `/addresses/:id` | Get single address | ✅ |
| PUT | `/addresses/:id` | Update address | ✅ |
| DELETE | `/addresses/:id` | Delete address | ✅ |
| PATCH | `/addresses/:id/default` | Set default address | ✅ |
| GET | `/addresses/default` | Get default address | ✅ |
| POST | `/addresses/:id/validate` | Validate address | ✅ |

### 🛒 CART (5 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user cart | ✅ |
| POST | `/cart/add` | Add product to cart | ✅ |
| PUT | `/cart/update` | Update cart item quantity | ✅ |
| DELETE | `/cart/remove/:productId` | Remove item from cart | ✅ |
| DELETE | `/cart/clear` | Clear entire cart | ✅ |

### 🛍️ ORDERS (6 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create new order | ✅ |
| GET | `/orders` | Get user orders | ✅ |
| GET | `/orders/:id` | Get single order details | ✅ |
| PATCH | `/orders/:id/cancel` | Cancel order | ✅ |
| GET | `/admin/orders` | Get all orders (Admin) | ✅ Admin |
| PATCH | `/admin/orders/:id/status` | Update order status (Admin) | ✅ Admin |

### 💳 PAYMENTS (4 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments/razorpay/create-order` | Create Razorpay order | ✅ |
| POST | `/payments/razorpay/verify` | Verify Razorpay payment | ✅ |
| POST | `/payments/cod/confirm` | Confirm COD order | ✅ |
| GET | `/payments/methods` | Get available payment methods | ❌ |

### 🚚 SHIPPING (4 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/shipping/calculate` | Calculate shipping rates | ✅ |
| GET | `/shipping/track/:awbCode` | Track shipment | ✅ |
| POST | `/shipping/create` | Create shipment (Admin) | ✅ Admin |
| POST | `/shipping/webhook` | Shiprocket webhook | ❌ |

### 👥 USER MANAGEMENT (5 APIs)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | Get all users (Admin) | ✅ Admin |
| GET | `/admin/users/:id` | Get single user (Admin) | ✅ Admin |
| PATCH | `/admin/users/:id/status` | Update user status (Admin) | ✅ Admin |
| PUT | `/users/profile` | Update user profile | ✅ |
| PUT | `/users/password` | Change password | ✅ |

---

## 🔐 AUTHENTICATION

### JWT Token Usage
```bash
# Include in headers for authenticated requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Admin vs User Access
- **User APIs:** Regular user authentication required
- **Admin APIs:** Admin role authentication required
- **Public APIs:** No authentication required

---

## 📝 REQUEST FORMATS

### JSON APIs
```bash
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

### File Upload APIs (Products/Categories)
```bash
Content-Type: multipart/form-data

# FormData with files and text fields
name: "Product Name"
price: "2999.99"
images: [File objects]
specifications: {...}
```

---

## 📊 RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field error message"
    }
  ],
  "statusCode": 400
}
```

---

## 🎯 KEY FEATURES

### ✅ Product Specifications
All product APIs now include comprehensive specifications:
- Material, Height, Width, Weight
- Finish, Origin, Color, Style
- Occasion, Care Instructions
- Additional custom specifications

### ✅ Multi-Address Support
- Multiple addresses per user
- Default address management
- Address validation
- Delivery instructions

### ✅ Payment Integration
- **Razorpay:** Online payments with verification
- **COD:** Cash on delivery support
- **Wallet:** Future wallet integration ready

### ✅ Shipping Integration
- **Shiprocket:** Automated shipping
- Real-time tracking
- Webhook updates
- Rate calculation

### ✅ Admin Panel Support
- Complete CRUD operations
- Order management
- User management
- Analytics data

---

## 🚀 TESTING

### Postman Collection
Import the complete Postman collection:
```
App_Backend/docs/Ghanshyam_Murti_Bhandar_APIs.postman_collection.json
```

### Test Credentials
```bash
# Admin Login
Email: admin@ghanshyambhandar.com
Password: admin123

# Test User
Email: test@example.com
Password: test123

# Razorpay Test
Key: rzp_test_4hUj1dxGbUR5wj
Secret: XMocVSZSaK57mZbfAXpsVNra
```

---

## 📈 API STATISTICS

- **Total APIs:** 50+
- **Authentication APIs:** 4
- **Product APIs:** 8
- **Category APIs:** 6
- **Address APIs:** 8
- **Cart APIs:** 5
- **Order APIs:** 6
- **Payment APIs:** 4
- **Shipping APIs:** 4
- **Admin APIs:** 15+

---

## 🔗 DOCUMENTATION LINKS

- **Complete API Documentation:** `COMPLETE_API_DOCUMENTATION.md`
- **Postman Collection:** `Ghanshyam_Murti_Bhandar_APIs.postman_collection.json`
- **Database Schema:** `DATABASE_SCHEMA.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

**🎯 All APIs are production-ready with proper validation, error handling, and response formatting!**
