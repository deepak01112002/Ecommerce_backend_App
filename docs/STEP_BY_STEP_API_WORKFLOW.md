# 🎯 COMPLETE STEP-BY-STEP API WORKFLOW

## 📋 OVERVIEW
This guide provides a complete step-by-step workflow from user registration to order completion, plus admin panel management.

**Base URL:** `http://localhost:8080/api`

---

## 🚀 PHASE 1: ADMIN SETUP & CONFIGURATION

### **Step 1: Admin Authentication**
```
POST {{base_url}}/auth/login
Body: {
  "email": "admin@admin.com",
  "password": "Admin@123"
}
Response: Save token as {{admin_token}}
```

### **Step 2: Configure Business Settings**
```
PUT {{base_url}}/admin/business-settings/company
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "companyName": "Ghanshyam Murti Bhandar",
  "gstin": "09ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "contactPhone": "+91-9999999999",
  "companyAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001"
  }
}
```

### **Step 3: Configure GST Settings**
```
PUT {{base_url}}/admin/business-settings/gst
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "enableGST": true,
  "defaultGSTRate": 18,
  "companyGSTIN": "09ABCDE1234F1Z5",
  "taxCalculationMethod": "exclusive"
}
```

### **Step 4: Configure Payment Settings**
```
PUT {{base_url}}/admin/business-settings/payments
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "enableCOD": true,
  "enableOnlinePayment": true,
  "enableWalletPayment": true,
  "codCharges": 50,
  "codMinAmount": 100,
  "codMaxAmount": 50000
}
```

### **Step 5: Create Categories**
```
POST {{base_url}}/categories
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "name": "Electronics",
  "description": "Electronic items and gadgets",
  "image": "https://via.placeholder.com/300x200?text=Electronics",
  "isActive": true
}
Response: Save category_id for next steps
```

### **Step 6: Create Products**
```
POST {{base_url}}/products
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced features",
  "price": 99999,
  "originalPrice": 109999,
  "category": "{{category_id}}",
  "stock": 50,
  "images": ["https://via.placeholder.com/400x400?text=iPhone+15+Pro"],
  "isActive": true,
  "isFeatured": true,
  "brand": "Apple",
  "sku": "IPH15PRO001"
}
Response: Save product_id for next steps
```

### **Step 7: Create Coupons**
```
POST {{base_url}}/coupons
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "code": "WELCOME10",
  "description": "Welcome discount for new users",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 500,
  "maxDiscountAmount": 1000,
  "usageLimit": 100,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "isActive": true
}
```

---

## 👤 PHASE 2: CUSTOMER JOURNEY

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
Response: User created successfully
```

### **Step 9: Customer Login**
```
POST {{base_url}}/auth/login
Body: {
  "email": "john.doe@example.com",
  "password": "Customer@123"
}
Response: Save token as {{user_token}}
```

### **Step 10: Get Customer Profile**
```
GET {{base_url}}/auth/profile
Headers: Authorization: Bearer {{user_token}}
Response: Customer profile details
```

### **Step 11: Add Customer Address**
```
POST {{base_url}}/addresses
Headers: Authorization: Bearer {{user_token}}
Body: {
  "type": "home",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210",
  "addressLine1": "123 Customer Street",
  "addressLine2": "Near Main Market",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "isDefault": true
}
Response: Save address_id
```

### **Step 12: Browse Products**
```
GET {{base_url}}/products?page=1&limit=10
Response: List of available products
```

### **Step 13: Search Products**
```
GET {{base_url}}/products/search?q=iphone&page=1&limit=5
Response: Search results
```

### **Step 14: Get Product Details**
```
GET {{base_url}}/products/{{product_id}}
Response: Detailed product information
```

### **Step 15: Add Product to Cart**
```
POST {{base_url}}/cart/add
Headers: Authorization: Bearer {{user_token}}
Body: {
  "productId": "{{product_id}}",
  "quantity": 2
}
Response: Product added to cart
```

### **Step 16: Get Cart Details**
```
GET {{base_url}}/cart
Headers: Authorization: Bearer {{user_token}}
Response: Cart items and totals
```

### **Step 17: Update Cart Item**
```
PUT {{base_url}}/cart/update/{{cart_item_id}}
Headers: Authorization: Bearer {{user_token}}
Body: {
  "quantity": 3
}
Response: Cart updated
```

### **Step 18: Apply Coupon**
```
POST {{base_url}}/cart/apply-coupon
Headers: Authorization: Bearer {{user_token}}
Body: {
  "couponCode": "WELCOME10"
}
Response: Coupon applied, discount calculated
```

### **Step 19: Add to Wishlist**
```
POST {{base_url}}/wishlist/add
Headers: Authorization: Bearer {{user_token}}
Body: {
  "productId": "{{product_id}}"
}
Response: Product added to wishlist
```

### **Step 20: Get Wishlist**
```
GET {{base_url}}/wishlist
Headers: Authorization: Bearer {{user_token}}
Response: Wishlist items
```

---

## 🛒 PHASE 3: ORDER PROCESSING

### **Step 21: Create Order**
```
POST {{base_url}}/orders
Headers: Authorization: Bearer {{user_token}}
Body: {
  "shippingAddress": "{{address_id}}",
  "billingAddress": "{{address_id}}",
  "paymentMethod": "cod",
  "items": [
    {
      "product": "{{product_id}}",
      "quantity": 2,
      "unitPrice": 99999
    }
  ],
  "couponCode": "WELCOME10"
}
Response: Save order_id
```

### **Step 22: Get Order Details**
```
GET {{base_url}}/orders/{{order_id}}
Headers: Authorization: Bearer {{user_token}}
Response: Complete order information
```

### **Step 23: Track Order**
```
GET {{base_url}}/orders/{{order_id}}/track
Headers: Authorization: Bearer {{user_token}}
Response: Order tracking information
```

### **Step 24: Get Customer Orders**
```
GET {{base_url}}/orders?page=1&limit=10
Headers: Authorization: Bearer {{user_token}}
Response: Customer's order history
```

---

## 💳 PHASE 4: PAYMENT PROCESSING

### **Step 25: Create Payment**
```
POST {{base_url}}/payments/create
Headers: Authorization: Bearer {{user_token}}
Body: {
  "orderId": "{{order_id}}",
  "amount": 199998,
  "paymentMethod": "online",
  "currency": "INR"
}
Response: Save payment_id
```

### **Step 26: Verify Payment**
```
POST {{base_url}}/payments/verify
Headers: Authorization: Bearer {{user_token}}
Body: {
  "paymentId": "{{payment_id}}",
  "orderId": "{{order_id}}",
  "signature": "payment_signature"
}
Response: Payment verification status
```

---

## 💰 PHASE 5: WALLET OPERATIONS

### **Step 27: Get Wallet Balance**
```
GET {{base_url}}/wallet
Headers: Authorization: Bearer {{user_token}}
Response: Current wallet balance
```

### **Step 28: Add Money to Wallet**
```
POST {{base_url}}/wallet/add-money
Headers: Authorization: Bearer {{user_token}}
Body: {
  "amount": 5000,
  "paymentMethod": "online"
}
Response: Money added to wallet
```

### **Step 29: Get Wallet Transactions**
```
GET {{base_url}}/wallet/transactions?page=1&limit=10
Headers: Authorization: Bearer {{user_token}}
Response: Transaction history
```

---

## ⭐ PHASE 6: REVIEWS & RATINGS

### **Step 30: Add Product Review**
```
POST {{base_url}}/reviews
Headers: Authorization: Bearer {{user_token}}
Body: {
  "product": "{{product_id}}",
  "rating": 5,
  "title": "Excellent Product!",
  "comment": "Great quality and fast delivery. Highly recommended!",
  "orderId": "{{order_id}}"
}
Response: Review added successfully
```

### **Step 31: Get Product Reviews**
```
GET {{base_url}}/reviews/product/{{product_id}}?page=1&limit=5
Response: Product reviews and ratings
```

---

## 🔄 PHASE 7: RETURN MANAGEMENT

### **Step 32: Create Return Request**
```
POST {{base_url}}/returns
Headers: Authorization: Bearer {{user_token}}
Body: {
  "orderId": "{{order_id}}",
  "items": [
    {
      "product": "{{product_id}}",
      "quantity": 1,
      "reason": "defective",
      "description": "Product has manufacturing defect"
    }
  ],
  "returnType": "refund"
}
Response: Save return_id
```

### **Step 33: Get Return Status**
```
GET {{base_url}}/returns/{{return_id}}
Headers: Authorization: Bearer {{user_token}}
Response: Return request details and status
```

---

## 🎧 PHASE 8: CUSTOMER SUPPORT

### **Step 34: Create Support Ticket**
```
POST {{base_url}}/support/tickets
Headers: Authorization: Bearer {{user_token}}
Body: {
  "subject": "Order Delivery Issue",
  "description": "My order has not been delivered yet",
  "category": "delivery",
  "priority": "medium",
  "orderId": "{{order_id}}"
}
Response: Save ticket_id
```

### **Step 35: Get Support Tickets**
```
GET {{base_url}}/support/tickets/user/{{user_id}}
Headers: Authorization: Bearer {{user_token}}
Response: Customer's support tickets
```

---

## 📊 PHASE 9: ADMIN MANAGEMENT

### **Step 36: Admin Dashboard**
```
GET {{base_url}}/admin/dashboard/quick-stats
Headers: Authorization: Bearer {{admin_token}}
Response: Dashboard statistics
```

### **Step 37: Get All Users**
```
GET {{base_url}}/admin/management/users?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
Response: All registered users
```

### **Step 38: Get All Orders**
```
GET {{base_url}}/admin/management/orders?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
Response: All orders in system
```

### **Step 39: Update Order Status**
```
PUT {{base_url}}/admin/management/orders/{{order_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "status": "confirmed",
  "notes": "Order confirmed and ready for processing"
}
Response: Order status updated
```

### **Step 40: Get All Products**
```
GET {{base_url}}/admin/management/products?page=1&limit=10
Headers: Authorization: Bearer {{admin_token}}
Response: All products in system
```

### **Step 41: Update Product Status**
```
PUT {{base_url}}/admin/management/products/{{product_id}}/status
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "isActive": true
}
Response: Product status updated
```

### **Step 42: Get Analytics**
```
GET {{base_url}}/admin/management/analytics
Headers: Authorization: Bearer {{admin_token}}
Response: Business analytics data
```

---

## 🧾 PHASE 10: INVOICE & GST MANAGEMENT

### **Step 43: Generate Invoice**
```
POST {{base_url}}/invoices
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "orderId": "{{order_id}}",
  "type": "tax_invoice"
}
Response: Save invoice_id
```

### **Step 44: Get Invoice PDF**
```
GET {{base_url}}/invoices/{{invoice_id}}/pdf
Headers: Authorization: Bearer {{admin_token}}
Response: PDF download
```

### **Step 45: Get GST Reports**
```
GET {{base_url}}/gst/reports?period=monthly&year=2025&month=1
Headers: Authorization: Bearer {{admin_token}}
Response: GST report data
```

---

## 📦 PHASE 11: INVENTORY MANAGEMENT

### **Step 46: Get Inventory Dashboard**
```
GET {{base_url}}/inventory/dashboard
Headers: Authorization: Bearer {{admin_token}}
Response: Inventory overview
```

### **Step 47: Update Inventory**
```
PUT {{base_url}}/inventory/{{product_id}}
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "stock": 45,
  "lowStockThreshold": 10,
  "location": "Warehouse A"
}
Response: Inventory updated
```

### **Step 48: Get Low Stock Items**
```
GET {{base_url}}/inventory/low-stock
Headers: Authorization: Bearer {{admin_token}}
Response: Products with low stock
```

---

## 🏭 PHASE 12: SUPPLIER MANAGEMENT

### **Step 49: Create Supplier**
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
    "country": "USA",
    "postalCode": "95014"
  },
  "gstin": "US123456789",
  "isActive": true
}
Response: Save supplier_id
```

### **Step 50: Create Purchase Order**
```
POST {{base_url}}/purchase-orders
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "supplier": "{{supplier_id}}",
  "items": [
    {
      "product": "{{product_id}}",
      "quantity": 100,
      "unitPrice": 80000,
      "totalPrice": 8000000
    }
  ],
  "expectedDeliveryDate": "2025-02-15T00:00:00.000Z",
  "notes": "Urgent order for iPhone 15 Pro"
}
Response: Purchase order created
```

---

## 🔔 PHASE 13: NOTIFICATION MANAGEMENT

### **Step 51: Send Notification**
```
POST {{base_url}}/notifications/send
Headers: Authorization: Bearer {{admin_token}}
Body: {
  "userId": "{{user_id}}",
  "type": "order_update",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed and is being processed",
  "data": {
    "orderId": "{{order_id}}"
  }
}
Response: Notification sent
```

### **Step 52: Get User Notifications**
```
GET {{base_url}}/notifications?page=1&limit=10
Headers: Authorization: Bearer {{user_token}}
Response: User notifications
```

---

## 📈 PHASE 14: REPORTS & ANALYTICS

### **Step 53: Sales Report**
```
GET {{base_url}}/reports/sales?startDate=2025-01-01&endDate=2025-01-31
Headers: Authorization: Bearer {{admin_token}}
Response: Sales report data
```

### **Step 54: Customer Report**
```
GET {{base_url}}/reports/customers?period=monthly
Headers: Authorization: Bearer {{admin_token}}
Response: Customer analytics
```

### **Step 55: Inventory Report**
```
GET {{base_url}}/reports/inventory?category={{category_id}}
Headers: Authorization: Bearer {{admin_token}}
Response: Inventory report
```

---

## ⚙️ PHASE 15: SYSTEM MANAGEMENT

### **Step 56: System Status**
```
GET {{base_url}}/settings/status
Headers: Authorization: Bearer {{admin_token}}
Response: System health status
```

### **Step 57: Validate Settings**
```
GET {{base_url}}/settings/validate
Headers: Authorization: Bearer {{admin_token}}
Response: Settings validation results
```

### **Step 58: Create System Backup**
```
GET {{base_url}}/settings/backup
Headers: Authorization: Bearer {{admin_token}}
Response: Backup created
```

---

## 🎯 TESTING SEQUENCE SUMMARY

### **Admin Setup (Steps 1-7)**
- Admin login and business configuration
- Categories and products creation
- Coupon setup

### **Customer Journey (Steps 8-24)**
- Registration, login, profile setup
- Product browsing and cart management
- Order creation and tracking

### **Advanced Features (Steps 25-58)**
- Payment processing
- Wallet operations
- Reviews and returns
- Support tickets
- Admin management
- Inventory and suppliers
- Reports and analytics

---

**🎯 COMPLETE 58-STEP WORKFLOW READY FOR TESTING! 🎯**
