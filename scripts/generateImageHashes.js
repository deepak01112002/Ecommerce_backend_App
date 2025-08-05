require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const imageSimilarityService = require('../services/imageSimilarityService');
const axios = require('axios');
const colors = require('colors');

class ImageHashGenerator {
    constructor() {
        this.processedCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
        this.startTime = Date.now();
    }

    async connectDatabase() {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB'.green);
        } catch (error) {
            console.error('❌ MongoDB connection error:'.red, error.message);
            process.exit(1);
        }
    }

    async generateHashesForAllProducts(options = {}) {
        const {
            forceRegenerate = false,
            batchSize = 10,
            maxConcurrent = 3,
            skipExisting = true
        } = options;

        console.log('\n🚀 Starting image hash generation for all products...'.cyan);
        console.log(`Options:`.yellow);
        console.log(`  - Force regenerate: ${forceRegenerate}`);
        console.log(`  - Batch size: ${batchSize}`);
        console.log(`  - Max concurrent: ${maxConcurrent}`);
        console.log(`  - Skip existing: ${skipExisting}\n`);

        try {
            // Build query
            const query = { images: { $exists: true, $ne: [] } };
            
            if (skipExisting && !forceRegenerate) {
                query.$or = [
                    { imageHashes: { $exists: false } },
                    { imageHashes: { $size: 0 } }
                ];
            }

            const totalProducts = await Product.countDocuments(query);
            console.log(`📊 Found ${totalProducts} products to process`.blue);

            if (totalProducts === 0) {
                console.log('✅ No products need hash generation'.green);
                return;
            }

            // Process in batches
            let processed = 0;
            const limit = batchSize;

            while (processed < totalProducts) {
                const products = await Product.find(query)
                    .skip(processed)
                    .limit(limit)
                    .select('_id name images imageHashes')
                    .lean();

                if (products.length === 0) break;

                console.log(`\n📦 Processing batch ${Math.floor(processed / batchSize) + 1} (${products.length} products)`.cyan);

                // Process batch with concurrency control
                await this.processBatch(products, maxConcurrent, forceRegenerate);

                processed += products.length;
                
                // Progress update
                const progress = ((this.processedCount + this.errorCount + this.skippedCount) / totalProducts * 100).toFixed(1);
                console.log(`📈 Progress: ${progress}% (${this.processedCount} processed, ${this.errorCount} errors, ${this.skippedCount} skipped)`.yellow);
            }

            await this.printSummary();

        } catch (error) {
            console.error('❌ Error during batch processing:'.red, error.message);
        }
    }

    async processBatch(products, maxConcurrent, forceRegenerate) {
        const semaphore = new Array(maxConcurrent).fill(null);
        const promises = [];

        for (const product of products) {
            const promise = this.waitForSlot(semaphore).then(async (slotIndex) => {
                try {
                    await this.processProduct(product, forceRegenerate);
                } finally {
                    semaphore[slotIndex] = null; // Release slot
                }
            });
            promises.push(promise);
        }

        await Promise.all(promises);
    }

    async waitForSlot(semaphore) {
        return new Promise((resolve) => {
            const checkSlot = () => {
                const freeSlot = semaphore.findIndex(slot => slot === null);
                if (freeSlot !== -1) {
                    semaphore[freeSlot] = true; // Occupy slot
                    resolve(freeSlot);
                } else {
                    setTimeout(checkSlot, 100); // Check again in 100ms
                }
            };
            checkSlot();
        });
    }

    async processProduct(product, forceRegenerate) {
        try {
            console.log(`🔄 Processing: ${product.name} (${product.images.length} images)`.gray);

            // Skip if already has hashes and not forcing regeneration
            if (product.imageHashes && product.imageHashes.length > 0 && !forceRegenerate) {
                console.log(`⏭️  Skipped: ${product.name} (already has hashes)`.yellow);
                this.skippedCount++;
                return;
            }

            const generatedHashes = [];
            const imageErrors = [];

            // Process each image
            for (let i = 0; i < product.images.length; i++) {
                const imageUrl = product.images[i];
                
                try {
                    console.log(`  📸 Processing image ${i + 1}/${product.images.length}: ${imageUrl.substring(0, 50)}...`.gray);

                    // Fetch image with timeout and size limits
                    const response = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        maxContentLength: 10 * 1024 * 1024, // 10MB limit
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; ImageHashBot/1.0)'
                        }
                    });

                    const imageBuffer = Buffer.from(response.data);

                    // Generate comprehensive analysis
                    const analysis = await imageSimilarityService.analyzeImage(imageBuffer);
                    
                    if (analysis.success) {
                        generatedHashes.push({
                            imageUrl,
                            hashes: analysis.analysis.hashes,
                            colorHistogram: analysis.analysis.colorHistogram,
                            metadata: analysis.analysis.metadata,
                            createdAt: new Date()
                        });
                        console.log(`    ✅ Generated hash for image ${i + 1}`.green);
                    } else {
                        imageErrors.push({
                            imageUrl,
                            error: analysis.error
                        });
                        console.log(`    ❌ Failed to generate hash: ${analysis.error}`.red);
                    }

                } catch (error) {
                    imageErrors.push({
                        imageUrl,
                        error: error.message
                    });
                    console.log(`    ❌ Error processing image: ${error.message}`.red);
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Update product with generated hashes
            if (generatedHashes.length > 0) {
                await Product.findByIdAndUpdate(
                    product._id,
                    { imageHashes: generatedHashes },
                    { new: true }
                );

                console.log(`✅ Updated ${product.name}: ${generatedHashes.length}/${product.images.length} hashes generated`.green);
                this.processedCount++;
            } else {
                console.log(`❌ Failed to generate any hashes for ${product.name}`.red);
                this.errorCount++;
            }

            // Log errors if any
            if (imageErrors.length > 0) {
                console.log(`⚠️  Image errors for ${product.name}:`.yellow);
                imageErrors.forEach(err => {
                    console.log(`    - ${err.imageUrl}: ${err.error}`.yellow);
                });
            }

        } catch (error) {
            console.error(`❌ Error processing product ${product.name}:`.red, error.message);
            this.errorCount++;
        }
    }

    async generateHashesForSpecificProducts(productIds, forceRegenerate = false) {
        console.log(`\n🎯 Generating hashes for specific products: ${productIds.join(', ')}`.cyan);

        for (const productId of productIds) {
            try {
                const product = await Product.findById(productId).select('_id name images imageHashes').lean();
                
                if (!product) {
                    console.log(`❌ Product not found: ${productId}`.red);
                    this.errorCount++;
                    continue;
                }

                await this.processProduct(product, forceRegenerate);

            } catch (error) {
                console.error(`❌ Error processing product ${productId}:`.red, error.message);
                this.errorCount++;
            }
        }

        await this.printSummary();
    }

    async printSummary() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 HASH GENERATION SUMMARY'.cyan.bold);
        console.log('='.repeat(60).cyan);
        console.log(`✅ Successfully processed: ${this.processedCount}`.green);
        console.log(`❌ Errors: ${this.errorCount}`.red);
        console.log(`⏭️  Skipped: ${this.skippedCount}`.yellow);
        console.log(`⏱️  Total time: ${duration} seconds`.blue);
        console.log(`⚡ Average time per product: ${(duration / (this.processedCount + this.errorCount)).toFixed(2)} seconds`.blue);
        console.log('='.repeat(60).cyan);

        // Get updated statistics
        const totalProducts = await Product.countDocuments({ images: { $exists: true, $ne: [] } });
        const productsWithHashes = await Product.countDocuments({
            imageHashes: { $exists: true, $ne: [] }
        });
        const coverage = totalProducts > 0 ? (productsWithHashes / totalProducts * 100).toFixed(1) : 0;

        console.log('\n📈 CURRENT DATABASE STATUS'.blue.bold);
        console.log(`Total products with images: ${totalProducts}`);
        console.log(`Products with hashes: ${productsWithHashes}`);
        console.log(`Hash coverage: ${coverage}%`);
        
        if (coverage >= 80) {
            console.log('🎉 Great! Your image search system is ready to use!'.green.bold);
        } else if (coverage >= 50) {
            console.log('👍 Good progress! Consider running the script again for remaining products.'.yellow);
        } else {
            console.log('⚠️  Low coverage. Run the script again or check for errors.'.red);
        }
    }

    async cleanup() {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed'.gray);
    }
}

// CLI interface
async function main() {
    const generator = new ImageHashGenerator();
    
    try {
        await generator.connectDatabase();

        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'all':
                const forceRegenerate = args.includes('--force');
                const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 10;
                const maxConcurrent = parseInt(args.find(arg => arg.startsWith('--concurrent='))?.split('=')[1]) || 3;
                
                await generator.generateHashesForAllProducts({
                    forceRegenerate,
                    batchSize,
                    maxConcurrent
                });
                break;

            case 'products':
                const productIds = args.slice(1).filter(arg => !arg.startsWith('--'));
                const force = args.includes('--force');
                
                if (productIds.length === 0) {
                    console.log('❌ Please provide product IDs'.red);
                    process.exit(1);
                }
                
                await generator.generateHashesForSpecificProducts(productIds, force);
                break;

            default:
                console.log('📖 Usage:'.cyan.bold);
                console.log('  node generateImageHashes.js all [--force] [--batch=10] [--concurrent=3]');
                console.log('  node generateImageHashes.js products <productId1> <productId2> ... [--force]');
                console.log('');
                console.log('Examples:'.yellow);
                console.log('  node generateImageHashes.js all');
                console.log('  node generateImageHashes.js all --force --batch=5 --concurrent=2');
                console.log('  node generateImageHashes.js products 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012');
                break;
        }

    } catch (error) {
        console.error('❌ Fatal error:'.red, error.message);
        process.exit(1);
    } finally {
        await generator.cleanup();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Received SIGINT, shutting down gracefully...'.yellow);
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️  Received SIGTERM, shutting down gracefully...'.yellow);
    await mongoose.connection.close();
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = ImageHashGenerator;
