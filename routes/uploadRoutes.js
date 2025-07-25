const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { uploadSingleImage, uploadMultipleImages, deleteOldImages, contaboStorage } = require('../middlewares/contaboUpload');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * @route   POST /api/upload/single
 * @desc    Upload single image to Contabo Object Storage
 * @access  Admin
 */
router.post('/single', 
    authMiddleware, 
    adminMiddleware,
    uploadSingleImage('image', 'uploads'),
    asyncHandler(async (req, res) => {
        if (!req.uploadedFile) {
            return res.error('No image file provided', [], 400);
        }

        res.success({
            file: req.uploadedFile,
            url: req.uploadedFile.url
        }, 'Image uploaded successfully');
    })
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple images to Contabo Object Storage
 * @access  Admin
 */
router.post('/multiple',
    authMiddleware,
    adminMiddleware,
    uploadMultipleImages('images', 10, 'uploads'),
    asyncHandler(async (req, res) => {
        if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
            return res.error('No image files provided', [], 400);
        }

        res.success({
            files: req.uploadedFiles,
            urls: req.uploadedFiles.map(file => file.url),
            count: req.uploadedFiles.length
        }, `${req.uploadedFiles.length} images uploaded successfully`);
    })
);

/**
 * @route   POST /api/upload/product-images
 * @desc    Upload product images (main + gallery)
 * @access  Admin
 */
router.post('/product-images',
    authMiddleware,
    adminMiddleware,
    uploadMultipleImages('images', 10, 'products'),
    asyncHandler(async (req, res) => {
        if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
            return res.error('No product images provided', [], 400);
        }

        // Separate main image and gallery images
        const mainImage = req.uploadedFiles[0];
        const galleryImages = req.uploadedFiles.slice(1);

        res.success({
            mainImage: {
                url: mainImage.url,
                fileName: mainImage.fileName
            },
            galleryImages: galleryImages.map(img => ({
                url: img.url,
                fileName: img.fileName
            })),
            allImages: req.uploadedFiles.map(img => img.url),
            totalCount: req.uploadedFiles.length
        }, 'Product images uploaded successfully');
    })
);

/**
 * @route   POST /api/upload/category-image
 * @desc    Upload category image
 * @access  Admin
 */
router.post('/category-image',
    authMiddleware,
    adminMiddleware,
    uploadSingleImage('image', 'categories'),
    asyncHandler(async (req, res) => {
        if (!req.uploadedFile) {
            return res.error('No category image provided', [], 400);
        }

        res.success({
            image: {
                url: req.uploadedFile.url,
                fileName: req.uploadedFile.fileName
            }
        }, 'Category image uploaded successfully');
    })
);

/**
 * @route   DELETE /api/upload/delete
 * @desc    Delete image from Contabo Object Storage
 * @access  Admin
 */
router.delete('/delete',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req, res) => {
        const { imageUrl, fileName } = req.body;

        if (!imageUrl && !fileName) {
            return res.error('Image URL or filename is required', [], 400);
        }

        try {
            let fileNameToDelete = fileName;
            
            if (!fileNameToDelete && imageUrl) {
                fileNameToDelete = contaboStorage.extractFileNameFromUrl(imageUrl);
            }

            if (!fileNameToDelete) {
                return res.error('Invalid image URL or filename', [], 400);
            }

            await contaboStorage.deleteFile(fileNameToDelete);

            res.success({
                deletedFile: fileNameToDelete
            }, 'Image deleted successfully');

        } catch (error) {
            console.error('Delete image error:', error);
            res.error('Failed to delete image', [error.message], 500);
        }
    })
);

/**
 * @route   POST /api/upload/delete-multiple
 * @desc    Delete multiple images from Contabo Object Storage
 * @access  Admin
 */
router.post('/delete-multiple',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req, res) => {
        const { imageUrls, fileNames } = req.body;

        if ((!imageUrls || imageUrls.length === 0) && (!fileNames || fileNames.length === 0)) {
            return res.error('Image URLs or filenames are required', [], 400);
        }

        try {
            let filesToDelete = fileNames || [];
            
            if (imageUrls && imageUrls.length > 0) {
                filesToDelete = imageUrls.map(url => contaboStorage.extractFileNameFromUrl(url)).filter(Boolean);
            }

            if (filesToDelete.length === 0) {
                return res.error('No valid files to delete', [], 400);
            }

            // Delete all files
            const deletePromises = filesToDelete.map(fileName => contaboStorage.deleteFile(fileName));
            await Promise.all(deletePromises);

            res.success({
                deletedFiles: filesToDelete,
                count: filesToDelete.length
            }, `${filesToDelete.length} images deleted successfully`);

        } catch (error) {
            console.error('Delete multiple images error:', error);
            res.error('Failed to delete images', [error.message], 500);
        }
    })
);

/**
 * @route   GET /api/upload/test-connection
 * @desc    Test Contabo Object Storage connection
 * @access  Admin
 */
router.get('/test-connection',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req, res) => {
        try {
            // Try to create a small test file
            const testContent = Buffer.from('Contabo connection test', 'utf8');
            const testResult = await contaboStorage.uploadFile(
                testContent,
                'connection-test.txt',
                'text/plain',
                'test'
            );

            // Delete the test file immediately
            await contaboStorage.deleteFile(testResult.fileName);

            res.success({
                connection: 'successful',
                endpoint: process.env.CONTABO_ENDPOINT,
                bucket: process.env.CONTABO_BUCKET_NAME,
                region: process.env.CONTABO_REGION
            }, 'Contabo Object Storage connection successful');

        } catch (error) {
            console.error('Contabo connection test failed:', error);
            res.error('Contabo Object Storage connection failed', [error.message], 500);
        }
    })
);

/**
 * @route   GET /api/upload/storage-info
 * @desc    Get storage configuration info
 * @access  Admin
 */
router.get('/storage-info',
    authMiddleware,
    adminMiddleware,
    asyncHandler(async (req, res) => {
        res.success({
            provider: 'Contabo Object Storage',
            endpoint: process.env.CONTABO_ENDPOINT,
            bucket: process.env.CONTABO_BUCKET_NAME,
            region: process.env.CONTABO_REGION,
            baseUrl: process.env.CONTABO_BASE_URL,
            maxFileSize: '5MB',
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            folders: {
                products: 'products/',
                categories: 'categories/',
                uploads: 'uploads/',
                test: 'test/'
            }
        }, 'Storage configuration retrieved successfully');
    })
);

module.exports = router;
