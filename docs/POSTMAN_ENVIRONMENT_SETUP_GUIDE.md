# 🌐 Postman Environment Setup Guide

## 📁 Environment Files Created

I've created two complete Postman environment files for you:

### 1. **Production Environment** 🚀
- **File**: `Ghanshyam_Production_Environment.postman_environment.json`
- **Server**: `https://server.ghanshyammurtibhandar.com`
- **Use Case**: Testing on your live production server

### 2. **Localhost Environment** 🔧
- **File**: `Ghanshyam_Localhost_Environment.postman_environment.json`
- **Server**: `http://localhost:8080`
- **Use Case**: Local development and testing

## 📥 How to Import Environment Files

### Step 1: Import Environment
1. Open Postman
2. Click the **"Environments"** tab (left sidebar)
3. Click **"Import"** button
4. Select the environment JSON file
5. Click **"Import"**

### Step 2: Select Environment
1. In the top-right corner of Postman
2. Click the environment dropdown
3. Select either:
   - `🚀 Ghanshyam Production Environment`
   - `🔧 Ghanshyam Localhost Environment`

## 🔧 Environment Variables Included

### **Core Server Variables:**
```json
{
  "baseUrl": "https://server.ghanshyammurtibhandar.com", // or localhost
  "localhostUrl": "http://localhost:8080",
  "apiVersion": "v1",
  "contentType": "application/json",
  "timeout": "30000"
}
```

### **Authentication Variables:**
```json
{
  "authToken": "",           // Auto-populated after login
  "adminToken": "",          // Auto-populated after admin login
  "userId": "",              // Auto-populated after registration
  "adminEmail": "admin@admin.com",
  "adminPassword": "Admin@123",
  "testEmail": "testuser@example.com",
  "testPassword": "password123"
}
```

### **Dynamic ID Variables:**
```json
{
  "productId": "",           // Auto-populated when fetching products
  "categoryId": "",          // Auto-populated when fetching categories
  "orderId": "",             // Auto-populated when creating orders
  "razorpayOrderId": "",     // Auto-populated for payments
  "addressId": ""            // Auto-populated for addresses
}
```

### **Test Data Variables:**
```json
{
  "couponCode": "WELCOME10",
  "searchQuery": "ganesha",
  "currency": "INR",
  "testAmount": "1500",
  "testQuantity": "2",
  "testRating": "5",
  "pageLimit": "10"
}
```

### **Address Variables:**
```json
{
  "testPhone": "9876543210",
  "testCity": "Mumbai",
  "testState": "Maharashtra",
  "testPostalCode": "400001",
  "testCountry": "India"
}
```

## 🎯 Usage Workflow

### 1. **Start with Authentication:**
```
1. Run "Admin Login" or "Login User"
2. Tokens will be automatically stored
3. All subsequent requests will use these tokens
```

### 2. **Test Core Features:**
```
1. Get Categories (populates categoryId)
2. Get Products (populates productId)
3. Add to Cart (uses productId)
4. Create Order (uses cart data)
```

### 3. **Switch Between Environments:**
```
- Production: Test live server
- Localhost: Test local development
```

## 🔄 Auto-Population Features

The environment is designed to automatically populate variables:

### **After Login:**
- `authToken` → Set from login response
- `adminToken` → Set from admin login response
- `userId` → Set from user data

### **After API Calls:**
- `productId` → Set from first product in list
- `categoryId` → Set from first category in list
- `orderId` → Set when creating orders
- `razorpayOrderId` → Set when creating payment orders

## 📋 Quick Test Sequence

### **Recommended Testing Order:**

1. **Authentication Flow:**
   ```
   POST /auth/register (uses testEmail, testPassword)
   POST /auth/login (uses testEmail, testPassword)
   GET /auth/profile (uses authToken)
   ```

2. **Browse Products:**
   ```
   GET /categories (populates categoryId)
   GET /products (populates productId)
   GET /products/{{productId}} (uses productId)
   ```

3. **Shopping Flow:**
   ```
   POST /cart/add (uses productId, testQuantity)
   GET /cart (uses authToken)
   POST /orders (uses authToken, address variables)
   ```

4. **Admin Flow:**
   ```
   POST /auth/login (uses adminEmail, adminPassword)
   GET /admin/dashboard/stats (uses adminToken)
   ```

## 🛠️ Customization

### **To Modify Variables:**
1. Go to Environments tab in Postman
2. Click on your environment
3. Edit the "Current Value" column
4. Save changes

### **Common Customizations:**
- Change `baseUrl` for different servers
- Update test credentials
- Modify test data values
- Add custom variables

## 🔍 Troubleshooting

### **Common Issues:**

1. **Token Not Working:**
   - Ensure you ran login first
   - Check if token is populated in environment
   - Verify correct environment is selected

2. **Variables Not Populating:**
   - Check test scripts in requests
   - Ensure environment is selected
   - Run requests in correct order

3. **Server Connection Issues:**
   - Verify baseUrl is correct
   - Check server is running (for localhost)
   - Test with health check endpoint

## 📞 Support

### **Quick Health Checks:**
- **Production**: `{{baseUrl}}/health`
- **Localhost**: `{{localhostUrl}}/health`

### **Documentation:**
- **Swagger**: `{{baseUrl}}/api/docs`
- **API Docs**: `{{baseUrl}}/api/documentation`

---

## 🎉 Ready to Test!

With these environment files, you can:
- ✅ Test all 245+ API endpoints
- ✅ Switch between production and localhost
- ✅ Automatic token management
- ✅ Pre-configured test data
- ✅ Seamless API testing experience

**Import both environments and start testing your APIs! 🚀**
