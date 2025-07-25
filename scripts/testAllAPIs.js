#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test configuration
const tests = [
    {
        name: 'Get Category Tree (Hierarchical)',
        method: 'GET',
        url: '/categories/tree?featured=true&includeProducts=true&maxDepth=2',
        expectedStatus: 200,
        expectedFields: ['categories', 'meta']
    },
    {
        name: 'Get All Categories (Flat)',
        method: 'GET',
        url: '/categories?include_products=true',
        expectedStatus: 200,
        expectedFields: ['categories', 'total', 'structure']
    },
    {
        name: 'Get Featured Categories',
        method: 'GET',
        url: '/categories/featured?limit=6',
        expectedStatus: 200,
        expectedFields: ['data']
    },
    {
        name: 'Search Categories',
        method: 'GET',
        url: '/categories/search?q=ganesha&limit=5',
        expectedStatus: 200,
        expectedFields: ['categories', 'query', 'total']
    },
    {
        name: 'Get Category Breadcrumb',
        method: 'GET',
        url: '/categories/breadcrumb/ganesha-murtis',
        expectedStatus: 200,
        expectedFields: ['category', 'breadcrumb']
    },
    {
        name: 'Get Products with Advanced Filtering',
        method: 'GET',
        url: '/products?category=ganesha-murtis&limit=5&sort_by=rating_high_low&is_featured=true',
        expectedStatus: 200,
        expectedFields: ['products', 'pagination', 'filters', 'meta']
    },
    {
        name: 'Search Products',
        method: 'GET',
        url: '/products?search=brass&min_price=500&max_price=2000&limit=5',
        expectedStatus: 200,
        expectedFields: ['products', 'pagination', 'meta']
    },
    {
        name: 'Get Products by Main Category (Hindu Deities)',
        method: 'GET',
        url: '/products?category=hindu-deities&limit=10&sort_by=newest',
        expectedStatus: 200,
        expectedFields: ['products', 'pagination']
    },
    {
        name: 'Get Product Filters',
        method: 'GET',
        url: '/products/filters?category=ganesha-murtis',
        expectedStatus: 200,
        expectedFields: ['filters']
    },
    {
        name: 'Get Available Coupons',
        method: 'GET',
        url: '/coupons',
        expectedStatus: 200,
        expectedFields: ['data']
    }
];

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Test runner
async function runTests() {
    console.log(`${colors.bold}${colors.blue}🚀 Starting API Tests for Ghanshyam Murti Bhandar${colors.reset}\n`);
    
    let passed = 0;
    let failed = 0;
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`${colors.yellow}Testing: ${test.name}${colors.reset}`);
            
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.url}`,
                timeout: 10000
            });
            
            // Check status code
            if (response.status !== test.expectedStatus) {
                throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
            }
            
            // Check expected fields
            const data = response.data.data || response.data;
            for (const field of test.expectedFields) {
                if (!(field in data)) {
                    throw new Error(`Expected field '${field}' not found in response`);
                }
            }
            
            console.log(`${colors.green}✅ PASSED${colors.reset}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Response size: ${JSON.stringify(response.data).length} bytes`);
            
            if (data.categories) {
                console.log(`   Categories found: ${data.categories.length}`);
            }
            if (data.products) {
                console.log(`   Products found: ${data.products.length}`);
            }
            if (data.total !== undefined) {
                console.log(`   Total items: ${data.total}`);
            }
            
            passed++;
            results.push({ test: test.name, status: 'PASSED', details: null });
            
        } catch (error) {
            console.log(`${colors.red}❌ FAILED${colors.reset}`);
            console.log(`   Error: ${error.message}`);
            
            failed++;
            results.push({ test: test.name, status: 'FAILED', details: error.message });
        }
        
        console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log(`${colors.bold}📊 Test Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);
    
    // Detailed results
    if (failed > 0) {
        console.log(`${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
        results.filter(r => r.status === 'FAILED').forEach(result => {
            console.log(`${colors.red}• ${result.test}: ${result.details}${colors.reset}`);
        });
    }
    
    return { passed, failed, total: tests.length };
}

// Additional API information tests
async function getAPIInfo() {
    try {
        console.log(`${colors.bold}${colors.blue}📋 API Information:${colors.reset}\n`);
        
        // Get category tree to count categories
        const categoriesResponse = await axios.get(`${BASE_URL}/categories/tree`);
        const categories = categoriesResponse.data.data.categories;
        let totalCategories = 0;
        let totalSubcategories = 0;
        
        categories.forEach(cat => {
            totalCategories++;
            if (cat.children) {
                totalSubcategories += cat.children.length;
            }
        });
        
        // Get products count
        const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`);
        const totalProducts = productsResponse.data.data.pagination.total;
        
        // Get coupons count
        const couponsResponse = await axios.get(`${BASE_URL}/coupons`);
        const totalCoupons = couponsResponse.data.data.length;
        
        console.log(`📂 Main Categories: ${totalCategories}`);
        console.log(`📁 Subcategories: ${totalSubcategories}`);
        console.log(`🛍️  Total Products: ${totalProducts}`);
        console.log(`🎟️  Active Coupons: ${totalCoupons}`);
        console.log(`🌐 Base URL: ${BASE_URL}`);
        console.log(`📖 Documentation: Available in API_DOCUMENTATION.md\n`);
        
    } catch (error) {
        console.log(`${colors.red}Error getting API info: ${error.message}${colors.reset}\n`);
    }
}

// Main execution
async function main() {
    await getAPIInfo();
    const results = await runTests();
    
    if (results.failed === 0) {
        console.log(`${colors.green}${colors.bold}🎉 All tests passed! API is working perfectly.${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Some tests failed. Please check the API endpoints.${colors.reset}`);
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { runTests, getAPIInfo };
