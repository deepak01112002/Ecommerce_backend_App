const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function createTestOrder() {
  try {
    console.log('🚀 Creating test order for admin panel testing...\n');

    // Use fresh admin token
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODIwN2Y0MGYzZDZmZmY2MWU2MDYzMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Mzk4ODAyNCwiZXhwIjoxNzU0NTkyODI0fQ.kKZaBgz3u2y73a2L-I4VbAAA59IkIKqWOBDMYG28bNI';
    console.log('✅ Using fresh admin token\n');

    // Get categories and products
    console.log('📋 Fetching categories and products...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const categories = categoriesResponse.data.data;
    const products = productsResponse.data.data.products || productsResponse.data.data;

    console.log(`✅ Found ${categories.length} categories and ${products.length} products\n`);

    if (products.length === 0) {
      console.log('❌ No products found. Cannot create test order.');
      return;
    }

    // Create a test user first
    console.log('👤 Creating test user...');
    const testUser = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'testcustomer@example.com',
      password: 'password123',
      phone: '9876543210'
    };

    let userToken;
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      userToken = registerResponse.data.token;
      console.log('✅ Test user created successfully');
    } catch (error) {
      // User might already exist, try to login
      console.log('ℹ️ User might exist, trying to login...');
      const loginUserResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userToken = loginUserResponse.data.token;
      console.log('✅ Test user login successful');
    }

    // Add address for the user
    console.log('🏠 Adding address for test user...');
    const addressData = {
      type: 'home',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '9876543210',
      addressLine1: '123 Test Street',
      addressLine2: 'Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      isDefault: true
    };

    await axios.post(`${API_BASE_URL}/addresses`, addressData, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ Address added successfully');

    // Get user addresses
    const addressesResponse = await axios.get(`${API_BASE_URL}/addresses`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const userAddress = addressesResponse.data.data[0];

    // Create test order
    console.log('📦 Creating test order...');
    const testOrderData = {
      items: [
        {
          product: products[0]._id,
          quantity: 2,
          price: products[0].price,
          specifications: {
            height: '10 cm',
            weight: '500 gm',
            material: 'Brass',
            finish: 'Antique',
            origin: 'India'
          }
        }
      ],
      shippingAddress: userAddress._id,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderNotes: 'Test order for admin panel testing'
    };

    const orderResponse = await axios.post(`${API_BASE_URL}/orders`, testOrderData, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const order = orderResponse.data.data;
    console.log('✅ Test order created successfully!');
    console.log(`📋 Order ID: ${order._id}`);
    console.log(`📋 Order Number: ${order.orderNumber}`);
    console.log(`💰 Total Amount: ₹${order.pricing?.total || order.total || 'N/A'}`);
    console.log(`👤 Customer: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`📱 Phone: ${testUser.phone}`);

    console.log('\n🎉 Test order created successfully!');
    console.log('Now you can test the order bill functionality in the admin panel.');

  } catch (error) {
    console.error('❌ Error creating test order:', error.response?.data || error.message);
  }
}

createTestOrder();
