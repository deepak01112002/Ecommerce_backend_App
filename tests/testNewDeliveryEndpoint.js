require('dotenv').config();

async function testNewDeliveryEndpoint() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🧪 Testing NEW Delivery Method Update Endpoint');
    console.log('==============================================');

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

    // Get an order to test with
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
    console.log(`✅ Found test order: ${testOrder.orderNumber || orderId}`);

    // Test updating delivery method with NEW endpoint
    console.log('\n🚚 Testing NEW delivery method update endpoint...');
    console.log(`Order ID: ${orderId}`);
    console.log(`New endpoint: PUT /api/admin-delivery/update-method/${orderId}`);
    
    const updateData = {
        deliveryMethod: 'delhivery',
        adminNotes: 'Test delivery method update from NEW endpoint'
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    try {
        const updateResponse = await fetch(`http://localhost:8080/api/admin-delivery/update-method/${orderId}`, {
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

        try {
            const updateResult = JSON.parse(responseText);
            console.log('Parsed response:', JSON.stringify(updateResult, null, 2));

            if (updateResponse.ok && updateResult.success) {
                console.log('🎉 SUCCESS! Delivery method update working!'.green);
                console.log(`✅ Message: ${updateResult.message}`);
                console.log(`✅ Order updated: ${updateResult.data.order.orderNumber}`);
                console.log(`✅ New delivery method: ${updateResult.data.order.shipping.deliveryMethod}`);
                console.log(`✅ Carrier: ${updateResult.data.order.shipping.carrier}`);
                console.log(`✅ Tracking: ${updateResult.data.order.shipping.trackingNumber || 'N/A'}`);
                
                // Test updating back to manual
                console.log('\n🔄 Testing update back to manual...');
                const manualResponse = await fetch(`http://localhost:8080/api/admin-delivery/update-method/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        deliveryMethod: 'manual',
                        adminNotes: 'Reverted to manual delivery'
                    })
                });

                const manualResult = await manualResponse.json();
                if (manualResponse.ok && manualResult.success) {
                    console.log('🎉 SUCCESS! Manual delivery update also working!');
                    console.log(`✅ Reverted to: ${manualResult.data.order.shipping.deliveryMethod}`);
                    console.log(`✅ Carrier: ${manualResult.data.order.shipping.carrier}`);
                } else {
                    console.log('⚠️ Manual update failed:', manualResult.message);
                }
            } else {
                console.log('❌ Delivery method update failed');
                console.log(`Error: ${updateResult.message || 'Unknown error'}`);
            }
        } catch (parseError) {
            console.log('❌ Failed to parse response JSON');
            console.log('Parse error:', parseError.message);
            console.log('Raw response:', responseText);
        }
    } catch (requestError) {
        console.log('❌ Request failed');
        console.log('Request error:', requestError.message);
    }

    console.log('\n==============================================');
}

testNewDeliveryEndpoint().catch(console.error);
