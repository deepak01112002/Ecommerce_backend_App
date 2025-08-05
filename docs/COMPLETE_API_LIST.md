# 🎯 COMPLETE API LIST - GHANSHYAM ECOMMERCE BACKEND

## 📊 Overview
This document contains ALL API endpoints available in the Ghanshyam Ecommerce Backend system.

**Base URL:** `http://localhost:8080`

---

## 📋 API ENDPOINTS BY CATEGORY


## 🔐 Authentication (5 endpoints)
**Base Path:** `/api/auth`

### 1. POST /api/auth/register
- **Method:** POST
- **Endpoint:** `/api/auth/register`
- **Description:** User registration

### 2. POST /api/auth/signup
- **Method:** POST
- **Endpoint:** `/api/auth/signup`
- **Description:** User signup

### 3. POST /api/auth/login
- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Description:** User login

### 4. GET /api/auth/profile
- **Method:** GET
- **Endpoint:** `/api/auth/profile`
- **Description:** Get user profile

### 5. PUT /api/auth/profile
- **Method:** PUT
- **Endpoint:** `/api/auth/profile`
- **Description:** Update user profile

---


## 👥 User Management (9 endpoints)
**Base Path:** `/api/users`

### 1. POST /api/users/addresses
- **Method:** POST
- **Endpoint:** `/api/users/addresses`
- **Description:** Create users data

### 2. GET /api/users/addresses
- **Method:** GET
- **Endpoint:** `/api/users/addresses`
- **Description:** Retrieve users data

### 3. PUT /api/users/addresses/:addressId
- **Method:** PUT
- **Endpoint:** `/api/users/addresses/:addressId`
- **Description:** Update users data

### 4. DELETE /api/users/addresses/:addressId
- **Method:** DELETE
- **Endpoint:** `/api/users/addresses/:addressId`
- **Description:** Remove users data

### 5. PUT /api/users/change-password
- **Method:** PUT
- **Endpoint:** `/api/users/change-password`
- **Description:** Update users data

### 6. GET /api/users/
- **Method:** GET
- **Endpoint:** `/api/users/`
- **Description:** Get all items with pagination and filtering

### 7. GET /api/users/:userId
- **Method:** GET
- **Endpoint:** `/api/users/:userId`
- **Description:** Retrieve users data

### 8. PUT /api/users/:userId
- **Method:** PUT
- **Endpoint:** `/api/users/:userId`
- **Description:** Update users data

### 9. DELETE /api/users/:userId
- **Method:** DELETE
- **Endpoint:** `/api/users/:userId`
- **Description:** Remove users data

---


## 📦 Product Management (10 endpoints)
**Base Path:** `/api/products`

### 1. GET /api/products/featured
- **Method:** GET
- **Endpoint:** `/api/products/featured`
- **Description:** Get featured items

### 2. GET /api/products/search
- **Method:** GET
- **Endpoint:** `/api/products/search`
- **Description:** Search items

### 3. GET /api/products/
- **Method:** GET
- **Endpoint:** `/api/products/`
- **Description:** Get all items with pagination and filtering

### 4. GET /api/products/:id
- **Method:** GET
- **Endpoint:** `/api/products/:id`
- **Description:** Get single item by ID

### 5. POST /api/products/
- **Method:** POST
- **Endpoint:** `/api/products/`
- **Description:** Create new item

### 6. PUT /api/products/:id
- **Method:** PUT
- **Endpoint:** `/api/products/:id`
- **Description:** Update item by ID

### 7. DELETE /api/products/:id
- **Method:** DELETE
- **Endpoint:** `/api/products/:id`
- **Description:** Delete item by ID

### 8. DELETE /api/products/:id/permanent
- **Method:** DELETE
- **Endpoint:** `/api/products/:id/permanent`
- **Description:** Remove products data

### 9. PATCH /api/products/:id/inventory
- **Method:** PATCH
- **Endpoint:** `/api/products/:id/inventory`
- **Description:** Modify products data

### 10. POST /api/products/bulk-upload
- **Method:** POST
- **Endpoint:** `/api/products/bulk-upload`
- **Description:** Create products data

---


## 📁 Category Management (9 endpoints)
**Base Path:** `/api/categories`

### 1. GET /api/categories/tree
- **Method:** GET
- **Endpoint:** `/api/categories/tree`
- **Description:** Retrieve categories data

### 2. GET /api/categories/featured
- **Method:** GET
- **Endpoint:** `/api/categories/featured`
- **Description:** Get featured items

### 3. GET /api/categories/search
- **Method:** GET
- **Endpoint:** `/api/categories/search`
- **Description:** Search items

### 4. GET /api/categories/breadcrumb/:slug
- **Method:** GET
- **Endpoint:** `/api/categories/breadcrumb/:slug`
- **Description:** Retrieve categories data

### 5. GET /api/categories/
- **Method:** GET
- **Endpoint:** `/api/categories/`
- **Description:** Get all items with pagination and filtering

### 6. GET /api/categories/:id
- **Method:** GET
- **Endpoint:** `/api/categories/:id`
- **Description:** Get single item by ID

### 7. POST /api/categories/
- **Method:** POST
- **Endpoint:** `/api/categories/`
- **Description:** Create new item

### 8. PUT /api/categories/:id
- **Method:** PUT
- **Endpoint:** `/api/categories/:id`
- **Description:** Update item by ID

### 9. DELETE /api/categories/:id
- **Method:** DELETE
- **Endpoint:** `/api/categories/:id`
- **Description:** Delete item by ID

---


## 🛒 Shopping Cart (7 endpoints)
**Base Path:** `/api/cart`

### 1. GET /api/cart/
- **Method:** GET
- **Endpoint:** `/api/cart/`
- **Description:** Get all items with pagination and filtering

### 2. POST /api/cart/add
- **Method:** POST
- **Endpoint:** `/api/cart/add`
- **Description:** Add new item

### 3. PUT /api/cart/item/:itemId
- **Method:** PUT
- **Endpoint:** `/api/cart/item/:itemId`
- **Description:** Update cart data

### 4. PUT /api/cart/update
- **Method:** PUT
- **Endpoint:** `/api/cart/update`
- **Description:** Update cart data

### 5. DELETE /api/cart/item/:itemId
- **Method:** DELETE
- **Endpoint:** `/api/cart/item/:itemId`
- **Description:** Remove cart data

### 6. DELETE /api/cart/clear
- **Method:** DELETE
- **Endpoint:** `/api/cart/clear`
- **Description:** Remove cart data

### 7. POST /api/cart/merge
- **Method:** POST
- **Endpoint:** `/api/cart/merge`
- **Description:** Create cart data

---


## ❤️ Wishlist (5 endpoints)
**Base Path:** `/api/wishlist`

### 1. GET /api/wishlist/
- **Method:** GET
- **Endpoint:** `/api/wishlist/`
- **Description:** Get all items with pagination and filtering

### 2. POST /api/wishlist/add
- **Method:** POST
- **Endpoint:** `/api/wishlist/add`
- **Description:** Add new item

### 3. DELETE /api/wishlist/remove/:productId
- **Method:** DELETE
- **Endpoint:** `/api/wishlist/remove/:productId`
- **Description:** Remove wishlist data

### 4. DELETE /api/wishlist/clear
- **Method:** DELETE
- **Endpoint:** `/api/wishlist/clear`
- **Description:** Remove wishlist data

### 5. GET /api/wishlist/check/:productId
- **Method:** GET
- **Endpoint:** `/api/wishlist/check/:productId`
- **Description:** Retrieve wishlist data

---


## ⭐ Reviews & Ratings (8 endpoints)
**Base Path:** `/api/reviews`

### 1. GET /api/reviews/
- **Method:** GET
- **Endpoint:** `/api/reviews/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/reviews/product/:productId
- **Method:** GET
- **Endpoint:** `/api/reviews/product/:productId`
- **Description:** Retrieve reviews data

### 3. POST /api/reviews/
- **Method:** POST
- **Endpoint:** `/api/reviews/`
- **Description:** Create new item

### 4. PUT /api/reviews/:reviewId
- **Method:** PUT
- **Endpoint:** `/api/reviews/:reviewId`
- **Description:** Update reviews data

### 5. DELETE /api/reviews/:reviewId
- **Method:** DELETE
- **Endpoint:** `/api/reviews/:reviewId`
- **Description:** Remove reviews data

### 6. POST /api/reviews/:reviewId/helpful
- **Method:** POST
- **Endpoint:** `/api/reviews/:reviewId/helpful`
- **Description:** Create reviews data

### 7. POST /api/reviews/:reviewId/report
- **Method:** POST
- **Endpoint:** `/api/reviews/:reviewId/report`
- **Description:** Create reviews data

### 8. PATCH /api/reviews/:reviewId/visibility
- **Method:** PATCH
- **Endpoint:** `/api/reviews/:reviewId/visibility`
- **Description:** Modify reviews data

---


## 📋 Order Management (15 endpoints)
**Base Path:** `/api/orders`

### 1. POST /api/orders/
- **Method:** POST
- **Endpoint:** `/api/orders/`
- **Description:** Create new item

### 2. GET /api/orders/
- **Method:** GET
- **Endpoint:** `/api/orders/`
- **Description:** Get all items with pagination and filtering

### 3. GET /api/orders/my-orders
- **Method:** GET
- **Endpoint:** `/api/orders/my-orders`
- **Description:** Retrieve orders data

### 4. GET /api/orders/test
- **Method:** GET
- **Endpoint:** `/api/orders/test`
- **Description:** Retrieve orders data

### 5. GET /api/orders/admin/all
- **Method:** GET
- **Endpoint:** `/api/orders/admin/all`
- **Description:** Retrieve orders data

### 6. GET /api/orders/admin/delivery-options
- **Method:** GET
- **Endpoint:** `/api/orders/admin/delivery-options`
- **Description:** Retrieve orders data

### 7. GET /api/orders/admin/by-delivery-method
- **Method:** GET
- **Endpoint:** `/api/orders/admin/by-delivery-method`
- **Description:** Retrieve orders data

### 8. GET /api/orders/admin/pending-delivery-assignment
- **Method:** GET
- **Endpoint:** `/api/orders/admin/pending-delivery-assignment`
- **Description:** Retrieve orders data

### 9. PUT /api/orders/admin/bulk-delivery-method
- **Method:** PUT
- **Endpoint:** `/api/orders/admin/bulk-delivery-method`
- **Description:** Update orders data

### 10. PUT /api/orders/admin/:orderId/delivery-method
- **Method:** PUT
- **Endpoint:** `/api/orders/admin/:orderId/delivery-method`
- **Description:** Update orders data

### 11. PUT /api/orders/admin/:id
- **Method:** PUT
- **Endpoint:** `/api/orders/admin/:id`
- **Description:** Update orders data

### 12. PATCH /api/orders/admin/:id/status
- **Method:** PATCH
- **Endpoint:** `/api/orders/admin/:id/status`
- **Description:** Modify orders data

### 13. GET /api/orders/:orderId
- **Method:** GET
- **Endpoint:** `/api/orders/:orderId`
- **Description:** Retrieve orders data

### 14. GET /api/orders/:orderId/track
- **Method:** GET
- **Endpoint:** `/api/orders/:orderId/track`
- **Description:** Retrieve orders data

### 15. PATCH /api/orders/:orderId/cancel
- **Method:** PATCH
- **Endpoint:** `/api/orders/:orderId/cancel`
- **Description:** Modify orders data

---


## 🎫 Coupon System (7 endpoints)
**Base Path:** `/api/coupons`

### 1. POST /api/coupons/validate
- **Method:** POST
- **Endpoint:** `/api/coupons/validate`
- **Description:** Create coupons data

### 2. POST /api/coupons/apply
- **Method:** POST
- **Endpoint:** `/api/coupons/apply`
- **Description:** Create coupons data

### 3. GET /api/coupons/
- **Method:** GET
- **Endpoint:** `/api/coupons/`
- **Description:** Get all items with pagination and filtering

### 4. GET /api/coupons/admin
- **Method:** GET
- **Endpoint:** `/api/coupons/admin`
- **Description:** Retrieve coupons data

### 5. POST /api/coupons/
- **Method:** POST
- **Endpoint:** `/api/coupons/`
- **Description:** Create new item

### 6. PUT /api/coupons/:couponId
- **Method:** PUT
- **Endpoint:** `/api/coupons/:couponId`
- **Description:** Update coupons data

### 7. DELETE /api/coupons/:couponId
- **Method:** DELETE
- **Endpoint:** `/api/coupons/:couponId`
- **Description:** Remove coupons data

---


## 💳 Payment Processing (10 endpoints)
**Base Path:** `/api/payments`

### 1. GET /api/payments/methods
- **Method:** GET
- **Endpoint:** `/api/payments/methods`
- **Description:** Retrieve payments data

### 2. POST /api/payments/create
- **Method:** POST
- **Endpoint:** `/api/payments/create`
- **Description:** Create new item

### 3. POST /api/payments/create-order
- **Method:** POST
- **Endpoint:** `/api/payments/create-order`
- **Description:** Create payments data

### 4. POST /api/payments/verify
- **Method:** POST
- **Endpoint:** `/api/payments/verify`
- **Description:** Create payments data

### 5. POST /api/payments/failure
- **Method:** POST
- **Endpoint:** `/api/payments/failure`
- **Description:** Create payments data

### 6. POST /api/payments/confirm-cod
- **Method:** POST
- **Endpoint:** `/api/payments/confirm-cod`
- **Description:** Create payments data

### 7. GET /api/payments/details/:paymentId
- **Method:** GET
- **Endpoint:** `/api/payments/details/:paymentId`
- **Description:** Retrieve payments data

### 8. GET /api/payments/:paymentId
- **Method:** GET
- **Endpoint:** `/api/payments/:paymentId`
- **Description:** Retrieve payments data

### 9. POST /api/payments/refund
- **Method:** POST
- **Endpoint:** `/api/payments/refund`
- **Description:** Create payments data

### 10. POST /api/payments/webhook
- **Method:** POST
- **Endpoint:** `/api/payments/webhook`
- **Description:** Create payments data

---


## 📊 Admin Dashboard (1 endpoints)
**Base Path:** `/api/admin`

### 1. GET /api/admin/stats
- **Method:** GET
- **Endpoint:** `/api/admin/stats`
- **Description:** Get statistics

---


## 📈 Admin Dashboard Advanced (2 endpoints)
**Base Path:** `/api/admin/dashboard`

### 1. GET /api/admin/dashboard/
- **Method:** GET
- **Endpoint:** `/api/admin/dashboard/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/admin/dashboard/quick-stats
- **Method:** GET
- **Endpoint:** `/api/admin/dashboard/quick-stats`
- **Description:** Retrieve dashboard data

---


## ⚙️ Admin Management (11 endpoints)
**Base Path:** `/api/admin/management`

### 1. GET /api/admin/management/users
- **Method:** GET
- **Endpoint:** `/api/admin/management/users`
- **Description:** Retrieve management data

### 2. GET /api/admin/management/users/:id
- **Method:** GET
- **Endpoint:** `/api/admin/management/users/:id`
- **Description:** Retrieve management data

### 3. PATCH /api/admin/management/users/:id/status
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/users/:id/status`
- **Description:** Modify management data

### 4. POST /api/admin/management/users/admin
- **Method:** POST
- **Endpoint:** `/api/admin/management/users/admin`
- **Description:** Create management data

### 5. PATCH /api/admin/management/orders/:id/status
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/orders/:id/status`
- **Description:** Modify management data

### 6. PATCH /api/admin/management/products/:id/toggle-status
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/products/:id/toggle-status`
- **Description:** Modify management data

### 7. PATCH /api/admin/management/products/:id/stock
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/products/:id/stock`
- **Description:** Modify management data

### 8. PATCH /api/admin/management/categories/:id/toggle-status
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/categories/:id/toggle-status`
- **Description:** Modify management data

### 9. PATCH /api/admin/management/coupons/:id/toggle-status
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/coupons/:id/toggle-status`
- **Description:** Modify management data

### 10. GET /api/admin/management/system/overview
- **Method:** GET
- **Endpoint:** `/api/admin/management/system/overview`
- **Description:** Retrieve management data

### 11. PATCH /api/admin/management/system/maintenance
- **Method:** PATCH
- **Endpoint:** `/api/admin/management/system/maintenance`
- **Description:** Modify management data

---


## 🏢 Business Settings (10 endpoints)
**Base Path:** `/api/admin/business-settings`

### 1. GET /api/admin/business-settings/
- **Method:** GET
- **Endpoint:** `/api/admin/business-settings/`
- **Description:** Get all items with pagination and filtering

### 2. PUT /api/admin/business-settings/company
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/company`
- **Description:** Update business-settings data

### 3. PUT /api/admin/business-settings/gst
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/gst`
- **Description:** Update business-settings data

### 4. PUT /api/admin/business-settings/orders
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/orders`
- **Description:** Update business-settings data

### 5. PUT /api/admin/business-settings/payments
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/payments`
- **Description:** Update business-settings data

### 6. PUT /api/admin/business-settings/shipping
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/shipping`
- **Description:** Update business-settings data

### 7. PUT /api/admin/business-settings/inventory
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/inventory`
- **Description:** Update business-settings data

### 8. PUT /api/admin/business-settings/returns
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/returns`
- **Description:** Update business-settings data

### 9. PUT /api/admin/business-settings/notifications
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/notifications`
- **Description:** Update business-settings data

### 10. PUT /api/admin/business-settings/features
- **Method:** PUT
- **Endpoint:** `/api/admin/business-settings/features`
- **Description:** Update business-settings data

---


## 📍 Address Management (8 endpoints)
**Base Path:** `/api/addresses`

### 1. GET /api/addresses/
- **Method:** GET
- **Endpoint:** `/api/addresses/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/addresses/default
- **Method:** GET
- **Endpoint:** `/api/addresses/default`
- **Description:** Retrieve addresses data

### 3. GET /api/addresses/:id
- **Method:** GET
- **Endpoint:** `/api/addresses/:id`
- **Description:** Get single item by ID

### 4. POST /api/addresses/
- **Method:** POST
- **Endpoint:** `/api/addresses/`
- **Description:** Create new item

### 5. PUT /api/addresses/:id
- **Method:** PUT
- **Endpoint:** `/api/addresses/:id`
- **Description:** Update item by ID

### 6. PATCH /api/addresses/:id/default
- **Method:** PATCH
- **Endpoint:** `/api/addresses/:id/default`
- **Description:** Modify addresses data

### 7. DELETE /api/addresses/:id
- **Method:** DELETE
- **Endpoint:** `/api/addresses/:id`
- **Description:** Delete item by ID

### 8. POST /api/addresses/:id/validate
- **Method:** POST
- **Endpoint:** `/api/addresses/:id/validate`
- **Description:** Create addresses data

---


## 💰 Wallet System (8 endpoints)
**Base Path:** `/api/wallet`

### 1. GET /api/wallet/
- **Method:** GET
- **Endpoint:** `/api/wallet/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/wallet/balance
- **Method:** GET
- **Endpoint:** `/api/wallet/balance`
- **Description:** Retrieve wallet data

### 3. POST /api/wallet/add-money
- **Method:** POST
- **Endpoint:** `/api/wallet/add-money`
- **Description:** Create wallet data

### 4. POST /api/wallet/check-balance
- **Method:** POST
- **Endpoint:** `/api/wallet/check-balance`
- **Description:** Create wallet data

### 5. POST /api/wallet/process-payment
- **Method:** POST
- **Endpoint:** `/api/wallet/process-payment`
- **Description:** Create wallet data

### 6. GET /api/wallet/transactions
- **Method:** GET
- **Endpoint:** `/api/wallet/transactions`
- **Description:** Retrieve wallet data

### 7. GET /api/wallet/transactions/summary
- **Method:** GET
- **Endpoint:** `/api/wallet/transactions/summary`
- **Description:** Retrieve wallet data

### 8. GET /api/wallet/transactions/:id
- **Method:** GET
- **Endpoint:** `/api/wallet/transactions/:id`
- **Description:** Retrieve wallet data

---


## 🚚 Shipping Management (13 endpoints)
**Base Path:** `/api/shipping`

### 1. POST /api/shipping/webhook/shiprocket
- **Method:** POST
- **Endpoint:** `/api/shipping/webhook/shiprocket`
- **Description:** Create shipping data

### 2. POST /api/shipping/check-serviceability
- **Method:** POST
- **Endpoint:** `/api/shipping/check-serviceability`
- **Description:** Create shipping data

### 3. GET /api/shipping/delivery-options
- **Method:** GET
- **Endpoint:** `/api/shipping/delivery-options`
- **Description:** Retrieve shipping data

### 4. GET /api/shipping/my-shipments
- **Method:** GET
- **Endpoint:** `/api/shipping/my-shipments`
- **Description:** Retrieve shipping data

### 5. GET /api/shipping/track/:awbCode
- **Method:** GET
- **Endpoint:** `/api/shipping/track/:awbCode`
- **Description:** Retrieve shipping data

### 6. GET /api/shipping/:id
- **Method:** GET
- **Endpoint:** `/api/shipping/:id`
- **Description:** Get single item by ID

### 7. GET /api/shipping/
- **Method:** GET
- **Endpoint:** `/api/shipping/`
- **Description:** Get all items with pagination and filtering

### 8. POST /api/shipping/orders/:orderId/create-shipment
- **Method:** POST
- **Endpoint:** `/api/shipping/orders/:orderId/create-shipment`
- **Description:** Create shipping data

### 9. POST /api/shipping/orders/:orderId/create-shipment-v2
- **Method:** POST
- **Endpoint:** `/api/shipping/orders/:orderId/create-shipment-v2`
- **Description:** Create shipping data

### 10. PATCH /api/shipping/:id/cancel
- **Method:** PATCH
- **Endpoint:** `/api/shipping/:id/cancel`
- **Description:** Modify shipping data

### 11. POST /api/shipping/generate-pickup
- **Method:** POST
- **Endpoint:** `/api/shipping/generate-pickup`
- **Description:** Create shipping data

### 12. POST /api/shipping/generate-labels
- **Method:** POST
- **Endpoint:** `/api/shipping/generate-labels`
- **Description:** Create shipping data

### 13. GET /api/shipping/analytics/summary
- **Method:** GET
- **Endpoint:** `/api/shipping/analytics/summary`
- **Description:** Retrieve shipping data

---


## 🧾 Invoice System (11 endpoints)
**Base Path:** `/api/invoices`

### 1. POST /api/invoices/generate/:orderId
- **Method:** POST
- **Endpoint:** `/api/invoices/generate/:orderId`
- **Description:** Create invoices data

### 2. GET /api/invoices/
- **Method:** GET
- **Endpoint:** `/api/invoices/`
- **Description:** Get all items with pagination and filtering

### 3. GET /api/invoices/analytics
- **Method:** GET
- **Endpoint:** `/api/invoices/analytics`
- **Description:** Retrieve invoices data

### 4. GET /api/invoices/:id
- **Method:** GET
- **Endpoint:** `/api/invoices/:id`
- **Description:** Get single item by ID

### 5. PUT /api/invoices/:id
- **Method:** PUT
- **Endpoint:** `/api/invoices/:id`
- **Description:** Update item by ID

### 6. PATCH /api/invoices/:id/mark-paid
- **Method:** PATCH
- **Endpoint:** `/api/invoices/:id/mark-paid`
- **Description:** Modify invoices data

### 7. PATCH /api/invoices/:id/cancel
- **Method:** PATCH
- **Endpoint:** `/api/invoices/:id/cancel`
- **Description:** Modify invoices data

### 8. GET /api/invoices/:id/pdf
- **Method:** GET
- **Endpoint:** `/api/invoices/:id/pdf`
- **Description:** Retrieve invoices data

### 9. POST /api/invoices/enhanced/generate/:orderId
- **Method:** POST
- **Endpoint:** `/api/invoices/enhanced/generate/:orderId`
- **Description:** Create invoices data

### 10. GET /api/invoices/enhanced/all
- **Method:** GET
- **Endpoint:** `/api/invoices/enhanced/all`
- **Description:** Retrieve invoices data

### 11. GET /api/invoices/enhanced/:id
- **Method:** GET
- **Endpoint:** `/api/invoices/enhanced/:id`
- **Description:** Retrieve invoices data

---


## 📄 GST Management (11 endpoints)
**Base Path:** `/api/gst`

### 1. GET /api/gst/config
- **Method:** GET
- **Endpoint:** `/api/gst/config`
- **Description:** Retrieve gst data

### 2. POST /api/gst/calculate
- **Method:** POST
- **Endpoint:** `/api/gst/calculate`
- **Description:** Create gst data

### 3. GET /api/gst/analytics
- **Method:** GET
- **Endpoint:** `/api/gst/analytics`
- **Description:** Retrieve gst data

### 4. PUT /api/gst/config
- **Method:** PUT
- **Endpoint:** `/api/gst/config`
- **Description:** Update gst data

### 5. POST /api/gst/hsn-codes
- **Method:** POST
- **Endpoint:** `/api/gst/hsn-codes`
- **Description:** Create gst data

### 6. PUT /api/gst/hsn-codes/:code
- **Method:** PUT
- **Endpoint:** `/api/gst/hsn-codes/:code`
- **Description:** Update gst data

### 7. POST /api/gst/reports/generate
- **Method:** POST
- **Endpoint:** `/api/gst/reports/generate`
- **Description:** Create gst data

### 8. GET /api/gst/reports
- **Method:** GET
- **Endpoint:** `/api/gst/reports`
- **Description:** Retrieve gst data

### 9. GET /api/gst/reports/:id
- **Method:** GET
- **Endpoint:** `/api/gst/reports/:id`
- **Description:** Retrieve gst data

### 10. GET /api/gst/reports/:id/export/excel
- **Method:** GET
- **Endpoint:** `/api/gst/reports/:id/export/excel`
- **Description:** Retrieve gst data

### 11. PATCH /api/gst/reports/:id/mark-filed
- **Method:** PATCH
- **Endpoint:** `/api/gst/reports/:id/mark-filed`
- **Description:** Modify gst data

---


## 💼 Bill Management (5 endpoints)
**Base Path:** `/api/bill-management`

### 1. GET /api/bill-management/dashboard
- **Method:** GET
- **Endpoint:** `/api/bill-management/dashboard`
- **Description:** Get dashboard data

### 2. GET /api/bill-management/bills
- **Method:** GET
- **Endpoint:** `/api/bill-management/bills`
- **Description:** Retrieve bill-management data

### 3. GET /api/bill-management/export/excel
- **Method:** GET
- **Endpoint:** `/api/bill-management/export/excel`
- **Description:** Retrieve bill-management data

### 4. GET /api/bill-management/analytics
- **Method:** GET
- **Endpoint:** `/api/bill-management/analytics`
- **Description:** Retrieve bill-management data

### 5. POST /api/bill-management/generate-ca-report
- **Method:** POST
- **Endpoint:** `/api/bill-management/generate-ca-report`
- **Description:** Create bill-management data

---


## 📊 Inventory Management (13 endpoints)
**Base Path:** `/api/inventory`

### 1. GET /api/inventory/dashboard
- **Method:** GET
- **Endpoint:** `/api/inventory/dashboard`
- **Description:** Get dashboard data

### 2. GET /api/inventory/
- **Method:** GET
- **Endpoint:** `/api/inventory/`
- **Description:** Get all items with pagination and filtering

### 3. GET /api/inventory/low-stock
- **Method:** GET
- **Endpoint:** `/api/inventory/low-stock`
- **Description:** Retrieve inventory data

### 4. GET /api/inventory/reorder-items
- **Method:** GET
- **Endpoint:** `/api/inventory/reorder-items`
- **Description:** Retrieve inventory data

### 5. GET /api/inventory/reorder-suggestions
- **Method:** GET
- **Endpoint:** `/api/inventory/reorder-suggestions`
- **Description:** Retrieve inventory data

### 6. GET /api/inventory/export/excel
- **Method:** GET
- **Endpoint:** `/api/inventory/export/excel`
- **Description:** Retrieve inventory data

### 7. GET /api/inventory/analytics
- **Method:** GET
- **Endpoint:** `/api/inventory/analytics`
- **Description:** Retrieve inventory data

### 8. GET /api/inventory/:id
- **Method:** GET
- **Endpoint:** `/api/inventory/:id`
- **Description:** Get single item by ID

### 9. PUT /api/inventory/:id
- **Method:** PUT
- **Endpoint:** `/api/inventory/:id`
- **Description:** Update item by ID

### 10. PATCH /api/inventory/:id/update-stock
- **Method:** PATCH
- **Endpoint:** `/api/inventory/:id/update-stock`
- **Description:** Modify inventory data

### 11. PATCH /api/inventory/:id/reserve-stock
- **Method:** PATCH
- **Endpoint:** `/api/inventory/:id/reserve-stock`
- **Description:** Modify inventory data

### 12. PATCH /api/inventory/:id/release-stock
- **Method:** PATCH
- **Endpoint:** `/api/inventory/:id/release-stock`
- **Description:** Modify inventory data

### 13. PATCH /api/inventory/:id/stock-count
- **Method:** PATCH
- **Endpoint:** `/api/inventory/:id/stock-count`
- **Description:** Modify inventory data

---


## 🏭 Supplier Management (12 endpoints)
**Base Path:** `/api/suppliers`

### 1. GET /api/suppliers/
- **Method:** GET
- **Endpoint:** `/api/suppliers/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/suppliers/active
- **Method:** GET
- **Endpoint:** `/api/suppliers/active`
- **Description:** Retrieve suppliers data

### 3. GET /api/suppliers/performance-report
- **Method:** GET
- **Endpoint:** `/api/suppliers/performance-report`
- **Description:** Retrieve suppliers data

### 4. GET /api/suppliers/export/excel
- **Method:** GET
- **Endpoint:** `/api/suppliers/export/excel`
- **Description:** Retrieve suppliers data

### 5. GET /api/suppliers/analytics
- **Method:** GET
- **Endpoint:** `/api/suppliers/analytics`
- **Description:** Retrieve suppliers data

### 6. POST /api/suppliers/
- **Method:** POST
- **Endpoint:** `/api/suppliers/`
- **Description:** Create new item

### 7. GET /api/suppliers/:id
- **Method:** GET
- **Endpoint:** `/api/suppliers/:id`
- **Description:** Get single item by ID

### 8. PUT /api/suppliers/:id
- **Method:** PUT
- **Endpoint:** `/api/suppliers/:id`
- **Description:** Update item by ID

### 9. DELETE /api/suppliers/:id
- **Method:** DELETE
- **Endpoint:** `/api/suppliers/:id`
- **Description:** Delete item by ID

### 10. PATCH /api/suppliers/:id/approve
- **Method:** PATCH
- **Endpoint:** `/api/suppliers/:id/approve`
- **Description:** Modify suppliers data

### 11. PATCH /api/suppliers/:id/performance
- **Method:** PATCH
- **Endpoint:** `/api/suppliers/:id/performance`
- **Description:** Modify suppliers data

### 12. PATCH /api/suppliers/:id/financials
- **Method:** PATCH
- **Endpoint:** `/api/suppliers/:id/financials`
- **Description:** Modify suppliers data

---


## 📝 Purchase Orders (14 endpoints)
**Base Path:** `/api/purchase-orders`

### 1. GET /api/purchase-orders/
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/purchase-orders/overdue
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/overdue`
- **Description:** Retrieve purchase-orders data

### 3. GET /api/purchase-orders/pending-approval
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/pending-approval`
- **Description:** Retrieve purchase-orders data

### 4. GET /api/purchase-orders/summary
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/summary`
- **Description:** Retrieve purchase-orders data

### 5. GET /api/purchase-orders/export/excel
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/export/excel`
- **Description:** Retrieve purchase-orders data

### 6. GET /api/purchase-orders/analytics
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/analytics`
- **Description:** Retrieve purchase-orders data

### 7. POST /api/purchase-orders/
- **Method:** POST
- **Endpoint:** `/api/purchase-orders/`
- **Description:** Create new item

### 8. GET /api/purchase-orders/:id
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/:id`
- **Description:** Get single item by ID

### 9. PUT /api/purchase-orders/:id
- **Method:** PUT
- **Endpoint:** `/api/purchase-orders/:id`
- **Description:** Update item by ID

### 10. PATCH /api/purchase-orders/:id/approve
- **Method:** PATCH
- **Endpoint:** `/api/purchase-orders/:id/approve`
- **Description:** Modify purchase-orders data

### 11. PATCH /api/purchase-orders/:id/reject
- **Method:** PATCH
- **Endpoint:** `/api/purchase-orders/:id/reject`
- **Description:** Modify purchase-orders data

### 12. PATCH /api/purchase-orders/:id/receive-items
- **Method:** PATCH
- **Endpoint:** `/api/purchase-orders/:id/receive-items`
- **Description:** Modify purchase-orders data

### 13. PATCH /api/purchase-orders/:id/cancel
- **Method:** PATCH
- **Endpoint:** `/api/purchase-orders/:id/cancel`
- **Description:** Modify purchase-orders data

### 14. GET /api/purchase-orders/:id/pdf
- **Method:** GET
- **Endpoint:** `/api/purchase-orders/:id/pdf`
- **Description:** Retrieve purchase-orders data

---


## 📈 Advanced Reports (5 endpoints)
**Base Path:** `/api/reports`

### 1. GET /api/reports/sales
- **Method:** GET
- **Endpoint:** `/api/reports/sales`
- **Description:** Retrieve reports data

### 2. GET /api/reports/profit-loss
- **Method:** GET
- **Endpoint:** `/api/reports/profit-loss`
- **Description:** Retrieve reports data

### 3. GET /api/reports/inventory
- **Method:** GET
- **Endpoint:** `/api/reports/inventory`
- **Description:** Retrieve reports data

### 4. GET /api/reports/customer-analytics
- **Method:** GET
- **Endpoint:** `/api/reports/customer-analytics`
- **Description:** Retrieve reports data

### 5. GET /api/reports/export/excel
- **Method:** GET
- **Endpoint:** `/api/reports/export/excel`
- **Description:** Retrieve reports data

---


## 🔔 Notification System (17 endpoints)
**Base Path:** `/api/notifications`

### 1. GET /api/notifications/
- **Method:** GET
- **Endpoint:** `/api/notifications/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/notifications/settings
- **Method:** GET
- **Endpoint:** `/api/notifications/settings`
- **Description:** Retrieve notifications data

### 3. PUT /api/notifications/settings
- **Method:** PUT
- **Endpoint:** `/api/notifications/settings`
- **Description:** Update notifications data

### 4. GET /api/notifications/:id
- **Method:** GET
- **Endpoint:** `/api/notifications/:id`
- **Description:** Get single item by ID

### 5. PATCH /api/notifications/:id/read
- **Method:** PATCH
- **Endpoint:** `/api/notifications/:id/read`
- **Description:** Modify notifications data

### 6. PATCH /api/notifications/mark-all-read
- **Method:** PATCH
- **Endpoint:** `/api/notifications/mark-all-read`
- **Description:** Modify notifications data

### 7. DELETE /api/notifications/:id
- **Method:** DELETE
- **Endpoint:** `/api/notifications/:id`
- **Description:** Delete item by ID

### 8. POST /api/notifications/fcm-token
- **Method:** POST
- **Endpoint:** `/api/notifications/fcm-token`
- **Description:** Create notifications data

### 9. DELETE /api/notifications/fcm-token
- **Method:** DELETE
- **Endpoint:** `/api/notifications/fcm-token`
- **Description:** Remove notifications data

### 10. POST /api/notifications/
- **Method:** POST
- **Endpoint:** `/api/notifications/`
- **Description:** Create new item

### 11. GET /api/notifications/admin/all
- **Method:** GET
- **Endpoint:** `/api/notifications/admin/all`
- **Description:** Retrieve notifications data

### 12. GET /api/notifications/admin/analytics
- **Method:** GET
- **Endpoint:** `/api/notifications/admin/analytics`
- **Description:** Retrieve notifications data

### 13. POST /api/notifications/admin/fcm-token
- **Method:** POST
- **Endpoint:** `/api/notifications/admin/fcm-token`
- **Description:** Create notifications data

### 14. DELETE /api/notifications/admin/fcm-token
- **Method:** DELETE
- **Endpoint:** `/api/notifications/admin/fcm-token`
- **Description:** Remove notifications data

### 15. POST /api/notifications/admin/broadcast
- **Method:** POST
- **Endpoint:** `/api/notifications/admin/broadcast`
- **Description:** Create notifications data

### 16. POST /api/notifications/test
- **Method:** POST
- **Endpoint:** `/api/notifications/test`
- **Description:** Create notifications data

### 17. GET /api/notifications/debug/admin-tokens
- **Method:** GET
- **Endpoint:** `/api/notifications/debug/admin-tokens`
- **Description:** Retrieve notifications data

---


## ↩️ Return Management (9 endpoints)
**Base Path:** `/api/returns`

### 1. POST /api/returns/
- **Method:** POST
- **Endpoint:** `/api/returns/`
- **Description:** Create new item

### 2. GET /api/returns/
- **Method:** GET
- **Endpoint:** `/api/returns/`
- **Description:** Get all items with pagination and filtering

### 3. GET /api/returns/:id
- **Method:** GET
- **Endpoint:** `/api/returns/:id`
- **Description:** Get single item by ID

### 4. GET /api/returns/admin/all
- **Method:** GET
- **Endpoint:** `/api/returns/admin/all`
- **Description:** Retrieve returns data

### 5. PATCH /api/returns/:id/approve
- **Method:** PATCH
- **Endpoint:** `/api/returns/:id/approve`
- **Description:** Modify returns data

### 6. PATCH /api/returns/:id/reject
- **Method:** PATCH
- **Endpoint:** `/api/returns/:id/reject`
- **Description:** Modify returns data

### 7. PATCH /api/returns/:id/schedule-pickup
- **Method:** PATCH
- **Endpoint:** `/api/returns/:id/schedule-pickup`
- **Description:** Modify returns data

### 8. PATCH /api/returns/:id/complete
- **Method:** PATCH
- **Endpoint:** `/api/returns/:id/complete`
- **Description:** Modify returns data

### 9. GET /api/returns/admin/statistics
- **Method:** GET
- **Endpoint:** `/api/returns/admin/statistics`
- **Description:** Retrieve returns data

---


## 🎧 Customer Support (12 endpoints)
**Base Path:** `/api/support`

### 1. POST /api/support/tickets
- **Method:** POST
- **Endpoint:** `/api/support/tickets`
- **Description:** Create support data

### 2. GET /api/support/tickets
- **Method:** GET
- **Endpoint:** `/api/support/tickets`
- **Description:** Retrieve support data

### 3. GET /api/support/tickets/:id
- **Method:** GET
- **Endpoint:** `/api/support/tickets/:id`
- **Description:** Retrieve support data

### 4. POST /api/support/tickets/:id/messages
- **Method:** POST
- **Endpoint:** `/api/support/tickets/:id/messages`
- **Description:** Create support data

### 5. GET /api/support/admin/dashboard
- **Method:** GET
- **Endpoint:** `/api/support/admin/dashboard`
- **Description:** Retrieve support data

### 6. GET /api/support/admin/tickets
- **Method:** GET
- **Endpoint:** `/api/support/admin/tickets`
- **Description:** Retrieve support data

### 7. PATCH /api/support/admin/tickets/:id/assign
- **Method:** PATCH
- **Endpoint:** `/api/support/admin/tickets/:id/assign`
- **Description:** Modify support data

### 8. POST /api/support/admin/tickets/:id/messages
- **Method:** POST
- **Endpoint:** `/api/support/admin/tickets/:id/messages`
- **Description:** Create support data

### 9. PATCH /api/support/admin/tickets/:id/resolve
- **Method:** PATCH
- **Endpoint:** `/api/support/admin/tickets/:id/resolve`
- **Description:** Modify support data

### 10. PATCH /api/support/admin/tickets/:id/close
- **Method:** PATCH
- **Endpoint:** `/api/support/admin/tickets/:id/close`
- **Description:** Modify support data

### 11. PATCH /api/support/admin/tickets/:id/escalate
- **Method:** PATCH
- **Endpoint:** `/api/support/admin/tickets/:id/escalate`
- **Description:** Modify support data

### 12. GET /api/support/admin/statistics
- **Method:** GET
- **Endpoint:** `/api/support/admin/statistics`
- **Description:** Retrieve support data

---


## ⚙️ System Settings (12 endpoints)
**Base Path:** `/api/settings`

### 1. GET /api/settings/
- **Method:** GET
- **Endpoint:** `/api/settings/`
- **Description:** Get all items with pagination and filtering

### 2. GET /api/settings/sections/:section
- **Method:** GET
- **Endpoint:** `/api/settings/sections/:section`
- **Description:** Retrieve settings data

### 3. PUT /api/settings/
- **Method:** PUT
- **Endpoint:** `/api/settings/`
- **Description:** Update item

### 4. PUT /api/settings/sections/:section
- **Method:** PUT
- **Endpoint:** `/api/settings/sections/:section`
- **Description:** Update settings data

### 5. GET /api/settings/values/:path
- **Method:** GET
- **Endpoint:** `/api/settings/values/:path`
- **Description:** Retrieve settings data

### 6. PUT /api/settings/values/:path
- **Method:** PUT
- **Endpoint:** `/api/settings/values/:path`
- **Description:** Update settings data

### 7. POST /api/settings/reset
- **Method:** POST
- **Endpoint:** `/api/settings/reset`
- **Description:** Create settings data

### 8. GET /api/settings/export
- **Method:** GET
- **Endpoint:** `/api/settings/export`
- **Description:** Retrieve settings data

### 9. POST /api/settings/import
- **Method:** POST
- **Endpoint:** `/api/settings/import`
- **Description:** Create settings data

### 10. GET /api/settings/history
- **Method:** GET
- **Endpoint:** `/api/settings/history`
- **Description:** Retrieve settings data

### 11. GET /api/settings/validate
- **Method:** GET
- **Endpoint:** `/api/settings/validate`
- **Description:** Retrieve settings data

### 12. GET /api/settings/status
- **Method:** GET
- **Endpoint:** `/api/settings/status`
- **Description:** Get status information

---


## 🚀 Production Routes V2 (5 endpoints)
**Base Path:** `/api/v2`

### 1. GET /api/v2/search
- **Method:** GET
- **Endpoint:** `/api/v2/search`
- **Description:** Search items

### 2. GET /api/v2/featured
- **Method:** GET
- **Endpoint:** `/api/v2/featured`
- **Description:** Get featured items

### 3. GET /api/v2/trending
- **Method:** GET
- **Endpoint:** `/api/v2/trending`
- **Description:** Retrieve v2 data

### 4. GET /api/v2/bestsellers
- **Method:** GET
- **Endpoint:** `/api/v2/bestsellers`
- **Description:** Retrieve v2 data

### 5. GET /api/v2/stats
- **Method:** GET
- **Endpoint:** `/api/v2/stats`
- **Description:** Get statistics

---


## 📊 SUMMARY

- **Total API Endpoints:** 264
- **Base Paths:** 29
- **Categories:** 29

## 🔐 AUTHENTICATION

Most endpoints require authentication. Use the following header:
```
Authorization: Bearer <JWT_TOKEN>
```

Get token from: `POST /api/auth/login`

## 👨‍💼 ADMIN CREDENTIALS

- **Email:** admin@admin.com
- **Password:** Admin@123

## 🧪 TESTING

1. **Postman Collection:** Import `docs/Ghanshyam_Ecommerce_APIs.postman_collection.json`
2. **Manual Testing Guide:** See `docs/MANUAL_API_TESTING_GUIDE.md`
3. **Environment Setup:**
   - `base_url`: http://localhost:8080/api
   - `admin_token`: (set after login)

---

*Generated automatically from route files*
*Last updated: 2025-08-05T20:39:11.827Z*
