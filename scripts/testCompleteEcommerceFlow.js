#!/usr/bin/env node

/**
 * Complete Ecommerce Flow Test
 * Tests the entire customer journey from browsing to order completion
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test user credentials
const testUser = {
    email: 'test.customer@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+91-9876543210'
};

// Test address
const testAddress = {
    firstName: 'Test',
    lastName: 'Customer',
    street: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    phone: '+91-9876543210'
};

let authToken = '';
let testOrderId = '';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
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
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status 
        };
    }
};

// Test steps
const testSteps = [
    {
        name: 'Browse Categories',
        test: async () => {
            console.log('📂 Testing category browsing...');
            
            // Get category tree
            const treeResult = await apiCall('GET', '/categories/tree?featured=true');
            if (!treeResult.success) throw new Error('Failed to get category tree');
            
            console.log(`   ✅ Found ${treeResult.data.data.categories.length} main categories`);
            
            // Get main categories
            const mainResult = await apiCall('GET', '/categories/main?include_stats=true');
            if (!mainResult.success) throw new Error('Failed to get main categories');
            
            console.log(`   ✅ Retrieved ${mainResult.data.data.categories.length} main categories with stats`);
            
            return { categories: treeResult.data.data.categories };
        }
    },
    {
        name: 'Browse Products',
        test: async (context) => {
            console.log('🛍️  Testing product browsing...');
            
            // Get featured products
            const featuredResult = await apiCall('GET', '/products?featured=true&limit=6');
            if (!featuredResult.success) throw new Error('Failed to get featured products');
            
            console.log(`   ✅ Found ${featuredResult.data.data.products.length} featured products`);
            
            // Search products
            const searchResult = await apiCall('GET', '/products?search=ganesha&limit=5');
            if (!searchResult.success) throw new Error('Failed to search products');
            
            console.log(`   ✅ Search found ${searchResult.data.data.products.length} products`);
            
            // Get products by category
            const categorySlug = context.categories[0]?.children?.[0]?.slug || 'ganesha-murtis';
            const categoryResult = await apiCall('GET', `/products?category=${categorySlug}&limit=5`);
            if (!categoryResult.success) throw new Error('Failed to get products by category');
            
            console.log(`   ✅ Found ${categoryResult.data.data.products.length} products in category`);
            
            return { 
                products: featuredResult.data.data.products,
                selectedProduct: featuredResult.data.data.products[0]
            };
        }
    },
    {
        name: 'User Registration & Login',
        test: async () => {
            console.log('👤 Testing user authentication...');
            
            // Register user
            const registerResult = await apiCall('POST', '/auth/register', testUser);
            if (!registerResult.success && registerResult.status !== 400) {
                throw new Error('Failed to register user');
            }
            
            if (registerResult.success) {
                console.log('   ✅ User registered successfully');
            } else {
                console.log('   ℹ️  User already exists, proceeding to login');
            }
            
            // Login user
            const loginResult = await apiCall('POST', '/auth/login', {
                email: testUser.email,
                password: testUser.password
            });
            
            if (!loginResult.success) throw new Error('Failed to login user');
            
            authToken = loginResult.data.data.token;
            console.log('   ✅ User logged in successfully');
            
            return { token: authToken, user: loginResult.data.data.user };
        }
    },
    {
        name: 'Cart Management',
        test: async (context) => {
            console.log('🛒 Testing cart management...');
            
            const product = context.selectedProduct;
            if (!product) throw new Error('No product selected for cart test');
            
            // Clear cart first
            await apiCall('DELETE', '/cart/clear', null, authToken);
            
            // Add item to cart
            const addResult = await apiCall('POST', '/cart/add', {
                productId: product._id,
                quantity: 2,
                variant: 'Standard'
            }, authToken);
            
            if (!addResult.success) throw new Error('Failed to add item to cart');
            console.log('   ✅ Item added to cart');
            
            // Get cart
            const cartResult = await apiCall('GET', '/cart', null, authToken);
            if (!cartResult.success) throw new Error('Failed to get cart');
            
            console.log(`   ✅ Cart retrieved with ${cartResult.data.data.cart.summary.total_items} items`);
            
            // Update cart item
            const cartItem = cartResult.data.data.cart.items[0];
            const updateResult = await apiCall('PUT', `/cart/update/${cartItem._id}`, {
                quantity: 3
            }, authToken);
            
            if (!updateResult.success) throw new Error('Failed to update cart item');
            console.log('   ✅ Cart item quantity updated');
            
            // Validate cart
            const validateResult = await apiCall('POST', '/cart/validate', null, authToken);
            if (!validateResult.success) throw new Error('Cart validation failed');
            
            console.log('   ✅ Cart validation passed');
            
            return { cart: cartResult.data.data.cart };
        }
    },
    {
        name: 'Order Creation',
        test: async (context) => {
            console.log('📦 Testing order creation...');
            
            // Validate cart before order
            const validateResult = await apiCall('POST', '/orders/validate-cart', {
                items: [{
                    productId: context.selectedProduct._id,
                    quantity: 2,
                    variant: 'Standard'
                }]
            }, authToken);
            
            if (!validateResult.success) throw new Error('Cart validation failed');
            console.log('   ✅ Cart validation passed');
            
            // Create order
            const orderData = {
                items: [{
                    productId: context.selectedProduct._id,
                    quantity: 2,
                    variant: 'Standard'
                }],
                shippingAddress: testAddress,
                paymentMethod: 'cod',
                notes: {
                    customer: 'Test order from automated flow'
                }
            };
            
            const orderResult = await apiCall('POST', '/orders', orderData, authToken);
            if (!orderResult.success) throw new Error('Failed to create order');
            
            testOrderId = orderResult.data.data.order._id;
            console.log(`   ✅ Order created successfully: ${orderResult.data.data.order.order_number}`);
            
            return { order: orderResult.data.data.order };
        }
    },
    {
        name: 'Order Management',
        test: async () => {
            console.log('📋 Testing order management...');
            
            // Get user orders
            const ordersResult = await apiCall('GET', '/orders', null, authToken);
            if (!ordersResult.success) throw new Error('Failed to get orders');
            
            console.log(`   ✅ Retrieved ${ordersResult.data.data.orders.length} orders`);
            
            // Get specific order details
            const orderResult = await apiCall('GET', `/orders/${testOrderId}`, null, authToken);
            if (!orderResult.success) throw new Error('Failed to get order details');
            
            console.log('   ✅ Order details retrieved successfully');
            
            return { orders: ordersResult.data.data.orders };
        }
    },
    {
        name: 'Search & Discovery',
        test: async () => {
            console.log('🔍 Testing search and discovery...');
            
            // Global search
            const searchResult = await apiCall('GET', '/search?q=ganesha&limit=5');
            if (!searchResult.success) throw new Error('Global search failed');
            
            console.log(`   ✅ Global search found ${searchResult.total || 0} results`);
            
            // Get featured content
            const featuredResult = await apiCall('GET', '/featured?limit=6');
            if (!featuredResult.success) throw new Error('Failed to get featured content');
            
            console.log('   ✅ Featured content retrieved');
            
            // Get trending products
            const trendingResult = await apiCall('GET', '/trending?limit=6');
            if (!trendingResult.success) throw new Error('Failed to get trending products');
            
            console.log('   ✅ Trending products retrieved');
            
            // Get bestsellers
            const bestsellersResult = await apiCall('GET', '/bestsellers?limit=6');
            if (!bestsellersResult.success) throw new Error('Failed to get bestsellers');
            
            console.log('   ✅ Bestsellers retrieved');
            
            return { searchResults: searchResult.data };
        }
    },
    {
        name: 'Platform Statistics',
        test: async () => {
            console.log('📊 Testing platform statistics...');
            
            // Get platform stats
            const statsResult = await apiCall('GET', '/stats');
            if (!statsResult.success) throw new Error('Failed to get platform stats');
            
            const stats = statsResult.data.data.platform_stats;
            console.log(`   ✅ Platform stats: ${stats.total_products} products, ${stats.total_categories} categories`);
            
            // Get cache stats
            const cacheResult = await apiCall('GET', '/cache/stats');
            if (!cacheResult.success) throw new Error('Failed to get cache stats');
            
            console.log(`   ✅ Cache stats: ${cacheResult.data.data.hit_rate} hit rate`);
            
            return { stats: statsResult.data.data };
        }
    }
];

// Main test runner
async function runCompleteEcommerceFlow() {
    console.log(`${colors.bold}${colors.blue}🚀 Starting Complete Ecommerce Flow Test${colors.reset}\n`);
    
    let context = {};
    let passedTests = 0;
    let failedTests = 0;
    
    for (const step of testSteps) {
        try {
            console.log(`${colors.cyan}${step.name}${colors.reset}`);
            const result = await step.test(context);
            
            // Merge result into context for next steps
            if (result) {
                context = { ...context, ...result };
            }
            
            console.log(`${colors.green}✅ ${step.name} completed successfully${colors.reset}\n`);
            passedTests++;
            
        } catch (error) {
            console.log(`${colors.red}❌ ${step.name} failed: ${error.message}${colors.reset}\n`);
            failedTests++;
        }
    }
    
    // Summary
    console.log(`${colors.bold}📊 Test Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    console.log(`📈 Success Rate: ${((passedTests / testSteps.length) * 100).toFixed(1)}%\n`);
    
    if (failedTests === 0) {
        console.log(`${colors.green}${colors.bold}🎉 All tests passed! Complete ecommerce flow is working perfectly.${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Some tests failed. Please check the implementation.${colors.reset}`);
    }
    
    return { passed: passedTests, failed: failedTests, total: testSteps.length };
}

// Run if called directly
if (require.main === module) {
    runCompleteEcommerceFlow()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runCompleteEcommerceFlow };
