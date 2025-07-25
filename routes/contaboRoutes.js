const express = require('express');
const router = express.Router();
const contaboStorage = require('../services/contaboStorage');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

/**
 * @route GET /api/contabo/test-connection
 * @desc Test Contabo S3 connection
 * @access Private (Admin only)
 */
router.get('/test-connection', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await contaboStorage.testConnection();
        
        res.status(result.success ? 200 : 500).json({
            success: result.success,
            message: result.message,
            data: result.success ? {
                bucket: result.bucket,
                endpoint: result.endpoint,
                fileCount: result.fileCount
            } : null,
            errors: result.success ? [] : [result.error]
        });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test connection',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route GET /api/contabo/bucket-stats
 * @desc Get bucket statistics
 * @access Private (Admin only)
 */
router.get('/bucket-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await contaboStorage.getBucketStats();
        
        res.status(200).json({
            success: true,
            message: 'Bucket statistics retrieved successfully',
            data: result.stats,
            errors: []
        });
    } catch (error) {
        console.error('Bucket stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get bucket statistics',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route POST /api/contabo/presigned-upload-url
 * @desc Generate presigned URL for file upload
 * @access Private
 */
router.post('/presigned-upload-url', authMiddleware, async (req, res) => {
    try {
        const { fileName, contentType, folder = 'uploads', expiresIn = 3600 } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'fileName and contentType are required',
                data: null,
                errors: ['fileName and contentType are required']
            });
        }

        // Validate content type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(contentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content type. Only images are allowed.',
                data: null,
                errors: ['Invalid content type. Only images are allowed.']
            });
        }

        const result = await contaboStorage.getPresignedUploadUrl(fileName, contentType, expiresIn, folder);
        
        res.status(200).json({
            success: true,
            message: 'Presigned upload URL generated successfully',
            data: result,
            errors: []
        });
    } catch (error) {
        console.error('Presigned upload URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned upload URL',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route POST /api/contabo/multiple-presigned-upload-urls
 * @desc Generate multiple presigned URLs for batch upload
 * @access Private
 */
router.post('/multiple-presigned-upload-urls', authMiddleware, async (req, res) => {
    try {
        const { files, folder = 'uploads', expiresIn = 3600 } = req.body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'files array is required',
                data: null,
                errors: ['files array is required']
            });
        }

        // Validate each file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        for (const file of files) {
            if (!file.originalName || !file.contentType) {
                return res.status(400).json({
                    success: false,
                    message: 'Each file must have originalName and contentType',
                    data: null,
                    errors: ['Each file must have originalName and contentType']
                });
            }

            if (!allowedTypes.includes(file.contentType)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid content type for ${file.originalName}. Only images are allowed.`,
                    data: null,
                    errors: [`Invalid content type for ${file.originalName}. Only images are allowed.`]
                });
            }
        }

        const result = await contaboStorage.getMultiplePresignedUploadUrls(files, folder, expiresIn);
        
        res.status(200).json({
            success: true,
            message: 'Multiple presigned upload URLs generated successfully',
            data: result,
            errors: []
        });
    } catch (error) {
        console.error('Multiple presigned upload URLs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate multiple presigned upload URLs',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route POST /api/contabo/presigned-download-url
 * @desc Generate presigned URL for file download
 * @access Private
 */
router.post('/presigned-download-url', authMiddleware, async (req, res) => {
    try {
        const { fileName, expiresIn = 3600 } = req.body;

        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: 'fileName is required',
                data: null,
                errors: ['fileName is required']
            });
        }

        // Check if file exists
        const exists = await contaboStorage.fileExists(fileName);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                data: null,
                errors: ['File not found']
            });
        }

        const result = await contaboStorage.getSignedUrl(fileName, expiresIn);
        
        res.status(200).json({
            success: true,
            message: 'Presigned download URL generated successfully',
            data: result,
            errors: []
        });
    } catch (error) {
        console.error('Presigned download URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned download URL',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route GET /api/contabo/list-files
 * @desc List files in bucket
 * @access Private (Admin only)
 */
router.get('/list-files', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { prefix = '', maxKeys = 100, continuationToken } = req.query;
        
        const result = await contaboStorage.listFiles(prefix, parseInt(maxKeys), continuationToken);
        
        res.status(200).json({
            success: true,
            message: 'Files listed successfully',
            data: result,
            errors: []
        });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list files',
            data: null,
            errors: [error.message]
        });
    }
});

/**
 * @route DELETE /api/contabo/delete-file
 * @desc Delete file from bucket
 * @access Private (Admin only)
 */
router.delete('/delete-file', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { fileName } = req.body;

        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: 'fileName is required',
                data: null,
                errors: ['fileName is required']
            });
        }

        // Check if file exists
        const exists = await contaboStorage.fileExists(fileName);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                data: null,
                errors: ['File not found']
            });
        }

        const result = await contaboStorage.deleteFile(fileName);
        
        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
            data: result,
            errors: []
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            data: null,
            errors: [error.message]
        });
    }
});

module.exports = router;
