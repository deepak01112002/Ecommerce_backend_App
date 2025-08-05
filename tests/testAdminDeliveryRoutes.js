require('dotenv').config();

async function testAdminDeliveryRoutes() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔍 TESTING ADMIN DELIVERY ROUTES');
    console.log('================================');

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

    // Test routes in order
    const routeTests = [
        {
            name: 'Test Route',
            url: 'http://localhost:8080/api/admin-delivery/test',
            method: 'GET'
        },
        {
            name: 'Options Route',
            url: 'http://localhost:8080/api/admin-delivery/options',
            method: 'GET'
        },
        {
            name: 'Pending Orders Route',
            url: 'http://localhost:8080/api/admin-delivery/orders/pending',
            method: 'GET'
        }
    ];

    for (const test of routeTests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log(`   URL: ${test.url}`);
        console.log(`   Method: ${test.method}`);
        
        try {
            const response = await fetch(test.url, {
                method: test.method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('   ✅ SUCCESS!');
                console.log(`   Message: ${result.message || 'No message'}`);
                
                if (result.data?.orders) {
                    console.log(`   Orders found: ${result.data.orders.length}`);
                }
            } else {
                const errorResult = await response.json();
                console.log('   ❌ FAILED');
                console.log(`   Error: ${errorResult.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Request failed: ${error.message}`);
        }
    }

    console.log('\n================================');
    console.log('🎯 ADMIN DELIVERY ROUTES TEST COMPLETE');
    console.log('================================');
}

testAdminDeliveryRoutes().catch(console.error);
