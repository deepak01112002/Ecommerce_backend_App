require('dotenv').config();

async function testPendingOrders() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔍 TESTING PENDING ORDERS ENDPOINT');
    console.log('==================================');

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

    // Test pending orders endpoint
    console.log('\n📦 Testing pending orders endpoint...');
    console.log('URL: GET /api/admin-delivery/orders/pending');
    
    try {
        const response = await fetch('http://localhost:8080/api/admin-delivery/orders/pending', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS!');
            console.log(`Message: ${result.message}`);
            console.log(`Orders found: ${result.data?.orders?.length || 0}`);
            console.log(`Total: ${result.data?.pagination?.total || 0}`);
            
            if (result.data?.orders?.length > 0) {
                console.log('\n📋 Sample pending orders:');
                result.data.orders.slice(0, 3).forEach((order, index) => {
                    console.log(`   ${index + 1}. ${order.orderNumber} - ${order.status}`);
                    console.log(`      Delivery method: ${order.shipping?.deliveryMethod || 'Not assigned'}`);
                    console.log(`      Payment status: ${order.paymentInfo?.status || 'Unknown'}`);
                });
            }
        } else {
            const errorResult = await response.json();
            console.log('❌ FAILED');
            console.log(`Error: ${errorResult.message}`);
            console.log(`Details: ${JSON.stringify(errorResult, null, 2)}`);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    // Test all orders endpoint for comparison
    console.log('\n📊 Testing all orders endpoint for comparison...');
    try {
        const allOrdersResponse = await fetch('http://localhost:8080/api/orders/admin/all?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (allOrdersResponse.ok) {
            const allOrdersResult = await allOrdersResponse.json();
            console.log('✅ All orders endpoint working');
            console.log(`Total orders: ${allOrdersResult.data?.orders?.length || 0}`);
            
            if (allOrdersResult.data?.orders?.length > 0) {
                console.log('\n📋 Sample all orders:');
                allOrdersResult.data.orders.slice(0, 3).forEach((order, index) => {
                    console.log(`   ${index + 1}. ${order.orderNumber} - ${order.status}`);
                    console.log(`      Delivery method: ${order.shipping?.deliveryMethod || 'Not assigned'}`);
                    console.log(`      Payment status: ${order.paymentInfo?.status || 'Unknown'}`);
                });
            }
        } else {
            console.log('❌ All orders endpoint also failing');
        }
    } catch (error) {
        console.log('❌ All orders test failed:', error.message);
    }

    console.log('\n==================================');
    console.log('🎯 PENDING ORDERS TEST COMPLETE');
    console.log('==================================');
}

testPendingOrders().catch(console.error);
