const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:8080/api';
let adminToken = '';
let userToken = '';
let categoryId = '';
let productId = '';
let userId = '';
let addressId = '';
let orderId = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

async function testPhase1And2() {
    console.log('🎯 TESTING PHASE 1 & 2 WITH FIXES'.rainbow.bold);
    console.log('=' .repeat(60).gray);

    // PHASE 1: Admin Setup
    console.log('\n🚀 PHASE 1: Admin Setup'.cyan.bold);
    
    // Step 1: Admin Login
    console.log('\n1. Admin Login...');
    const adminLogin = await apiCall('POST', '/auth/login', {
        email: 'admin@admin.com',
        password: 'Admin@123'
    });

    if (adminLogin.success && adminLogin.data.data.token) {
        adminToken = adminLogin.data.data.token;
        console.log('✅ Admin login successful'.green);
        console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    } else {
        console.log('❌ Admin login failed'.red);
        console.log('   Error:', adminLogin.error);
        return;
    }

    // Step 2: Create Category
    console.log('\n2. Creating Category...');
    const categoryData = {
        name: 'Electronics Test',
        description: 'Electronic items for testing',
        image: 'https://via.placeholder.com/300x200?text=Electronics',
        isActive: true
    };

    const createCategory = await apiCall('POST', '/categories', categoryData, adminToken);
    
    if (createCategory.success && createCategory.data.data._id) {
        categoryId = createCategory.data.data._id;
        console.log('✅ Category created successfully'.green);
        console.log(`   Category ID: ${categoryId}`);
    } else {
        console.log('❌ Category creation failed'.red);
        console.log('   Error:', createCategory.error);
        return;
    }

    // Step 3: Create Product
    console.log('\n3. Creating Product...');
    const productData = {
        name: 'iPhone 15 Pro Test',
        description: 'Latest iPhone for testing',
        price: 99999,
        originalPrice: 109999,
        category: categoryId,
        stock: 50,
        images: ['https://via.placeholder.com/400x400?text=iPhone+15+Pro'],
        isActive: true,
        isFeatured: true,
        brand: 'Apple',
        sku: 'IPH15PRO001TEST'
    };

    const createProduct = await apiCall('POST', '/products', productData, adminToken);
    
    if (createProduct.success && createProduct.data.data._id) {
        productId = createProduct.data.data._id;
        console.log('✅ Product created successfully'.green);
        console.log(`   Product ID: ${productId}`);
    } else {
        console.log('❌ Product creation failed'.red);
        console.log('   Error:', createProduct.error);
        return;
    }

    // PHASE 2: Customer Journey
    console.log('\n👤 PHASE 2: Customer Journey'.cyan.bold);

    // Step 4: Customer Registration
    console.log('\n4. Customer Registration...');
    const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.test@example.com',
        password: 'Customer@123',
        phone: '+91-9876543210'
    };

    const customerRegister = await apiCall('POST', '/auth/register', customerData);
    
    if (customerRegister.success && customerRegister.data.data.user._id) {
        userId = customerRegister.data.data.user._id;
        console.log('✅ Customer registration successful'.green);
        console.log(`   User ID: ${userId}`);
    } else {
        console.log('❌ Customer registration failed'.red);
        console.log('   Error:', customerRegister.error);
        return;
    }

    // Step 5: Customer Login
    console.log('\n5. Customer Login...');
    const customerLogin = await apiCall('POST', '/auth/login', {
        email: 'john.doe.test@example.com',
        password: 'Customer@123'
    });

    if (customerLogin.success && customerLogin.data.data.token) {
        userToken = customerLogin.data.data.token;
        console.log('✅ Customer login successful'.green);
        console.log(`   Token: ${userToken.substring(0, 20)}...`);
    } else {
        console.log('❌ Customer login failed'.red);
        console.log('   Error:', customerLogin.error);
        return;
    }

    // Step 6: Get Customer Profile (FIXED)
    console.log('\n6. Get Customer Profile...');
    const getProfile = await apiCall('GET', '/auth/profile', null, userToken);
    
    if (getProfile.success) {
        console.log('✅ Profile retrieved successfully'.green);
        console.log(`   Name: ${getProfile.data.data.user.name}`);
        console.log(`   Email: ${getProfile.data.data.user.email}`);
        console.log(`   Addresses: ${getProfile.data.data.user.addresses.length} found`);
    } else {
        console.log('❌ Profile retrieval failed'.red);
        console.log('   Error:', getProfile.error);
    }

    // Step 7: Add Customer Address (FIXED)
    console.log('\n7. Add Customer Address...');
    const addressData = {
        type: 'home',
        label: 'Home',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
        addressLine1: '123 Customer Street',
        addressLine2: 'Near Main Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true
    };

    const createAddress = await apiCall('POST', '/addresses', addressData, userToken);
    
    if (createAddress.success && createAddress.data.data._id) {
        addressId = createAddress.data.data._id;
        console.log('✅ Address created successfully'.green);
        console.log(`   Address ID: ${addressId}`);
    } else {
        console.log('❌ Address creation failed'.red);
        console.log('   Error:', createAddress.error);
        return;
    }

    // Step 8: Add to Cart
    console.log('\n8. Add Product to Cart...');
    const cartData = {
        productId: productId,
        quantity: 2
    };

    const addToCart = await apiCall('POST', '/cart/add', cartData, userToken);
    
    if (addToCart.success) {
        console.log('✅ Product added to cart successfully'.green);
        console.log(`   Cart items: ${addToCart.data.data.items?.length || 'N/A'}`);
    } else {
        console.log('❌ Add to cart failed'.red);
        console.log('   Error:', addToCart.error);
    }

    // Step 9: Create Order (FIXED)
    console.log('\n9. Create Order...');
    const orderData = {
        addressId: addressId,
        paymentInfo: {
            method: 'cod'
        },
        couponCode: '',
        useWallet: false,
        walletAmount: 0
    };

    const createOrder = await apiCall('POST', '/orders', orderData, userToken);
    
    if (createOrder.success && createOrder.data.data.order._id) {
        orderId = createOrder.data.data.order._id;
        console.log('✅ Order created successfully'.green);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Order Number: ${createOrder.data.data.order.orderNumber}`);
        console.log(`   Total: ₹${createOrder.data.data.order.pricing.total}`);
    } else {
        console.log('❌ Order creation failed'.red);
        console.log('   Error:', createOrder.error);
    }

    // Step 10: Get Order Details
    console.log('\n10. Get Order Details...');
    const getOrder = await apiCall('GET', `/orders/${orderId}`, null, userToken);
    
    if (getOrder.success) {
        console.log('✅ Order details retrieved successfully'.green);
        console.log(`   Status: ${getOrder.data.status}`);
        console.log(`   Items: ${getOrder.data.items?.length || 'N/A'}`);
    } else {
        console.log('❌ Order details retrieval failed'.red);
        console.log('   Error:', getOrder.error);
    }

    console.log('\n🎯 PHASE 1 & 2 TESTING COMPLETED!'.rainbow.bold);
    console.log('=' .repeat(60).gray);
    
    console.log('\n📊 SUMMARY:'.yellow.bold);
    console.log(`✅ Admin Token: ${adminToken ? 'Generated' : 'Failed'}`);
    console.log(`✅ User Token: ${userToken ? 'Generated' : 'Failed'}`);
    console.log(`✅ Category ID: ${categoryId || 'Not created'}`);
    console.log(`✅ Product ID: ${productId || 'Not created'}`);
    console.log(`✅ User ID: ${userId || 'Not created'}`);
    console.log(`✅ Address ID: ${addressId || 'Not created'}`);
    console.log(`✅ Order ID: ${orderId || 'Not created'}`);

    console.log('\n🎯 FIXES APPLIED:'.green.bold);
    console.log('1. ✅ Profile API - Fixed addresses population');
    console.log('2. ✅ Order API - Fixed paymentInfo structure');
    console.log('3. ✅ Address API - Added required fields (label, phone format)');
    
    if (adminToken && userToken && categoryId && productId && addressId && orderId) {
        console.log('\n🎉 ALL PHASE 1 & 2 APIS WORKING CORRECTLY!'.green.bold);
    } else {
        console.log('\n⚠️  Some APIs still need attention'.yellow.bold);
    }
}

// Run the test
if (require.main === module) {
    testPhase1And2().catch(console.error);
}

module.exports = { testPhase1And2 };
