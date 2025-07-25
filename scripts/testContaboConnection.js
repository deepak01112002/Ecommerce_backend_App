require('dotenv').config();
const contaboStorage = require('../services/contaboStorage');
const fs = require('fs');
const path = require('path');

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

async function testContaboConnection() {
    logSection('🚀 CONTABO S3 CONNECTION TEST');
    
    // Test 1: Environment Variables
    logSection('1. Environment Variables Check');
    
    const requiredEnvVars = [
        'CONTABO_REGION',
        'CONTABO_ENDPOINT', 
        'CONTABO_ACCESS_KEY',
        'CONTABO_SECRET_KEY',
        'CONTABO_BUCKET_NAME'
    ];
    
    let envVarsValid = true;
    
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            logSuccess(`${varName}: ${varName.includes('KEY') ? '***HIDDEN***' : process.env[varName]}`);
        } else {
            logError(`${varName}: Missing`);
            envVarsValid = false;
        }
    });
    
    if (!envVarsValid) {
        logError('Environment variables are missing. Please check your .env file.');
        return;
    }
    
    // Test 2: Basic Connection Test
    logSection('2. Basic Connection Test');
    
    try {
        const connectionResult = await contaboStorage.testConnection();
        
        if (connectionResult.success) {
            logSuccess('Connection to Contabo S3 successful!');
            logInfo(`Bucket: ${connectionResult.bucket}`);
            logInfo(`Endpoint: ${connectionResult.endpoint}`);
            logInfo(`Files in bucket: ${connectionResult.fileCount}`);
        } else {
            logError('Connection failed!');
            logError(`Error: ${connectionResult.error}`);
            return;
        }
    } catch (error) {
        logError(`Connection test failed: ${error.message}`);
        return;
    }
    
    // Test 3: Create Test Image
    logSection('3. Creating Test Image');
    
    let testImageBuffer;
    try {
        // Create a simple test image (1x1 pixel PNG)
        testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        logSuccess('Test image created (1x1 pixel PNG)');
    } catch (error) {
        logError(`Failed to create test image: ${error.message}`);
        return;
    }
    
    // Test 4: Upload Test
    logSection('4. File Upload Test');
    
    let uploadResult;
    try {
        uploadResult = await contaboStorage.uploadFile(
            testImageBuffer,
            'test-image.png',
            'image/png',
            'test-uploads'
        );
        
        if (uploadResult.success) {
            logSuccess('File uploaded successfully!');
            logInfo(`File name: ${uploadResult.fileName}`);
            logInfo(`Public URL: ${uploadResult.url}`);
            logInfo(`File size: ${uploadResult.size} bytes`);
            logInfo(`MIME type: ${uploadResult.mimeType}`);
        } else {
            logError('File upload failed!');
            return;
        }
    } catch (error) {
        logError(`Upload test failed: ${error.message}`);
        return;
    }
    
    // Test 5: File Exists Test
    logSection('5. File Exists Test');
    
    try {
        const exists = await contaboStorage.fileExists(uploadResult.fileName);
        if (exists) {
            logSuccess('File exists check passed!');
        } else {
            logError('File exists check failed - file not found');
        }
    } catch (error) {
        logError(`File exists test failed: ${error.message}`);
    }
    
    // Test 6: Presigned URL Test
    logSection('6. Presigned URL Test');
    
    try {
        // Test download presigned URL
        const downloadUrl = await contaboStorage.getSignedUrl(uploadResult.fileName, 3600);
        if (downloadUrl.success) {
            logSuccess('Download presigned URL generated successfully!');
            logInfo(`URL expires in: ${downloadUrl.expiresIn} seconds`);
        }
        
        // Test upload presigned URL
        const uploadUrl = await contaboStorage.getPresignedUploadUrl(
            'test-presigned-upload.png',
            'image/png',
            3600,
            'test-uploads'
        );
        if (uploadUrl.success) {
            logSuccess('Upload presigned URL generated successfully!');
            logInfo(`Upload URL: ${uploadUrl.uploadUrl.substring(0, 100)}...`);
            logInfo(`Public URL: ${uploadUrl.publicUrl}`);
        }
    } catch (error) {
        logError(`Presigned URL test failed: ${error.message}`);
    }
    
    // Test 7: List Files Test
    logSection('7. List Files Test');
    
    try {
        const listResult = await contaboStorage.listFiles('test-uploads', 10);
        if (listResult.success) {
            logSuccess(`Listed ${listResult.files.length} files in test-uploads folder`);
            listResult.files.forEach((file, index) => {
                logInfo(`${index + 1}. ${file.Key} (${file.Size} bytes)`);
            });
        }
    } catch (error) {
        logError(`List files test failed: ${error.message}`);
    }
    
    // Test 8: Bucket Statistics Test
    logSection('8. Bucket Statistics Test');
    
    try {
        const statsResult = await contaboStorage.getBucketStats();
        if (statsResult.success) {
            logSuccess('Bucket statistics retrieved successfully!');
            logInfo(`Total files: ${statsResult.stats.totalFiles}`);
            logInfo(`Total size: ${(statsResult.stats.totalSize / 1024).toFixed(2)} KB`);
            logInfo('Folders:');
            Object.entries(statsResult.stats.folders).forEach(([folder, stats]) => {
                logInfo(`  - ${folder}: ${stats.count} files, ${(stats.size / 1024).toFixed(2)} KB`);
            });
        }
    } catch (error) {
        logError(`Bucket statistics test failed: ${error.message}`);
    }
    
    // Test 9: Cleanup Test
    logSection('9. Cleanup Test');
    
    try {
        const deleteResult = await contaboStorage.deleteFile(uploadResult.fileName);
        if (deleteResult.success) {
            logSuccess('Test file deleted successfully!');
        }
    } catch (error) {
        logError(`Cleanup test failed: ${error.message}`);
    }
    
    // Final Summary
    logSection('🎉 TEST SUMMARY');
    logSuccess('All Contabo S3 tests completed!');
    logInfo('Your Contabo S3 bucket is properly configured and working.');
    logInfo('You can now use the Contabo storage service in your application.');
    
    console.log('\n' + '='.repeat(60));
    log('Next Steps:', 'magenta');
    log('1. Test the API endpoints using the provided routes', 'yellow');
    log('2. Update your frontend to use presigned URLs for uploads', 'yellow');
    log('3. Monitor your bucket usage through the admin panel', 'yellow');
    console.log('='.repeat(60) + '\n');
}

// Run the test
if (require.main === module) {
    testContaboConnection().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testContaboConnection;
