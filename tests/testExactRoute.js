require('dotenv').config();

async function testExactRoute() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔍 TESTING EXACT ROUTE PATH');
    console.log('===========================');

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

    // Test different route variations
    const testOrderId = '676e7a314754fe189bacc8cb'; // Use a test ID
    
    const routeTests = [
        {
            name: 'Current Route',
            url: `http://localhost:8080/api/admin-delivery/update-method/${testOrderId}`,
            method: 'PUT'
        },
        {
            name: 'Test Base Route',
            url: 'http://localhost:8080/api/admin-delivery/options',
            method: 'GET'
        },
        {
            name: 'Test Route with Different Path',
            url: `http://localhost:8080/api/admin-delivery/orders/${testOrderId}/method`,
            method: 'PUT'
        }
    ];

    for (const test of routeTests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log(`   URL: ${test.url}`);
        console.log(`   Method: ${test.method}`);
        
        try {
            const options = {
                method: test.method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (test.method === 'PUT') {
                options.body = JSON.stringify({
                    deliveryMethod: 'delhivery',
                    adminNotes: 'Route test'
                });
            }

            const response = await fetch(test.url, options);
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 404) {
                console.log('   ❌ Route not found - check route registration');
            } else if (response.status === 401) {
                console.log('   ❌ Unauthorized - check authentication');
            } else if (response.status === 403) {
                console.log('   ❌ Forbidden - check admin middleware');
            } else if (response.status >= 200 && response.status < 300) {
                console.log('   ✅ Route accessible');
            } else {
                console.log(`   ⚠️ Unexpected status: ${response.status}`);
            }

            try {
                const responseText = await response.text();
                if (responseText) {
                    const result = JSON.parse(responseText);
                    console.log(`   Response: ${result.message || 'No message'}`);
                }
            } catch (parseError) {
                console.log('   Response: Could not parse JSON');
            }

        } catch (error) {
            console.log(`   ❌ Request failed: ${error.message}`);
        }
    }

    console.log('\n===========================');
    console.log('🎯 ROUTE TESTING COMPLETE');
    console.log('===========================');
}

testExactRoute().catch(console.error);
