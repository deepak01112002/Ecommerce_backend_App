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

async function getTestCategory() {
    console.log('📂 Getting test category...');
    try {
        const response = await makeRequest('GET', '/categories');
        const categories = response.data || response;
        if (categories.length > 0) {
            console.log(`✅ Using category: ${categories[0].name} (${categories[0]._id})`);
            return categories[0]._id;
        }
        throw new Error('No categories found');
    } catch (error) {
        console.error('❌ Failed to get categories:', error.message);
        throw error;
    }
}

async function debugProductCreation() {
    console.log('\n🔍 Debug: Creating product with specifications...');
    
    const categoryId = await getTestCategory();
    
    // Create FormData
    const formData = new FormData();
    
    // Basic product data
    formData.append('name', 'Debug Test Product with Specs');
    formData.append('description', 'This is a debug test product to check specifications');
    formData.append('price', '1999.99');
    formData.append('originalPrice', '2499.99');
    formData.append('category', categoryId);
    formData.append('stock', '25');
    formData.append('isActive', 'true');
    formData.append('isFeatured', 'false');
    formData.append('hsnCode', '9999');
    formData.append('gstRate', '18');
    formData.append('taxCategory', 'taxable');
    
    // Individual specification fields
    formData.append('material', 'Debug Premium Brass');
    formData.append('height', 'Debug 15 inches');
    formData.append('width', 'Debug 10 inches');
    formData.append('weight', 'Debug 3.0 kg');
    formData.append('finish', 'Debug Antique Gold');
    formData.append('origin', 'Debug Handcrafted in India');
    formData.append('color', 'Debug Golden');
    formData.append('style', 'Debug Traditional');
    formData.append('occasion', 'Debug Festival, Worship');
    formData.append('careInstructions', 'Debug Clean with soft cloth');
    
    console.log('\n📝 FormData contents prepared with specifications');
    
    try {
        const response = await makeRequest('POST', '/products', formData, true);
        const product = response.data || response;
        
        console.log('\n✅ Product created successfully!');
        console.log('📋 Response data:');
        console.log(JSON.stringify(product, null, 2));
        
        // Now fetch the product to see what's actually stored
        console.log('\n🔍 Fetching created product from database...');
        const fetchResponse = await makeRequest('GET', `/products/${product._id}`);
        const fetchedProduct = fetchResponse.data ? fetchResponse.data.product : fetchResponse.product;
        
        console.log('\n📋 Fetched product data:');
        console.log(JSON.stringify(fetchedProduct, null, 2));
        
        console.log('\n🔍 Specifications in fetched product:');
        if (fetchedProduct.specifications) {
            console.log('✅ Specifications found:');
            console.log(JSON.stringify(fetchedProduct.specifications, null, 2));
        } else {
            console.log('❌ No specifications found in fetched product');
        }
        
        return product._id;
        
    } catch (error) {
        console.error('❌ Product creation failed:', error.message);
        throw error;
    }
}

async function runDebug() {
    console.log('🚀 Starting Specifications Debug...');
    console.log('=' .repeat(50));
    
    try {
        await loginAdmin();
        const productId = await debugProductCreation();
        
        console.log('\n✅ Debug completed successfully!');
        console.log(`📝 Created product ID: ${productId}`);
        
    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
    }
}

// Run the debug
runDebug().catch(console.error);
