require('dotenv').config();
const axios = require('axios');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

const BASE_URL = 'http://localhost:8080/api';

async function testEditFormImages() {
    logSection('📝 TESTING EDIT FORM IMAGE VISIBILITY');
    
    try {
        // Get auth token
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@ghanshyambhandar.com',
            password: 'admin123'
        });
        
        if (!loginResponse.data.success) {
            logError('Authentication failed');
            return;
        }
        
        const authToken = loginResponse.data.data.token;
        logSuccess('Authentication successful');
        
        // Get all products
        const productsResponse = await axios.get(`${BASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!productsResponse.data.success) {
            logError('Failed to fetch products');
            return;
        }
        
        let products = productsResponse.data.data;

        // Handle different response formats
        if (!Array.isArray(products)) {
            if (products && products.products) {
                products = products.products;
            } else {
                products = [];
            }
        }

        logSuccess(`Found ${products.length} products`);

        // Test products with images
        const productsWithImages = products.filter(p => p.images && p.images.length > 0);
        logInfo(`Products with images: ${productsWithImages.length}`);
        
        if (productsWithImages.length === 0) {
            logWarning('No products with images found to test');
            return;
        }
        
        // Test first 3 products with images
        for (let i = 0; i < Math.min(3, productsWithImages.length); i++) {
            const product = productsWithImages[i];
            
            logSection(`🖼️ Testing Product: ${product.name}`);
            logInfo(`Product ID: ${product._id}`);
            logInfo(`Image count: ${product.images.length}`);
            
            // Test each image
            for (let j = 0; j < product.images.length; j++) {
                const imageUrl = product.images[j];
                logInfo(`Testing image ${j + 1}: ${imageUrl.substring(0, 80)}...`);
                
                try {
                    const imageResponse = await axios.get(imageUrl, { 
                        timeout: 10000,
                        validateStatus: function (status) {
                            return status < 500;
                        }
                    });
                    
                    if (imageResponse.status === 200) {
                        logSuccess(`✅ Image ${j + 1} accessible`);
                        logInfo(`   Content-Type: ${imageResponse.headers['content-type']}`);
                        logInfo(`   Content-Length: ${imageResponse.headers['content-length']} bytes`);
                        
                        // Check if it's a presigned URL
                        if (imageUrl.includes('X-Amz-Signature')) {
                            logInfo(`   ✅ Using presigned URL (direct S3 access)`);
                        } else if (imageUrl.includes('/api/images/')) {
                            logInfo(`   ✅ Using proxy URL`);
                        } else {
                            logInfo(`   ⚠️ Unknown URL format`);
                        }
                    } else {
                        logWarning(`⚠️ Image ${j + 1} returned status: ${imageResponse.status}`);
                        if (imageResponse.data) {
                            logInfo(`   Response: ${JSON.stringify(imageResponse.data)}`);
                        }
                    }
                } catch (error) {
                    logError(`❌ Image ${j + 1} failed: ${error.message}`);
                    if (error.response) {
                        logError(`   Status: ${error.response.status}`);
                        if (error.response.data) {
                            logError(`   Data: ${JSON.stringify(error.response.data)}`);
                        }
                    }
                }
            }
        }
        
        // Summary
        logSection('📊 EDIT FORM IMAGE VISIBILITY SUMMARY');
        
        let totalImages = 0;
        let accessibleImages = 0;
        
        for (const product of productsWithImages.slice(0, 3)) {
            if (product.images) {
                totalImages += product.images.length;
                
                for (const imageUrl of product.images) {
                    try {
                        const response = await axios.get(imageUrl, { timeout: 5000 });
                        if (response.status === 200) {
                            accessibleImages++;
                        }
                    } catch (error) {
                        // Image not accessible
                    }
                }
            }
        }
        
        const accessibilityRate = totalImages > 0 ? ((accessibleImages / totalImages) * 100).toFixed(1) : 0;
        
        logInfo(`Total images tested: ${totalImages}`);
        logInfo(`Accessible images: ${accessibleImages}`);
        logInfo(`Accessibility rate: ${accessibilityRate}%`);
        
        if (accessibilityRate >= 90) {
            logSuccess('🎉 EDIT FORM IMAGE VISIBILITY: EXCELLENT');
            logInfo('✅ Images will display properly in the admin panel edit form');
        } else if (accessibilityRate >= 70) {
            logWarning('⚠️ EDIT FORM IMAGE VISIBILITY: GOOD');
            logInfo('✅ Most images will display in the edit form');
        } else {
            logError('❌ EDIT FORM IMAGE VISIBILITY: POOR');
            logInfo('❌ Many images may not display in the edit form');
        }
        
        // Admin panel access info
        logSection('🌐 ADMIN PANEL ACCESS');
        logInfo('Admin Panel URL: http://localhost:3001');
        logInfo('Login: admin@ghanshyambhandar.com / admin123');
        logInfo('Navigate to Products → Edit any product to test image visibility');
        
    } catch (error) {
        logError(`Test failed: ${error.message}`);
        console.error(error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testEditFormImages().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testEditFormImages;
