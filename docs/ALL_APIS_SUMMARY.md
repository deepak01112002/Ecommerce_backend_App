# 🎯 ALL BACKEND APIs - COMPLETE SUMMARY

## 📊 OVERVIEW
**Total API Endpoints:** 239  
**Base URL:** `http://localhost:8080`  
**Authentication:** JWT Bearer Token  
**Admin Credentials:** admin@admin.com / Admin@123

---

## 📋 API CATEGORIES SUMMARY

### 🔐 **AUTHENTICATION (5 APIs)**
- POST `/api/auth/register` - User registration
- POST `/api/auth/signup` - User signup  
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile

### 👥 **USER MANAGEMENT (9 APIs)**
- POST `/api/users/addresses` - Create user address
- GET `/api/users/addresses` - Get user addresses
- PUT `/api/users/addresses/:addressId` - Update address
- DELETE `/api/users/addresses/:addressId` - Delete address
- PUT `/api/users/change-password` - Change password
- GET `/api/users/` - Get all users
- GET `/api/users/:userId` - Get user by ID
- PUT `/api/users/:userId` - Update user
- DELETE `/api/users/:userId` - Delete user

### 📦 **PRODUCT MANAGEMENT (9 APIs)**
- GET `/api/products/featured` - Get featured products
- GET `/api/products/search` - Search products
- GET `/api/products/` - Get all products
- POST `/api/products/` - Create product
- GET `/api/products/:id` - Get product by ID
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product
- POST `/api/products/:id/reviews` - Add product review
- GET `/api/products/:id/reviews` - Get product reviews

### 📁 **CATEGORY MANAGEMENT (9 APIs)**
- GET `/api/categories/` - Get all categories
- POST `/api/categories/` - Create category
- GET `/api/categories/:id` - Get category by ID
- PUT `/api/categories/:id` - Update category
- DELETE `/api/categories/:id` - Delete category
- GET `/api/categories/:id/products` - Get category products
- POST `/api/categories/bulk` - Bulk create categories
- PUT `/api/categories/:id/status` - Update category status
- GET `/api/categories/tree` - Get category tree

### 🛒 **SHOPPING CART (6 APIs)**
- GET `/api/cart/` - Get user cart
- POST `/api/cart/add` - Add item to cart
- PUT `/api/cart/update/:itemId` - Update cart item
- DELETE `/api/cart/remove/:itemId` - Remove cart item
- DELETE `/api/cart/clear` - Clear cart
- POST `/api/cart/apply-coupon` - Apply coupon to cart

### ❤️ **WISHLIST (5 APIs)**
- GET `/api/wishlist/` - Get user wishlist
- POST `/api/wishlist/add` - Add item to wishlist
- DELETE `/api/wishlist/remove/:productId` - Remove from wishlist
- DELETE `/api/wishlist/clear` - Clear wishlist
- POST `/api/wishlist/move-to-cart/:productId` - Move to cart

### ⭐ **REVIEWS & RATINGS (8 APIs)**
- GET `/api/reviews/` - Get all reviews
- POST `/api/reviews/` - Create review
- GET `/api/reviews/:id` - Get review by ID
- PUT `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review
- GET `/api/reviews/product/:productId` - Get product reviews
- PUT `/api/reviews/:id/helpful` - Mark review helpful
- POST `/api/reviews/:id/report` - Report review

### 📋 **ORDER MANAGEMENT (8 APIs)**
- GET `/api/orders/` - Get all orders
- POST `/api/orders/` - Create order
- GET `/api/orders/:id` - Get order by ID
- PUT `/api/orders/:id` - Update order
- DELETE `/api/orders/:id` - Cancel order
- GET `/api/orders/:id/track` - Track order
- POST `/api/orders/:id/confirm` - Confirm order
- PUT `/api/orders/:id/status` - Update order status

### 🎫 **COUPON SYSTEM (7 APIs)**
- GET `/api/coupons/` - Get all coupons
- POST `/api/coupons/` - Create coupon
- GET `/api/coupons/:id` - Get coupon by ID
- PUT `/api/coupons/:id` - Update coupon
- DELETE `/api/coupons/:id` - Delete coupon
- POST `/api/coupons/validate` - Validate coupon
- GET `/api/coupons/user/:userId` - Get user coupons

### 💳 **PAYMENT PROCESSING (6 APIs)**
- POST `/api/payments/create` - Create payment
- POST `/api/payments/verify` - Verify payment
- GET `/api/payments/:id` - Get payment details
- POST `/api/payments/refund` - Process refund
- GET `/api/payments/methods` - Get payment methods
- POST `/api/payments/webhook` - Payment webhook

### 📊 **ADMIN DASHBOARD (1 API)**
- GET `/api/admin/` - Get admin dashboard

### 📈 **ADMIN DASHBOARD ADVANCED (2 APIs)**
- GET `/api/admin/dashboard/` - Get dashboard data
- GET `/api/admin/dashboard/quick-stats` - Get quick stats

### ⚙️ **ADMIN MANAGEMENT (11 APIs)**
- GET `/api/admin/management/users` - Get all users
- PUT `/api/admin/management/users/:id/status` - Update user status
- GET `/api/admin/management/orders` - Get all orders
- PUT `/api/admin/management/orders/:id/status` - Update order status
- GET `/api/admin/management/products` - Get all products
- PUT `/api/admin/management/products/:id/status` - Update product status
- GET `/api/admin/management/categories` - Get all categories
- PUT `/api/admin/management/categories/:id/status` - Update category status
- GET `/api/admin/management/coupons` - Get all coupons
- PUT `/api/admin/management/coupons/:id/status` - Update coupon status
- GET `/api/admin/management/analytics` - Get analytics data

### 🏢 **BUSINESS SETTINGS (10 APIs)**
- GET `/api/admin/business-settings/` - Get business settings
- PUT `/api/admin/business-settings/company` - Update company info
- PUT `/api/admin/business-settings/gst` - Update GST settings
- PUT `/api/admin/business-settings/payments` - Update payment settings
- PUT `/api/admin/business-settings/orders` - Update order settings
- PUT `/api/admin/business-settings/shipping` - Update shipping settings
- PUT `/api/admin/business-settings/returns` - Update return settings
- PUT `/api/admin/business-settings/notifications` - Update notification settings
- PUT `/api/admin/business-settings/features` - Update feature flags
- GET `/api/admin/business-settings/export` - Export settings

### 📍 **ADDRESS MANAGEMENT (8 APIs)**
- GET `/api/addresses/` - Get user addresses
- POST `/api/addresses/` - Create address
- GET `/api/addresses/:id` - Get address by ID
- PUT `/api/addresses/:id` - Update address
- DELETE `/api/addresses/:id` - Delete address
- PUT `/api/addresses/:id/default` - Set default address
- GET `/api/addresses/states` - Get states list
- GET `/api/addresses/cities/:stateId` - Get cities by state

### 💰 **WALLET SYSTEM (8 APIs)**
- GET `/api/wallet/` - Get wallet balance
- POST `/api/wallet/add-money` - Add money to wallet
- POST `/api/wallet/deduct` - Deduct from wallet
- GET `/api/wallet/transactions` - Get transaction history
- POST `/api/wallet/transfer` - Transfer money
- GET `/api/wallet/statement` - Get wallet statement
- POST `/api/wallet/cashback` - Add cashback
- GET `/api/wallet/limits` - Get wallet limits

### 🚚 **SHIPPING MANAGEMENT (11 APIs)**
- GET `/api/shipping/rates` - Get shipping rates
- POST `/api/shipping/calculate` - Calculate shipping cost
- GET `/api/shipping/methods` - Get shipping methods
- POST `/api/shipping/create` - Create shipment
- GET `/api/shipping/:id/track` - Track shipment
- PUT `/api/shipping/:id/update` - Update shipment
- POST `/api/shipping/bulk-create` - Bulk create shipments
- GET `/api/shipping/zones` - Get shipping zones
- POST `/api/shipping/zones` - Create shipping zone
- PUT `/api/shipping/zones/:id` - Update shipping zone
- DELETE `/api/shipping/zones/:id` - Delete shipping zone

### 🧾 **INVOICE SYSTEM (8 APIs)**
- GET `/api/invoices/` - Get all invoices
- POST `/api/invoices/` - Create invoice
- GET `/api/invoices/:id` - Get invoice by ID
- PUT `/api/invoices/:id` - Update invoice
- DELETE `/api/invoices/:id` - Delete invoice
- GET `/api/invoices/:id/pdf` - Download invoice PDF
- POST `/api/invoices/bulk` - Bulk create invoices
- GET `/api/invoices/search` - Search invoices

### 📄 **GST MANAGEMENT (11 APIs)**
- GET `/api/gst/config` - Get GST configuration
- PUT `/api/gst/config` - Update GST config
- GET `/api/gst/rates` - Get GST rates
- POST `/api/gst/rates` - Create GST rate
- PUT `/api/gst/rates/:id` - Update GST rate
- DELETE `/api/gst/rates/:id` - Delete GST rate
- GET `/api/gst/reports` - Get GST reports
- POST `/api/gst/file-return` - File GST return
- GET `/api/gst/hsn-codes` - Get HSN codes
- POST `/api/gst/validate-gstin` - Validate GSTIN
- GET `/api/gst/summary` - Get GST summary

### 💼 **BILL MANAGEMENT (5 APIs)**
- GET `/api/bill-management/` - Get all bills
- POST `/api/bill-management/` - Create bill
- GET `/api/bill-management/:id` - Get bill by ID
- PUT `/api/bill-management/:id` - Update bill
- DELETE `/api/bill-management/:id` - Delete bill

### 📊 **INVENTORY MANAGEMENT (13 APIs)**
- GET `/api/inventory/dashboard` - Get inventory dashboard
- GET `/api/inventory/` - Get all inventory items
- POST `/api/inventory/` - Create inventory item
- GET `/api/inventory/:id` - Get inventory by ID
- PUT `/api/inventory/:id` - Update inventory
- DELETE `/api/inventory/:id` - Delete inventory
- POST `/api/inventory/adjust` - Adjust inventory
- GET `/api/inventory/low-stock` - Get low stock items
- GET `/api/inventory/movements` - Get inventory movements
- POST `/api/inventory/bulk-update` - Bulk update inventory
- GET `/api/inventory/reports` - Get inventory reports
- POST `/api/inventory/audit` - Create inventory audit
- GET `/api/inventory/alerts` - Get inventory alerts

### 🏭 **SUPPLIER MANAGEMENT (12 APIs)**
- GET `/api/suppliers/` - Get all suppliers
- POST `/api/suppliers/` - Create supplier
- GET `/api/suppliers/:id` - Get supplier by ID
- PUT `/api/suppliers/:id` - Update supplier
- DELETE `/api/suppliers/:id` - Delete supplier
- GET `/api/suppliers/:id/products` - Get supplier products
- POST `/api/suppliers/:id/products` - Add supplier product
- GET `/api/suppliers/:id/orders` - Get supplier orders
- POST `/api/suppliers/:id/orders` - Create supplier order
- GET `/api/suppliers/search` - Search suppliers
- PUT `/api/suppliers/:id/status` - Update supplier status
- GET `/api/suppliers/:id/performance` - Get supplier performance

### 📝 **PURCHASE ORDERS (14 APIs)**
- GET `/api/purchase-orders/` - Get all purchase orders
- POST `/api/purchase-orders/` - Create purchase order
- GET `/api/purchase-orders/:id` - Get purchase order by ID
- PUT `/api/purchase-orders/:id` - Update purchase order
- DELETE `/api/purchase-orders/:id` - Delete purchase order
- POST `/api/purchase-orders/:id/approve` - Approve purchase order
- POST `/api/purchase-orders/:id/reject` - Reject purchase order
- POST `/api/purchase-orders/:id/receive` - Receive purchase order
- GET `/api/purchase-orders/:id/items` - Get PO items
- POST `/api/purchase-orders/:id/items` - Add PO item
- PUT `/api/purchase-orders/:id/items/:itemId` - Update PO item
- DELETE `/api/purchase-orders/:id/items/:itemId` - Delete PO item
- GET `/api/purchase-orders/pending` - Get pending POs
- GET `/api/purchase-orders/reports` - Get PO reports

### 📈 **ADVANCED REPORTS (5 APIs)**
- GET `/api/reports/sales` - Get sales reports
- GET `/api/reports/inventory` - Get inventory reports
- GET `/api/reports/customers` - Get customer reports
- GET `/api/reports/financial` - Get financial reports
- POST `/api/reports/custom` - Generate custom report

### 🔔 **NOTIFICATION SYSTEM (10 APIs)**
- GET `/api/notifications/` - Get all notifications
- POST `/api/notifications/` - Create notification
- GET `/api/notifications/:id` - Get notification by ID
- PUT `/api/notifications/:id` - Update notification
- DELETE `/api/notifications/:id` - Delete notification
- PUT `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/bulk-read` - Bulk mark as read
- GET `/api/notifications/unread` - Get unread notifications
- POST `/api/notifications/send` - Send notification
- GET `/api/notifications/templates` - Get notification templates

### ↩️ **RETURN MANAGEMENT (9 APIs)**
- GET `/api/returns/` - Get all returns
- POST `/api/returns/` - Create return request
- GET `/api/returns/:id` - Get return by ID
- PUT `/api/returns/:id` - Update return
- DELETE `/api/returns/:id` - Delete return
- POST `/api/returns/:id/approve` - Approve return
- POST `/api/returns/:id/reject` - Reject return
- GET `/api/returns/admin/all` - Get all returns (admin)
- POST `/api/returns/:id/refund` - Process refund

### 🎧 **CUSTOMER SUPPORT (12 APIs)**
- GET `/api/support/tickets` - Get all tickets
- POST `/api/support/tickets` - Create support ticket
- GET `/api/support/tickets/:id` - Get ticket by ID
- PUT `/api/support/tickets/:id` - Update ticket
- DELETE `/api/support/tickets/:id` - Delete ticket
- POST `/api/support/tickets/:id/reply` - Reply to ticket
- PUT `/api/support/tickets/:id/status` - Update ticket status
- PUT `/api/support/tickets/:id/assign` - Assign ticket
- GET `/api/support/tickets/user/:userId` - Get user tickets
- GET `/api/support/admin/dashboard` - Get support dashboard
- GET `/api/support/categories` - Get support categories
- POST `/api/support/categories` - Create support category

### ⚙️ **SYSTEM SETTINGS (12 APIs)**
- GET `/api/settings/` - Get system settings
- PUT `/api/settings/` - Update system settings
- GET `/api/settings/email` - Get email settings
- PUT `/api/settings/email` - Update email settings
- GET `/api/settings/sms` - Get SMS settings
- PUT `/api/settings/sms` - Update SMS settings
- GET `/api/settings/payment-gateways` - Get payment gateway settings
- PUT `/api/settings/payment-gateways` - Update payment gateways
- GET `/api/settings/backup` - Create system backup
- POST `/api/settings/restore` - Restore system backup
- GET `/api/settings/validate` - Validate system settings
- GET `/api/settings/status` - Get system status

### 🚀 **PRODUCTION ROUTES V2 (5 APIs)**
- GET `/api/v2/health` - Health check
- GET `/api/v2/version` - Get API version
- GET `/api/v2/stats` - Get system stats
- POST `/api/v2/migrate` - Run migrations
- GET `/api/v2/docs` - Get API documentation

---

## 🔐 AUTHENTICATION REQUIRED

Most APIs require JWT authentication. Include this header:
```
Authorization: Bearer <JWT_TOKEN>
```

Get token from: `POST /api/auth/login`

## 👨‍💼 ADMIN CREDENTIALS
- **Email:** admin@admin.com
- **Password:** Admin@123

## 🧪 TESTING
1. **Postman Collection:** `docs/Ghanshyam_Ecommerce_APIs.postman_collection.json`
2. **Manual Guide:** `docs/MANUAL_API_TESTING_GUIDE.md`
3. **Complete List:** `docs/COMPLETE_API_LIST.md`

---

**🎯 TOTAL: 239 API ENDPOINTS READY FOR USE! 🎯**
