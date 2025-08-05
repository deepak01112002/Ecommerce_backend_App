require('dotenv').config();
const colors = require('colors');

async function testDirectRoute() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🧪 DIRECT ROUTE TESTING'.bold.cyan);
    console.log('================================================================'.cyan);

    // First get admin token
    console.log('\n🔐 Getting admin token...'.yellow);
    
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
        console.log('❌ Failed to get admin token'.red);
        return;
    }

    const token = loginData.data.token;
    console.log('✅ Got admin token'.green);

    // Test the delivery options endpoint
    console.log('\n🎛️ Testing delivery options endpoint...'.yellow);
    
    try {
        const optionsResponse = await fetch('http://localhost:8080/api/admin-delivery/options', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response status:', optionsResponse.status);
        console.log('Response headers:', Object.fromEntries(optionsResponse.headers));
        
        const optionsText = await optionsResponse.text();
        console.log('Raw response:', optionsText);
        
        try {
            const optionsData = JSON.parse(optionsText);
            console.log('Parsed response:', JSON.stringify(optionsData, null, 2));
        } catch (parseError) {
            console.log('❌ Failed to parse JSON:', parseError.message);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    // Test the orders endpoint
    console.log('\n📦 Testing orders endpoint...'.yellow);
    
    try {
        const ordersResponse = await fetch('http://localhost:8080/api/admin-delivery/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response status:', ordersResponse.status);
        
        const ordersText = await ordersResponse.text();
        console.log('Raw response length:', ordersText.length);
        console.log('Raw response preview:', ordersText.substring(0, 200));
        
        try {
            const ordersData = JSON.parse(ordersText);
            console.log('Response structure:', Object.keys(ordersData));
            if (ordersData.message) {
                console.log('Error message:', ordersData.message);
            }
        } catch (parseError) {
            console.log('❌ Failed to parse JSON:', parseError.message);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('\n================================================================'.cyan);
}

testDirectRoute().catch(console.error);
