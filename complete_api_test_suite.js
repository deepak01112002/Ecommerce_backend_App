// COMPLETE API TEST SUITE - ALL ENDPOINTS
const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Test data storage
let testData = {
    userToken: '',
    adminToken: '',
    userId: '',
    productId: '',
    categoryId: '',
    subcategoryId: '',
    orderId: '',
    addressId: '',
    cartId: '',
    couponId: '',
    reviewId: '',
    wishlistId: '',
    walletId: '',
    invoiceId: '',
    returnId: '',
    supportTicketId: '',
    notificationId: ''
};

// Helper function to log test results
function logTest(testName, success, details = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   ${details}`);
    
    testResults.tests.push({ name: testName, success, details });
    if (success) testResults.passed++;
    else testResults.failed++;
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers,
            ...(data && { data })
        };
        
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

async function runCompleteAPITests() {
    console.log('🚀 COMPLETE API TEST SUITE - ALL ENDPOINTS\n');
    
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPhone = `9${timestamp.toString().slice(-9)}`;
    const adminEmail = 'admin@ghanshyambhandar.com';
    const adminPassword = 'admin123';

    try {
        // ==================== AUTHENTICATION APIS ====================
        console.log('🔐 AUTHENTICATION APIS (6 endpoints)');
        
        // 1. User Registration
        const registerResult = await apiCall('POST', '/auth/register', {
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            password: 'password123',
            phone: testPhone
        });
        logTest('POST /auth/register', registerResult.success, 
            registerResult.success ? `User registered: ${registerResult.data.data.user._id}` : registerResult.error.message);
        
        if (registerResult.success) {
            testData.userId = registerResult.data.data.user._id;
        }

        // 2. User Login
        const loginResult = await apiCall('POST', '/auth/login', {
            email: testEmail,
            password: 'password123'
        });
        logTest('POST /auth/login', loginResult.success,
            loginResult.success ? 'User token received' : loginResult.error.message);
        
        if (loginResult.success) {
            testData.userToken = loginResult.data.data.token;
        }

        // 3. Admin Login
        const adminLoginResult = await apiCall('POST', '/auth/login', {
            email: adminEmail,
            password: adminPassword
        });
        logTest('POST /auth/login (Admin)', adminLoginResult.success,
            adminLoginResult.success ? 'Admin token received' : adminLoginResult.error.message);
        
        if (adminLoginResult.success) {
            testData.adminToken = adminLoginResult.data.data.token;
        }

        // 4. Get User Profile
        const profileResult = await apiCall('GET', '/auth/profile', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /auth/profile', profileResult.success,
            profileResult.success ? `Profile: ${profileResult.data.data.firstName} ${profileResult.data.data.lastName}` : profileResult.error.message);

        // 5. Update Profile
        const updateProfileResult = await apiCall('PUT', '/auth/profile', {
            firstName: 'Updated',
            lastName: 'User'
        }, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('PUT /auth/profile', updateProfileResult.success,
            updateProfileResult.success ? 'Profile updated' : updateProfileResult.error.message);

        // 6. Logout
        const logoutResult = await apiCall('POST', '/auth/logout', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /auth/logout', logoutResult.success,
            logoutResult.success ? 'User logged out' : logoutResult.error.message);

        // ==================== CATEGORY APIS ====================
        console.log('\n📂 CATEGORY APIS (4 endpoints)');
        
        // 7. Get All Categories
        const categoriesResult = await apiCall('GET', '/categories');
        logTest('GET /categories', categoriesResult.success,
            categoriesResult.success ? `Found ${categoriesResult.data.data.length} categories` : categoriesResult.error.message);
        
        if (categoriesResult.success && categoriesResult.data.data.length > 0) {
            testData.categoryId = categoriesResult.data.data[0]._id;
        }

        // 8. Get Single Category
        if (testData.categoryId) {
            const categoryResult = await apiCall('GET', `/categories/${testData.categoryId}`);
            logTest('GET /categories/:id', categoryResult.success,
                categoryResult.success ? `Category: ${categoryResult.data.data.name}` : categoryResult.error.message);
        }

        // 9. Create Category (Admin)
        const createCategoryResult = await apiCall('POST', '/categories', {
            name: `Test Category ${timestamp}`,
            description: 'Test category description',
            isActive: true
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /categories (Admin)', createCategoryResult.success,
            createCategoryResult.success ? `Category created: ${createCategoryResult.data.data._id}` : createCategoryResult.error.message);

        // 10. Update Category (Admin)
        if (createCategoryResult.success) {
            const updateCategoryResult = await apiCall('PUT', `/categories/${createCategoryResult.data.data._id}`, {
                name: `Updated Test Category ${timestamp}`,
                description: 'Updated test category description'
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /categories/:id (Admin)', updateCategoryResult.success,
                updateCategoryResult.success ? 'Category updated' : updateCategoryResult.error.message);
        }

        // ==================== SUBCATEGORY APIS ====================
        console.log('\n📁 SUBCATEGORY APIS (4 endpoints)');

        // 11. Get Subcategories
        const subcategoriesResult = await apiCall('GET', '/subcategories');
        logTest('GET /subcategories', subcategoriesResult.success,
            subcategoriesResult.success ? `Found ${subcategoriesResult.data.data.length} subcategories` : subcategoriesResult.error.message);

        // 12. Create Subcategory (Admin)
        if (testData.categoryId) {
            const createSubcategoryResult = await apiCall('POST', '/subcategories', {
                name: `Test Subcategory ${timestamp}`,
                description: 'Test subcategory description',
                category: testData.categoryId,
                isActive: true
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('POST /subcategories (Admin)', createSubcategoryResult.success,
                createSubcategoryResult.success ? `Subcategory created: ${createSubcategoryResult.data.data._id}` : createSubcategoryResult.error.message);

            if (createSubcategoryResult.success) {
                testData.subcategoryId = createSubcategoryResult.data.data._id;
            }
        }

        // 13. Get Single Subcategory
        if (testData.subcategoryId) {
            const subcategoryResult = await apiCall('GET', `/subcategories/${testData.subcategoryId}`);
            logTest('GET /subcategories/:id', subcategoryResult.success,
                subcategoryResult.success ? `Subcategory: ${subcategoryResult.data.data.name}` : subcategoryResult.error.message);
        }

        // 14. Update Subcategory (Admin)
        if (testData.subcategoryId) {
            const updateSubcategoryResult = await apiCall('PUT', `/subcategories/${testData.subcategoryId}`, {
                name: `Updated Test Subcategory ${timestamp}`,
                description: 'Updated test subcategory description'
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /subcategories/:id (Admin)', updateSubcategoryResult.success,
                updateSubcategoryResult.success ? 'Subcategory updated' : updateSubcategoryResult.error.message);
        }

        // ==================== PRODUCT APIS ====================
        console.log('\n🛍️ PRODUCT APIS (8 endpoints)');

        // 15. Get All Products
        const productsResult = await apiCall('GET', '/products');
        logTest('GET /products', productsResult.success,
            productsResult.success ? `Found ${productsResult.data.data.products.length} products` : productsResult.error.message);

        if (productsResult.success && productsResult.data.data.products.length > 0) {
            testData.productId = productsResult.data.data.products[0]._id;
        }

        // 16. Get Single Product
        if (testData.productId) {
            const productResult = await apiCall('GET', `/products/${testData.productId}`);
            logTest('GET /products/:id', productResult.success,
                productResult.success ? `Product: ${productResult.data.data.name}` : productResult.error.message);
        }

        // 17. Search Products
        const searchResult = await apiCall('GET', '/products?search=test');
        logTest('GET /products?search=test', searchResult.success,
            searchResult.success ? `Search returned ${searchResult.data.data.products.length} results` : searchResult.error.message);

        // 18. Filter Products by Category
        if (testData.categoryId) {
            const filterResult = await apiCall('GET', `/products?category=${testData.categoryId}`);
            logTest('GET /products?category=:id', filterResult.success,
                filterResult.success ? `Filter returned ${filterResult.data.data.products.length} results` : filterResult.error.message);
        }

        // 19. Create Product (Admin)
        const createProductResult = await apiCall('POST', '/products', {
            name: `Test Product ${timestamp}`,
            description: 'Test product description',
            price: 999,
            category: testData.categoryId,
            subcategory: testData.subcategoryId,
            stock: 100,
            isActive: true,
            specifications: {
                height: '10cm',
                weight: '500g',
                material: 'Test Material'
            }
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /products (Admin)', createProductResult.success,
            createProductResult.success ? `Product created: ${createProductResult.data.data._id}` : createProductResult.error.message);

        // 20. Update Product (Admin)
        if (createProductResult.success) {
            const updateProductResult = await apiCall('PUT', `/products/${createProductResult.data.data._id}`, {
                name: `Updated Test Product ${timestamp}`,
                price: 1299
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /products/:id (Admin)', updateProductResult.success,
                updateProductResult.success ? 'Product updated' : updateProductResult.error.message);
        }

        // 21. Get Featured Products
        const featuredResult = await apiCall('GET', '/products/featured');
        logTest('GET /products/featured', featuredResult.success,
            featuredResult.success ? `Found ${featuredResult.data.data.length} featured products` : featuredResult.error.message);

        // 22. Get Product Reviews
        if (testData.productId) {
            const reviewsResult = await apiCall('GET', `/products/${testData.productId}/reviews`);
            logTest('GET /products/:id/reviews', reviewsResult.success,
                reviewsResult.success ? `Found ${reviewsResult.data.data.length} reviews` : reviewsResult.error.message);
        }

        // ==================== ADDRESS APIS ====================
        console.log('\n🏠 ADDRESS APIS (5 endpoints)');

        // 23. Add Address
        const addAddressResult = await apiCall('POST', '/addresses', {
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
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /addresses', addAddressResult.success,
            addAddressResult.success ? `Address created: ${addAddressResult.data.data._id}` : addAddressResult.error.message);

        if (addAddressResult.success) {
            testData.addressId = addAddressResult.data.data._id;
        }

        // 24. Get User Addresses
        const addressesResult = await apiCall('GET', '/addresses', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /addresses', addressesResult.success,
            addressesResult.success ? `Found ${addressesResult.data.data.length} addresses` : addressesResult.error.message);

        // 25. Get Single Address
        if (testData.addressId) {
            const addressResult = await apiCall('GET', `/addresses/${testData.addressId}`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('GET /addresses/:id', addressResult.success,
                addressResult.success ? `Address: ${addressResult.data.data.addressLine1}` : addressResult.error.message);
        }

        // 26. Update Address
        if (testData.addressId) {
            const updateAddressResult = await apiCall('PUT', `/addresses/${testData.addressId}`, {
                addressLine1: '456 Updated Street',
                city: 'Updated City'
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('PUT /addresses/:id', updateAddressResult.success,
                updateAddressResult.success ? 'Address updated' : updateAddressResult.error.message);
        }

        // 27. Delete Address
        if (testData.addressId) {
            const deleteAddressResult = await apiCall('DELETE', `/addresses/${testData.addressId}`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('DELETE /addresses/:id', deleteAddressResult.success,
                deleteAddressResult.success ? 'Address deleted' : deleteAddressResult.error.message);
        }

        // ==================== CART APIS ====================
        console.log('\n🛒 CART APIS (6 endpoints)');

        // 28. Add to Cart
        if (testData.productId) {
            const addToCartResult = await apiCall('POST', '/cart/add', {
                productId: testData.productId,
                quantity: 2
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('POST /cart/add', addToCartResult.success,
                addToCartResult.success ? 'Added 2 items to cart' : addToCartResult.error.message);
        }

        // 29. Get Cart
        const cartResult = await apiCall('GET', '/cart', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /cart', cartResult.success,
            cartResult.success ? `Cart has ${cartResult.data.data.items?.length || 0} items` : cartResult.error.message);

        // 30. Update Cart Item
        if (testData.productId) {
            const updateCartResult = await apiCall('PUT', '/cart/update', {
                productId: testData.productId,
                quantity: 3
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('PUT /cart/update', updateCartResult.success,
                updateCartResult.success ? 'Cart item updated' : updateCartResult.error.message);
        }

        // 31. Remove from Cart
        if (testData.productId) {
            const removeCartResult = await apiCall('DELETE', `/cart/remove/${testData.productId}`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('DELETE /cart/remove/:productId', removeCartResult.success,
                removeCartResult.success ? 'Item removed from cart' : removeCartResult.error.message);
        }

        // 32. Clear Cart
        const clearCartResult = await apiCall('DELETE', '/cart/clear', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('DELETE /cart/clear', clearCartResult.success,
            clearCartResult.success ? 'Cart cleared' : clearCartResult.error.message);

        // 33. Get Cart Count
        const cartCountResult = await apiCall('GET', '/cart/count', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /cart/count', cartCountResult.success,
            cartCountResult.success ? `Cart count: ${cartCountResult.data.data.count}` : cartCountResult.error.message);

        // ==================== ORDER APIS ====================
        console.log('\n📦 ORDER APIS (8 endpoints)');

        // Re-add item to cart for order creation
        if (testData.productId) {
            await apiCall('POST', '/cart/add', {
                productId: testData.productId,
                quantity: 1
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
        }

        // Re-add address for order creation
        const reAddAddressResult = await apiCall('POST', '/addresses', {
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
            Authorization: `Bearer ${testData.userToken}`
        });

        if (reAddAddressResult.success) {
            testData.addressId = reAddAddressResult.data.data._id;
        }

        // 34. Create Order
        if (testData.addressId && testData.productId) {
            const createOrderResult = await apiCall('POST', '/orders', {
                items: [{
                    product: testData.productId,
                    quantity: 1,
                    unitPrice: 500
                }],
                shippingAddress: testData.addressId,
                paymentMethod: 'cod',
                notes: 'Test order from complete API test'
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('POST /orders', createOrderResult.success,
                createOrderResult.success ? `Order created: ${createOrderResult.data.data.orderNumber}` : createOrderResult.error.message);

            if (createOrderResult.success) {
                testData.orderId = createOrderResult.data.data._id;
            }
        }

        // 35. Get User Orders
        const userOrdersResult = await apiCall('GET', '/orders', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /orders', userOrdersResult.success,
            userOrdersResult.success ? `Found ${userOrdersResult.data.data.orders.length} orders` : userOrdersResult.error.message);

        // 36. Get Single Order
        if (testData.orderId) {
            const orderResult = await apiCall('GET', `/orders/${testData.orderId}`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('GET /orders/:id', orderResult.success,
                orderResult.success ? `Order: ${orderResult.data.data.orderNumber}` : orderResult.error.message);
        }

        // 37. Track Order
        if (testData.orderId) {
            const trackResult = await apiCall('GET', `/orders/${testData.orderId}/track`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('GET /orders/:id/track', trackResult.success,
                trackResult.success ? 'Order tracking retrieved' : trackResult.error.message);
        }

        // 38. Cancel Order
        if (testData.orderId) {
            const cancelResult = await apiCall('PATCH', `/orders/${testData.orderId}/cancel`, null, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('PATCH /orders/:id/cancel', cancelResult.success,
                cancelResult.success ? 'Order cancelled' : cancelResult.error.message);
        }

        // 39. Admin Get All Orders
        const adminOrdersResult = await apiCall('GET', '/orders/admin/all', null, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('GET /orders/admin/all', adminOrdersResult.success,
            adminOrdersResult.success ? `Found ${adminOrdersResult.data.data.orders.length} orders` : adminOrdersResult.error.message);

        // 40. Admin Update Order Status
        if (testData.orderId) {
            const updateStatusResult = await apiCall('PATCH', `/orders/admin/${testData.orderId}/status`, {
                status: 'processing'
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PATCH /orders/admin/:id/status', updateStatusResult.success,
                updateStatusResult.success ? 'Order status updated' : updateStatusResult.error.message);
        }

        // 41. Admin Update Order
        if (testData.orderId) {
            const updateOrderResult = await apiCall('PUT', `/orders/admin/${testData.orderId}`, {
                notes: { internal: 'Updated by admin test' }
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /orders/admin/:id', updateOrderResult.success,
                updateOrderResult.success ? 'Order updated by admin' : updateOrderResult.error.message);
        }

        // ==================== PAYMENT APIS ====================
        console.log('\n💳 PAYMENT APIS (6 endpoints)');

        // 42. Get Payment Methods
        const paymentMethodsResult = await apiCall('GET', '/payments/methods');
        logTest('GET /payments/methods', paymentMethodsResult.success,
            paymentMethodsResult.success ? 'Payment methods retrieved' : paymentMethodsResult.error.message);

        // 43. Create Payment
        const createPaymentResult = await apiCall('POST', '/payments/create', {
            amount: 1000,
            currency: 'INR',
            orderId: testData.orderId
        }, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /payments/create', createPaymentResult.success,
            createPaymentResult.success ? 'Payment created' : createPaymentResult.error.message);

        // 44. Verify Payment
        const verifyPaymentResult = await apiCall('POST', '/payments/verify', {
            razorpay_order_id: 'test_order_id',
            razorpay_payment_id: 'test_payment_id',
            razorpay_signature: 'test_signature'
        }, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /payments/verify', verifyPaymentResult.success,
            verifyPaymentResult.success ? 'Payment verified' : verifyPaymentResult.error.message);

        // 45. Get Payment Details
        const paymentDetailsResult = await apiCall('GET', '/payments/test_payment_id', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /payments/:id', paymentDetailsResult.success,
            paymentDetailsResult.success ? 'Payment details retrieved' : paymentDetailsResult.error.message);

        // 46. Process Refund
        const refundResult = await apiCall('POST', '/payments/refund', {
            paymentId: 'test_payment_id',
            amount: 500,
            reason: 'Test refund'
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /payments/refund', refundResult.success,
            refundResult.success ? 'Refund processed' : refundResult.error.message);

        // 47. Payment Webhook
        const webhookResult = await apiCall('POST', '/payments/webhook', {
            event: 'payment.captured',
            payload: { payment: { id: 'test_payment_id' } }
        });
        logTest('POST /payments/webhook', webhookResult.success,
            webhookResult.success ? 'Webhook processed' : webhookResult.error.message);

        // ==================== COUPON APIS ====================
        console.log('\n🎫 COUPON APIS (6 endpoints)');

        // 48. Get All Coupons
        const couponsResult = await apiCall('GET', '/coupons');
        logTest('GET /coupons', couponsResult.success,
            couponsResult.success ? `Found ${couponsResult.data.data.length} coupons` : couponsResult.error.message);

        // 49. Create Coupon (Admin)
        const createCouponResult = await apiCall('POST', '/coupons', {
            code: `TEST${timestamp}`,
            type: 'percentage',
            value: 10,
            minOrderAmount: 500,
            maxDiscount: 100,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /coupons (Admin)', createCouponResult.success,
            createCouponResult.success ? `Coupon created: ${createCouponResult.data.data.code}` : createCouponResult.error.message);

        if (createCouponResult.success) {
            testData.couponId = createCouponResult.data.data._id;
        }

        // 50. Validate Coupon
        if (createCouponResult.success) {
            const validateCouponResult = await apiCall('POST', '/coupons/validate', {
                code: createCouponResult.data.data.code,
                orderAmount: 1000
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('POST /coupons/validate', validateCouponResult.success,
                validateCouponResult.success ? 'Coupon validated' : validateCouponResult.error.message);
        }

        // 51. Apply Coupon
        if (createCouponResult.success) {
            const applyCouponResult = await apiCall('POST', '/coupons/apply', {
                code: createCouponResult.data.data.code,
                orderId: testData.orderId
            }, {
                Authorization: `Bearer ${testData.userToken}`
            });
            logTest('POST /coupons/apply', applyCouponResult.success,
                applyCouponResult.success ? 'Coupon applied' : applyCouponResult.error.message);
        }

        // 52. Update Coupon (Admin)
        if (testData.couponId) {
            const updateCouponResult = await apiCall('PUT', `/coupons/${testData.couponId}`, {
                value: 15,
                maxDiscount: 150
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /coupons/:id (Admin)', updateCouponResult.success,
                updateCouponResult.success ? 'Coupon updated' : updateCouponResult.error.message);
        }

        // 53. Delete Coupon (Admin)
        if (testData.couponId) {
            const deleteCouponResult = await apiCall('DELETE', `/coupons/${testData.couponId}`, null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('DELETE /coupons/:id (Admin)', deleteCouponResult.success,
                deleteCouponResult.success ? 'Coupon deleted' : deleteCouponResult.error.message);
        }

        // ==================== ADMIN DASHBOARD APIS ====================
        console.log('\n📊 ADMIN DASHBOARD APIS (2 endpoints)');

        // 54. Get Admin Dashboard
        const dashboardResult = await apiCall('GET', '/admin/dashboard', null, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('GET /admin/dashboard', dashboardResult.success,
            dashboardResult.success ? `Dashboard loaded with ${dashboardResult.data.data.dashboard.recentOrders.length} recent orders` : dashboardResult.error.message);

        // 55. Get Quick Stats
        const quickStatsResult = await apiCall('GET', '/admin/dashboard/quick-stats', null, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('GET /admin/dashboard/quick-stats', quickStatsResult.success,
            quickStatsResult.success ? 'Quick stats retrieved' : quickStatsResult.error.message);

        // ==================== ADMIN MANAGEMENT APIS ====================
        console.log('\n👥 ADMIN MANAGEMENT APIS (4 endpoints)');

        // 56. Get All Users (Admin)
        const usersResult = await apiCall('GET', '/admin/management/users', null, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('GET /admin/management/users', usersResult.success,
            usersResult.success ? `Found ${usersResult.data.data.users.length} users` : usersResult.error.message);

        // 57. Get User Details (Admin)
        if (testData.userId) {
            const userDetailsResult = await apiCall('GET', `/admin/management/users/${testData.userId}`, null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('GET /admin/management/users/:id', userDetailsResult.success,
                userDetailsResult.success ? `User details: ${userDetailsResult.data.data.user.firstName} ${userDetailsResult.data.data.user.lastName}` : userDetailsResult.error.message);
        }

        // 58. Update User (Admin)
        if (testData.userId) {
            const updateUserResult = await apiCall('PUT', `/admin/management/users/${testData.userId}`, {
                isActive: true,
                role: 'user'
            }, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('PUT /admin/management/users/:id', updateUserResult.success,
                updateUserResult.success ? 'User updated by admin' : updateUserResult.error.message);
        }

        // 59. Delete User (Admin)
        if (testData.userId) {
            const deleteUserResult = await apiCall('DELETE', `/admin/management/users/${testData.userId}`, null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('DELETE /admin/management/users/:id', deleteUserResult.success,
                deleteUserResult.success ? 'User deleted by admin' : deleteUserResult.error.message);
        }

        // ==================== WALLET APIS ====================
        console.log('\n💰 WALLET APIS (4 endpoints)');

        // 60. Get Wallet Balance
        const walletResult = await apiCall('GET', '/wallet', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /wallet', walletResult.success,
            walletResult.success ? `Wallet balance: ₹${walletResult.data.data.balance}` : walletResult.error.message);

        // 61. Add Money to Wallet
        const addMoneyResult = await apiCall('POST', '/wallet/add', {
            amount: 1000,
            paymentMethod: 'razorpay'
        }, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /wallet/add', addMoneyResult.success,
            addMoneyResult.success ? 'Money added to wallet' : addMoneyResult.error.message);

        // 62. Get Wallet Transactions
        const transactionsResult = await apiCall('GET', '/wallet/transactions', null, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('GET /wallet/transactions', transactionsResult.success,
            transactionsResult.success ? `Found ${transactionsResult.data.data.transactions.length} transactions` : transactionsResult.error.message);

        // 63. Use Wallet for Payment
        const useWalletResult = await apiCall('POST', '/wallet/use', {
            amount: 500,
            orderId: testData.orderId
        }, {
            Authorization: `Bearer ${testData.userToken}`
        });
        logTest('POST /wallet/use', useWalletResult.success,
            useWalletResult.success ? 'Wallet used for payment' : useWalletResult.error.message);

        // ==================== QR CODE APIS ====================
        console.log('\n📱 QR CODE APIS (4 endpoints)');

        // 64. Generate Product QR Code
        if (testData.productId) {
            const productQRResult = await apiCall('GET', `/qr-codes/product/${testData.productId}`, null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('GET /qr-codes/product/:id', productQRResult.success,
                productQRResult.success ? 'Product QR code generated' : productQRResult.error.message);
        }

        // 65. Generate Category QR Code
        if (testData.categoryId) {
            const categoryQRResult = await apiCall('GET', `/qr-codes/category/${testData.categoryId}`, null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            logTest('GET /qr-codes/category/:id', categoryQRResult.success,
                categoryQRResult.success ? 'Category QR code generated' : categoryQRResult.error.message);
        }

        // 66. Bulk Generate Product QR Codes
        const bulkProductQRResult = await apiCall('POST', '/qr-codes/products/bulk', {
            productIds: testData.productId ? [testData.productId] : []
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /qr-codes/products/bulk', bulkProductQRResult.success,
            bulkProductQRResult.success ? 'Bulk product QR codes generated' : bulkProductQRResult.error.message);

        // 67. Bulk Generate Category QR Codes
        const bulkCategoryQRResult = await apiCall('POST', '/qr-codes/categories/bulk', {
            categoryIds: testData.categoryId ? [testData.categoryId] : []
        }, {
            Authorization: `Bearer ${testData.adminToken}`
        });
        logTest('POST /qr-codes/categories/bulk', bulkCategoryQRResult.success,
            bulkCategoryQRResult.success ? 'Bulk category QR codes generated' : bulkCategoryQRResult.error.message);

        // ==================== FINAL RESULTS ====================
        console.log('\n🎯 COMPLETE API TEST RESULTS:');
        console.log('='.repeat(50));
        console.log(`✅ PASSED: ${testResults.passed}`);
        console.log(`❌ FAILED: ${testResults.failed}`);
        console.log(`📊 TOTAL TESTS: ${testResults.passed + testResults.failed}`);
        console.log(`📈 SUCCESS RATE: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));

        if (testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            testResults.tests.filter(t => !t.success).forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}`);
                console.log(`   Error: ${test.details}`);
            });
        }

        console.log('\n🎉 COMPLETE API TEST SUITE FINISHED!');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

runCompleteAPITests();
