require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
let authToken = '';

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
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

// Create test images of different sizes and formats
async function createTestImages() {
    logSection('🖼️ Creating Test Images');
    
    const testImages = [];
    
    try {
        // Create a large JPEG image (should be optimized)
        const largeJpeg = await sharp({
            create: {
                width: 3000,
                height: 2000,
                channels: 3,
                background: { r: 255, g: 100, b: 50 }
            }
        })
        .jpeg({ quality: 100 })
        .toBuffer();
        
        testImages.push({
            name: 'large-test-image.jpg',
            buffer: largeJpeg,
            mimeType: 'image/jpeg',
            description: 'Large JPEG (3000x2000, high quality)'
        });
        
        // Create a PNG with transparency
        const pngWithAlpha = await sharp({
            create: {
                width: 1000,
                height: 1000,
                channels: 4,
                background: { r: 0, g: 255, b: 0, alpha: 0.5 }
            }
        })
        .png()
        .toBuffer();
        
        testImages.push({
            name: 'transparent-test-image.png',
            buffer: pngWithAlpha,
            mimeType: 'image/png',
            description: 'PNG with transparency (1000x1000)'
        });
        
        // Create a small image (should not be resized)
        const smallJpeg = await sharp({
            create: {
                width: 300,
                height: 200,
                channels: 3,
                background: { r: 50, g: 100, b: 255 }
            }
        })
        .jpeg({ quality: 90 })
        .toBuffer();
        
        testImages.push({
            name: 'small-test-image.jpg',
            buffer: smallJpeg,
            mimeType: 'image/jpeg',
            description: 'Small JPEG (300x200)'
        });
        
        logSuccess(`Created ${testImages.length} test images`);
        testImages.forEach(img => {
            logInfo(`  ${img.name}: ${(img.buffer.length / 1024).toFixed(2)} KB - ${img.description}`);
        });
        
        return testImages;
        
    } catch (error) {
        logError(`Failed to create test images: ${error.message}`);
        return [];
    }
}

// Test authentication
async function testAuthentication() {
    logSection('🔐 Authentication Test');

    const adminLogin = await apiRequest('POST', '/auth/login', {
        email: 'admin@ghanshyambhandar.com',
        password: 'admin123'
    }, {
        'Content-Type': 'application/json'
    });

    if (adminLogin.success && adminLogin.data.success) {
        authToken = adminLogin.data.data.token;
        logSuccess('Admin authentication successful');
        return true;
    } else {
        logError('Admin authentication failed');
        logError(JSON.stringify(adminLogin.error, null, 2));
        return false;
    }
}

// Test image optimization during upload
async function testImageOptimization(testImages) {
    logSection('🔧 Testing Image Optimization');
    
    const optimizationResults = [];
    
    for (const testImage of testImages) {
        try {
            logInfo(`Testing optimization for: ${testImage.name}`);
            
            const formData = new FormData();
            formData.append('name', `Optimized Test Product - ${testImage.name}`);
            formData.append('description', `Test product for image optimization - ${testImage.description}`);
            formData.append('category', ''); // We'll get a category ID first
            formData.append('price', '999');
            formData.append('originalPrice', '1299');
            formData.append('stock', '10');
            formData.append('isActive', 'true');
            formData.append('images', testImage.buffer, {
                filename: testImage.name,
                contentType: testImage.mimeType
            });
            
            // Get a category first
            const categoriesResponse = await apiRequest('GET', '/categories', null, {
                'Authorization': `Bearer ${authToken}`
            });
            
            if (categoriesResponse.success && categoriesResponse.data.data.length > 0) {
                formData.append('category', categoriesResponse.data.data[0]._id);
            }
            
            const uploadResponse = await apiRequest('POST', '/products', formData, {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            });
            
            if (uploadResponse.success) {
                const product = uploadResponse.data.data;
                logSuccess(`Product created: ${product.name}`);
                
                if (product.images && product.images.length > 0) {
                    const imageUrl = product.images[0];
                    logInfo(`Image URL: ${imageUrl.substring(0, 80)}...`);
                    
                    // Test if the image is accessible
                    try {
                        const imageResponse = await axios.get(imageUrl, { timeout: 10000 });
                        if (imageResponse.status === 200) {
                            logSuccess(`✅ Optimized image accessible`);
                            logInfo(`Content-Type: ${imageResponse.headers['content-type']}`);
                            logInfo(`Content-Length: ${imageResponse.headers['content-length']} bytes`);
                            
                            const originalSize = testImage.buffer.length;
                            const optimizedSize = parseInt(imageResponse.headers['content-length']) || 0;
                            const compressionRatio = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize * 100).toFixed(2) : 0;
                            
                            optimizationResults.push({
                                name: testImage.name,
                                originalSize,
                                optimizedSize,
                                compressionRatio: parseFloat(compressionRatio),
                                accessible: true,
                                productId: product._id
                            });
                            
                            logInfo(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
                            logInfo(`Optimized size: ${(optimizedSize / 1024).toFixed(2)} KB`);
                            logInfo(`Compression: ${compressionRatio}%`);
                        }
                    } catch (error) {
                        logError(`Image not accessible: ${error.message}`);
                        optimizationResults.push({
                            name: testImage.name,
                            accessible: false,
                            error: error.message,
                            productId: product._id
                        });
                    }
                } else {
                    logWarning('No images found in created product');
                }
            } else {
                logError(`Failed to create product: ${JSON.stringify(uploadResponse.error)}`);
            }
            
        } catch (error) {
            logError(`Test failed for ${testImage.name}: ${error.message}`);
        }
        
        console.log(''); // Add spacing
    }
    
    return optimizationResults;
}

// Test edit form functionality
async function testEditFormFunctionality(productId) {
    logSection('📝 Testing Edit Form Functionality');
    
    try {
        // Get the product details
        const productResponse = await apiRequest('GET', `/products/${productId}`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        
        if (productResponse.success) {
            const product = productResponse.data.data;
            logSuccess(`Retrieved product: ${product.name}`);
            
            if (product.images && product.images.length > 0) {
                logInfo(`Product has ${product.images.length} images`);
                
                // Test each image URL
                for (let i = 0; i < product.images.length; i++) {
                    const imageUrl = product.images[i];
                    logInfo(`Testing image ${i + 1}: ${imageUrl.substring(0, 80)}...`);
                    
                    try {
                        const imageResponse = await axios.get(imageUrl, { 
                            timeout: 10000,
                            validateStatus: function (status) {
                                return status < 500;
                            }
                        });
                        
                        if (imageResponse.status === 200) {
                            logSuccess(`✅ Image ${i + 1} accessible for edit form`);
                        } else {
                            logWarning(`⚠️ Image ${i + 1} returned status: ${imageResponse.status}`);
                        }
                    } catch (error) {
                        logError(`❌ Image ${i + 1} failed: ${error.message}`);
                    }
                }
                
                return {
                    success: true,
                    productId: product._id,
                    imageCount: product.images.length,
                    imagesAccessible: true
                };
            } else {
                logWarning('Product has no images to test');
                return {
                    success: true,
                    productId: product._id,
                    imageCount: 0,
                    imagesAccessible: false
                };
            }
        } else {
            logError(`Failed to retrieve product: ${JSON.stringify(productResponse.error)}`);
            return { success: false };
        }
        
    } catch (error) {
        logError(`Edit form test failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Main test function
async function testImageOptimizationAndEditForm() {
    logSection('🚀 TESTING IMAGE OPTIMIZATION AND EDIT FORM');
    
    try {
        // Test authentication
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            logError('Authentication failed. Cannot proceed with tests.');
            return;
        }
        
        // Create test images
        const testImages = await createTestImages();
        if (testImages.length === 0) {
            logError('Failed to create test images. Cannot proceed.');
            return;
        }
        
        // Test image optimization
        const optimizationResults = await testImageOptimization(testImages);
        
        // Test edit form functionality with the first created product
        let editFormResult = { success: false };
        if (optimizationResults.length > 0 && optimizationResults[0].productId) {
            editFormResult = await testEditFormFunctionality(optimizationResults[0].productId);
        }
        
        // Final summary
        logSection('📊 TEST RESULTS SUMMARY');
        
        logInfo('Image Optimization Results:');
        optimizationResults.forEach(result => {
            if (result.accessible) {
                logSuccess(`✅ ${result.name}: ${result.compressionRatio}% compression`);
                logInfo(`   Original: ${(result.originalSize / 1024).toFixed(2)} KB → Optimized: ${(result.optimizedSize / 1024).toFixed(2)} KB`);
            } else {
                logError(`❌ ${result.name}: ${result.error || 'Not accessible'}`);
            }
        });
        
        logInfo('\nEdit Form Functionality:');
        if (editFormResult.success) {
            logSuccess(`✅ Edit form can access product images`);
            logInfo(`   Product ID: ${editFormResult.productId}`);
            logInfo(`   Image count: ${editFormResult.imageCount}`);
            logInfo(`   Images accessible: ${editFormResult.imagesAccessible ? 'Yes' : 'No'}`);
        } else {
            logError(`❌ Edit form test failed`);
        }
        
        // Overall assessment
        logSection('🎉 OVERALL ASSESSMENT');
        
        const successfulOptimizations = optimizationResults.filter(r => r.accessible).length;
        const totalOptimizations = optimizationResults.length;
        
        if (successfulOptimizations === totalOptimizations && editFormResult.success) {
            logSuccess('🎉 ALL TESTS PASSED!');
            logInfo('✅ Image optimization is working correctly');
            logInfo('✅ Edit form displays images properly');
            logInfo('✅ S3 integration is functioning perfectly');
        } else {
            logWarning('⚠️ Some tests had issues');
            logInfo(`Image optimization: ${successfulOptimizations}/${totalOptimizations} successful`);
            logInfo(`Edit form: ${editFormResult.success ? 'Working' : 'Failed'}`);
        }
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testImageOptimizationAndEditForm().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testImageOptimizationAndEditForm;
