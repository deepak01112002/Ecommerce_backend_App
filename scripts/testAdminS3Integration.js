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

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let authToken = '';

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
};

// Test authentication
async function testAuthentication() {
    logSection('🔐 Admin Panel Authentication Test');

    const adminLogin = await apiRequest('POST', '/auth/login', {
        email: 'admin@ghanshyambhandar.com',
        password: 'admin123'
    });

    if (adminLogin.success && adminLogin.data.success) {
        authToken = adminLogin.data.data.token;
        logSuccess('Admin authentication successful');
        logInfo(`Token: ${authToken.substring(0, 20)}...`);
        return true;
    } else {
        logError('Admin authentication failed');
        logError(JSON.stringify(adminLogin.error, null, 2));
        return false;
    }
}

// Test categories with S3 images
async function testCategoriesWithS3() {
    logSection('📁 Categories with S3 Images Test');

    // Get all categories
    const categoriesResponse = await apiRequest('GET', '/categories', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (categoriesResponse.success) {
        const categories = categoriesResponse.data.data || categoriesResponse.data;
        logSuccess(`Retrieved ${categories.length} categories`);
        
        let s3CategoryImages = 0;
        
        categories.forEach((category, index) => {
            logInfo(`${index + 1}. ${category.name}`);
            if (category.image) {
                if (category.image.includes('contabostorage.com')) {
                    s3CategoryImages++;
                    logSuccess(`  ✓ S3 Image: ${category.image}`);
                } else {
                    logWarning(`  ⚠ Non-S3 Image: ${category.image}`);
                }
            } else {
                logWarning(`  ⚠ No image`);
            }
        });
        
        logInfo(`S3 Category Images: ${s3CategoryImages}/${categories.length}`);
        return { total: categories.length, s3Count: s3CategoryImages };
    } else {
        logError('Categories retrieval failed');
        logError(JSON.stringify(categoriesResponse.error, null, 2));
        return { total: 0, s3Count: 0 };
    }
}

// Test products with S3 images
async function testProductsWithS3() {
    logSection('📦 Products with S3 Images Test');

    // Get all products
    const productsResponse = await apiRequest('GET', '/products', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (productsResponse.success) {
        let products = productsResponse.data.data || productsResponse.data;

        // Handle different response formats
        if (!Array.isArray(products)) {
            if (products && products.products) {
                products = products.products;
            } else {
                products = [];
            }
        }

        logSuccess(`Retrieved ${products.length} products`);
        
        let s3ImageCount = 0;
        let totalImageCount = 0;
        
        products.forEach((product, index) => {
            logInfo(`${index + 1}. ${product.name} - ₹${product.price}`);
            if (product.images && product.images.length > 0) {
                logInfo(`  Images: ${product.images.length} total`);
                product.images.forEach((img, imgIndex) => {
                    totalImageCount++;
                    if (img.includes('contabostorage.com')) {
                        s3ImageCount++;
                        logSuccess(`    ✓ S3 Image ${imgIndex + 1}: ${img.substring(0, 80)}...`);
                    } else {
                        logWarning(`    ⚠ Non-S3 Image ${imgIndex + 1}: ${img.substring(0, 80)}...`);
                    }
                });
            } else {
                logWarning(`  ⚠ No images`);
            }
        });
        
        return { totalProducts: products.length, totalImages: totalImageCount, s3Images: s3ImageCount };
    } else {
        logError('Products retrieval failed');
        logError(JSON.stringify(productsResponse.error, null, 2));
        return { totalProducts: 0, totalImages: 0, s3Images: 0 };
    }
}

// Test Contabo storage endpoints
async function testContaboEndpoints() {
    logSection('🗄️ Contabo Storage Endpoints Test');

    // Test connection
    const connectionTest = await apiRequest('GET', '/contabo/test-connection', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (connectionTest.success) {
        logSuccess('Contabo connection test passed');
        const data = connectionTest.data.data;
        logInfo(`Bucket: ${data.bucket}`);
        logInfo(`Endpoint: ${data.endpoint}`);
        logInfo(`File count: ${data.fileCount}`);
    } else {
        logError('Contabo connection test failed');
    }

    // Test bucket statistics
    const bucketStats = await apiRequest('GET', '/contabo/bucket-stats', null, {
        'Authorization': `Bearer ${authToken}`
    });

    if (bucketStats.success) {
        logSuccess('Bucket statistics retrieved');
        const stats = bucketStats.data.data;
        logInfo(`Total files: ${stats.totalFiles}`);
        logInfo(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
        
        Object.entries(stats.folders).forEach(([folder, folderStats]) => {
            logInfo(`📁 ${folder}: ${folderStats.count} files, ${(folderStats.size / 1024).toFixed(2)} KB`);
        });
        
        return stats;
    } else {
        logError('Bucket statistics test failed');
        return null;
    }
}

// Main test function
async function runAdminPanelS3Tests() {
    logSection('🚀 ADMIN PANEL S3 INTEGRATION TESTS');
    
    try {
        // Test authentication first
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            logError('Authentication failed. Cannot proceed with other tests.');
            return;
        }

        // Test all S3 integration
        const categoryResults = await testCategoriesWithS3();
        const productResults = await testProductsWithS3();
        const bucketStats = await testContaboEndpoints();

        // Final summary
        logSection('📊 S3 INTEGRATION SUMMARY');
        
        logInfo(`Categories: ${categoryResults.s3Count}/${categoryResults.total} using S3`);
        logInfo(`Product Images: ${productResults.s3Images}/${productResults.totalImages} using S3`);
        
        const totalS3Items = categoryResults.s3Count + productResults.s3Images;
        const totalItems = categoryResults.total + productResults.totalImages;
        const s3Percentage = totalItems > 0 ? ((totalS3Items / totalItems) * 100).toFixed(1) : 0;
        
        logInfo(`Overall S3 Integration: ${s3Percentage}%`);
        
        if (bucketStats) {
            logInfo(`Bucket Files: ${bucketStats.totalFiles}`);
            logInfo(`Bucket Size: ${(bucketStats.totalSize / 1024).toFixed(2)} KB`);
        }
        
        logSection('🎉 ADMIN PANEL S3 INTEGRATION TEST SUMMARY');
        
        if (s3Percentage >= 90) {
            logSuccess('🎉 Excellent S3 Integration - Admin panel is fully integrated with Contabo S3!');
        } else if (s3Percentage >= 50) {
            logWarning(`⚠️ Good S3 Integration - ${s3Percentage}% of files are in S3`);
        } else {
            logError(`❌ Poor S3 Integration - Only ${s3Percentage}% of files are in S3`);
        }
        
        console.log('\n' + '='.repeat(60));
        log('Admin Panel Access:', 'magenta');
        log('URL: http://localhost:3001', 'yellow');
        log('Email: admin@ghanshyambhandar.com', 'yellow');
        log('Password: admin123', 'yellow');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAdminPanelS3Tests().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = runAdminPanelS3Tests;
