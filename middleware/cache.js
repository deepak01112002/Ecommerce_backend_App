/**
 * Simple in-memory cache middleware for production optimization
 * In production, this should be replaced with Redis or similar
 */

const cache = new Map();
const cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0
};

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 * @param {function} keyGenerator - Optional custom key generator function
 */
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
    return (req, res, next) => {
        // Skip cache for authenticated requests (except GET)
        if (req.method !== 'GET' || (req.user && req.originalUrl.includes('/admin'))) {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator ? 
            keyGenerator(req) : 
            `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

        // Check if cached response exists and is still valid
        const cachedData = cache.get(cacheKey);
        if (cachedData && Date.now() < cachedData.expiry) {
            cacheStats.hits++;
            
            // Add cache headers
            res.set({
                'X-Cache': 'HIT',
                'X-Cache-Key': cacheKey,
                'Cache-Control': `public, max-age=${Math.floor((cachedData.expiry - Date.now()) / 1000)}`
            });
            
            return res.status(cachedData.status).json(cachedData.data);
        }

        cacheStats.misses++;

        // Store original res.json method
        const originalJson = res.json;

        // Override res.json to cache the response
        res.json = function(data) {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const expiry = Date.now() + (duration * 1000);
                cache.set(cacheKey, {
                    data,
                    status: res.statusCode,
                    expiry
                });
                cacheStats.sets++;

                // Add cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${duration}`
                });

                // Clean up expired entries periodically
                if (Math.random() < 0.01) { // 1% chance
                    cleanupExpiredEntries();
                }
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Clean up expired cache entries
 */
const cleanupExpiredEntries = () => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of cache.entries()) {
        if (now >= value.expiry) {
            cache.delete(key);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log(`Cache cleanup: Removed ${cleanedCount} expired entries`);
    }
};

/**
 * Clear all cache entries
 */
const clearCache = () => {
    const size = cache.size;
    cache.clear();
    console.log(`Cache cleared: Removed ${size} entries`);
    return size;
};

/**
 * Clear cache entries by pattern
 */
const clearCacheByPattern = (pattern) => {
    let clearedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of cache.keys()) {
        if (regex.test(key)) {
            cache.delete(key);
            clearedCount++;
        }
    }

    console.log(`Cache pattern clear: Removed ${clearedCount} entries matching ${pattern}`);
    return clearedCount;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
    const hitRate = cacheStats.hits + cacheStats.misses > 0 ? 
        (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) : 0;

    return {
        ...cacheStats,
        hit_rate: `${hitRate}%`,
        cache_size: cache.size,
        memory_usage: process.memoryUsage()
    };
};

/**
 * Cache key generators for specific use cases
 */
const keyGenerators = {
    // Category-based key
    category: (req) => {
        const category = req.params.category || req.query.category || 'all';
        return `category:${category}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    },

    // Product-based key
    product: (req) => {
        const productId = req.params.id || req.params.identifier || 'list';
        return `product:${productId}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    },

    // User-specific key (for authenticated requests)
    user: (req) => {
        const userId = req.user ? req.user._id : 'anonymous';
        return `user:${userId}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    }
};

/**
 * Predefined cache durations
 */
const cacheDurations = {
    SHORT: 60,      // 1 minute
    MEDIUM: 300,    // 5 minutes
    LONG: 900,      // 15 minutes
    VERY_LONG: 3600 // 1 hour
};

/**
 * Cache invalidation middleware
 * Automatically clears related cache entries when data is modified
 */
const cacheInvalidation = (patterns = []) => {
    return (req, res, next) => {
        // Store original methods
        const originalJson = res.json;
        const originalSend = res.send;

        // Override response methods to trigger cache invalidation
        const invalidateCache = () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                patterns.forEach(pattern => {
                    clearCacheByPattern(pattern);
                });
            }
        };

        res.json = function(data) {
            invalidateCache();
            return originalJson.call(this, data);
        };

        res.send = function(data) {
            invalidateCache();
            return originalSend.call(this, data);
        };

        next();
    };
};

// Automatic cleanup every 10 minutes
setInterval(cleanupExpiredEntries, 10 * 60 * 1000);

module.exports = {
    cache: cacheMiddleware,
    clearCache,
    clearCacheByPattern,
    getCacheStats,
    keyGenerators,
    cacheDurations,
    cacheInvalidation
};

// Export default cache function
module.exports.default = cacheMiddleware;
