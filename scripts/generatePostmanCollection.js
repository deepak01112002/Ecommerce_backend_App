const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let adminToken = '';
let customerToken = '';

// API Collection for Postman
const apiCollection = {
  info: {
    name: "Ghanshyam Ecommerce Admin Panel APIs",
    description: "Complete API collection for admin panel testing",
    version: "1.0.0"
  },
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{admin_token}}",
        type: "string"
      }
    ]
  },
  variable: [
    {
      key: "base_url",
      value: BASE_URL,
      type: "string"
    },
    {
      key: "admin_token",
      value: "",
      type: "string"
    }
  ],
  item: []
};

// Helper function to make API calls and collect responses
async function apiCall(method, endpoint, data = null, token = null, description = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { 
      success: true, 
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      data: error.response?.data || null
    };
  }
}

// Generate Postman collection
async function generatePostmanCollection() {
  console.log('🎯 GENERATING COMPLETE POSTMAN API COLLECTION'.rainbow.bold);
  console.log('=' .repeat(70).gray);
  
  try {
    // 1. Authentication APIs
    console.log('\n🔐 Testing Authentication APIs'.cyan.bold);
    
    // Admin Login
    const adminLogin = await apiCall('POST', '/auth/login', {
      email: 'admin@admin.com',
      password: 'Admin@123'
    }, null, 'Admin Login');
    
    if (adminLogin.success) {
      adminToken = adminLogin.data.data.token;
      console.log('  ✅ Admin Login successful'.green);
    }
    
    // Add Authentication folder to collection
    const authFolder = {
      name: "🔐 Authentication",
      item: [
        {
          name: "Admin Login",
          request: {
            method: "POST",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "admin@admin.com",
                password: "Admin@123"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            }
          },
          response: [
            {
              name: "Success Response",
              originalRequest: {
                method: "POST",
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    email: "admin@admin.com",
                    password: "Admin@123"
                  })
                }
              },
              status: "OK",
              code: 200,
              body: JSON.stringify(adminLogin.data, null, 2)
            }
          ]
        },
        {
          name: "Get Admin Profile",
          request: {
            method: "GET",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              }
            ],
            url: {
              raw: "{{base_url}}/auth/profile",
              host: ["{{base_url}}"],
              path: ["auth", "profile"]
            }
          }
        },
        {
          name: "Customer Login",
          request: {
            method: "POST",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "customer@demo.com",
                password: "Customer@123"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            }
          }
        }
      ]
    };
    
    apiCollection.item.push(authFolder);
    
    // 2. Dashboard APIs
    console.log('\n📊 Testing Dashboard APIs'.cyan.bold);
    
    const quickStats = await apiCall('GET', '/admin/dashboard/quick-stats', null, adminToken);
    const dashboard = await apiCall('GET', '/admin/dashboard', null, adminToken);
    
    const dashboardFolder = {
      name: "📊 Dashboard",
      item: [
        {
          name: "Quick Stats",
          request: {
            method: "GET",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              }
            ],
            url: {
              raw: "{{base_url}}/admin/dashboard/quick-stats",
              host: ["{{base_url}}"],
              path: ["admin", "dashboard", "quick-stats"]
            }
          },
          response: [
            {
              name: "Success Response",
              status: "OK",
              code: 200,
              body: JSON.stringify(quickStats.data, null, 2)
            }
          ]
        },
        {
          name: "Full Dashboard",
          request: {
            method: "GET",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              }
            ],
            url: {
              raw: "{{base_url}}/admin/dashboard?period=30",
              host: ["{{base_url}}"],
              path: ["admin", "dashboard"],
              query: [
                {
                  key: "period",
                  value: "30"
                }
              ]
            }
          }
        }
      ]
    };
    
    apiCollection.item.push(dashboardFolder);
    
    // 3. Product Management APIs
    console.log('\n📦 Testing Product APIs'.cyan.bold);
    
    const products = await apiCall('GET', '/products?page=1&limit=10', null, adminToken);
    
    const productFolder = {
      name: "📦 Product Management",
      item: [
        {
          name: "Get All Products",
          request: {
            method: "GET",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              }
            ],
            url: {
              raw: "{{base_url}}/products?page=1&limit=10",
              host: ["{{base_url}}"],
              path: ["products"],
              query: [
                {
                  key: "page",
                  value: "1"
                },
                {
                  key: "limit",
                  value: "10"
                }
              ]
            }
          },
          response: [
            {
              name: "Success Response",
              status: "OK",
              code: 200,
              body: JSON.stringify(products.data, null, 2)
            }
          ]
        },
        {
          name: "Search Products",
          request: {
            method: "GET",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              }
            ],
            url: {
              raw: "{{base_url}}/products?search=iphone&page=1&limit=5",
              host: ["{{base_url}}"],
              path: ["products"],
              query: [
                {
                  key: "search",
                  value: "iphone"
                },
                {
                  key: "page",
                  value: "1"
                },
                {
                  key: "limit",
                  value: "5"
                }
              ]
            }
          }
        },
        {
          name: "Create Product",
          request: {
            method: "POST",
            header: [
              {
                key: "Authorization",
                value: "Bearer {{admin_token}}"
              },
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Test Product",
                description: "This is a test product created via API",
                price: 999,
                originalPrice: 1299,
                category: "CATEGORY_ID_HERE",
                stock: 50,
                images: ["https://via.placeholder.com/400x400?text=Test+Product"],
                isActive: true,
                brand: "Test Brand",
                sku: "TEST001"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/products",
              host: ["{{base_url}}"],
              path: ["products"]
            }
          }
        }
      ]
    };
    
    apiCollection.item.push(productFolder);
    
    // Continue with more API collections...
    // Save the collection to file
    const collectionPath = path.join(__dirname, '../docs/Postman_API_Collection.json');
    fs.writeFileSync(collectionPath, JSON.stringify(apiCollection, null, 2));
    
    console.log(`\n📄 Postman collection saved to: ${collectionPath}`.cyan);
    
    // Generate detailed API documentation
    await generateDetailedAPIDoc();
    
  } catch (error) {
    console.log(`\n💥 Collection generation failed: ${error.message}`.red.bold);
  }
}

// Generate detailed API documentation
async function generateDetailedAPIDoc() {
  console.log('\n📋 Generating Detailed API Documentation'.cyan.bold);
  
  const apiDoc = `# 🎯 COMPLETE API TESTING GUIDE FOR POSTMAN

## 🔧 SETUP INSTRUCTIONS

### 1. **Environment Variables**
Create a new environment in Postman with these variables:
- \`base_url\`: http://localhost:8080/api
- \`admin_token\`: (will be set after login)
- \`customer_token\`: (will be set after customer login)

### 2. **Authentication Setup**
First, run the Admin Login request to get the token, then set it in your environment.

---

## 🔐 AUTHENTICATION APIS

### **1. Admin Login**
- **Method:** POST
- **URL:** \`{{base_url}}/auth/login\`
- **Body (JSON):**
\`\`\`json
{
  "email": "admin@admin.com",
  "password": "Admin@123"
}
\`\`\`
- **Expected Response:**
\`\`\`json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@admin.com",
      "role": "admin"
    },
    "token": "JWT_TOKEN_HERE",
    "expires_in": "7d"
  }
}
\`\`\`

### **2. Get Admin Profile**
- **Method:** GET
- **URL:** \`{{base_url}}/auth/profile\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **3. Customer Login**
- **Method:** POST
- **URL:** \`{{base_url}}/auth/login\`
- **Body (JSON):**
\`\`\`json
{
  "email": "customer@demo.com",
  "password": "Customer@123"
}
\`\`\`

---

## 📊 DASHBOARD APIS

### **1. Quick Stats**
- **Method:** GET
- **URL:** \`{{base_url}}/admin/dashboard/quick-stats\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Expected Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "quickStats": {
      "pendingOrders": 12,
      "lowStockItems": 0,
      "unreadNotifications": 5,
      "openTickets": 2,
      "pendingReturns": 1
    }
  }
}
\`\`\`

### **2. Full Dashboard**
- **Method:** GET
- **URL:** \`{{base_url}}/admin/dashboard?period=30\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Query Params:**
  - \`period\`: 30 (days)

---

## 📦 PRODUCT MANAGEMENT APIS

### **1. Get All Products**
- **Method:** GET
- **URL:** \`{{base_url}}/products?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Query Params:**
  - \`page\`: 1
  - \`limit\`: 10
  - \`search\`: (optional) "iphone"
  - \`category\`: (optional) category_id
  - \`min_price\`: (optional) 1000
  - \`max_price\`: (optional) 50000

### **2. Get Single Product**
- **Method:** GET
- **URL:** \`{{base_url}}/products/{product_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **3. Create Product**
- **Method:** POST
- **URL:** \`{{base_url}}/products\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "name": "Test Product API",
  "description": "Product created via API testing",
  "price": 1999,
  "originalPrice": 2999,
  "category": "CATEGORY_ID_HERE",
  "stock": 100,
  "images": ["https://via.placeholder.com/400x400?text=API+Product"],
  "isActive": true,
  "isFeatured": false,
  "brand": "API Brand",
  "sku": "API001",
  "tags": ["api", "test", "product"]
}
\`\`\`

### **4. Update Product**
- **Method:** PUT
- **URL:** \`{{base_url}}/products/{product_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body:** Same as create product

### **5. Delete Product**
- **Method:** DELETE
- **URL:** \`{{base_url}}/products/{product_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

---

## 📁 CATEGORY MANAGEMENT APIS

### **1. Get All Categories**
- **Method:** GET
- **URL:** \`{{base_url}}/categories\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **2. Create Category**
- **Method:** POST
- **URL:** \`{{base_url}}/categories\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "name": "API Test Category",
  "description": "Category created via API",
  "image": "https://via.placeholder.com/300x200?text=API+Category",
  "isActive": true
}
\`\`\`

### **3. Update Category**
- **Method:** PUT
- **URL:** \`{{base_url}}/categories/{category_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **4. Delete Category**
- **Method:** DELETE
- **URL:** \`{{base_url}}/categories/{category_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

---

## 🛒 ORDER MANAGEMENT APIS

### **1. Get All Orders**
- **Method:** GET
- **URL:** \`{{base_url}}/orders?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Query Params:**
  - \`page\`: 1
  - \`limit\`: 10
  - \`status\`: (optional) "pending", "confirmed", "shipped", "delivered"
  - \`search\`: (optional) order number or customer name

### **2. Get Single Order**
- **Method:** GET
- **URL:** \`{{base_url}}/orders/{order_id}\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **3. Update Order Status**
- **Method:** PATCH
- **URL:** \`{{base_url}}/orders/{order_id}/status\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "status": "confirmed",
  "notes": "Order confirmed and ready for processing"
}
\`\`\`

---

## ⚙️ BUSINESS SETTINGS APIS

### **1. Get Business Settings**
- **Method:** GET
- **URL:** \`{{base_url}}/admin/business-settings\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **2. Update Company Info**
- **Method:** PUT
- **URL:** \`{{base_url}}/admin/business-settings/company\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
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
\`\`\`

### **3. Update GST Settings**
- **Method:** PUT
- **URL:** \`{{base_url}}/admin/business-settings/gst\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "enableGST": true,
  "defaultGSTRate": 18,
  "companyGSTIN": "09ABCDE1234F1Z5",
  "taxCalculationMethod": "exclusive"
}
\`\`\`

### **4. Update Payment Settings**
- **Method:** PUT
- **URL:** \`{{base_url}}/admin/business-settings/payments\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "enableCOD": true,
  "enableOnlinePayment": true,
  "enableWalletPayment": true,
  "codCharges": 50,
  "codMinAmount": 100,
  "codMaxAmount": 50000
}
\`\`\`

### **5. Update Order Settings**
- **Method:** PUT
- **URL:** \`{{base_url}}/admin/business-settings/orders\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "minOrderAmount": 100,
  "maxOrderAmount": 100000,
  "allowGuestCheckout": true,
  "autoConfirmOrders": false
}
\`\`\`

---

## 👥 USER MANAGEMENT APIS

### **1. Get All Users**
- **Method:** GET
- **URL:** \`{{base_url}}/admin/management/users?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Query Params:**
  - \`page\`: 1
  - \`limit\`: 10
  - \`role\`: "user" or "admin"
  - \`search\`: user name or email

### **2. Update User Status**
- **Method:** PATCH
- **URL:** \`{{base_url}}/admin/management/users/{user_id}/status\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`
- **Body (JSON):**
\`\`\`json
{
  "isActive": true
}
\`\`\`

---

## 🚀 ADVANCED FEATURES APIS

### **1. Invoices**
- **Method:** GET
- **URL:** \`{{base_url}}/invoices?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **2. Suppliers**
- **Method:** GET
- **URL:** \`{{base_url}}/suppliers?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **3. Inventory Dashboard**
- **Method:** GET
- **URL:** \`{{base_url}}/inventory/dashboard\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **4. Purchase Orders**
- **Method:** GET
- **URL:** \`{{base_url}}/purchase-orders?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **5. Returns**
- **Method:** GET
- **URL:** \`{{base_url}}/returns/admin/all?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **6. Support Dashboard**
- **Method:** GET
- **URL:** \`{{base_url}}/support/admin/dashboard\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **7. Notifications**
- **Method:** GET
- **URL:** \`{{base_url}}/notifications?page=1&limit=10\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

---

## 🔧 SYSTEM SETTINGS APIS

### **1. Get System Settings**
- **Method:** GET
- **URL:** \`{{base_url}}/settings\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **2. Validate Settings**
- **Method:** GET
- **URL:** \`{{base_url}}/settings/validate\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

### **3. System Status**
- **Method:** GET
- **URL:** \`{{base_url}}/settings/status\`
- **Headers:** \`Authorization: Bearer {{admin_token}}\`

---

## 🎯 TESTING WORKFLOW

### **Step 1: Authentication**
1. Run Admin Login to get token
2. Set token in environment variable
3. Test Get Profile to verify token

### **Step 2: Dashboard Testing**
1. Test Quick Stats
2. Test Full Dashboard
3. Verify data is showing

### **Step 3: CRUD Operations**
1. Test Get All Products/Categories/Orders
2. Test Create new items
3. Test Update existing items
4. Test Delete items

### **Step 4: Business Settings**
1. Get current settings
2. Update company info
3. Update GST settings
4. Update payment settings

### **Step 5: Advanced Features**
1. Test all advanced APIs
2. Verify responses
3. Check data integrity

---

## 📊 EXPECTED RESPONSE FORMATS

All APIs return responses in this format:
\`\`\`json
{
  "success": true/false,
  "message": "Response message",
  "data": {
    // Actual response data
  },
  "errors": [],
  "meta": {
    "timestamp": "2025-07-19T19:45:00.000Z",
    "request_id": "unique-request-id",
    "version": "1.0",
    "platform": "api"
  }
}
\`\`\`

---

**🎯 READY FOR COMPLETE API TESTING! 🎯**
`;

  const docPath = path.join(__dirname, '../docs/COMPLETE_API_TESTING_GUIDE.md');
  fs.writeFileSync(docPath, apiDoc);
  
  console.log(`📄 Complete API testing guide saved to: ${docPath}`.cyan);
}

// Run the generator
if (require.main === module) {
  generatePostmanCollection();
}

module.exports = { generatePostmanCollection };
