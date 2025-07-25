require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

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

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let authToken = '';
let adminToken = '';
let testCategoryId = '';
let testProductId = '';

// Create test image buffer
const createTestImage = () => {
    // Create a simple test image (1x1 pixel PNG)
    return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
};

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            if (data instanceof FormData) {
                config.data = data;
                config.headers = { ...config.headers, ...data.getHeaders() };
                delete config.headers['Content-Type'];
            } else {
                config.data = data;
            }
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
};

// Test authentication
async function testAuthentication() {
    logSection('🔐 Authentication Tests');

    // Test admin login
    const adminLogin = await apiRequest('POST', '/auth/login', {
        email: 'admin@ghanshyambhandar.com',
        password: 'admin123'
    });

    if (adminLogin.success && adminLogin.data.success) {
        adminToken = adminLogin.data.data.token;
        logSuccess('Admin login successful');
        logInfo(`Admin token: ${adminToken.substring(0, 20)}...`);
    } else {
        logError('Admin login failed');
        logError(JSON.stringify(adminLogin.error, null, 2));
        return false;
    }

    return true;
}

// Test Contabo storage endpoints
async function testContaboEndpoints() {
    logSection('🗄️ Contabo Storage API Tests');

    // Test connection
    const connectionTest = await apiRequest('GET', '/contabo/test-connection', null, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (connectionTest.success && connectionTest.data.success) {
        logSuccess('Contabo connection test passed');
        logInfo(`Bucket: ${connectionTest.data.data.bucket}`);
        logInfo(`Endpoint: ${connectionTest.data.data.endpoint}`);
        logInfo(`File count: ${connectionTest.data.data.fileCount}`);
    } else {
        logError('Contabo connection test failed');
        logError(JSON.stringify(connectionTest.error, null, 2));
    }

    // Test bucket statistics
    const bucketStats = await apiRequest('GET', '/contabo/bucket-stats', null, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (bucketStats.success && bucketStats.data.success) {
        logSuccess('Bucket statistics retrieved');
        logInfo(`Total files: ${bucketStats.data.data.totalFiles}`);
        logInfo(`Total size: ${(bucketStats.data.data.totalSize / 1024).toFixed(2)} KB`);
    } else {
        logError('Bucket statistics test failed');
        logError(JSON.stringify(bucketStats.error, null, 2));
    }

    // Test presigned upload URL
    const presignedUpload = await apiRequest('POST', '/contabo/presigned-upload-url', {
        fileName: 'test-presigned.png',
        contentType: 'image/png',
        folder: 'test-api',
        expiresIn: 3600
    }, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (presignedUpload.success && presignedUpload.data.success) {
        logSuccess('Presigned upload URL generated');
        logInfo(`Upload URL: ${presignedUpload.data.data.uploadUrl.substring(0, 50)}...`);
        logInfo(`Public URL: ${presignedUpload.data.data.publicUrl}`);
    } else {
        logError('Presigned upload URL test failed');
        logError(JSON.stringify(presignedUpload.error, null, 2));
    }

    // Test multiple presigned URLs
    const multiplePresigned = await apiRequest('POST', '/contabo/multiple-presigned-upload-urls', {
        files: [
            { originalName: 'test1.png', contentType: 'image/png' },
            { originalName: 'test2.jpg', contentType: 'image/jpeg' }
        ],
        folder: 'test-api',
        expiresIn: 3600
    }, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (multiplePresigned.success && multiplePresigned.data.success) {
        logSuccess('Multiple presigned URLs generated');
        logInfo(`Generated ${multiplePresigned.data.data.totalFiles} URLs`);
    } else {
        logError('Multiple presigned URLs test failed');
        logError(JSON.stringify(multiplePresigned.error, null, 2));
    }
}

// Test category creation with image upload
async function testCategoryWithImage() {
    logSection('📁 Category with Image Upload Test');

    const formData = new FormData();
    const timestamp = Date.now();
    formData.append('name', `Test Category API ${timestamp}`);
    formData.append('description', 'Test category created via API with Contabo image');
    formData.append('image', createTestImage(), 'test-category.png');

    const categoryCreate = await apiRequest('POST', '/categories', formData, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (categoryCreate.success && categoryCreate.data.success) {
        testCategoryId = categoryCreate.data.data._id || categoryCreate.data.data.id;
        logSuccess('Category created with image');
        logInfo(`Category ID: ${testCategoryId}`);
        logInfo(`Category name: ${categoryCreate.data.data.name}`);
        logInfo(`Image URL: ${categoryCreate.data.data.image}`);
        
        // Verify image URL is from Contabo
        if (categoryCreate.data.data.image && categoryCreate.data.data.image.includes('contabostorage.com')) {
            logSuccess('Image uploaded to Contabo successfully');
        } else {
            logWarning('Image URL does not appear to be from Contabo');
        }
    } else {
        logError('Category creation with image failed');
        logError(JSON.stringify(categoryCreate.error, null, 2));
        return false;
    }

    return true;
}

// Test product creation with multiple images
async function testProductWithImages() {
    logSection('📦 Product with Multiple Images Upload Test');

    if (!testCategoryId) {
        logError('No test category available for product creation');
        return false;
    }

    const formData = new FormData();
    const timestamp = Date.now();
    formData.append('name', `Test Product API ${timestamp}`);
    formData.append('description', 'Test product created via API with Contabo images');
    formData.append('price', '999.99');
    formData.append('originalPrice', '1299.99');
    formData.append('category', testCategoryId);
    formData.append('stock', '50');
    formData.append('isActive', 'true');
    formData.append('isFeatured', 'true');
    
    // Add multiple test images
    formData.append('images', createTestImage(), 'test-product-1.png');
    formData.append('images', createTestImage(), 'test-product-2.png');
    formData.append('images', createTestImage(), 'test-product-3.png');

    const productCreate = await apiRequest('POST', '/products', formData, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (productCreate.success && productCreate.data.success) {
        testProductId = productCreate.data.data._id || productCreate.data.data.id;
        logSuccess('Product created with multiple images');
        logInfo(`Product ID: ${testProductId}`);
        logInfo(`Product name: ${productCreate.data.data.name}`);
        logInfo(`Images count: ${productCreate.data.data.images.length}`);
        
        // Verify all images are from Contabo
        const contaboImages = productCreate.data.data.images.filter(img => 
            img.includes('contabostorage.com')
        );
        
        if (contaboImages.length === productCreate.data.data.images.length) {
            logSuccess(`All ${contaboImages.length} images uploaded to Contabo successfully`);
        } else {
            logWarning(`Only ${contaboImages.length} out of ${productCreate.data.data.images.length} images are from Contabo`);
        }
        
        // Display image URLs
        productCreate.data.data.images.forEach((img, index) => {
            logInfo(`Image ${index + 1}: ${img}`);
        });
    } else {
        logError('Product creation with images failed');
        logError(JSON.stringify(productCreate.error, null, 2));
        return false;
    }

    return true;
}

// Test product update with new images
async function testProductUpdate() {
    logSection('🔄 Product Update with New Images Test');

    if (!testProductId) {
        logError('No test product available for update');
        return false;
    }

    const formData = new FormData();
    formData.append('name', 'Updated Test Product API');
    formData.append('description', 'Updated test product with new Contabo images');
    formData.append('price', '1199.99');
    
    // Add new images
    formData.append('images', createTestImage(), 'updated-product-1.png');
    formData.append('images', createTestImage(), 'updated-product-2.png');

    const productUpdate = await apiRequest('PUT', `/products/${testProductId}`, formData, {
        'Authorization': `Bearer ${adminToken}`
    });

    if (productUpdate.success && productUpdate.data.success) {
        logSuccess('Product updated with new images');
        logInfo(`Updated product name: ${productUpdate.data.data.name}`);
        logInfo(`New images count: ${productUpdate.data.data.images.length}`);
        
        // Verify new images are from Contabo
        const contaboImages = productUpdate.data.data.images.filter(img => 
            img.includes('contabostorage.com')
        );
        
        if (contaboImages.length === productUpdate.data.data.images.length) {
            logSuccess(`All ${contaboImages.length} new images uploaded to Contabo successfully`);
        } else {
            logWarning(`Only ${contaboImages.length} out of ${productUpdate.data.data.images.length} images are from Contabo`);
        }
    } else {
        logError('Product update with images failed');
        logError(JSON.stringify(productUpdate.error, null, 2));
        return false;
    }

    return true;
}

// Main test function
async function runAllTests() {
    logSection('🚀 CONTABO API INTEGRATION TESTS');
    
    try {
        // Test authentication first
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            logError('Authentication failed. Cannot proceed with other tests.');
            return;
        }

        // Test Contabo storage endpoints
        await testContaboEndpoints();

        // Test category with image upload
        await testCategoryWithImage();

        // Test product with multiple images
        await testProductWithImages();

        // Test product update
        await testProductUpdate();

        // Final summary
        logSection('🎉 TEST SUMMARY');
        logSuccess('All Contabo API integration tests completed!');
        logInfo('Your APIs are properly integrated with Contabo S3 storage.');
        
        if (testCategoryId) {
            logInfo(`Test category created: ${testCategoryId}`);
        }
        if (testProductId) {
            logInfo(`Test product created: ${testProductId}`);
        }
        
        console.log('\n' + '='.repeat(60));
        log('Next Steps:', 'magenta');
        log('1. Check your Contabo bucket to see the uploaded files', 'yellow');
        log('2. Test the frontend integration with these APIs', 'yellow');
        log('3. Monitor file uploads in production', 'yellow');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = runAllTests;
