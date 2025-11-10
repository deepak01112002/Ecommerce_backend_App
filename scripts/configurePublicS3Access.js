require('dotenv').config();
const { 
    S3Client, 
    PutBucketPolicyCommand, 
    GetBucketPolicyCommand,
    PutBucketCorsCommand,
    GetBucketCorsCommand,
    PutBucketAclCommand,
    GetBucketAclCommand,
    PutObjectCommand,
    PutPublicAccessBlockCommand,
    GetPublicAccessBlockCommand
} = require('@aws-sdk/client-s3');
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

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.CONTABO_REGION || 'sin1',
    endpoint: process.env.CONTABO_ENDPOINT || 'https://sin1.contabostorage.com',
    credentials: {
        accessKeyId: process.env.CONTABO_ACCESS_KEY,
        secretAccessKey: process.env.CONTABO_SECRET_KEY
    },
    forcePathStyle: true,
});

const bucketName = process.env.CONTABO_BUCKET_NAME || 'ghayanshyam';

async function disablePublicAccessBlock() {
    logSection('🔓 Disabling Public Access Block');
    
    try {
        // First check current settings
        try {
            const getCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
            const currentSettings = await s3Client.send(getCommand);
            logInfo('Current public access block settings:');
            logInfo(JSON.stringify(currentSettings.PublicAccessBlockConfiguration, null, 2));
        } catch (error) {
            logInfo('No public access block configuration found (this is good for public access)');
        }
        
        // Try to disable public access block
        const putCommand = new PutPublicAccessBlockCommand({
            Bucket: bucketName,
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false,
                RestrictPublicBuckets: false
            }
        });
        
        await s3Client.send(putCommand);
        logSuccess('Public access block disabled successfully');
        return true;
    } catch (error) {
        logWarning(`Could not modify public access block: ${error.message}`);
        logInfo('This might be a Contabo-specific limitation, continuing...');
        return false;
    }
}

async function setBucketPublicReadPolicy() {
    logSection('📋 Setting Bucket Public Read Policy');
    
    const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: [
                    's3:GetObject',
                    's3:GetObjectVersion'
                ],
                Resource: [
                    `arn:aws:s3:::${bucketName}/*`,
                    `arn:aws:s3:::${bucketName}`
                ]
            },
            {
                Sid: 'PublicListBucket',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:ListBucket',
                Resource: `arn:aws:s3:::${bucketName}`
            }
        ]
    };
    
    try {
        const command = new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy, null, 2)
        });
        
        await s3Client.send(command);
        logSuccess('Bucket policy set for public read access');
        logInfo('Policy allows public read access to all objects');
        return true;
    } catch (error) {
        logError(`Failed to set bucket policy: ${error.message}`);
        return false;
    }
}

async function setBucketCORS() {
    logSection('🌐 Setting CORS Configuration');
    
    const corsConfiguration = {
        CORSRules: [
            {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
                MaxAgeSeconds: 3600
            }
        ]
    };
    
    try {
        const command = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: corsConfiguration
        });
        
        await s3Client.send(command);
        logSuccess('CORS configuration set successfully');
        logInfo('CORS allows GET requests from any origin');
        return true;
    } catch (error) {
        logError(`Failed to set CORS: ${error.message}`);
        return false;
    }
}

async function setBucketACL() {
    logSection('🔐 Setting Bucket ACL');
    
    try {
        const command = new PutBucketAclCommand({
            Bucket: bucketName,
            ACL: 'public-read'
        });
        
        await s3Client.send(command);
        logSuccess('Bucket ACL set to public-read');
        return true;
    } catch (error) {
        logError(`Failed to set bucket ACL: ${error.message}`);
        logWarning('This might be a Contabo limitation');
        return false;
    }
}

async function uploadTestFileWithPublicAccess() {
    logSection('📤 Testing File Upload with Public Access');
    
    // Create a simple test image
    const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `test-public-direct-${Date.now()}.png`;
    
    const uploadMethods = [
        {
            name: 'With public-read ACL',
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: testImageBuffer,
                ContentType: 'image/png',
                ACL: 'public-read',
                CacheControl: 'max-age=31536000'
            }
        },
        {
            name: 'With public-read-write ACL',
            params: {
                Bucket: bucketName,
                Key: `rw-${fileName}`,
                Body: testImageBuffer,
                ContentType: 'image/png',
                ACL: 'public-read-write',
                CacheControl: 'max-age=31536000'
            }
        },
        {
            name: 'Without ACL (bucket policy only)',
            params: {
                Bucket: bucketName,
                Key: `no-acl-${fileName}`,
                Body: testImageBuffer,
                ContentType: 'image/png',
                CacheControl: 'max-age=31536000'
            }
        }
    ];
    
    const results = [];
    
    for (const method of uploadMethods) {
        try {
            logInfo(`Testing: ${method.name}`);
            const command = new PutObjectCommand(method.params);
            await s3Client.send(command);
            
            const publicUrl = `${process.env.CONTABO_ENDPOINT}/${bucketName}/${method.params.Key}`;
            logSuccess(`Uploaded: ${method.params.Key}`);
            
            // Test direct access
            const accessible = await testDirectAccess(publicUrl);
            results.push({
                method: method.name,
                key: method.params.Key,
                url: publicUrl,
                accessible
            });
            
        } catch (error) {
            logError(`Failed ${method.name}: ${error.message}`);
            results.push({
                method: method.name,
                error: error.message,
                accessible: false
            });
        }
    }
    
    return results;
}

async function testDirectAccess(url) {
    try {
        logInfo(`Testing direct access: ${url}`);
        const response = await axios.get(url, { 
            timeout: 10000,
            validateStatus: function (status) {
                return status < 500; // Accept any status less than 500
            }
        });
        
        if (response.status === 200) {
            logSuccess(`✅ Direct access working! Status: ${response.status}`);
            logInfo(`Content-Type: ${response.headers['content-type']}`);
            logInfo(`Content-Length: ${response.headers['content-length']} bytes`);
            return true;
        } else {
            logWarning(`⚠️ Unexpected status: ${response.status}`);
            if (response.data) {
                logInfo(`Response: ${JSON.stringify(response.data)}`);
            }
            return false;
        }
    } catch (error) {
        logError(`❌ Direct access failed: ${error.message}`);
        if (error.response) {
            logError(`Status: ${error.response.status}`);
            logError(`Data: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

async function configurePublicS3Access() {
    logSection('🚀 CONFIGURING CONTABO S3 FOR DIRECT PUBLIC ACCESS');
    
    try {
        logInfo(`Configuring bucket: ${bucketName}`);
        logInfo(`Endpoint: ${process.env.CONTABO_ENDPOINT}`);
        
        // Step 1: Disable public access block
        await disablePublicAccessBlock();
        
        // Step 2: Set bucket ACL
        await setBucketACL();
        
        // Step 3: Set bucket policy
        const policySet = await setBucketPublicReadPolicy();
        
        // Step 4: Set CORS configuration
        await setBucketCORS();
        
        // Step 5: Test with different upload methods
        const testResults = await uploadTestFileWithPublicAccess();
        
        // Step 6: Analyze results
        logSection('📊 CONFIGURATION RESULTS');
        
        const workingMethods = testResults.filter(r => r.accessible);
        const failedMethods = testResults.filter(r => !r.accessible);
        
        logInfo(`Working methods: ${workingMethods.length}`);
        logInfo(`Failed methods: ${failedMethods.length}`);
        
        if (workingMethods.length > 0) {
            logSection('🎉 SUCCESS - DIRECT PUBLIC ACCESS WORKING');
            logSuccess('Found working configuration for direct public access!');
            
            workingMethods.forEach(method => {
                logSuccess(`✅ ${method.method}`);
                logInfo(`   URL: ${method.url}`);
            });
            
            logSection('📋 RECOMMENDED CONFIGURATION');
            const bestMethod = workingMethods[0];
            logInfo('Use this configuration for uploads:');
            logInfo('- ACL: public-read (if supported)');
            logInfo('- Bucket Policy: Public read access enabled');
            logInfo('- CORS: Configured for web access');
            
            return {
                success: true,
                workingMethod: bestMethod.method,
                testUrl: bestMethod.url
            };
            
        } else {
            logSection('❌ CONTABO LIMITATIONS CONFIRMED');
            logError('Direct public access is not supported by Contabo S3');
            logWarning('All upload methods failed to create publicly accessible files');
            logInfo('This is a Contabo-specific limitation, not a configuration issue');
            
            logSection('💡 ALTERNATIVE SOLUTIONS');
            logInfo('1. Use presigned URLs for temporary access');
            logInfo('2. Use proxy system (already implemented)');
            logInfo('3. Consider switching to AWS S3 for true public access');
            
            return {
                success: false,
                reason: 'Contabo S3 does not support direct public access'
            };
        }
        
    } catch (error) {
        logError(`Configuration failed: ${error.message}`);
        console.error(error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the configuration if this file is executed directly
if (require.main === module) {
    configurePublicS3Access().catch(error => {
        logError(`Configuration script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = configurePublicS3Access;
