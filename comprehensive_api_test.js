// Comprehensive API Testing Script - A to Z User Journey
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(testName, success, details = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   ${details}`);
    
    testResults.tests.push({ name: testName, success, details });
    if (success) testResults.passed++;
    else testResults.failed++;
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers,
            ...(data && { data })
        };
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive API Testing - A to Z User Journey\n');
    
    let userToken = '';
    let adminToken = '';
    let userId = '';
    let productId = '';
    let categoryId = '';
    let orderId = '';
    let addressId = '';
    
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPhone = `9${timestamp.toString().slice(-9)}`;

    try {
        // ==================== AUTHENTICATION TESTS ====================
        console.log('🔐 AUTHENTICATION TESTS');
        
        // 1. User Registration
        const registerResult = await apiCall('POST', '/auth/register', {
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            password: 'password123',
            phone: testPhone
        });
        logTest('User Registration', registerResult.success, 
            registerResult.success ? `User ID: ${registerResult.data.data.user._id}` : registerResult.error.message);
        
        if (registerResult.success) {
            userId = registerResult.data.data.user._id;
        }

        // 2. User Login
        const loginResult = await apiCall('POST', '/auth/login', {
            email: testEmail,
            password: 'password123'
        });
        logTest('User Login', loginResult.success,
            loginResult.success ? 'Token received' : loginResult.error.message);
        
        if (loginResult.success) {
            userToken = loginResult.data.data.token;
        }

        // 3. Admin Login
        const adminLoginResult = await apiCall('POST', '/auth/login', {
            email: 'admin@ghanshyambhandar.com',
            password: 'admin123'
        });
        logTest('Admin Login', adminLoginResult.success,
            adminLoginResult.success ? 'Admin token received' : adminLoginResult.error.message);
        
        if (adminLoginResult.success) {
            adminToken = adminLoginResult.data.data.token;
        }

        // ==================== CATEGORY TESTS ====================
        console.log('\n📂 CATEGORY TESTS');
        
        // 4. Get Categories
        const categoriesResult = await apiCall('GET', '/categories');
        logTest('Get Categories', categoriesResult.success,
            categoriesResult.success ? `Found ${categoriesResult.data.data.length} categories` : categoriesResult.error.message);
        
        if (categoriesResult.success && categoriesResult.data.data.length > 0) {
            categoryId = categoriesResult.data.data[0]._id;
        }

        // ==================== PRODUCT TESTS ====================
        console.log('\n🛍️ PRODUCT TESTS');
        
        // 5. Get Products
        const productsResult = await apiCall('GET', '/products');
        logTest('Get Products', productsResult.success,
            productsResult.success ? `Found ${productsResult.data.data.products.length} products` : productsResult.error.message);
        
        if (productsResult.success && productsResult.data.data.products.length > 0) {
            productId = productsResult.data.data.products[0]._id;
        }

        // 6. Get Single Product
        if (productId) {
            const productResult = await apiCall('GET', `/products/${productId}`);
            logTest('Get Single Product', productResult.success,
                productResult.success ? `Product: ${productResult.data.data.name}` : productResult.error.message);
        }

        // ==================== USER PROFILE TESTS ====================
        console.log('\n👤 USER PROFILE TESTS');
        
        // 7. Get User Profile
        const profileResult = await apiCall('GET', '/auth/profile', null, {
            Authorization: `Bearer ${userToken}`
        });
        logTest('Get User Profile', profileResult.success,
            profileResult.success ? `User: ${profileResult.data.data.firstName} ${profileResult.data.data.lastName}` : profileResult.error.message);

        // ==================== ADDRESS TESTS ====================
        console.log('\n🏠 ADDRESS TESTS');
        
        // 8. Add Address
        const addAddressResult = await apiCall('POST', '/addresses', {
            type: 'home',
            firstName: 'Test',
            lastName: 'User',
            phone: testPhone,
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            country: 'India',
            isDefault: true
        }, {
            Authorization: `Bearer ${userToken}`
        });
        logTest('Add Address', addAddressResult.success,
            addAddressResult.success ? `Address ID: ${addAddressResult.data.data._id}` : addAddressResult.error.message);
        
        if (addAddressResult.success) {
            addressId = addAddressResult.data.data._id;
        }

        // 9. Get User Addresses
        const addressesResult = await apiCall('GET', '/addresses', null, {
            Authorization: `Bearer ${userToken}`
        });
        logTest('Get User Addresses', addressesResult.success,
            addressesResult.success ? `Found ${addressesResult.data.data.length} addresses` : addressesResult.error.message);

        // ==================== CART TESTS ====================
        console.log('\n🛒 CART TESTS');

        // 10. Add to Cart
        if (productId) {
            const addToCartResult = await apiCall('POST', '/cart/add', {
                productId: productId,
                quantity: 2
            }, {
                Authorization: `Bearer ${userToken}`
            });
            logTest('Add to Cart', addToCartResult.success,
                addToCartResult.success ? `Added 2 items to cart` : addToCartResult.error.message);
        }

        // 11. Get Cart
        const cartResult = await apiCall('GET', '/cart', null, {
            Authorization: `Bearer ${userToken}`
        });
        logTest('Get Cart', cartResult.success,
            cartResult.success ? `Cart has ${cartResult.data.data.items?.length || 0} items` : cartResult.error.message);

        // ==================== ORDER TESTS ====================
        console.log('\n📦 ORDER TESTS');

        // 12. Create COD Order
        if (addressId && productId) {
            const createOrderResult = await apiCall('POST', '/orders', {
                items: [{
                    product: productId,
                    quantity: 1,
                    unitPrice: 500
                }],
                shippingAddress: addressId,
                paymentMethod: 'cod',
                notes: 'Test order from comprehensive API test'
            }, {
                Authorization: `Bearer ${userToken}`
            });
            logTest('Create COD Order', createOrderResult.success,
                createOrderResult.success ? `Order: ${createOrderResult.data.data.orderNumber}` : createOrderResult.error.message);

            if (createOrderResult.success) {
                orderId = createOrderResult.data.data._id;
            }
        }

        // 13. Get User Orders
        const userOrdersResult = await apiCall('GET', '/orders', null, {
            Authorization: `Bearer ${userToken}`
        });
        logTest('Get User Orders', userOrdersResult.success,
            userOrdersResult.success ? `Found ${userOrdersResult.data.data.orders.length} orders` : userOrdersResult.error.message);

        // ==================== ADMIN TESTS ====================
        console.log('\n👨‍💼 ADMIN TESTS');

        // 14. Admin Get All Orders
        const adminOrdersResult = await apiCall('GET', '/orders/admin/all', null, {
            Authorization: `Bearer ${adminToken}`
        });
        logTest('Admin Get All Orders', adminOrdersResult.success,
            adminOrdersResult.success ? `Found ${adminOrdersResult.data.data.orders.length} orders` : adminOrdersResult.error.message);

        // 15. Admin Dashboard
        const dashboardResult = await apiCall('GET', '/admin/dashboard', null, {
            Authorization: `Bearer ${adminToken}`
        });
        logTest('Admin Dashboard', dashboardResult.success,
            dashboardResult.success ? `Dashboard loaded with ${dashboardResult.data.data.dashboard.recentOrders.length} recent orders` : dashboardResult.error.message);

        // ==================== PAYMENT TESTS ====================
        console.log('\n💳 PAYMENT TESTS');

        // 16. Get Payment Methods
        const paymentMethodsResult = await apiCall('GET', '/payments/methods');
        logTest('Get Payment Methods', paymentMethodsResult.success,
            paymentMethodsResult.success ? 'Payment methods retrieved' : paymentMethodsResult.error.message);

        // ==================== SEARCH & FILTER TESTS ====================
        console.log('\n🔍 SEARCH & FILTER TESTS');

        // 17. Search Products
        const searchResult = await apiCall('GET', '/products?search=test');
        logTest('Search Products', searchResult.success,
            searchResult.success ? `Search returned ${searchResult.data.data.products.length} results` : searchResult.error.message);

        // 18. Filter Products by Category
        if (categoryId) {
            const filterResult = await apiCall('GET', `/products?category=${categoryId}`);
            logTest('Filter Products by Category', filterResult.success,
                filterResult.success ? `Filter returned ${filterResult.data.data.products.length} results` : filterResult.error.message);
        }

        console.log('\n📊 FINAL TEST SUMMARY:');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

        if (testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            testResults.tests.filter(t => !t.success).forEach(test => {
                console.log(`   - ${test.name}: ${test.details}`);
            });
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

runComprehensiveTests();
