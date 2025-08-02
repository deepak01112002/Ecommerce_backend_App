const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
let authToken = '';
let adminToken = '';

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test function
const runTest = async (testName, testFunction) => {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    const result = await testFunction();
    if (result.success) {
      console.log(`✅ ${testName} - PASSED`);
      testResults.passed++;
    } else {
      console.log(`❌ ${testName} - FAILED: ${result.error}`);
      testResults.failed++;
      testResults.errors.push({ test: testName, error: result.error });
    }
  } catch (error) {
    console.log(`❌ ${testName} - ERROR: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
};

// Test Cases
const tests = {
  // Health Check
  healthCheck: async () => {
    const result = await makeRequest('GET', '/health');
    return result.status === 200 ? { success: true } : { success: false, error: 'Health check failed' };
  },

  // Auth Tests
  userRegistration: async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      phone: `99${Date.now().toString().slice(-8)}`
    };
    const result = await makeRequest('POST', '/auth/register', userData);
    if (result.success && result.data.token) {
      authToken = result.data.token;
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  adminLoginWithEmail: async () => {
    const adminData = {
      email: 'admin@ghanshyambhandar.com',
      password: 'admin123'
    };
    const result = await makeRequest('POST', '/auth/login', adminData);
    if (result.success && result.data.token) {
      adminToken = result.data.token;
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  userLoginWithPhone: async () => {
    const loginData = {
      phone: '8888888888',
      password: 'password123'
    };
    const result = await makeRequest('POST', '/auth/login', loginData);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  userLoginWithEmail: async () => {
    const loginData = {
      email: 'testphone2@example.com',
      password: 'password123'
    };
    const result = await makeRequest('POST', '/auth/login', loginData);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // User Profile
  getUserProfile: async () => {
    const result = await makeRequest('GET', '/auth/profile', null, authToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Categories
  getCategories: async () => {
    const result = await makeRequest('GET', '/categories');
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Products
  getProducts: async () => {
    const result = await makeRequest('GET', '/products');
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Cart Operations
  getCart: async () => {
    const result = await makeRequest('GET', '/cart', null, authToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Address Operations
  getAddresses: async () => {
    const result = await makeRequest('GET', '/addresses', null, authToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Orders
  getUserOrders: async () => {
    const result = await makeRequest('GET', '/orders', null, authToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Admin Orders
  getAdminOrders: async () => {
    const result = await makeRequest('GET', '/admin/orders', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Admin Products
  getAdminProducts: async () => {
    const result = await makeRequest('GET', '/admin/products', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Admin Categories
  getAdminCategories: async () => {
    const result = await makeRequest('GET', '/admin/categories', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Admin Users
  getAdminUsers: async () => {
    const result = await makeRequest('GET', '/admin/users', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Notifications - New FCM endpoints
  saveFCMToken: async () => {
    const tokenData = { fcmToken: 'test_fcm_token_' + Date.now() };
    const result = await makeRequest('POST', '/notifications/admin/fcm-token', tokenData, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  removeFCMToken: async () => {
    const result = await makeRequest('DELETE', '/notifications/admin/fcm-token', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Analytics
  getAnalytics: async () => {
    const result = await makeRequest('GET', '/admin/analytics', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Inventory
  getInventory: async () => {
    const result = await makeRequest('GET', '/admin/inventory', null, adminToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  },

  // Wallet
  getWallet: async () => {
    const result = await makeRequest('GET', '/wallet', null, authToken);
    return result.success ? { success: true } : { success: false, error: result.error };
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive API Testing...\n');
  console.log('=' .repeat(50));

  // Run tests in order
  await runTest('User Registration', tests.userRegistration);
  await runTest('Admin Login with Email', tests.adminLoginWithEmail);
  await runTest('User Login with Phone', tests.userLoginWithPhone);
  await runTest('User Login with Email', tests.userLoginWithEmail);
  await runTest('Get User Profile', tests.getUserProfile);
  await runTest('Get Categories', tests.getCategories);
  await runTest('Get Products', tests.getProducts);
  await runTest('Get Cart', tests.getCart);
  await runTest('Get Addresses', tests.getAddresses);
  await runTest('Get User Orders', tests.getUserOrders);
  await runTest('Get Admin Orders', tests.getAdminOrders);
  await runTest('Get Admin Products', tests.getAdminProducts);
  await runTest('Get Admin Categories', tests.getAdminCategories);
  await runTest('Get Admin Users', tests.getAdminUsers);
  await runTest('Save FCM Token', tests.saveFCMToken);
  await runTest('Remove FCM Token', tests.removeFCMToken);
  await runTest('Get Analytics', tests.getAnalytics);
  await runTest('Get Inventory', tests.getInventory);
  await runTest('Get Wallet', tests.getWallet);

  // Print results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n🔍 FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`- ${error.test}: ${error.error}`);
    });
  }

  console.log('\n🎉 API Testing Complete!');
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runAllTests().catch(console.error);
