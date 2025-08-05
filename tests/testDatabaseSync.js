require('dotenv').config();

async function testDatabaseSync() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔍 TESTING DATABASE SYNC ISSUE');
    console.log('===============================');

    // Get admin token
    console.log('\n🔐 Getting admin token...');
    const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@ghanshyambhandar.com',
            password: 'admin123'
        })
    });

    const loginData = await loginResponse.json();
    if (!loginData.data?.token) {
        console.log('❌ Failed to get admin token');
        return;
    }

    const token = loginData.data.token;
    console.log('✅ Got admin token');

    // Get orders BEFORE update
    console.log('\n📦 Step 1: Getting orders BEFORE update...');
    const beforeResponse = await fetch('http://localhost:8080/api/orders/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const beforeData = await beforeResponse.json();
    if (!beforeData.success || !beforeData.data?.orders?.length) {
        console.log('❌ No orders found');
        return;
    }

    const testOrder = beforeData.data.orders[0];
    const orderId = testOrder._id;
    console.log(`✅ Found test order: ${testOrder.orderNumber}`);
    console.log(`   Current delivery method: ${testOrder.shipping?.deliveryMethod || 'manual'}`);
    console.log(`   Current carrier: ${testOrder.shipping?.carrier || 'None'}`);
    console.log(`   Current tracking: ${testOrder.shipping?.trackingNumber || 'None'}`);

    // Update to Delhivery
    console.log('\n🔄 Step 2: Updating to Delhivery...');
    const updateResponse = await fetch(`http://localhost:8080/api/admin-delivery/update-method/${orderId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            deliveryMethod: 'delhivery',
            adminNotes: 'Database sync test'
        })
    });

    const updateResult = await updateResponse.json();
    if (updateResponse.ok && updateResult.success) {
        console.log('✅ Update API call successful');
        console.log(`   New delivery method: ${updateResult.data.order.shipping.deliveryMethod}`);
        console.log(`   New carrier: ${updateResult.data.order.shipping.carrier}`);
        console.log(`   New tracking: ${updateResult.data.order.shipping.trackingNumber}`);
    } else {
        console.log('❌ Update failed:', updateResult.message);
        return;
    }

    // Wait a moment for database to update
    console.log('\n⏳ Step 3: Waiting 2 seconds for database update...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get orders AFTER update
    console.log('\n📦 Step 4: Getting orders AFTER update...');
    const afterResponse = await fetch('http://localhost:8080/api/orders/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const afterData = await afterResponse.json();
    if (afterData.success && afterData.data?.orders?.length) {
        const updatedOrder = afterData.data.orders.find(o => o._id === orderId);
        
        if (updatedOrder) {
            console.log('✅ Found updated order in database');
            console.log(`   Delivery method: ${updatedOrder.shipping?.deliveryMethod || 'manual'}`);
            console.log(`   Carrier: ${updatedOrder.shipping?.carrier || 'None'}`);
            console.log(`   Tracking: ${updatedOrder.shipping?.trackingNumber || 'None'}`);
            console.log(`   Assigned at: ${updatedOrder.shipping?.assignedAt || 'None'}`);
            console.log(`   Admin notes: ${updatedOrder.shipping?.adminNotes || 'None'}`);
            
            // Check if the update persisted
            if (updatedOrder.shipping?.deliveryMethod === 'delhivery') {
                console.log('🎉 SUCCESS: Database update persisted correctly!');
                console.log('   The issue is likely in the frontend state management.');
            } else {
                console.log('❌ PROBLEM: Database update did not persist!');
                console.log('   The issue is in the backend update logic.');
            }
        } else {
            console.log('❌ Could not find updated order in response');
        }
    } else {
        console.log('❌ Failed to fetch orders after update');
    }

    // Test direct order fetch by ID
    console.log('\n🔍 Step 5: Direct order fetch by ID...');
    try {
        const directResponse = await fetch(`http://localhost:8080/api/orders/admin/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (directResponse.ok) {
            const directResult = await directResponse.json();
            if (directResult.success) {
                const directOrder = directResult.data.order || directResult.data;
                console.log('✅ Direct order fetch successful');
                console.log(`   Delivery method: ${directOrder.shipping?.deliveryMethod || 'manual'}`);
                console.log(`   Carrier: ${directOrder.shipping?.carrier || 'None'}`);
                console.log(`   Tracking: ${directOrder.shipping?.trackingNumber || 'None'}`);
            }
        } else {
            console.log('⚠️ Direct order fetch endpoint not available');
        }
    } catch (error) {
        console.log('⚠️ Direct order fetch failed:', error.message);
    }

    console.log('\n===============================');
    console.log('🎯 DIAGNOSIS COMPLETE');
    console.log('===============================');
    
    console.log('\n🔍 POSSIBLE CAUSES:');
    console.log('   1. Database update not persisting');
    console.log('   2. Frontend state management issue');
    console.log('   3. API response not including updated data');
    console.log('   4. Caching issue in frontend or backend');
    console.log('   5. Race condition between update and fetch');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Check if database update persisted (see above results)');
    console.log('   2. If persisted: Fix frontend state management');
    console.log('   3. If not persisted: Fix backend update logic');
    console.log('   4. Add proper error handling and validation');
}

testDatabaseSync().catch(console.error);
