require('dotenv').config();
const axios = require('axios');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

async function testShiprocketAuthentication() {
    log('\n🚚 TESTING SHIPROCKET AUTHENTICATION', 'cyan');
    log('='.repeat(50), 'cyan');
    
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    logInfo(`Email: ${email}`);
    logInfo(`Password: ${password ? '***' + password.slice(-3) : 'Not set'}`);
    
    if (!email || !password) {
        logError('Shiprocket credentials not found in environment variables');
        return false;
    }
    
    try {
        logInfo('Attempting to authenticate with Shiprocket...');
        
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.token) {
            logSuccess('Shiprocket authentication successful!');
            logInfo(`Token received: ${response.data.token.substring(0, 20)}...`);
            
            // Test a simple API call with the token
            logInfo('Testing API call with token...');
            
            const testResponse = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
                headers: {
                    'Authorization': `Bearer ${response.data.token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    pickup_postcode: '400001',
                    delivery_postcode: '400002',
                    weight: 0.5,
                    cod: 1
                }
            });
            
            if (testResponse.data) {
                logSuccess('Shiprocket API call successful!');
                logInfo(`Available couriers: ${testResponse.data.data?.available_courier_companies?.length || 0}`);
                return true;
            } else {
                logError('Shiprocket API call failed');
                return false;
            }
            
        } else {
            logError('Authentication failed - no token received');
            logError(`Response: ${JSON.stringify(response.data)}`);
            return false;
        }
        
    } catch (error) {
        logError('Shiprocket authentication failed');
        if (error.response) {
            logError(`Status: ${error.response.status}`);
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        } else {
            logError(`Error: ${error.message}`);
        }
        return false;
    }
}

async function testBackendShiprocketIntegration() {
    log('\n🔧 TESTING BACKEND SHIPROCKET INTEGRATION', 'cyan');
    log('='.repeat(50), 'cyan');
    
    try {
        // Test serviceability check through our backend
        logInfo('Testing serviceability check through backend...');
        
        const response = await axios.post('http://localhost:8080/api/shipping/check-serviceability', {
            pickupPostcode: '400001',
            deliveryPostcode: '400002',
            weight: 0.5,
            codAmount: 1000
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.success) {
            logSuccess('Backend serviceability check successful!');
            const couriers = response.data.data.couriers || [];
            logInfo(`Found ${couriers.length} available couriers`);
            
            if (couriers.length > 0) {
                logInfo('Sample couriers:');
                couriers.slice(0, 3).forEach((courier, index) => {
                    logInfo(`  ${index + 1}. ${courier.courier_name} - ₹${courier.rate} (${courier.estimated_delivery_days} days)`);
                });
            }
            
            return true;
        } else {
            logError('Backend serviceability check failed');
            logError(`Response: ${JSON.stringify(response.data)}`);
            return false;
        }
        
    } catch (error) {
        logError('Backend integration test failed');
        if (error.response) {
            logError(`Status: ${error.response.status}`);
            logError(`Response: ${JSON.stringify(error.response.data)}`);
        } else {
            logError(`Error: ${error.message}`);
        }
        return false;
    }
}

async function main() {
    log('\n🚀 SHIPROCKET CREDENTIALS TESTING', 'bright');
    log('='.repeat(60), 'bright');
    
    const results = {
        directAuth: false,
        backendIntegration: false
    };
    
    // Test 1: Direct Shiprocket authentication
    results.directAuth = await testShiprocketAuthentication();
    
    // Test 2: Backend integration
    results.backendIntegration = await testBackendShiprocketIntegration();
    
    // Summary
    log('\n📊 TEST RESULTS SUMMARY', 'cyan');
    log('='.repeat(30), 'cyan');
    
    if (results.directAuth) {
        logSuccess('✅ Direct Shiprocket Authentication: PASSED');
    } else {
        logError('❌ Direct Shiprocket Authentication: FAILED');
    }
    
    if (results.backendIntegration) {
        logSuccess('✅ Backend Shiprocket Integration: PASSED');
    } else {
        logError('❌ Backend Shiprocket Integration: FAILED');
    }
    
    const successRate = ((Object.values(results).filter(Boolean).length / Object.values(results).length) * 100).toFixed(1);
    
    log(`\n🎯 Overall Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    
    if (successRate >= 90) {
        logSuccess('🎉 EXCELLENT! Shiprocket integration is working perfectly');
        logInfo('✅ Ready for production shipping');
    } else if (successRate >= 50) {
        logWarning('⚠️ PARTIAL SUCCESS! Some issues need attention');
        logInfo('⚠️ Check credentials and network connectivity');
    } else {
        logError('❌ FAILED! Shiprocket integration needs fixes');
        logInfo('❌ Verify credentials and API endpoints');
    }
    
    return results;
}

// Run the test
if (require.main === module) {
    main().catch(error => {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = main;
