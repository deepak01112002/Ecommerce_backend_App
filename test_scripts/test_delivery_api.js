const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTc4NzYxNSwiZXhwIjoxNzU2MzkyNDE1fQ.04NDOY3YwKpxlblDuNe_F04oM2NYUEdYdHv5bUn2oL0';

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test functions
async function testDeliveryAPI() {
  console.log('🚀 Starting Delivery API Tests...\n');

  try {
    // Test 1: Get delivery options for a specific location
    console.log('📋 Test 1: Get Delivery Options');
    console.log('Testing: GET /api/delivery-management/options');
    
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
    
    console.log('✅ Success:', optionsResponse.data.message);
    console.log('Available options:', optionsResponse.data.data.options.length);
    console.log('Options:', optionsResponse.data.data.options.map(opt => ({
      name: opt.name,
      type: opt.type,
      charges: opt.charges,
      estimatedDays: opt.estimatedDays
    })));
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    console.log('');
  }

  try {
    // Test 2: Get pending orders
    console.log('📦 Test 2: Get Pending Orders');
    console.log('Testing: GET /api/delivery-management/orders/pending');
    
    const pendingResponse = await axios.get(`${BASE_URL}/delivery-management/orders/pending`, {
      headers
    });
    
    console.log('✅ Success:', pendingResponse.data.message);
    console.log('Pending orders:', pendingResponse.data.data.orders.length);
    if (pendingResponse.data.data.orders.length > 0) {
      const order = pendingResponse.data.data.orders[0];
      console.log('Sample order:', {
        orderNumber: order.orderNumber,
        customer: `${order.user.firstName} ${order.user.lastName}`,
        status: order.status,
        total: order.total
      });
    }
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    console.log('');
  }

  try {
    // Test 3: Get delivery assignments
    console.log('📋 Test 3: Get Delivery Assignments');
    console.log('Testing: GET /api/delivery-management/assignments');
    
    const assignmentsResponse = await axios.get(`${BASE_URL}/delivery-management/assignments`, {
      headers
    });
    
    console.log('✅ Success:', assignmentsResponse.data.message);
    console.log('Assignments:', assignmentsResponse.data.data.assignments.length);
    console.log('Stats:', assignmentsResponse.data.data.stats);
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    console.log('');
  }

  try {
    // Test 4: Check Delhivery serviceability
    console.log('📍 Test 4: Check Delhivery Serviceability');
    console.log('Testing: GET /api/delivery-management/serviceability/360001');
    
    const serviceabilityResponse = await axios.get(`${BASE_URL}/delivery-management/serviceability/360001`, {
      headers
    });
    
    console.log('✅ Success:', serviceabilityResponse.data.message);
    console.log('Serviceability data:', serviceabilityResponse.data.data);
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    console.log('');
  }

  try {
    // Test 5: Get delivery options for different locations
    console.log('🌍 Test 5: Test Multiple Locations');
    
    const locations = [
      { state: 'Gujarat', city: 'Rajkot', postalCode: '360001' },
      { state: 'Maharashtra', city: 'Mumbai', postalCode: '400001' },
      { state: 'Delhi', city: 'New Delhi', postalCode: '110001' }
    ];

    for (const location of locations) {
      console.log(`Testing location: ${location.city}, ${location.state} (${location.postalCode})`);
      
      try {
        const response = await axios.get(`${BASE_URL}/delivery-management/options`, {
          headers,
          params: {
            ...location,
            weight: 1,
            codAmount: 1000
          }
        });
        
        console.log(`✅ ${location.city}: ${response.data.data.options.length} options available`);
        
        // Show Delhivery option if available
        const delhiveryOption = response.data.data.options.find(opt => opt.type === 'delhivery');
        if (delhiveryOption) {
          console.log(`   Delhivery: ₹${delhiveryOption.charges} - ${delhiveryOption.estimatedDays}`);
        }
        
      } catch (error) {
        console.log(`❌ ${location.city}: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log('');

  } catch (error) {
    console.log('❌ Error in location testing:', error.message);
    console.log('');
  }

  try {
    // Test 6: Test with invalid data
    console.log('🚫 Test 6: Test Invalid Data Handling');
    console.log('Testing: GET /api/delivery-management/options with invalid pincode');
    
    const invalidResponse = await axios.get(`${BASE_URL}/delivery-management/options`, {
      headers,
      params: {
        state: 'Invalid',
        city: 'Invalid',
        postalCode: '000000',
        weight: -1,
        codAmount: -100
      }
    });
    
    console.log('✅ Response received (may be empty):', invalidResponse.data.message);
    console.log('');

  } catch (error) {
    console.log('❌ Error (expected for invalid data):', error.response?.data?.message || error.message);
    console.log('');
  }

  // Test 7: Test authentication
  try {
    console.log('🔐 Test 7: Test Authentication');
    console.log('Testing: GET /api/delivery-management/options without token');
    
    const noAuthResponse = await axios.get(`${BASE_URL}/delivery-management/options`, {
      params: {
        state: 'Gujarat',
        city: 'Rajkot',
        postalCode: '360001'
      }
    });
    
    console.log('❌ Should have failed without auth, but got:', noAuthResponse.data.message);
    console.log('');

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
    console.log('');
  }

  console.log('🎯 Delivery API Tests Completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log('- Tested delivery options for multiple locations');
  console.log('- Tested pending orders retrieval');
  console.log('- Tested delivery assignments');
  console.log('- Tested Delhivery serviceability');
  console.log('- Tested error handling');
  console.log('- Tested authentication');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Create test orders in the system');
  console.log('2. Test delivery method assignment');
  console.log('3. Test shipment tracking');
  console.log('4. Test delivery company integration');

}

// Run the tests
testDeliveryAPI().catch(error => {
  console.error('💥 Fatal error in testing:', error.message);
});
