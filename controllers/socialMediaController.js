const { asyncHandler } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');
const SocialMedia = require('../models/SocialMedia');

// @desc    Get all social media links (public)
// @route   GET /api/social-media
// @access  Public
const getSocialMediaLinks = asyncHandler(async (req, res) => {
    const { platform, active = true } = req.query;

    let query = {};
    if (platform) query.platform = platform;
    if (active !== 'all') query.isActive = active === 'true';

    const socialMediaLinks = await SocialMedia.find(query)
        .sort({ displayOrder: 1, createdAt: 1 })
        .select('-clickCount -lastClicked -createdBy -updatedBy');
    
    res.success({
        socialMediaLinks,
        count: socialMediaLinks.length
    }, 'Social media links retrieved successfully');
});

// @desc    Get all social media links (admin)
// @route   GET /api/admin/social-media
// @access  Admin
const getAllSocialMediaLinks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, platform, active } = req.query;

    let query = {};
    if (platform) query.platform = platform;
    if (active !== undefined) query.isActive = active === 'true';

    const socialMediaLinks = await SocialMedia.find(query)
        .populate('createdBy updatedBy', 'firstName lastName')
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await SocialMedia.countDocuments(query);
    
    res.success({
        socialMediaLinks,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Social media links retrieved successfully');
});

// @desc    Get single social media link
// @route   GET /api/admin/social-media/:id
// @access  Admin
const getSocialMediaLink = asyncHandler(async (req, res) => {
    const socialMediaLink = await SocialMedia.findById(req.params.id)
        .populate('createdBy updatedBy', 'firstName lastName');
    
    if (!socialMediaLink) {
        return res.error('Social media link not found', 404);
    }
    
    res.success({ socialMediaLink }, 'Social media link retrieved successfully');
});

// @desc    Create social media link
// @route   POST /api/admin/social-media
// @access  Admin
const createSocialMediaLink = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.validationError(errors.array());
    }

    const {
        platform,
        name,
        url,
        icon,
        description,
        isActive,
        displayOrder,
        openInNewTab,
        showOnMobile,
        showOnWeb,
        whatsappConfig
    } = req.body;

    // Check for duplicate platform only for platforms that should be unique
    const uniquePlatforms = ['youtube', 'facebook', 'instagram', 'twitter', 'linkedin'];
    if (uniquePlatforms.includes(platform)) {
        const existingPlatform = await SocialMedia.findOne({
            platform,
            isActive: true
        });

        if (existingPlatform) {
            return res.error(`Active ${platform} link already exists`, [], 400);
        }
    }
    
    const socialMediaLink = await SocialMedia.create({
        platform,
        name,
        url,
        icon,
        description,
        isActive,
        displayOrder: displayOrder || 0,
        openInNewTab,
        showOnMobile,
        showOnWeb,
        whatsappConfig,
        createdBy: req.user._id
    });
    
    await socialMediaLink.populate('createdBy', 'firstName lastName');
    
    res.success({ socialMediaLink }, 'Social media link created successfully', 201);
});

// @desc    Update social media link
// @route   PUT /api/admin/social-media/:id
// @access  Admin
const updateSocialMediaLink = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.validationError(errors.array());
    }

    const socialMediaLink = await SocialMedia.findById(req.params.id);
    
    if (!socialMediaLink) {
        return res.error('Social media link not found', 404);
    }
    
    const {
        platform,
        name,
        url,
        icon,
        description,
        isActive,
        displayOrder,
        openInNewTab,
        showOnMobile,
        showOnWeb,
        whatsappConfig
    } = req.body;
    
    // Check for duplicate platform if platform is being changed
    if (platform && platform !== socialMediaLink.platform && platform !== 'custom') {
        const existingPlatform = await SocialMedia.findOne({ 
            platform, 
            isActive: true,
            _id: { $ne: req.params.id }
        });
        
        if (existingPlatform) {
            return res.error(`Active ${platform} link already exists`, 400);
        }
    }
    
    // Update fields
    if (platform !== undefined) socialMediaLink.platform = platform;
    if (name !== undefined) socialMediaLink.name = name;
    if (url !== undefined) socialMediaLink.url = url;
    if (icon !== undefined) socialMediaLink.icon = icon;
    if (description !== undefined) socialMediaLink.description = description;
    if (isActive !== undefined) socialMediaLink.isActive = isActive;
    if (displayOrder !== undefined) socialMediaLink.displayOrder = displayOrder;
    if (openInNewTab !== undefined) socialMediaLink.openInNewTab = openInNewTab;
    if (showOnMobile !== undefined) socialMediaLink.showOnMobile = showOnMobile;
    if (showOnWeb !== undefined) socialMediaLink.showOnWeb = showOnWeb;
    if (whatsappConfig !== undefined) socialMediaLink.whatsappConfig = whatsappConfig;
    
    socialMediaLink.updatedBy = req.user._id;
    
    await socialMediaLink.save();
    await socialMediaLink.populate('createdBy updatedBy', 'firstName lastName');
    
    res.success({ socialMediaLink }, 'Social media link updated successfully');
});

// @desc    Delete social media link
// @route   DELETE /api/admin/social-media/:id
// @access  Admin
const deleteSocialMediaLink = asyncHandler(async (req, res) => {
    const socialMediaLink = await SocialMedia.findById(req.params.id);
    
    if (!socialMediaLink) {
        return res.error('Social media link not found', 404);
    }
    
    await socialMediaLink.deleteOne();
    
    res.success({}, 'Social media link deleted successfully');
});

// @desc    Bulk update display order
// @route   PUT /api/admin/social-media/bulk/reorder
// @access  Admin
const bulkReorderSocialMedia = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        return res.error('Items must be an array', 400);
    }

    const bulkOps = items.map((item, index) => ({
        updateOne: {
            filter: { _id: item.id },
            update: {
                displayOrder: index + 1,
                updatedBy: req.user._id
            }
        }
    }));

    await SocialMedia.bulkWrite(bulkOps);
    
    const updatedLinks = await SocialMedia.find({ isActive: true })
        .sort({ displayOrder: 1 })
        .populate('createdBy updatedBy', 'firstName lastName');
    
    res.success({ socialMediaLinks: updatedLinks }, 'Social media links reordered successfully');
});

// @desc    Track click on social media link
// @route   POST /api/social-media/:id/click
// @access  Public
const trackSocialMediaClick = asyncHandler(async (req, res) => {
    const socialMediaLink = await SocialMedia.findById(req.params.id);
    
    if (!socialMediaLink || !socialMediaLink.isActive) {
        return res.error('Social media link not found', 404);
    }
    
    await SocialMedia.incrementClickCount(req.params.id);
    
    res.success({
        url: socialMediaLink.getDisplayUrl(),
        openInNewTab: socialMediaLink.openInNewTab
    }, 'Click tracked successfully');
});

// @desc    Get social media analytics
// @route   GET /api/admin/social-media/analytics
// @access  Admin
const getSocialMediaAnalytics = asyncHandler(async (req, res) => {
    const analytics = await SocialMedia.aggregate([
        {
            $group: {
                _id: '$platform',
                totalLinks: { $sum: 1 },
                activeLinks: { $sum: { $cond: ['$isActive', 1, 0] } },
                totalClicks: { $sum: '$clickCount' },
                avgClicks: { $avg: '$clickCount' }
            }
        },
        {
            $sort: { totalClicks: -1 }
        }
    ]);
    
    const topPerforming = await SocialMedia.find({ isActive: true })
        .sort({ clickCount: -1 })
        .limit(5)
        .select('name platform clickCount lastClicked');
    
    res.success({
        analytics,
        topPerforming,
        summary: {
            totalLinks: await SocialMedia.countDocuments(),
            activeLinks: await SocialMedia.countDocuments({ isActive: true }),
            totalClicks: await SocialMedia.aggregate([
                { $group: { _id: null, total: { $sum: '$clickCount' } } }
            ]).then(result => result[0]?.total || 0)
        }
    }, 'Social media analytics retrieved successfully');
});

module.exports = {
    getSocialMediaLinks,
    getAllSocialMediaLinks,
    getSocialMediaLink,
    createSocialMediaLink,
    updateSocialMediaLink,
    deleteSocialMediaLink,
    bulkReorderSocialMedia,
    trackSocialMediaClick,
    getSocialMediaAnalytics
};
