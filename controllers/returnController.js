const Return = require('../models/Return');
const Order = require('../models/Order');
const { asyncHandler } = require('../middlewares/errorHandler');
const { createOrderNotification } = require('./notificationController');

// Create return request
exports.createReturnRequest = asyncHandler(async (req, res) => {
    const {
        orderId,
        items,
        returnType,
        returnReason,
        customerComments,
        pickupAddress
    } = req.body;
    
    // Verify order belongs to user
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
        return res.error('Order not found', [], 404);
    }
    
    // Check if order is eligible for return
    const orderDate = new Date(order.orderDate);
    const daysSinceOrder = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
    const returnWindow = 7; // days
    
    if (daysSinceOrder > returnWindow) {
        return res.error('Return window has expired', [], 400);
    }
    
    // Calculate return amounts
    let itemsTotal = 0;
    const processedItems = items.map(item => {
        const orderItem = order.items.find(oi => oi.product.toString() === item.product);
        if (!orderItem) {
            throw new Error(`Product ${item.product} not found in order`);
        }
        
        const itemTotal = item.quantity * orderItem.unitPrice;
        itemsTotal += itemTotal;
        
        return {
            ...item,
            productName: orderItem.name,
            sku: orderItem.sku,
            unitPrice: orderItem.unitPrice,
            totalAmount: itemTotal
        };
    });
    
    const taxRefund = (itemsTotal * 18) / 100; // Assuming 18% GST
    const totalRefund = itemsTotal + taxRefund;
    
    const returnData = {
        order: orderId,
        user: req.user._id,
        items: processedItems,
        returnType,
        returnReason,
        customerComments,
        amounts: {
            itemsTotal,
            taxRefund,
            totalRefund,
            finalRefund: totalRefund
        },
        pickupDetails: {
            address: pickupAddress
        },
        customerInfo: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
            phone: req.user.phone
        }
    };
    
    const returnRequest = await Return.createReturnRequest(returnData);
    
    // Create notification
    await createOrderNotification(
        req.user._id,
        orderId,
        'return_requested',
        { returnNumber: returnRequest.formattedReturnNumber }
    );
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Return request created successfully', 201);
});

// Get user returns
exports.getUserReturns = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        returnType
    } = req.query;
    
    const query = { user: req.user._id, isActive: true };
    if (status) query.status = status;
    if (returnType) query.returnType = returnType;
    
    const returns = await Return.find(query)
        .populate('order', 'orderNumber orderDate')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Return.countDocuments(query);
    
    res.success({
        returns: returns.map(ret => ret.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Returns retrieved successfully');
});

// Get single return
exports.getReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const returnRequest = await Return.findOne({
        _id: id,
        user: req.user._id,
        isActive: true
    })
    .populate('order', 'orderNumber orderDate')
    .populate('items.product', 'name images')
    .populate('inspection.inspectedBy', 'firstName lastName');
    
    if (!returnRequest) {
        return res.error('Return request not found', [], 404);
    }
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Return request retrieved successfully');
});

// Admin: Get all returns
exports.getAllReturns = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        returnType,
        startDate,
        endDate,
        search
    } = req.query;
    
    const query = { isActive: true };
    if (status) query.status = status;
    if (returnType) query.returnType = returnType;
    
    if (startDate || endDate) {
        query.requestedAt = {};
        if (startDate) query.requestedAt.$gte = new Date(startDate);
        if (endDate) query.requestedAt.$lte = new Date(endDate);
    }
    
    if (search) {
        query.$or = [
            { returnNumber: new RegExp(search, 'i') },
            { customerComments: new RegExp(search, 'i') }
        ];
    }
    
    const returns = await Return.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('order', 'orderNumber orderDate')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Return.countDocuments(query);
    
    res.success({
        returns: returns.map(ret => ret.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'All returns retrieved successfully');
});

// Admin: Approve return
exports.approveReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
        return res.error('Return request not found', [], 404);
    }
    
    await returnRequest.approve(req.user._id, notes);
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Return request approved successfully');
});

// Admin: Reject return
exports.rejectReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
        return res.error('Return request not found', [], 404);
    }
    
    await returnRequest.reject(req.user._id, reason);
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Return request rejected successfully');
});

// Admin: Schedule pickup
exports.schedulePickup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pickupData = req.body;
    
    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
        return res.error('Return request not found', [], 404);
    }
    
    await returnRequest.schedulePickup(pickupData, req.user._id);
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Pickup scheduled successfully');
});

// Admin: Complete return
exports.completeReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { refundData } = req.body;
    
    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
        return res.error('Return request not found', [], 404);
    }
    
    await returnRequest.complete(req.user._id, refundData);
    
    res.success({
        return: returnRequest.getFormattedData()
    }, 'Return completed successfully');
});

// Admin: Get return statistics
exports.getReturnStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const stats = await Return.getReturnStatistics({ startDate, endDate });
    
    // Additional analytics
    const statusDistribution = await Return.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const reasonDistribution = await Return.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$returnReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    res.success({
        statistics: {
            ...stats,
            statusDistribution,
            reasonDistribution
        }
    }, 'Return statistics retrieved successfully');
});

module.exports = exports;
