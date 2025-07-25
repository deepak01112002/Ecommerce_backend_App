const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');

// Create support ticket
exports.createTicket = asyncHandler(async (req, res) => {
    const {
        subject,
        description,
        category,
        priority = 'medium',
        relatedEntity,
        attachments = []
    } = req.body;
    
    const ticketData = {
        user: req.user._id,
        subject,
        description,
        category,
        priority,
        relatedEntity,
        attachments,
        customerInfo: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
            phone: req.user.phone
        },
        initialMessage: description
    };
    
    const ticket = await SupportTicket.createTicket(ticketData);
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Support ticket created successfully', 201);
});

// Get user tickets
exports.getUserTickets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        category
    } = req.query;
    
    const query = { user: req.user._id, isActive: true };
    if (status) query.status = status;
    if (category) query.category = category;
    
    const tickets = await SupportTicket.find(query)
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await SupportTicket.countDocuments(query);
    
    res.success({
        tickets: tickets.map(ticket => ticket.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'User tickets retrieved successfully');
});

// Get single ticket
exports.getTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const ticket = await SupportTicket.findOne({
        _id: id,
        user: req.user._id,
        isActive: true
    })
    .populate('assignedTo', 'firstName lastName')
    .populate('messages.sender', 'firstName lastName')
    .populate('resolution.resolvedBy', 'firstName lastName');
    
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    // Mark messages as read
    ticket.messages.forEach(message => {
        if (message.senderType === 'agent' && !message.isRead) {
            message.isRead = true;
            message.readAt = new Date();
        }
    });
    await ticket.save();
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Ticket retrieved successfully');
});

// Add message to ticket
exports.addMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;
    
    const ticket = await SupportTicket.findOne({
        _id: id,
        user: req.user._id,
        isActive: true
    });
    
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    if (ticket.status === 'closed') {
        return res.error('Cannot add message to closed ticket', [], 400);
    }
    
    await ticket.addMessage({
        sender: req.user._id,
        senderType: 'customer',
        message,
        attachments
    });
    
    // Update ticket status if it was resolved
    if (ticket.status === 'resolved') {
        ticket.status = 'open';
        await ticket.save();
    }
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Message added successfully');
});

// Admin: Get all tickets
exports.getAllTickets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        category,
        priority,
        assignedTo,
        startDate,
        endDate,
        search
    } = req.query;
    
    const query = { isActive: true };
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
        query.$or = [
            { ticketNumber: new RegExp(search, 'i') },
            { subject: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ];
    }
    
    const tickets = await SupportTicket.find(query)
        .populate('user', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await SupportTicket.countDocuments(query);
    
    res.success({
        tickets: tickets.map(ticket => ticket.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'All tickets retrieved successfully');
});

// Admin: Assign ticket
exports.assignTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    await ticket.assign(assignedTo, req.user._id);
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Ticket assigned successfully');
});

// Admin: Add agent message
exports.addAgentMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, attachments = [] } = req.body;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    await ticket.addMessage({
        sender: req.user._id,
        senderType: 'agent',
        message,
        attachments
    });
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Agent message added successfully');
});

// Admin: Resolve ticket
exports.resolveTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes, type = 'solved' } = req.body;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    await ticket.resolve(req.user._id, { notes, type });
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Ticket resolved successfully');
});

// Admin: Close ticket
exports.closeTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    await ticket.close(req.user._id, reason);
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Ticket closed successfully');
});

// Admin: Escalate ticket
exports.escalateTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { escalatedTo, reason } = req.body;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
        return res.error('Ticket not found', [], 404);
    }
    
    await ticket.escalate(escalatedTo, req.user._id, reason);
    
    res.success({
        ticket: ticket.getFormattedData()
    }, 'Ticket escalated successfully');
});

// Admin: Get ticket statistics
exports.getTicketStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const stats = await SupportTicket.getTicketStatistics({ startDate, endDate });
    
    // Additional analytics
    const categoryDistribution = await SupportTicket.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    const priorityDistribution = await SupportTicket.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    const agentPerformance = await SupportTicket.aggregate([
        { $match: { isActive: true, assignedTo: { $exists: true } } },
        {
            $lookup: {
                from: 'users',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'agent'
            }
        },
        { $unwind: '$agent' },
        {
            $group: {
                _id: '$assignedTo',
                agentName: { $first: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] } },
                totalTickets: { $sum: 1 },
                resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                avgResponseTime: { $avg: '$sla.responseTime.actual' }
            }
        },
        { $sort: { totalTickets: -1 } }
    ]);
    
    res.success({
        statistics: {
            ...stats,
            categoryDistribution,
            priorityDistribution,
            agentPerformance
        }
    }, 'Ticket statistics retrieved successfully');
});

// Admin: Get support dashboard
exports.getSupportDashboard = asyncHandler(async (req, res) => {
    const stats = await SupportTicket.getTicketStatistics();
    
    // Recent tickets
    const recentTickets = await SupportTicket.find({ isActive: true })
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
    
    // Overdue tickets
    const overdueTickets = await SupportTicket.find({
        isActive: true,
        status: { $in: ['open', 'in_progress'] },
        'sla.isBreached': true
    }).countDocuments();
    
    // Unassigned tickets
    const unassignedTickets = await SupportTicket.find({
        isActive: true,
        status: 'open',
        assignedTo: { $exists: false }
    }).countDocuments();
    
    res.success({
        dashboard: {
            statistics: stats,
            recentTickets: recentTickets.map(ticket => ticket.getFormattedData()),
            overdueTickets,
            unassignedTickets
        }
    }, 'Support dashboard retrieved successfully');
});

module.exports = exports;
