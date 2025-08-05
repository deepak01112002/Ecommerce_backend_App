const Shipment = require('../models/Shipment');
const ShipmentTracking = require('../models/ShipmentTracking');
const Order = require('../models/Order');
const ShiprocketService = require('../services/ShiprocketService');
const DeliveryService = require('../services/DeliveryService');
const { asyncHandler } = require('../middlewares/errorHandler');

// Create shipment for order
exports.createShipment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { pickupLocation, courierCompanyId, dimensions } = req.body;

    // Get order details
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
        return res.error('Order not found', [], 404);
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ order: orderId });
    if (existingShipment) {
        return res.error('Shipment already exists for this order', [], 400);
    }

    // Prepare shipment data for Shiprocket
    const shipmentData = {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toISOString().split('T')[0],
        pickupLocation: pickupLocation || "Primary",
        billingAddress: {
            name: order.billingAddress.firstName + ' ' + order.billingAddress.lastName,
            lastName: order.billingAddress.lastName,
            address: order.billingAddress.addressLine1,
            address2: order.billingAddress.addressLine2,
            city: order.billingAddress.city,
            pincode: order.billingAddress.postalCode,
            state: order.billingAddress.state,
            country: order.billingAddress.country,
            email: order.user.email,
            phone: order.billingAddress.phone
        },
        shippingAddress: {
            name: order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName,
            lastName: order.shippingAddress.lastName,
            address: order.shippingAddress.addressLine1,
            address2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            pincode: order.shippingAddress.postalCode,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            email: order.user.email,
            phone: order.shippingAddress.phone
        },
        items: order.items.map(item => ({
            name: item.productSnapshot?.name || 'Product',
            sku: item.product.toString(),
            units: item.quantity,
            sellingPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: 0,
            hsn: ""
        })),
        paymentMethod: order.paymentInfo.method === 'cod' ? 'COD' : 'Prepaid',
        shippingCharges: order.pricing.shipping,
        totalDiscount: order.pricing.discount,
        subTotal: order.pricing.subtotal,
        dimensions: dimensions || {
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        }
    };

    // Create order in Shiprocket
    const shiprocketResult = await ShiprocketService.createOrder(shipmentData);

    if (!shiprocketResult.success) {
        return res.error('Failed to create shipment in Shiprocket', [shiprocketResult.error], 400);
    }

    // Create shipment record
    const shipment = new Shipment({
        order: orderId,
        user: order.user._id,
        shiprocketOrderId: shiprocketResult.shiprocketOrderId,
        shiprocketShipmentId: shiprocketResult.shipmentId,
        awbCode: shiprocketResult.awbCode,
        courierCompanyId: shiprocketResult.courierCompanyId || courierCompanyId,
        courierName: shiprocketResult.courierName,
        status: 'processing',
        shippingAddress: {
            name: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            email: order.user.email,
            address: order.shippingAddress.addressLine1,
            address2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            pincode: order.shippingAddress.postalCode
        },
        items: order.items.map(item => ({
            name: item.productSnapshot?.name || 'Product',
            sku: item.product.toString(),
            units: item.quantity,
            sellingPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: 0
        })),
        dimensions: shipmentData.dimensions,
        paymentMode: order.paymentInfo.method === 'cod' ? 'cod' : 'prepaid',
        subTotal: order.pricing.subtotal,
        totalDiscount: order.pricing.discount,
        totalAmount: order.pricing.total,
        shiprocketResponse: shiprocketResult.response
    });

    await shipment.save();

    // Update order with shipping info
    order.shipping = {
        method: 'shiprocket',
        trackingNumber: shiprocketResult.awbCode,
        carrier: shiprocketResult.courierName,
        shiprocketOrderId: shiprocketResult.shiprocketOrderId,
        shiprocketShipmentId: shiprocketResult.shipmentId
    };
    order.status = 'processing';
    await order.save();

    res.success({
        shipment: shipment.getFormattedData(),
        shiprocketData: {
            orderId: shiprocketResult.shiprocketOrderId,
            shipmentId: shiprocketResult.shipmentId,
            awbCode: shiprocketResult.awbCode,
            courierName: shiprocketResult.courierName
        }
    }, 'Shipment created successfully', 201);
});

// Get shipment details
exports.getShipment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const shipment = await Shipment.findById(id)
        .populate('order', 'orderNumber totalAmount status')
        .populate('user', 'firstName lastName email phone');

    if (!shipment) {
        return res.error('Shipment not found', [], 404);
    }

    // Get latest tracking
    const latestTracking = await ShipmentTracking.getLatestTracking(shipment._id);

    res.success({
        shipment: shipment.getFormattedData(),
        latestTracking: latestTracking ? latestTracking.getFormattedData() : null
    }, 'Shipment details retrieved successfully');
});

// Get all shipments
exports.getShipments = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        status, 
        courierName, 
        userId,
        startDate,
        endDate 
    } = req.query;

    const query = { isActive: true };
    
    if (status) query.status = status;
    if (courierName) query.courierName = courierName;
    if (userId) query.user = userId;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const shipments = await Shipment.find(query)
        .populate('order', 'orderNumber totalAmount status')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Shipment.countDocuments(query);

    res.success({
        shipments: shipments.map(shipment => shipment.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Shipments retrieved successfully');
});

// Track shipment
exports.trackShipment = asyncHandler(async (req, res) => {
    const { awbCode } = req.params;

    // Get shipment
    const shipment = await Shipment.findOne({ awbCode })
        .populate('order', 'orderNumber')
        .populate('user', 'firstName lastName');

    if (!shipment) {
        return res.error('Shipment not found', [], 404);
    }

    // Get tracking from Shiprocket
    const trackingResult = await ShiprocketService.trackShipment(awbCode);

    if (!trackingResult.success) {
        return res.error('Failed to get tracking information', [trackingResult.error], 400);
    }

    // Get tracking history from database
    const trackingHistory = await ShipmentTracking.getTrackingHistory(awbCode);

    res.success({
        shipment: {
            _id: shipment._id,
            orderNumber: shipment.order.orderNumber,
            awbCode: shipment.awbCode,
            courierName: shipment.courierName,
            status: shipment.formattedStatus,
            trackingUrl: shipment.trackingUrl
        },
        liveTracking: trackingResult.trackingData,
        trackingHistory: trackingHistory.map(track => track.getFormattedData())
    }, 'Tracking information retrieved successfully');
});

// Cancel shipment
exports.cancelShipment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) {
        return res.error('Shipment not found', [], 404);
    }

    if (shipment.status === 'delivered') {
        return res.error('Cannot cancel delivered shipment', [], 400);
    }

    // Cancel in Shiprocket
    const cancelResult = await ShiprocketService.cancelShipment(shipment.awbCode);

    if (!cancelResult.success) {
        return res.error('Failed to cancel shipment', [cancelResult.error], 400);
    }

    // Update shipment status
    await shipment.updateStatus('cancelled', { cancellationReason: reason });

    // Update order status
    const order = await Order.findById(shipment.order);
    if (order) {
        order.status = 'cancelled';
        await order.save();
    }

    res.success({
        message: 'Shipment cancelled successfully',
        shipment: shipment.getFormattedData()
    }, 'Shipment cancelled successfully');
});

// Generate pickup
exports.generatePickup = asyncHandler(async (req, res) => {
    const { shipmentIds, pickupDate } = req.body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return res.error('Shipment IDs are required', [], 400);
    }

    // Get shipments
    const shipments = await Shipment.find({ 
        _id: { $in: shipmentIds },
        status: { $in: ['processing', 'shipped'] }
    });

    if (shipments.length === 0) {
        return res.error('No valid shipments found', [], 404);
    }

    const shiprocketShipmentIds = shipments
        .filter(s => s.shiprocketShipmentId)
        .map(s => s.shiprocketShipmentId);

    // Generate pickup in Shiprocket
    const pickupResult = await ShiprocketService.generatePickup(
        shiprocketShipmentIds, 
        pickupDate || new Date().toISOString().split('T')[0]
    );

    if (!pickupResult.success) {
        return res.error('Failed to generate pickup', [pickupResult.error], 400);
    }

    res.success({
        message: 'Pickup generated successfully',
        pickupStatus: pickupResult.pickupStatus,
        shipmentsCount: shipments.length
    }, 'Pickup generated successfully');
});

// Shiprocket webhook handler
exports.handleWebhook = asyncHandler(async (req, res) => {
    const webhookData = req.body;
    
    console.log('Shiprocket webhook received:', JSON.stringify(webhookData, null, 2));

    // Process webhook
    const result = await ShiprocketService.processWebhook(webhookData);

    if (result.success) {
        res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
        res.status(400).json({ error: result.error });
    }
});

// Check serviceability
exports.checkServiceability = asyncHandler(async (req, res) => {
    const { pickupPostcode, deliveryPostcode, weight, codAmount } = req.body;

    const serviceabilityResult = await ShiprocketService.checkServiceability(
        pickupPostcode,
        deliveryPostcode,
        weight,
        codAmount || 0
    );

    if (!serviceabilityResult.success) {
        return res.error('Failed to check serviceability', [serviceabilityResult.error], 400);
    }

    res.success({
        couriers: serviceabilityResult.couriers,
        isServiceable: serviceabilityResult.couriers.length > 0
    }, 'Serviceability checked successfully');
});

// Get delivery options based on current delivery method
exports.getDeliveryOptions = asyncHandler(async (req, res) => {
    const { state, city, postalCode, weight = 1, codAmount = 0, orderValue = 0 } = req.query;

    if (!state || !city || !postalCode) {
        return res.error('State, city, and postal code are required', [], 400);
    }

    const location = { state, city, postalCode };
    const orderDetails = {
        weight: parseFloat(weight),
        codAmount: parseFloat(codAmount),
        orderValue: parseFloat(orderValue)
    };

    const deliveryOptions = await DeliveryService.getDeliveryOptions(location, orderDetails);

    if (!deliveryOptions.success) {
        return res.error('Failed to get delivery options', [deliveryOptions.error], 400);
    }

    res.success({
        method: deliveryOptions.method,
        location: location,
        options: deliveryOptions.options,
        count: deliveryOptions.options.length
    }, 'Delivery options retrieved successfully');
});

// Create shipment using new delivery service
exports.createShipmentV2 = asyncHandler(async (req, res) => {
    const { orderId, deliveryOptionId, dimensions } = req.body;

    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name weight height');

    if (!order) {
        return res.error('Order not found', [], 404);
    }

    if (!order.canBeShipped()) {
        return res.error('Order cannot be shipped at this time', [], 400);
    }

    // Get delivery options first
    const location = {
        state: order.shippingAddress.state,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode
    };

    const orderDetails = {
        weight: dimensions?.weight || 1,
        codAmount: order.paymentInfo.method === 'cod' ? order.pricing.total : 0,
        orderValue: order.pricing.total
    };

    const deliveryOptions = await DeliveryService.getDeliveryOptions(location, orderDetails);

    if (!deliveryOptions.success) {
        return res.error('Failed to get delivery options', [deliveryOptions.error], 400);
    }

    // Find the selected delivery option
    const selectedOption = deliveryOptions.options.find(opt => opt.id === deliveryOptionId);

    if (!selectedOption) {
        return res.error('Invalid delivery option selected', [], 400);
    }

    // Prepare order data for shipment creation
    const orderData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.shippingAddress.fullName,
        customerPhone: order.shippingAddress.phone,
        customerEmail: order.user?.email || order.guestInfo?.email,
        shippingAddress: order.shippingAddress,
        items: order.items,
        paymentMethod: order.paymentInfo.method === 'cod' ? 'COD' : 'Prepaid',
        shippingCharges: order.pricing.shipping,
        totalDiscount: order.pricing.discount,
        subTotal: order.pricing.subtotal,
        totalAmount: order.pricing.total,
        dimensions: dimensions || {
            length: 10,
            breadth: 10,
            height: 10,
            weight: 1
        }
    };

    // Create shipment using delivery service
    const shipmentResult = await DeliveryService.createShipment(orderData, selectedOption);

    if (!shipmentResult.success) {
        return res.error('Failed to create shipment', [shipmentResult.error], 400);
    }

    // Create shipment record in database
    const shipmentData = {
        order: orderId,
        user: order.user._id,
        trackingNumber: shipmentResult.trackingNumber,
        carrier: shipmentResult.carrier,
        status: 'processing',
        method: shipmentResult.method,
        shippingAddress: {
            name: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            email: order.user?.email || order.guestInfo?.email,
            address: order.shippingAddress.addressLine1,
            address2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            pincode: order.shippingAddress.postalCode
        },
        items: order.items.map(item => ({
            name: item.productSnapshot?.name || 'Product',
            sku: item.product.toString(),
            units: item.quantity,
            sellingPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: 0
        })),
        dimensions: orderData.dimensions,
        paymentMode: order.paymentInfo.method === 'cod' ? 'cod' : 'prepaid',
        subTotal: order.pricing.subtotal,
        totalDiscount: order.pricing.discount,
        totalAmount: order.pricing.total,
        charges: shipmentResult.charges || selectedOption.charges,
        estimatedDelivery: shipmentResult.estimatedDelivery
    };

    // Add method-specific data
    if (shipmentResult.method === 'shiprocket') {
        shipmentData.shiprocketOrderId = shipmentResult.shiprocketOrderId;
        shipmentData.shiprocketShipmentId = shipmentResult.shiprocketShipmentId;
        shipmentData.courierCompanyId = shipmentResult.courierCompanyId;
        shipmentData.shiprocketResponse = shipmentResult.response;
    } else if (shipmentResult.method === 'delivery_company') {
        shipmentData.deliveryCompanyId = shipmentResult.companyId;
        shipmentData.deliveryCompanyName = shipmentResult.companyName;
        shipmentData.contactInfo = shipmentResult.contact;
    }

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Update order with shipping info
    order.shipping = shipmentResult.shipmentData;
    order.status = 'processing';
    await order.save();

    res.success({
        shipment,
        trackingNumber: shipmentResult.trackingNumber,
        carrier: shipmentResult.carrier,
        method: shipmentResult.method,
        estimatedDelivery: shipmentResult.estimatedDelivery
    }, 'Shipment created successfully');
});

// Generate shipping labels
exports.generateLabels = asyncHandler(async (req, res) => {
    const { shipmentIds } = req.body;

    if (!shipmentIds || !Array.isArray(shipmentIds)) {
        return res.error('Shipment IDs are required', [], 400);
    }

    const shipments = await Shipment.find({ _id: { $in: shipmentIds } });
    const shiprocketShipmentIds = shipments
        .filter(s => s.shiprocketShipmentId)
        .map(s => s.shiprocketShipmentId);

    const labelResult = await ShiprocketService.generateLabel(shiprocketShipmentIds);

    if (!labelResult.success) {
        return res.error('Failed to generate labels', [labelResult.error], 400);
    }

    res.success({
        labelUrl: labelResult.labelUrl,
        shipmentsCount: shipments.length
    }, 'Labels generated successfully');
});

// Get shipping analytics
exports.getShippingAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchStage = { isActive: true };
    if (Object.keys(dateFilter).length > 0) {
        matchStage.createdAt = dateFilter;
    }

    const analytics = await Shipment.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalShipments: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' },
                statusBreakdown: {
                    $push: '$status'
                },
                courierBreakdown: {
                    $push: '$courierName'
                }
            }
        },
        {
            $project: {
                totalShipments: 1,
                totalAmount: 1,
                statusBreakdown: 1,
                courierBreakdown: 1
            }
        }
    ]);

    // Get status counts
    const statusCounts = await Shipment.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get courier counts
    const courierCounts = await Shipment.aggregate([
        { $match: matchStage },
        { $group: { _id: '$courierName', count: { $sum: 1 } } }
    ]);

    res.success({
        summary: analytics[0] || {
            totalShipments: 0,
            totalAmount: 0
        },
        statusBreakdown: statusCounts,
        courierBreakdown: courierCounts
    }, 'Shipping analytics retrieved successfully');
});
