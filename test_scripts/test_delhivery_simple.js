const axios = require('axios');

// Test Delhivery API directly
async function testDelhiveryAPI() {
  const apiKey = '54e7ec8ee21a4ca7868fad95deb369875b1a7e44';
  
  console.log('🔍 Testing Delhivery API Endpoints Directly...\n');

  // Test 1: Serviceability endpoint
  console.log('📍 Test 1: Serviceability Endpoint');
  try {
    const response = await axios.get('https://track.delhivery.com/api/c/api/pin-codes/json/', {
      params: {
        token: apiKey,
        filter_codes: '360001'
      },
      timeout: 20000
    });
    
    console.log('✅ Serviceability API working');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Serviceability API failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 2: Rates endpoint
  console.log('💰 Test 2: Rates Endpoint');
  try {
    const response = await axios.get('https://track.delhivery.com/api/kinko/v1/invoice/charges/.json', {
      params: {
        md: 'S',
        ss: 'Delivered',
        d_pin: '360001',
        o_pin: '110001',
        cgm: 1000,
        pt: 'COD'
      },
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    console.log('✅ Rates API working');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Rates API failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: Test with different API format
  console.log('🔄 Test 3: Alternative API Format');
  try {
    const response = await axios.get('https://track.delhivery.com/api/pin-codes/json/', {
      params: {
        token: apiKey,
        filter_codes: '360001'
      },
      timeout: 20000
    });
    
    console.log('✅ Alternative API working');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Alternative API failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

// Run the test
testDelhiveryAPI();

