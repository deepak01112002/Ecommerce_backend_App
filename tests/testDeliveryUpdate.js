require('dotenv').config();

async function testDeliveryUpdate() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🧪 Testing Delivery Method Update API');
    console.log('=====================================');

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
        console.log('Response:', loginData);
        return;
    }

    const token = loginData.data.token;
    console.log('✅ Got admin token');

    // Get an order to test with
    console.log('\n📦 Getting orders...');
    const ordersResponse = await fetch('http://localhost:8080/api/orders/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const ordersData = await ordersResponse.json();
    if (!ordersData.success || !ordersData.data?.orders?.length) {
        console.log('❌ No orders found');
        console.log('Response:', ordersData);
        return;
    }

    const testOrder = ordersData.data.orders[0];
    const orderId = testOrder._id;
    console.log(`✅ Found test order: ${testOrder.orderNumber || orderId}`);

    // Test updating delivery method
    console.log('\n🚚 Testing delivery method update...');
    console.log(`Order ID: ${orderId}`);
    
    const updateData = {
        deliveryMethod: 'delhivery',
        adminNotes: 'Test delivery method update from API test'
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    try {
        const updateResponse = await fetch(`http://localhost:8080/api/admin-delivery/orders/${orderId}/method`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        console.log(`Response status: ${updateResponse.status}`);
        console.log(`Response OK: ${updateResponse.ok}`);

        const responseText = await updateResponse.text();
        console.log(`Response length: ${responseText.length}`);
        console.log('Raw response:', responseText);

        try {
            const updateResult = JSON.parse(responseText);
            console.log('Parsed response:', JSON.stringify(updateResult, null, 2));

            if (updateResponse.ok && updateResult.success) {
                console.log('✅ Delivery method update successful!');
                console.log(`Message: ${updateResult.message}`);
            } else {
                console.log('❌ Delivery method update failed');
                console.log(`Error: ${updateResult.message || 'Unknown error'}`);
                console.log(`Errors: ${JSON.stringify(updateResult.errors || [])}`);
            }
        } catch (parseError) {
            console.log('❌ Failed to parse response JSON');
            console.log('Parse error:', parseError.message);
        }
    } catch (requestError) {
        console.log('❌ Request failed');
        console.log('Request error:', requestError.message);
    }

    console.log('\n=====================================');
}

testDeliveryUpdate().catch(console.error);
