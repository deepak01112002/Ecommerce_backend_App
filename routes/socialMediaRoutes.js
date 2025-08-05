const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const {
    getSocialMediaLinks,
    getAllSocialMediaLinks,
    getSocialMediaLink,
    createSocialMediaLink,
    updateSocialMediaLink,
    deleteSocialMediaLink,
    bulkReorderSocialMedia,
    trackSocialMediaClick,
    getSocialMediaAnalytics
} = require('../controllers/socialMediaController');

// Validation middleware
const validateSocialMediaLink = [
    body('platform')
        .isIn(['youtube', 'facebook', 'whatsapp', 'instagram', 'twitter', 'linkedin', 'telegram', 'website', 'custom'])
        .withMessage('Invalid platform'),
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    body('url')
        .optional()
        .custom((value, { req }) => {
            // Skip URL validation for WhatsApp as it will be auto-generated
            if (req.body.platform === 'whatsapp') {
                return true;
            }

            // URL is required for non-WhatsApp platforms
            if (!value || value.trim().length === 0) {
                throw new Error('URL is required');
            }

            // More flexible URL validation - allow various formats
            const httpRegex = /^https?:\/\/.+/i;
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}.*$/;
            const specialRegex = /^(tel:|mailto:|whatsapp:)/;

            const trimmedValue = value.trim();

            // Check if it's a valid HTTP URL, domain, or special protocol
            if (httpRegex.test(trimmedValue) || domainRegex.test(trimmedValue) || specialRegex.test(trimmedValue)) {
                return true;
            }

            throw new Error('Please enter a valid URL');
        }),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a positive integer'),
    body('whatsappConfig.phoneNumber')
        .if(body('platform').equals('whatsapp'))
        .notEmpty()
        .withMessage('Phone number is required for WhatsApp')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please enter a valid phone number'),
    body('whatsappConfig.defaultMessage')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Default message must be less than 500 characters')
];

const validateBulkReorder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Items must be a non-empty array'),
    body('items.*.id')
        .isMongoId()
        .withMessage('Invalid item ID')
];

// Public routes
// @desc    Get active social media links
// @route   GET /api/social-media
// @access  Public
router.get('/', [
    query('platform').optional().isString(),
    query('active').optional().isIn(['true', 'false', 'all'])
], getSocialMediaLinks);

// @desc    Track click on social media link
// @route   POST /api/social-media/:id/click
// @access  Public
router.post('/:id/click', [
    param('id').isMongoId().withMessage('Invalid social media link ID')
], trackSocialMediaClick);

// Admin routes - require authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// @desc    Get all social media links (admin)
// @route   GET /api/admin/social-media
// @access  Admin
router.get('/admin/all', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('platform').optional().isString(),
    query('active').optional().isIn(['true', 'false'])
], getAllSocialMediaLinks);

// @desc    Get social media analytics
// @route   GET /api/admin/social-media/analytics
// @access  Admin
router.get('/admin/analytics', getSocialMediaAnalytics);

// @desc    Bulk reorder social media links
// @route   PUT /api/admin/social-media/bulk/reorder
// @access  Admin
router.put('/admin/bulk/reorder', validateBulkReorder, bulkReorderSocialMedia);

// @desc    Create social media link
// @route   POST /api/admin/social-media
// @access  Admin
router.post('/admin', validateSocialMediaLink, createSocialMediaLink);

// @desc    Get single social media link
// @route   GET /api/admin/social-media/:id
// @access  Admin
router.get('/admin/:id', [
    param('id').isMongoId().withMessage('Invalid social media link ID')
], getSocialMediaLink);

// @desc    Update social media link
// @route   PUT /api/admin/social-media/:id
// @access  Admin
router.put('/admin/:id', [
    param('id').isMongoId().withMessage('Invalid social media link ID'),
    ...validateSocialMediaLink
], updateSocialMediaLink);

// @desc    Delete social media link
// @route   DELETE /api/admin/social-media/:id
// @access  Admin
router.delete('/admin/:id', [
    param('id').isMongoId().withMessage('Invalid social media link ID')
], deleteSocialMediaLink);

module.exports = router;
