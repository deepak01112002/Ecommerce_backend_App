const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let authToken = '';
let testProductId = '';
let testCategoryId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, isFormData = false) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...(isFormData ? {} : { 'Content-Type': 'application/json' })
            }
        };

        if (data) {
            if (isFormData) {
                config.data = data;
                config.headers = { ...config.headers, ...data.getHeaders() };
            } else {
                config.data = data;
            }
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
        throw error;
    }
};

// Test functions
async function loginAdmin() {
    console.log('\n🔐 Testing Admin Login...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        authToken = response.data.data.token;
        console.log('✅ Admin login successful');
        return true;
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
        return false;
    }
}

async function getTestCategory() {
    console.log('\n📂 Getting test category...');
    try {
        const response = await makeRequest('GET', '/categories');
        const categories = response.data;
        if (categories && categories.length > 0) {
            testCategoryId = categories[0]._id;
            console.log(`✅ Using category: ${categories[0].name} (${testCategoryId})`);
            return true;
        } else {
            console.log('❌ No categories found');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to get categories:', error.message);
        return false;
    }
}

async function createProductWithSpecifications() {
    console.log('\n🆕 Testing Product Creation with Specifications...');
    
    try {
        const formData = new FormData();
        
        // Basic product data
        formData.append('name', 'Test Ganesh Murti with Specifications');
        formData.append('description', 'A beautiful handcrafted Ganesh murti with detailed specifications for testing');
        formData.append('price', '2999.99');
        formData.append('originalPrice', '3999.99');
        formData.append('category', testCategoryId);
        formData.append('stock', '50');
        formData.append('isActive', 'true');
        formData.append('isFeatured', 'true');
        
        // Specifications - individual fields
        formData.append('material', 'Premium Brass/Marble');
        formData.append('height', '12 inches');
        formData.append('width', '8 inches');
        formData.append('weight', '2.5 kg');
        formData.append('finish', 'Antique Gold');
        formData.append('origin', 'Handcrafted in India');
        formData.append('color', 'Golden Brown');
        formData.append('style', 'Traditional');
        formData.append('occasion', 'Festival, Daily Worship');
        formData.append('careInstructions', 'Clean with soft cloth. Avoid harsh chemicals. Store in dry place.');

        const response = await makeRequest('POST', '/products', formData, true);
        testProductId = response.data ? response.data._id : response._id;

        console.log('✅ Product created successfully with specifications');
        console.log(`   Product ID: ${testProductId}`);
        console.log(`   Name: ${response.data ? response.data.name : response.name}`);
        console.log(`   Specifications:`, response.data ? response.data.specifications : response.specifications);
        
        return true;
    } catch (error) {
        console.error('❌ Product creation failed:', error.message);
        return false;
    }
}

async function getProductWithSpecifications() {
    console.log('\n📖 Testing Product Retrieval with Specifications...');
    
    try {
        const response = await makeRequest('GET', `/products/${testProductId}`);
        const product = response.data ? response.data.product : response.product;

        console.log('✅ Product retrieved successfully');
        console.log(`   Name: ${product.name}`);
        console.log(`   Price: ₹${product.price}`);
        console.log('   Specifications:');

        if (product.specifications) {
            Object.entries(product.specifications).forEach(([key, value]) => {
                if (value) {
                    console.log(`     ${key}: ${value}`);
                }
            });
        } else {
            console.log('     No specifications found');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Product retrieval failed:', error.message);
        return false;
    }
}

async function updateProductSpecifications() {
    console.log('\n✏️ Testing Product Update with Specifications...');
    
    try {
        const formData = new FormData();
        
        // Update specifications
        formData.append('material', 'Premium Brass/Marble/Wood');
        formData.append('height', '14 inches');
        formData.append('width', '10 inches');
        formData.append('weight', '3.2 kg');
        formData.append('finish', 'Antique Gold with Silver Accents');
        formData.append('origin', 'Handcrafted in Rajasthan, India');
        formData.append('color', 'Multi-color (Golden, Silver, Brown)');
        formData.append('style', 'Traditional with Modern Touch');
        formData.append('occasion', 'Festival, Daily Worship, Special Occasions');
        formData.append('careInstructions', 'Clean with soft cloth and mild soap. Avoid harsh chemicals. Store in dry place away from direct sunlight.');

        const response = await makeRequest('PUT', `/products/${testProductId}`, formData, true);
        const product = response.data || response;

        console.log('✅ Product updated successfully');
        console.log('   Updated Specifications:');

        if (product.specifications) {
            Object.entries(product.specifications).forEach(([key, value]) => {
                if (value) {
                    console.log(`     ${key}: ${value}`);
                }
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Product update failed:', error.message);
        return false;
    }
}

async function testProductsListWithSpecifications() {
    console.log('\n📋 Testing Products List with Specifications...');
    
    try {
        const response = await makeRequest('GET', '/products?limit=5');
        const products = response.data ? response.data.products : response.products;

        console.log(`✅ Retrieved ${products.length} products`);
        
        products.forEach((product, index) => {
            console.log(`\n   Product ${index + 1}: ${product.name}`);
            if (product.specifications && Object.keys(product.specifications).length > 0) {
                console.log('     Specifications available:');
                Object.entries(product.specifications).forEach(([key, value]) => {
                    if (value) {
                        console.log(`       ${key}: ${value}`);
                    }
                });
            } else {
                console.log('     No specifications');
            }
        });
        
        return true;
    } catch (error) {
        console.error('❌ Products list retrieval failed:', error.message);
        return false;
    }
}

async function cleanupTestProduct() {
    console.log('\n🧹 Cleaning up test product...');
    
    try {
        await makeRequest('DELETE', `/products/${testProductId}`);
        console.log('✅ Test product deleted successfully');
        return true;
    } catch (error) {
        console.error('❌ Test product cleanup failed:', error.message);
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Product Specifications API Tests...');
    console.log('=' .repeat(60));
    
    const tests = [
        { name: 'Admin Login', fn: loginAdmin },
        { name: 'Get Test Category', fn: getTestCategory },
        { name: 'Create Product with Specifications', fn: createProductWithSpecifications },
        { name: 'Get Product with Specifications', fn: getProductWithSpecifications },
        { name: 'Update Product Specifications', fn: updateProductSpecifications },
        { name: 'Test Products List with Specifications', fn: testProductsListWithSpecifications },
        { name: 'Cleanup Test Product', fn: cleanupTestProduct }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test "${test.name}" threw an error:`, error.message);
            failed++;
        }
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Product specifications are working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the errors above.');
    }
}

// Run the tests
runTests().catch(console.error);
