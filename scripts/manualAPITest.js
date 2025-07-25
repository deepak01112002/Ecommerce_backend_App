const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let adminToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
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
      status: response.status
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

// Test all APIs and generate manual testing guide
async function generateManualTestingGuide() {
  console.log('🎯 GENERATING MANUAL API TESTING GUIDE WITH REAL RESPONSES'.rainbow.bold);
  console.log('=' .repeat(80).gray);
  
  const testResults = [];
  
  try {
    // 1. Authentication
    console.log('\n🔐 Testing Authentication APIs'.cyan.bold);
    
    const adminLogin = await apiCall('POST', '/auth/login', {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    
    if (adminLogin.success) {
      adminToken = adminLogin.data.data.token;
      console.log('  ✅ Admin Login successful'.green);
      
      testResults.push({
        category: 'Authentication',
        name: 'Admin Login',
        method: 'POST',
        url: '/auth/login',
        body: {
          email: 'admin@admin.com',
          password: 'Admin@123'
        },
        response: adminLogin.data,
        status: adminLogin.status
      });
    }
    
    // Get Profile
    const profile = await apiCall('GET', '/auth/profile', null, adminToken);
    if (profile.success) {
      console.log('  ✅ Get Profile successful'.green);
      testResults.push({
        category: 'Authentication',
        name: 'Get Admin Profile',
        method: 'GET',
        url: '/auth/profile',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: profile.data,
        status: profile.status
      });
    }
    
    // 2. Dashboard APIs
    console.log('\n📊 Testing Dashboard APIs'.cyan.bold);
    
    const quickStats = await apiCall('GET', '/admin/dashboard/quick-stats', null, adminToken);
    if (quickStats.success) {
      console.log('  ✅ Quick Stats successful'.green);
      testResults.push({
        category: 'Dashboard',
        name: 'Quick Stats',
        method: 'GET',
        url: '/admin/dashboard/quick-stats',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: quickStats.data,
        status: quickStats.status
      });
    }
    
    // 3. Products APIs
    console.log('\n📦 Testing Products APIs'.cyan.bold);
    
    const products = await apiCall('GET', '/products?page=1&limit=5', null, adminToken);
    if (products.success) {
      console.log('  ✅ Get Products successful'.green);
      testResults.push({
        category: 'Products',
        name: 'Get All Products',
        method: 'GET',
        url: '/products?page=1&limit=5',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: products.data,
        status: products.status
      });
    }
    
    // 4. Categories APIs
    console.log('\n📁 Testing Categories APIs'.cyan.bold);
    
    const categories = await apiCall('GET', '/categories', null, adminToken);
    if (categories.success) {
      console.log('  ✅ Get Categories successful'.green);
      testResults.push({
        category: 'Categories',
        name: 'Get All Categories',
        method: 'GET',
        url: '/categories',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: {
          ...categories.data,
          data: {
            ...categories.data.data,
            categories: categories.data.data.categories?.slice(0, 3) || [] // Limit to first 3 for readability
          }
        },
        status: categories.status
      });
    }
    
    // 5. Orders APIs
    console.log('\n🛒 Testing Orders APIs'.cyan.bold);
    
    const orders = await apiCall('GET', '/orders?page=1&limit=5', null, adminToken);
    if (orders.success) {
      console.log('  ✅ Get Orders successful'.green);
      testResults.push({
        category: 'Orders',
        name: 'Get All Orders',
        method: 'GET',
        url: '/orders?page=1&limit=5',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: orders.data,
        status: orders.status
      });
    }
    
    // 6. Business Settings APIs
    console.log('\n⚙️  Testing Business Settings APIs'.cyan.bold);
    
    const businessSettings = await apiCall('GET', '/admin/business-settings', null, adminToken);
    if (businessSettings.success) {
      console.log('  ✅ Get Business Settings successful'.green);
      testResults.push({
        category: 'Business Settings',
        name: 'Get Business Settings',
        method: 'GET',
        url: '/admin/business-settings',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        response: businessSettings.data,
        status: businessSettings.status
      });
    }
    
    // Test Update Company Info
    const updateCompany = await apiCall('PUT', '/admin/business-settings/company', {
      companyName: 'Ghanshyam Murti Bhandar',
      gstin: '09ABCDE1234F1Z5',
      contactPhone: '+91-9999999999'
    }, adminToken);
    
    if (updateCompany.success) {
      console.log('  ✅ Update Company Info successful'.green);
      testResults.push({
        category: 'Business Settings',
        name: 'Update Company Info',
        method: 'PUT',
        url: '/admin/business-settings/company',
        headers: { Authorization: 'Bearer {{admin_token}}' },
        body: {
          companyName: 'Ghanshyam Murti Bhandar',
          gstin: '09ABCDE1234F1Z5',
          contactPhone: '+91-9999999999'
        },
        response: updateCompany.data,
        status: updateCompany.status
      });
    }
    
    // 7. Advanced Features
    console.log('\n🚀 Testing Advanced Features APIs'.cyan.bold);
    
    const advancedAPIs = [
      { endpoint: '/invoices', name: 'Invoices' },
      { endpoint: '/suppliers', name: 'Suppliers' },
      { endpoint: '/inventory/dashboard', name: 'Inventory Dashboard' },
      { endpoint: '/notifications', name: 'Notifications' },
      { endpoint: '/settings', name: 'System Settings' }
    ];
    
    for (const api of advancedAPIs) {
      const result = await apiCall('GET', api.endpoint, null, adminToken);
      if (result.success) {
        console.log(`  ✅ ${api.name} successful`.green);
        testResults.push({
          category: 'Advanced Features',
          name: api.name,
          method: 'GET',
          url: api.endpoint,
          headers: { Authorization: 'Bearer {{admin_token}}' },
          response: result.data,
          status: result.status
        });
      }
    }
    
    // Generate the manual testing guide
    const manualGuide = generateManualGuideContent(testResults);
    
    const guidePath = path.join(__dirname, '../docs/MANUAL_API_TESTING_GUIDE.md');
    fs.writeFileSync(guidePath, manualGuide);
    
    console.log(`\n📄 Manual API testing guide saved to: ${guidePath}`.cyan);
    console.log('\n🎯 MANUAL TESTING GUIDE GENERATED SUCCESSFULLY!'.green.bold);
    
  } catch (error) {
    console.log(`\n💥 Guide generation failed: ${error.message}`.red.bold);
  }
}

function generateManualGuideContent(testResults) {
  let guide = `# 🎯 MANUAL API TESTING GUIDE FOR POSTMAN

## 🔧 SETUP INSTRUCTIONS

### **Environment Setup**
1. Create new environment in Postman
2. Add variables:
   - \`base_url\`: http://localhost:8080/api
   - \`admin_token\`: (will be set after login)

### **Authentication Flow**
1. First run Admin Login to get token
2. Copy token from response
3. Set token in environment variable
4. Use \`{{admin_token}}\` in Authorization headers

---

## 📋 ALL API ENDPOINTS WITH REAL RESPONSES

`;

  // Group by category
  const categories = {};
  testResults.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  });

  Object.entries(categories).forEach(([category, tests]) => {
    guide += `\n## ${getCategoryIcon(category)} ${category.toUpperCase()} APIS\n\n`;
    
    tests.forEach((test, index) => {
      guide += `### **${index + 1}. ${test.name}**\n\n`;
      guide += `- **Method:** ${test.method}\n`;
      guide += `- **URL:** \`{{base_url}}${test.url}\`\n`;
      
      if (test.headers) {
        guide += `- **Headers:**\n`;
        Object.entries(test.headers).forEach(([key, value]) => {
          guide += `  - \`${key}: ${value}\`\n`;
        });
      }
      
      if (test.body) {
        guide += `- **Body (JSON):**\n\`\`\`json\n${JSON.stringify(test.body, null, 2)}\n\`\`\`\n`;
      }
      
      guide += `- **Expected Status:** ${test.status}\n`;
      guide += `- **Expected Response:**\n\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n\n`;
      guide += `---\n\n`;
    });
  });

  guide += `
## 🎯 TESTING WORKFLOW

### **Step 1: Authentication** 🔐
1. **Admin Login**
   - Method: POST
   - URL: \`{{base_url}}/auth/login\`
   - Body: {"email": "admin@admin.com", "password": "Admin@123"}
   - Copy token from response
   - Set \`admin_token\` environment variable

2. **Verify Profile**
   - Method: GET
   - URL: \`{{base_url}}/auth/profile\`
   - Headers: Authorization: Bearer {{admin_token}}

### **Step 2: Dashboard Testing** 📊
1. **Quick Stats**
   - Method: GET
   - URL: \`{{base_url}}/admin/dashboard/quick-stats\`
   - Should show pending orders, low stock items, etc.

### **Step 3: Product Management** 📦
1. **Get Products**
   - Method: GET
   - URL: \`{{base_url}}/products?page=1&limit=10\`
   - Should return products with pagination

2. **Search Products**
   - Method: GET
   - URL: \`{{base_url}}/products?search=iphone&page=1&limit=5\`

### **Step 4: Category Management** 📁
1. **Get Categories**
   - Method: GET
   - URL: \`{{base_url}}/categories\`
   - Should return all categories

### **Step 5: Order Management** 🛒
1. **Get Orders**
   - Method: GET
   - URL: \`{{base_url}}/orders?page=1&limit=10\`
   - Should return orders with pagination

### **Step 6: Business Settings** ⚙️
1. **Get Settings**
   - Method: GET
   - URL: \`{{base_url}}/admin/business-settings\`

2. **Update Company Info**
   - Method: PUT
   - URL: \`{{base_url}}/admin/business-settings/company\`
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
\`\`\`json
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
\`\`\`

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
`;

  return guide;
}

function getCategoryIcon(category) {
  const icons = {
    'Authentication': '🔐',
    'Dashboard': '📊',
    'Products': '📦',
    'Categories': '📁',
    'Orders': '🛒',
    'Business Settings': '⚙️',
    'Advanced Features': '🚀'
  };
  return icons[category] || '🎯';
}

// Run the generator
if (require.main === module) {
  generateManualTestingGuide();
}

module.exports = { generateManualTestingGuide };
