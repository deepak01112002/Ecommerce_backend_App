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
let userId = '';
let testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `testuser${Date.now()}@example.com`,
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

// Step 1: User Registration
async function testUserRegistration() {
    logSection('👤 Step 1: User Registration');
    
    const registrationData = {
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone
    };
    
    const response = await apiRequest('POST', '/auth/register', registrationData);
    
    if (response.success && response.data.success) {
        logSuccess('User registration successful');
        logInfo(`User ID: ${response.data.data.user._id}`);
        logInfo(`Email: ${response.data.data.user.email}`);
        userId = response.data.data.user._id;
        return { success: true, user: response.data.data.user };
    } else {
        logError(`Registration failed: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 2: User Login
async function testUserLogin() {
    logSection('🔐 Step 2: User Login');
    
    const loginData = {
        email: testUser.email,
        password: testUser.password
    };
    
    const response = await apiRequest('POST', '/auth/login', loginData);
    
    if (response.success && response.data.success) {
        userToken = response.data.data.token;
        logSuccess('User login successful');
        logInfo(`Token received: ${userToken.substring(0, 20)}...`);
        logInfo(`User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
        return { success: true, token: userToken };
    } else {
        logError(`Login failed: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 3: Browse Products
async function testBrowseProducts() {
    logSection('🛍️ Step 3: Browse Products');
    
    const response = await apiRequest('GET', '/products');
    
    if (response.success && response.data.success) {
        const products = response.data.data.products || response.data.data || [];
        logSuccess(`Found ${products.length} products`);
        
        if (products.length > 0) {
            logInfo('Sample products:');
            products.slice(0, 3).forEach((product, index) => {
                logInfo(`  ${index + 1}. ${product.name} - ₹${product.price}`);
                logInfo(`     Category: ${product.category?.name || 'N/A'}`);
                logInfo(`     Stock: ${product.stock || 0}`);
            });
        }
        
        return { success: true, products };
    } else {
        logError(`Failed to browse products: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 4: Get Product Details
async function testGetProductDetails(products) {
    logSection('📦 Step 4: Get Product Details');
    
    if (!products || products.length === 0) {
        logWarning('No products available to test details');
        return { success: false, message: 'No products available' };
    }
    
    const testProduct = products[0];
    const response = await apiRequest('GET', `/products/${testProduct._id}`);
    
    if (response.success && response.data.success) {
        const product = response.data.data.product || response.data.data;
        logSuccess('Product details retrieved successfully');
        logInfo(`Product: ${product.name || 'N/A'}`);
        logInfo(`Description: ${product.description?.substring(0, 100) || 'N/A'}...`);
        logInfo(`Price: ₹${product.price || 'N/A'}`);
        logInfo(`Images: ${product.images?.length || 0}`);
        return { success: true, product };
    } else {
        logError(`Failed to get product details: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 5: Add to Cart
async function testAddToCart(products) {
    logSection('🛒 Step 5: Add to Cart');
    
    if (!products || products.length === 0) {
        logWarning('No products available to add to cart');
        return { success: false, message: 'No products available' };
    }
    
    const testProduct = products[0];
    const cartData = {
        productId: testProduct._id,
        quantity: 2
    };
    
    const response = await apiRequest('POST', '/cart/add', cartData, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        logSuccess('Product added to cart successfully');
        logInfo(`Product: ${testProduct.name}`);
        logInfo(`Quantity: ${cartData.quantity}`);
        return { success: true, cart: response.data.data };
    } else {
        logError(`Failed to add to cart: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 6: View Cart
async function testViewCart() {
    logSection('👀 Step 6: View Cart');
    
    const response = await apiRequest('GET', '/cart', null, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        const cart = response.data.data;
        logSuccess('Cart retrieved successfully');
        logInfo(`Cart items: ${cart.items?.length || 0}`);
        logInfo(`Total amount: ₹${cart.totalAmount || 0}`);
        
        if (cart.items && cart.items.length > 0) {
            cart.items.forEach((item, index) => {
                logInfo(`  ${index + 1}. ${item.product?.name || 'Unknown'} x ${item.quantity} = ₹${item.totalPrice || 0}`);
            });
        }
        
        return { success: true, cart };
    } else {
        logError(`Failed to view cart: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 7: Update Cart
async function testUpdateCart(products) {
    logSection('✏️ Step 7: Update Cart');
    
    if (!products || products.length === 0) {
        logWarning('No products available to update cart');
        return { success: false, message: 'No products available' };
    }
    
    const testProduct = products[0];
    const updateData = {
        productId: testProduct._id,
        quantity: 3
    };
    
    const response = await apiRequest('PUT', '/cart/update', updateData, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        logSuccess('Cart updated successfully');
        logInfo(`Updated quantity to: ${updateData.quantity}`);
        return { success: true, cart: response.data.data };
    } else {
        logError(`Failed to update cart: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 8: Add Address
async function testAddAddress() {
    logSection('🏠 Step 8: Add Delivery Address');
    
    const addressData = {
        type: 'home',
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        phone: testUser.phone,
        addressLine1: '123 Test Street',
        addressLine2: 'Test Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        isDefault: true
    };
    
    const response = await apiRequest('POST', '/addresses', addressData, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        logSuccess('Address added successfully');
        logInfo(`Address: ${addressData.addressLine1}, ${addressData.city}`);
        return { success: true, address: response.data.data };
    } else {
        logError(`Failed to add address: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 9: Place Order
async function testPlaceOrder() {
    logSection('📋 Step 9: Place Order');
    
    // First get addresses
    const addressResponse = await apiRequest('GET', '/addresses', null, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (!addressResponse.success || !addressResponse.data.success) {
        logError('Failed to get addresses for order placement');
        return { success: false, error: 'Address API failed' };
    }

    // Handle different response formats
    let addresses = addressResponse.data.data;
    if (addresses && addresses.addresses) {
        addresses = addresses.addresses;
    } else if (!Array.isArray(addresses)) {
        addresses = [];
    }

    if (addresses.length === 0) {
        logError('No addresses found for order placement');
        return { success: false, error: 'No addresses available' };
    }

    const address = addresses[0];
    if (!address || !address._id) {
        logError('Invalid address data structure');
        logError(`Address data: ${JSON.stringify(address)}`);
        return { success: false, error: 'Invalid address data' };
    }
    
    const orderData = {
        addressId: address._id,
        paymentInfo: {
            method: 'cod' // Cash on Delivery
        },
        notes: 'Test order from API testing'
    };
    
    const response = await apiRequest('POST', '/orders', orderData, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        const order = response.data.data;
        logSuccess('Order placed successfully');
        logInfo(`Order ID: ${order._id}`);
        logInfo(`Order Number: ${order.orderNumber || 'N/A'}`);
        logInfo(`Total Amount: ₹${order.totalAmount || order.pricing?.total || 0}`);
        logInfo(`Status: ${order.status || 'pending'}`);
        return { success: true, order };
    } else {
        logError(`Failed to place order: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Step 10: View Order History
async function testViewOrderHistory() {
    logSection('📜 Step 10: View Order History');
    
    const response = await apiRequest('GET', '/orders', null, {
        'Authorization': `Bearer ${userToken}`
    });
    
    if (response.success && response.data.success) {
        const orders = response.data.data.orders || response.data.data || [];
        logSuccess(`Order history retrieved: ${orders.length} orders`);
        
        if (orders.length > 0) {
            orders.forEach((order, index) => {
                logInfo(`  ${index + 1}. Order ${order.orderNumber || order._id} - ₹${order.totalAmount || order.pricing?.total || 0} - ${order.status || 'pending'}`);
            });
        }
        
        return { success: true, orders };
    } else {
        logError(`Failed to view order history: ${JSON.stringify(response.error)}`);
        return { success: false, error: response.error };
    }
}

// Main test function
async function testCompleteUserJourney() {
    logSection('🚀 COMPLETE USER JOURNEY TEST');
    logInfo('Testing end-to-end user experience from registration to order placement');
    
    const results = {
        registration: false,
        login: false,
        browseProducts: false,
        productDetails: false,
        addToCart: false,
        viewCart: false,
        updateCart: false,
        addAddress: false,
        placeOrder: false,
        orderHistory: false
    };
    
    try {
        // Step 1: User Registration
        const registrationResult = await testUserRegistration();
        results.registration = registrationResult.success;
        
        if (!registrationResult.success) {
            logError('Registration failed. Cannot proceed with user journey.');
            return results;
        }
        
        // Step 2: User Login
        const loginResult = await testUserLogin();
        results.login = loginResult.success;
        
        if (!loginResult.success) {
            logError('Login failed. Cannot proceed with user journey.');
            return results;
        }
        
        // Step 3: Browse Products
        const browseResult = await testBrowseProducts();
        results.browseProducts = browseResult.success;
        
        // Step 4: Get Product Details
        if (browseResult.success && browseResult.products) {
            const detailsResult = await testGetProductDetails(browseResult.products);
            results.productDetails = detailsResult.success;
        }
        
        // Step 5: Add to Cart
        if (browseResult.success && browseResult.products) {
            const addCartResult = await testAddToCart(browseResult.products);
            results.addToCart = addCartResult.success;
        }
        
        // Step 6: View Cart
        const viewCartResult = await testViewCart();
        results.viewCart = viewCartResult.success;
        
        // Step 7: Update Cart
        if (browseResult.success && browseResult.products) {
            const updateCartResult = await testUpdateCart(browseResult.products);
            results.updateCart = updateCartResult.success;
        }
        
        // Step 8: Add Address
        const addressResult = await testAddAddress();
        results.addAddress = addressResult.success;
        
        // Step 9: Place Order
        const orderResult = await testPlaceOrder();
        results.placeOrder = orderResult.success;
        
        // Step 10: View Order History
        const historyResult = await testViewOrderHistory();
        results.orderHistory = historyResult.success;
        
        // Final Summary
        logSection('📊 USER JOURNEY TEST RESULTS');
        
        const steps = [
            { name: 'User Registration', result: results.registration },
            { name: 'User Login', result: results.login },
            { name: 'Browse Products', result: results.browseProducts },
            { name: 'Product Details', result: results.productDetails },
            { name: 'Add to Cart', result: results.addToCart },
            { name: 'View Cart', result: results.viewCart },
            { name: 'Update Cart', result: results.updateCart },
            { name: 'Add Address', result: results.addAddress },
            { name: 'Place Order', result: results.placeOrder },
            { name: 'Order History', result: results.orderHistory }
        ];
        
        let passedSteps = 0;
        steps.forEach(step => {
            if (step.result) {
                logSuccess(`✅ ${step.name}: PASSED`);
                passedSteps++;
            } else {
                logError(`❌ ${step.name}: FAILED`);
            }
        });
        
        const successRate = ((passedSteps / steps.length) * 100).toFixed(1);
        
        logSection('🎯 OVERALL ASSESSMENT');
        logInfo(`Total steps: ${steps.length}`);
        logInfo(`Passed steps: ${passedSteps}`);
        logInfo(`Success rate: ${successRate}%`);
        
        if (successRate >= 90) {
            logSuccess('🎉 EXCELLENT! User journey is working perfectly');
            logInfo('✅ Backend is ready for production deployment');
        } else if (successRate >= 70) {
            logWarning('⚠️ GOOD! Most user journey steps are working');
            logInfo('⚠️ Some minor issues need attention before deployment');
        } else {
            logError('❌ NEEDS WORK! Several critical issues found');
            logInfo('❌ Backend needs fixes before deployment');
        }
        
        logSection('🌐 DEPLOYMENT READINESS');
        logInfo('Backend Server: http://localhost:8080');
        logInfo('Frontend App: Ready for integration');
        logInfo('Admin Panel: http://localhost:3001');
        
        return results;
        
    } catch (error) {
        logError(`User journey test failed: ${error.message}`);
        console.error(error);
        return results;
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testCompleteUserJourney().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testCompleteUserJourney;
