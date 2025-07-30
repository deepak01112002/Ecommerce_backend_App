#!/usr/bin/env node

/**
 * Complete User Flow Testing Script
 * Tests 3 different user scenarios:
 * 1. User with COD payment + Shiprocket shipping
 * 2. User with Razorpay payment
 * 3. User with complete order flow
 */

const axios = require('axios');

// Server configuration
const PRODUCTION_URL = 'https://server.ghanshyammurtibhandar.com/api';
const API_URL = PRODUCTION_URL;

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Test users data
const testUsers = [
    {
        id: 1,
        name: 'COD User',
        data: {
            firstName: 'Rajesh',
            lastName: 'Kumar',
            email: 'rajesh.cod@example.com',
            password: 'password123',
            phone: '9876543210'
        },
        paymentMethod: 'cod',
        description: 'User ordering with Cash on Delivery + Shiprocket shipping'
    },
    {
        id: 2,
        name: 'Razorpay User',
        data: {
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'priya.razorpay@example.com',
            password: 'password123',
            phone: '9876543211'
        },
        paymentMethod: 'razorpay',
        description: 'User ordering with Razorpay payment'
    }
];

// Test address
const testAddress = {
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543210',
    addressLine1: '123 Test Street',
    addressLine2: 'Near Test Market',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    isDefault: true
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null, description = '') {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            timeout: 30000,
            ...(data && { data })
        };
        
        const startTime = Date.now();
        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        
        console.log(`  ${colors.green}✅ ${description} (${responseTime}ms)${colors.reset}`);
        return {
            success: true,
            data: response.data,
            status: response.status,
            responseTime
        };
    } catch (error) {
        console.log(`  ${colors.red}❌ ${description} - ${error.response?.data?.message || error.message}${colors.reset}`);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status || 0,
            responseTime: 0
        };
    }
}

// Test user flow
async function testUserFlow(user) {
    console.log(`\n${colors.bold}${colors.blue}🧪 Testing ${user.name} Flow${colors.reset}`);
    console.log(`${colors.cyan}${user.description}${colors.reset}\n`);
    
    let userToken = '';
    let productId = '';
    let orderId = '';
    
    const results = {
        user: user.name,
        steps: [],
        success: true,
        totalTime: 0
    };
    
    const startTime = Date.now();
    
    try {
        // Step 1: Register User
        console.log(`${colors.yellow}📝 Step 1: User Registration${colors.reset}`);
        const registerResult = await apiCall('POST', '/auth/register', user.data, null, 'Register new user');
        results.steps.push({ step: 'Registration', success: registerResult.success });
        
        if (!registerResult.success && !registerResult.error.includes('already exists')) {
            results.success = false;
            return results;
        }
        
        // Step 2: Login User
        console.log(`\n${colors.yellow}🔐 Step 2: User Login${colors.reset}`);
        const loginResult = await apiCall('POST', '/auth/login', {
            email: user.data.email,
            password: user.data.password
        }, null, 'User login');
        results.steps.push({ step: 'Login', success: loginResult.success });
        
        if (!loginResult.success) {
            results.success = false;
            return results;
        }
        
        userToken = loginResult.data.data.token;
        
        // Step 3: Get Products
        console.log(`\n${colors.yellow}🛍️ Step 3: Browse Products${colors.reset}`);
        const productsResult = await apiCall('GET', '/products?limit=5', null, null, 'Get available products');
        results.steps.push({ step: 'Browse Products', success: productsResult.success });
        
        if (!productsResult.success || !productsResult.data.data.products.length) {
            results.success = false;
            return results;
        }
        
        productId = productsResult.data.data.products[0]._id;
        console.log(`  ${colors.cyan}Selected product: ${productsResult.data.data.products[0].name}${colors.reset}`);
        
        // Step 4: Add to Cart
        console.log(`\n${colors.yellow}🛒 Step 4: Add to Cart${colors.reset}`);
        const addToCartResult = await apiCall('POST', '/cart/add', {
            productId: productId,
            quantity: 1
        }, userToken, 'Add product to cart');
        results.steps.push({ step: 'Add to Cart', success: addToCartResult.success });
        
        // Step 5: Get Cart
        const getCartResult = await apiCall('GET', '/cart', null, userToken, 'Get cart contents');
        results.steps.push({ step: 'Get Cart', success: getCartResult.success });
        
        // Step 6: Create Order
        console.log(`\n${colors.yellow}📦 Step 5: Create Order${colors.reset}`);
        const orderData = {
            address: testAddress,
            paymentInfo: {
                method: user.paymentMethod
            }
        };
        
        if (user.paymentMethod === 'razorpay') {
            // First create Razorpay order
            const razorpayOrderResult = await apiCall('POST', '/payments/create-order', {
                amount: 1500,
                currency: 'INR'
            }, userToken, 'Create Razorpay order');
            
            if (razorpayOrderResult.success) {
                orderData.paymentInfo.razorpayOrderId = razorpayOrderResult.data.data.razorpayOrder.id;
                orderData.paymentInfo.razorpayPaymentId = 'pay_test_' + Date.now();
                orderData.paymentInfo.razorpaySignature = 'test_signature_' + Date.now();
            }
        }
        
        const createOrderResult = await apiCall('POST', '/orders', orderData, userToken, `Create order with ${user.paymentMethod.toUpperCase()}`);
        results.steps.push({ step: 'Create Order', success: createOrderResult.success });
        
        if (createOrderResult.success) {
            orderId = createOrderResult.data.data.order._id;
            console.log(`  ${colors.cyan}Order created: ${createOrderResult.data.data.order.orderNumber}${colors.reset}`);
        }
        
        // Step 7: Get Order Details
        console.log(`\n${colors.yellow}📋 Step 6: Get Order Details${colors.reset}`);
        const getOrderResult = await apiCall('GET', `/orders/${orderId}`, null, userToken, 'Get order details');
        results.steps.push({ step: 'Get Order Details', success: getOrderResult.success });
        
        // Step 8: Check Shipping (if COD)
        if (user.paymentMethod === 'cod') {
            console.log(`\n${colors.yellow}🚚 Step 7: Check Shiprocket Integration${colors.reset}`);
            const getShipmentsResult = await apiCall('GET', '/shipping/my-shipments', null, userToken, 'Get user shipments');
            results.steps.push({ step: 'Check Shipping', success: getShipmentsResult.success });
        }
        
        results.totalTime = Date.now() - startTime;
        
        // Summary
        const successfulSteps = results.steps.filter(s => s.success).length;
        const totalSteps = results.steps.length;
        
        console.log(`\n${colors.bold}📊 ${user.name} Flow Summary:${colors.reset}`);
        console.log(`${colors.green}✅ Successful Steps: ${successfulSteps}/${totalSteps}${colors.reset}`);
        console.log(`⏱️  Total Time: ${results.totalTime}ms`);
        
        if (successfulSteps === totalSteps) {
            console.log(`${colors.green}${colors.bold}🎉 ${user.name} flow completed successfully!${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️  ${user.name} flow completed with some issues${colors.reset}`);
            results.success = false;
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Fatal error in ${user.name} flow: ${error.message}${colors.reset}`);
        results.success = false;
        results.error = error.message;
    }
    
    return results;
}

// Main function
async function runCompleteUserFlowTests() {
    console.log(`${colors.bold}${colors.magenta}🚀 COMPLETE USER FLOW TESTING SUITE${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}Testing user scenarios on production server${colors.reset}`);
    console.log(`${colors.cyan}Server: ${API_URL}${colors.reset}\n`);
    
    const allResults = [];
    
    // Test each user flow
    for (const user of testUsers) {
        const result = await testUserFlow(user);
        allResults.push(result);
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate final report
    console.log(`\n${colors.bold}${colors.blue}📋 FINAL FLOW TESTING REPORT${colors.reset}`);
    console.log('='.repeat(80));
    
    const successfulFlows = allResults.filter(r => r.success).length;
    const totalFlows = allResults.length;
    
    console.log(`\n${colors.bold}Overall Results:${colors.reset}`);
    console.log(`${colors.green}✅ Successful Flows: ${successfulFlows}/${totalFlows}${colors.reset}`);
    console.log(`${colors.red}❌ Failed Flows: ${totalFlows - successfulFlows}/${totalFlows}${colors.reset}`);
    
    // Detailed results
    allResults.forEach(result => {
        const status = result.success ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
        console.log(`\n${status} ${result.user}:`);
        result.steps.forEach(step => {
            const stepStatus = step.success ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
            console.log(`  ${stepStatus} ${step.step}`);
        });
    });
    
    if (successfulFlows === totalFlows) {
        console.log(`\n${colors.green}${colors.bold}🎉 ALL USER FLOWS COMPLETED SUCCESSFULLY!${colors.reset}`);
        console.log(`${colors.green}✅ COD + Shiprocket integration working${colors.reset}`);
        console.log(`${colors.green}✅ Razorpay payment integration working${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠️  Some user flows need attention.${colors.reset}`);
    }
    
    return allResults;
}

// Run the tests
runCompleteUserFlowTests()
    .then((results) => {
        const successfulFlows = results.filter(r => r.success).length;
        const exitCode = successfulFlows === results.length ? 0 : 1;
        process.exit(exitCode);
    })
    .catch(error => {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
