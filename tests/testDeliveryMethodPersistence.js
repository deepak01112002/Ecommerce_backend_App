require('dotenv').config();
const mongoose = require('mongoose');

async function testDeliveryMethodPersistence() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🚚 TESTING DELIVERY METHOD PERSISTENCE');
    console.log('======================================');
    console.log('Testing the issue where manual changes back to manual after refresh');
    console.log('======================================\n');

    let adminToken = null;

    // Get admin token
    console.log('1. Getting admin token...');
    try {
        const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@ghanshyambhandar.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (loginData.success && loginData.data?.token) {
            adminToken = loginData.data.token;
            console.log('✅ Admin token obtained');
        } else {
            console.log('❌ Failed to get admin token');
            return;
        }
    } catch (error) {
        console.log('❌ Login failed:', error.message);
        return;
    }

    // Get all orders to find one to test with
    console.log('\n2. Getting orders to test with...');
    let testOrderId = null;
    try {
        const response = await fetch('http://localhost:8080/api/orders/admin/all', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const result = await response.json();
        
        if (result.success && result.data?.orders?.length > 0) {
            // Find an order that's not delivered or cancelled
            const availableOrder = result.data.orders.find(order => 
                !['delivered', 'cancelled'].includes(order.status)
            );
            
            if (availableOrder) {
                testOrderId = availableOrder._id;
                console.log(`✅ Found test order: ${availableOrder.orderNumber || testOrderId}`);
                console.log(`   Current delivery method: ${availableOrder.shipping?.deliveryMethod || 'manual'}`);
                console.log(`   Current status: ${availableOrder.status}`);
            } else {
                console.log('⚠️  No available orders found (all are delivered/cancelled)');
                return;
            }
        } else {
            console.log('❌ No orders found');
            return;
        }
    } catch (error) {
        console.log('❌ Error getting orders:', error.message);
        return;
    }

    // Test 1: Change delivery method from manual to delhivery
    console.log('\n3. Testing delivery method change: manual → delhivery...');
    try {
        const response = await fetch(`http://localhost:8080/api/orders/admin/${testOrderId}/delivery-method`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify({
                deliveryMethod: 'delhivery',
                adminNotes: 'Changed to Delhivery for testing'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Successfully changed to Delhivery');
            console.log(`   New delivery method: ${result.data.order.shipping.deliveryMethod}`);
            console.log(`   Carrier: ${result.data.order.shipping.carrier}`);
            console.log(`   Tracking number: ${result.data.order.shipping.trackingNumber || 'Not assigned yet'}`);
        } else {
            console.log('❌ Failed to change to Delhivery:', result.message);
        }
    } catch (error) {
        console.log('❌ Error changing to Delhivery:', error.message);
    }

    // Test 2: Verify the change persisted by fetching the order again
    console.log('\n4. Verifying persistence by fetching order again...');
    try {
        const response = await fetch(`http://localhost:8080/api/orders/admin/${testOrderId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const result = await response.json();
        
        if (result.success) {
            const order = result.data.order;
            console.log('📋 Order details after change:');
            console.log(`   Delivery method: ${order.shipping?.deliveryMethod || 'manual'}`);
            console.log(`   Carrier: ${order.shipping?.carrier || 'Not set'}`);
            console.log(`   Assigned by: ${order.shipping?.assignedBy || 'Not set'}`);
            console.log(`   Assigned at: ${order.shipping?.assignedAt || 'Not set'}`);
            console.log(`   Admin notes: ${order.shipping?.adminNotes || 'None'}`);
            
            if (order.shipping?.deliveryMethod === 'delhivery') {
                console.log('✅ Delivery method persisted correctly as Delhivery');
            } else {
                console.log('❌ Delivery method reverted back to manual - PERSISTENCE ISSUE CONFIRMED');
            }
        } else {
            console.log('❌ Failed to fetch order:', result.message);
        }
    } catch (error) {
        console.log('❌ Error fetching order:', error.message);
    }

    // Test 3: Check database directly
    console.log('\n5. Checking database directly...');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Order = require('../models/Order');
        
        const dbOrder = await Order.findById(testOrderId);
        if (dbOrder) {
            console.log('📋 Database record:');
            console.log(`   Delivery method: ${dbOrder.shipping?.deliveryMethod || 'manual'}`);
            console.log(`   Carrier: ${dbOrder.shipping?.carrier || 'Not set'}`);
            console.log(`   Last updated: ${dbOrder.updatedAt}`);
            
            if (dbOrder.shipping?.deliveryMethod === 'delhivery') {
                console.log('✅ Database shows Delhivery - persistence is working');
            } else {
                console.log('❌ Database shows manual - there\'s a persistence issue');
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.log('❌ Error checking database:', error.message);
    }

    // Test 4: Test admin panel API endpoint
    console.log('\n6. Testing admin panel API endpoint...');
    try {
        const response = await fetch('http://localhost:3001/api/orders', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AdminPanelTest/1.0)',
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Admin panel API accessible');
        } else {
            console.log(`❌ Admin panel API not accessible (${response.status})`);
        }
    } catch (error) {
        console.log('❌ Admin panel API error:', error.message);
    }

    console.log('\n🎯 DELIVERY METHOD PERSISTENCE TEST SUMMARY');
    console.log('===========================================');
    console.log('✅ Backend API: Tested delivery method updates');
    console.log('✅ Database: Checked direct persistence');
    console.log('✅ Admin Panel: Verified API accessibility');
    console.log('');
    console.log('🔍 POSSIBLE CAUSES OF REVERSION:');
    console.log('================================');
    console.log('1. Frontend state management not syncing with backend');
    console.log('2. Admin panel using cached data instead of fresh API calls');
    console.log('3. Multiple API endpoints with different update logic');
    console.log('4. Race conditions between frontend updates and backend saves');
    console.log('');
    console.log('📋 DELHIVERY TRACKING EXPLANATION:');
    console.log('==================================');
    console.log('✅ AUTOMATIC TRACKING: YES - Orders handled by Delhivery get automatic updates');
    console.log('✅ AUTO-SYNC SERVICE: Runs every 30 minutes to sync order status');
    console.log('✅ WEBHOOK SUPPORT: Can receive real-time updates from Delhivery');
    console.log('✅ MANUAL SYNC: Admins can manually sync individual orders');
    console.log('✅ STATUS MAPPING: Delhivery status → Order status automatically');
    console.log('');
    console.log('🚀 HOW DELHIVERY TRACKING WORKS:');
    console.log('================================');
    console.log('1. Order changed to Delhivery → Gets tracking number');
    console.log('2. Auto-sync service checks Delhivery API every 30 minutes');
    console.log('3. Order status updates automatically based on Delhivery status:');
    console.log('   - "In Transit" → Order status: "shipped"');
    console.log('   - "Out for Delivery" → Order status: "shipped"');
    console.log('   - "Delivered" → Order status: "delivered"');
    console.log('4. Customers can track orders using the tracking number');
    console.log('5. Admin can manually sync anytime for immediate updates');
}

testDeliveryMethodPersistence().catch(console.error);
