// Test script to verify dashboard recent orders API
const axios = require('axios');

async function testDashboardRecentOrders() {
    try {
        console.log('🔍 Testing Dashboard Recent Orders API...\n');

        // Login as admin
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@ghanshyambhandar.com',
            password: 'admin123'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Admin login successful');

        // Get dashboard data
        const dashboardResponse = await axios.get('http://localhost:8080/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const recentOrders = dashboardResponse.data.data.dashboard.recentOrders;
        console.log(`✅ Found ${recentOrders.length} recent orders\n`);

        // Display recent orders with user data
        recentOrders.slice(0, 3).forEach((order, index) => {
            console.log(`📋 Order ${index + 1}:`);
            console.log(`   - Order Number: ${order.orderNumber}`);
            console.log(`   - User Name: "${order.user?.name || 'No name'}" ${order.user?.name ? '✅' : '❌'}`);
            console.log(`   - User Email: ${order.user?.email || 'No email'}`);
            console.log(`   - Total: ₹${order.total}`);
            console.log(`   - Status: ${order.status}`);
            console.log('');
        });

        // Check for "undefined undefined" issue
        const hasUndefinedNames = recentOrders.some(order => 
            order.user?.name === 'undefined undefined' || 
            order.user?.name?.includes('undefined')
        );

        if (hasUndefinedNames) {
            console.log('❌ ISSUE FOUND: Some orders still have "undefined undefined" names');
        } else {
            console.log('🎉 SUCCESS: No "undefined undefined" names found!');
        }

        console.log('\n✅ Dashboard Recent Orders API test completed');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testDashboardRecentOrders();
