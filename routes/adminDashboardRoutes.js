const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const adminDashboardController = require('../controllers/adminDashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All admin dashboard routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get complete admin dashboard
router.get('/',
    [
        query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
    ],
    validateRequest,
    adminDashboardController.getAdminDashboard
);

// Get quick stats for admin header
router.get('/quick-stats',
    adminDashboardController.getQuickStats
);

module.exports = router;
