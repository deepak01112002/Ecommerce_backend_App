const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// Custom validation middleware for postal code
const validatePostalCode = (req, res, next) => {
    const { postalCode, pincode } = req.body;

    if (!postalCode && !pincode) {
        return res.error('Either postalCode or pincode is required', [], 400);
    }

    // Normalize to postalCode if pincode is provided
    if (pincode && !postalCode) {
        req.body.postalCode = pincode;
    }

    next();
};

// All address routes require authentication
router.use(authMiddleware);

// Get all user addresses
router.get('/',
    [
        query('type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    validateRequest,
    addressController.getUserAddresses
);

// Get default address
router.get('/default',
    addressController.getDefaultAddress
);

// Get single address
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid address ID')
    ],
    validateRequest,
    addressController.getAddress
);

// Add new address
router.post('/',
    [
        body('type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
        body('label').optional().isLength({ min: 1, max: 50 }).withMessage('Label must be between 1 and 50 characters'),
        body('firstName').notEmpty().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be max 50 characters'),
        body('lastName').notEmpty().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be max 50 characters'),
        body('phone').notEmpty().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
        body('alternatePhone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid alternate phone number required'),
        body('addressLine1').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Address line 1 is required and must be max 100 characters'),
        body('addressLine2').optional().isLength({ max: 100 }).withMessage('Address line 2 must be max 100 characters'),
        body('landmark').optional().isLength({ max: 100 }).withMessage('Landmark must be max 100 characters'),
        body('city').notEmpty().isLength({ min: 1, max: 50 }).withMessage('City is required and must be max 50 characters'),
        body('state').notEmpty().isLength({ min: 1, max: 50 }).withMessage('State is required and must be max 50 characters'),
        body('country').optional().isLength({ min: 1, max: 50 }).withMessage('Country must be max 50 characters'),
        body('postalCode').optional().matches(/^[1-9][0-9]{5}$/).withMessage('Valid postal code is required'),
        body('pincode').optional().matches(/^[1-9][0-9]{5}$/).withMessage('Valid pincode is required'),
        body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
        body('deliveryInstructions').optional().isLength({ max: 200 }).withMessage('Delivery instructions must be max 200 characters'),
        body('addressType').optional().isIn(['apartment', 'house', 'office', 'other']).withMessage('Invalid address type'),
        body('coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
        body('panNumber').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN number format')
    ],
    validatePostalCode,
    validateRequest,
    addressController.addAddress
);

// Update address
router.put('/:id',
    [
        param('id').isMongoId().withMessage('Invalid address ID'),
        body('type').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
        body('label').optional().isLength({ min: 1, max: 50 }).withMessage('Label must be between 1 and 50 characters'),
        body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be max 50 characters'),
        body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be max 50 characters'),
        body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid phone number required'),
        body('alternatePhone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid alternate phone number required'),
        body('addressLine1').optional().isLength({ min: 1, max: 100 }).withMessage('Address line 1 must be max 100 characters'),
        body('addressLine2').optional().isLength({ max: 100 }).withMessage('Address line 2 must be max 100 characters'),
        body('landmark').optional().isLength({ max: 100 }).withMessage('Landmark must be max 100 characters'),
        body('city').optional().isLength({ min: 1, max: 50 }).withMessage('City must be max 50 characters'),
        body('state').optional().isLength({ min: 1, max: 50 }).withMessage('State must be max 50 characters'),
        body('country').optional().isLength({ min: 1, max: 50 }).withMessage('Country must be max 50 characters'),
        body('postalCode').optional().matches(/^[1-9][0-9]{5}$/).withMessage('Valid postal code required'),
        body('pincode').optional().matches(/^[1-9][0-9]{5}$/).withMessage('Valid pincode required'),
        body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
        body('deliveryInstructions').optional().isLength({ max: 200 }).withMessage('Delivery instructions must be max 200 characters'),
        body('addressType').optional().isIn(['apartment', 'house', 'office', 'other']).withMessage('Invalid address type'),
        body('coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
        body('panNumber').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN number format')
    ],
    validateRequest,
    addressController.updateAddress
);

// Set address as default
router.patch('/:id/default',
    [
        param('id').isMongoId().withMessage('Invalid address ID')
    ],
    validateRequest,
    addressController.setDefaultAddress
);

// Delete address
router.delete('/:id',
    [
        param('id').isMongoId().withMessage('Invalid address ID')
    ],
    validateRequest,
    addressController.deleteAddress
);

// Validate address
router.post('/:id/validate',
    [
        param('id').isMongoId().withMessage('Invalid address ID')
    ],
    validateRequest,
    addressController.validateAddress
);

module.exports = router;
