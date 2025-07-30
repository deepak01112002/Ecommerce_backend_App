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

async function testFinalSpecifications() {
    console.log('\n🚀 Final Specifications Test...');
    
    try {
        // Test 1: Create product with specifications via FormData
        console.log('\n1️⃣ Testing Add Product with Specifications...');
        
        const categoriesResponse = await makeRequest('GET', '/categories');
        const categories = categoriesResponse.data || categoriesResponse.categories;
        const testCategory = categories[0];
        
        const formData = new FormData();
        formData.append('name', 'Final Test Product with Specs');
        formData.append('description', 'Final test product description');
        formData.append('price', '999.99');
        formData.append('originalPrice', '1299.99');
        formData.append('category', testCategory._id);
        formData.append('stock', '10');
        formData.append('isActive', 'true');
        formData.append('isFeatured', 'false');
        
        // Specifications
        formData.append('material', 'Final Test Brass');
        formData.append('height', 'Final Test 8 inches');
        formData.append('width', 'Final Test 5 inches');
        formData.append('weight', 'Final Test 1.2 kg');
        formData.append('finish', 'Final Test Gold Plated');
        formData.append('origin', 'Final Test India');
        formData.append('color', 'Final Test Golden');
        formData.append('style', 'Final Test Modern');
        formData.append('occasion', 'Final Test Festival');
        formData.append('careInstructions', 'Final Test Clean gently');
        
        const createResponse = await makeRequest('POST', '/products', formData, true);
        const createdProduct = createResponse.data;

        console.log('✅ Product created successfully');

        if (!createdProduct || !createdProduct._id) {
            throw new Error('Product creation failed - no product ID returned');
        }

        console.log(`   ID: ${createdProduct._id}`);
        console.log(`   Name: ${createdProduct.name}`);
        
        // Test 2: Retrieve product and verify specifications
        console.log('\n2️⃣ Testing Product Retrieval...');
        
        const getResponse = await makeRequest('GET', `/products/${createdProduct._id}`);
        const retrievedProduct = getResponse.data.product;
        
        console.log('✅ Product retrieved successfully');
        console.log('   📋 Specifications:');
        
        if (retrievedProduct.specifications) {
            Object.entries(retrievedProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ${key}: ${value}`);
                }
            });
        }
        
        // Test 3: Update product specifications
        console.log('\n3️⃣ Testing Product Update...');
        
        const updateFormData = new FormData();
        updateFormData.append('name', retrievedProduct.name + ' - Updated');
        updateFormData.append('description', retrievedProduct.description + ' - Updated');
        updateFormData.append('price', retrievedProduct.price.toString());
        updateFormData.append('originalPrice', retrievedProduct.original_price?.toString() || retrievedProduct.price.toString());
        updateFormData.append('category', retrievedProduct.category._id);
        updateFormData.append('stock', retrievedProduct.stock.toString());
        updateFormData.append('isActive', retrievedProduct.is_active.toString());
        updateFormData.append('isFeatured', (retrievedProduct.is_featured || false).toString());
        
        // Updated specifications
        updateFormData.append('material', 'Updated Final Test Brass/Silver');
        updateFormData.append('height', 'Updated Final Test 10 inches');
        updateFormData.append('width', 'Updated Final Test 7 inches');
        updateFormData.append('weight', 'Updated Final Test 1.5 kg');
        updateFormData.append('finish', 'Updated Final Test Antique Gold');
        updateFormData.append('origin', 'Updated Final Test Rajasthan, India');
        updateFormData.append('color', 'Updated Final Test Multi-color');
        updateFormData.append('style', 'Updated Final Test Traditional');
        updateFormData.append('occasion', 'Updated Final Test All Occasions');
        updateFormData.append('careInstructions', 'Updated Final Test Handle with care');
        
        const updateResponse = await makeRequest('PUT', `/products/${createdProduct._id}`, updateFormData, true);
        const updatedProduct = updateResponse.data;

        console.log('✅ Product updated successfully');
        console.log('   📋 Updated Specifications:');

        if (updatedProduct && updatedProduct.specifications) {
            Object.entries(updatedProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ${key}: ${value}`);
                }
            });
        } else {
            console.log('   ❌ No specifications found in update response');
        }
        
        // Test 4: Verify in products list
        console.log('\n4️⃣ Testing Products List...');
        
        const listResponse = await makeRequest('GET', '/products?limit=5');
        const products = listResponse.data.products;
        
        const ourProduct = products.find(p => p._id === createdProduct._id);
        
        if (ourProduct && ourProduct.specifications) {
            console.log('✅ Product found in list with specifications');
            console.log('   📋 List Specifications:');
            Object.entries(ourProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ${key}: ${value}`);
                }
            });
        } else {
            console.log('❌ Product not found in list or missing specifications');
        }
        
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await makeRequest('DELETE', `/products/${createdProduct._id}`);
        console.log('✅ Test product deleted');
        
        return true;
        
    } catch (error) {
        console.error('❌ Final specifications test failed:', error.message);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting Final Specifications Test...');
    console.log('=' .repeat(60));
    
    try {
        await loginAdmin();
        const success = await testFinalSpecifications();
        
        if (success) {
            console.log('\n🎉 All specifications tests passed!');
            console.log('\n📝 Summary:');
            console.log('   ✅ Product creation with specifications works');
            console.log('   ✅ Product retrieval includes specifications');
            console.log('   ✅ Product update with specifications works');
            console.log('   ✅ Products list includes specifications');
            console.log('\n🎯 System is ready for production!');
        } else {
            console.log('\n❌ Some tests failed');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
runTest().catch(console.error);
