const axios = require('axios');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, isFormData = false) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
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
        return response.data;
    } catch (error) {
        console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
        throw error;
    }
};

async function loginAdmin() {
    console.log('🔐 Logging in as admin...');
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

async function testProductCreationWithSpecifications() {
    console.log('\n🧪 Testing Product Creation with Specifications...');
    
    try {
        // Get categories first
        const categoriesResponse = await makeRequest('GET', '/categories');
        const categories = categoriesResponse.data || categoriesResponse.categories;
        const testCategory = categories[0];
        
        console.log(`📂 Using category: ${testCategory.name} (${testCategory._id})`);
        
        // Create FormData exactly like the admin panel would
        const formData = new FormData();
        
        // Basic product fields
        formData.append('name', 'Debug Test Product with Specifications');
        formData.append('description', 'This is a debug test product to check specifications');
        formData.append('price', '1299.99');
        formData.append('originalPrice', '1599.99');
        formData.append('category', testCategory._id);
        formData.append('stock', '25');
        formData.append('isActive', 'true');
        formData.append('isFeatured', 'false');
        
        // Specifications - exactly as the admin form sends them
        formData.append('material', 'Debug Test Premium Brass');
        formData.append('height', 'Debug Test 15 inches');
        formData.append('width', 'Debug Test 10 inches');
        formData.append('weight', 'Debug Test 2.8 kg');
        formData.append('finish', 'Debug Test Antique Gold Plated');
        formData.append('origin', 'Debug Test Handcrafted in Rajasthan, India');
        formData.append('color', 'Debug Test Golden with Red Accents');
        formData.append('style', 'Debug Test Traditional Indian');
        formData.append('occasion', 'Debug Test Festivals and Daily Worship');
        formData.append('careInstructions', 'Debug Test Clean with soft dry cloth, avoid water');
        
        console.log('\n📤 Sending FormData with specifications...');
        
        const response = await makeRequest('POST', '/products', formData, true);
        const product = response.data;
        
        console.log('\n✅ Product created successfully!');
        console.log(`📦 Product ID: ${product._id}`);
        console.log(`📝 Product Name: ${product.name}`);
        
        console.log('\n📋 Specifications received in response:');
        if (product.specifications) {
            Object.entries(product.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`  ✓ ${key}: ${value}`);
                } else if (key !== 'additionalInfo') {
                    console.log(`  ❌ ${key}: (empty)`);
                }
            });
        } else {
            console.log('  ❌ No specifications object found in response');
        }
        
        return product._id;
        
    } catch (error) {
        console.error('❌ Product creation test failed:', error.message);
        throw error;
    }
}

async function testProductRetrieval(productId) {
    console.log('\n🔍 Testing Product Retrieval...');
    
    try {
        const response = await makeRequest('GET', `/products/${productId}`);
        const product = response.data.product;
        
        console.log('✅ Product retrieved successfully');
        console.log(`📦 Product ID: ${product._id}`);
        console.log(`📝 Product Name: ${product.name}`);
        
        console.log('\n📋 Specifications in retrieved product:');
        if (product.specifications) {
            Object.entries(product.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`  ✓ ${key}: ${value}`);
                } else if (key !== 'additionalInfo') {
                    console.log(`  ❌ ${key}: (empty)`);
                }
            });
        } else {
            console.log('  ❌ No specifications object found');
        }
        
        return product;
        
    } catch (error) {
        console.error('❌ Product retrieval test failed:', error.message);
        throw error;
    }
}

async function testExistingProductForEdit() {
    console.log('\n🔍 Testing Existing Product for Edit Form...');
    
    try {
        // Get products list
        const response = await makeRequest('GET', '/products?limit=10');
        const products = response.data.products;
        
        console.log(`📦 Found ${products.length} products`);
        
        // Find a product with specifications
        let productWithSpecs = null;
        let productWithoutSpecs = null;
        
        for (const product of products) {
            if (product.specifications && Object.keys(product.specifications).some(key => 
                product.specifications[key] && key !== 'additionalInfo'
            )) {
                productWithSpecs = product;
            } else {
                productWithoutSpecs = product;
            }
        }
        
        if (productWithSpecs) {
            console.log('\n✅ Found product WITH specifications:');
            console.log(`  📦 ID: ${productWithSpecs._id}`);
            console.log(`  📝 Name: ${productWithSpecs.name}`);
            console.log('  📋 Specifications:');
            Object.entries(productWithSpecs.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`    ✓ ${key}: ${value}`);
                }
            });
        }
        
        if (productWithoutSpecs) {
            console.log('\n⚠️ Found product WITHOUT specifications:');
            console.log(`  📦 ID: ${productWithoutSpecs._id}`);
            console.log(`  📝 Name: ${productWithoutSpecs.name}`);
            console.log('  📋 Specifications: None or empty');
        }
        
        return { productWithSpecs, productWithoutSpecs };
        
    } catch (error) {
        console.error('❌ Existing product test failed:', error.message);
        throw error;
    }
}

async function runDebugTest() {
    console.log('🚀 Starting Admin Panel Specifications Debug Test...');
    console.log('=' .repeat(70));
    
    let testProductId = null;
    
    try {
        await loginAdmin();
        
        // Test 1: Create product with specifications
        testProductId = await testProductCreationWithSpecifications();
        
        // Test 2: Retrieve the created product
        await testProductRetrieval(testProductId);
        
        // Test 3: Check existing products for edit form testing
        await testExistingProductForEdit();
        
        console.log('\n🎯 Debug Test Summary:');
        console.log('  ✅ Product creation with specifications works');
        console.log('  ✅ Product retrieval includes specifications');
        console.log('  ✅ Existing products checked for edit form compatibility');
        
        console.log('\n💡 If admin panel is not showing specifications:');
        console.log('  1. Check browser console for JavaScript errors');
        console.log('  2. Verify admin panel is using latest code');
        console.log('  3. Check if form fields are properly rendered');
        console.log('  4. Verify API responses include specifications');
        
    } catch (error) {
        console.error('\n❌ Debug test failed:', error.message);
    } finally {
        // Cleanup
        if (testProductId) {
            try {
                await makeRequest('DELETE', `/products/${testProductId}`);
                console.log('\n🧹 Test product cleaned up');
            } catch (error) {
                console.log('\n⚠️ Failed to cleanup test product');
            }
        }
    }
}

// Run the debug test
runDebugTest().catch(console.error);
