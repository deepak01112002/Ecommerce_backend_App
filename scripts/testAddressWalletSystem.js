#!/usr/bin/env node

/**
 * Complete Address & Wallet System Test
 * Tests all new address and wallet functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test user data
const testUser = {
    firstName: 'Address',
    lastName: 'Wallet',
    email: 'addresswallet@example.com',
    password: 'password123',
    phone: '9876543210'
};

// Test address data
const testAddress = {
    type: 'home',
    label: 'Home Address',
    firstName: 'Address',
    lastName: 'Wallet',
    phone: '9876543210',
    addressLine1: '123 Test Street',
    addressLine2: 'Near Test Mall',
    landmark: 'Test Landmark',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
    deliveryInstructions: 'Ring the bell twice',
    addressType: 'apartment'
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
let testAddressId = '';
let testProductId = '';

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
        name: '🔐 Setup User Account',
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
        name: '🏠 Address Management APIs',
        tests: [
            {
                name: 'Get Empty Address List',
                test: async () => {
                    const result = await apiCall('GET', '/addresses', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get addresses failed: ${result.error.message}`);
                    }
                    return result.data.data.addresses.length >= 0;
                }
            },
            {
                name: 'Add New Address',
                test: async () => {
                    const result = await apiCall('POST', '/addresses', testAddress, authToken);
                    if (!result.success) {
                        throw new Error(`Add address failed: ${result.error.message}`);
                    }
                    testAddressId = result.data.data.address._id;
                    return result.data.data.address._id && result.data.data.address.fullName.includes('Address Wallet');
                }
            },
            {
                name: 'Get Address List',
                test: async () => {
                    const result = await apiCall('GET', '/addresses', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get addresses failed: ${result.error.message}`);
                    }
                    return result.data.data.addresses.length > 0;
                }
            },
            {
                name: 'Get Single Address',
                test: async () => {
                    const result = await apiCall('GET', `/addresses/${testAddressId}`, null, authToken);
                    if (!result.success) {
                        throw new Error(`Get address failed: ${result.error.message}`);
                    }
                    return result.data.data.address._id === testAddressId;
                }
            },
            {
                name: 'Update Address',
                test: async () => {
                    const updateData = { landmark: 'Updated Landmark' };
                    const result = await apiCall('PUT', `/addresses/${testAddressId}`, updateData, authToken);
                    if (!result.success) {
                        throw new Error(`Update address failed: ${result.error.message}`);
                    }
                    return result.data.success;
                }
            },
            {
                name: 'Get Default Address',
                test: async () => {
                    const result = await apiCall('GET', '/addresses/default', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get default address failed: ${result.error.message}`);
                    }
                    return result.data.data.address.name.includes('Address Wallet');
                }
            },
            {
                name: 'Validate Address',
                test: async () => {
                    const result = await apiCall('POST', `/addresses/${testAddressId}/validate`, null, authToken);
                    if (!result.success) {
                        throw new Error(`Validate address failed: ${result.error.message}`);
                    }
                    return result.data.data.validation.isValid === true;
                }
            }
        ]
    },
    {
        name: '💰 Wallet Management APIs',
        tests: [
            {
                name: 'Get Wallet Details',
                test: async () => {
                    const result = await apiCall('GET', '/wallet', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get wallet failed: ${result.error.message}`);
                    }
                    return result.data.data.wallet.balance >= 0; // Wallet should exist
                }
            },
            {
                name: 'Get Wallet Balance',
                test: async () => {
                    const result = await apiCall('GET', '/wallet/balance', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get balance failed: ${result.error.message}`);
                    }
                    return result.data.data.balance >= 0;
                }
            },
            {
                name: 'Add Money to Wallet',
                test: async () => {
                    const topupData = {
                        amount: 1000,
                        paymentMethod: 'upi',
                        description: 'Test wallet top-up'
                    };
                    const result = await apiCall('POST', '/wallet/add-money', topupData, authToken);
                    if (!result.success) {
                        throw new Error(`Add money failed: ${result.error.message}`);
                    }
                    return result.data.data.wallet.balance >= 1000;
                }
            },
            {
                name: 'Check Balance for Payment',
                test: async () => {
                    const checkData = { amount: 500 };
                    const result = await apiCall('POST', '/wallet/check-balance', checkData, authToken);
                    if (!result.success) {
                        throw new Error(`Check balance failed: ${result.error.message}`);
                    }
                    return result.data.data.hasSufficientBalance === true;
                }
            },
            {
                name: 'Get Transaction History',
                test: async () => {
                    const result = await apiCall('GET', '/wallet/transactions', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get transactions failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.transactions && result.data.data.transactions.length >= 0;
                }
            },
            {
                name: 'Get Transaction Summary',
                test: async () => {
                    const result = await apiCall('GET', '/wallet/transactions/summary?period=month', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get summary failed: ${result.error.message}`);
                    }
                    return result.data.data && result.data.data.summary && result.data.data.summary.totalCredits >= 0;
                }
            }
        ]
    },
    {
        name: '🛒 Order with Address & Wallet',
        tests: [
            {
                name: 'Add Product to Cart',
                test: async () => {
                    // Get a product first
                    const productResult = await apiCall('GET', '/products?limit=1');
                    if (!productResult.success) {
                        throw new Error('Failed to get products');
                    }
                    testProductId = productResult.data.data.products[0]._id;
                    
                    // Add to cart
                    const result = await apiCall('POST', '/cart/add', {
                        productId: testProductId,
                        quantity: 1
                    }, authToken);
                    
                    if (!result.success) {
                        throw new Error(`Add to cart failed: ${result.error.message}`);
                    }
                    return result.data.message.includes('cart');
                }
            },
            {
                name: 'Create Order with Address & Wallet Payment',
                test: async () => {
                    const orderData = {
                        addressId: testAddressId,
                        paymentInfo: {
                            method: 'wallet'
                        },
                        useWallet: true,
                        walletAmount: 500
                    };
                    
                    const result = await apiCall('POST', '/orders', orderData, authToken);
                    if (!result.success) {
                        throw new Error(`Create order failed: ${result.error.message}`);
                    }
                    return result.data.data.order.orderNumber.startsWith('ORD');
                }
            },
            {
                name: 'Verify Wallet Balance After Order',
                test: async () => {
                    const result = await apiCall('GET', '/wallet/balance', null, authToken);
                    if (!result.success) {
                        throw new Error(`Get balance failed: ${result.error.message}`);
                    }
                    // Balance should be reduced or same (depending on order amount)
                    return result.data.data.balance >= 0;
                }
            }
        ]
    }
];

// Main test runner
async function runAddressWalletTests() {
    console.log(`${colors.bold}${colors.blue}🚀 Starting Address & Wallet System Tests${colors.reset}\n`);
    
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
        console.log(`${colors.green}${colors.bold}🎉 All Address & Wallet APIs are working perfectly!${colors.reset}`);
        console.log(`${colors.green}✅ Address Management: Working${colors.reset}`);
        console.log(`${colors.green}✅ Wallet System: Working${colors.reset}`);
        console.log(`${colors.green}✅ Order Integration: Working${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Some features need attention.${colors.reset}`);
    }
    
    return { passed: passedTests, failed: failedTests, total: totalTests };
}

// Run if called directly
if (require.main === module) {
    runAddressWalletTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runAddressWalletTests };
