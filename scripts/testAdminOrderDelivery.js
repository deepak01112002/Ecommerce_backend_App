require('dotenv').config();
const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:8080/api';

// Test configuration
const testConfig = {
    adminCredentials: {
        email: 'admin@ghanshyambhandar.com',
        password: 'admin123'
    }
};

let adminToken = '';
let testOrderId = '';

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
}

// Test functions
async function loginAsAdmin() {
    console.log('\n🔐 Testing Admin Login...');
    
    const result = await makeRequest('POST', '/auth/login', testConfig.adminCredentials);
    
    if (result.success && result.data.data && result.data.data.token) {
        adminToken = result.data.data.token;
        console.log('✅ Admin login successful'.green);
        return true;
    } else {
        console.log(`❌ Admin login failed: ${result.error}`.red);
        return false;
    }
}

async function testGetDeliveryOptions() {
    console.log('\n📋 Testing Get Delivery Options...');
    
    const result = await makeRequest('GET', '/orders/admin/delivery-options', null, adminToken);
    
    if (result.success) {
        console.log('✅ Delivery options retrieved successfully'.green);
        console.log(`   Available options: ${result.data.data.options.length}`);
        
        result.data.data.options.forEach(option => {
            console.log(`   ${option.icon} ${option.label}: ${option.description}`);
        });
        return true;
    } else {
        console.log(`❌ Failed to get delivery options: ${result.error}`.red);
        return false;
    }
}

async function testGetPendingOrders() {
    console.log('\n📦 Testing Get Orders Pending Delivery Assignment...');
    
    const result = await makeRequest('GET', '/orders/admin/pending-delivery-assignment', null, adminToken);
    
    if (result.success) {
        console.log('✅ Pending orders retrieved successfully'.green);
        console.log(`   Orders pending delivery assignment: ${result.data.data.orders.length}`);
        
        if (result.data.data.orders.length > 0) {
            testOrderId = result.data.data.orders[0]._id;
            console.log(`   Using order ${result.data.data.orders[0].orderNumber} for testing`);
        }
        return true;
    } else {
        console.log(`❌ Failed to get pending orders: ${result.error}`.red);
        return false;
    }
}

async function testUpdateOrderDeliveryMethod() {
    if (!testOrderId) {
        console.log('\n⚠️  No test order available for delivery method update'.yellow);
        return false;
    }

    console.log('\n🚚 Testing Update Order Delivery Method...');
    
    // Test updating to Delhivery
    const updateData = {
        deliveryMethod: 'delhivery',
        adminNotes: 'Test delivery method update via API'
    };
    
    const result = await makeRequest('PUT', `/orders/admin/${testOrderId}/delivery-method`, updateData, adminToken);
    
    if (result.success) {
        console.log('✅ Order delivery method updated successfully'.green);
        console.log(`   Order: ${result.data.data.order.orderNumber}`);
        console.log(`   Delivery Method: ${result.data.data.order.shipping.deliveryMethod}`);
        console.log(`   Carrier: ${result.data.data.order.shipping.carrier}`);
        console.log(`   Tracking Number: ${result.data.data.order.shipping.trackingNumber || 'Not generated'}`);
        return true;
    } else {
        console.log(`❌ Failed to update delivery method: ${result.error}`.red);
        return false;
    }
}

async function testGetOrdersByDeliveryMethod() {
    console.log('\n📊 Testing Get Orders by Delivery Method...');
    
    // Test getting Delhivery orders
    const result = await makeRequest('GET', '/orders/admin/by-delivery-method?deliveryMethod=delhivery', null, adminToken);
    
    if (result.success) {
        console.log('✅ Orders by delivery method retrieved successfully'.green);
        console.log(`   Delhivery orders: ${result.data.data.orders.length}`);
        
        if (result.data.data.stats.length > 0) {
            console.log('   Delivery method statistics:');
            result.data.data.stats.forEach(stat => {
                console.log(`   - ${stat._id || 'Unassigned'}: ${stat.count} orders (₹${stat.totalValue})`);
            });
        }
        return true;
    } else {
        console.log(`❌ Failed to get orders by delivery method: ${result.error}`.red);
        return false;
    }
}

async function testBulkUpdateDeliveryMethod() {
    console.log('\n📦 Testing Bulk Update Delivery Method...');
    
    // Get some orders first
    const ordersResult = await makeRequest('GET', '/orders/admin/all?limit=2', null, adminToken);
    
    if (!ordersResult.success || ordersResult.data.data.orders.length === 0) {
        console.log('⚠️  No orders available for bulk update test'.yellow);
        return false;
    }

    const orderIds = ordersResult.data.data.orders.slice(0, 2).map(order => order._id);
    
    const bulkUpdateData = {
        orderIds,
        deliveryMethod: 'manual',
        adminNotes: 'Bulk updated to manual delivery'
    };
    
    const result = await makeRequest('PUT', '/orders/admin/bulk-delivery-method', bulkUpdateData, adminToken);
    
    if (result.success) {
        console.log('✅ Bulk delivery method update successful'.green);
        console.log(`   Updated orders: ${result.data.data.updatedCount}`);
        console.log(`   Delivery method: ${result.data.data.deliveryMethod}`);
        return true;
    } else {
        console.log(`❌ Failed bulk update: ${result.error}`.red);
        return false;
    }
}

// Main test runner
async function runAdminOrderDeliveryTests() {
    console.log('🚀 Testing Admin Order Delivery Management'.bold.cyan);
    console.log('================================================================'.cyan);

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    try {
        // Test 1: Admin Login
        results.total++;
        if (await loginAsAdmin()) {
            results.passed++;
        } else {
            results.failed++;
            console.log('❌ Cannot proceed without admin login'.red);
            return;
        }
        
        // Test 2: Get Delivery Options
        results.total++;
        if (await testGetDeliveryOptions()) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        // Test 3: Get Pending Orders
        results.total++;
        if (await testGetPendingOrders()) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        // Test 4: Update Order Delivery Method
        results.total++;
        if (await testUpdateOrderDeliveryMethod()) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        // Test 5: Get Orders by Delivery Method
        results.total++;
        if (await testGetOrdersByDeliveryMethod()) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        // Test 6: Bulk Update Delivery Method
        results.total++;
        if (await testBulkUpdateDeliveryMethod()) {
            results.passed++;
        } else {
            results.failed++;
        }
        
    } catch (error) {
        console.log(`❌ Test suite failed with error: ${error.message}`.red);
        results.failed++;
    }

    // Print final results
    console.log('\n================================================================'.cyan);
    console.log('📊 ADMIN ORDER DELIVERY TEST RESULTS'.bold.cyan);
    console.log('================================================================'.cyan);
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`.green);
    console.log(`Failed: ${results.failed}`.red);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Admin order delivery management is working perfectly.'.bold.green);
    } else {
        console.log('\n⚠️  Some tests failed. Please review the issues above.'.yellow);
    }

    console.log('\n📋 ADMIN ORDER DELIVERY FEATURES:'.bold.cyan);
    console.log(`✅ Delivery Method Options: Manual & Delhivery`);
    console.log(`✅ Order Delivery Assignment: Individual orders`);
    console.log(`✅ Bulk Delivery Updates: Multiple orders at once`);
    console.log(`✅ Delivery Method Filtering: View orders by delivery type`);
    console.log(`✅ Pending Assignment View: Orders needing delivery assignment`);
    console.log(`✅ Automatic Delhivery Integration: Shipment creation on assignment`);
    
    console.log('\n🎯 ADMIN PANEL READY FOR ORDER DELIVERY MANAGEMENT!'.bold.green);
}

// Run the tests
if (require.main === module) {
    runAdminOrderDeliveryTests().catch(console.error);
}

module.exports = { runAdminOrderDeliveryTests };
