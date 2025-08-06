const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ORDER_ID = '687aa24989da58ed91a0b6d7';

// Test user credentials - update these with actual credentials
const TEST_USER = {
    email: 'testuser@example.com', // Update with actual user email
    password: 'password123'        // Update with actual password
};

let userToken = '';

async function loginUser() {
    try {
        console.log('🔐 Logging in user...');
        console.log(`   Email: ${TEST_USER.email}`);
        
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        
        if (response.data.success) {
            userToken = response.data.data.token;
            console.log('✅ Login successful');
            console.log(`   Token: ${userToken.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ Login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
        console.log('💡 Please update TEST_USER credentials in the script');
        return false;
    }
}

async function checkOrderExists() {
    try {
        console.log('\n📦 Checking if order exists and belongs to user...');
        console.log(`   Order ID: ${ORDER_ID}`);
        
        const response = await axios.get(`${BASE_URL}/orders/${ORDER_ID}`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Order found');
            console.log(`   Order Number: ${response.data.data.order.orderNumber}`);
            console.log(`   Status: ${response.data.data.order.status}`);
            console.log(`   Total: ₹${response.data.data.order.pricing?.grandTotal || 'N/A'}`);
            return true;
        } else {
            console.log('❌ Order not found:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Order check error:', error.response?.data?.message || error.message);
        if (error.response?.status === 404) {
            console.log('💡 Order not found or doesn\'t belong to this user');
        }
        return false;
    }
}

async function checkInvoiceExists() {
    try {
        console.log('\n🧾 Checking if invoice exists for this order...');
        
        const response = await axios.get(`${BASE_URL}/invoices/order/${ORDER_ID}`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Invoice found');
            console.log(`   Invoice Number: ${response.data.data.invoice.invoiceNumber}`);
            console.log(`   Status: ${response.data.data.invoice.status}`);
            console.log(`   Amount: ₹${response.data.data.invoice.pricing.grandTotal}`);
            return true;
        } else {
            console.log('❌ Invoice not found:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Invoice check error:', error.response?.data?.message || error.message);
        if (error.response?.status === 404) {
            console.log('💡 Invoice not found for this order');
        }
        return false;
    }
}

async function testInvoiceDownload(format = 'A4') {
    try {
        console.log(`\n📄 Testing invoice download (${format} format)...`);
        console.log(`   URL: ${BASE_URL}/invoices/order/${ORDER_ID}/download?format=${format}`);
        
        const response = await axios.get(`${BASE_URL}/invoices/order/${ORDER_ID}/download?format=${format}`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
        });
        
        if (response.status === 200) {
            console.log('✅ Download successful');
            console.log(`   Content-Type: ${response.headers['content-type']}`);
            console.log(`   Content-Length: ${response.data.length} bytes`);
            console.log(`   Content-Disposition: ${response.headers['content-disposition']}`);
            
            // Save file for verification
            const filename = `test_invoice_${ORDER_ID}_${format}.pdf`;
            const filepath = path.join(__dirname, filename);
            fs.writeFileSync(filepath, response.data);
            console.log(`   File saved: ${filepath}`);
            
            return true;
        } else {
            console.log('❌ Download failed with status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Download error:', error.response?.data?.message || error.message);
        
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Headers:`, error.response.headers);
            
            // Try to parse error response
            try {
                const errorText = Buffer.from(error.response.data).toString();
                const errorJson = JSON.parse(errorText);
                console.log(`   Error details: ${errorJson.message}`);
            } catch (parseError) {
                console.log(`   Raw error: ${Buffer.from(error.response.data).toString().substring(0, 200)}...`);
            }
        }
        
        return false;
    }
}

async function checkSystemSettings() {
    try {
        console.log('\n⚙️  Checking system settings...');
        
        const response = await axios.get(`${BASE_URL}/settings/public/invoice-settings`);
        
        if (response.data.success) {
            const settings = response.data.data.invoiceSettings;
            console.log('✅ System settings retrieved');
            console.log(`   Download enabled: ${settings.downloadEnabled}`);
            console.log(`   Format: ${settings.format}`);
            console.log(`   Include GST: ${settings.includeGST}`);
            console.log(`   Company: ${settings.companyDetails.name}`);
            
            if (!settings.downloadEnabled) {
                console.log('⚠️  WARNING: Invoice downloads are disabled in system settings');
                return false;
            }
            return true;
        } else {
            console.log('❌ Failed to get system settings:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ System settings error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Testing Invoice Download API');
    console.log('================================');
    console.log(`Target URL: ${BASE_URL}/invoices/order/${ORDER_ID}/download`);
    console.log('');
    
    // Step 1: Check system settings
    const settingsOk = await checkSystemSettings();
    
    // Step 2: Login
    const loginSuccess = await loginUser();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without login. Please update credentials in the script.');
        return;
    }
    
    // Step 3: Check if order exists
    const orderExists = await checkOrderExists();
    if (!orderExists) {
        console.log('\n❌ Cannot proceed without valid order.');
        return;
    }
    
    // Step 4: Check if invoice exists
    const invoiceExists = await checkInvoiceExists();
    if (!invoiceExists) {
        console.log('\n❌ Cannot proceed without invoice.');
        return;
    }
    
    // Step 5: Test downloads
    console.log('\n🎯 All prerequisites met. Testing downloads...');
    
    const a4Success = await testInvoiceDownload('A4');
    const thermalSuccess = await testInvoiceDownload('thermal');
    
    // Summary
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`✅ System Settings: ${settingsOk ? 'OK' : 'FAILED'}`);
    console.log(`✅ User Login: ${loginSuccess ? 'OK' : 'FAILED'}`);
    console.log(`✅ Order Access: ${orderExists ? 'OK' : 'FAILED'}`);
    console.log(`✅ Invoice Exists: ${invoiceExists ? 'OK' : 'FAILED'}`);
    console.log(`✅ A4 Download: ${a4Success ? 'OK' : 'FAILED'}`);
    console.log(`✅ Thermal Download: ${thermalSuccess ? 'OK' : 'FAILED'}`);
    
    if (a4Success && thermalSuccess) {
        console.log('\n🎉 SUCCESS: Invoice download API is working correctly!');
        console.log('📁 Check the test_scripts folder for downloaded PDF files.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the error messages above.');
    }
}

// Instructions for manual testing
console.log('📋 MANUAL TESTING INSTRUCTIONS:');
console.log('================================');
console.log('1. Update TEST_USER credentials in this script');
console.log('2. Make sure the server is running on localhost:8080');
console.log('3. Ensure the order ID belongs to the test user');
console.log('4. Run: node test_specific_invoice_download.js');
console.log('');

// Run the test
runTest().catch(console.error);
