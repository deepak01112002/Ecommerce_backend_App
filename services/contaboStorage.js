const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const imageOptimizer = require('./imageOptimizer');
const path = require('path');

class ContaboStorageService {
    constructor() {
        // Contabo Object Storage Configuration (S3-compatible)
        this.s3Client = new S3Client({
            region: process.env.CONTABO_REGION || 'usc1', // USC1 region
            endpoint: process.env.CONTABO_ENDPOINT || 'https://usc1.contabostorage.com',
            credentials: {
                accessKeyId: process.env.CONTABO_ACCESS_KEY,
                secretAccessKey: process.env.CONTABO_SECRET_KEY
            },
            forcePathStyle: true, // Required for S3-compatible services
        });

        this.bucketName = process.env.CONTABO_BUCKET_NAME || 'ecommerce';
        this.baseUrl = process.env.CONTABO_BASE_URL || `https://usc1.contabostorage.com/${this.bucketName}`;

        // Validate credentials
        if (!process.env.CONTABO_ACCESS_KEY || !process.env.CONTABO_SECRET_KEY) {
            console.warn('⚠️  Contabo credentials not found in environment variables');
        } else {
            console.log('✅ Contabo Storage Service initialized successfully');
            console.log(`📦 Bucket: ${this.bucketName}`);
            console.log(`🌐 Endpoint: ${process.env.CONTABO_ENDPOINT}`);
        }
    }

    /**
     * Generate unique filename with timestamp and random string
     */
    generateFileName(originalName, folder = 'uploads') {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        
        // Clean filename - remove special characters
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        return `${folder}/${timestamp}-${randomString}-${cleanBaseName}${extension}`;
    }

    /**
     * Upload file to Contabo Object Storage with optimization
     */
    async uploadFile(fileBuffer, originalName, mimeType, folder = 'uploads', options = {}) {
        try {
            const fileName = this.generateFileName(originalName, folder);
            let processedBuffer = fileBuffer;
            let optimizationInfo = null;

            // Apply image optimization if it's an image
            if (imageOptimizer.isImage(mimeType)) {
                console.log(`🖼️ Optimizing image: ${originalName}`);

                const optimizationResult = await imageOptimizer.optimizeImage(fileBuffer, {
                    quality: options.quality || 85,
                    resize: options.resize !== false,
                    maxWidth: options.maxWidth || 1920,
                    maxHeight: options.maxHeight || 1920,
                    progressive: options.progressive !== false
                });

                if (optimizationResult.success) {
                    processedBuffer = optimizationResult.buffer;
                    optimizationInfo = optimizationResult.metadata;
                    console.log(`✅ Image optimized: ${optimizationInfo.compressionRatio}% size reduction`);
                } else {
                    console.log(`⚠️ Image optimization failed: ${optimizationResult.error}`);
                }
            }

            const uploadParams = {
                Bucket: this.bucketName,
                Key: fileName,
                Body: processedBuffer,
                ContentType: mimeType,
                ACL: 'public-read', // Make file publicly accessible
                CacheControl: 'max-age=31536000', // Cache for 1 year
                Metadata: {
                    'original-name': originalName,
                    'upload-timestamp': Date.now().toString(),
                    'optimized': optimizationInfo ? 'true' : 'false',
                    'original-size': fileBuffer.length.toString(),
                    'final-size': processedBuffer.length.toString()
                }
            };

            const command = new PutObjectCommand(uploadParams);
            const result = await this.s3Client.send(command);

            // Generate long-lived presigned URL for direct frontend access
            const presignedResult = await this.getSignedUrl(fileName, 86400); // 24 hours

            return {
                success: true,
                fileName: fileName,
                url: presignedResult.success ? presignedResult.url : `${this.baseUrl}/${fileName}`,
                s3Url: `${this.baseUrl}/${fileName}`, // Keep original S3 URL for reference
                size: processedBuffer.length,
                originalSize: fileBuffer.length,
                mimeType: mimeType,
                etag: result.ETag,
                expiresIn: presignedResult.success ? presignedResult.expiresIn : null,
                optimized: optimizationInfo !== null,
                optimizationInfo: optimizationInfo
            };
        } catch (error) {
            console.error('Contabo upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(files, folder = 'uploads') {
        try {
            const uploadPromises = files.map(file => 
                this.uploadFile(file.buffer, file.originalname, file.mimetype, folder)
            );
            
            const results = await Promise.all(uploadPromises);
            return {
                success: true,
                files: results
            };
        } catch (error) {
            console.error('Multiple upload error:', error);
            throw new Error(`Failed to upload multiple files: ${error.message}`);
        }
    }

    /**
     * Delete file from Contabo Object Storage
     */
    async deleteFile(fileName) {
        try {
            const deleteParams = {
                Bucket: this.bucketName,
                Key: fileName
            };

            const command = new DeleteObjectCommand(deleteParams);
            await this.s3Client.send(command);

            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            console.error('Contabo delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get signed URL for downloading files
     */
    async getSignedUrl(fileName, expiresIn = 3600) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileName
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

            return {
                success: true,
                url: signedUrl,
                expiresIn: expiresIn,
                fileName: fileName
            };
        } catch (error) {
            console.error('Signed URL error:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    /**
     * Get presigned URL for uploading files directly from frontend
     */
    async getPresignedUploadUrl(fileName, contentType, expiresIn = 3600, folder = 'uploads') {
        try {
            const key = folder ? `${folder}/${fileName}` : fileName;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
                ACL: 'public-read',
                CacheControl: 'max-age=31536000'
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

            return {
                success: true,
                uploadUrl: signedUrl,
                publicUrl: `${this.baseUrl}/${key}`,
                key: key,
                expiresIn: expiresIn,
                contentType: contentType
            };
        } catch (error) {
            console.error('Presigned upload URL error:', error);
            throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
        }
    }

    /**
     * Generate multiple presigned upload URLs for batch uploads
     */
    async getMultiplePresignedUploadUrls(files, folder = 'uploads', expiresIn = 3600) {
        try {
            const uploadUrls = [];

            for (const file of files) {
                const fileName = this.generateFileName(file.originalName, folder);
                const result = await this.getPresignedUploadUrl(fileName, file.contentType, expiresIn, '');

                uploadUrls.push({
                    ...result,
                    originalName: file.originalName,
                    fieldName: file.fieldName || 'file'
                });
            }

            return {
                success: true,
                uploadUrls: uploadUrls,
                totalFiles: uploadUrls.length
            };
        } catch (error) {
            console.error('Multiple presigned URLs error:', error);
            throw new Error(`Failed to generate multiple presigned URLs: ${error.message}`);
        }
    }

    /**
     * Verify if file exists in bucket
     */
    async fileExists(fileName) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: fileName
            });

            await this.s3Client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * List files in bucket with pagination
     */
    async listFiles(prefix = '', maxKeys = 100, continuationToken = null) {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys,
                ContinuationToken: continuationToken
            });

            const result = await this.s3Client.send(command);

            return {
                success: true,
                files: result.Contents || [],
                isTruncated: result.IsTruncated,
                nextContinuationToken: result.NextContinuationToken,
                totalCount: result.KeyCount
            };
        } catch (error) {
            console.error('List files error:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Extract filename from URL
     */
    extractFileNameFromUrl(url) {
        if (!url) return null;
        
        // Remove base URL to get filename
        const fileName = url.replace(this.baseUrl + '/', '');
        return fileName;
    }

    /**
     * Validate file type
     */
    validateFileType(mimeType, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
        return allowedTypes.includes(mimeType);
    }

    /**
     * Validate file size (in bytes)
     */
    validateFileSize(size, maxSize = 5 * 1024 * 1024) { // 5MB default
        return size <= maxSize;
    }

    /**
     * Get file info from URL
     */
    getFileInfo(url) {
        if (!url) return null;

        const fileName = this.extractFileNameFromUrl(url);
        if (!fileName) return null;

        return {
            fileName: fileName,
            url: url,
            fullUrl: url.startsWith('http') ? url : `${this.baseUrl}/${fileName}`
        };
    }

    /**
     * Convert S3 URL to proxy URL for public access
     */
    getProxyUrl(s3Key, baseUrl = 'http://localhost:8080') {
        if (!s3Key) return null;

        // If it's already a full S3 URL, extract the key
        if (s3Key.includes('contabostorage.com')) {
            const urlParts = s3Key.split('/');
            const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
            if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
                s3Key = urlParts.slice(bucketIndex + 1).join('/');
            }
        }

        // Split the key into folder and filename
        const keyParts = s3Key.split('/');
        if (keyParts.length >= 2) {
            const folder = keyParts[0];
            const filename = keyParts.slice(1).join('/');
            return `${baseUrl}/api/images/${folder}/${filename}`;
        }

        return `${baseUrl}/api/images/uploads/${s3Key}`;
    }

    /**
     * Convert multiple S3 URLs to proxy URLs
     */
    getProxyUrls(s3Keys, baseUrl = 'http://localhost:8080') {
        if (!Array.isArray(s3Keys)) return [];
        return s3Keys.map(key => this.getProxyUrl(key, baseUrl)).filter(Boolean);
    }

    /**
     * Extract S3 key from various URL formats
     */
    extractS3KeyFromUrl(url) {
        if (!url) return null;

        try {
            // Handle presigned URLs
            if (url.includes('contabostorage.com')) {
                const urlObj = new URL(url);
                const pathname = urlObj.pathname;

                // Remove leading slash and bucket name
                const pathParts = pathname.split('/').filter(Boolean);
                if (pathParts.length > 1 && pathParts[0] === this.bucketName) {
                    return pathParts.slice(1).join('/');
                }
                return pathParts.join('/');
            }

            // Handle proxy URLs
            if (url.includes('/api/images/')) {
                const parts = url.split('/api/images/');
                if (parts.length > 1) {
                    return parts[1];
                }
            }

            return null;
        } catch (error) {
            console.error('Error extracting S3 key from URL:', url, error);
            return null;
        }
    }

    /**
     * Test connection to Contabo S3 bucket
     */
    async testConnection() {
        try {
            console.log('🔍 Testing Contabo S3 connection...');

            // Test by listing objects (this will verify credentials and bucket access)
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                MaxKeys: 1
            });

            const result = await this.s3Client.send(command);

            console.log('✅ Contabo S3 connection successful!');
            console.log(`📦 Bucket: ${this.bucketName}`);
            console.log(`🌐 Endpoint: ${process.env.CONTABO_ENDPOINT}`);
            console.log(`📁 Files in bucket: ${result.KeyCount || 0}`);

            return {
                success: true,
                message: 'Connection successful',
                bucket: this.bucketName,
                endpoint: process.env.CONTABO_ENDPOINT,
                fileCount: result.KeyCount || 0
            };
        } catch (error) {
            console.error('❌ Contabo S3 connection failed:', error.message);

            return {
                success: false,
                message: 'Connection failed',
                error: error.message,
                bucket: this.bucketName,
                endpoint: process.env.CONTABO_ENDPOINT
            };
        }
    }

    /**
     * Get bucket statistics
     */
    async getBucketStats() {
        try {
            const result = await this.listFiles('', 1000);

            const stats = {
                totalFiles: result.files.length,
                totalSize: result.files.reduce((sum, file) => sum + (file.Size || 0), 0),
                folders: {}
            };

            // Group by folders
            result.files.forEach(file => {
                const folder = file.Key.split('/')[0];
                if (!stats.folders[folder]) {
                    stats.folders[folder] = { count: 0, size: 0 };
                }
                stats.folders[folder].count++;
                stats.folders[folder].size += file.Size || 0;
            });

            return {
                success: true,
                stats: stats
            };
        } catch (error) {
            console.error('Bucket stats error:', error);
            throw new Error(`Failed to get bucket stats: ${error.message}`);
        }
    }
}

// Create singleton instance
const contaboStorage = new ContaboStorageService();

module.exports = contaboStorage;
