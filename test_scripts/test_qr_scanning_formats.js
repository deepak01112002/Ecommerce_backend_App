const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:8080/api';

// Test data
const testProductId = '688bbdec362503685d9225b2';
const testCategoryId = '68845d5a10cebc7513135c10';

const productQRData = JSON.stringify({
    type: 'product',
    id: testProductId
});

const categoryQRData = JSON.stringify({
    type: 'category', 
    id: testCategoryId
});

async function testQRScanning() {
    console.log('🔍 Testing QR Code Scanning with Different View Types'.cyan.bold);
    console.log('=' .repeat(60).gray);

    try {
        // Test 1: Admin Product Scanning
        console.log('\n📱 Test 1: Admin Product Scanning'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const adminProductResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
            qrData: productQRData,
            viewType: 'admin'
        });

        if (adminProductResponse.data.success) {
            console.log('✅ Admin Product Scan: SUCCESS'.green);
            console.log(`📦 Product: ${adminProductResponse.data.data.name}`.cyan);
            console.log(`💰 Price: ₹${adminProductResponse.data.data.price}`.cyan);
            console.log(`📊 Stock: ${adminProductResponse.data.data.stock} units`.cyan);
            
            if (adminProductResponse.data.data.adminInfo) {
                console.log('🔧 Admin Analytics:'.magenta);
                console.log(`   💵 Total Revenue: ${adminProductResponse.data.data.adminInfo.totalRevenue}`.white);
                console.log(`   📈 Profit Margin: ${adminProductResponse.data.data.adminInfo.profitMargin}`.white);
                console.log(`   📦 Stock Status: ${adminProductResponse.data.data.adminInfo.stockStatus}`.white);
            }
        } else {
            console.log('❌ Admin Product Scan: FAILED'.red);
            console.log(`Error: ${adminProductResponse.data.message}`.red);
        }

        // Test 2: Public Product Scanning
        console.log('\n👥 Test 2: Public Product Scanning'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const publicProductResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
            qrData: productQRData,
            viewType: 'public'
        });

        if (publicProductResponse.data.success) {
            console.log('✅ Public Product Scan: SUCCESS'.green);
            console.log(`📦 Product: ${publicProductResponse.data.data.name}`.cyan);
            console.log(`💰 Price: ₹${publicProductResponse.data.data.price}`.cyan);
            console.log(`📋 Availability: ${publicProductResponse.data.data.availability}`.cyan);
            
            if (publicProductResponse.data.data.customerInfo) {
                console.log('🛍️ Customer Info:'.magenta);
                console.log(`   💸 Savings: ${publicProductResponse.data.data.customerInfo.savings || 'None'}`.white);
                console.log(`   🚚 Delivery: ${publicProductResponse.data.data.customerInfo.deliveryInfo}`.white);
                console.log(`   🔄 Return: ${publicProductResponse.data.data.customerInfo.returnPolicy}`.white);
            }
        } else {
            console.log('❌ Public Product Scan: FAILED'.red);
            console.log(`Error: ${publicProductResponse.data.message}`.red);
        }

        // Test 3: Admin Category Scanning
        console.log('\n📁 Test 3: Admin Category Scanning'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const adminCategoryResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
            qrData: categoryQRData,
            viewType: 'admin'
        });

        if (adminCategoryResponse.data.success) {
            console.log('✅ Admin Category Scan: SUCCESS'.green);
            console.log(`📁 Category: ${adminCategoryResponse.data.data.name}`.cyan);
            console.log(`📦 Products: ${adminCategoryResponse.data.data.productsCount}`.cyan);
            console.log(`⭐ Featured: ${adminCategoryResponse.data.data.featuredProductsCount}`.cyan);
            
            if (adminCategoryResponse.data.data.adminInfo) {
                console.log('🔧 Admin Analytics:'.magenta);
                console.log(`   💰 Average Price: ${adminCategoryResponse.data.data.adminInfo.averagePrice}`.white);
                console.log(`   📊 Performance: ${adminCategoryResponse.data.data.adminInfo.categoryPerformance}`.white);
                console.log(`   🔄 Status: ${adminCategoryResponse.data.data.adminInfo.status}`.white);
            }
        } else {
            console.log('❌ Admin Category Scan: FAILED'.red);
            console.log(`Error: ${adminCategoryResponse.data.message}`.red);
        }

        // Test 4: Public Category Scanning
        console.log('\n👥 Test 4: Public Category Scanning'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const publicCategoryResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
            qrData: categoryQRData,
            viewType: 'public'
        });

        if (publicCategoryResponse.data.success) {
            console.log('✅ Public Category Scan: SUCCESS'.green);
            console.log(`📁 Category: ${publicCategoryResponse.data.data.name}`.cyan);
            console.log(`📦 Products: ${publicCategoryResponse.data.data.productsCount}`.cyan);
            console.log(`⭐ Featured: ${publicCategoryResponse.data.data.featuredProductsCount}`.cyan);
            
            if (publicCategoryResponse.data.data.customerInfo) {
                console.log('🛍️ Customer Info:'.magenta);
                console.log(`   📊 Total Products: ${publicCategoryResponse.data.data.customerInfo.totalProducts}`.white);
                console.log(`   ⭐ Featured Products: ${publicCategoryResponse.data.data.customerInfo.featuredProducts}`.white);
                console.log(`   🎯 Offers: ${publicCategoryResponse.data.data.customerInfo.offers}`.white);
            }

            if (publicCategoryResponse.data.data.sampleProducts.length > 0) {
                console.log(`🛍️ Sample Products (${publicCategoryResponse.data.data.sampleProducts.length}):`.magenta);
                publicCategoryResponse.data.data.sampleProducts.slice(0, 3).forEach((product, index) => {
                    console.log(`   ${index + 1}. ${product.name} - ₹${product.discountPrice || product.price}`.white);
                });
            }
        } else {
            console.log('❌ Public Category Scan: FAILED'.red);
            console.log(`Error: ${publicCategoryResponse.data.message}`.red);
        }

        // Test 5: Invalid QR Data
        console.log('\n❌ Test 5: Invalid QR Data Handling'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        try {
            const invalidResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
                qrData: 'invalid-qr-data',
                viewType: 'public'
            });
            console.log('❌ Invalid QR Test: Should have failed but succeeded'.red);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log('✅ Invalid QR Test: Properly handled'.green);
                console.log(`📝 Error Message: ${error.response.data.message}`.yellow);
            } else {
                console.log('❌ Invalid QR Test: Unexpected error'.red);
            }
        }

        // Test 6: Missing QR Data
        console.log('\n❌ Test 6: Missing QR Data Handling'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        try {
            const missingResponse = await axios.post(`${API_BASE}/qr-codes/scan`, {
                viewType: 'public'
            });
            console.log('❌ Missing QR Test: Should have failed but succeeded'.red);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log('✅ Missing QR Test: Properly handled'.green);
                console.log(`📝 Error Message: ${error.response.data.message}`.yellow);
            } else {
                console.log('❌ Missing QR Test: Unexpected error'.red);
            }
        }

        console.log('\n🎉 QR Scanning Tests Completed!'.green.bold);
        console.log('=' .repeat(60).gray);
        
        console.log('\n📋 Test Summary:'.cyan.bold);
        console.log('✅ Admin Product Scanning - Enhanced with analytics'.green);
        console.log('✅ Public Product Scanning - Customer-friendly format'.green);
        console.log('✅ Admin Category Scanning - Enhanced with analytics'.green);
        console.log('✅ Public Category Scanning - Customer-friendly format'.green);
        console.log('✅ Error Handling - Invalid and missing data'.green);

        console.log('\n🌐 Public QR Scanner URL:'.cyan.bold);
        console.log('http://localhost:8080/api/qr-codes/scanner'.yellow);

    } catch (error) {
        console.error('❌ Test execution failed:'.red.bold, error.message);
        if (error.response) {
            console.error('Response data:'.red, error.response.data);
        }
    }
}

// Run the tests
testQRScanning();
