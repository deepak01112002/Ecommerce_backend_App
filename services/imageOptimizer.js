const sharp = require('sharp');
const path = require('path');

class ImageOptimizer {
    constructor() {
        // Default optimization settings
        this.defaultSettings = {
            jpeg: {
                quality: 85,
                progressive: true,
                mozjpeg: true
            },
            png: {
                quality: 90,
                compressionLevel: 8,
                progressive: true
            },
            webp: {
                quality: 85,
                effort: 6
            },
            resize: {
                maxWidth: 1920,
                maxHeight: 1920,
                fit: 'inside',
                withoutEnlargement: true
            },
            thumbnail: {
                width: 300,
                height: 300,
                fit: 'cover'
            }
        };
    }

    /**
     * Get file extension from mime type
     */
    getExtensionFromMimeType(mimeType) {
        const mimeToExt = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff'
        };
        return mimeToExt[mimeType.toLowerCase()] || 'jpg';
    }

    /**
     * Check if file is an image
     */
    isImage(mimeType) {
        return mimeType && mimeType.startsWith('image/');
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                channels: metadata.channels
            };
        } catch (error) {
            throw new Error(`Failed to get image metadata: ${error.message}`);
        }
    }

    /**
     * Optimize image based on format and settings
     */
    async optimizeImage(buffer, options = {}) {
        try {
            const {
                format = 'auto',
                quality = null,
                resize = true,
                progressive = true,
                maxWidth = this.defaultSettings.resize.maxWidth,
                maxHeight = this.defaultSettings.resize.maxHeight
            } = options;

            let sharpInstance = sharp(buffer);

            // Get original metadata
            const metadata = await sharpInstance.metadata();
            const originalFormat = metadata.format;
            const originalSize = buffer.length;

            // Resize if needed and requested
            if (resize && (metadata.width > maxWidth || metadata.height > maxHeight)) {
                sharpInstance = sharpInstance.resize({
                    width: maxWidth,
                    height: maxHeight,
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Determine output format
            let outputFormat = format === 'auto' ? originalFormat : format;
            
            // Convert GIF to PNG for better optimization (unless specifically requested)
            if (originalFormat === 'gif' && format === 'auto') {
                outputFormat = 'png';
            }

            // Apply format-specific optimizations
            switch (outputFormat) {
                case 'jpeg':
                case 'jpg':
                    sharpInstance = sharpInstance.jpeg({
                        quality: quality || this.defaultSettings.jpeg.quality,
                        progressive: progressive,
                        mozjpeg: this.defaultSettings.jpeg.mozjpeg
                    });
                    break;

                case 'png':
                    sharpInstance = sharpInstance.png({
                        quality: quality || this.defaultSettings.png.quality,
                        compressionLevel: this.defaultSettings.png.compressionLevel,
                        progressive: progressive
                    });
                    break;

                case 'webp':
                    sharpInstance = sharpInstance.webp({
                        quality: quality || this.defaultSettings.webp.quality,
                        effort: this.defaultSettings.webp.effort
                    });
                    break;

                default:
                    // Keep original format with basic optimization
                    break;
            }

            const optimizedBuffer = await sharpInstance.toBuffer();
            const optimizedSize = optimizedBuffer.length;
            const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

            return {
                success: true,
                buffer: optimizedBuffer,
                metadata: {
                    originalSize,
                    optimizedSize,
                    compressionRatio: parseFloat(compressionRatio),
                    originalFormat,
                    outputFormat,
                    width: metadata.width,
                    height: metadata.height
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                buffer: buffer // Return original buffer on error
            };
        }
    }

    /**
     * Create thumbnail
     */
    async createThumbnail(buffer, options = {}) {
        try {
            const {
                width = this.defaultSettings.thumbnail.width,
                height = this.defaultSettings.thumbnail.height,
                fit = this.defaultSettings.thumbnail.fit,
                format = 'jpeg',
                quality = 80
            } = options;

            let sharpInstance = sharp(buffer)
                .resize({
                    width,
                    height,
                    fit,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                });

            // Apply format-specific settings
            switch (format) {
                case 'jpeg':
                case 'jpg':
                    sharpInstance = sharpInstance.jpeg({ quality });
                    break;
                case 'png':
                    sharpInstance = sharpInstance.png({ quality });
                    break;
                case 'webp':
                    sharpInstance = sharpInstance.webp({ quality });
                    break;
            }

            const thumbnailBuffer = await sharpInstance.toBuffer();

            return {
                success: true,
                buffer: thumbnailBuffer,
                size: thumbnailBuffer.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process image with multiple variants (original, optimized, thumbnail)
     */
    async processImageVariants(buffer, originalName, options = {}) {
        try {
            const {
                createThumbnail = true,
                optimizeOriginal = true,
                thumbnailSuffix = '_thumb',
                formats = ['original'] // Can include 'webp', 'jpeg', etc.
            } = options;

            const results = {
                original: null,
                optimized: null,
                thumbnail: null,
                variants: []
            };

            // Get original metadata
            const metadata = await this.getImageMetadata(buffer);
            
            // Process original/optimized version
            if (optimizeOriginal) {
                const optimized = await this.optimizeImage(buffer, options);
                if (optimized.success) {
                    results.optimized = {
                        buffer: optimized.buffer,
                        metadata: optimized.metadata,
                        filename: originalName
                    };
                } else {
                    results.original = {
                        buffer: buffer,
                        metadata: metadata,
                        filename: originalName
                    };
                }
            } else {
                results.original = {
                    buffer: buffer,
                    metadata: metadata,
                    filename: originalName
                };
            }

            // Create thumbnail
            if (createThumbnail) {
                const thumbnail = await this.createThumbnail(buffer);
                if (thumbnail.success) {
                    const ext = path.extname(originalName);
                    const name = path.basename(originalName, ext);
                    const thumbnailName = `${name}${thumbnailSuffix}${ext}`;
                    
                    results.thumbnail = {
                        buffer: thumbnail.buffer,
                        size: thumbnail.size,
                        filename: thumbnailName
                    };
                }
            }

            // Create additional format variants
            for (const format of formats) {
                if (format !== 'original') {
                    const variant = await this.optimizeImage(buffer, { ...options, format });
                    if (variant.success) {
                        const ext = path.extname(originalName);
                        const name = path.basename(originalName, ext);
                        const variantName = `${name}.${format}`;
                        
                        results.variants.push({
                            format,
                            buffer: variant.buffer,
                            metadata: variant.metadata,
                            filename: variantName
                        });
                    }
                }
            }

            return {
                success: true,
                results
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get optimization recommendations based on image
     */
    async getOptimizationRecommendations(buffer) {
        try {
            const metadata = await this.getImageMetadata(buffer);
            const recommendations = [];

            // Size recommendations
            if (metadata.width > 1920 || metadata.height > 1920) {
                recommendations.push({
                    type: 'resize',
                    message: 'Image is larger than 1920px, consider resizing for web use',
                    suggestion: 'Resize to max 1920x1920px'
                });
            }

            // Format recommendations
            if (metadata.format === 'png' && !metadata.hasAlpha) {
                recommendations.push({
                    type: 'format',
                    message: 'PNG without transparency could be converted to JPEG for smaller size',
                    suggestion: 'Convert to JPEG format'
                });
            }

            if (metadata.format === 'bmp' || metadata.format === 'tiff') {
                recommendations.push({
                    type: 'format',
                    message: 'Consider converting to web-optimized format',
                    suggestion: 'Convert to JPEG or PNG'
                });
            }

            // Quality recommendations
            const sizeInMB = metadata.size / (1024 * 1024);
            if (sizeInMB > 2) {
                recommendations.push({
                    type: 'compression',
                    message: 'Image file size is large, consider compression',
                    suggestion: 'Apply compression to reduce file size'
                });
            }

            return {
                success: true,
                metadata,
                recommendations
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

module.exports = imageOptimizer;
