const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
// Import Contabo upload middleware (replaces multer)
const { uploadSingleImage } = require('../middlewares/contaboUpload');

// Public endpoints - specific routes first
router.get('/tree',
    [
        query('featured').optional().isBoolean().withMessage('featured must be a boolean'),
        query('includeProducts').optional().isBoolean().withMessage('includeProducts must be a boolean'),
        query('maxDepth').optional().isInt({ min: 1, max: 5 }).withMessage('maxDepth must be between 1 and 5'),
        query('minProductCount').optional().isInt({ min: 0 }).withMessage('minProductCount must be a non-negative integer')
    ],
    validateRequest,
    categoryController.getCategoryTree
);

router.get('/featured',
    [
        query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('limit must be between 1 and 20')
    ],
    validateRequest,
    categoryController.getFeaturedCategories
);

router.get('/search',
    [
        query('q').notEmpty().withMessage('Search query is required'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50')
    ],
    validateRequest,
    categoryController.searchCategories
);

router.get('/breadcrumb/:slug', categoryController.getCategoryBreadcrumb);

router.get('/',
    [
        query('include_products').optional().isBoolean().withMessage('include_products must be a boolean'),
        query('parent_only').optional().isBoolean().withMessage('parent_only must be a boolean')
    ],
    validateRequest,
    categoryController.getCategories
);

router.get('/:id', categoryController.getCategoryById);

// Admin endpoints
router.post('/',
    authMiddleware,
    adminMiddleware,
    uploadSingleImage('image', 'categories'),
    [
        body('name').notEmpty().trim().withMessage('Category name is required'),
        body('description').optional().isString().withMessage('Description must be a string'),
        body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID')
    ],
    validateRequest,
    categoryController.createCategory
);

router.put('/:id',
    authMiddleware,
    adminMiddleware,
    uploadSingleImage('image', 'categories'),
    [
        body('name').optional().notEmpty().trim().withMessage('Category name cannot be empty'),
        body('description').optional().isString().withMessage('Description must be a string'),
        body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID')
    ],
    validateRequest,
    categoryController.updateCategory
);

router.delete('/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;