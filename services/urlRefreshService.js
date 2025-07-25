const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const contaboStorage = require('./contaboStorage');
const cron = require('node-cron');

class URLRefreshService {
    constructor() {
        this.isRunning = false;
        this.refreshInterval = null;
    }

    /**
     * Start the URL refresh service
     */
    start() {
        if (this.isRunning) {
            console.log('URL Refresh Service is already running');
            return;
        }

        console.log('🔄 Starting URL Refresh Service...');
        
        // Run every 20 hours (URLs expire in 24 hours, refresh at 20 hours)
        this.refreshInterval = cron.schedule('0 */20 * * *', async () => {
            await this.refreshAllUrls();
        }, {
            scheduled: false
        });

        this.refreshInterval.start();
        this.isRunning = true;
        
        console.log('✅ URL Refresh Service started - will refresh URLs every 20 hours');
        
        // Run initial refresh after 1 minute
        setTimeout(() => {
            this.refreshAllUrls();
        }, 60000);
    }

    /**
     * Stop the URL refresh service
     */
    stop() {
        if (this.refreshInterval) {
            this.refreshInterval.stop();
            this.refreshInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 URL Refresh Service stopped');
    }

    /**
     * Check if a URL needs refreshing (expires within 4 hours)
     */
    needsRefresh(url) {
        if (!url || !url.includes('X-Amz-Expires=')) {
            return true; // If it's not a presigned URL, it needs refreshing
        }

        try {
            const urlObj = new URL(url);
            const expiresParam = urlObj.searchParams.get('X-Amz-Expires');
            const dateParam = urlObj.searchParams.get('X-Amz-Date');
            
            if (!expiresParam || !dateParam) {
                return true;
            }

            // Parse the date and expiry
            const signedDate = new Date(
                dateParam.substring(0, 4) + '-' +
                dateParam.substring(4, 6) + '-' +
                dateParam.substring(6, 8) + 'T' +
                dateParam.substring(9, 11) + ':' +
                dateParam.substring(11, 13) + ':' +
                dateParam.substring(13, 15) + 'Z'
            );
            
            const expiryTime = new Date(signedDate.getTime() + (parseInt(expiresParam) * 1000));
            const now = new Date();
            const timeUntilExpiry = expiryTime.getTime() - now.getTime();
            const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

            // Refresh if expires within 4 hours
            return hoursUntilExpiry <= 4;
        } catch (error) {
            console.error('Error checking URL expiry:', error);
            return true; // If we can't parse it, refresh it
        }
    }

    /**
     * Extract S3 key from various URL formats
     */
    extractS3Key(url) {
        if (!url) return null;

        try {
            // Handle presigned URLs
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

            // Handle proxy URLs
            if (url.includes('/api/images/')) {
                const parts = url.split('/api/images/');
                if (parts.length > 1) {
                    return parts[1];
                }
            }

            return null;
        } catch (error) {
            console.error('Error extracting S3 key from URL:', url, error);
            return null;
        }
    }

    /**
     * Refresh a single URL
     */
    async refreshUrl(url) {
        const s3Key = this.extractS3Key(url);
        if (!s3Key) {
            return url; // Return original if we can't extract key
        }

        try {
            const result = await contaboStorage.getSignedUrl(s3Key, 86400); // 24 hours
            if (result.success) {
                return result.url;
            } else {
                console.error(`Failed to refresh URL for key: ${s3Key}`);
                return url; // Return original on failure
            }
        } catch (error) {
            console.error(`Error refreshing URL for key ${s3Key}:`, error);
            return url; // Return original on error
        }
    }

    /**
     * Refresh all category image URLs
     */
    async refreshCategoryUrls() {
        try {
            const categories = await Category.find({});
            let refreshedCount = 0;

            for (const category of categories) {
                if (category.image && this.needsRefresh(category.image)) {
                    const newUrl = await this.refreshUrl(category.image);
                    if (newUrl !== category.image) {
                        category.image = newUrl;
                        await category.save();
                        refreshedCount++;
                        console.log(`✅ Refreshed category image: ${category.name}`);
                    }
                }
            }

            console.log(`🔄 Refreshed ${refreshedCount} category image URLs`);
            return refreshedCount;
        } catch (error) {
            console.error('Error refreshing category URLs:', error);
            return 0;
        }
    }

    /**
     * Refresh all product image URLs
     */
    async refreshProductUrls() {
        try {
            const products = await Product.find({});
            let refreshedCount = 0;

            for (const product of products) {
                if (product.images && Array.isArray(product.images)) {
                    let productUpdated = false;
                    const newImages = [];

                    for (const imageUrl of product.images) {
                        if (this.needsRefresh(imageUrl)) {
                            const newUrl = await this.refreshUrl(imageUrl);
                            newImages.push(newUrl);
                            if (newUrl !== imageUrl) {
                                productUpdated = true;
                                refreshedCount++;
                            }
                        } else {
                            newImages.push(imageUrl);
                        }
                    }

                    if (productUpdated) {
                        product.images = newImages;
                        await product.save();
                        console.log(`✅ Refreshed product images: ${product.name}`);
                    }
                }
            }

            console.log(`🔄 Refreshed ${refreshedCount} product image URLs`);
            return refreshedCount;
        } catch (error) {
            console.error('Error refreshing product URLs:', error);
            return 0;
        }
    }

    /**
     * Refresh all URLs in the database
     */
    async refreshAllUrls() {
        console.log('🔄 Starting URL refresh process...');
        const startTime = Date.now();

        try {
            const categoryCount = await this.refreshCategoryUrls();
            const productCount = await this.refreshProductUrls();
            
            const totalRefreshed = categoryCount + productCount;
            const duration = Date.now() - startTime;
            
            console.log(`✅ URL refresh completed in ${duration}ms`);
            console.log(`📊 Total URLs refreshed: ${totalRefreshed}`);
            console.log(`   - Categories: ${categoryCount}`);
            console.log(`   - Products: ${productCount}`);
            
            return {
                success: true,
                totalRefreshed,
                categoryCount,
                productCount,
                duration
            };
        } catch (error) {
            console.error('❌ URL refresh failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.refreshInterval ? this.refreshInterval.getStatus() : null
        };
    }
}

// Create singleton instance
const urlRefreshService = new URLRefreshService();

module.exports = urlRefreshService;
