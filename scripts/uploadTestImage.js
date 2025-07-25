require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function uploadTestImage() {
    logSection('📸 UPLOADING TEST IMAGE TO CONTABO S3');
    
    const imagePath = '/Users/rim/Application_ghansyam/Flux_Dev_create_a_photorealistic_cartooninspired_illustration__3.jpg';
    
    try {
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            logError(`Image file not found at: ${imagePath}`);
            return null;
        }
        
        logInfo(`Found image file: ${path.basename(imagePath)}`);
        
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const fileSize = (imageBuffer.length / 1024).toFixed(2);
        logInfo(`Image size: ${fileSize} KB`);
        
        // Upload to different folders for testing
        const uploads = [];
        
        // 1. Upload for categories
        logInfo('Uploading image for categories...');
        const categoryUpload = await contaboStorage.uploadFile(
            imageBuffer,
            'sample-category-image.jpg',
            'image/jpeg',
            'categories'
        );
        
        if (categoryUpload.success) {
            logSuccess('Category image uploaded successfully');
            logInfo(`Category image URL: ${categoryUpload.url}`);
            uploads.push({
                type: 'category',
                url: categoryUpload.url,
                fileName: categoryUpload.fileName
            });
        }
        
        // 2. Upload for products
        logInfo('Uploading image for products...');
        const productUpload = await contaboStorage.uploadFile(
            imageBuffer,
            'sample-product-image.jpg',
            'image/jpeg',
            'products'
        );
        
        if (productUpload.success) {
            logSuccess('Product image uploaded successfully');
            logInfo(`Product image URL: ${productUpload.url}`);
            uploads.push({
                type: 'product',
                url: productUpload.url,
                fileName: productUpload.fileName
            });
        }
        
        // 3. Upload additional product images
        for (let i = 2; i <= 4; i++) {
            logInfo(`Uploading additional product image ${i}...`);
            const additionalUpload = await contaboStorage.uploadFile(
                imageBuffer,
                `sample-product-image-${i}.jpg`,
                'image/jpeg',
                'products'
            );
            
            if (additionalUpload.success) {
                logSuccess(`Product image ${i} uploaded successfully`);
                uploads.push({
                    type: 'product',
                    url: additionalUpload.url,
                    fileName: additionalUpload.fileName
                });
            }
        }
        
        // 4. Upload for subcategories
        logInfo('Uploading images for subcategories...');
        const subcategoryUploads = [];
        for (let i = 1; i <= 3; i++) {
            const subcategoryUpload = await contaboStorage.uploadFile(
                imageBuffer,
                `sample-subcategory-${i}.jpg`,
                'image/jpeg',
                'categories'
            );
            
            if (subcategoryUpload.success) {
                logSuccess(`Subcategory ${i} image uploaded successfully`);
                subcategoryUploads.push({
                    type: 'subcategory',
                    url: subcategoryUpload.url,
                    fileName: subcategoryUpload.fileName
                });
            }
        }
        
        uploads.push(...subcategoryUploads);
        
        // Summary
        logSection('📊 UPLOAD SUMMARY');
        logSuccess(`Total uploads: ${uploads.length}`);
        
        uploads.forEach((upload, index) => {
            logInfo(`${index + 1}. ${upload.type}: ${upload.url}`);
        });
        
        // Save URLs to a file for easy access
        const urlsData = {
            uploadedAt: new Date().toISOString(),
            totalUploads: uploads.length,
            uploads: uploads
        };
        
        const outputPath = path.join(__dirname, 'uploaded-image-urls.json');
        fs.writeFileSync(outputPath, JSON.stringify(urlsData, null, 2));
        logSuccess(`URLs saved to: ${outputPath}`);
        
        // Test bucket stats after upload
        logSection('📈 UPDATED BUCKET STATISTICS');
        const stats = await contaboStorage.getBucketStats();
        if (stats.success) {
            logInfo(`Total files in bucket: ${stats.stats.totalFiles}`);
            logInfo(`Total bucket size: ${(stats.stats.totalSize / 1024).toFixed(2)} KB`);
            
            Object.entries(stats.stats.folders).forEach(([folder, folderStats]) => {
                logInfo(`📁 ${folder}: ${folderStats.count} files, ${(folderStats.size / 1024).toFixed(2)} KB`);
            });
        }
        
        logSection('🎉 IMAGE UPLOAD COMPLETE');
        logSuccess('All test images have been uploaded to Contabo S3 successfully!');
        logInfo('These images can now be used in the admin panel for creating categories and products.');
        
        return uploads;
        
    } catch (error) {
        logError(`Failed to upload image: ${error.message}`);
        console.error(error);
        return null;
    }
}

// Run the upload if this file is executed directly
if (require.main === module) {
    uploadTestImage().catch(error => {
        logError(`Upload script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = uploadTestImage;
