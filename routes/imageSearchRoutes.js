const express = require('express');
const multer = require('multer');
const { body, query, param, validationResult } = require('express-validator');
const imageSearchController = require('../controllers/imageSearchController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Validation middleware
const validateImageSearch = [
    query('threshold')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Threshold must be a number between 0 and 100'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100'),
    query('category')
        .optional()
        .isMongoId()
        .withMessage('Category must be a valid MongoDB ObjectId'),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Min price must be a positive number'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Max price must be a positive number'),
    query('includeInactive')
        .optional()
        .isBoolean()
        .withMessage('Include inactive must be a boolean'),
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    body('imageBase64')
        .optional()
        .isString()
        .withMessage('Image base64 must be a string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

const validateProductId = [
    param('productId')
        .isMongoId()
        .withMessage('Product ID must be a valid MongoDB ObjectId'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one image is allowed.'
            });
        }
    }
    
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only image files are allowed. Please upload a valid image.'
        });
    }

    next(error);
};

/**
 * @route POST /api/image-search/search
 * @desc Search for similar products by image
 * @access Public
 * @body {file} image - Image file (multipart/form-data)
 * @body {string} imageUrl - Image URL (alternative to file upload)
 * @body {string} imageBase64 - Base64 encoded image (alternative to file upload)
 * @query {number} threshold - Minimum similarity percentage (default: 60)
 * @query {number} limit - Maximum number of results (default: 20)
 * @query {string} category - Filter by category ID
 * @query {number} minPrice - Minimum price filter
 * @query {number} maxPrice - Maximum price filter
 * @query {boolean} includeInactive - Include inactive products (default: false)
 */
router.post('/search', 
    upload.single('image'),
    handleMulterError,
    validateImageSearch,
    imageSearchController.searchByImage
);

/**
 * @route POST /api/image-search/products/:productId/generate-hashes
 * @desc Generate and store image hashes for a specific product
 * @access Admin only
 * @param {string} productId - Product ID
 * @query {boolean} forceRegenerate - Force regeneration of existing hashes
 */
router.post('/products/:productId/generate-hashes',
    authMiddleware,
    adminMiddleware,
    validateProductId,
    query('forceRegenerate')
        .optional()
        .isBoolean()
        .withMessage('Force regenerate must be a boolean'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    },
    imageSearchController.generateProductHashes
);

/**
 * @route GET /api/image-search/stats
 * @desc Get image search statistics and system status
 * @access Admin only
 */
router.get('/stats',
    authMiddleware,
    adminMiddleware,
    imageSearchController.getSearchStats
);

/**
 * @route POST /api/image-search/demo
 * @desc Demo endpoint for testing image search with sample data
 * @access Public (for development/testing)
 */
router.post('/demo', 
    upload.single('image'),
    handleMulterError,
    (req, res) => {
        // This is a demo endpoint that shows how the API works
        res.json({
            success: true,
            message: 'Image Search API Demo',
            data: {
                info: 'This is a demo endpoint. To use the actual search functionality:',
                steps: [
                    '1. First, generate hashes for your products using POST /api/image-search/products/{productId}/generate-hashes',
                    '2. Then use POST /api/image-search/search to find similar products',
                    '3. Check system status with GET /api/image-search/stats'
                ],
                uploadedFile: req.file ? {
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    sizeFormatted: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
                } : null,
                supportedFormats: [
                    'JPEG/JPG',
                    'PNG', 
                    'WebP',
                    'GIF',
                    'BMP',
                    'TIFF'
                ],
                inputMethods: [
                    'File upload (multipart/form-data)',
                    'Image URL (JSON body with imageUrl)',
                    'Base64 encoded image (JSON body with imageBase64)'
                ]
            }
        });
    }
);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Image Search API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
