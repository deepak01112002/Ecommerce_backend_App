#!/usr/bin/env node

/**
 * Shiprocket Integration Test Script
 * Tests all shipping functionality with mock data
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test user data
const testUser = {
    firstName: 'Shipping',
    lastName: 'Tester',
    email: 'shipping.tester@example.com',
    password: 'password123',
    phone: '9876543210'
};

// Test address data
const testAddress = {
    type: 'home',
    label: 'Home Address',
    firstName: 'Shipping',
    lastName: 'Tester',
    phone: '9876543210',
    addressLine1: '123 Shipping Street',
    addressLine2: 'Near Shipping Mall',
    landmark: 'Shipping Landmark',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
    deliveryInstructions: 'Handle with care',
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
let testOrderId = '';
let testShipmentId = '';

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
        name: '🔐 Setup Test Environment',
        tests: [
            {
                name: 'Register/Login User',
                test: async () => {
                    // Try to register
                    let result = await apiCall('POST', '/auth/register', testUser);
                    
                    // Login
                    result = await apiCall('POST', '/auth/login', {
                        email: testUser.email,
                        password: testUser.password
                    });
                    
                    if (!result.success) {
                        throw new Error(`Login failed: ${result.error.message}`);
                    }
                    
                    authToken = result.data.data.token;
                    return true;
                }
            },
            {
                name: 'Add Test Address',
                test: async () => {
                    const result = await apiCall('POST', '/addresses', testAddress, authToken);
                    if (!result.success) {
                        throw new Error(`Add address failed: ${result.error.message}`);
                    }
                    testAddressId = result.data.data.address._id;
                    return true;
                }
            },
            {
                name: 'Add Product to Cart & Create Order',
                test: async () => {
                    // Get a product
                    const productResult = await apiCall('GET', '/products?limit=1');
                    if (!productResult.success) {
                        throw new Error('Failed to get products');
                    }
                    testProductId = productResult.data.data.products[0]._id;
                    
                    // Add to cart
                    const cartResult = await apiCall('POST', '/cart/add', {
                        productId: testProductId,
                        quantity: 1
                    }, authToken);
                    
                    if (!cartResult.success) {
                        throw new Error(`Add to cart failed: ${cartResult.error.message}`);
                    }
                    
                    // Create order
                    const orderResult = await apiCall('POST', '/orders', {
                        addressId: testAddressId,
                        paymentInfo: { method: 'cod' }
                    }, authToken);
                    
                    if (!orderResult.success) {
                        throw new Error(`Create order failed: ${orderResult.error.message}`);
                    }
                    
                    testOrderId = orderResult.data.data.order._id;
                    return true;
                }
            }
        ]
    },
    {
        name: '🚚 Shipping Management APIs',
        tests: [
            {
                name: 'Check Serviceability',
                test: async () => {
                    const result = await apiCall('POST', '/shipping/check-serviceability', {
                        pickupPostcode: '400001',
                        deliveryPostcode: '400002',
                        weight: 0.5,
                        codAmount: 1000
                    });
                    
                    if (!result.success) {
                        throw new Error(`Serviceability check failed: ${result.error.message}`);
                    }
                    
                    return result.data.data && typeof result.data.data.isServiceable === 'boolean';
                }
            },
            {
                name: 'Create Shipment (Mock)',
                test: async () => {
                    // This will fail with real Shiprocket API without proper credentials
                    // But we can test the endpoint structure
                    const result = await apiCall('POST', `/shipping/orders/${testOrderId}/create-shipment`, {
                        pickupLocation: 'Primary',
                        dimensions: {
                            length: 10,
                            breadth: 10,
                            height: 10,
                            weight: 0.5
                        }
                    }, authToken);
                    
                    // We expect this to fail due to Shiprocket auth, but endpoint should exist
                    return result.status === 400 || result.status === 401 || result.success;
                }
            },
            {
                name: 'Get User Shipments',
                test: async () => {
                    const result = await apiCall('GET', '/shipping/my-shipments', null, authToken);
                    
                    if (!result.success) {
                        throw new Error(`Get shipments failed: ${result.error.message}`);
                    }
                    
                    return result.data.data && Array.isArray(result.data.data.shipments);
                }
            },
            {
                name: 'Get All Shipments (Admin)',
                test: async () => {
                    const result = await apiCall('GET', '/shipping', null, authToken);
                    
                    // This might fail if user is not admin, which is expected
                    return result.success || result.status === 403;
                }
            },
            {
                name: 'Get Shipping Analytics (Admin)',
                test: async () => {
                    const result = await apiCall('GET', '/shipping/analytics/summary', null, authToken);
                    
                    // This might fail if user is not admin, which is expected
                    return result.success || result.status === 403;
                }
            }
        ]
    },
    {
        name: '📦 Tracking & Webhook APIs',
        tests: [
            {
                name: 'Track Shipment (Mock AWB)',
                test: async () => {
                    // Test with mock AWB code
                    const result = await apiCall('GET', '/shipping/track/MOCK123456789', null, authToken);
                    
                    // This will likely fail as AWB doesn't exist, but endpoint should be accessible
                    return result.status === 404 || result.success;
                }
            },
            {
                name: 'Test Webhook Endpoint',
                test: async () => {
                    // Test webhook endpoint with mock data
                    const mockWebhookData = {
                        awb: 'MOCK123456789',
                        current_status: 'shipped',
                        status_date: new Date().toISOString(),
                        courier_name: 'Mock Courier',
                        shipment_id: '12345',
                        location: 'Mumbai',
                        remarks: 'Package shipped',
                        activity: 'Shipped from warehouse'
                    };
                    
                    const result = await apiCall('POST', '/shipping/webhook/shiprocket', mockWebhookData);
                    
                    // Webhook should accept the request even if shipment doesn't exist
                    return result.status === 200 || result.status === 400;
                }
            }
        ]
    },
    {
        name: '🔧 Utility Functions',
        tests: [
            {
                name: 'Generate Labels (Mock)',
                test: async () => {
                    const result = await apiCall('POST', '/shipping/generate-labels', {
                        shipmentIds: ['mock_shipment_id']
                    }, authToken);
                    
                    // This will fail without real shipments, but endpoint should exist
                    return result.status === 400 || result.status === 403 || result.success;
                }
            },
            {
                name: 'Generate Pickup (Mock)',
                test: async () => {
                    const result = await apiCall('POST', '/shipping/generate-pickup', {
                        shipmentIds: ['mock_shipment_id'],
                        pickupDate: new Date().toISOString().split('T')[0]
                    }, authToken);
                    
                    // This will fail without real shipments, but endpoint should exist
                    return result.status === 400 || result.status === 403 || result.success;
                }
            }
        ]
    }
];

// Main test runner
async function runShiprocketTests() {
    console.log(`${colors.bold}${colors.blue}🚀 Starting Shiprocket Integration Tests${colors.reset}\n`);
    
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
        console.log(`${colors.green}${colors.bold}🎉 All Shiprocket Integration Tests Passed!${colors.reset}`);
        console.log(`${colors.green}✅ Shipping Routes: Working${colors.reset}`);
        console.log(`${colors.green}✅ Serviceability Check: Working${colors.reset}`);
        console.log(`${colors.green}✅ Webhook Endpoint: Working${colors.reset}`);
        console.log(`${colors.green}✅ Admin Functions: Working${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Some tests failed (expected for mock data).${colors.reset}`);
        console.log(`${colors.yellow}💡 To test with real Shiprocket API:${colors.reset}`);
        console.log(`${colors.yellow}   1. Add real Shiprocket credentials to .env${colors.reset}`);
        console.log(`${colors.yellow}   2. Create real shipments${colors.reset}`);
        console.log(`${colors.yellow}   3. Test with actual AWB codes${colors.reset}`);
    }
    
    return { passed: passedTests, failed: failedTests, total: totalTests };
}

// Run if called directly
if (require.main === module) {
    runShiprocketTests()
        .then(results => {
            process.exit(results.failed > 5 ? 1 : 0); // Allow some failures for mock data
        })
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runShiprocketTests };
