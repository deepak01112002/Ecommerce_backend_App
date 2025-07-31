require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const responseMiddleware = require('./middlewares/responseMiddleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Production-ready CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Get environment variables for production domains
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
        const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
        const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN;

        // Development origins (localhost)
        const developmentOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:8080'
        ];

        // Production origins (your domain)
        const productionOrigins = [
            FRONTEND_URL,
            ADMIN_URL,
            'https://editor.swagger.io', // For Swagger Editor
            'https://petstore.swagger.io' // For Swagger Petstore
        ];

        // Add production domain variations if provided
        if (PRODUCTION_DOMAIN) {
            productionOrigins.push(
                `https://${PRODUCTION_DOMAIN}`,
                `https://www.${PRODUCTION_DOMAIN}`,
                `https://api.${PRODUCTION_DOMAIN}`,
                `https://admin.${PRODUCTION_DOMAIN}`,
                `https://app.${PRODUCTION_DOMAIN}`
            );
        }

        // Combine all allowed origins
        const allowedOrigins = [...developmentOrigins, ...productionOrigins];

        // Allow localhost on any port for development
        if (process.env.NODE_ENV !== 'production') {
            if (origin.match(/^https?:\/\/localhost(:\d+)?$/) ||
                origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)) {
                return callback(null, true);
            }
        }

        // Allow file:// protocol for local HTML files (Swagger UI)
        if (origin.startsWith('file://')) {
            return callback(null, true);
        }

        // Check against allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // For development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // Log blocked origins in production for debugging
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'X-API-Key',
        'X-Client-Version'
    ],
    exposedHeaders: [
        'Content-Length',
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 200,
    maxAge: 86400 // Cache preflight response for 24 hours
}));

// Other middleware with increased limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));
app.use(morgan('combined'));

// Global debug middleware
app.use((req, res, next) => {
    if (req.url.includes('/orders/admin/all')) {
        console.log('🚨🚨🚨 GLOBAL: REQUEST TO', req.method, req.url);
    }
    next();
});

// Order total fix middleware
app.use('/api/orders/admin/all', (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        // Fix order totals if they are 0 but pricing.total has a value
        if (data && data.data && data.data.orders && Array.isArray(data.data.orders)) {
            data.data.orders = data.data.orders.map(order => {
                if (order.total === 0 && order.pricing && order.pricing.total > 0) {
                    order.total = order.pricing.total;
                }
                return order;
            });
        }
        return originalJson.call(this, data);
    };
    next();
});

// Custom middleware
app.use(responseMiddleware);

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Different rate limits for different types of requests
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 500 : 2000, // Much higher limit for general requests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        data: null,
        errors: [],
        meta: {
            timestamp: new Date().toISOString(),
            request_id: 'rate-limit-exceeded'
        }
    }
});

// Stricter rate limit for authentication endpoints with admin bypass
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 200 : 500, // Increased limits
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin panel domains
        const origin = req.get('origin') || req.get('referer') || '';
        const adminDomains = [
            'admin.ghanshyammurtibhandar.com',
            'localhost:3001',
            'localhost:3000',
            '127.0.0.1'
        ];

        return adminDomains.some(domain => origin.includes(domain));
    },
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again later.',
        data: null,
        errors: [],
        meta: {
            timestamp: new Date().toISOString(),
            request_id: 'auth-rate-limit-exceeded'
        }
    }
});

// Very lenient rate limit for admin panel with IP whitelisting
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // Very high limit for admin operations
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin panel domains and localhost
        const origin = req.get('origin') || req.get('referer') || '';
        const adminDomains = [
            'admin.ghanshyammurtibhandar.com',
            'localhost:3001',
            'localhost:3000',
            '127.0.0.1'
        ];

        return adminDomains.some(domain => origin.includes(domain));
    },
    message: {
        success: false,
        message: 'Too many admin requests from this IP, please try again later.',
        data: null,
        errors: [],
        meta: {
            timestamp: new Date().toISOString(),
            request_id: 'admin-rate-limit-exceeded'
        }
    }
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Apply lenient rate limiting to admin routes
app.use('/api/admin', adminLimiter);

// Import all routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const addressRoutes = require('./routes/addressRoutes');
const walletRoutes = require('./routes/walletRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const gstRoutes = require('./routes/gstRoutes');
const billManagementRoutes = require('./routes/billManagementRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const advancedReportsRoutes = require('./routes/advancedReportsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const returnRoutes = require('./routes/returnRoutes');
const supportRoutes = require('./routes/supportRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminManagementRoutes = require('./routes/adminManagementRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const businessSettingsRoutes = require('./routes/businessSettingsRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');

// Production Routes (Enhanced & Comprehensive)
const productionRoutes = require('./routes/productionRoutes');

// Use all routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
// Debug middleware for orders
app.use('/api/orders', (req, res, next) => {
    console.log('🚨🚨🚨 REQUEST TO /api/orders:', req.method, req.url);
    next();
});
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/bill-management', billManagementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/reports', advancedReportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/management', adminManagementRoutes);
app.use('/api/admin/business-settings', businessSettingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/qr-codes', qrCodeRoutes);

// Contabo Storage Routes
const contaboRoutes = require('./routes/contaboRoutes');
app.use('/api/contabo', contaboRoutes);

// Swagger Documentation Routes
const path = require('path');
const fs = require('fs');

// Serve Swagger YAML file with dynamic server configuration
app.get('/api/swagger.yaml', (req, res) => {
    const fs = require('fs');
    const yaml = require('js-yaml');

    try {
        // Read the original YAML file
        const yamlPath = path.join(__dirname, 'docs', 'complete-api-swagger.yaml');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');

        // Parse YAML to JSON
        const swaggerDoc = yaml.load(yamlContent);

        // Determine current server URL based on request
        const protocol = req.protocol;
        const host = req.get('host');
        const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

        // Set the correct server order based on environment
        if (isLocalhost) {
            // Development: localhost first
            swaggerDoc.servers = [
                {
                    url: `${protocol}://${host}/api`,
                    description: '🔧 Development Server (Current)'
                },
                {
                    url: 'https://server.ghanshyammurtibhandar.com/api',
                    description: '🚀 Production Server (After Deployment)'
                }
            ];
        } else {
            // Production: production server first
            swaggerDoc.servers = [
                {
                    url: `${protocol}://${host}/api`,
                    description: '🚀 Production Server (Current)'
                },
                {
                    url: 'http://localhost:8080/api',
                    description: '🔧 Development Server'
                }
            ];
        }

        // Convert back to YAML
        const dynamicYaml = yaml.dump(swaggerDoc);

        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dynamicYaml);

    } catch (error) {
        console.error('Error serving dynamic Swagger YAML:', error);
        // Fallback to static file
        res.setHeader('Content-Type', 'application/x-yaml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(path.join(__dirname, 'docs', 'complete-api-swagger.yaml'));
    }
});

// Serve Swagger UI
app.get('/api/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(__dirname, 'docs', 'swagger-ui.html'));
});

// API Documentation endpoint
app.get('/api/documentation', (req, res) => {
    res.success({
        swagger_ui: `${req.protocol}://${req.get('host')}/api/docs`,
        swagger_yaml: `${req.protocol}://${req.get('host')}/api/swagger.yaml`,
        postman_collection: `${req.protocol}://${req.get('host')}/api/postman`,
        endpoints_count: 150,
        version: '2.0.0'
    }, 'API documentation links');
});

// Image Proxy Routes (for Contabo S3 access)
const imageProxyRoutes = require('./routes/imageProxyRoutes');
app.use('/api/images', imageProxyRoutes);

// Start URL Refresh Service for long-lived presigned URLs
const urlRefreshService = require('./services/urlRefreshService');
urlRefreshService.start();

// Production enhanced routes (additional endpoints)
app.use('/api/v2', productionRoutes);

// Cache statistics endpoint (for monitoring)
const { getCacheStats } = require('./middleware/cache');
app.get('/api/cache/stats', (req, res) => {
    res.success(getCacheStats(), 'Cache statistics retrieved successfully');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.success({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    }, 'Server is healthy');
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
