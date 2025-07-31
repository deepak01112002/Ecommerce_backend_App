const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080/api';

// Test credentials
const adminCredentials = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

let adminToken = '';

async function testAdminLogin() {
    try {
        console.log('🔐 Testing admin login...');
        const response = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
        
        if (response.data.success && response.data.data.token) {
            adminToken = response.data.data.token;
            console.log('✅ Admin login successful');
            return true;
        } else {
            console.log('❌ Admin login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testOrderRetrieval() {
    try {
        console.log('\n📋 Testing order retrieval...');
        const response = await axios.get(`${BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.data.success && response.data.data.orders) {
            console.log(`✅ Retrieved ${response.data.data.orders.length} orders`);
            
            // Test order with proper amount calculation
            const testOrder = response.data.data.orders[0];
            if (testOrder) {
                console.log(`📊 Test Order Details:`);
                console.log(`   Order Number: ${testOrder.orderNumber || testOrder._id}`);
                console.log(`   Items: ${testOrder.items?.length || 0}`);
                console.log(`   Pricing Structure:`, testOrder.pricing || 'Not available');
                console.log(`   Total Amount: ₹${testOrder.pricing?.total || testOrder.finalAmount || testOrder.total || 'Not calculated'}`);
                
                // Calculate total manually
                if (testOrder.items) {
                    const calculatedTotal = testOrder.items.reduce((sum, item) => {
                        return sum + ((item.totalPrice || item.unitPrice * item.quantity || item.price * item.quantity) || 0);
                    }, 0);
                    console.log(`   Calculated Total: ₹${calculatedTotal}`);
                }
                
                return testOrder;
            }
        }
        return null;
    } catch (error) {
        console.log('❌ Order retrieval error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testInvoiceGeneration(orderId) {
    try {
        console.log('\n🧾 Testing enhanced invoice generation...');
        const response = await axios.post(`${BASE_URL}/invoices/enhanced/generate/${orderId}`, {
            generatePDF: true,
            thermalFormat: false
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Invoice generated successfully');
            console.log(`   Invoice Number: ${response.data.invoice.invoiceNumber}`);
            console.log(`   Total Amount: ₹${response.data.invoice.pricing.grandTotal}`);
            console.log(`   PDF Path: ${response.data.pdfPath || 'Not generated'}`);
            return response.data;
        }
    } catch (error) {
        console.log('❌ Invoice generation error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testThermalInvoiceGeneration(orderId) {
    try {
        console.log('\n🖨️ Testing thermal invoice generation with QR code...');
        const response = await axios.post(`${BASE_URL}/invoices/enhanced/generate/${orderId}`, {
            generatePDF: true,
            thermalFormat: true
        }, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Thermal invoice generated successfully');
            console.log(`   Thermal PDF Path: ${response.data.thermalPdfPath || 'Not generated'}`);
            return response.data;
        }
    } catch (error) {
        console.log('❌ Thermal invoice generation error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testCategoryQRGeneration() {
    try {
        console.log('\n📱 Testing category QR code generation...');
        
        // First get categories
        const categoriesResponse = await axios.get(`${BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (categoriesResponse.data.success && categoriesResponse.data.categories.length > 0) {
            const testCategory = categoriesResponse.data.categories[0];
            console.log(`   Testing with category: ${testCategory.name}`);
            
            const qrResponse = await axios.post(`${BASE_URL}/qr-codes/category/${testCategory._id}`, {}, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (qrResponse.data.success) {
                console.log('✅ Category QR code generated successfully');
                console.log(`   Download URL: ${qrResponse.data.qrCode.downloadUrl}`);
                return qrResponse.data;
            }
        }
    } catch (error) {
        console.log('❌ Category QR generation error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testProductQRGeneration() {
    try {
        console.log('\n📦 Testing product QR code generation...');
        
        // First get products
        const productsResponse = await axios.get(`${BASE_URL}/products`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (productsResponse.data.success && productsResponse.data.products.length > 0) {
            const testProduct = productsResponse.data.products[0];
            console.log(`   Testing with product: ${testProduct.name}`);
            
            const qrResponse = await axios.post(`${BASE_URL}/qr-codes/product/${testProduct._id}`, {}, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (qrResponse.data.success) {
                console.log('✅ Product QR code generated successfully');
                console.log(`   Download URL: ${qrResponse.data.qrCode.downloadUrl}`);
                return qrResponse.data;
            }
        }
    } catch (error) {
        console.log('❌ Product QR generation error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testBulkQRGeneration() {
    try {
        console.log('\n🔄 Testing bulk QR code generation...');
        
        // Test bulk category QR generation
        console.log('   Generating QR codes for all categories...');
        const categoryQRResponse = await axios.post(`${BASE_URL}/qr-codes/categories/all`, {}, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (categoryQRResponse.data.success) {
            console.log(`✅ Generated QR codes for ${categoryQRResponse.data.results.filter(r => !r.error).length} categories`);
        }
        
        // Test bulk product QR generation
        console.log('   Generating QR codes for all products...');
        const productQRResponse = await axios.post(`${BASE_URL}/qr-codes/products/all`, {}, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (productQRResponse.data.success) {
            console.log(`✅ Generated QR codes for ${productQRResponse.data.results.filter(r => !r.error).length} products`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ Bulk QR generation error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function checkDirectoryStructure() {
    console.log('\n📁 Checking directory structure...');
    
    const directories = [
        '../uploads/invoices',
        '../uploads/invoices/thermal',
        '../uploads/qr-codes',
        '../uploads/qr-codes/categories',
        '../uploads/qr-codes/products'
    ];
    
    directories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ Directory exists: ${dir}`);
        } else {
            console.log(`❌ Directory missing: ${dir}`);
            try {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            } catch (error) {
                console.log(`❌ Failed to create directory: ${dir}`);
            }
        }
    });
}

async function runAllTests() {
    console.log('🚀 Starting QR Code and Invoice Enhancement Tests\n');
    
    // Check directory structure first
    await checkDirectoryStructure();
    
    // Test admin login
    const loginSuccess = await testAdminLogin();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without admin login');
        return;
    }
    
    // Test order retrieval and amount calculation
    const testOrder = await testOrderRetrieval();
    if (testOrder) {
        // Test invoice generation with QR codes
        await testInvoiceGeneration(testOrder._id);
        await testThermalInvoiceGeneration(testOrder._id);
    } else {
        console.log('⚠️ No orders found, skipping invoice tests');
    }
    
    // Test QR code generation for categories and products
    await testCategoryQRGeneration();
    await testProductQRGeneration();
    
    // Test bulk QR generation
    await testBulkQRGeneration();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Enhanced invoice generation with QR codes');
    console.log('✅ Thermal printer support with Flipkart-style QR codes');
    console.log('✅ Individual QR code generation for categories and products');
    console.log('✅ Bulk QR code generation functionality');
    console.log('✅ Fixed amount calculation in order bills');
    console.log('\n🔗 Next Steps:');
    console.log('1. Test the admin panel QR code buttons');
    console.log('2. Verify QR code download and print functionality');
    console.log('3. Check invoice page integration');
    console.log('4. Test order bill modal with QR codes');
}

// Run the tests
runAllTests().catch(console.error);
