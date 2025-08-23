const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080/api';

async function getAdminToken() {
  try {
    console.log('🔐 Getting Admin Token...\n');
    
    // Login with admin credentials from create_admin_user.js
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@ghanshyambhandar.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful!');
      console.log('Token:', token);
      console.log('');
      console.log('🔑 Use this token in your API requests:');
      console.log(`Authorization: Bearer ${token}`);
      console.log('');
      console.log('📋 Copy the token above and update your test script');
      
      return token;
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting admin token:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 The auth endpoint might not exist. Check if the server is running and the route is configured.');
    }
    
    return null;
  }
}

// Run the function
getAdminToken();
