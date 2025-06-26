const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Signup route


router.post(
    '/signup',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    ],
    authController.signup
);

// Login route
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
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