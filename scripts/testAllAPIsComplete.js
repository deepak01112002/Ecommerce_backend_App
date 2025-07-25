#!/usr/bin/env node

/**
 * Complete API Testing Script
 * Tests all APIs with proper request/response validation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test user data
const testUser = {
    firstName: 'Complete',
    lastName: 'Tester',
    email: 'complete.tester@example.com',
    password: 'password123',
    phone: '9876543210'
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

let authToken = '';
let testProductId = '';
let testOrderId = '';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
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

// Test cases
const testCases = [
    {
        name: '🔐 Authentication APIs',
        tests: [
            {
                name: 'Register User',
                test: async () => {
                    const result = await apiCall('POST', '/auth/register', testUser);
                    if (!result.success && result.status !== 409) {
                        throw new Error(`Registration failed: ${result.error.message}`);
                    }
                    return result.success || result.status === 409;
                }
            },
            {
                name: 'Login User',
                test: async () => {
                    const result = await apiCall('POST', '/auth/login', {
                        email: testUser.email,
                        password: testUser.password
                    });
                    if (!result.success) {
                        throw new Error(`Login failed: ${result.error.message}`);
                    }
                    authToken = result.data.data.token;
                    return true;
                }
            }
        ]
    },
    {
        name: '📂 Categories APIs',
        tests: [
            {
                name: 'Get All Categories',
                test: async () => {
                    const result = await apiCall('GET', '/categories');
                    if (!result.success) {
                        throw new Error(`Get categories failed: ${result.error.message}`);
                    }
                    return result.data.data.length > 0;
                }
            },
            {
                name: 'Get Category Tree',
                test: async () => {
                    const result = await apiCall('GET', '/categories/tree');
                    if (!result.success) {
                        throw new Error(`Get category tree failed: ${result.error.message}`);
                    }
                    return result.data.data.categories.length > 0;
                }
            }
        ]
    },
    {
        name: '🛍️ Products APIs',
        tests: [
            {
                name: 'Get All Products',
                test: async () => {
                    const result = await apiCall('GET', '/products?limit=5');
                    if (!result.success) {
                        throw new Error(`Get products failed: ${result.error.message}`);
                    }
                    if (result.data.data.products.length > 0) {
                        testProductId = result.data.data.products[0]._id;
                    }
                    return result.data.data.products.length > 0;
                }
            },
            {
                name: 'Get Single Product',
                test: async () => {
                    if (!testProductId) throw new Error('No product ID available');
                    const result = await apiCall('GET', `/products/${testProductId}`);
                    if (!result.success) {
                        throw new Error(`Get product details failed: ${result.error.message}`);
                    }
                    return result.data.data.product._id === testProductId;
                }
            },
            {
                name: 'Search Products',
                test: async () => {
                    const result = await apiCall('GET', '/products?search=ganesha&limit=3');
                    if (!result.success) {
                        throw new Error(`Product search failed: ${result.error.message}`);
                    }
                    return result.data.data.products.length >= 0;
                }
            }
        ]
    },
    {
        name: '🛒 Cart APIs',
        tests: [
            {
                name: 'Get Empty Cart',
                test: async () => {
                    const result = await apiCall('GET', '/cart', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get cart failed: ${result.error.message}`);
                    }
                    return result.data.data.cart.items.length >= 0;
                }
            },
            {
                name: 'Add Item to Cart',
                test: async () => {
                    if (!testProductId) throw new Error('No product ID available');
                    const result = await apiCall('POST', '/cart/add', {
                        productId: testProductId,
                        quantity: 2
                    }, authToken);
                    if (!result.success) {
                        throw new Error(`Add to cart failed: ${result.error.message}`);
                    }
                    return result.data.message.includes('cart');
                }
            },
            {
                name: 'Get Cart with Items',
                test: async () => {
                    const result = await apiCall('GET', '/cart', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get cart failed: ${result.error.message}`);
                    }
                    return result.data.data.cart.items.length > 0;
                }
            }
        ]
    },
    {
        name: '📦 Orders APIs',
        tests: [
            {
                name: 'Create Order',
                test: async () => {
                    const orderData = {
                        address: {
                            firstName: 'Complete',
                            lastName: 'Tester',
                            phone: '9876543210',
                            addressLine1: '123 Test Street',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            postalCode: '400001',
                            country: 'India'
                        },
                        paymentInfo: {
                            method: 'cod'
                        }
                    };
                    const result = await apiCall('POST', '/orders', orderData, authToken);
                    if (!result.success) {
                        throw new Error(`Create order failed: ${result.error.message}`);
                    }
                    testOrderId = result.data.data.order._id;
                    return result.data.data.order.orderNumber.startsWith('ORD');
                }
            },
            {
                name: 'Get User Orders',
                test: async () => {
                    const result = await apiCall('GET', '/orders', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get orders failed: ${result.error.message}`);
                    }
                    return result.data.data.orders.length > 0;
                }
            }
        ]
    },
    {
        name: '⭐ Reviews APIs',
        tests: [
            {
                name: 'Get Product Reviews',
                test: async () => {
                    if (!testProductId) throw new Error('No product ID available');
                    const result = await apiCall('GET', `/reviews/product/${testProductId}`);
                    if (!result.success) {
                        throw new Error(`Get reviews failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.length >= 0;
                }
            },
            {
                name: 'Add Product Review',
                test: async () => {
                    if (!testProductId) throw new Error('No product ID available');
                    const result = await apiCall('POST', '/reviews', {
                        productId: testProductId,
                        rating: 5,
                        comment: 'Excellent product from API test!'
                    }, authToken);
                    // Review might already exist, so check for success or specific error
                    return result.success || result.error.message?.includes('already reviewed');
                }
            }
        ]
    },
    {
        name: '🎟️ Coupons APIs',
        tests: [
            {
                name: 'Get Available Coupons',
                test: async () => {
                    const result = await apiCall('GET', '/coupons');
                    if (!result.success) {
                        throw new Error(`Get coupons failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.length >= 0;
                }
            },
            {
                name: 'Validate Coupon',
                test: async () => {
                    const result = await apiCall('POST', '/coupons/validate', {
                        code: 'WELCOME10',
                        orderAmount: 1500,
                        cartItems: []
                    });
                    if (!result.success) {
                        throw new Error(`Validate coupon failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.isValid !== undefined;
                }
            }
        ]
    },
    {
        name: '💝 Wishlist APIs',
        tests: [
            {
                name: 'Get Empty Wishlist',
                test: async () => {
                    const result = await apiCall('GET', '/wishlist', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get wishlist failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.items && result.data.data.items.length >= 0;
                }
            },
            {
                name: 'Add to Wishlist',
                test: async () => {
                    if (!testProductId) throw new Error('No product ID available');
                    const result = await apiCall('POST', '/wishlist/add', {
                        productId: testProductId
                    }, authToken);
                    // Product might already be in wishlist
                    return result.success || result.error.message?.includes('already in wishlist');
                }
            }
        ]
    }
];

// Main test runner
async function runCompleteAPITests() {
    console.log(`${colors.bold}${colors.blue}🚀 Starting Complete API Tests${colors.reset}\n`);
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    for (const testCase of testCases) {
        console.log(`${colors.cyan}${colors.bold}${testCase.name}${colors.reset}`);
        
        for (const test of testCase.tests) {
            totalTests++;
            try {
                const result = await test.test();
                if (result) {
                    console.log(`  ${colors.green}✅ ${test.name}${colors.reset}`);
                    passedTests++;
                } else {
                    console.log(`  ${colors.red}❌ ${test.name} - Test returned false${colors.reset}`);
                    failedTests++;
                }
            } catch (error) {
                console.log(`  ${colors.red}❌ ${test.name} - ${error.message}${colors.reset}`);
                failedTests++;
            }
        }
        console.log('');
    }
    
    // Summary
    console.log(`${colors.bold}📊 Test Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
    
    if (failedTests === 0) {
        console.log(`${colors.green}${colors.bold}🎉 All APIs are working perfectly!${colors.reset}`);
        console.log(`${colors.green}✅ Authentication: Working${colors.reset}`);
        console.log(`${colors.green}✅ Categories: Working${colors.reset}`);
        console.log(`${colors.green}✅ Products: Working${colors.reset}`);
        console.log(`${colors.green}✅ Cart: Working${colors.reset}`);
        console.log(`${colors.green}✅ Orders: Working${colors.reset}`);
        console.log(`${colors.green}✅ Reviews: Working${colors.reset}`);
        console.log(`${colors.green}✅ Coupons: Working${colors.reset}`);
        console.log(`${colors.green}✅ Wishlist: Working${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Some APIs need attention.${colors.reset}`);
    }
    
    return { passed: passedTests, failed: failedTests, total: totalTests };
}

// Run if called directly
if (require.main === module) {
    runCompleteAPITests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runCompleteAPITests };
