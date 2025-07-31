const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test QR code scanning functionality
async function testQRScanner() {
    console.log('🔍 Testing QR Code Scanner Functionality...\n');

    try {
        // Test 1: Scan a product QR code
        console.log('📱 Test 1: Scanning Product QR Code');
        const productQRData = JSON.stringify({
            type: 'product',
            id: '66a3b5c123456789abcdef01' // Sample product ID
        });

        const productScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {
            qrData: productQRData
        });

        if (productScanResponse.data.success) {
            console.log('✅ Product QR scan successful');
            console.log(`   Product: ${productScanResponse.data.data.name}`);
            console.log(`   Price: ₹${productScanResponse.data.data.price}`);
            console.log(`   Category: ${productScanResponse.data.data.category?.name || 'N/A'}`);
        } else {
            console.log('❌ Product QR scan failed:', productScanResponse.data.message);
        }

        console.log('');

        // Test 2: Scan a category QR code
        console.log('📱 Test 2: Scanning Category QR Code');
        const categoryQRData = JSON.stringify({
            type: 'category',
            id: '66a3b5c123456789abcdef02' // Sample category ID
        });

        const categoryScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {
            qrData: categoryQRData
        });

        if (categoryScanResponse.data.success) {
            console.log('✅ Category QR scan successful');
            console.log(`   Category: ${categoryScanResponse.data.data.name}`);
            console.log(`   Products Count: ${categoryScanResponse.data.data.productsCount}`);
        } else {
            console.log('❌ Category QR scan failed:', categoryScanResponse.data.message);
        }

        console.log('');

        // Test 3: Test invalid QR data
        console.log('📱 Test 3: Testing Invalid QR Data');
        try {
            const invalidScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {
                qrData: 'invalid-qr-data'
            });
            console.log('❌ Should have failed for invalid QR data');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid QR data');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('');

        // Test 4: Test missing QR data
        console.log('📱 Test 4: Testing Missing QR Data');
        try {
            const missingScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {});
            console.log('❌ Should have failed for missing QR data');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected missing QR data');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('');

        // Test 5: Test with real product data (if available)
        console.log('📱 Test 5: Testing with Real Product Data');
        try {
            // First get a real product
            const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`);
            
            if (productsResponse.data.success && productsResponse.data.products.length > 0) {
                const realProduct = productsResponse.data.products[0];
                const realProductQRData = JSON.stringify({
                    type: 'product',
                    id: realProduct._id
                });

                const realProductScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {
                    qrData: realProductQRData
                });

                if (realProductScanResponse.data.success) {
                    console.log('✅ Real product QR scan successful');
                    console.log(`   Product: ${realProductScanResponse.data.data.name}`);
                    console.log(`   Price: ₹${realProductScanResponse.data.data.price}`);
                    console.log(`   Stock: ${realProductScanResponse.data.data.stock}`);
                    console.log(`   Active: ${realProductScanResponse.data.data.isActive}`);
                } else {
                    console.log('❌ Real product QR scan failed:', realProductScanResponse.data.message);
                }
            } else {
                console.log('⚠️  No products available for testing');
            }
        } catch (error) {
            console.log('❌ Error testing with real product:', error.message);
        }

        console.log('');

        // Test 6: Test with real category data (if available)
        console.log('📱 Test 6: Testing with Real Category Data');
        try {
            // First get a real category
            const categoriesResponse = await axios.get(`${BASE_URL}/categories?limit=1`);
            
            if (categoriesResponse.data.success && categoriesResponse.data.categories.length > 0) {
                const realCategory = categoriesResponse.data.categories[0];
                const realCategoryQRData = JSON.stringify({
                    type: 'category',
                    id: realCategory._id
                });

                const realCategoryScanResponse = await axios.post(`${BASE_URL}/qr-codes/scan`, {
                    qrData: realCategoryQRData
                });

                if (realCategoryScanResponse.data.success) {
                    console.log('✅ Real category QR scan successful');
                    console.log(`   Category: ${realCategoryScanResponse.data.data.name}`);
                    console.log(`   Products Count: ${realCategoryScanResponse.data.data.productsCount}`);
                    console.log(`   Active: ${realCategoryScanResponse.data.data.isActive}`);
                    if (realCategoryScanResponse.data.data.sampleProducts.length > 0) {
                        console.log(`   Sample Products: ${realCategoryScanResponse.data.data.sampleProducts.length} found`);
                    }
                } else {
                    console.log('❌ Real category QR scan failed:', realCategoryScanResponse.data.message);
                }
            } else {
                console.log('⚠️  No categories available for testing');
            }
        } catch (error) {
            console.log('❌ Error testing with real category:', error.message);
        }

        console.log('\n🎉 QR Scanner testing completed!');

    } catch (error) {
        console.error('❌ Error during QR scanner testing:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test QR code generation with authentication
async function testQRGenerationWithAuth() {
    console.log('\n🔐 Testing QR Code Generation with Authentication...\n');

    try {
        // First login to get token
        console.log('🔑 Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@ghanshyammurtibhandar.com',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Admin login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // Test product QR generation
        console.log('\n📱 Testing Product QR Generation...');
        try {
            const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`);
            
            if (productsResponse.data.success && productsResponse.data.products.length > 0) {
                const product = productsResponse.data.products[0];
                
                const qrResponse = await axios.post(
                    `${BASE_URL}/qr-codes/product/${product._id}`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (qrResponse.data.success) {
                    console.log('✅ Product QR generation successful');
                    console.log(`   QR Code URL: ${qrResponse.data.qrCodeUrl}`);
                    console.log(`   Download URL: ${qrResponse.data.downloadUrl}`);
                } else {
                    console.log('❌ Product QR generation failed:', qrResponse.data.message);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('❌ Authentication failed - this was the original issue');
            } else {
                console.log('❌ Error:', error.message);
            }
        }

        // Test category QR generation
        console.log('\n📱 Testing Category QR Generation...');
        try {
            const categoriesResponse = await axios.get(`${BASE_URL}/categories?limit=1`);
            
            if (categoriesResponse.data.success && categoriesResponse.data.categories.length > 0) {
                const category = categoriesResponse.data.categories[0];
                
                const qrResponse = await axios.post(
                    `${BASE_URL}/qr-codes/category/${category._id}`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (qrResponse.data.success) {
                    console.log('✅ Category QR generation successful');
                    console.log(`   QR Code URL: ${qrResponse.data.qrCodeUrl}`);
                    console.log(`   Download URL: ${qrResponse.data.downloadUrl}`);
                } else {
                    console.log('❌ Category QR generation failed:', qrResponse.data.message);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('❌ Authentication failed - this was the original issue');
            } else {
                console.log('❌ Error:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error during authentication testing:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testQRScanner();
    await testQRGenerationWithAuth();
}

runAllTests();
