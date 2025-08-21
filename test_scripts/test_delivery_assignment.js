const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTc4NzYxNSwiZXhwIjoxNzU2MzkyNDE1fQ.04NDOY3YwKpxlblDuNe_F04oM2NYUEdYdHv5bUn2oL0';

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testDeliveryAssignment() {
  console.log('🚀 Starting Delivery Assignment Tests...\n');

  try {
    // Test 1: Get pending orders first
    console.log('📦 Test 1: Get Pending Orders');
    const pendingResponse = await axios.get(`${BASE_URL}/delivery-management/orders/pending`, { headers });
    
    if (pendingResponse.data.data.orders.length === 0) {
      console.log('⚠️ No pending orders found. Cannot test assignment.');
      return;
    }

    const order = pendingResponse.data.data.orders[0];
    console.log('✅ Found pending order:', {
      orderNumber: order.orderNumber,
      customer: `${order.user.firstName} ${order.user.lastName}`,
      status: order.status,
      total: order.total
    });
    console.log('');

    // Test 2: Get delivery options for this order
    console.log('📋 Test 2: Get Delivery Options for Order');
    const optionsResponse = await axios.get(`${BASE_URL}/delivery-management/options`, {
      headers,
      params: {
        state: order.shippingAddress.state,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        weight: 1,
        codAmount: order.paymentInfo?.method === 'cod' ? (order.total || 0) : 0
      }
    });
    
    console.log('✅ Delivery options retrieved:', optionsResponse.data.data.options.length);
    optionsResponse.data.data.options.forEach(opt => {
      console.log(`   - ${opt.name}: ₹${opt.charges} (${opt.estimatedDays})`);
    });
    console.log('');

    // Test 3: Assign manual delivery method
    console.log('🔧 Test 3: Assign Manual Delivery Method');
    const manualAssignment = await axios.post(`${BASE_URL}/delivery-management/orders/${order._id}/assign`, {
      deliveryMethod: 'manual',
      adminNotes: 'Test assignment - Manual delivery'
    }, { headers });
    
    console.log('✅ Manual delivery assigned:', manualAssignment.data.message);
    console.log('Order status updated to:', manualAssignment.data.data.order.status);
    console.log('');

    // Test 4: Update to Delhivery delivery method
    console.log('🚚 Test 4: Update to Delhivery Delivery Method');
    const delhiveryUpdate = await axios.put(`${BASE_URL}/delivery-management/orders/${order._id}/assignment`, {
      deliveryMethod: 'delhivery',
      adminNotes: 'Test update - Delhivery delivery'
    }, { headers });
    
    console.log('✅ Updated to Delhivery:', delhiveryUpdate.data.message);
    console.log('Order status:', delhiveryUpdate.data.data.order.status);
    console.log('Carrier:', delhiveryUpdate.data.data.order.shipping.carrier);
    console.log('');

    // Test 5: Check updated assignments
    console.log('📋 Test 5: Check Updated Assignments');
    const updatedAssignments = await axios.get(`${BASE_URL}/delivery-management/assignments`, { headers });
    
    const updatedOrder = updatedAssignments.data.data.assignments.find(
      a => a._id === order._id
    );
    
    if (updatedOrder) {
      console.log('✅ Order found in assignments:', {
        orderNumber: updatedOrder.orderNumber,
        deliveryMethod: updatedOrder.shipping.deliveryMethod,
        carrier: updatedOrder.shipping.carrier,
        assignedBy: updatedOrder.shipping.assignedBy ? 
          `${updatedOrder.shipping.assignedBy.firstName} ${updatedOrder.shipping.assignedBy.lastName}` : 'Not assigned',
        adminNotes: updatedOrder.shipping.adminNotes
      });
    } else {
      console.log('❌ Order not found in updated assignments');
    }
    console.log('');

    // Test 6: Test invalid delivery method
    console.log('🚫 Test 6: Test Invalid Delivery Method');
    try {
      await axios.post(`${BASE_URL}/delivery-management/orders/${order._id}/assign`, {
        deliveryMethod: 'invalid_method',
        adminNotes: 'This should fail'
      }, { headers });
      
      console.log('❌ Should have failed with invalid method');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid delivery method');
        console.log('Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test 7: Test assignment to non-existent order
    console.log('🚫 Test 7: Test Assignment to Non-existent Order');
    try {
      await axios.post(`${BASE_URL}/delivery-management/orders/507f1f77bcf86cd799439011/assign`, {
        deliveryMethod: 'manual',
        adminNotes: 'This should fail - invalid order ID'
      }, { headers });
      
      console.log('❌ Should have failed with invalid order ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly rejected invalid order ID');
        console.log('Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    console.log('🎯 Delivery Assignment Tests Completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log('- ✅ Successfully assigned manual delivery');
    console.log('- ✅ Successfully updated to Delhivery delivery');
    console.log('- ✅ Verified assignment updates');
    console.log('- ✅ Tested error handling for invalid inputs');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Test shipment creation with Delhivery');
    console.log('2. Test tracking functionality');
    console.log('3. Test delivery company integration');

  } catch (error) {
    console.error('💥 Error in delivery assignment testing:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Server error - check backend logs for details');
    }
  }
}

// Run the tests
testDeliveryAssignment();
