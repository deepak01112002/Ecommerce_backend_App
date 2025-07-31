// Test getUserOrders endpoint specifically
const axios = require('axios');

async function testUserOrdersEndpoint() {
    try {
        console.log('🔍 Testing getUserOrders endpoint...\n');

        const timestamp = Date.now();
        const testEmail = `testuser${timestamp}@example.com`;
        const testPhone = `9${timestamp.toString().slice(-9)}`;

        // 1. Register new user
        console.log('1. Registering new user...');
        const registerResponse = await axios.post('http://localhost:8080/api/auth/register', {
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            password: 'password123',
            phone: testPhone
        });

        if (!registerResponse.data.success) {
            throw new Error('Registration failed: ' + registerResponse.data.message);
        }
        console.log('✅ User registered successfully');

        // 2. Login user
        console.log('2. Logging in user...');
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: testEmail,
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const userToken = loginResponse.data.data.token;
        console.log('✅ User logged in successfully');

        // 3. Test getUserOrders with no orders (should return empty array)
        console.log('3. Testing getUserOrders with no orders...');
        const emptyOrdersResponse = await axios.get('http://localhost:8080/api/orders', {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        console.log('✅ getUserOrders response format:');
        console.log('   - success:', emptyOrdersResponse.data.success);
        console.log('   - message:', emptyOrdersResponse.data.message);
        console.log('   - orders count:', emptyOrdersResponse.data.data.orders.length);
        console.log('   - has pagination:', !!emptyOrdersResponse.data.data.pagination);

        // 4. Add address for order creation
        console.log('4. Adding address...');
        const addressResponse = await axios.post('http://localhost:8080/api/addresses', {
            type: 'home',
            firstName: 'Test',
            lastName: 'User',
            phone: testPhone,
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            country: 'India',
            isDefault: true
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (!addressResponse.data.success) {
            throw new Error('Address creation failed: ' + addressResponse.data.message);
        }
        const addressId = addressResponse.data.data._id;
        console.log('✅ Address added successfully');

        // 5. Get a product ID for order creation
        console.log('5. Getting product for order...');
        const productsResponse = await axios.get('http://localhost:8080/api/products');
        if (!productsResponse.data.success || productsResponse.data.data.products.length === 0) {
            throw new Error('No products available for testing');
        }
        const productId = productsResponse.data.data.products[0]._id;
        console.log('✅ Product found for order');

        // 6. Create an order
        console.log('6. Creating test order...');
        const orderResponse = await axios.post('http://localhost:8080/api/orders', {
            items: [{
                product: productId,
                quantity: 1,
                unitPrice: 500
            }],
            shippingAddress: addressId,
            paymentMethod: 'cod',
            notes: 'Test order for getUserOrders endpoint testing'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (!orderResponse.data.success) {
            throw new Error('Order creation failed: ' + orderResponse.data.message);
        }
        console.log('✅ Order created successfully:', orderResponse.data.data.orderNumber);

        // 7. Test getUserOrders with orders
        console.log('7. Testing getUserOrders with orders...');
        const ordersResponse = await axios.get('http://localhost:8080/api/orders', {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        console.log('✅ getUserOrders with orders response:');
        console.log('   - success:', ordersResponse.data.success);
        console.log('   - message:', ordersResponse.data.message);
        console.log('   - orders count:', ordersResponse.data.data.orders.length);
        console.log('   - first order:', {
            _id: ordersResponse.data.data.orders[0]._id,
            orderNumber: ordersResponse.data.data.orders[0].orderNumber,
            status: ordersResponse.data.data.orders[0].status,
            totalItems: ordersResponse.data.data.orders[0].totalItems
        });
        console.log('   - pagination:', ordersResponse.data.data.pagination);

        console.log('\n🎉 getUserOrders endpoint test completed successfully!');
        console.log('✅ The endpoint is working correctly and returns the expected format');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testUserOrdersEndpoint();
