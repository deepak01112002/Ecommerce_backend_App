const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTc4NzYxNSwiZXhwIjoxNzU2MzkyNDE1fQ.04NDOY3YwKpxlblDuNe_F04oM2NYUEdYdHv5bUn2oL0';

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testBasicRoutes() {
  console.log('🔍 Testing Basic Route Functionality...\n');

  try {
    // Test 1: Test the basic test route
    console.log('📋 Test 1: Basic Test Route');
    try {
      const response = await axios.get(`${BASE_URL}/delivery-management/test`, { headers });
      console.log('✅ Test route working:', response.data.message);
    } catch (error) {
      console.log('❌ Test route failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 2: Test delivery options route
    console.log('📋 Test 2: Delivery Options Route');
    try {
      const response = await axios.get(`${BASE_URL}/delivery-management/options`, {
        headers,
        params: {
          state: 'Gujarat',
          city: 'Rajkot',
          postalCode: '360002'
        }
      });
      console.log('✅ Options route working:', response.data.message);
      console.log('Options count:', response.data.data.options.length);
    } catch (error) {
      console.log('❌ Options route failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 3: Test serviceability route directly
    console.log('📋 Test 3: Serviceability Route Direct Test');
    try {
      const response = await axios.get(`${BASE_URL}/delivery-management/serviceability/360002`, { headers });
      console.log('✅ Serviceability route working:', response.data.message);
      console.log('Data:', response.data.data);
    } catch (error) {
      console.log('❌ Serviceability route failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Test without authentication
    console.log('📋 Test 4: Test Without Authentication');
    try {
      const response = await axios.get(`${BASE_URL}/delivery-management/test`);
      console.log('❌ Should have failed without auth, but got:', response.data.message);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected unauthorized request');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run the tests
testBasicRoutes();

