const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/categories/');
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
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Public endpoints - specific routes first
router.get('/tree', categoryController.getCategoryTree);

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
    adminMiddleware,
    upload.single('image'),
    [
        body('name').notEmpty().trim().withMessage('Category name is required'),
        body('description').optional().isString().withMessage('Description must be a string'),
        body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID')
    ],
    validateRequest,
    categoryController.createCategory
);

router.put('/:id',
    adminMiddleware,
    upload.single('image'),
    [
        body('name').optional().notEmpty().trim().withMessage('Category name cannot be empty'),
        body('description').optional().isString().withMessage('Description must be a string'),
        body('parent').optional().isMongoId().withMessage('Parent must be a valid category ID')
    ],
    validateRequest,
    categoryController.updateCategory
);

router.delete('/:id', adminMiddleware, categoryController.deleteCategory);

module.exports = router;