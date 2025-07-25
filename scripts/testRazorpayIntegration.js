require('dotenv').config();
const axios = require('axios');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

const BASE_URL = 'http://localhost:8080/api';
let userToken = '';
let testUser = {
    firstName: 'Payment',
    lastName: 'Tester',
    email: `paymenttest${Date.now()}@example.com`,
    password: 'testpassword123',
    phone: '9876543210'
};

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
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

// Test 1: Get Payment Methods
async function testGetPaymentMethods() {
    logSection('💳 Test 1: Get Payment Methods');
    
    const response = await apiRequest('GET', '/payments/methods');
    
    if (response.success && response.data.success) {
        const methods = response.data.data.methods;
        logSuccess(`Retrieved ${methods.length} payment methods`);
        
        methods.forEach((method, index) => {
            logInfo(`${index + 1}. ${method.name} (${method.id})`);
            logInfo(`   Description: ${method.description}`);
            logInfo(`   Enabled: ${method.enabled}`);
            logInfo(`   Min Amount: ₹${method.minAmount}, Max Amount: ₹${method.maxAmount}`);
        });
        
        // Check if Razorpay key is provided
        if (response.data.data.razorpayKeyId) {
            logSuccess(`Razorpay Key ID: ${response.data.data.razorpayKeyId}`);
        }
        
        return { success: true, methods };
    } else {
        logError(`Failed to get payment methods: ${JSON.stringify(response.error)}`);
        return { success: false };
    }
}

// Test 2: Create Razorpay Order
async function testCreateRazorpayOrder() {
    logSection('🏦 Test 2: Create Razorpay Order');
    
    const orderData = {
        amount: 1000, // ₹1000
        currency: 'INR',
        receipt: `test_receipt_${Date.now()}`
    };
    
    const response = await apiRequest('POST', '/payments/create-order', orderData);
    
    if (response.success && response.data.success) {
        const order = response.data.data.order;
        logSuccess('Razorpay order created successfully');
        logInfo(`Order ID: ${order.id}`);
        logInfo(`Amount: ₹${order.amount / 100}`);
        logInfo(`Currency: ${order.currency}`);
        logInfo(`Receipt: ${order.receipt}`);
        logInfo(`Status: ${order.status}`);
        
        return { success: true, order };
    } else {
        logError(`Failed to create Razorpay order: ${JSON.stringify(response.error)}`);
        return { success: false };
    }
}

// Test 3: Create Payment (Generic)
async function testCreatePayment() {
    logSection('💰 Test 3: Create Payment (Generic)');
    
    // Test COD payment
    logInfo('Testing COD Payment...');
    const codPaymentData = {
        amount: 500,
        paymentMethod: 'cod',
        orderId: `test_order_${Date.now()}`
    };
    
    const codResponse = await apiRequest('POST', '/payments/create', codPaymentData);
    
    if (codResponse.success && codResponse.data.success) {
        logSuccess('COD payment created successfully');
        logInfo(`Payment ID: ${codResponse.data.data.payment._id}`);
        logInfo(`Method: ${codResponse.data.data.payment.method}`);
        logInfo(`Requires Payment: ${codResponse.data.data.requiresPayment}`);
    } else {
        logError(`COD payment failed: ${JSON.stringify(codResponse.error)}`);
    }
    
    // Test Razorpay payment
    logInfo('Testing Razorpay Payment...');
    const razorpayPaymentData = {
        amount: 1500,
        paymentMethod: 'razorpay',
        orderId: `test_order_${Date.now()}`
    };
    
    const razorpayResponse = await apiRequest('POST', '/payments/create', razorpayPaymentData);
    
    if (razorpayResponse.success && razorpayResponse.data.success) {
        logSuccess('Razorpay payment created successfully');
        logInfo(`Payment ID: ${razorpayResponse.data.data.payment._id}`);
        logInfo(`Razorpay Order ID: ${razorpayResponse.data.data.payment.razorpay_order_id}`);
        logInfo(`Key ID: ${razorpayResponse.data.data.key_id}`);
        logInfo(`Requires Payment: ${razorpayResponse.data.data.requiresPayment}`);
        
        return { success: true, payment: razorpayResponse.data.data };
    } else {
        logError(`Razorpay payment failed: ${JSON.stringify(razorpayResponse.error)}`);
        return { success: false };
    }
}

// Test 4: User Registration and Login
async function testUserAuth() {
    logSection('👤 Test 4: User Authentication');
    
    // Register user
    const registrationData = {
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone
    };
    
    const regResponse = await apiRequest('POST', '/auth/register', registrationData);
    
    if (regResponse.success && regResponse.data.success) {
        logSuccess('User registration successful');
    } else {
        logError(`Registration failed: ${JSON.stringify(regResponse.error)}`);
        return { success: false };
    }
    
    // Login user
    const loginData = {
        email: testUser.email,
        password: testUser.password
    };
    
    const loginResponse = await apiRequest('POST', '/auth/login', loginData);
    
    if (loginResponse.success && loginResponse.data.success) {
        userToken = loginResponse.data.data.token;
        logSuccess('User login successful');
        logInfo(`Token: ${userToken.substring(0, 20)}...`);
        return { success: true, token: userToken };
    } else {
        logError(`Login failed: ${JSON.stringify(loginResponse.error)}`);
        return { success: false };
    }
}

// Test 5: Complete Order with Payment Flow
async function testCompleteOrderFlow() {
    logSection('🛒 Test 5: Complete Order with Payment Flow');
    
    try {
        // Add product to cart
        const products = await apiRequest('GET', '/products');
        if (!products.success || !products.data.data.products || products.data.data.products.length === 0) {
            logWarning('No products available for testing');
            return { success: false };
        }
        
        const testProduct = products.data.data.products[0];
        
        // Add to cart
        const cartData = {
            productId: testProduct._id,
            quantity: 1
        };
        
        const cartResponse = await apiRequest('POST', '/cart/add', cartData, {
            'Authorization': `Bearer ${userToken}`
        });
        
        if (!cartResponse.success) {
            logError(`Failed to add to cart: ${JSON.stringify(cartResponse.error)}`);
            return { success: false };
        }
        
        logSuccess('Product added to cart');
        
        // Add address
        const addressData = {
            type: 'home',
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            phone: testUser.phone,
            addressLine1: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
            isDefault: true
        };
        
        const addressResponse = await apiRequest('POST', '/addresses', addressData, {
            'Authorization': `Bearer ${userToken}`
        });
        
        if (!addressResponse.success) {
            logError(`Failed to add address: ${JSON.stringify(addressResponse.error)}`);
            return { success: false };
        }
        
        logSuccess('Address added successfully');
        const address = addressResponse.data.data;
        
        // Test COD Order
        logInfo('Testing COD Order...');
        const codOrderData = {
            addressId: address._id,
            paymentInfo: {
                method: 'cod'
            },
            notes: 'Test COD order'
        };
        
        const codOrderResponse = await apiRequest('POST', '/orders', codOrderData, {
            'Authorization': `Bearer ${userToken}`
        });
        
        if (codOrderResponse.success && codOrderResponse.data.success) {
            logSuccess('COD order created successfully');
            logInfo(`Order ID: ${codOrderResponse.data.data.order._id}`);
            logInfo(`Order Number: ${codOrderResponse.data.data.order.orderNumber}`);
            logInfo(`Requires Payment: ${codOrderResponse.data.data.requiresPayment}`);
            
            // Confirm COD order
            const codConfirmData = {
                order_id: codOrderResponse.data.data.order._id
            };
            
            const codConfirmResponse = await apiRequest('POST', '/payments/confirm-cod', codConfirmData, {
                'Authorization': `Bearer ${userToken}`
            });
            
            if (codConfirmResponse.success) {
                logSuccess('COD order confirmed successfully');
            } else {
                logError(`COD confirmation failed: ${JSON.stringify(codConfirmResponse.error)}`);
            }
        } else {
            logError(`COD order failed: ${JSON.stringify(codOrderResponse.error)}`);
        }
        
        // Add another product for Razorpay test
        await apiRequest('POST', '/cart/add', cartData, {
            'Authorization': `Bearer ${userToken}`
        });
        
        // Test Razorpay Order
        logInfo('Testing Razorpay Order...');
        const razorpayOrderData = {
            addressId: address._id,
            paymentInfo: {
                method: 'razorpay'
            },
            notes: 'Test Razorpay order'
        };
        
        const razorpayOrderResponse = await apiRequest('POST', '/orders', razorpayOrderData, {
            'Authorization': `Bearer ${userToken}`
        });
        
        if (razorpayOrderResponse.success && razorpayOrderResponse.data.success) {
            logSuccess('Razorpay order created successfully');
            logInfo(`Order ID: ${razorpayOrderResponse.data.data.order._id}`);
            logInfo(`Order Number: ${razorpayOrderResponse.data.data.order.orderNumber}`);
            logInfo(`Requires Payment: ${razorpayOrderResponse.data.data.requiresPayment}`);
            
            if (razorpayOrderResponse.data.data.razorpay) {
                logInfo(`Razorpay Order ID: ${razorpayOrderResponse.data.data.razorpay.orderId}`);
                logInfo(`Amount: ₹${razorpayOrderResponse.data.data.razorpay.amount / 100}`);
                logInfo(`Key ID: ${razorpayOrderResponse.data.data.razorpay.keyId}`);
            }
            
            return { success: true, order: razorpayOrderResponse.data.data };
        } else {
            logError(`Razorpay order failed: ${JSON.stringify(razorpayOrderResponse.error)}`);
            return { success: false };
        }
        
    } catch (error) {
        logError(`Order flow test failed: ${error.message}`);
        return { success: false };
    }
}

// Main test function
async function testRazorpayIntegration() {
    logSection('🚀 RAZORPAY INTEGRATION TESTING');
    logInfo('Testing complete Razorpay payment gateway integration');
    
    const results = {
        paymentMethods: false,
        razorpayOrder: false,
        createPayment: false,
        userAuth: false,
        completeFlow: false
    };
    
    try {
        // Test 1: Payment Methods
        const methodsResult = await testGetPaymentMethods();
        results.paymentMethods = methodsResult.success;
        
        // Test 2: Razorpay Order Creation
        const orderResult = await testCreateRazorpayOrder();
        results.razorpayOrder = orderResult.success;
        
        // Test 3: Generic Payment Creation
        const paymentResult = await testCreatePayment();
        results.createPayment = paymentResult.success;
        
        // Test 4: User Authentication
        const authResult = await testUserAuth();
        results.userAuth = authResult.success;
        
        // Test 5: Complete Order Flow (only if auth successful)
        if (authResult.success) {
            const flowResult = await testCompleteOrderFlow();
            results.completeFlow = flowResult.success;
        }
        
        // Final Summary
        logSection('📊 RAZORPAY INTEGRATION TEST RESULTS');
        
        const tests = [
            { name: 'Payment Methods API', result: results.paymentMethods },
            { name: 'Razorpay Order Creation', result: results.razorpayOrder },
            { name: 'Generic Payment Creation', result: results.createPayment },
            { name: 'User Authentication', result: results.userAuth },
            { name: 'Complete Order Flow', result: results.completeFlow }
        ];
        
        let passedTests = 0;
        tests.forEach(test => {
            if (test.result) {
                logSuccess(`✅ ${test.name}: PASSED`);
                passedTests++;
            } else {
                logError(`❌ ${test.name}: FAILED`);
            }
        });
        
        const successRate = ((passedTests / tests.length) * 100).toFixed(1);
        
        logSection('🎯 OVERALL ASSESSMENT');
        logInfo(`Total tests: ${tests.length}`);
        logInfo(`Passed tests: ${passedTests}`);
        logInfo(`Success rate: ${successRate}%`);
        
        if (successRate >= 90) {
            logSuccess('🎉 EXCELLENT! Razorpay integration is working perfectly');
            logInfo('✅ Ready for Android application integration');
        } else if (successRate >= 70) {
            logWarning('⚠️ GOOD! Most Razorpay features are working');
            logInfo('⚠️ Some minor issues need attention');
        } else {
            logError('❌ NEEDS WORK! Several issues found');
            logInfo('❌ Razorpay integration needs fixes');
        }
        
        logSection('📱 ANDROID INTEGRATION READY');
        logInfo('Razorpay Credentials:');
        logInfo(`Key ID: ${process.env.RAZORPAY_KEY_ID}`);
        logInfo('API Endpoints:');
        logInfo('• GET /api/payments/methods - Get payment options');
        logInfo('• POST /api/orders - Create order with payment');
        logInfo('• POST /api/payments/verify - Verify payment');
        logInfo('• POST /api/payments/confirm-cod - Confirm COD orders');
        
        return results;
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
        return results;
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testRazorpayIntegration().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testRazorpayIntegration;
