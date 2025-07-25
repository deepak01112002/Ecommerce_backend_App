const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    // Ticket Basic Information
    ticketNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    
    // Customer Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Ticket Details
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    
    // Ticket Category
    category: {
        type: String,
        enum: [
            'order_issue', 'payment_issue', 'shipping_issue', 'product_issue',
            'return_refund', 'account_issue', 'technical_issue', 'billing_issue',
            'complaint', 'suggestion', 'general_inquiry', 'other'
        ],
        required: true,
        index: true
    },
    
    // Priority Level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    
    // Ticket Status
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'cancelled'],
        default: 'open',
        index: true
    },
    
    // Related Entity
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['order', 'product', 'payment', 'return', 'shipment', 'invoice']
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    assignedAt: Date,
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Department
    department: {
        type: String,
        enum: ['customer_service', 'technical_support', 'billing', 'returns', 'general'],
        default: 'customer_service',
        index: true
    },
    
    // Messages/Conversation
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        senderType: {
            type: String,
            enum: ['customer', 'agent', 'system'],
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        attachments: [{
            fileName: String,
            fileUrl: String,
            fileType: String,
            fileSize: Number
        }],
        timestamp: {
            type: Date,
            default: Date.now
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: Date
    }],
    
    // Attachments
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Resolution
    resolution: {
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date,
        resolutionNotes: String,
        resolutionType: {
            type: String,
            enum: ['solved', 'workaround', 'duplicate', 'not_reproducible', 'wont_fix']
        },
        customerSatisfaction: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            feedback: String,
            ratedAt: Date
        }
    },
    
    // SLA (Service Level Agreement)
    sla: {
        responseTime: {
            expected: { type: Number, default: 24 }, // hours
            actual: Number
        },
        resolutionTime: {
            expected: { type: Number, default: 72 }, // hours
            actual: Number
        },
        isBreached: { type: Boolean, default: false },
        breachReason: String
    },
    
    // Tags
    tags: [String],
    
    // Internal Notes
    internalNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: true
        }
    }],
    
    // Escalation
    escalation: {
        isEscalated: { type: Boolean, default: false },
        escalatedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        escalatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        escalatedAt: Date,
        escalationReason: String,
        escalationLevel: {
            type: Number,
            default: 0
        }
    },
    
    // Customer Information
    customerInfo: {
        name: String,
        email: String,
        phone: String,
        preferredContactMethod: {
            type: String,
            enum: ['email', 'phone', 'chat'],
            default: 'email'
        }
    },
    
    // Dates
    firstResponseAt: Date,
    lastResponseAt: Date,
    closedAt: Date,
    
    // Metadata
    isActive: { type: Boolean, default: true },
    source: {
        type: String,
        enum: ['web', 'mobile', 'email', 'phone', 'chat'],
        default: 'web'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
supportTicketSchema.index({ ticketNumber: 1 });
supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ 'sla.isBreached': 1 });

// Virtual for formatted ticket number
supportTicketSchema.virtual('formattedTicketNumber').get(function() {
    return `TKT-${this.ticketNumber}`;
});

// Virtual for response time
supportTicketSchema.virtual('responseTime').get(function() {
    if (!this.firstResponseAt) return null;
    const diff = this.firstResponseAt - this.createdAt;
    return Math.round(diff / (1000 * 60 * 60)); // hours
});

// Virtual for resolution time
supportTicketSchema.virtual('resolutionTime').get(function() {
    if (!this.resolution.resolvedAt) return null;
    const diff = this.resolution.resolvedAt - this.createdAt;
    return Math.round(diff / (1000 * 60 * 60)); // hours
});

// Virtual for age in hours
supportTicketSchema.virtual('ageInHours').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    return Math.round(diff / (1000 * 60 * 60));
});

// Virtual for unread messages count
supportTicketSchema.virtual('unreadMessagesCount').get(function() {
    return this.messages.filter(msg => !msg.isRead && msg.senderType === 'customer').length;
});

// Pre-save middleware to generate ticket number
supportTicketSchema.pre('save', async function(next) {
    if (this.isNew && !this.ticketNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments({
            ticketNumber: new RegExp(`^${year}`)
        });
        this.ticketNumber = `${year}${String(count + 1).padStart(6, '0')}`;
    }
    
    // Update SLA breach status
    if (this.sla.responseTime.actual > this.sla.responseTime.expected ||
        (this.sla.resolutionTime.actual && this.sla.resolutionTime.actual > this.sla.resolutionTime.expected)) {
        this.sla.isBreached = true;
    }
    
    next();
});

// Static method to create ticket
supportTicketSchema.statics.createTicket = async function(ticketData) {
    const ticket = new this(ticketData);
    
    // Add initial message
    if (ticketData.initialMessage) {
        ticket.messages.push({
            sender: ticketData.user,
            senderType: 'customer',
            message: ticketData.initialMessage,
            timestamp: new Date()
        });
    }
    
    await ticket.save();
    return ticket;
};

// Static method to get ticket statistics
supportTicketSchema.statics.getTicketStatistics = async function(dateRange = {}) {
    const matchStage = { isActive: true };
    if (dateRange.startDate || dateRange.endDate) {
        matchStage.createdAt = {};
        if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate);
        if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate);
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
                inProgressTickets: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
                breachedSLA: { $sum: { $cond: ['$sla.isBreached', 1, 0] } },
                avgResponseTime: { $avg: '$sla.responseTime.actual' },
                avgResolutionTime: { $avg: '$sla.resolutionTime.actual' }
            }
        }
    ]);
    
    return stats[0] || {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        breachedSLA: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0
    };
};

// Instance method to assign ticket
supportTicketSchema.methods.assign = async function(assignedTo, assignedBy) {
    this.assignedTo = assignedTo;
    this.assignedBy = assignedBy;
    this.assignedAt = new Date();
    this.status = 'in_progress';
    
    this.messages.push({
        sender: assignedBy,
        senderType: 'system',
        message: `Ticket assigned to support agent`,
        timestamp: new Date()
    });
    
    return this.save();
};

// Instance method to add message
supportTicketSchema.methods.addMessage = async function(messageData) {
    const message = {
        sender: messageData.sender,
        senderType: messageData.senderType,
        message: messageData.message,
        attachments: messageData.attachments || [],
        timestamp: new Date()
    };
    
    this.messages.push(message);
    this.lastResponseAt = new Date();
    
    // Set first response time
    if (!this.firstResponseAt && messageData.senderType === 'agent') {
        this.firstResponseAt = new Date();
        this.sla.responseTime.actual = this.responseTime;
    }
    
    return this.save();
};

// Instance method to resolve ticket
supportTicketSchema.methods.resolve = async function(resolvedBy, resolutionData) {
    this.status = 'resolved';
    this.resolution.resolvedBy = resolvedBy;
    this.resolution.resolvedAt = new Date();
    this.resolution.resolutionNotes = resolutionData.notes;
    this.resolution.resolutionType = resolutionData.type;
    
    this.sla.resolutionTime.actual = this.resolutionTime;
    
    this.messages.push({
        sender: resolvedBy,
        senderType: 'agent',
        message: `Ticket resolved: ${resolutionData.notes}`,
        timestamp: new Date()
    });
    
    return this.save();
};

// Instance method to close ticket
supportTicketSchema.methods.close = async function(closedBy, reason = '') {
    this.status = 'closed';
    this.closedAt = new Date();
    
    this.messages.push({
        sender: closedBy,
        senderType: 'system',
        message: `Ticket closed${reason ? ': ' + reason : ''}`,
        timestamp: new Date()
    });
    
    return this.save();
};

// Instance method to escalate ticket
supportTicketSchema.methods.escalate = async function(escalatedTo, escalatedBy, reason) {
    this.escalation.isEscalated = true;
    this.escalation.escalatedTo = escalatedTo;
    this.escalation.escalatedBy = escalatedBy;
    this.escalation.escalatedAt = new Date();
    this.escalation.escalationReason = reason;
    this.escalation.escalationLevel += 1;
    this.priority = 'high';
    
    this.messages.push({
        sender: escalatedBy,
        senderType: 'system',
        message: `Ticket escalated: ${reason}`,
        timestamp: new Date()
    });
    
    return this.save();
};

// Instance method to get formatted data
supportTicketSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        ticketNumber: this.formattedTicketNumber,
        user: this.user,
        subject: this.subject,
        description: this.description,
        category: this.category,
        priority: this.priority,
        status: this.status,
        assignedTo: this.assignedTo,
        department: this.department,
        messages: this.messages,
        attachments: this.attachments,
        resolution: this.resolution,
        sla: this.sla,
        escalation: this.escalation,
        responseTime: this.responseTime,
        resolutionTime: this.resolutionTime,
        ageInHours: this.ageInHours,
        unreadMessagesCount: this.unreadMessagesCount,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
