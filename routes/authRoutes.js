const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// Register route (alias for signup)
router.post(
    '/register',
    [
        body('firstName').notEmpty().trim().withMessage('First name is required'),
        body('lastName').notEmpty().trim().withMessage('Last name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    ],
    validateRequest,
    authController.register
);

// Signup route (legacy)
router.post(
    '/signup',
    [
        body('name').notEmpty().trim().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    ],
    validateRequest,
    authController.signup
);

// Login route
router.post(
    '/login',
    [
        // Custom validation for email or phone
        body().custom((_, { req }) => {
            const { email, phone, mobile } = req.body;

            // Check if at least one identifier is provided
            if (!email && !phone && !mobile) {
                throw new Error('Email or phone number is required');
            }

            // If email is provided, validate it
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error('Valid email is required');
            }

            // If phone/mobile is provided, validate it (basic validation)
            if ((phone || mobile) && !/^\d{10}$/.test(phone || mobile)) {
                throw new Error('Valid 10-digit phone number is required');
            }

            return true;
        }),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validateRequest,
    authController.login
);

// Get current user profile (protected)
router.get('/profile', authMiddleware, authController.profile);

// Update current user profile (protected)
router.put(
    '/profile',
    authMiddleware,
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    authController.updateProfile
);

module.exports = router; 