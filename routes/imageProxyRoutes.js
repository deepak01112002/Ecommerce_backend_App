const express = require('express');
const router = express.Router();
const contaboStorage = require('../services/contaboStorage');
const NodeCache = require('node-cache');

// Cache for presigned URLs (cache for 50 minutes, URLs expire in 1 hour)
const urlCache = new NodeCache({ stdTTL: 3000 }); // 50 minutes

/**
 * @route GET /api/images/:folder/:filename
 * @desc Get image via presigned URL with caching
 * @access Public
 */
router.get('/:folder/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const fullKey = `${folder}/${filename}`;
        
        // Check cache first
        const cachedUrl = urlCache.get(fullKey);
        if (cachedUrl) {
            return res.redirect(cachedUrl);
        }
        
        // Generate new presigned URL
        const result = await contaboStorage.getSignedUrl(fullKey, 3600); // 1 hour expiry
        
        if (result.success) {
            // Cache the URL
            urlCache.set(fullKey, result.url);
            
            // Redirect to the presigned URL
            res.redirect(result.url);
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found',
                errors: ['Image not found in storage']
            });
        }
    } catch (error) {
        console.error('Image proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve image',
            errors: [error.message]
        });
    }
});

/**
 * @route GET /api/images/direct/:folder/:filename
 * @desc Get presigned URL directly (for AJAX requests)
 * @access Public
 */
router.get('/direct/:folder/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const fullKey = `${folder}/${filename}`;
        
        // Check cache first
        const cachedUrl = urlCache.get(fullKey);
        if (cachedUrl) {
            return res.json({
                success: true,
                url: cachedUrl,
                cached: true
            });
        }
        
        // Generate new presigned URL
        const result = await contaboStorage.getSignedUrl(fullKey, 3600);
        
        if (result.success) {
            // Cache the URL
            urlCache.set(fullKey, result.url);
            
            res.json({
                success: true,
                url: result.url,
                cached: false,
                expiresIn: result.expiresIn
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found',
                errors: ['Image not found in storage']
            });
        }
    } catch (error) {
        console.error('Image proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve image URL',
            errors: [error.message]
        });
    }
});

/**
 * @route POST /api/images/batch-urls
 * @desc Get multiple presigned URLs at once
 * @access Public
 */
router.post('/batch-urls', async (req, res) => {
    try {
        const { images } = req.body;
        
        if (!images || !Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: 'Images array is required',
                errors: ['Images array is required']
            });
        }
        
        const results = [];
        
        for (const imageKey of images) {
            try {
                // Check cache first
                const cachedUrl = urlCache.get(imageKey);
                if (cachedUrl) {
                    results.push({
                        key: imageKey,
                        url: cachedUrl,
                        cached: true,
                        success: true
                    });
                    continue;
                }
                
                // Generate new presigned URL
                const result = await contaboStorage.getSignedUrl(imageKey, 3600);
                
                if (result.success) {
                    // Cache the URL
                    urlCache.set(imageKey, result.url);
                    
                    results.push({
                        key: imageKey,
                        url: result.url,
                        cached: false,
                        success: true,
                        expiresIn: result.expiresIn
                    });
                } else {
                    results.push({
                        key: imageKey,
                        success: false,
                        error: 'Image not found'
                    });
                }
            } catch (error) {
                results.push({
                    key: imageKey,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Batch URLs generated',
            data: results,
            total: results.length,
            successful: results.filter(r => r.success).length
        });
        
    } catch (error) {
        console.error('Batch URLs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate batch URLs',
            errors: [error.message]
        });
    }
});

/**
 * @route GET /api/images/cache/stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache/stats', (req, res) => {
    const stats = urlCache.getStats();
    res.json({
        success: true,
        message: 'Cache statistics',
        data: {
            keys: stats.keys,
            hits: stats.hits,
            misses: stats.misses,
            hitRate: stats.hits / (stats.hits + stats.misses) || 0,
            cacheSize: urlCache.keys().length
        }
    });
});

/**
 * @route DELETE /api/images/cache/clear
 * @desc Clear URL cache
 * @access Public
 */
router.delete('/cache/clear', (req, res) => {
    urlCache.flushAll();
    res.json({
        success: true,
        message: 'Cache cleared successfully'
    });
});

module.exports = router;
