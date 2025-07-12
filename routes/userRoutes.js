const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// User profile routes (authenticated users)
// Add address
router.post('/addresses',
    authMiddleware,
    [
        body('street').notEmpty().withMessage('Street is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('state').notEmpty().withMessage('State is required'),
        body('postalCode').notEmpty().withMessage('Postal code is required'),
        body('country').notEmpty().withMessage('Country is required'),
        body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
    ],
    userController.addAddress
);

// Get user addresses
router.get('/addresses', authMiddleware, userController.getAddresses);

// Update address
router.put('/addresses/:addressId',
    authMiddleware,
    [
        body('street').notEmpty().withMessage('Street is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('state').notEmpty().withMessage('State is required'),
        body('postalCode').notEmpty().withMessage('Postal code is required'),
        body('country').notEmpty().withMessage('Country is required'),
        body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
    ],
    userController.updateAddress
);

// Delete address
router.delete('/addresses/:addressId', authMiddleware, userController.deleteAddress);

// Change password
router.put('/change-password',
    authMiddleware,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ],
    userController.changePassword
);

// Admin routes
// Get all users
router.get('/', adminMiddleware, userController.getUsers);

// Get user by ID
router.get('/:userId', adminMiddleware, userController.getUserById);

// Update user
router.put('/:userId',
    adminMiddleware,
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('phone').optional().isString().withMessage('Phone must be a string'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin')
    ],
    userController.updateUser
);

// Delete user
router.delete('/:userId', adminMiddleware, userController.deleteUser);

module.exports = router;
