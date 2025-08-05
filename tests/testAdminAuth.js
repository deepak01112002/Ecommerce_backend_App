require('dotenv').config();

async function testAdminAuth() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🧪 Testing Admin Authentication & Middleware');
    console.log('===========================================');

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

    // Test delivery options endpoint (should work)
    console.log('\n🎛️ Testing delivery options endpoint...');
    const optionsResponse = await fetch('http://localhost:8080/api/admin-delivery/options', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Options response status: ${optionsResponse.status}`);
    const optionsData = await optionsResponse.json();
    console.log('Options response:', JSON.stringify(optionsData, null, 2));

    if (optionsResponse.ok) {
        console.log('✅ Delivery options endpoint working');
    } else {
        console.log('❌ Delivery options endpoint failed');
    }

    // Test a simple admin endpoint
    console.log('\n📊 Testing admin dashboard endpoint...');
    const dashboardResponse = await fetch('http://localhost:8080/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Dashboard response status: ${dashboardResponse.status}`);
    if (dashboardResponse.ok) {
        console.log('✅ Admin dashboard endpoint working');
    } else {
        const dashboardData = await dashboardResponse.json();
        console.log('❌ Admin dashboard endpoint failed');
        console.log('Dashboard response:', JSON.stringify(dashboardData, null, 2));
    }

    // Test orders endpoint
    console.log('\n📦 Testing orders endpoint...');
    const ordersResponse = await fetch('http://localhost:8080/api/orders/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Orders response status: ${ordersResponse.status}`);
    if (ordersResponse.ok) {
        console.log('✅ Orders endpoint working');
    } else {
        const ordersData = await ordersResponse.json();
        console.log('❌ Orders endpoint failed');
        console.log('Orders response:', JSON.stringify(ordersData, null, 2));
    }

    console.log('\n===========================================');
}

testAdminAuth().catch(console.error);
