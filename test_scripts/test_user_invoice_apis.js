const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - replace with actual test user credentials
const TEST_USER = {
    email: 'testuser@example.com',
    password: 'password123'
};

let userToken = '';
let testOrderId = '';

async function loginUser() {
    try {
        console.log('🔐 Logging in test user...');
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        
        if (response.data.success) {
            userToken = response.data.data.token;
            console.log('✅ User login successful');
            return true;
        } else {
            console.log('❌ User login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ User login error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function getUserOrders() {
    try {
        console.log('\n📦 Getting user orders...');
        const response = await axios.get(`${BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.data.success && response.data.data.orders.length > 0) {
            testOrderId = response.data.data.orders[0]._id;
            console.log('✅ Found test order:', testOrderId);
            return true;
        } else {
            console.log('❌ No orders found for user');
            return false;
        }
    } catch (error) {
        console.log('❌ Error getting orders:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetUserInvoices() {
    try {
        console.log('\n🧾 Testing get user invoices...');
        const response = await axios.get(`${BASE_URL}/invoices/my-invoices?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Get user invoices successful');
            console.log(`   Found ${response.data.data.invoices.length} invoices`);
            if (response.data.data.invoices.length > 0) {
                console.log(`   First invoice: ${response.data.data.invoices[0].invoiceNumber}`);
            }
            return true;
        } else {
            console.log('❌ Get user invoices failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Get user invoices error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetInvoiceByOrder() {
    if (!testOrderId) {
        console.log('\n⚠️  Skipping invoice by order test - no test order ID');
        return false;
    }

    try {
        console.log('\n🧾 Testing get invoice by order...');
        const response = await axios.get(`${BASE_URL}/invoices/order/${testOrderId}`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ Get invoice by order successful');
            console.log(`   Invoice: ${response.data.data.invoice.invoiceNumber}`);
            console.log(`   Status: ${response.data.data.invoice.status}`);
            console.log(`   Amount: ₹${response.data.data.invoice.pricing.grandTotal}`);
            return true;
        } else {
            console.log('❌ Get invoice by order failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Get invoice by order error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testDownloadInvoiceByOrder() {
    if (!testOrderId) {
        console.log('\n⚠️  Skipping download invoice test - no test order ID');
        return false;
    }

    try {
        console.log('\n📄 Testing download invoice by order (A4 format)...');
        const response = await axios.get(`${BASE_URL}/invoices/order/${testOrderId}/download?format=A4`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
            responseType: 'arraybuffer'
        });
        
        if (response.status === 200 && response.headers['content-type'] === 'application/pdf') {
            console.log('✅ Download invoice A4 successful');
            console.log(`   PDF size: ${response.data.length} bytes`);
            return true;
        } else {
            console.log('❌ Download invoice A4 failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Download invoice A4 error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testDownloadInvoiceThermal() {
    if (!testOrderId) {
        console.log('\n⚠️  Skipping thermal download test - no test order ID');
        return false;
    }

    try {
        console.log('\n📄 Testing download invoice by order (Thermal format)...');
        const response = await axios.get(`${BASE_URL}/invoices/order/${testOrderId}/download?format=thermal`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
            responseType: 'arraybuffer'
        });
        
        if (response.status === 200 && response.headers['content-type'] === 'application/pdf') {
            console.log('✅ Download invoice thermal successful');
            console.log(`   PDF size: ${response.data.length} bytes`);
            return true;
        } else {
            console.log('❌ Download invoice thermal failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Download invoice thermal error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testOrderInvoiceDownload() {
    if (!testOrderId) {
        console.log('\n⚠️  Skipping order invoice download test - no test order ID');
        return false;
    }

    try {
        console.log('\n📄 Testing order invoice download endpoint...');
        const response = await axios.get(`${BASE_URL}/orders/${testOrderId}/invoice/download`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
            responseType: 'arraybuffer'
        });
        
        if (response.status === 200 && response.headers['content-type'] === 'application/pdf') {
            console.log('✅ Order invoice download successful');
            console.log(`   PDF size: ${response.data.length} bytes`);
            return true;
        } else {
            console.log('❌ Order invoice download failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Order invoice download error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testPublicInvoiceSettings() {
    try {
        console.log('\n⚙️  Testing public invoice settings...');
        const response = await axios.get(`${BASE_URL}/settings/public/invoice-settings`);
        
        if (response.data.success) {
            console.log('✅ Public invoice settings successful');
            console.log(`   Download enabled: ${response.data.data.invoiceSettings.downloadEnabled}`);
            console.log(`   Format: ${response.data.data.invoiceSettings.format}`);
            console.log(`   Company: ${response.data.data.invoiceSettings.companyDetails.name}`);
            return true;
        } else {
            console.log('❌ Public invoice settings failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Public invoice settings error:', error.response?.data?.message || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting User Invoice API Tests...\n');
    
    const results = {
        login: false,
        getOrders: false,
        getUserInvoices: false,
        getInvoiceByOrder: false,
        downloadInvoiceA4: false,
        downloadInvoiceThermal: false,
        orderInvoiceDownload: false,
        publicSettings: false
    };

    // Test public settings first (no auth required)
    results.publicSettings = await testPublicInvoiceSettings();

    // Login and get test data
    results.login = await loginUser();
    if (results.login) {
        results.getOrders = await getUserOrders();
    }

    // Run authenticated tests
    if (results.login) {
        results.getUserInvoices = await testGetUserInvoices();
        results.getInvoiceByOrder = await testGetInvoiceByOrder();
        results.downloadInvoiceA4 = await testDownloadInvoiceByOrder();
        results.downloadInvoiceThermal = await testDownloadInvoiceThermal();
        results.orderInvoiceDownload = await testOrderInvoiceDownload();
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! User invoice APIs are working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
    }
}

// Run the tests
runAllTests().catch(console.error);
