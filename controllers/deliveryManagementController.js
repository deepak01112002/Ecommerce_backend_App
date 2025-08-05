const Order = require('../models/Order');
const DeliveryCompany = require('../models/DeliveryCompany');
const delhiveryService = require('../services/delhiveryService');
const { asyncHandler } = require('../middlewares/errorHandler');

// @desc    Get delivery options for admin dropdown
// @route   GET /api/delivery-management/options
// @access  Admin
const getDeliveryOptions = asyncHandler(async (req, res) => {
    const { state, city, postalCode, weight = 1, codAmount = 0 } = req.query;

    // Prepare delivery options for admin dropdown
    const options = [
        {
            id: 'manual',
            name: 'Manual Delivery',
            type: 'manual',
            description: 'Handle delivery manually',
            estimatedDays: '1-2 days',
            charges: 0,
            isRecommended: false
        }
    ];

    // Add Delhivery option with real-time rates
    try {
        // Check Delhivery serviceability first
        const serviceabilityResult = await delhiveryService.checkServiceability(postalCode);

        if (serviceabilityResult.success && serviceabilityResult.data.isServiceable) {
            // Get Delhivery rates
            const rateResult = await delhiveryService.getDeliveryRates({
                fromPincode: process.env.ORIGIN_PINCODE || '110001',
                toPincode: postalCode,
                weight: parseFloat(weight),
                codAmount: parseFloat(codAmount)
            });

            if (rateResult.success) {
                options.push({
                    id: 'delhivery',
                    name: 'Delhivery',
                    type: 'delhivery',
                    description: 'Professional courier service',
                    estimatedDays: rateResult.data.estimatedDays,
                    charges: rateResult.data.totalAmount,
                    baseRate: rateResult.data.baseRate,
                    codCharges: rateResult.data.codCharges,
                    isRecommended: true,
                    serviceData: serviceabilityResult.data
                });
            }
        }
    } catch (error) {
        console.error('Error fetching Delhivery options:', error);
        // Add Delhivery as option even if rate fetch fails
        options.push({
            id: 'delhivery',
            name: 'Delhivery',
            type: 'delhivery',
            description: 'Professional courier service',
            estimatedDays: '2-4 days',
            charges: 0,
            isRecommended: true,
            error: 'Rate calculation failed'
        });
    }

    // Get active delivery companies for the location (if any)
    const deliveryCompanies = await DeliveryCompany.find({
        status: 'active',
        isApproved: true,
        'serviceAreas.state': state,
        'serviceAreas.cities': city,
        'serviceAreas.isActive': true
    }).select('name code type pricing deliveryTime performance');

    // Add delivery companies as options
    deliveryCompanies.forEach(company => {
        const baseCharges = company.pricing.baseRate || 0;
        const codCharges = company.pricing.codCharges || 0;

        options.push({
            id: company._id.toString(),
            name: company.name,
            code: company.code,
            type: 'delivery_company',
            description: `${company.type} delivery service`,
            estimatedDays: company.deliveryTime.estimatedDays + ' days',
            charges: baseCharges + codCharges,
            rating: company.performance.rating,
            isRecommended: company.isPreferred || false,
            companyData: {
                id: company._id,
                name: company.name,
                code: company.code,
                type: company.type
            }
        });
    });

    // Sort by recommended first, then by rating
    options.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return (b.rating || 0) - (a.rating || 0);
    });

    res.success({
        options,
        count: options.length,
        location: { state, city, postalCode }
    }, 'Delivery options retrieved successfully');
});

// @desc    Assign delivery method to order
// @route   POST /api/delivery-management/orders/:orderId/assign
// @access  Admin
const assignDeliveryMethod = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { deliveryMethod, deliveryCompanyId, adminNotes } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        return res.error('Order not found', 404);
    }

    // Validate delivery method
    if (!['manual', 'delivery_company', 'delhivery', 'shiprocket'].includes(deliveryMethod)) {
        return res.error('Invalid delivery method', 400);
    }

    // If delivery company is selected, validate it exists and serves the location
    let deliveryCompany = null;
    if (deliveryMethod === 'delivery_company' && deliveryCompanyId) {
        deliveryCompany = await DeliveryCompany.findById(deliveryCompanyId);
        if (!deliveryCompany) {
            return res.error('Delivery company not found', 404);
        }

        if (deliveryCompany.status !== 'active' || !deliveryCompany.isApproved) {
            return res.error('Delivery company is not active', 400);
        }

        // Check if company serves the order location
        const orderState = order.shippingAddress.state;
        const orderCity = order.shippingAddress.city;
        
        const servesLocation = deliveryCompany.serviceAreas.some(area => 
            area.state === orderState && 
            area.cities.includes(orderCity) && 
            area.isActive
        );

        if (!servesLocation) {
            return res.error('Delivery company does not serve this location', 400);
        }
    }

    // Update order shipping information
    order.shipping.deliveryMethod = deliveryMethod;
    order.shipping.assignedBy = req.user._id;
    order.shipping.assignedAt = new Date();
    order.shipping.adminNotes = adminNotes || '';

    if (deliveryCompany) {
        order.shipping.deliveryCompanyId = deliveryCompany._id;
        order.shipping.deliveryCompanyName = deliveryCompany.name;
        order.shipping.carrier = deliveryCompany.name;
    } else {
        order.shipping.deliveryCompanyId = null;
        order.shipping.deliveryCompanyName = null;
        if (deliveryMethod === 'manual') {
            order.shipping.carrier = 'Manual Delivery';
        } else if (deliveryMethod === 'delhivery') {
            order.shipping.carrier = 'Delhivery';
        }
    }

    await order.save();

    // If Delhivery is selected, create shipment
    if (deliveryMethod === 'delhivery') {
        try {
            const shipmentResult = await createDelhiveryShipment(order);
            if (shipmentResult.success) {
                order.shipping.trackingNumber = shipmentResult.data.waybill;
                order.shipping.awbCode = shipmentResult.data.waybill;
                order.shipping.shiprocketOrderId = shipmentResult.data.refnum;
                order.status = 'processing';
                await order.save();
            }
        } catch (error) {
            console.error('Failed to create Delhivery shipment:', error);
            // Continue without failing the assignment
        }
    }

    // Populate the updated order for response
    await order.populate([
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'shipping.deliveryCompanyId', select: 'name code type' },
        { path: 'shipping.assignedBy', select: 'firstName lastName' }
    ]);

    res.success({
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            shipping: order.shipping,
            shippingAddress: order.shippingAddress,
            user: order.user
        }
    }, 'Delivery method assigned successfully');
});

// @desc    Get orders pending delivery assignment
// @route   GET /api/delivery-management/orders/pending
// @access  Admin
const getPendingOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = 'confirmed' } = req.query;

    const query = {
        status: status,
        'paymentInfo.status': 'completed',
        $or: [
            { 'shipping.deliveryMethod': { $exists: false } },
            { 'shipping.deliveryMethod': null }
        ]
    };

    const orders = await Order.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('shipping.assignedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.success({
        orders,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Pending orders retrieved successfully');
});

// @desc    Get delivery assignments history
// @route   GET /api/delivery-management/assignments
// @access  Admin
const getDeliveryAssignments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, deliveryMethod, assignedBy } = req.query;

    const query = {
        'shipping.deliveryMethod': { $exists: true, $ne: null }
    };

    if (deliveryMethod) {
        query['shipping.deliveryMethod'] = deliveryMethod;
    }

    if (assignedBy) {
        query['shipping.assignedBy'] = assignedBy;
    }

    const orders = await Order.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('shipping.deliveryCompanyId', 'name code type')
        .populate('shipping.assignedBy', 'firstName lastName')
        .sort({ 'shipping.assignedAt': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Get assignment statistics
    const stats = await Order.aggregate([
        { $match: { 'shipping.deliveryMethod': { $exists: true, $ne: null } } },
        {
            $group: {
                _id: '$shipping.deliveryMethod',
                count: { $sum: 1 },
                avgDeliveryTime: { $avg: '$shipping.estimatedDelivery' }
            }
        }
    ]);

    res.success({
        assignments: orders,
        stats,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Delivery assignments retrieved successfully');
});

// @desc    Update delivery assignment
// @route   PUT /api/delivery-management/orders/:orderId/assignment
// @access  Admin
const updateDeliveryAssignment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { deliveryMethod, deliveryCompanyId, adminNotes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.error('Order not found', 404);
    }

    // Check if order can be reassigned
    if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.error('Cannot reassign delivery for completed orders', 400);
    }

    // Use the same logic as assign method
    return assignDeliveryMethod(req, res);
});

// Helper function to create Delhivery shipment
const createDelhiveryShipment = async (order) => {
    try {
        const orderData = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: `${order.user.firstName} ${order.user.lastName}`,
            customerPhone: order.user.phone,
            customerEmail: order.user.email,
            shippingAddress: {
                addressLine1: order.shippingAddress.street,
                addressLine2: order.shippingAddress.area,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                postalCode: order.shippingAddress.postalCode,
                country: order.shippingAddress.country || 'India'
            },
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            codAmount: order.paymentInfo.method === 'cod' ? order.pricing.total : 0,
            weight: order.items.reduce((total, item) => total + (item.weight || 0.5), 0)
        };

        return await delhiveryService.createShipment(orderData);
    } catch (error) {
        console.error('Error creating Delhivery shipment:', error);
        return { success: false, error: error.message };
    }
};

// @desc    Track Delhivery shipment
// @route   GET /api/delivery-management/track/:waybill
// @access  Admin
const trackDelhiveryShipment = asyncHandler(async (req, res) => {
    const { waybill } = req.params;

    const trackingResult = await delhiveryService.trackShipment(waybill);

    if (trackingResult.success) {
        res.success(trackingResult.data, 'Shipment tracking retrieved successfully');
    } else {
        res.error(trackingResult.error, 400);
    }
});

// @desc    Check Delhivery serviceability
// @route   GET /api/delivery-management/serviceability/:pincode
// @access  Admin
const checkDelhiveryServiceability = asyncHandler(async (req, res) => {
    const { pincode } = req.params;

    const serviceabilityResult = await delhiveryService.checkServiceability(pincode);

    if (serviceabilityResult.success) {
        res.success(serviceabilityResult.data, 'Serviceability checked successfully');
    } else {
        res.error(serviceabilityResult.error, 400);
    }
});

module.exports = {
    getDeliveryOptions,
    assignDeliveryMethod,
    getPendingOrders,
    getDeliveryAssignments,
    updateDeliveryAssignment,
    trackDelhiveryShipment,
    checkDelhiveryServiceability
};
