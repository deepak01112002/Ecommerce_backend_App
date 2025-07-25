const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let adminToken = '';
let customerToken = '';

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0
  },
  categories: {},
  detailedResults: []
};

// Helper function to make API calls
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
    
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    const result = {
      method,
      endpoint,
      description,
      status: 'PASS',
      statusCode: response.status,
      responseTime: `${responseTime}ms`,
      responseData: response.data,
      error: null
    };
    
    testResults.summary.totalTests++;
    testResults.summary.passedTests++;
    testResults.detailedResults.push(result);
    
    return { success: true, data: response.data, result };
  } catch (error) {
    const result = {
      method,
      endpoint,
      description,
      status: 'FAIL',
      statusCode: error.response?.status || 0,
      responseTime: '0ms',
      responseData: null,
      error: error.response?.data?.message || error.message
    };
    
    testResults.summary.totalTests++;
    testResults.summary.failedTests++;
    testResults.detailedResults.push(result);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      result
    };
  }
}

// Test Authentication APIs
async function testAuthenticationAPIs() {
  console.log('\n🔐 Testing Authentication APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  // Admin Login
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@admin.com',
    password: 'Admin@123'
  }, null, 'Admin Login');
  
  if (adminLogin.success) {
    adminToken = adminLogin.data.data.token;
    console.log('  ✅ Admin Login'.green);
    categoryResults.passed++;
  } else {
    console.log('  ❌ Admin Login'.red);
  }
  categoryResults.total++;
  
  // Customer Login - Create a test customer first or use existing
  const customerLogin = await apiCall('POST', '/auth/login', {
    email: 'user@user.com',
    password: 'User@123'
  }, null, 'Customer Login');
  
  if (customerLogin.success) {
    customerToken = customerLogin.data.data.token;
    console.log('  ✅ Customer Login'.green);
    categoryResults.passed++;
  } else {
    console.log('  ❌ Customer Login'.red);
  }
  categoryResults.total++;
  
  // Get Admin Profile
  const adminProfile = await apiCall('GET', '/auth/profile', null, adminToken, 'Get Admin Profile');
  console.log(`  ${adminProfile.success ? '✅' : '❌'} Get Admin Profile`[adminProfile.success ? 'green' : 'red']);
  if (adminProfile.success) categoryResults.passed++;
  categoryResults.total++;
  
  // Get Customer Profile
  const customerProfile = await apiCall('GET', '/auth/profile', null, customerToken, 'Get Customer Profile');
  console.log(`  ${customerProfile.success ? '✅' : '❌'} Get Customer Profile`[customerProfile.success ? 'green' : 'red']);
  if (customerProfile.success) categoryResults.passed++;
  categoryResults.total++;
  
  testResults.categories.authentication = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Admin Dashboard APIs
async function testAdminDashboardAPIs() {
  console.log('\n📊 Testing Admin Dashboard APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { endpoint: '/admin/dashboard', description: 'Get Admin Dashboard' },
    { endpoint: '/admin/dashboard/quick-stats', description: 'Get Quick Stats' }
  ];
  
  for (const test of tests) {
    const result = await apiCall('GET', test.endpoint, null, adminToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.adminDashboard = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Business Settings APIs
async function testBusinessSettingsAPIs() {
  console.log('\n⚙️  Testing Business Settings APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  // Get Business Settings
  const getSettings = await apiCall('GET', '/admin/business-settings', null, adminToken, 'Get Business Settings');
  console.log(`  ${getSettings.success ? '✅' : '❌'} Get Business Settings`[getSettings.success ? 'green' : 'red']);
  if (getSettings.success) categoryResults.passed++;
  categoryResults.total++;
  
  // Update Company Info
  const updateCompany = await apiCall('PUT', '/admin/business-settings/company', {
    companyName: 'Ghanshyam Murti Bhandar Demo',
    gstin: '09ABCDE1234F1Z5',
    contactPhone: '+91-9999999999'
  }, adminToken, 'Update Company Info');
  console.log(`  ${updateCompany.success ? '✅' : '❌'} Update Company Info`[updateCompany.success ? 'green' : 'red']);
  if (updateCompany.success) categoryResults.passed++;
  categoryResults.total++;
  
  // Update GST Settings
  const updateGST = await apiCall('PUT', '/admin/business-settings/gst', {
    enableGST: true,
    defaultGSTRate: 18
  }, adminToken, 'Update GST Settings');
  console.log(`  ${updateGST.success ? '✅' : '❌'} Update GST Settings`[updateGST.success ? 'green' : 'red']);
  if (updateGST.success) categoryResults.passed++;
  categoryResults.total++;
  
  // Update Payment Settings
  const updatePayment = await apiCall('PUT', '/admin/business-settings/payments', {
    enableCOD: true,
    codCharges: 50,
    enableOnlinePayment: true
  }, adminToken, 'Update Payment Settings');
  console.log(`  ${updatePayment.success ? '✅' : '❌'} Update Payment Settings`[updatePayment.success ? 'green' : 'red']);
  if (updatePayment.success) categoryResults.passed++;
  categoryResults.total++;
  
  testResults.categories.businessSettings = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Product Management APIs
async function testProductManagementAPIs() {
  console.log('\n📦 Testing Product Management APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { method: 'GET', endpoint: '/products', description: 'Get All Products' },
    { method: 'GET', endpoint: '/categories', description: 'Get All Categories' },
    { method: 'POST', endpoint: '/categories', data: { name: 'Test Category', description: 'Test category for API testing' }, description: 'Create Category' }
  ];
  
  for (const test of tests) {
    const result = await apiCall(test.method, test.endpoint, test.data, adminToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.productManagement = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Order Management APIs
async function testOrderManagementAPIs() {
  console.log('\n🛒 Testing Order Management APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { method: 'GET', endpoint: '/orders', description: 'Get All Orders' },
    { method: 'GET', endpoint: '/admin/management/users', description: 'Get All Users' }
  ];
  
  for (const test of tests) {
    const result = await apiCall(test.method, test.endpoint, null, adminToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.orderManagement = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Advanced Features APIs
async function testAdvancedFeaturesAPIs() {
  console.log('\n🚀 Testing Advanced Features APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { endpoint: '/invoices', description: 'Get All Invoices' },
    { endpoint: '/gst/config', description: 'Get GST Config' },
    { endpoint: '/inventory/dashboard', description: 'Get Inventory Dashboard' },
    { endpoint: '/suppliers', description: 'Get All Suppliers' },
    { endpoint: '/purchase-orders', description: 'Get Purchase Orders' },
    { endpoint: '/returns/admin/all', description: 'Get All Returns' },
    { endpoint: '/support/admin/dashboard', description: 'Get Support Dashboard' },
    { endpoint: '/notifications', description: 'Get All Notifications' }
  ];
  
  for (const test of tests) {
    const result = await apiCall('GET', test.endpoint, null, adminToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.advancedFeatures = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test System Settings APIs
async function testSystemSettingsAPIs() {
  console.log('\n🔧 Testing System Settings APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { endpoint: '/settings', description: 'Get System Settings' },
    { endpoint: '/settings/validate', description: 'Validate Settings' },
    { endpoint: '/settings/status', description: 'Get System Status' }
  ];
  
  for (const test of tests) {
    const result = await apiCall('GET', test.endpoint, null, adminToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.systemSettings = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Test Customer APIs
async function testCustomerAPIs() {
  console.log('\n👤 Testing Customer APIs'.cyan.bold);
  const categoryResults = { passed: 0, total: 0 };
  
  const tests = [
    { endpoint: '/cart', description: 'Get Customer Cart' },
    { endpoint: '/wishlist', description: 'Get Customer Wishlist' },
    { endpoint: '/wallet', description: 'Get Customer Wallet' },
    { endpoint: '/addresses', description: 'Get Customer Addresses' }
  ];
  
  for (const test of tests) {
    const result = await apiCall('GET', test.endpoint, null, customerToken, test.description);
    console.log(`  ${result.success ? '✅' : '❌'} ${test.description}`[result.success ? 'green' : 'red']);
    if (result.success) categoryResults.passed++;
    categoryResults.total++;
  }
  
  testResults.categories.customerAPIs = categoryResults;
  return categoryResults.passed === categoryResults.total;
}

// Generate Test Report
function generateTestReport() {
  testResults.summary.successRate = ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2);
  
  const reportContent = `# 🎯 COMPREHENSIVE API TEST REPORT

## 📊 Test Summary
- **Total Tests:** ${testResults.summary.totalTests}
- **Passed Tests:** ${testResults.summary.passedTests}
- **Failed Tests:** ${testResults.summary.failedTests}
- **Success Rate:** ${testResults.summary.successRate}%

## 📋 Category Results
${Object.entries(testResults.categories).map(([category, results]) => 
  `- **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${results.passed}/${results.total} (${((results.passed/results.total)*100).toFixed(1)}%)`
).join('\n')}

## 🔍 Detailed Test Results

${testResults.detailedResults.map((result, index) => `
### ${index + 1}. ${result.description}
- **Method:** ${result.method}
- **Endpoint:** ${result.endpoint}
- **Status:** ${result.status}
- **Status Code:** ${result.statusCode}
- **Response Time:** ${result.responseTime}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.responseData ? `- **Response:** \`\`\`json\n${JSON.stringify(result.responseData, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## 🎯 Demo Credentials Used

### 👨‍💼 Admin Credentials
- **Email:** admin@admin.com
- **Password:** Admin@123
- **Role:** Admin

### 👤 Customer Credentials
- **Email:** user@user.com
- **Password:** User@123
- **Role:** Customer

## 📝 Test Environment
- **Base URL:** ${BASE_URL}
- **Test Date:** ${new Date().toISOString()}
- **Node.js Version:** ${process.version}

---
*Generated by Comprehensive API Test Suite*
`;

  // Save report to file
  const reportPath = path.join(__dirname, '../docs/API_TEST_REPORT.md');
  fs.writeFileSync(reportPath, reportContent);
  
  return reportPath;
}

// Main test function
async function runComprehensiveAPITest() {
  console.log('🎯 COMPREHENSIVE API TEST SUITE'.rainbow.bold);
  console.log('=' .repeat(70).gray);
  
  try {
    // Run all test categories
    await testAuthenticationAPIs();
    await testAdminDashboardAPIs();
    await testBusinessSettingsAPIs();
    await testProductManagementAPIs();
    await testOrderManagementAPIs();
    await testAdvancedFeaturesAPIs();
    await testSystemSettingsAPIs();
    await testCustomerAPIs();
    
    // Generate and save report
    const reportPath = generateTestReport();
    
    // Print final results
    console.log('\n🎯 COMPREHENSIVE API TEST RESULTS'.rainbow.bold);
    console.log('=' .repeat(70).gray);
    
    console.log(`📊 Total Tests: ${testResults.summary.totalTests}`);
    console.log(`✅ Passed: ${testResults.summary.passedTests.toString().green}`);
    console.log(`❌ Failed: ${testResults.summary.failedTests.toString().red}`);
    console.log(`🎯 Success Rate: ${testResults.summary.successRate}%`.yellow.bold);
    
    console.log('\n📋 Category Results:'.cyan.bold);
    Object.entries(testResults.categories).forEach(([category, results]) => {
      const successRate = ((results.passed/results.total)*100).toFixed(1);
      const status = results.passed === results.total ? '✅' : '⚠️';
      console.log(`  ${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${results.passed}/${results.total} (${successRate}%)`);
    });
    
    if (testResults.summary.successRate >= 90) {
      console.log('\n🎉 EXCELLENT! APIs are production ready! 🎉'.green.bold);
    } else if (testResults.summary.successRate >= 80) {
      console.log('\n✅ GOOD! Most APIs are working well.'.yellow.bold);
    } else {
      console.log('\n⚠️  NEEDS ATTENTION! Some APIs need fixes.'.red.bold);
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`.cyan);
    
  } catch (error) {
    console.log(`\n💥 Test execution failed: ${error.message}`.red.bold);
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveAPITest();
}

module.exports = { runComprehensiveAPITest };
