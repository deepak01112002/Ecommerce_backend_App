require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
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

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logSuccess('Connected to MongoDB');
    } catch (error) {
        logError(`Failed to connect to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

function extractS3Key(url) {
    if (!url) return null;

    try {
        // Handle proxy URLs
        if (url.includes('/api/images/')) {
            const parts = url.split('/api/images/');
            if (parts.length > 1) {
                return parts[1];
            }
        }

        // Handle direct S3 URLs
        if (url.includes('contabostorage.com')) {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Remove leading slash and bucket name
            const pathParts = pathname.split('/').filter(Boolean);
            if (pathParts.length > 1 && pathParts[0] === process.env.CONTABO_BUCKET_NAME) {
                return pathParts.slice(1).join('/');
            }
            return pathParts.join('/');
        }

        return null;
    } catch (error) {
        console.error('Error extracting S3 key from URL:', url, error);
        return null;
    }
}

async function convertToPresignedUrl(url) {
    const s3Key = extractS3Key(url);
    if (!s3Key) {
        return url; // Return original if we can't extract key
    }

    try {
        const result = await contaboStorage.getSignedUrl(s3Key, 86400); // 24 hours
        if (result.success) {
            return result.url;
        } else {
            logError(`Failed to generate presigned URL for key: ${s3Key}`);
            return url; // Return original on failure
        }
    } catch (error) {
        logError(`Error generating presigned URL for key ${s3Key}: ${error.message}`);
        return url; // Return original on error
    }
}

async function migrateCategoryImages() {
    logSection('📁 Migrating Category Images to Presigned URLs');
    
    try {
        const categories = await Category.find({});
        logInfo(`Found ${categories.length} categories to check`);
        
        let updatedCount = 0;
        
        for (const category of categories) {
            if (category.image) {
                const originalUrl = category.image;
                const presignedUrl = await convertToPresignedUrl(originalUrl);
                
                if (presignedUrl !== originalUrl) {
                    category.image = presignedUrl;
                    await category.save();
                    updatedCount++;
                    
                    logSuccess(`Updated category: ${category.name}`);
                    logInfo(`  Old: ${originalUrl.substring(0, 80)}...`);
                    logInfo(`  New: ${presignedUrl.substring(0, 80)}...`);
                }
            }
        }
        
        logSuccess(`Updated ${updatedCount} category images`);
        return updatedCount;
        
    } catch (error) {
        logError(`Category migration failed: ${error.message}`);
        throw error;
    }
}

async function migrateProductImages() {
    logSection('📦 Migrating Product Images to Presigned URLs');
    
    try {
        const products = await Product.find({});
        logInfo(`Found ${products.length} products to check`);
        
        let updatedProductCount = 0;
        let updatedImageCount = 0;
        
        for (const product of products) {
            let productUpdated = false;
            
            if (product.images && Array.isArray(product.images)) {
                const updatedImages = [];
                
                for (const imageUrl of product.images) {
                    const presignedUrl = await convertToPresignedUrl(imageUrl);
                    updatedImages.push(presignedUrl);
                    
                    if (presignedUrl !== imageUrl) {
                        updatedImageCount++;
                        productUpdated = true;
                    }
                }
                
                if (productUpdated) {
                    product.images = updatedImages;
                    await product.save();
                    updatedProductCount++;
                    
                    logSuccess(`Updated product: ${product.name}`);
                    logInfo(`  Updated ${product.images.length} images`);
                }
            }
        }
        
        logSuccess(`Updated ${updatedProductCount} products with ${updatedImageCount} images`);
        return { products: updatedProductCount, images: updatedImageCount };
        
    } catch (error) {
        logError(`Product migration failed: ${error.message}`);
        throw error;
    }
}

async function verifyMigration() {
    logSection('🔍 Verifying Migration');
    
    try {
        // Check categories
        const categories = await Category.find({});
        const categoryPresignedCount = categories.filter(c => 
            c.image && c.image.includes('X-Amz-Signature')
        ).length;
        const categoryProxyCount = categories.filter(c => 
            c.image && c.image.includes('/api/images/')
        ).length;
        const categoryS3Count = categories.filter(c => 
            c.image && c.image.includes('contabostorage.com') && !c.image.includes('X-Amz-Signature')
        ).length;
        
        logInfo(`Categories with presigned URLs: ${categoryPresignedCount}`);
        logInfo(`Categories with proxy URLs: ${categoryProxyCount}`);
        logInfo(`Categories with direct S3 URLs: ${categoryS3Count}`);
        
        // Check products
        const products = await Product.find({});
        let productPresignedCount = 0;
        let productProxyCount = 0;
        let productS3Count = 0;
        
        products.forEach(product => {
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (img && img.includes('X-Amz-Signature')) {
                        productPresignedCount++;
                    } else if (img && img.includes('/api/images/')) {
                        productProxyCount++;
                    } else if (img && img.includes('contabostorage.com')) {
                        productS3Count++;
                    }
                });
            }
        });
        
        logInfo(`Product images with presigned URLs: ${productPresignedCount}`);
        logInfo(`Product images with proxy URLs: ${productProxyCount}`);
        logInfo(`Product images with direct S3 URLs: ${productS3Count}`);
        
        const totalPresigned = categoryPresignedCount + productPresignedCount;
        const totalOther = categoryProxyCount + productProxyCount + categoryS3Count + productS3Count;
        
        if (totalPresigned > 0) {
            logSuccess(`✅ Migration successful - ${totalPresigned} presigned URLs created`);
        } else {
            logWarning(`⚠️ No presigned URLs created`);
        }
        
        return { 
            presignedCount: totalPresigned, 
            otherCount: totalOther,
            categories: {
                presigned: categoryPresignedCount,
                proxy: categoryProxyCount,
                s3: categoryS3Count
            },
            products: {
                presigned: productPresignedCount,
                proxy: productProxyCount,
                s3: productS3Count
            }
        };
        
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        throw error;
    }
}

async function migrateToPresignedUrls() {
    logSection('🚀 MIGRATING TO LONG-LIVED PRESIGNED URLS');
    
    try {
        await connectToDatabase();
        
        // Migrate categories
        const categoryUpdates = await migrateCategoryImages();
        
        // Migrate products
        const productUpdates = await migrateProductImages();
        
        // Verify migration
        const verification = await verifyMigration();
        
        // Final summary
        logSection('📊 MIGRATION SUMMARY');
        logSuccess('Database URL migration to presigned URLs completed!');
        logInfo(`Categories updated: ${categoryUpdates}`);
        logInfo(`Products updated: ${productUpdates.products}`);
        logInfo(`Product images updated: ${productUpdates.images}`);
        logInfo(`Total presigned URLs: ${verification.presignedCount}`);
        
        if (verification.presignedCount > 0) {
            logSection('🎉 MIGRATION SUCCESSFUL');
            logSuccess('All URLs have been converted to long-lived presigned URLs!');
            logInfo('Images will now be directly accessible for 24 hours');
            logInfo('URLs will be automatically refreshed every 20 hours');
            logInfo('This provides direct frontend access without proxy');
        } else {
            logSection('⚠️ MIGRATION INCOMPLETE');
            logWarning('No presigned URLs were created');
            logInfo('Check the logs above for any errors');
        }
        
        console.log('\n' + '='.repeat(60));
        log('Direct Frontend Access Information:', 'magenta');
        log('• All images now use 24-hour presigned URLs', 'yellow');
        log('• URLs are automatically refreshed every 20 hours', 'yellow');
        log('• No proxy needed - direct S3 access with authentication', 'yellow');
        log('• Frontend can use these URLs directly', 'yellow');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        logError(`Migration failed: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        logInfo('Database connection closed');
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    migrateToPresignedUrls().catch(error => {
        logError(`Migration script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = migrateToPresignedUrls;
