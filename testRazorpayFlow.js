#!/usr/bin/env node

/**
 * Test Razorpay Flow with Different Product
 */

const axios = require('axios');

const API_URL = 'https://server.ghanshyammurtibhandar.com/api';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const testUser = {
    firstName: 'Razorpay',
    lastName: 'TestUser',
    email: 'razorpay.test@example.com',
    password: 'password123',
    phone: '9876543299'
};

const testAddress = {
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543299',
    addressLine1: '456 Razorpay Street',
    addressLine2: 'Near Payment Gateway',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isDefault: true
};

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
        
        const response = await axios(config);
        console.log(`  ${colors.green}✅ ${description}${colors.reset}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.log(`  ${colors.red}❌ ${description} - ${error.response?.data?.message || error.message}${colors.reset}`);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

async function testRazorpayFlow() {
    console.log(`${colors.bold}${colors.blue}🧪 Testing Razorpay Payment Flow${colors.reset}\n`);
    
    let userToken = '';
    
    try {
        // Step 1: Register User
        console.log(`${colors.yellow}📝 Step 1: User Registration${colors.reset}`);
        await apiCall('POST', '/auth/register', testUser, null, 'Register new user');
        
        // Step 2: Login User
        console.log(`\n${colors.yellow}�� Step 2: User Login${colors.reset}`);
        const loginResult = await apiCall('POST', '/auth/login', {
            email: testUser.email,
            password: testUser.password
        }, null, 'User login');
        
        if (!loginResult.success) return;
        userToken = loginResult.data.data.token;
        
        // Step 3: Get Products (find one with stock)
        console.log(`\n${colors.yellow}🛍️ Step 3: Browse Products${colors.reset}`);
        const productsResult = await apiCall('GET', '/products?limit=10', null, null, 'Get available products');
        
        if (!productsResult.success) return;
        
        const products = productsResult.data.data.products;
        const availableProduct = products.find(p => p.stock > 0);
        
        if (!availableProduct) {
            console.log(`  ${colors.red}❌ No products with stock available${colors.reset}`);
            return;
        }
        
        console.log(`  ${colors.cyan}Selected product: ${availableProduct.name} (Stock: ${availableProduct.stock})${colors.reset}`);
        
        // Step 4: Add to Cart
        console.log(`\n${colors.yellow}�� Step 4: Add to Cart${colors.reset}`);
        const addToCartResult = await apiCall('POST', '/cart/add', {
            productId: availableProduct._id,
            quantity: 1
        }, userToken, 'Add product to cart');
        
        if (!addToCartResult.success) return;
        
        // Step 5: Create Razorpay Order
        console.log(`\n${colors.yellow}💳 Step 5: Create Razorpay Order${colors.reset}`);
        const razorpayOrderResult = await apiCall('POST', '/payments/create-order', {
            amount: 1500,
            currency: 'INR'
        }, userToken, 'Create Razorpay order');
        
        if (!razorpayOrderResult.success) return;
        
        const razorpayOrderId = razorpayOrderResult.data.data.order.id;
        console.log(`  ${colors.cyan}Razorpay Order ID: ${razorpayOrderId}${colors.reset}`);
        
        // Step 6: Create Order with Razorpay Payment
        console.log(`\n${colors.yellow}📦 Step 6: Create Order with Razorpay${colors.reset}`);
        const orderData = {
            address: testAddress,
            paymentInfo: {
                method: 'razorpay',
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: 'pay_test_' + Date.now(),
                razorpaySignature: 'test_signature_' + Date.now()
            }
        };
        
        const createOrderResult = await apiCall('POST', '/orders', orderData, userToken, 'Create order with Razorpay payment');
        
        if (createOrderResult.success) {
            const order = createOrderResult.data.data.order;
            console.log(`  ${colors.green}✅ Order created successfully: ${order.orderNumber}${colors.reset}`);
            console.log(`  ${colors.cyan}Payment Method: ${order.paymentInfo?.method}${colors.reset}`);
            console.log(`  ${colors.cyan}Order Status: ${order.status}${colors.reset}`);
            console.log(`  ${colors.cyan}Total Amount: ₹${order.pricing?.total}${colors.reset}`);
            
            console.log(`\n${colors.green}${colors.bold}🎉 Razorpay payment flow completed successfully!${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    }
}

testRazorpayFlow()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
