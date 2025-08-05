const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
// Import Contabo upload middleware (replaces multer)
const { uploadMultipleImages } = require('../middlewares/contaboUpload');
const multer = require('multer');

// Configure multer for file uploads (for bulk upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Optional auth middleware
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        authMiddleware(req, res, next);
    } else {
        next();
    }
};

// User endpoints
// Specific routes must come before parameterized routes
router.get('/featured', optionalAuth, productController.getFeaturedProducts);

router.get('/search',
    [
        query('q').notEmpty().withMessage('Search query is required'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validateRequest,
    productController.searchProducts
);

// General products list
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('min_price').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
        query('max_price').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
        query('sort_by').optional().isIn(['name', 'price', 'rating', 'created_at']).withMessage('Invalid sort field'),
        query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
    ],
    validateRequest,
    optionalAuth,
    productController.getProducts
);

// Product by ID - must come after specific routes
router.get('/:id', optionalAuth, productController.getProductById);

// Admin endpoints
router.post('/',
    authMiddleware,
    adminMiddleware,
    uploadMultipleImages('images', 10, 'products'),
    [
        body('name').notEmpty().trim().withMessage('Product name is required'),
        body('description').notEmpty().trim().withMessage('Product description is required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
        body('category').isMongoId().withMessage('Valid category ID is required'),
        body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
        body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
    ],
    validateRequest,
    productController.createProduct
);

router.put('/:id',
    authMiddleware,
    adminMiddleware,
    uploadMultipleImages('images', 10, 'products'),
    [
        body('name').optional().notEmpty().trim().withMessage('Product name cannot be empty'),
        body('description').optional().notEmpty().trim().withMessage('Product description cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
        body('category').optional().isMongoId().withMessage('Valid category ID is required'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
        body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
    ],
    validateRequest,
    productController.updateProduct
);

router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

router.delete('/:id/permanent', authMiddleware, adminMiddleware, productController.permanentDeleteProduct);

router.patch('/:id/inventory',
    authMiddleware,
    adminMiddleware,
    [
        body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('operation').optional().isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
    ],
    validateRequest,
    productController.updateInventory
);

// Bulk upload products from CSV/Excel file
router.post('/bulk-upload',
    authMiddleware,
    adminMiddleware,
    upload.single('file'),
    productController.bulkUpload
);

module.exports = router;