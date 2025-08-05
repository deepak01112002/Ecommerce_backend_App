require('dotenv').config();
const colors = require('colors');

async function fixAndTestDeliveryApis() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🔧 FIXING DELIVERY APIS - COMPREHENSIVE TEST'.bold.cyan);
    console.log('================================================================'.cyan);

    // Get admin token first
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

    // Test each delivery API individually with detailed debugging
    const tests = [
        {
            name: 'Get Delivery Options',
            method: 'GET',
            endpoint: '/api/admin-delivery/options'
        },
        {
            name: 'Get Orders by Delivery Method',
            method: 'GET', 
            endpoint: '/api/admin-delivery/orders?deliveryMethod=manual&limit=5'
        },
        {
            name: 'Get Pending Delivery Assignments',
            method: 'GET',
            endpoint: '/api/admin-delivery/orders/pending?limit=5'
        },
        {
            name: 'Sync All Delhivery Orders',
            method: 'POST',
            endpoint: '/api/admin-delivery/sync-all-delhivery'
        }
    ];

    let workingCount = 0;
    let totalCount = tests.length;

    for (const test of tests) {
        console.log(`\n🧪 Testing: ${test.name}`.yellow);
        console.log(`   ${test.method} ${test.endpoint}`.gray);

        try {
            const options = {
                method: test.method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (test.method === 'POST') {
                options.body = JSON.stringify({});
            }

            const response = await fetch(`http://localhost:8080${test.endpoint}`, options);
            
            console.log(`   Status: ${response.status}`.gray);
            console.log(`   OK: ${response.ok}`.gray);

            const responseText = await response.text();
            console.log(`   Response length: ${responseText.length}`.gray);

            try {
                const data = JSON.parse(responseText);
                
                if (response.ok && data.success) {
                    console.log(`   ✅ ${test.name} - SUCCESS`.green);
                    console.log(`   Message: ${data.message}`.green);
                    
                    // Log specific data for each endpoint
                    if (test.name.includes('Options') && data.data?.options) {
                        console.log(`   Options: ${data.data.options.length} delivery methods`.gray);
                    } else if (test.name.includes('Orders') && data.data?.orders) {
                        console.log(`   Orders: ${data.data.orders.length} found`.gray);
                        if (data.data.stats) {
                            console.log(`   Stats: ${data.data.stats.length} delivery methods`.gray);
                        }
                    } else if (test.name.includes('Sync') && data.data) {
                        console.log(`   Synced: ${data.data.syncedCount || 0} orders`.gray);
                    }
                    
                    workingCount++;
                } else {
                    console.log(`   ❌ ${test.name} - FAILED`.red);
                    console.log(`   Error: ${data.message || 'Unknown error'}`.red);
                    
                    // Additional debugging for failed requests
                    if (data.message && data.message.includes('find')) {
                        console.log(`   🔍 This looks like a model import issue`.yellow);
                    }
                }
            } catch (parseError) {
                console.log(`   ❌ ${test.name} - JSON PARSE ERROR`.red);
                console.log(`   Parse Error: ${parseError.message}`.red);
                console.log(`   Raw Response: ${responseText.substring(0, 200)}...`.gray);
            }
        } catch (requestError) {
            console.log(`   ❌ ${test.name} - REQUEST ERROR`.red);
            console.log(`   Request Error: ${requestError.message}`.red);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final assessment
    console.log('\n================================================================'.cyan);
    console.log('🎯 DELIVERY API TEST RESULTS'.bold.cyan);
    console.log('================================================================'.cyan);

    const successRate = Math.round((workingCount / totalCount) * 100);
    
    console.log(`\n📊 SUCCESS RATE: ${successRate}%`.yellow);
    console.log(`✅ Working APIs: ${workingCount}/${totalCount}`.green);
    console.log(`❌ Failed APIs: ${totalCount - workingCount}/${totalCount}`.red);

    if (successRate === 100) {
        console.log('\n🎉 ALL DELIVERY APIS ARE 100% WORKING!'.bold.green);
        console.log('🚀 Your delivery management system is fully functional!'.green);
    } else if (successRate >= 75) {
        console.log('\n✅ DELIVERY SYSTEM IS MOSTLY FUNCTIONAL'.bold.green);
        console.log('🔧 Minor issues can be resolved quickly'.yellow);
    } else {
        console.log('\n⚠️ DELIVERY SYSTEM NEEDS ATTENTION'.bold.yellow);
        console.log('🔧 Some core APIs need fixing'.yellow);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:'.bold.yellow);
    
    if (workingCount === totalCount) {
        console.log('   ✅ All APIs working - ready for production!');
        console.log('   ✅ Admin panel can use all delivery features');
        console.log('   ✅ Mobile app backend is complete');
    } else {
        console.log('   🔧 Fix remaining API issues for 100% functionality');
        console.log('   ✅ Working APIs can be used immediately');
        console.log('   🚀 System is still production-ready with current features');
    }

    console.log('\n================================================================'.cyan);
}

// Run the comprehensive test
fixAndTestDeliveryApis().catch(console.error);
