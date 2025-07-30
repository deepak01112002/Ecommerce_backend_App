#!/usr/bin/env node

/**
 * Production API Testing Script
 * Tests all APIs on both localhost and production server
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Server configurations
const SERVERS = {
    localhost: 'http://localhost:8080/api',
    production: 'https://server.ghanshyammurtibhandar.com/api'
};

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

// Test data
const testData = {
    admin: {
        email: 'admin@admin.com',
        password: 'Admin@123'
    },
    user: {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        phone: '9876543210'
    }
};

// Test results storage
let testResults = {
    localhost: { passed: 0, failed: 0, total: 0, details: [] },
    production: { passed: 0, failed: 0, total: 0, details: [] }
};

// Helper function to make API calls
async function apiCall(baseUrl, method, endpoint, data = null, token = null, description = '') {
    try {
        const config = {
            method,
            url: `${baseUrl}${endpoint}`,
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
        
        return {
            success: true,
            data: response.data,
            status: response.status,
            responseTime,
            description
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status || 0,
            responseTime: 0,
            description
        };
    }
}

// Test suite for each server
async function testServer(serverName, baseUrl) {
    console.log(`\n${colors.bold}${colors.blue}🚀 Testing ${serverName.toUpperCase()} Server: ${baseUrl}${colors.reset}\n`);
    
    let adminToken = '';
    let userToken = '';
    let testProductId = '';
    
    const results = testResults[serverName];
    
    // Test categories
    const testCategories = [
        {
            name: '🔐 Authentication',
            tests: [
                {
                    name: 'Admin Login',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'POST', '/auth/login', testData.admin, null, 'Admin login');
                        if (result.success && result.data.data?.token) {
                            adminToken = result.data.data.token;
                            return true;
                        }
                        return false;
                    }
                },
                {
                    name: 'User Registration',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'POST', '/auth/register', testData.user, null, 'User registration');
                        return result.success || result.status === 409; // Already exists is OK
                    }
                },
                {
                    name: 'User Login',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'POST', '/auth/login', {
                            email: testData.user.email,
                            password: testData.user.password
                        }, null, 'User login');
                        if (result.success && result.data.data?.token) {
                            userToken = result.data.data.token;
                            return true;
                        }
                        return false;
                    }
                }
            ]
        },
        {
            name: '📂 Categories',
            tests: [
                {
                    name: 'Get All Categories',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'GET', '/categories', null, null, 'Get all categories');
                        return result.success && result.data.data?.length >= 0;
                    }
                },
                {
                    name: 'Get Category Tree',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'GET', '/categories/tree', null, null, 'Get category tree');
                        return result.success && result.data.data?.categories;
                    }
                }
            ]
        },
        {
            name: '🛍️ Products',
            tests: [
                {
                    name: 'Get All Products',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'GET', '/products?limit=5', null, null, 'Get all products');
                        if (result.success && result.data.data?.products?.length > 0) {
                            testProductId = result.data.data.products[0]._id;
                            return true;
                        }
                        return result.success;
                    }
                },
                {
                    name: 'Get Single Product',
                    test: async () => {
                        if (!testProductId) return false;
                        const result = await apiCall(baseUrl, 'GET', `/products/${testProductId}`, null, null, 'Get single product');
                        return result.success && result.data.data?.product;
                    }
                },
                {
                    name: 'Search Products',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'GET', '/products?search=ganesha&limit=3', null, null, 'Search products');
                        return result.success && result.data.data?.products;
                    }
                }
            ]
        },
        {
            name: '🛒 Cart & Orders',
            tests: [
                {
                    name: 'Get Cart',
                    test: async () => {
                        if (!userToken) return false;
                        const result = await apiCall(baseUrl, 'GET', '/cart', null, userToken, 'Get user cart');
                        return result.success && result.data.data?.cart;
                    }
                },
                {
                    name: 'Get User Orders',
                    test: async () => {
                        if (!userToken) return false;
                        const result = await apiCall(baseUrl, 'GET', '/orders', null, userToken, 'Get user orders');
                        return result.success && result.data.data?.orders;
                    }
                }
            ]
        },
        {
            name: '💝 Wishlist & Reviews',
            tests: [
                {
                    name: 'Get Wishlist',
                    test: async () => {
                        if (!userToken) return false;
                        const result = await apiCall(baseUrl, 'GET', '/wishlist', null, userToken, 'Get user wishlist');
                        return result.success && result.data.data;
                    }
                },
                {
                    name: 'Get Product Reviews',
                    test: async () => {
                        if (!testProductId) return false;
                        const result = await apiCall(baseUrl, 'GET', `/reviews/product/${testProductId}`, null, null, 'Get product reviews');
                        return result.success;
                    }
                }
            ]
        },
        {
            name: '🎟️ Coupons & Payments',
            tests: [
                {
                    name: 'Get Available Coupons',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'GET', '/coupons', null, null, 'Get available coupons');
                        return result.success;
                    }
                },
                {
                    name: 'Validate Coupon',
                    test: async () => {
                        const result = await apiCall(baseUrl, 'POST', '/coupons/validate', {
                            code: 'WELCOME10',
                            orderAmount: 1500,
                            cartItems: []
                        }, null, 'Validate coupon');
                        return result.success;
                    }
                }
            ]
        },
        {
            name: '📊 Admin Dashboard',
            tests: [
                {
                    name: 'Get Dashboard Stats',
                    test: async () => {
                        if (!adminToken) return false;
                        const result = await apiCall(baseUrl, 'GET', '/admin/dashboard/stats', null, adminToken, 'Get dashboard stats');
                        return result.success;
                    }
                }
            ]
        }
    ];
    
    // Run all tests
    for (const category of testCategories) {
        console.log(`${colors.cyan}${colors.bold}${category.name}${colors.reset}`);
        
        for (const test of category.tests) {
            results.total++;
            try {
                const success = await test.test();
                if (success) {
                    console.log(`  ${colors.green}✅ ${test.name}${colors.reset}`);
                    results.passed++;
                    results.details.push({ name: test.name, status: 'PASS', category: category.name });
                } else {
                    console.log(`  ${colors.red}❌ ${test.name}${colors.reset}`);
                    results.failed++;
                    results.details.push({ name: test.name, status: 'FAIL', category: category.name });
                }
            } catch (error) {
                console.log(`  ${colors.red}❌ ${test.name} - ${error.message}${colors.reset}`);
                results.failed++;
                results.details.push({ name: test.name, status: 'ERROR', category: category.name, error: error.message });
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('');
    }
    
    // Print server summary
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    console.log(`${colors.bold}📊 ${serverName.toUpperCase()} Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
    console.log(`📈 Success Rate: ${successRate}%\n`);
    
    return results;
}

// Main function
async function runProductionAPITests() {
    console.log(`${colors.bold}${colors.magenta}🎯 COMPREHENSIVE API TESTING SUITE${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}Testing both localhost and production servers${colors.reset}\n`);
    
    // Test localhost first
    await testServer('localhost', SERVERS.localhost);
    
    // Test production server
    await testServer('production', SERVERS.production);
    
    // Generate final report
    generateFinalReport();
}

function generateFinalReport() {
    console.log(`${colors.bold}${colors.blue}📋 FINAL COMPARISON REPORT${colors.reset}`);
    console.log('='.repeat(80));
    
    const localhost = testResults.localhost;
    const production = testResults.production;
    
    console.log(`\n${colors.bold}Server Comparison:${colors.reset}`);
    console.log(`Localhost:  ${localhost.passed}/${localhost.total} (${((localhost.passed/localhost.total)*100).toFixed(1)}%)`);
    console.log(`Production: ${production.passed}/${production.total} (${((production.passed/production.total)*100).toFixed(1)}%)`);
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        servers: {
            localhost: {
                url: SERVERS.localhost,
                results: localhost
            },
            production: {
                url: SERVERS.production,
                results: production
            }
        },
        summary: {
            localhost_success_rate: ((localhost.passed/localhost.total)*100).toFixed(1),
            production_success_rate: ((production.passed/production.total)*100).toFixed(1)
        }
    };
    
    const reportPath = path.join(__dirname, '../docs/API_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n${colors.green}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
    
    if (localhost.passed === localhost.total && production.passed === production.total) {
        console.log(`\n${colors.green}${colors.bold}🎉 ALL APIS ARE WORKING PERFECTLY ON BOTH SERVERS!${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠️  Some APIs need attention. Check the detailed report.${colors.reset}`);
    }
}

// Run if called directly
if (require.main === module) {
    runProductionAPITests()
        .then(() => {
            const totalFailed = testResults.localhost.failed + testResults.production.failed;
            process.exit(totalFailed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

module.exports = { runProductionAPITests };
