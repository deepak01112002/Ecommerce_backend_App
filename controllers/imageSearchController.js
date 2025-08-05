const Product = require('../models/Product');
const imageSimilarityService = require('../services/imageSimilarityService');
const sharp = require('sharp');
const axios = require('axios');

class ImageSearchController {
    /**
     * Search for similar products by uploading an image
     */
    async searchByImage(req, res) {
        try {
            let imageBuffer;

            // Handle different input methods
            if (req.file) {
                // Image uploaded as multipart/form-data
                imageBuffer = req.file.buffer;
            } else if (req.body.imageUrl) {
                // Image provided as URL
                try {
                    const response = await axios.get(req.body.imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        maxContentLength: 10 * 1024 * 1024 // 10MB limit
                    });
                    imageBuffer = Buffer.from(response.data);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to fetch image from URL',
                        error: error.message
                    });
                }
            } else if (req.body.imageBase64) {
                // Image provided as base64
                try {
                    const base64Data = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
                    imageBuffer = Buffer.from(base64Data, 'base64');
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid base64 image data',
                        error: error.message
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'No image provided. Please upload an image file, provide imageUrl, or imageBase64'
                });
            }

            // Validate image
            try {
                const metadata = await sharp(imageBuffer).metadata();
                if (!metadata.width || !metadata.height) {
                    throw new Error('Invalid image format');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format. Please provide a valid image file.',
                    error: error.message
                });
            }

            // Get search parameters
            const {
                threshold = 60, // Minimum similarity percentage
                limit = 20,
                category,
                minPrice,
                maxPrice,
                includeInactive = false
            } = req.query;

            // Generate hash for the uploaded image
            const hashResult = await imageSimilarityService.generateMultipleHashes(imageBuffer);
            if (!hashResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process image',
                    error: hashResult.error
                });
            }

            // Build query for products with image hashes
            const query = {
                imageHashes: { $exists: true, $ne: [] }
            };

            if (!includeInactive) {
                query.isActive = true;
            }

            if (category) {
                query.category = category;
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                query.price = {};
                if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
                if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
            }

            // Get products with image hashes
            const products = await Product.find(query)
                .populate('category', 'name slug')
                .select('name price originalPrice images imageHashes category brand rating reviewCount stock isActive')
                .lean();

            if (products.length === 0) {
                return res.json({
                    success: true,
                    message: 'No products found with image hashes. Please run the hash generation script first.',
                    data: {
                        results: [],
                        searchInfo: {
                            totalProducts: 0,
                            threshold: parseFloat(threshold),
                            processingTime: 0
                        }
                    }
                });
            }

            const startTime = Date.now();

            // Find similar products
            const similarProducts = [];
            const targetHash = hashResult.hashes.standard;

            for (const product of products) {
                let maxSimilarity = 0;
                let bestMatch = null;

                // Check similarity with each image hash of the product
                for (const imageHash of product.imageHashes) {
                    const similarity = imageSimilarityService.calculateSimilarity(
                        targetHash,
                        imageHash.hashes.standard
                    );

                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        bestMatch = {
                            imageUrl: imageHash.imageUrl,
                            matchType: 'standard'
                        };
                    }

                    // Also check rotated versions
                    for (const [key, hash] of Object.entries(imageHash.hashes)) {
                        if (key !== 'standard' && hash) {
                            const rotatedSimilarity = imageSimilarityService.calculateSimilarity(
                                targetHash,
                                hash
                            );

                            if (rotatedSimilarity > maxSimilarity) {
                                maxSimilarity = rotatedSimilarity;
                                bestMatch = {
                                    imageUrl: imageHash.imageUrl,
                                    matchType: key
                                };
                            }
                        }
                    }
                }

                // Add to results if similarity meets threshold
                if (maxSimilarity >= parseFloat(threshold)) {
                    similarProducts.push({
                        ...product,
                        similarity: Math.round(maxSimilarity * 100) / 100,
                        bestMatch
                    });
                }
            }

            // Sort by similarity (highest first) and limit results
            const sortedResults = similarProducts
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, parseInt(limit));

            const processingTime = Date.now() - startTime;

            res.json({
                success: true,
                message: `Found ${sortedResults.length} similar products`,
                data: {
                    results: sortedResults,
                    searchInfo: {
                        totalProducts: products.length,
                        similarProducts: sortedResults.length,
                        threshold: parseFloat(threshold),
                        processingTime: `${processingTime}ms`,
                        uploadedImageInfo: {
                            hasMultipleHashes: Object.keys(hashResult.hashes).length > 1,
                            hashTypes: Object.keys(hashResult.hashes)
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Image search error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during image search',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

    /**
     * Generate and store hashes for a specific product's images
     */
    async generateProductHashes(req, res) {
        try {
            const { productId } = req.params;
            const { forceRegenerate = false } = req.query;

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Skip if hashes already exist and not forcing regeneration
            if (product.imageHashes && product.imageHashes.length > 0 && !forceRegenerate) {
                return res.json({
                    success: true,
                    message: 'Product already has image hashes. Use forceRegenerate=true to regenerate.',
                    data: {
                        productId: product._id,
                        existingHashes: product.imageHashes.length
                    }
                });
            }

            const generatedHashes = [];
            const errors = [];

            // Process each image
            for (const imageUrl of product.images) {
                try {
                    // Fetch image
                    const response = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        maxContentLength: 10 * 1024 * 1024 // 10MB limit
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
                    } else {
                        errors.push({
                            imageUrl,
                            error: analysis.error
                        });
                    }

                } catch (error) {
                    errors.push({
                        imageUrl,
                        error: error.message
                    });
                }
            }

            // Update product with generated hashes
            if (generatedHashes.length > 0) {
                product.imageHashes = generatedHashes;
                await product.save();
            }

            res.json({
                success: true,
                message: `Generated hashes for ${generatedHashes.length} images`,
                data: {
                    productId: product._id,
                    productName: product.name,
                    processedImages: generatedHashes.length,
                    totalImages: product.images.length,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

        } catch (error) {
            console.error('Hash generation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate image hashes',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

    /**
     * Get image search statistics
     */
    async getSearchStats(req, res) {
        try {
            const totalProducts = await Product.countDocuments({ isActive: true });
            const productsWithHashes = await Product.countDocuments({
                isActive: true,
                imageHashes: { $exists: true, $ne: [] }
            });

            const hashCoverage = totalProducts > 0 ? (productsWithHashes / totalProducts) * 100 : 0;

            // Get sample of recent hash generations
            const recentHashes = await Product.find({
                'imageHashes.createdAt': { $exists: true }
            })
            .sort({ 'imageHashes.createdAt': -1 })
            .limit(5)
            .select('name imageHashes.createdAt')
            .lean();

            res.json({
                success: true,
                data: {
                    statistics: {
                        totalProducts,
                        productsWithHashes,
                        hashCoverage: Math.round(hashCoverage * 100) / 100,
                        readyForSearch: hashCoverage > 0
                    },
                    recentActivity: recentHashes.map(product => ({
                        productId: product._id,
                        productName: product.name,
                        lastHashGenerated: product.imageHashes?.[0]?.createdAt
                    }))
                }
            });

        } catch (error) {
            console.error('Stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get search statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }
}

module.exports = new ImageSearchController();
