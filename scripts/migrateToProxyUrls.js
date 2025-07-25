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

function convertS3UrlToProxy(s3Url) {
    if (!s3Url || !s3Url.includes('contabostorage.com')) {
        return s3Url; // Return as-is if not an S3 URL
    }
    
    // Extract the key from the S3 URL
    const urlParts = s3Url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'ecommerce');
    
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const key = urlParts.slice(bucketIndex + 1).join('/');
        return contaboStorage.getProxyUrl(key);
    }
    
    return s3Url;
}

async function migrateCategoryImages() {
    logSection('📁 Migrating Category Images');
    
    try {
        const categories = await Category.find({});
        logInfo(`Found ${categories.length} categories to check`);
        
        let updatedCount = 0;
        
        for (const category of categories) {
            if (category.image && category.image.includes('contabostorage.com')) {
                const originalUrl = category.image;
                const proxyUrl = convertS3UrlToProxy(originalUrl);
                
                if (proxyUrl !== originalUrl) {
                    category.image = proxyUrl;
                    await category.save();
                    updatedCount++;
                    
                    logSuccess(`Updated category: ${category.name}`);
                    logInfo(`  Old: ${originalUrl}`);
                    logInfo(`  New: ${proxyUrl}`);
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
    logSection('📦 Migrating Product Images');
    
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
                    if (imageUrl && imageUrl.includes('contabostorage.com')) {
                        const proxyUrl = convertS3UrlToProxy(imageUrl);
                        updatedImages.push(proxyUrl);
                        
                        if (proxyUrl !== imageUrl) {
                            updatedImageCount++;
                            productUpdated = true;
                        }
                    } else {
                        updatedImages.push(imageUrl);
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
        const categoryS3Count = categories.filter(c => c.image && c.image.includes('contabostorage.com')).length;
        const categoryProxyCount = categories.filter(c => c.image && c.image.includes('/api/images/')).length;
        
        logInfo(`Categories with S3 URLs: ${categoryS3Count}`);
        logInfo(`Categories with proxy URLs: ${categoryProxyCount}`);
        
        // Check products
        const products = await Product.find({});
        let productS3Count = 0;
        let productProxyCount = 0;
        
        products.forEach(product => {
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (img && img.includes('contabostorage.com')) {
                        productS3Count++;
                    } else if (img && img.includes('/api/images/')) {
                        productProxyCount++;
                    }
                });
            }
        });
        
        logInfo(`Product images with S3 URLs: ${productS3Count}`);
        logInfo(`Product images with proxy URLs: ${productProxyCount}`);
        
        const totalS3 = categoryS3Count + productS3Count;
        const totalProxy = categoryProxyCount + productProxyCount;
        
        if (totalS3 === 0) {
            logSuccess('✅ Migration successful - No S3 URLs remaining');
        } else {
            logWarning(`⚠️ ${totalS3} S3 URLs still remain`);
        }
        
        logInfo(`Total proxy URLs: ${totalProxy}`);
        
        return { s3Count: totalS3, proxyCount: totalProxy };
        
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        throw error;
    }
}

async function migrateToProxyUrls() {
    logSection('🚀 MIGRATING S3 URLS TO PROXY URLS');
    
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
        logSuccess('Database URL migration completed!');
        logInfo(`Categories updated: ${categoryUpdates}`);
        logInfo(`Products updated: ${productUpdates.products}`);
        logInfo(`Product images updated: ${productUpdates.images}`);
        logInfo(`Remaining S3 URLs: ${verification.s3Count}`);
        logInfo(`Total proxy URLs: ${verification.proxyCount}`);
        
        if (verification.s3Count === 0) {
            logSection('🎉 MIGRATION SUCCESSFUL');
            logSuccess('All S3 URLs have been converted to proxy URLs!');
            logInfo('Images will now be accessible through the proxy system');
            logInfo('This solves the "Unauthorized" error for direct S3 access');
        } else {
            logSection('⚠️ PARTIAL MIGRATION');
            logWarning(`${verification.s3Count} S3 URLs still need manual attention`);
        }
        
        console.log('\n' + '='.repeat(60));
        log('Image Access Information:', 'magenta');
        log('• All images now use proxy URLs: /api/images/:folder/:filename', 'yellow');
        log('• Proxy URLs automatically redirect to presigned S3 URLs', 'yellow');
        log('• Caching is enabled for better performance', 'yellow');
        log('• Direct S3 access is blocked (401 Unauthorized)', 'yellow');
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
    migrateToProxyUrls().catch(error => {
        logError(`Migration script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = migrateToProxyUrls;
