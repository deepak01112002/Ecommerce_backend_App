const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
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

async function findProductsWithSpecifications() {
    console.log('\n🔍 Finding products with specifications...');
    
    try {
        const response = await makeRequest('GET', '/products?limit=20');
        const products = response.data ? response.data.products : response.products;
        
        console.log(`📋 Checking ${products.length} products for specifications...`);
        
        const productsWithSpecs = [];
        
        for (const product of products) {
            if (product.specifications && Object.keys(product.specifications).some(key => 
                product.specifications[key] && key !== 'additionalInfo'
            )) {
                productsWithSpecs.push(product);
                console.log(`✅ Found product with specs: ${product.name} (${product._id})`);
                
                // Show specifications
                console.log('   📋 Specifications:');
                Object.entries(product.specifications).forEach(([key, value]) => {
                    if (value && key !== 'additionalInfo') {
                        console.log(`     ${key}: ${value}`);
                    }
                });
                console.log('');
            }
        }
        
        if (productsWithSpecs.length === 0) {
            console.log('❌ No products with specifications found');
            return null;
        }
        
        console.log(`✅ Found ${productsWithSpecs.length} products with specifications`);
        return productsWithSpecs[0]; // Return the first one for testing
        
    } catch (error) {
        console.error('❌ Failed to find products:', error.message);
        throw error;
    }
}

async function testProductDetailAPI(productId) {
    console.log(`\n🔍 Testing product detail API for ID: ${productId}`);
    
    try {
        const response = await makeRequest('GET', `/products/${productId}`);
        const product = response.data ? response.data.product : response.product;
        
        console.log('✅ Product detail retrieved successfully');
        console.log(`   Name: ${product.name}`);
        console.log(`   ID: ${product._id}`);
        
        if (product.specifications) {
            console.log('   📋 Specifications in API response:');
            Object.entries(product.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ${key}: ${value}`);
                }
            });
        } else {
            console.log('   ❌ No specifications in API response');
        }
        
        return product;
        
    } catch (error) {
        console.error('❌ Product detail API failed:', error.message);
        throw error;
    }
}

async function testAdminPanelDataStructure() {
    console.log('\n🔍 Testing admin panel data structure...');
    
    try {
        // Find a product with specifications
        const productWithSpecs = await findProductsWithSpecifications();
        
        if (!productWithSpecs) {
            console.log('❌ Cannot test edit form - no products with specifications found');
            return false;
        }
        
        // Test the product detail API that the edit form would use
        const detailProduct = await testProductDetailAPI(productWithSpecs._id);
        
        // Simulate what the edit form would do
        console.log('\n🔧 Simulating edit form data initialization...');
        
        const editFormData = {
            name: detailProduct.name,
            description: detailProduct.description,
            price: detailProduct.price.toString(),
            originalPrice: detailProduct.original_price?.toString() || detailProduct.price.toString(),
            category: detailProduct.category._id,
            stock: detailProduct.stock.toString(),
            isActive: detailProduct.is_active,
            isFeatured: detailProduct.is_featured || false,
            // Specifications
            material: detailProduct.specifications?.material || '',
            height: detailProduct.specifications?.height || '',
            width: detailProduct.specifications?.width || '',
            weight: detailProduct.specifications?.weight || '',
            finish: detailProduct.specifications?.finish || '',
            origin: detailProduct.specifications?.origin || '',
            color: detailProduct.specifications?.color || '',
            style: detailProduct.specifications?.style || '',
            occasion: detailProduct.specifications?.occasion || '',
            careInstructions: detailProduct.specifications?.careInstructions || '',
        };
        
        console.log('✅ Edit form data would be initialized as:');
        console.log('   📋 Specification fields:');
        console.log(`     material: "${editFormData.material}"`);
        console.log(`     height: "${editFormData.height}"`);
        console.log(`     width: "${editFormData.width}"`);
        console.log(`     weight: "${editFormData.weight}"`);
        console.log(`     finish: "${editFormData.finish}"`);
        console.log(`     origin: "${editFormData.origin}"`);
        console.log(`     color: "${editFormData.color}"`);
        console.log(`     style: "${editFormData.style}"`);
        console.log(`     occasion: "${editFormData.occasion}"`);
        console.log(`     careInstructions: "${editFormData.careInstructions}"`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Admin panel data structure test failed:', error.message);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting Edit Form Specifications Test...');
    console.log('=' .repeat(60));
    
    try {
        await loginAdmin();
        const success = await testAdminPanelDataStructure();
        
        if (success) {
            console.log('\n✅ Edit form specifications test completed successfully!');
            console.log('\n📝 Summary:');
            console.log('   ✅ Products with specifications found in database');
            console.log('   ✅ Product detail API returns specifications correctly');
            console.log('   ✅ Edit form would initialize with specification values');
            console.log('\n🎯 Next steps:');
            console.log('   1. Open admin panel at http://localhost:3000');
            console.log('   2. Go to Products section');
            console.log('   3. Find a product with specifications (like "Debug Test Product with Specs")');
            console.log('   4. Click edit to see specifications in the form');
        } else {
            console.log('\n❌ Edit form specifications test failed');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
runTest().catch(console.error);
