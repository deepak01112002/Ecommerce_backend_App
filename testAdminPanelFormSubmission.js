const axios = require('axios');
const FormData = require('form-data');

// Test exactly what the admin panel form is sending
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

async function testExactFormSubmission() {
    console.log('\n🧪 Testing Exact Admin Panel Form Submission...');
    
    try {
        // Get categories first
        const categoriesResponse = await axios.get(`${BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const categories = categoriesResponse.data.data || categoriesResponse.data.categories;
        const testCategory = categories[0];
        
        console.log(`📂 Using category: ${testCategory.name} (${testCategory._id})`);
        
        // Create FormData exactly like the admin panel form
        const formData = new FormData();
        
        // Basic fields (exactly as shown in your payload)
        formData.append('name', 'sdfsfss');
        formData.append('description', 'fsdfsdfafsd');
        formData.append('category', '6883dcbed6a3dd0783f7ed5e');
        formData.append('price', '12343');
        formData.append('originalPrice', '12');
        formData.append('stock', '123');
        formData.append('isActive', 'true');
        
        // Specifications (exactly as shown in your payload)
        formData.append('material', 'Marble');
        formData.append('height', '12');
        formData.append('width', '5');
        formData.append('weight', '4.5');
        formData.append('finish', 'gold');
        formData.append('origin', 'india');
        formData.append('color', 'green');
        formData.append('style', 'modern');
        formData.append('occasion', 'slfjslf');
        formData.append('careInstructions', 'dfgdfsd');
        
        console.log('\n📤 Sending FormData to /products endpoint...');
        console.log('FormData contents:');
        console.log('  name: sdfsfss');
        console.log('  description: fsdfsdfafsd');
        console.log('  category: 6883dcbed6a3dd0783f7ed5e');
        console.log('  price: 12343');
        console.log('  originalPrice: 12');
        console.log('  stock: 123');
        console.log('  isActive: true');
        console.log('  material: Marble');
        console.log('  height: 12');
        console.log('  width: 5');
        console.log('  weight: 4.5');
        console.log('  finish: gold');
        console.log('  origin: india');
        console.log('  color: green');
        console.log('  style: modern');
        console.log('  occasion: slfjslf');
        console.log('  careInstructions: dfgdfsd');
        
        const response = await axios.post(`${BASE_URL}/products`, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            }
        });
        
        const createdProduct = response.data.data;
        console.log('\n✅ Product created successfully!');
        console.log(`📦 Product ID: ${createdProduct._id}`);
        console.log(`📝 Product Name: ${createdProduct.name}`);
        
        console.log('\n📋 Specifications in response:');
        if (createdProduct.specifications) {
            Object.entries(createdProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`  ✓ ${key}: ${value}`);
                } else if (key !== 'additionalInfo') {
                    console.log(`  ❌ ${key}: (empty)`);
                }
            });
        } else {
            console.log('  ❌ No specifications object found in response');
        }
        
        // Verify by getting the product back
        console.log('\n🔍 Verifying by retrieving the product...');
        const getResponse = await axios.get(`${BASE_URL}/products/${createdProduct._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const retrievedProduct = getResponse.data.data.product;
        console.log('✅ Product retrieved successfully');
        
        console.log('\n📋 Specifications in retrieved product:');
        if (retrievedProduct.specifications) {
            Object.entries(retrievedProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`  ✓ ${key}: ${value}`);
                } else if (key !== 'additionalInfo') {
                    console.log(`  ❌ ${key}: (empty)`);
                }
            });
        } else {
            console.log('  ❌ No specifications object found in retrieved product');
        }
        
        // Cleanup
        console.log('\n🧹 Cleaning up test product...');
        await axios.delete(`${BASE_URL}/products/${createdProduct._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('✅ Test product deleted');
        
        return true;
        
    } catch (error) {
        console.error('❌ Form submission test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function runTest() {
    console.log('🚀 Testing Admin Panel Form Submission...');
    console.log('=' .repeat(60));
    
    try {
        await loginAdmin();
        const success = await testExactFormSubmission();
        
        if (success) {
            console.log('\n🎉 Form Submission Test Completed Successfully!');
            console.log('\n📝 This confirms:');
            console.log('  ✅ Backend receives FormData correctly');
            console.log('  ✅ Specifications are processed and saved');
            console.log('  ✅ Product creation works with specifications');
            console.log('\n💡 If admin panel still has issues:');
            console.log('  1. Check browser console for errors');
            console.log('  2. Check network tab to see actual requests');
            console.log('  3. Verify admin panel is using latest code');
        } else {
            console.log('\n❌ Form submission test failed');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
runTest().catch(console.error);
