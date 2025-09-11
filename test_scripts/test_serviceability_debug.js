const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTc4NzYxNSwiZXhwIjoxNzU2MzkyNDE1fQ.04NDOY3YwKpxlblDuNe_F04oM2NYUEdYdHv5bUn2oL0';

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function debugServiceability() {
  console.log('🔍 Debugging Serviceability Endpoint...\n');

  try {
    // Test with different pincodes
    const testPincodes = ['360001', '400001', '110001'];
    
    for (const pincode of testPincodes) {
      console.log(`\n📍 Testing pincode: ${pincode}`);
      
      try {
        const response = await axios.get(`${BASE_URL}/delivery-management/serviceability/${pincode}`, { 
          headers,
          timeout: 10000 // 10 second timeout
        });
        
        console.log('✅ Success:', response.status);
        console.log('Response:', response.data);
        
      } catch (error) {
        console.log('❌ Error:', error.response?.status);
        console.log('Error message:', error.response?.data?.message || error.message);
        console.log('Full error response:', error.response?.data);
        
        if (error.response?.status === 400) {
          console.log('🔍 400 Bad Request - checking validation...');
        }
      }
    }

    // Test the Delhivery service directly
    console.log('\n🔍 Testing Delhivery Service Directly...');
    
    try {
      const response = await axios.get(`${BASE_URL}/delivery-management/test`, { headers });
      console.log('✅ Test route working');
      
      // Test delivery options to see if Delhivery is included
      const optionsResponse = await axios.get(`${BASE_URL}/delivery-management/options`, {
        headers,
        params: {
          state: 'Gujarat',
          city: 'Rajkot',
          postalCode: '360001',
          weight: 1,
          codAmount: 1500
        }
      });
      
      console.log('✅ Options route working');
      console.log('Available options:', optionsResponse.data.data.options.map(opt => ({
        name: opt.name,
        type: opt.type,
        charges: opt.charges
      })));
      
      // Check if Delhivery option is present
      const delhiveryOption = optionsResponse.data.data.options.find(opt => opt.type === 'delhivery');
      if (delhiveryOption) {
        console.log('✅ Delhivery option found:', delhiveryOption);
      } else {
        console.log('⚠️ Delhivery option not found in delivery options');
      }
      
    } catch (error) {
      console.log('❌ Error testing options:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run the debug
debugServiceability();

