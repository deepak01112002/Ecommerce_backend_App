const imageSimilarityService = require('./imageSimilarityService');
const axios = require('axios');

class ProductImageHashService {
    /**
     * Generate hashes for product images automatically
     * @param {Array} imageUrls - Array of image URLs
     * @param {Object} options - Options for hash generation
     * @returns {Promise<Object>} Result with generated hashes and errors
     */
    async generateHashesForImages(imageUrls, options = {}) {
        const {
            skipExisting = false,
            timeout = 15000,
            maxRetries = 2
        } = options;

        if (!imageUrls || imageUrls.length === 0) {
            return {
                success: true,
                hashes: [],
                errors: [],
                message: 'No images to process'
            };
        }

        const generatedHashes = [];
        const errors = [];

        console.log(`🔄 Generating hashes for ${imageUrls.length} images...`);

        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            let retryCount = 0;
            let success = false;

            while (retryCount <= maxRetries && !success) {
                try {
                    console.log(`  📸 Processing image ${i + 1}/${imageUrls.length}: ${imageUrl.substring(0, 50)}...`);

                    // Fetch image with timeout and size limits
                    const response = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: timeout,
                        maxContentLength: 10 * 1024 * 1024, // 10MB limit
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; EcommerceBot/1.0)',
                            'Accept': 'image/*'
                        }
                    });

                    const imageBuffer = Buffer.from(response.data);

                    // Validate image buffer
                    if (imageBuffer.length === 0) {
                        throw new Error('Empty image buffer received');
                    }

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
                        console.log(`    ✅ Generated hash for image ${i + 1}`);
                        success = true;
                    } else {
                        throw new Error(analysis.error || 'Failed to analyze image');
                    }

                } catch (error) {
                    retryCount++;
                    const isLastRetry = retryCount > maxRetries;
                    
                    console.log(`    ${isLastRetry ? '❌' : '⚠️'} ${isLastRetry ? 'Failed' : 'Retry'} ${retryCount}/${maxRetries + 1} for image ${i + 1}: ${error.message}`);
                    
                    if (isLastRetry) {
                        errors.push({
                            imageUrl,
                            error: error.message,
                            retries: retryCount - 1
                        });
                    } else {
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    }
                }
            }

            // Small delay between images to avoid overwhelming the server
            if (i < imageUrls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        const result = {
            success: generatedHashes.length > 0,
            hashes: generatedHashes,
            errors: errors,
            stats: {
                total: imageUrls.length,
                processed: generatedHashes.length,
                failed: errors.length,
                successRate: imageUrls.length > 0 ? (generatedHashes.length / imageUrls.length * 100).toFixed(1) : 0
            }
        };

        if (generatedHashes.length > 0) {
            console.log(`✅ Hash generation completed: ${generatedHashes.length}/${imageUrls.length} images processed`);
        } else {
            console.log(`❌ Hash generation failed: No hashes generated for any images`);
        }

        return result;
    }

    /**
     * Generate hashes for a single image URL
     * @param {string} imageUrl - Single image URL
     * @param {Object} options - Options for hash generation
     * @returns {Promise<Object>} Result with generated hash or error
     */
    async generateHashForSingleImage(imageUrl, options = {}) {
        const result = await this.generateHashesForImages([imageUrl], options);
        
        return {
            success: result.success && result.hashes.length > 0,
            hash: result.hashes.length > 0 ? result.hashes[0] : null,
            error: result.errors.length > 0 ? result.errors[0].error : null
        };
    }

    /**
     * Update product with generated hashes (background process)
     * @param {Object} product - Product document
     * @param {Array} imageUrls - Array of image URLs
     * @param {Object} options - Options for hash generation
     */
    async generateHashesInBackground(product, imageUrls, options = {}) {
        // Run in background without blocking the response
        setImmediate(async () => {
            try {
                console.log(`🔄 Background hash generation started for product: ${product.name}`);
                
                const result = await this.generateHashesForImages(imageUrls, options);
                
                if (result.success && result.hashes.length > 0) {
                    // Update product with generated hashes
                    product.imageHashes = result.hashes;
                    await product.save();
                    
                    console.log(`✅ Background hash generation completed for product: ${product.name} (${result.hashes.length} hashes)`);
                } else {
                    console.log(`⚠️ Background hash generation failed for product: ${product.name}`);
                    if (result.errors.length > 0) {
                        console.log('Errors:', result.errors.map(e => e.error).join(', '));
                    }
                }
            } catch (error) {
                console.error(`❌ Background hash generation error for product ${product.name}:`, error.message);
            }
        });
    }

    /**
     * Check if images have changed and need hash regeneration
     * @param {Array} oldImages - Previous image URLs
     * @param {Array} newImages - New image URLs
     * @returns {boolean} True if images have changed
     */
    imagesChanged(oldImages = [], newImages = []) {
        if (oldImages.length !== newImages.length) {
            return true;
        }

        // Check if any image URL has changed
        for (let i = 0; i < oldImages.length; i++) {
            if (oldImages[i] !== newImages[i]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get hash generation statistics for monitoring
     * @returns {Object} Statistics about hash generation
     */
    getStats() {
        // This could be enhanced with actual metrics collection
        return {
            service: 'ProductImageHashService',
            version: '1.0.0',
            features: [
                'Automatic hash generation on product creation',
                'Background processing for non-blocking operations',
                'Retry mechanism for failed image processing',
                'Image change detection for updates',
                'Comprehensive error handling'
            ],
            limits: {
                maxImageSize: '10MB',
                timeout: '15 seconds',
                maxRetries: 2,
                delayBetweenImages: '200ms'
            }
        };
    }

    /**
     * Validate image URLs before processing
     * @param {Array} imageUrls - Array of image URLs to validate
     * @returns {Object} Validation result
     */
    validateImageUrls(imageUrls) {
        if (!Array.isArray(imageUrls)) {
            return {
                valid: false,
                error: 'Image URLs must be an array'
            };
        }

        const invalidUrls = [];
        const validUrls = [];

        for (const url of imageUrls) {
            if (typeof url !== 'string' || url.trim() === '') {
                invalidUrls.push({ url, reason: 'Empty or invalid URL' });
                continue;
            }

            try {
                new URL(url);
                validUrls.push(url);
            } catch (error) {
                invalidUrls.push({ url, reason: 'Invalid URL format' });
            }
        }

        return {
            valid: invalidUrls.length === 0,
            validUrls,
            invalidUrls,
            stats: {
                total: imageUrls.length,
                valid: validUrls.length,
                invalid: invalidUrls.length
            }
        };
    }
}

module.exports = new ProductImageHashService();
