const express = require('express');
const router = express.Router();
const path = require('path');
const { param } = require('express-validator');
const qrCodeController = require('../controllers/qrCodeController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// Public QR scanner page
router.get('/scanner', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../views/qr-scanner.html');
        console.log('Serving QR scanner from:', filePath);
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving QR scanner page:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load QR scanner page',
            error: error.message
        });
    }
});

// Generate QR code for a specific category
router.post('/category/:categoryId',
    adminMiddleware,
    [
        param('categoryId').isMongoId().withMessage('Invalid category ID')
    ],
    validateRequest,
    qrCodeController.generateCategoryQR
);

// Generate QR code for a specific product
router.post('/product/:productId',
    adminMiddleware,
    [
        param('productId').isMongoId().withMessage('Invalid product ID')
    ],
    validateRequest,
    qrCodeController.generateProductQR
);

// Generate QR codes for all categories
router.post('/categories/all',
    adminMiddleware,
    qrCodeController.generateAllCategoryQRs
);

// Generate QR codes for all products
router.post('/products/all',
    adminMiddleware,
    qrCodeController.generateAllProductQRs
);

// Scan QR code and get details (public endpoint for scanning)
router.post('/scan',
    qrCodeController.scanQRCode
);

module.exports = router;
