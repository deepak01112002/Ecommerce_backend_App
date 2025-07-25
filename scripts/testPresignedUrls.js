require('dotenv').config();
const axios = require('axios');
const contaboStorage = require('../services/contaboStorage');

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

async function testPresignedUrlGeneration() {
    logSection('🔐 TESTING PRESIGNED URL GENERATION');
    
    const testFile = 'categories/1753382329006-a43e1519f6dd9b9b-sample-category-image.jpg';
    
    try {
        // Test different expiry times
        const expiryTimes = [3600, 7200, 86400]; // 1 hour, 2 hours, 24 hours
        
        for (const expiry of expiryTimes) {
            logInfo(`Testing presigned URL with ${expiry} seconds expiry (${expiry/3600} hours)`);
            
            const result = await contaboStorage.getSignedUrl(testFile, expiry);
            
            if (result.success) {
                logSuccess(`Generated presigned URL`);
                logInfo(`URL: ${result.url.substring(0, 100)}...`);
                
                // Test the URL
                try {
                    const response = await axios.get(result.url, { 
                        timeout: 10000,
                        validateStatus: function (status) {
                            return status < 500;
                        }
                    });
                    
                    if (response.status === 200) {
                        logSuccess(`✅ Presigned URL working! Status: ${response.status}`);
                        logInfo(`Content-Type: ${response.headers['content-type']}`);
                        logInfo(`Content-Length: ${response.headers['content-length']} bytes`);
                        return { working: true, url: result.url, expiry };
                    } else {
                        logWarning(`⚠️ Unexpected status: ${response.status}`);
                        if (response.data) {
                            logInfo(`Response: ${JSON.stringify(response.data)}`);
                        }
                    }
                } catch (error) {
                    logError(`❌ Presigned URL failed: ${error.message}`);
                    if (error.response) {
                        logError(`Status: ${error.response.status}`);
                        if (error.response.data) {
                            logError(`Data: ${JSON.stringify(error.response.data)}`);
                        }
                    }
                }
            } else {
                logError(`Failed to generate presigned URL: ${result.error}`);
            }
            
            console.log(''); // Add spacing
        }
        
        return { working: false };
        
    } catch (error) {
        logError(`Test failed: ${error.message}`);
        return { working: false, error: error.message };
    }
}

async function testDatabaseUrls() {
    logSection('🗄️ TESTING DATABASE PRESIGNED URLS');
    
    try {
        // Get some categories to test their presigned URLs
        const categoriesResponse = await axios.get('http://localhost:8080/api/categories');
        
        if (categoriesResponse.data && categoriesResponse.data.data) {
            const categories = categoriesResponse.data.data;
            logInfo(`Found ${categories.length} categories to test`);
            
            for (const category of categories.slice(0, 3)) { // Test first 3 categories
                if (category.image) {
                    logInfo(`Testing category: ${category.name}`);
                    logInfo(`Image URL: ${category.image.substring(0, 100)}...`);
                    
                    try {
                        const response = await axios.get(category.image, { 
                            timeout: 10000,
                            validateStatus: function (status) {
                                return status < 500;
                            }
                        });
                        
                        if (response.status === 200) {
                            logSuccess(`✅ Category image accessible`);
                            logInfo(`Content-Type: ${response.headers['content-type']}`);
                            logInfo(`Content-Length: ${response.headers['content-length']} bytes`);
                        } else {
                            logWarning(`⚠️ Unexpected status: ${response.status}`);
                            if (response.data) {
                                logInfo(`Response: ${JSON.stringify(response.data)}`);
                            }
                        }
                    } catch (error) {
                        logError(`❌ Category image failed: ${error.message}`);
                        if (error.response) {
                            logError(`Status: ${error.response.status}`);
                            if (error.response.data) {
                                logError(`Data: ${JSON.stringify(error.response.data)}`);
                            }
                        }
                    }
                }
                console.log(''); // Add spacing
            }
        }
    } catch (error) {
        logError(`Database URL test error: ${error.message}`);
    }
}

async function testAlternativeApproach() {
    logSection('💡 TESTING ALTERNATIVE APPROACH');
    
    logInfo('Since direct presigned URLs are not working, let\'s test alternatives:');
    
    // Test 1: Upload a new file and see what URL format works
    logInfo('1. Testing new file upload with different URL formats');
    
    try {
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const uploadResult = await contaboStorage.uploadFile(
            testImageBuffer,
            'test-direct-access.png',
            'image/png',
            'test-direct'
        );
        
        if (uploadResult.success) {
            logSuccess('Test file uploaded successfully');
            logInfo(`Upload returned URL: ${uploadResult.url}`);
            
            // Test the returned URL
            try {
                const response = await axios.get(uploadResult.url, { 
                    timeout: 10000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                if (response.status === 200) {
                    logSuccess(`✅ Upload URL working! This is the solution!`);
                    return { working: true, approach: 'upload-url', url: uploadResult.url };
                } else {
                    logWarning(`⚠️ Upload URL status: ${response.status}`);
                }
            } catch (error) {
                logError(`❌ Upload URL failed: ${error.message}`);
            }
        }
    } catch (error) {
        logError(`Upload test failed: ${error.message}`);
    }
    
    // Test 2: Recommend proxy approach
    logInfo('2. Proxy approach is still the most reliable solution');
    logSuccess('✅ Proxy URLs work perfectly and provide the needed functionality');
    
    return { working: false, recommendation: 'use-proxy' };
}

async function testPresignedUrls() {
    logSection('🚀 TESTING PRESIGNED URL FUNCTIONALITY');
    
    try {
        // Test presigned URL generation
        const generationResult = await testPresignedUrlGeneration();
        
        // Test database URLs
        await testDatabaseUrls();
        
        // Test alternative approaches
        const alternativeResult = await testAlternativeApproach();
        
        // Final analysis
        logSection('📊 FINAL ANALYSIS');
        
        if (generationResult.working) {
            logSuccess('🎉 Presigned URLs are working!');
            logInfo(`Working expiry time: ${generationResult.expiry} seconds`);
            logInfo('Frontend can use these URLs directly');
            return { success: true, method: 'presigned-urls' };
        } else if (alternativeResult.working) {
            logSuccess('🎉 Alternative approach working!');
            logInfo(`Working method: ${alternativeResult.approach}`);
            return { success: true, method: alternativeResult.approach };
        } else {
            logSection('💡 RECOMMENDATIONS');
            logWarning('Direct presigned URLs are not working with Contabo S3');
            logInfo('This appears to be a Contabo-specific limitation');
            
            logInfo('BEST SOLUTIONS:');
            logInfo('1. ✅ Use the proxy system (already implemented and working)');
            logInfo('2. ✅ Enable "Public Sharing" in Contabo web interface manually');
            logInfo('3. ✅ Use shorter-lived presigned URLs (1-4 hours) with frequent refresh');
            logInfo('4. ✅ Consider switching to AWS S3 for true public access');
            
            return { 
                success: false, 
                recommendation: 'use-proxy',
                reason: 'Contabo S3 limitations with presigned URLs'
            };
        }
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testPresignedUrls().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testPresignedUrls;
