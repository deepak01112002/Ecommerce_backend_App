const contaboStorage = require('../services/contaboStorage');
const busboy = require('busboy');

// File validation helper
const validateImageFile = (mimetype, size) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    const maxSize = 25 * 1024 * 1024; // 25MB limit (increased for admin uploads)

    if (!allowedMimeTypes.includes(mimetype)) {
        throw new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)');
    }

    if (size > maxSize) {
        throw new Error('File size must be less than 25MB');
    }

    return true;
};

/**
 * Parse multipart form data without multer using busboy
 */
const parseMultipartData = (req, res) => {
    return new Promise((resolve, reject) => {
        const files = [];
        const fields = {};

        const bb = busboy({
            headers: req.headers,
            limits: {
                fileSize: 25 * 1024 * 1024, // 25MB file size limit
                files: 10, // Maximum 10 files
                fieldSize: 1024 * 1024, // 1MB field size limit
                fields: 50 // Maximum 50 fields
            }
        });

        bb.on('file', (fieldname, file, info) => {
            // Handle different busboy versions
            let filename, encoding, mimeType;

            if (info && typeof info === 'object') {
                // Newer busboy version
                filename = info.filename;
                encoding = info.encoding;
                mimeType = info.mimeType;
            } else {
                // Older busboy version - info might be filename directly
                filename = info;
                encoding = 'binary';
                mimeType = 'application/octet-stream';
            }

            const chunks = [];

            file.on('data', (chunk) => {
                chunks.push(chunk);
            });

            file.on('end', () => {
                const buffer = Buffer.concat(chunks);

                try {
                    // If mimeType is not properly detected, try to detect from filename
                    if (!mimeType || mimeType === 'application/octet-stream') {
                        if (filename) {
                            const ext = filename.toLowerCase().split('.').pop();
                            switch (ext) {
                                case 'jpg':
                                case 'jpeg':
                                    mimeType = 'image/jpeg';
                                    break;
                                case 'png':
                                    mimeType = 'image/png';
                                    break;
                                case 'gif':
                                    mimeType = 'image/gif';
                                    break;
                                case 'webp':
                                    mimeType = 'image/webp';
                                    break;
                                default:
                                    mimeType = 'image/jpeg'; // Default fallback
                            }
                        }
                    }

                    validateImageFile(mimeType, buffer.length);
                    files.push({
                        fieldname,
                        originalname: filename || 'unknown',
                        encoding: encoding || 'binary',
                        mimetype: mimeType,
                        buffer,
                        size: buffer.length
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });

        bb.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        bb.on('finish', () => {
            resolve({ files: files || [], fields: fields || {} });
        });

        bb.on('error', (err) => {
            reject(err);
        });

        req.pipe(bb);
    });
};

/**
 * Middleware to handle single image upload to Contabo (Pure - No Multer)
 */
const uploadSingleImage = (fieldName, folder = 'products') => {
    return async (req, res, next) => {
        try {
            // Parse multipart data
            const result = await parseMultipartData(req, res);
            const { files = [], fields = {} } = result || {};

            // Add fields to request body
            req.body = req.body || {};
            Object.assign(req.body, fields || {});

            // Find the specific field file
            const file = files.find(f => f.fieldname === fieldName);

            // If no file uploaded, continue
            if (!file) {
                return next();
            }

            // Upload to Contabo Object Storage
            const uploadResult = await contaboStorage.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                folder
            );

            // Add upload result to request object
            req.uploadedFile = uploadResult;
            req.imageUrl = uploadResult.url;

            next();
        } catch (error) {
            console.error('Contabo upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image to storage',
                data: null,
                errors: [error.message]
            });
        }
    };
};

/**
 * Middleware to handle multiple images upload to Contabo (Pure - No Multer)
 */
const uploadMultipleImages = (fieldName, maxCount = 5, folder = 'products') => {
    return async (req, res, next) => {
        try {
            // Parse multipart data
            const result = await parseMultipartData(req, res);
            const { files = [], fields = {} } = result || {};

            // Add fields to request body
            req.body = req.body || {};
            Object.assign(req.body, fields || {});

            // Filter files by field name
            const targetFiles = files.filter(f => f.fieldname === fieldName);

            // Check max count
            if (targetFiles.length > maxCount) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum ${maxCount} files allowed`,
                    data: null,
                    errors: [`Maximum ${maxCount} files allowed`]
                });
            }

            // If no files uploaded, continue
            if (targetFiles.length === 0) {
                return next();
            }

            // Upload all files to Contabo Object Storage
            const uploadResults = await contaboStorage.uploadMultipleFiles(targetFiles, folder);

            // Add upload results to request object
            req.uploadedFiles = uploadResults.files;
            req.imageUrls = uploadResults.files.map(file => file.url);

            next();
        } catch (error) {
            console.error('Contabo multiple upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload images to storage',
                data: null,
                errors: [error.message]
            });
        }
    };
};

/**
 * Middleware to handle mixed uploads (single + multiple) (Pure - No Multer)
 */
const uploadMixedImages = (fields, folder = 'products') => {
    return async (req, res, next) => {
        try {
            // Parse multipart data
            const result = await parseMultipartData(req, res);
            const { files = [], fields: formFields = {} } = result || {};

            // Add fields to request body
            req.body = req.body || {};
            Object.assign(req.body, formFields || {});

            const uploadResults = {};

            // Process each field configuration
            for (const field of fields) {
                const fieldName = field.name;
                const targetFiles = files.filter(f => f.fieldname === fieldName);

                if (targetFiles.length > 0) {
                    // Check max count
                    if (targetFiles.length > field.maxCount) {
                        return res.status(400).json({
                            success: false,
                            message: `Maximum ${field.maxCount} files allowed for ${fieldName}`,
                            data: null,
                            errors: [`Maximum ${field.maxCount} files allowed for ${fieldName}`]
                        });
                    }

                    if (field.maxCount === 1) {
                        // Single file upload
                        const result = await contaboStorage.uploadFile(
                            targetFiles[0].buffer,
                            targetFiles[0].originalname,
                            targetFiles[0].mimetype,
                            folder
                        );
                        uploadResults[fieldName] = result;
                    } else {
                        // Multiple files upload
                        const results = await contaboStorage.uploadMultipleFiles(targetFiles, folder);
                        uploadResults[fieldName] = results.files;
                    }
                }
            }

            // Add upload results to request object
            req.uploadResults = uploadResults;

            next();
        } catch (error) {
            console.error('Contabo mixed upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload images to storage',
                data: null,
                errors: [error.message]
            });
        }
    };
};

/**
 * Helper function to delete old images when updating
 */
const deleteOldImages = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return;
    
    try {
        const deletePromises = imageUrls.map(url => {
            const fileName = contaboStorage.extractFileNameFromUrl(url);
            if (fileName) {
                return contaboStorage.deleteFile(fileName);
            }
        });
        
        await Promise.all(deletePromises.filter(Boolean));
        console.log('Old images deleted successfully');
    } catch (error) {
        console.error('Error deleting old images:', error);
        // Don't throw error, just log it
    }
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadMixedImages,
    deleteOldImages,
    contaboStorage
};
