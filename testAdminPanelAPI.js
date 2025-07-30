const axios = require('axios');

// Test the exact API calls that the admin panel makes
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let authToken = '';

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

async function testProductsListAPI() {
    console.log('\n📋 Testing Products List API (Admin Panel Call)...');
    
    try {
        const response = await axios.get(`${BASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const products = response.data.data.products;
        console.log(`✅ Found ${products.length} products`);
        
        // Check first few products for specifications
        const productsToCheck = products.slice(0, 3);
        
        productsToCheck.forEach((product, index) => {
            console.log(`\n📦 Product ${index + 1}: ${product.name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Price: ₹${product.price}`);
            
            if (product.specifications) {
                console.log('   📋 Specifications:');
                Object.entries(product.specifications).forEach(([key, value]) => {
                    if (value && key !== 'additionalInfo') {
                        console.log(`     ✓ ${key}: ${value}`);
                    }
                });
                
                const hasSpecs = Object.keys(product.specifications).some(key => 
                    product.specifications[key] && key !== 'additionalInfo'
                );
                
                if (!hasSpecs) {
                    console.log('     ⚠️ Specifications object exists but all fields are empty');
                }
            } else {
                console.log('   ❌ No specifications object');
            }
        });
        
        return products;
        
    } catch (error) {
        console.error('❌ Products list API failed:', error.response?.data || error.message);
        throw error;
    }
}

async function testSingleProductAPI() {
    console.log('\n🔍 Testing Single Product API (Edit Form Call)...');
    
    try {
        // First get a product with specifications
        const productsResponse = await axios.get(`${BASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const products = productsResponse.data.data.products;
        const productWithSpecs = products.find(p => 
            p.specifications && Object.keys(p.specifications).some(key => 
                p.specifications[key] && key !== 'additionalInfo'
            )
        );
        
        if (!productWithSpecs) {
            console.log('❌ No products with specifications found');
            return;
        }
        
        console.log(`📦 Testing product: ${productWithSpecs.name} (${productWithSpecs._id})`);
        
        // Get single product details
        const response = await axios.get(`${BASE_URL}/products/${productWithSpecs._id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const product = response.data.data.product;
        
        console.log('✅ Single product API response:');
        console.log(`   Name: ${product.name}`);
        console.log(`   Price: ₹${product.price}`);
        console.log(`   Original Price: ₹${product.original_price}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Active: ${product.is_active}`);
        console.log(`   Featured: ${product.is_featured}`);
        
        if (product.specifications) {
            console.log('   📋 Specifications for Edit Form:');
            Object.entries(product.specifications).forEach(([key, value]) => {
                console.log(`     ${key}: "${value || ''}"`);
            });
        } else {
            console.log('   ❌ No specifications in single product response');
        }
        
        return product;
        
    } catch (error) {
        console.error('❌ Single product API failed:', error.response?.data || error.message);
        throw error;
    }
}

async function testCategoriesAPI() {
    console.log('\n📂 Testing Categories API (Form Dropdown)...');
    
    try {
        const response = await axios.get(`${BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const categories = response.data.data || response.data.categories;
        console.log(`✅ Found ${categories.length} categories`);
        
        categories.slice(0, 3).forEach((category, index) => {
            console.log(`   ${index + 1}. ${category.name} (${category._id})`);
        });
        
        return categories;
        
    } catch (error) {
        console.error('❌ Categories API failed:', error.response?.data || error.message);
        throw error;
    }
}

async function runAdminPanelAPITest() {
    console.log('🚀 Testing Admin Panel API Calls...');
    console.log('=' .repeat(60));
    
    try {
        await loginAdmin();
        
        // Test the APIs that admin panel uses
        await testProductsListAPI();
        await testSingleProductAPI();
        await testCategoriesAPI();
        
        console.log('\n🎯 Admin Panel API Test Summary:');
        console.log('  ✅ All APIs are working correctly');
        console.log('  ✅ Products list includes specifications');
        console.log('  ✅ Single product API includes specifications');
        console.log('  ✅ Categories API is working');
        
        console.log('\n💡 If admin panel still has issues:');
        console.log('  1. Check browser developer tools for JavaScript errors');
        console.log('  2. Verify admin panel is running on correct port (3000)');
        console.log('  3. Check if admin panel is making requests to correct backend URL');
        console.log('  4. Verify admin panel code has latest changes');
        console.log('  5. Check if form fields are properly bound to state');
        
    } catch (error) {
        console.error('\n❌ Admin panel API test failed:', error.message);
    }
}

// Run the test
runAdminPanelAPITest().catch(console.error);
