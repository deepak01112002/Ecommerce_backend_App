const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testOrderTotalFix() {
    try {
        console.log('🧪 Testing Order Total Amount Fix...\n');

        // Step 1: Register a test user
        console.log('1. Registering test user...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'OrderUser',
            email: `testorder${Date.now()}@example.com`,
            password: 'password123',
            phone: '9876543210'
        });

        const userToken = registerResponse.data.data.token;
        console.log('✅ User registered successfully');

        // Step 2: Get a product with price
        console.log('\n2. Getting product with price...');
        const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`);
        const product = productsResponse.data.data.products[0];
        console.log(`✅ Product found: ${product.name} - Price: ₹${product.price}`);

        // Step 3: Add product to cart
        console.log('\n3. Adding product to cart...');
        await axios.post(`${BASE_URL}/cart/add`, {
            productId: product._id,
            quantity: 2
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('✅ Product added to cart');

        // Step 4: Create address
        console.log('\n4. Creating shipping address...');
        const addressResponse = await axios.post(`${BASE_URL}/addresses`, {
            firstName: 'Test',
            lastName: 'User',
            phone: '9876543210',
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456',
            country: 'India',
            isDefault: true
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const addressId = addressResponse.data.data.address._id;
        console.log('✅ Address created');

        // Step 5: Create order
        console.log('\n5. Creating order...');
        const orderResponse = await axios.post(`${BASE_URL}/orders`, {
            addressId: addressId,
            paymentInfo: {
                method: 'cod'
            }
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        const order = orderResponse.data.data.order;
        console.log(`✅ Order created: ${order.orderNumber}`);
        console.log(`   Total: ₹${order.pricing.total}`);
        console.log(`   Items: ${order.items.length}`);
        console.log(`   Item Price: ₹${order.items[0].unitPrice}`);
        console.log(`   Item Total: ₹${order.items[0].totalPrice}`);

        // Step 6: Verify order in admin panel
        console.log('\n6. Verifying order in admin panel...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@ghanshyambhandar.com',
            password: 'admin123'
        });
        const adminToken = adminLoginResponse.data.data.token;

        const adminOrderResponse = await axios.get(`${BASE_URL}/orders/admin/all?limit=1`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const adminOrder = adminOrderResponse.data.data.orders[0];
        console.log(`✅ Admin panel order verification:`);
        console.log(`   Order Number: ${adminOrder.orderNumber}`);
        console.log(`   Total: ₹${adminOrder.total}`);
        console.log(`   Pricing Total: ₹${adminOrder.pricing.total}`);
        console.log(`   Item Price: ₹${adminOrder.items[0].price}`);
        console.log(`   Item Subtotal: ₹${adminOrder.items[0].subtotal}`);

        // Check if fix worked
        if (adminOrder.total > 0 && adminOrder.items[0].price > 0) {
            console.log('\n🎉 SUCCESS: Order total amount fix is working!');
            console.log(`   ✅ Order total: ₹${adminOrder.total}`);
            console.log(`   ✅ Item price: ₹${adminOrder.items[0].price}`);
        } else {
            console.log('\n❌ ISSUE: Order total amount is still showing as 0');
            console.log(`   Total: ₹${adminOrder.total}`);
            console.log(`   Item Price: ₹${adminOrder.items[0].price}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testOrderTotalFix();
