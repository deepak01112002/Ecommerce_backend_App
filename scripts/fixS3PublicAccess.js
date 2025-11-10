require('dotenv').config();
const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand, PutBucketAclCommand, GetBucketAclCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
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

async function checkCurrentBucketPolicy() {
    logSection('🔍 Checking Current Bucket Policy');
    
    try {
        const command = new GetBucketPolicyCommand({ Bucket: bucketName });
        const result = await s3Client.send(command);
        logSuccess('Current bucket policy found:');
        logInfo(JSON.stringify(JSON.parse(result.Policy), null, 2));
        return JSON.parse(result.Policy);
    } catch (error) {
        if (error.name === 'NoSuchBucketPolicy') {
            logWarning('No bucket policy currently set');
            return null;
        } else {
            logError(`Failed to get bucket policy: ${error.message}`);
            return null;
        }
    }
}

async function setBucketPublicReadPolicy() {
    logSection('🔧 Setting Bucket Public Read Policy');
    
    const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucketName}/*`
            }
        ]
    };
    
    try {
        const command = new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy)
        });
        
        await s3Client.send(command);
        logSuccess('Bucket policy set successfully for public read access');
        logInfo('Policy allows public read access to all objects in the bucket');
        return true;
    } catch (error) {
        logError(`Failed to set bucket policy: ${error.message}`);
        logError('This might be due to Contabo-specific limitations');
        return false;
    }
}

async function checkBucketACL() {
    logSection('🔍 Checking Bucket ACL');
    
    try {
        const command = new GetBucketAclCommand({ Bucket: bucketName });
        const result = await s3Client.send(command);
        logSuccess('Current bucket ACL:');
        logInfo(`Owner: ${result.Owner.DisplayName} (${result.Owner.ID})`);
        result.Grants.forEach((grant, index) => {
            logInfo(`Grant ${index + 1}: ${grant.Permission} to ${grant.Grantee.Type} ${grant.Grantee.DisplayName || grant.Grantee.URI || grant.Grantee.ID}`);
        });
        return result;
    } catch (error) {
        logError(`Failed to get bucket ACL: ${error.message}`);
        return null;
    }
}

async function uploadTestFileWithPublicACL() {
    logSection('📤 Testing File Upload with Public ACL');
    
    // Create a simple test image
    const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `test-public-access-${Date.now()}.png`;
    
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: testImageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
        };
        
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        
        const publicUrl = `${process.env.CONTABO_ENDPOINT}/${bucketName}/${fileName}`;
        logSuccess(`Test file uploaded: ${fileName}`);
        logInfo(`Public URL: ${publicUrl}`);
        
        return { fileName, publicUrl };
    } catch (error) {
        logError(`Failed to upload test file: ${error.message}`);
        return null;
    }
}

async function testPublicAccess(publicUrl) {
    logSection('🌐 Testing Public Access');
    
    try {
        logInfo(`Testing access to: ${publicUrl}`);
        const response = await axios.get(publicUrl, { timeout: 10000 });
        
        if (response.status === 200) {
            logSuccess('✅ Public access working! File is accessible via direct URL');
            logInfo(`Response status: ${response.status}`);
            logInfo(`Content type: ${response.headers['content-type']}`);
            logInfo(`Content length: ${response.headers['content-length']} bytes`);
            return true;
        } else {
            logWarning(`Unexpected response status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`❌ Public access failed: ${error.message}`);
        if (error.response) {
            logError(`Response status: ${error.response.status}`);
            logError(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

async function tryAlternativeUploadMethods() {
    logSection('🔄 Trying Alternative Upload Methods');
    
    const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const methods = [
        {
            name: 'Without ACL (default permissions)',
            params: {
                Bucket: bucketName,
                Key: `test-no-acl-${Date.now()}.png`,
                Body: testImageBuffer,
                ContentType: 'image/png',
                CacheControl: 'max-age=31536000'
            }
        },
        {
            name: 'With public-read-write ACL',
            params: {
                Bucket: bucketName,
                Key: `test-public-rw-${Date.now()}.png`,
                Body: testImageBuffer,
                ContentType: 'image/png',
                ACL: 'public-read-write',
                CacheControl: 'max-age=31536000'
            }
        }
    ];
    
    for (const method of methods) {
        try {
            logInfo(`Testing: ${method.name}`);
            const command = new PutObjectCommand(method.params);
            await s3Client.send(command);
            
            const publicUrl = `${process.env.CONTABO_ENDPOINT}/${bucketName}/${method.params.Key}`;
            logSuccess(`Uploaded: ${method.params.Key}`);
            
            // Test access
            const accessible = await testPublicAccess(publicUrl);
            if (accessible) {
                logSuccess(`✅ ${method.name} works for public access!`);
                return method.name;
            }
        } catch (error) {
            logError(`Failed ${method.name}: ${error.message}`);
        }
    }
    
    return null;
}

async function fixS3PublicAccess() {
    logSection('🚀 FIXING CONTABO S3 PUBLIC ACCESS');
    
    try {
        // Step 1: Check current bucket policy
        await checkCurrentBucketPolicy();
        
        // Step 2: Check bucket ACL
        await checkBucketACL();
        
        // Step 3: Try to set bucket policy for public read
        const policySet = await setBucketPublicReadPolicy();
        
        // Step 4: Upload test file with public ACL
        const testUpload = await uploadTestFileWithPublicACL();
        
        if (testUpload) {
            // Step 5: Test public access
            const publicAccessWorks = await testPublicAccess(testUpload.publicUrl);
            
            if (publicAccessWorks) {
                logSection('🎉 SUCCESS');
                logSuccess('Contabo S3 public access is working correctly!');
                logInfo('All uploaded files should now be publicly accessible');
                return true;
            } else {
                logSection('🔄 TRYING ALTERNATIVES');
                const workingMethod = await tryAlternativeUploadMethods();
                
                if (workingMethod) {
                    logSuccess(`Found working method: ${workingMethod}`);
                    return workingMethod;
                } else {
                    logSection('❌ CONTABO LIMITATIONS');
                    logError('Unable to configure public access with current settings');
                    logWarning('This might be a Contabo-specific limitation');
                    logInfo('Consider using presigned URLs for image access instead');
                    return false;
                }
            }
        }
        
    } catch (error) {
        logError(`Script execution failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

// Run the script if executed directly
if (require.main === module) {
    fixS3PublicAccess().catch(error => {
        logError(`Script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = fixS3PublicAccess;
