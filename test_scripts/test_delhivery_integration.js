const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTc4NzYxNSwiZXhwIjoxNzU2MzkyNDE1fQ.04NDOY3YwKpxlblDuNe_F04oM2NYUEdYdHv5bUn2oL0';

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testDelhiveryIntegration() {
  console.log('🚚 Starting Delhivery API Integration Tests...\n');

  try {
    // Test 1: Check Delhivery serviceability for different pincodes
    console.log('📍 Test 1: Check Delhivery Serviceability');
    
    const testPincodes = [
      { pincode: '360002', city: 'Rajkot, Gujarat' },
      { pincode: '400001', city: 'Mumbai, Maharashtra' },
      { pincode: '110001', city: 'New Delhi, Delhi' },
      { pincode: '700001', city: 'Kolkata, West Bengal' },
      { pincode: '600001', city: 'Chennai, Tamil Nadu' }
    ];

    for (const location of testPincodes) {
      try {
        console.log(`\nTesting: ${location.city} (${location.pincode})`);
        
        const response = await axios.get(`${BASE_URL}/delivery-management/serviceability/${location.pincode}`, {
          headers
        });
        
        if (response.data.success) {
          const data = response.data.data;
          console.log(`✅ Serviceable: ${data.isServiceable ? 'Yes' : 'No'}`);
          console.log(`   COD Available: ${data.codAvailable ? 'Yes' : 'No'}`);
          console.log(`   Prepaid Available: ${data.prepaidAvailable ? 'Yes' : 'No'}`);
          console.log(`   City: ${data.city}, State: ${data.state}`);
        } else {
          console.log(`❌ Error: ${response.data.message}`);
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️ Endpoint not implemented yet for ${location.city}`);
        } else {
          console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    console.log('');

    // Test 2: Get delivery rates for different locations
    console.log('💰 Test 2: Get Delhivery Delivery Rates');
    
    const rateTestCases = [
      { from: '110001', to: '360002', weight: 1, codAmount: 1500, description: 'Delhi to Rajkot (COD)' },
      { from: '110001', to: '400001', weight: 2, codAmount: 0, description: 'Delhi to Mumbai (Prepaid)' },
      { from: '360002', to: '700001', weight: 0.5, codAmount: 800, description: 'Rajkot to Kolkata (COD)' }
    ];

    for (const testCase of rateTestCases) {
      try {
        console.log(`\nTesting: ${testCase.description}`);
        console.log(`   From: ${testCase.from} → To: ${testCase.to}`);
        console.log(`   Weight: ${testCase.weight}kg, COD: ₹${testCase.codAmount}`);
        
        const response = await axios.get(`${BASE_URL}/delivery-management/options`, {
          headers,
          params: {
            state: 'Test State',
            city: 'Test City',
            postalCode: testCase.to,
            weight: testCase.weight,
            codAmount: testCase.codAmount
          }
        });
        
        if (response.data.success) {
          const delhiveryOption = response.data.data.options.find(opt => opt.type === 'delhivery');
          if (delhiveryOption) {
            console.log(`✅ Delhivery Rate: ₹${delhiveryOption.charges}`);
            console.log(`   Estimated Days: ${delhiveryOption.estimatedDays}`);
            if (delhiveryOption.baseRate) {
              console.log(`   Base Rate: ₹${delhiveryOption.baseRate}`);
            }
            if (delhiveryOption.codCharges) {
              console.log(`   COD Charges: ₹${delhiveryOption.codCharges}`);
            }
          } else {
            console.log(`⚠️ Delhivery option not available for this location`);
          }
        } else {
          console.log(`❌ Error: ${response.data.message}`);
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log('');

    // Test 3: Test delivery method assignment with Delhivery
    console.log('🔧 Test 3: Test Delhivery Delivery Assignment');
    
    try {
      // Get a pending order first
      const pendingResponse = await axios.get(`${BASE_URL}/delivery-management/orders/pending`, { headers });
      
      if (pendingResponse.data.data.orders.length > 0) {
        const order = pendingResponse.data.data.orders[0];
        console.log(`\nFound order: ${order.orderNumber} for ${order.user.firstName} ${order.user.lastName}`);
        
        // Assign Delhivery delivery method
        const assignmentResponse = await axios.post(`${BASE_URL}/delivery-management/orders/${order._id}/assign`, {
          deliveryMethod: 'delhivery',
          adminNotes: 'Testing Delhivery integration'
        }, { headers });
        
        if (assignmentResponse.data.success) {
          console.log('✅ Delhivery delivery method assigned successfully');
          console.log('Order status:', assignmentResponse.data.data.order.status);
          console.log('Carrier:', assignmentResponse.data.data.order.shipping.carrier);
          
          // Check if tracking number was generated
          if (assignmentResponse.data.data.order.shipping.trackingNumber) {
            console.log('Tracking Number:', assignmentResponse.data.data.order.shipping.trackingNumber);
            console.log('AWB Code:', assignmentResponse.data.data.order.shipping.awbCode);
          } else {
            console.log('⚠️ No tracking number generated yet');
          }
        } else {
          console.log('❌ Failed to assign Delhivery:', assignmentResponse.data.message);
        }
      } else {
        console.log('⚠️ No pending orders found to test Delhivery assignment');
      }
      
    } catch (error) {
      console.log('❌ Error testing Delhivery assignment:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Test shipment tracking (if any tracking numbers exist)
    console.log('📦 Test 4: Test Shipment Tracking');
    
    try {
      const assignmentsResponse = await axios.get(`${BASE_URL}/delivery-management/assignments`, { headers });
      const delhiveryOrders = assignmentsResponse.data.data.assignments.filter(
        order => order.shipping.deliveryMethod === 'delhivery' && order.shipping.trackingNumber
      );
      
      if (delhiveryOrders.length > 0) {
        const testOrder = delhiveryOrders[0];
        console.log(`\nTesting tracking for order: ${testOrder.orderNumber}`);
        console.log(`Tracking Number: ${testOrder.shipping.trackingNumber}`);
        
        const trackingResponse = await axios.get(`${BASE_URL}/delivery-management/track/${testOrder.shipping.trackingNumber}`, {
          headers
        });
        
        if (trackingResponse.data.success) {
          const trackingData = trackingResponse.data.data;
          console.log('✅ Tracking data retrieved successfully');
          console.log('Status:', trackingData.status);
          console.log('Origin:', trackingData.origin);
          console.log('Destination:', trackingData.destination);
          console.log('Estimated Delivery:', trackingData.estimatedDelivery);
          console.log('Current Location:', trackingData.currentLocation);
        } else {
          console.log('❌ Failed to get tracking data:', trackingResponse.data.message);
        }
      } else {
        console.log('⚠️ No Delhivery orders with tracking numbers found');
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Tracking endpoint not implemented yet');
      } else {
        console.log('❌ Error testing tracking:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    console.log('🎯 Delhivery Integration Tests Completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log('- Tested serviceability for multiple locations');
    console.log('- Tested delivery rate calculation');
    console.log('- Tested Delhivery delivery assignment');
    console.log('- Tested shipment tracking (if available)');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Implement missing endpoints (serviceability, tracking)');
    console.log('2. Test with real Delhivery API responses');
    console.log('3. Handle edge cases and error scenarios');
    console.log('4. Implement webhook handling for status updates');

  } catch (error) {
    console.error('💥 Fatal error in Delhivery testing:', error.message);
  }
}

// Run the tests
testDelhiveryIntegration();
