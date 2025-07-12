# Ghanshyam Murti Bhandar - Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {...},
  "error": "Error message (if any)"
}
```

---

## Authentication Endpoints

### POST /auth/signup
Register a new user or admin.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user" // or "admin"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "<jwt_token>"
}
```

### POST /auth/login
Login user/admin.

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
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "<jwt_token>"
}
```

### GET /auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "addresses": [...],
  "wishlist": [...]
}
```

### PUT /auth/profile
Update current user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+1234567890"
}
```

---

## Product Endpoints

### GET /products
Get all products with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category ID
- `search` (string): Search in product name/description
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (price, name, rating, createdAt)
- `sortOrder` (string): asc or desc

**Response:**
```json
{
  "products": [...],
  "totalProducts": 100,
  "totalPages": 10,
  "currentPage": 1
}
```

### GET /products/:id
Get single product by ID.

**Response:**
```json
{
  "_id": "...",
  "name": "Product Name",
  "description": "Product description",
  "price": 999,
  "originalPrice": 1299,
  "images": ["path/to/image1.jpg"],
  "category": {
    "_id": "...",
    "name": "Category Name"
  },
  "variants": [...],
  "stock": 50,
  "rating": 4.5,
  "reviewCount": 25,
  "isActive": true
}
```

### POST /products (Admin only)
Create new product.

**Request Body (multipart/form-data):**
```
name: Product Name
description: Product description
price: 999
originalPrice: 1299
category: <category_id>
stock: 50
images: <file1>, <file2>
variants: JSON string of variants array
```

### PUT /products/:id (Admin only)
Update product.

### DELETE /products/:id (Admin only)
Delete product.

### PATCH /products/:id/inventory (Admin only)
Update product inventory.

**Request Body:**
```json
{
  "stock": 100
}
```

---

## Category Endpoints

### GET /categories
Get all categories.

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Electronics",
    "description": "Electronic items",
    "parent": null,
    "image": "path/to/image.jpg"
  }
]
```

### POST /categories (Admin only)
Create new category.

**Request Body (multipart/form-data):**
```
name: Category Name
description: Category description
parent: <parent_category_id> (optional)
image: <file>
```

### PUT /categories/:id (Admin only)
Update category.

### DELETE /categories/:id (Admin only)
Delete category.

---

## Cart Endpoints

### GET /cart
Get user's cart (supports both authenticated users and guests).

**Headers:**
- `Authorization: Bearer <token>` (for authenticated users)
- `guest-id: <guest_id>` (for guest users)

**Response:**
```json
{
  "items": [
    {
      "product": {...},
      "quantity": 2,
      "variant": "Red-M"
    }
  ],
  "total": 1998,
  "itemCount": 2
}
```

### POST /cart/add
Add item to cart.

**Request Body:**
```json
{
  "productId": "<product_id>",
  "quantity": 1,
  "variant": "Red-M"
}
```

### PUT /cart/item/:itemId
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /cart/item/:itemId
Remove item from cart.

### DELETE /cart/clear
Clear entire cart.

### POST /cart/merge (Authenticated users only)
Merge guest cart with user cart after login.

**Request Body:**
```json
{
  "guestId": "<guest_id>"
}
```

---

## Wishlist Endpoints (Authenticated users only)

### GET /wishlist
Get user's wishlist.

### POST /wishlist/add
Add item to wishlist.

**Request Body:**
```json
{
  "productId": "<product_id>"
}
```

### DELETE /wishlist/remove/:productId
Remove item from wishlist.

### DELETE /wishlist/clear
Clear wishlist.

### GET /wishlist/check/:productId
Check if product is in wishlist.

---

## Order Endpoints

### POST /orders
Create order from cart.

**Request Body:**
```json
{
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "postalCode": "12345",
    "country": "Country"
  },
  "paymentInfo": {
    "method": "razorpay"
  }
}
```

### GET /orders/my-orders (Authenticated users only)
Get user's orders.

**Query Parameters:**
- `page`, `limit`, `status`

### GET /orders/:orderId
Get single order details.

### PATCH /orders/:orderId/cancel (Authenticated users only)
Cancel order.

### GET /orders (Admin only)
Get all orders.

### PUT /orders/:id (Admin only)
Update order status.

**Request Body:**
```json
{
  "status": "shipped"
}
```

---

## Review Endpoints

### GET /reviews/product/:productId
Get reviews for a product.

**Query Parameters:**
- `page`, `limit`, `sortBy`, `sortOrder`

### POST /reviews (Authenticated users only)
Add product review.

**Request Body (multipart/form-data):**
```
productId: <product_id>
rating: 5
comment: Great product!
images: <file1>, <file2>
```

### PUT /reviews/:reviewId (Authenticated users only)
Update review.

### DELETE /reviews/:reviewId (Authenticated users only)
Delete review.

### POST /reviews/:reviewId/helpful
Mark review as helpful.

### POST /reviews/:reviewId/report
Report review.

### PATCH /reviews/:reviewId/visibility (Admin only)
Hide/unhide review.

---

## User Management Endpoints

### GET /users/addresses (Authenticated users only)
Get user addresses.

### POST /users/addresses (Authenticated users only)
Add new address.

### PUT /users/addresses/:addressId (Authenticated users only)
Update address.

### DELETE /users/addresses/:addressId (Authenticated users only)
Delete address.

### PUT /users/change-password (Authenticated users only)
Change password.

**Request Body:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### GET /users (Admin only)
Get all users.

### GET /users/:userId (Admin only)
Get user by ID.

### PUT /users/:userId (Admin only)
Update user.

### DELETE /users/:userId (Admin only)
Delete user.

---

## Payment Endpoints

### POST /payments/create-order
Create Razorpay order.

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "order_123"
}
```

### POST /payments/verify
Verify Razorpay payment.

**Request Body:**
```json
{
  "razorpay_order_id": "...",
  "razorpay_payment_id": "...",
  "razorpay_signature": "...",
  "order_id": "<our_order_id>"
}
```

### POST /payments/failure
Handle payment failure.

### GET /payments/details/:paymentId (Authenticated users only)
Get payment details.

### POST /payments/refund (Admin only)
Refund payment.

### POST /payments/webhook
Razorpay webhook handler.

---

## Coupon Endpoints

### POST /coupons/validate
Validate coupon code.

**Request Body:**
```json
{
  "code": "SAVE20",
  "orderAmount": 1000,
  "cartItems": [...]
}
```

### POST /coupons/apply
Apply coupon (increment usage count).

### GET /coupons (Admin only)
Get all coupons.

### POST /coupons (Admin only)
Create coupon.

### PUT /coupons/:couponId (Admin only)
Update coupon.

### DELETE /coupons/:couponId (Admin only)
Delete coupon.

---

## Admin Dashboard Endpoints

### GET /admin/stats (Admin only)
Get dashboard statistics.

**Response:**
```json
{
  "productCount": 150,
  "categoryCount": 12,
  "orderCount": 500,
  "userCount": 250,
  "totalSales": 125000
}
```

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## File Upload

Supported image formats: JPEG, PNG, GIF, WebP
Maximum file size: 5MB per file
Upload endpoints automatically handle file validation and storage.
