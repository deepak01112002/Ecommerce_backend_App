const axios = require('axios');
const FormData = require('form-data');

// Comprehensive backend API test
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let authToken = '';
let testProductId = null;
let testCategoryId = null;

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, success, details = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}`);
    if (details) console.log(`   ${details}`);
    
    testResults.tests.push({ name, success, details });
    if (success) testResults.passed++;
    else testResults.failed++;
}

async function makeRequest(method, endpoint, data = null, isFormData = false) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        };

        if (data) {
            if (isFormData) {
                config.data = data;
                config.headers = {
                    ...config.headers,
                    ...data.getHeaders()
                };
            } else {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
        authToken = response.data.data.token;
        logTest('Admin Login', true, 'Token received successfully');
        return true;
    } catch (error) {
        logTest('Admin Login', false, error.response?.data?.message || error.message);
        return false;
    }
}

async function testCategoryAPIs() {
    console.log('\n📂 Testing Category APIs...');
    
    // Get categories
    const getResult = await makeRequest('GET', '/categories');
    if (getResult.success) {
        const categories = getResult.data.data || getResult.data.categories;
        testCategoryId = categories[0]?._id;
        logTest('Get Categories', true, `Found ${categories.length} categories`);
    } else {
        logTest('Get Categories', false, getResult.error.message);
    }
    
    // Create category
    const createData = {
        name: 'Test Category API',
        description: 'Test category for API testing',
        slug: 'test-category-api'
    };
    
    const createResult = await makeRequest('POST', '/categories', createData);
    if (createResult.success) {
        const newCategory = createResult.data.data;
        logTest('Create Category', true, `Created category: ${newCategory.name}`);
        
        // Update category
        const updateData = { name: 'Updated Test Category API' };
        const updateResult = await makeRequest('PUT', `/categories/${newCategory._id}`, updateData);
        logTest('Update Category', updateResult.success, 
            updateResult.success ? 'Category updated successfully' : updateResult.error.message);
        
        // Delete category
        const deleteResult = await makeRequest('DELETE', `/categories/${newCategory._id}`);
        logTest('Delete Category', deleteResult.success,
            deleteResult.success ? 'Category deleted successfully' : deleteResult.error.message);
    } else {
        logTest('Create Category', false, createResult.error.message);
    }
}

async function testProductAPIs() {
    console.log('\n📦 Testing Product APIs...');
    
    // Get products
    const getResult = await makeRequest('GET', '/products');
    if (getResult.success) {
        const products = getResult.data.data.products;
        logTest('Get Products', true, `Found ${products.length} products`);
        
        // Check if any products have specifications
        const productsWithSpecs = products.filter(p => 
            p.specifications && Object.keys(p.specifications).some(key => 
                p.specifications[key] && key !== 'additionalInfo'
            )
        );
        logTest('Products with Specifications', productsWithSpecs.length > 0, 
            `${productsWithSpecs.length} products have specifications`);
    } else {
        logTest('Get Products', false, getResult.error.message);
    }
    
    // Create product with specifications
    const formData = new FormData();
    formData.append('name', 'API Test Product with Specifications');
    formData.append('description', 'Complete API test product with all specifications');
    formData.append('price', '2999.99');
    formData.append('originalPrice', '3999.99');
    formData.append('category', testCategoryId);
    formData.append('stock', '50');
    formData.append('isActive', 'true');
    formData.append('isFeatured', 'false');
    
    // All specifications
    formData.append('material', 'API Test Premium Brass/Marble');
    formData.append('height', 'API Test 16 inches');
    formData.append('width', 'API Test 12 inches');
    formData.append('weight', 'API Test 4.2 kg');
    formData.append('finish', 'API Test Antique Gold Plated');
    formData.append('origin', 'API Test Handcrafted in Rajasthan, India');
    formData.append('color', 'API Test Golden with Silver Accents');
    formData.append('style', 'API Test Traditional Indian');
    formData.append('occasion', 'API Test Festivals and Daily Worship');
    formData.append('careInstructions', 'API Test Clean with soft dry cloth, avoid water and chemicals');
    
    const createResult = await makeRequest('POST', '/products', formData, true);
    if (createResult.success) {
        const newProduct = createResult.data.data;
        testProductId = newProduct._id;
        logTest('Create Product', true, `Created product: ${newProduct.name}`);
        
        // Check specifications in created product
        if (newProduct.specifications) {
            const specCount = Object.keys(newProduct.specifications).filter(key => 
                newProduct.specifications[key] && key !== 'additionalInfo'
            ).length;
            logTest('Product Specifications Saved', specCount > 0, 
                `${specCount} specifications saved successfully`);
        } else {
            logTest('Product Specifications Saved', false, 'No specifications found in created product');
        }
        
        // Get single product
        const getSingleResult = await makeRequest('GET', `/products/${testProductId}`);
        if (getSingleResult.success) {
            const product = getSingleResult.data.data.product;
            logTest('Get Single Product', true, `Retrieved product: ${product.name}`);
            
            // Check specifications in retrieved product
            if (product.specifications) {
                const specCount = Object.keys(product.specifications).filter(key => 
                    product.specifications[key] && key !== 'additionalInfo'
                ).length;
                logTest('Single Product Specifications', specCount > 0, 
                    `${specCount} specifications retrieved successfully`);
            } else {
                logTest('Single Product Specifications', false, 'No specifications in retrieved product');
            }
        } else {
            logTest('Get Single Product', false, getSingleResult.error.message);
        }
        
        // Update product with new specifications
        const updateFormData = new FormData();
        updateFormData.append('name', newProduct.name + ' - Updated');
        updateFormData.append('description', newProduct.description + ' - Updated');
        updateFormData.append('price', newProduct.price.toString());
        updateFormData.append('originalPrice', newProduct.original_price.toString());
        updateFormData.append('category', newProduct.category._id);
        updateFormData.append('stock', newProduct.stock.toString());
        updateFormData.append('isActive', newProduct.is_active.toString());
        updateFormData.append('isFeatured', (newProduct.is_featured || false).toString());
        
        // Updated specifications
        updateFormData.append('material', 'Updated API Test Premium Silver/Gold');
        updateFormData.append('height', 'Updated API Test 18 inches');
        updateFormData.append('width', 'Updated API Test 14 inches');
        updateFormData.append('weight', 'Updated API Test 5.0 kg');
        updateFormData.append('finish', 'Updated API Test Antique Silver');
        updateFormData.append('origin', 'Updated API Test Handcrafted in Gujarat, India');
        updateFormData.append('color', 'Updated API Test Silver with Gold Accents');
        updateFormData.append('style', 'Updated API Test Modern Traditional');
        updateFormData.append('occasion', 'Updated API Test All Occasions');
        updateFormData.append('careInstructions', 'Updated API Test Handle with care, clean gently');
        
        const updateResult = await makeRequest('PUT', `/products/${testProductId}`, updateFormData, true);
        if (updateResult.success) {
            const updatedProduct = updateResult.data.data;
            logTest('Update Product', true, `Updated product: ${updatedProduct.name}`);
            
            // Check updated specifications
            if (updatedProduct.specifications) {
                const hasUpdatedSpecs = Object.keys(updatedProduct.specifications).some(key => 
                    updatedProduct.specifications[key] && updatedProduct.specifications[key].includes('Updated')
                );
                logTest('Updated Product Specifications', hasUpdatedSpecs, 
                    'Specifications updated successfully');
            } else {
                logTest('Updated Product Specifications', false, 'No specifications in updated product');
            }
        } else {
            logTest('Update Product', false, updateResult.error.message);
        }
        
    } else {
        logTest('Create Product', false, createResult.error.message);
    }
}

async function testSearchAndFilterAPIs() {
    console.log('\n🔍 Testing Search and Filter APIs...');
    
    // Search products
    const searchResult = await makeRequest('GET', '/products?search=test');
    logTest('Search Products', searchResult.success, 
        searchResult.success ? `Found ${searchResult.data.data.products.length} products` : searchResult.error.message);
    
    // Get featured products
    const featuredResult = await makeRequest('GET', '/products/featured');
    logTest('Get Featured Products', featuredResult.success,
        featuredResult.success ? `Found ${featuredResult.data.data.length} featured products` : featuredResult.error.message);
    
    // Get products by category
    if (testCategoryId) {
        const categoryResult = await makeRequest('GET', `/products?category=${testCategoryId}`);
        logTest('Get Products by Category', categoryResult.success,
            categoryResult.success ? `Found ${categoryResult.data.data.products.length} products in category` : categoryResult.error.message);
    }
}

async function testUserAPIs() {
    console.log('\n👥 Testing User Management APIs...');
    
    // Get users
    const getUsersResult = await makeRequest('GET', '/admin/users');
    logTest('Get Users', getUsersResult.success,
        getUsersResult.success ? `Found ${getUsersResult.data.data.length} users` : getUsersResult.error.message);
    
    // Get user profile
    const profileResult = await makeRequest('GET', '/auth/profile');
    logTest('Get User Profile', profileResult.success,
        profileResult.success ? `Profile: ${profileResult.data.data.email}` : profileResult.error.message);
}

async function testOrderAPIs() {
    console.log('\n🛒 Testing Order APIs...');
    
    // Get orders
    const ordersResult = await makeRequest('GET', '/admin/orders');
    logTest('Get Orders', ordersResult.success,
        ordersResult.success ? `Found ${ordersResult.data.data.length} orders` : ordersResult.error.message);
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (testProductId) {
        const deleteResult = await makeRequest('DELETE', `/products/${testProductId}`);
        logTest('Cleanup Test Product', deleteResult.success,
            deleteResult.success ? 'Test product deleted' : deleteResult.error.message);
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Backend API Test...');
    console.log('=' .repeat(80));
    
    try {
        // Test authentication first
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            console.log('\n❌ Authentication failed - cannot continue with other tests');
            return;
        }
        
        // Run all API tests
        await testCategoryAPIs();
        await testProductAPIs();
        await testSearchAndFilterAPIs();
        await testUserAPIs();
        await testOrderAPIs();
        
        // Cleanup
        await cleanup();
        
        // Final results
        console.log('\n' + '=' .repeat(80));
        console.log('🎯 COMPREHENSIVE BACKEND API TEST RESULTS');
        console.log('=' .repeat(80));
        
        const total = testResults.passed + testResults.failed;
        const successRate = ((testResults.passed / total) * 100).toFixed(1);
        
        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            testResults.tests.filter(t => !t.success).forEach(test => {
                console.log(`   • ${test.name}: ${test.details}`);
            });
        }
        
        console.log('\n🎉 Backend API Test Complete!');
        
        if (successRate >= 90) {
            console.log('✅ Backend is working excellently!');
        } else if (successRate >= 75) {
            console.log('⚠️ Backend is mostly working but has some issues');
        } else {
            console.log('❌ Backend has significant issues that need attention');
        }
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
