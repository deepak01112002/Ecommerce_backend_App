require('dotenv').config();
const axios = require('axios');

async function verifyCredentials() {
    console.log('🔍 Verifying Shiprocket Credentials');
    console.log('=====================================');
    
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🔑 Password Length: ${password ? password.length : 0}`);
    console.log(`🔑 Password Characters: ${password ? password.split('').map(c => `'${c}' (${c.charCodeAt(0)})`).join(', ') : 'None'}`);
    
    if (!email || !password) {
        console.log('❌ Missing credentials');
        return false;
    }
    
    try {
        console.log('\n🚀 Testing authentication...');
        
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Authentication successful!');
        console.log(`🎫 Token: ${response.data.token ? response.data.token.substring(0, 20) + '...' : 'No token'}`);
        return true;
        
    } catch (error) {
        console.log('❌ Authentication failed');
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`💥 Error: ${error.message}`);
        }
        return false;
    }
}

// Test with different password variations
async function testPasswordVariations() {
    console.log('\n🔧 Testing Password Variations');
    console.log('===============================');
    
    const email = process.env.SHIPROCKET_EMAIL;
    const originalPassword = process.env.SHIPROCKET_PASSWORD;
    
    // Remove quotes if present
    const cleanPassword = originalPassword.replace(/^["']|["']$/g, '');
    
    const variations = [
        { name: 'Original', password: originalPassword },
        { name: 'Without Quotes', password: cleanPassword },
        { name: 'URL Encoded', password: encodeURIComponent(cleanPassword) }
    ];
    
    for (const variation of variations) {
        console.log(`\n🧪 Testing: ${variation.name}`);
        console.log(`🔑 Password: ${variation.password}`);
        
        try {
            const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
                email: email,
                password: variation.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ ${variation.name}: SUCCESS!`);
            console.log(`🎫 Token: ${response.data.token ? response.data.token.substring(0, 20) + '...' : 'No token'}`);
            return variation.password;
            
        } catch (error) {
            console.log(`❌ ${variation.name}: FAILED`);
            if (error.response) {
                console.log(`📊 Status: ${error.response.status}`);
                console.log(`📝 Message: ${error.response.data.message || 'No message'}`);
            }
        }
    }
    
    return null;
}

async function main() {
    console.log('🚚 SHIPROCKET CREDENTIAL VERIFICATION');
    console.log('======================================\n');
    
    // First try with current credentials
    const basicTest = await verifyCredentials();
    
    if (!basicTest) {
        // Try different variations
        const workingPassword = await testPasswordVariations();
        
        if (workingPassword) {
            console.log('\n🎉 FOUND WORKING PASSWORD!');
            console.log(`✅ Use this password: ${workingPassword}`);
            console.log('\n📝 Update your .env file with the working password');
        } else {
            console.log('\n❌ NO WORKING PASSWORD FOUND');
            console.log('🔍 Please verify your Shiprocket credentials:');
            console.log('   1. Check email address');
            console.log('   2. Check password (case sensitive)');
            console.log('   3. Verify account is active');
            console.log('   4. Try logging into Shiprocket dashboard manually');
        }
    } else {
        console.log('\n🎉 CREDENTIALS ARE WORKING!');
        console.log('✅ Shiprocket integration should work properly');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = main;
