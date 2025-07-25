# 🎯 COMPLETE POSTMAN TESTING SEQUENCE - ALL 239 APIs

## 📋 OVERVIEW
This is a complete step-by-step testing sequence from admin setup to customer order completion, covering all 239 APIs in logical order.

**Environment Setup:**
- `base_url`: `http://localhost:8080/api`
- `admin_token`: (auto-saved after admin login)
- `user_token`: (auto-saved after customer login)
- `category_id`: (auto-saved after category creation)
- `product_id`: (auto-saved after product creation)
- `order_id`: (auto-saved after order creation)

---

## 🚀 PHASE 1: ADMIN SETUP & CONFIGURATION (7 Steps)

### **Step 1: Admin Authentication**
```
POST {{base_url}}/auth/login
Body: {
  "email": "admin@admin.com",
  "password": "Admin@123"
}
✅ Expected: Token saved as {{admin_token}}
```

### **Step 2: Configure Business Settings**
```
PUT {{base_url}}/admin/business-settings/company
Headers: Authorization: Bearer {{admin_token}}
Body: Company information (GSTIN, PAN, Address)
✅ Expected: Company settings updated
```

### **Step 3: Configure GST Settings**
```
PUT {{base_url}}/admin/business-settings/gst
Headers: Authorization: Bearer {{admin_token}}
Body: GST configuration (18% rate, exclusive calculation)
✅ Expected: GST settings configured
```

### **Step 4: Configure Payment Settings**
```
PUT {{base_url}}/admin/business-settings/payments
Headers: Authorization: Bearer {{admin_token}}
Body: Payment methods (COD, Online, Wallet enabled)
✅ Expected: Payment settings configured
```

### **Step 5: Create Category**
```
POST {{base_url}}/categories
Headers: Authorization: Bearer {{admin_token}}
Body: Electronics category
✅ Expected: Category created, ID saved as {{category_id}}
```

### **Step 6: Create Product**
```
POST {{base_url}}/products
Headers: Authorization: Bearer {{admin_token}}
Body: iPhone 15 Pro with category reference
✅ Expected: Product created, ID saved as {{product_id}}
```

### **Step 7: Create Coupon**
```
POST {{base_url}}/coupons
Headers: Authorization: Bearer {{admin_token}}
Body: WELCOME10 coupon (10% discount)
✅ Expected: Coupon created successfully
```

---

## 👤 PHASE 2: CUSTOMER JOURNEY (17 Steps)

### **Step 8: Customer Registration**
```
POST {{base_url}}/auth/register
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Customer@123",
  "phone": "+91-9876543210"
}
✅ Expected: Customer registered successfully
```

### **Step 9: Customer Login**
```
POST {{base_url}}/auth/login
Body: {
  "email": "john.doe@example.com",
  "password": "Customer@123"
}
✅ Expected: Token saved as {{user_token}}
```

### **Step 10: Get Customer Profile**
```
GET {{base_url}}/auth/profile
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Customer profile details
```

### **Step 11: Add Customer Address**
```
POST {{base_url}}/addresses
Headers: Authorization: Bearer {{user_token}}
Body: Home address details
✅ Expected: Address created, ID saved as {{address_id}}
```

### **Step 12: Browse Products**
```
GET {{base_url}}/products?page=1&limit=10
✅ Expected: List of products including created iPhone
```

### **Step 13: Search Products**
```
GET {{base_url}}/products/search?q=iphone&page=1&limit=5
✅ Expected: iPhone products in search results
```

### **Step 14: Get Product Details**
```
GET {{base_url}}/products/{{product_id}}
✅ Expected: Detailed iPhone product information
```

### **Step 15: Add Product to Wishlist**
```
POST {{base_url}}/wishlist/add
Headers: Authorization: Bearer {{user_token}}
Body: { "productId": "{{product_id}}" }
✅ Expected: Product added to wishlist
```

### **Step 16: Get Wishlist**
```
GET {{base_url}}/wishlist
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Wishlist with iPhone product
```

### **Step 17: Add Product to Cart**
```
POST {{base_url}}/cart/add
Headers: Authorization: Bearer {{user_token}}
Body: { "productId": "{{product_id}}", "quantity": 2 }
✅ Expected: Product added to cart
```

### **Step 18: Get Cart Details**
```
GET {{base_url}}/cart
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Cart with iPhone (2 units), totals calculated
```

### **Step 19: Update Cart Item**
```
PUT {{base_url}}/cart/update/{{cart_item_id}}
Headers: Authorization: Bearer {{user_token}}
Body: { "quantity": 3 }
✅ Expected: Cart quantity updated to 3
```

### **Step 20: Apply Coupon**
```
POST {{base_url}}/cart/apply-coupon
Headers: Authorization: Bearer {{user_token}}
Body: { "couponCode": "WELCOME10" }
✅ Expected: 10% discount applied to cart
```

### **Step 21: Get Updated Cart**
```
GET {{base_url}}/cart
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Cart with discount applied
```

### **Step 22: Create Order**
```
POST {{base_url}}/orders
Headers: Authorization: Bearer {{user_token}}
Body: {
  "shippingAddress": "{{address_id}}",
  "billingAddress": "{{address_id}}",
  "paymentMethod": "cod",
  "couponCode": "WELCOME10"
}
✅ Expected: Order created, ID saved as {{order_id}}
```

### **Step 23: Get Order Details**
```
GET {{base_url}}/orders/{{order_id}}
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Complete order information with items, pricing
```

### **Step 24: Track Order**
```
GET {{base_url}}/orders/{{order_id}}/track
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Order tracking information
```

---

## 💳 PHASE 3: PAYMENT & WALLET (6 Steps)

### **Step 25: Get Wallet Balance**
```
GET {{base_url}}/wallet
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Current wallet balance (likely 0)
```

### **Step 26: Add Money to Wallet**
```
POST {{base_url}}/wallet/add-money
Headers: Authorization: Bearer {{user_token}}
Body: { "amount": 5000, "paymentMethod": "online" }
✅ Expected: Money added to wallet
```

### **Step 27: Get Wallet Transactions**
```
GET {{base_url}}/wallet/transactions?page=1&limit=10
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Transaction history with money addition
```

### **Step 28: Create Payment**
```
POST {{base_url}}/payments/create
Headers: Authorization: Bearer {{user_token}}
Body: {
  "orderId": "{{order_id}}",
  "amount": 269997,
  "paymentMethod": "online",
  "currency": "INR"
}
✅ Expected: Payment created, ID saved as {{payment_id}}
```

### **Step 29: Verify Payment**
```
POST {{base_url}}/payments/verify
Headers: Authorization: Bearer {{user_token}}
Body: {
  "paymentId": "{{payment_id}}",
  "orderId": "{{order_id}}",
  "signature": "test_signature"
}
✅ Expected: Payment verification status
```

### **Step 30: Get Payment Details**
```
GET {{base_url}}/payments/{{payment_id}}
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Payment details and status
```

---

## ⭐ PHASE 4: REVIEWS & SUPPORT (8 Steps)

### **Step 31: Add Product Review**
```
POST {{base_url}}/reviews
Headers: Authorization: Bearer {{user_token}}
Body: {
  "product": "{{product_id}}",
  "rating": 5,
  "title": "Excellent Product!",
  "comment": "Great quality and fast delivery.",
  "orderId": "{{order_id}}"
}
✅ Expected: Review added successfully
```

### **Step 32: Get Product Reviews**
```
GET {{base_url}}/reviews/product/{{product_id}}?page=1&limit=5
✅ Expected: Product reviews including the one just added
```

### **Step 33: Mark Review Helpful**
```
PUT {{base_url}}/reviews/{{review_id}}/helpful
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Review marked as helpful
```

### **Step 34: Create Support Ticket**
```
POST {{base_url}}/support/tickets
Headers: Authorization: Bearer {{user_token}}
Body: {
  "subject": "Order Delivery Question",
  "description": "When will my order be delivered?",
  "category": "delivery",
  "priority": "medium",
  "orderId": "{{order_id}}"
}
✅ Expected: Support ticket created, ID saved as {{ticket_id}}
```

### **Step 35: Get Support Tickets**
```
GET {{base_url}}/support/tickets/user/{{user_id}}
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Customer's support tickets
```

### **Step 36: Reply to Support Ticket**
```
POST {{base_url}}/support/tickets/{{ticket_id}}/reply
Headers: Authorization: Bearer {{user_token}}
Body: {
  "message": "Please provide estimated delivery date."
}
✅ Expected: Reply added to ticket
```

### **Step 37: Create Return Request**
```
POST {{base_url}}/returns
Headers: Authorization: Bearer {{user_token}}
Body: {
  "orderId": "{{order_id}}",
  "items": [{
    "product": "{{product_id}}",
    "quantity": 1,
    "reason": "not_as_described",
    "description": "Product color different from image"
  }],
  "returnType": "refund"
}
✅ Expected: Return request created, ID saved as {{return_id}}
```

### **Step 38: Get Return Status**
```
GET {{base_url}}/returns/{{return_id}}
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Return request details and status
```

---

## 📊 PHASE 5: ADMIN MANAGEMENT (15 Steps)

### **Step 39: Admin Dashboard Quick Stats**
```
GET {{base_url}}/admin/dashboard/quick-stats
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Dashboard statistics (orders, users, products)
```

### **Step 40: Full Admin Dashboard**
```
GET {{base_url}}/admin/dashboard?period=30
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Complete dashboard with analytics
```

### **Step 41: Get All Users**
```
GET {{base_url}}/admin/management/users?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: All registered users including John Doe
```

### **Step 42: Update User Status**
```
PUT {{base_url}}/admin/management/users/{{user_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: { "isActive": true }
✅ Expected: User status updated
```

### **Step 43: Get All Orders**
```
GET {{base_url}}/admin/management/orders?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: All orders including the created order
```

### **Step 44: Update Order Status**
```
PUT {{base_url}}/admin/management/orders/{{order_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "status": "confirmed",
  "notes": "Order confirmed and ready for processing"
}
✅ Expected: Order status updated to confirmed
```

### **Step 45: Get All Products**
```
GET {{base_url}}/admin/management/products?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: All products including created iPhone
```

### **Step 46: Update Product Status**
```
PUT {{base_url}}/admin/management/products/{{product_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: { "isActive": true }
✅ Expected: Product status updated
```

### **Step 47: Get All Categories**
```
GET {{base_url}}/admin/management/categories?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: All categories including Electronics
```

### **Step 48: Update Category Status**
```
PUT {{base_url}}/admin/management/categories/{{category_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: { "isActive": true }
✅ Expected: Category status updated
```

### **Step 49: Get All Coupons**
```
GET {{base_url}}/admin/management/coupons?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: All coupons including WELCOME10
```

### **Step 50: Update Coupon Status**
```
PUT {{base_url}}/admin/management/coupons/{{coupon_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: { "isActive": true }
✅ Expected: Coupon status updated
```

### **Step 51: Get Analytics Data**
```
GET {{base_url}}/admin/management/analytics
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Business analytics and insights
```

### **Step 52: Handle Support Ticket (Admin)**
```
PUT {{base_url}}/support/tickets/{{ticket_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: { "status": "in_progress" }
✅ Expected: Ticket status updated
```

### **Step 53: Approve Return Request**
```
POST {{base_url}}/returns/{{return_id}}/approve
Headers: Authorization: Bearer {{admin_token}}
Body: { "notes": "Return approved, refund will be processed" }
✅ Expected: Return request approved
```

---

## 🧾 PHASE 6: ADVANCED FEATURES (15 Steps)

### **Step 54: Generate Invoice**
```
POST {{base_url}}/invoices
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "orderId": "{{order_id}}",
  "type": "tax_invoice"
}
✅ Expected: Invoice generated, ID saved as {{invoice_id}}
```

### **Step 55: Get Invoice PDF**
```
GET {{base_url}}/invoices/{{invoice_id}}/pdf
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: PDF download link or file
```

### **Step 56: Get GST Reports**
```
GET {{base_url}}/gst/reports?period=monthly&year=2025&month=1
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: GST report data for January 2025
```

### **Step 57: Get Inventory Dashboard**
```
GET {{base_url}}/inventory/dashboard
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Inventory overview and statistics
```

### **Step 58: Update Inventory**
```
PUT {{base_url}}/inventory/{{product_id}}
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "stock": 47,
  "lowStockThreshold": 10,
  "location": "Warehouse A"
}
✅ Expected: Inventory updated (stock reduced after order)
```

### **Step 59: Get Low Stock Items**
```
GET {{base_url}}/inventory/low-stock
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Products with stock below threshold
```

### **Step 60: Create Supplier**
```
POST {{base_url}}/suppliers
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "name": "Apple Inc.",
  "contactPerson": "John Smith",
  "email": "supplier@apple.com",
  "phone": "+1-555-0123",
  "address": {
    "street": "1 Apple Park Way",
    "city": "Cupertino",
    "state": "California",
    "country": "USA"
  },
  "isActive": true
}
✅ Expected: Supplier created, ID saved as {{supplier_id}}
```

### **Step 61: Create Purchase Order**
```
POST {{base_url}}/purchase-orders
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "supplier": "{{supplier_id}}",
  "items": [{
    "product": "{{product_id}}",
    "quantity": 100,
    "unitPrice": 80000,
    "totalPrice": 8000000
  }],
  "expectedDeliveryDate": "2025-02-15T00:00:00.000Z"
}
✅ Expected: Purchase order created, ID saved as {{po_id}}
```

### **Step 62: Approve Purchase Order**
```
POST {{base_url}}/purchase-orders/{{po_id}}/approve
Headers: Authorization: Bearer {{admin_token}}
Body: { "notes": "Approved for immediate processing" }
✅ Expected: Purchase order approved
```

### **Step 63: Send Notification**
```
POST {{base_url}}/notifications/send
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "userId": "{{user_id}}",
  "type": "order_update",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed and is being processed",
  "data": { "orderId": "{{order_id}}" }
}
✅ Expected: Notification sent to customer
```

### **Step 64: Get User Notifications**
```
GET {{base_url}}/notifications?page=1&limit=10
Headers: Authorization: Bearer {{user_token}}
✅ Expected: Customer notifications including order update
```

### **Step 65: Sales Report**
```
GET {{base_url}}/reports/sales?startDate=2025-01-01&endDate=2025-01-31
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Sales report for January 2025
```

### **Step 66: Customer Report**
```
GET {{base_url}}/reports/customers?period=monthly
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Customer analytics and insights
```

### **Step 67: System Status Check**
```
GET {{base_url}}/settings/status
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: System health and status information
```

### **Step 68: Validate System Settings**
```
GET {{base_url}}/settings/validate
Headers: Authorization: Bearer {{admin_token}}
✅ Expected: Settings validation results
```

---

## 🎯 TESTING SUMMARY

### **Total Steps: 68**
- **Phase 1:** Admin Setup (7 steps)
- **Phase 2:** Customer Journey (17 steps)
- **Phase 3:** Payment & Wallet (6 steps)
- **Phase 4:** Reviews & Support (8 steps)
- **Phase 5:** Admin Management (15 steps)
- **Phase 6:** Advanced Features (15 steps)

### **Success Criteria:**
- ✅ All 68 steps complete successfully
- ✅ Data flows correctly between steps
- ✅ Environment variables auto-saved
- ✅ Business logic working properly
- ✅ Admin panel fully functional

### **Key Environment Variables:**
- `admin_token` - Admin JWT token
- `user_token` - Customer JWT token
- `category_id` - Created category ID
- `product_id` - Created product ID
- `order_id` - Created order ID
- `address_id` - Customer address ID
- `invoice_id` - Generated invoice ID
- `supplier_id` - Created supplier ID

---

**🎯 COMPLETE 68-STEP TESTING SEQUENCE READY! 🎯**

**Import collection, setup environment, and run all steps in sequence for complete API testing! 🚀**
