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

async function testUrlFormats() {
    logSection('🔍 TESTING DIFFERENT CONTABO URL FORMATS');
    
    const bucketName = process.env.CONTABO_BUCKET_NAME || 'ghayanshyam';
    const endpoint = process.env.CONTABO_ENDPOINT || 'https://sin1.contabostorage.com';
    const testFile = 'test-public-direct-1753383631253.png'; // File we uploaded earlier
    
    // Different URL formats to test
    const urlFormats = [
        {
            name: 'Standard S3 Format',
            url: `${endpoint}/${bucketName}/${testFile}`
        },
        {
            name: 'Path Style Format',
            url: `${endpoint}/${bucketName}/${testFile}`
        },
        {
            name: 'Virtual Hosted Style',
            url: `https://${bucketName}.${endpoint.replace('https://', '')}/${testFile}`
        },
        {
            name: 'Public Share Format (Contabo specific)',
            url: `${endpoint}/share/${bucketName}/${testFile}`
        },
        {
            name: 'Static Website Format',
            url: `${endpoint}/website/${bucketName}/${testFile}`
        },
        {
            name: 'Direct Access Format',
            url: `${endpoint}/public/${bucketName}/${testFile}`
        }
    ];
    
    logInfo(`Testing file: ${testFile}`);
    logInfo(`Bucket: ${bucketName}`);
    logInfo(`Endpoint: ${endpoint}`);
    
    const results = [];
    
    for (const format of urlFormats) {
        try {
            logInfo(`Testing: ${format.name}`);
            logInfo(`URL: ${format.url}`);
            
            const response = await axios.get(format.url, { 
                timeout: 10000,
                validateStatus: function (status) {
                    return status < 500; // Accept any status less than 500
                }
            });
            
            if (response.status === 200) {
                logSuccess(`✅ ${format.name} - WORKING!`);
                logInfo(`Content-Type: ${response.headers['content-type']}`);
                logInfo(`Content-Length: ${response.headers['content-length']} bytes`);
                results.push({ ...format, status: 'working', statusCode: 200 });
            } else {
                logWarning(`⚠️ ${format.name} - Status: ${response.status}`);
                if (response.data && typeof response.data === 'object') {
                    logInfo(`Response: ${JSON.stringify(response.data)}`);
                }
                results.push({ ...format, status: 'failed', statusCode: response.status, error: response.data });
            }
            
        } catch (error) {
            logError(`❌ ${format.name} - Error: ${error.message}`);
            if (error.response) {
                logError(`Status: ${error.response.status}`);
                if (error.response.data && typeof error.response.data === 'object') {
                    logError(`Data: ${JSON.stringify(error.response.data)}`);
                }
            }
            results.push({ 
                ...format, 
                status: 'error', 
                statusCode: error.response?.status || 'N/A',
                error: error.response?.data || error.message 
            });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

async function testExistingImages() {
    logSection('🖼️ TESTING EXISTING DATABASE IMAGES');
    
    try {
        // Get some existing products to test their images
        const productsResponse = await axios.get('http://localhost:8080/api/products');
        
        if (productsResponse.data && productsResponse.data.data) {
            const products = productsResponse.data.data;
            logInfo(`Found ${products.length} products to test`);
            
            for (const product of products.slice(0, 2)) { // Test first 2 products
                if (product.images && product.images.length > 0) {
                    logInfo(`Testing product: ${product.name}`);
                    
                    for (const imageUrl of product.images.slice(0, 1)) { // Test first image
                        // Extract the S3 key from the proxy URL
                        if (imageUrl.includes('/api/images/')) {
                            const urlParts = imageUrl.split('/api/images/');
                            if (urlParts.length > 1) {
                                const s3Key = urlParts[1];
                                const directS3Url = `${process.env.CONTABO_ENDPOINT}/${process.env.CONTABO_BUCKET_NAME}/${s3Key}`;
                                
                                logInfo(`Proxy URL: ${imageUrl}`);
                                logInfo(`Direct S3 URL: ${directS3Url}`);
                                
                                try {
                                    const response = await axios.get(directS3Url, { timeout: 5000 });
                                    if (response.status === 200) {
                                        logSuccess(`✅ Direct S3 access working for: ${s3Key}`);
                                        return { working: true, url: directS3Url, key: s3Key };
                                    }
                                } catch (error) {
                                    logError(`❌ Direct S3 access failed: ${error.message}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        logError(`Database images test error: ${error.message}`);
    }
    
    return { working: false };
}

async function testContaboPublicUrls() {
    logSection('🚀 TESTING CONTABO PUBLIC URL FORMATS');
    
    try {
        // Test different URL formats
        const formatResults = await testUrlFormats();
        
        // Test existing database images
        const existingImageResult = await testExistingImages();
        
        // Analyze results
        logSection('📊 TEST RESULTS ANALYSIS');
        
        const workingFormats = formatResults.filter(r => r.status === 'working');
        const failedFormats = formatResults.filter(r => r.status !== 'working');
        
        logInfo(`Working URL formats: ${workingFormats.length}`);
        logInfo(`Failed URL formats: ${failedFormats.length}`);
        
        if (workingFormats.length > 0) {
            logSection('🎉 SUCCESS - FOUND WORKING URL FORMAT');
            workingFormats.forEach(format => {
                logSuccess(`✅ ${format.name}`);
                logInfo(`   URL: ${format.url}`);
            });
            
            return {
                success: true,
                workingFormats: workingFormats,
                recommendedFormat: workingFormats[0]
            };
        } else {
            logSection('❌ NO WORKING URL FORMATS FOUND');
            logError('All URL formats failed to provide direct public access');
            
            logSection('📋 DETAILED FAILURE ANALYSIS');
            failedFormats.forEach(format => {
                logError(`❌ ${format.name} - Status: ${format.statusCode}`);
                if (format.error && typeof format.error === 'object') {
                    logInfo(`   Error: ${JSON.stringify(format.error)}`);
                } else if (format.error) {
                    logInfo(`   Error: ${format.error}`);
                }
            });
            
            logSection('💡 RECOMMENDATIONS');
            logInfo('1. Enable "Public Sharing" in Contabo web interface');
            logInfo('2. Contact Contabo support for public access configuration');
            logInfo('3. Continue using the proxy system (already working)');
            logInfo('4. Consider using presigned URLs with longer expiry times');
            
            return {
                success: false,
                reason: 'No working public URL format found',
                failedFormats: failedFormats
            };
        }
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        console.error(error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testContaboPublicUrls().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testContaboPublicUrls;
