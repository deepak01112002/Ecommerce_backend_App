const { v4: uuidv4 } = require('uuid');

// Standardized response format middleware
const responseMiddleware = (req, res, next) => {
    // Add request ID for tracking
    req.requestId = uuidv4();
    
    // Success response helper
    res.success = (data = null, message = 'Success', statusCode = 200) => {
        const response = {
            success: true,
            message,
            data,
            errors: [],
            meta: {
                timestamp: new Date().toISOString(),
                request_id: req.requestId,
                version: '1.0',
                platform: req.headers['x-platform'] || 'unknown'
            }
        };
        
        return res.status(statusCode).json(response);
    };
    
    // Error response helper
    res.error = (message = 'Error occurred', errors = [], statusCode = 400, data = null) => {
        const response = {
            success: false,
            message,
            data,
            errors: Array.isArray(errors) ? errors : [errors],
            meta: {
                timestamp: new Date().toISOString(),
                request_id: req.requestId,
                version: '1.0',
                platform: req.headers['x-platform'] || 'unknown'
            }
        };
        
        return res.status(statusCode).json(response);
    };
    
    // Validation error helper
    res.validationError = (errors, message = 'Validation failed') => {
        const formattedErrors = errors.map(error => ({
            field: error.path || error.param,
            message: error.msg || error.message,
            value: error.value
        }));
        
        return res.error(message, formattedErrors, 422);
    };
    
    // Pagination helper
    res.paginated = (data, pagination, message = 'Data retrieved successfully') => {
        const response = {
            success: true,
            message,
            data,
            errors: [],
            meta: {
                timestamp: new Date().toISOString(),
                request_id: req.requestId,
                version: '1.0',
                platform: req.headers['x-platform'] || 'unknown',
                pagination: {
                    current_page: pagination.currentPage,
                    per_page: pagination.perPage,
                    total: pagination.total,
                    total_pages: pagination.totalPages,
                    has_next_page: pagination.hasNextPage,
                    has_prev_page: pagination.hasPrevPage
                }
            }
        };
        
        return res.status(200).json(response);
    };
    
    next();
};

module.exports = responseMiddleware;
