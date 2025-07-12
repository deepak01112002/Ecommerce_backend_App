const { validationResult } = require('express-validator');

// Global error handler
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 422;
        message = 'Validation failed';
        errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message,
            value: error.value
        }));
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
        const field = Object.keys(err.keyPattern)[0];
        errors = [{
            field,
            message: `${field} already exists`,
            value: err.keyValue[field]
        }];
    }
    
    // Mongoose cast error
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errors = [{
            field: err.path,
            message: `Invalid ${err.path} format`,
            value: err.value
        }];
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File too large';
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        statusCode = 400;
        message = 'Too many files';
    }
    
    // Rate limiting error
    if (err.status === 429) {
        statusCode = 429;
        message = 'Too many requests';
    }
    
    // Use response middleware if available
    if (res.error) {
        return res.error(message, errors, statusCode);
    }
    
    // Fallback response
    res.status(statusCode).json({
        success: false,
        message,
        data: null,
        errors,
        meta: {
            timestamp: new Date().toISOString(),
            request_id: req.requestId || 'unknown'
        }
    });
};

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.validationError(errors.array());
    }
    next();
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFoundHandler = (req, res) => {
    if (res.error) {
        return res.error('Route not found', [], 404);
    }
    
    res.status(404).json({
        success: false,
        message: 'Route not found',
        data: null,
        errors: [],
        meta: {
            timestamp: new Date().toISOString(),
            request_id: req.requestId || 'unknown'
        }
    });
};

module.exports = {
    errorHandler,
    validateRequest,
    asyncHandler,
    notFoundHandler
};
