require('dotenv').config();

async function testCorrectRoute() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔍 TESTING CORRECT ROUTE');
    console.log('========================');

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

    // Get orders first
    console.log('\n📦 Getting orders...');
    const ordersResponse = await fetch('http://localhost:8080/api/orders/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const ordersData = await ordersResponse.json();
    if (!ordersData.success || !ordersData.data?.orders?.length) {
        console.log('❌ No orders found');
        return;
    }

    const testOrder = ordersData.data.orders[0];
    const orderId = testOrder._id;
    console.log(`✅ Found test order: ${testOrder.orderNumber}`);

    // Test the correct route
    console.log('\n🔄 Testing CORRECT route...');
    console.log(`Route: PUT /api/orders/admin/${orderId}/delivery-method`);
    
    try {
        const updateResponse = await fetch(`http://localhost:8080/api/orders/admin/${orderId}/delivery-method`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deliveryMethod: 'delhivery',
                adminNotes: 'Testing correct route'
            })
        });

        console.log(`Status: ${updateResponse.status} ${updateResponse.statusText}`);
        
        if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log('✅ SUCCESS! Route is working');
            console.log(`Message: ${result.message}`);
            
            if (result.data?.order?.shipping) {
                console.log(`Delivery method: ${result.data.order.shipping.deliveryMethod}`);
                console.log(`Carrier: ${result.data.order.shipping.carrier}`);
                console.log(`Tracking: ${result.data.order.shipping.trackingNumber || 'None'}`);
            }
        } else {
            const errorResult = await updateResponse.json();
            console.log('❌ FAILED');
            console.log(`Error: ${errorResult.message}`);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('\n========================');
}

testCorrectRoute().catch(console.error);
