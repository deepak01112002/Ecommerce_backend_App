const express = require('express');
const router = express.Router();
const {
    getAllDeliveryCompanies,
    getDeliveryCompany,
    createDeliveryCompany,
    updateDeliveryCompany,
    deleteDeliveryCompany,
    getCompaniesByLocation,
    updatePerformance,
    toggleStatus,
    setPreferred,
    getDeliveryOptions,
    bulkUpdateStatus,
    exportCompanies,
    getDashboardStats
} = require('../controllers/deliveryCompanyController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateDeliveryCompany } = require('../middlewares/validation');

// Public routes (for checking delivery options)
router.get('/options', getDeliveryOptions);
router.get('/location', getCompaniesByLocation);

// Protected routes - Admin only
// Dashboard and stats
router.get('/dashboard/stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/export', authMiddleware, adminMiddleware, exportCompanies);

// CRUD operations
router.route('/')
    .get(authMiddleware, adminMiddleware, getAllDeliveryCompanies)
    .post(authMiddleware, adminMiddleware, validateDeliveryCompany, createDeliveryCompany);

router.route('/:id')
    .get(getDeliveryCompany)
    .put(validateDeliveryCompany, updateDeliveryCompany)
    .delete(deleteDeliveryCompany);

// Special operations
router.patch('/:id/toggle-status', toggleStatus);
router.patch('/:id/preferred', setPreferred);
router.patch('/:id/performance', updatePerformance);

// Bulk operations
router.patch('/bulk/status', bulkUpdateStatus);

module.exports = router;
