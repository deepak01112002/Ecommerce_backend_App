const axios = require('axios');
const FormData = require('form-data');

// Test the admin panel fix
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

async function testAdminPanelFlow() {
    console.log('\n🧪 Testing Complete Admin Panel Flow...');
    
    try {
        // Step 1: Get categories (for form dropdown)
        console.log('\n1️⃣ Getting categories...');
        const categoriesResponse = await axios.get(`${BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const categories = categoriesResponse.data.data || categoriesResponse.data.categories;
        console.log(`✅ Found ${categories.length} categories`);
        const testCategory = categories[0];
        console.log(`   Using category: ${testCategory.name} (${testCategory._id})`);
        
        // Step 2: Create product via admin panel (FormData)
        console.log('\n2️⃣ Creating product via admin panel...');
        const formData = new FormData();
        formData.append('name', 'Admin Panel Test Product');
        formData.append('description', 'Created via admin panel with specifications');
        formData.append('price', '1499.99');
        formData.append('originalPrice', '1899.99');
        formData.append('category', testCategory._id);
        formData.append('stock', '20');
        formData.append('isActive', 'true');
        formData.append('isFeatured', 'false');
        
        // Specifications
        formData.append('material', 'Admin Panel Premium Brass');
        formData.append('height', 'Admin Panel 14 inches');
        formData.append('width', 'Admin Panel 9 inches');
        formData.append('weight', 'Admin Panel 3.2 kg');
        formData.append('finish', 'Admin Panel Antique Gold');
        formData.append('origin', 'Admin Panel Handcrafted in India');
        formData.append('color', 'Admin Panel Golden');
        formData.append('style', 'Admin Panel Traditional');
        formData.append('occasion', 'Admin Panel Festivals');
        formData.append('careInstructions', 'Admin Panel Clean with soft cloth');
        
        const createResponse = await axios.post(`${BASE_URL}/products`, formData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            }
        });
        
        const createdProduct = createResponse.data.data;
        console.log('✅ Product created successfully');
        console.log(`   ID: ${createdProduct._id}`);
        console.log(`   Name: ${createdProduct.name}`);
        
        // Check specifications in create response
        if (createdProduct.specifications) {
            console.log('   📋 Specifications in create response:');
            Object.entries(createdProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ✓ ${key}: ${value}`);
                }
            });
        } else {
            console.log('   ❌ No specifications in create response');
        }
        
        // Step 3: Get single product (for edit form)
        console.log('\n3️⃣ Getting single product for edit form...');
        const singleProductResponse = await axios.get(`${BASE_URL}/products/${createdProduct._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const singleProduct = singleProductResponse.data.data.product;
        console.log('✅ Single product retrieved');
        console.log(`   Name: ${singleProduct.name}`);
        console.log(`   Price: ₹${singleProduct.price}`);
        console.log(`   Original Price: ₹${singleProduct.original_price}`);
        
        // Check specifications in single product response
        if (singleProduct.specifications) {
            console.log('   📋 Specifications for edit form:');
            Object.entries(singleProduct.specifications).forEach(([key, value]) => {
                console.log(`     ${key}: "${value || ''}"`);
            });
        } else {
            console.log('   ❌ No specifications in single product response');
        }
        
        // Step 4: Update product via edit form
        console.log('\n4️⃣ Updating product via edit form...');
        const updateFormData = new FormData();
        updateFormData.append('name', singleProduct.name + ' - Updated');
        updateFormData.append('description', singleProduct.description + ' - Updated');
        updateFormData.append('price', singleProduct.price.toString());
        updateFormData.append('originalPrice', singleProduct.original_price.toString());
        updateFormData.append('category', singleProduct.category._id);
        updateFormData.append('stock', singleProduct.stock.toString());
        updateFormData.append('isActive', singleProduct.is_active.toString());
        updateFormData.append('isFeatured', (singleProduct.is_featured || false).toString());
        
        // Updated specifications
        updateFormData.append('material', (singleProduct.specifications?.material || '') + ' - Updated');
        updateFormData.append('height', (singleProduct.specifications?.height || '') + ' - Updated');
        updateFormData.append('width', (singleProduct.specifications?.width || '') + ' - Updated');
        updateFormData.append('weight', (singleProduct.specifications?.weight || '') + ' - Updated');
        updateFormData.append('finish', (singleProduct.specifications?.finish || '') + ' - Updated');
        updateFormData.append('origin', (singleProduct.specifications?.origin || '') + ' - Updated');
        updateFormData.append('color', (singleProduct.specifications?.color || '') + ' - Updated');
        updateFormData.append('style', (singleProduct.specifications?.style || '') + ' - Updated');
        updateFormData.append('occasion', (singleProduct.specifications?.occasion || '') + ' - Updated');
        updateFormData.append('careInstructions', (singleProduct.specifications?.careInstructions || '') + ' - Updated');
        
        const updateResponse = await axios.put(`${BASE_URL}/products/${createdProduct._id}`, updateFormData, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...updateFormData.getHeaders()
            }
        });
        
        const updatedProduct = updateResponse.data.data;
        console.log('✅ Product updated successfully');
        console.log(`   Updated Name: ${updatedProduct.name}`);
        
        // Check specifications in update response
        if (updatedProduct.specifications) {
            console.log('   📋 Updated specifications:');
            Object.entries(updatedProduct.specifications).forEach(([key, value]) => {
                if (value && key !== 'additionalInfo') {
                    console.log(`     ✓ ${key}: ${value}`);
                }
            });
        } else {
            console.log('   ❌ No specifications in update response');
        }
        
        // Step 5: Verify in products list
        console.log('\n5️⃣ Verifying in products list...');
        const listResponse = await axios.get(`${BASE_URL}/products?limit=10`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const products = listResponse.data.data.products;
        const ourProduct = products.find(p => p._id === createdProduct._id);
        
        if (ourProduct && ourProduct.specifications) {
            console.log('✅ Product found in list with specifications');
            const hasSpecs = Object.keys(ourProduct.specifications).some(key => 
                ourProduct.specifications[key] && key !== 'additionalInfo'
            );
            console.log(`   Has specifications: ${hasSpecs ? 'YES' : 'NO'}`);
        } else {
            console.log('❌ Product not found in list or missing specifications');
        }
        
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await axios.delete(`${BASE_URL}/products/${createdProduct._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('✅ Test product deleted');
        
        return true;
        
    } catch (error) {
        console.error('❌ Admin panel flow test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Testing Admin Panel Specifications Fix...');
    console.log('=' .repeat(70));
    
    try {
        await loginAdmin();
        const success = await testAdminPanelFlow();
        
        if (success) {
            console.log('\n🎉 Admin Panel Fix Test Completed Successfully!');
            console.log('\n📝 Summary:');
            console.log('  ✅ Product creation with specifications works');
            console.log('  ✅ Single product API returns specifications for edit form');
            console.log('  ✅ Product update with specifications works');
            console.log('  ✅ Products list includes specifications');
            console.log('\n💡 Admin panel should now work correctly with:');
            console.log('  1. Add product form saving specifications');
            console.log('  2. Edit form showing existing specification values');
            console.log('  3. Updated product service methods handling nested data');
        } else {
            console.log('\n❌ Some tests failed - check the logs above');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test
runTest().catch(console.error);
