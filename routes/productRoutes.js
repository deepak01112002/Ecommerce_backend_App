const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
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
    adminMiddleware,
    upload.array('images', 10),
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
    adminMiddleware,
    upload.array('images', 10),
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

router.delete('/:id', adminMiddleware, productController.deleteProduct);

router.delete('/:id/permanent', adminMiddleware, productController.permanentDeleteProduct);

router.patch('/:id/inventory',
    adminMiddleware,
    [
        body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
        body('operation').optional().isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
    ],
    validateRequest,
    productController.updateInventory
);

module.exports = router;