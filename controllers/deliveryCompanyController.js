const DeliveryCompany = require('../models/DeliveryCompany');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all delivery companies (Admin)
exports.getAllDeliveryCompanies = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        status, 
        type,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { 'contactInfo.companyEmail': { $regex: search, $options: 'i' } }
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const companies = await DeliveryCompany.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

    const total = await DeliveryCompany.countDocuments(query);

    // Calculate stats
    const stats = await DeliveryCompany.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
                totalOrders: { $sum: '$performance.totalOrders' },
                avgRating: { $avg: '$performance.rating' }
            }
        }
    ]);

    res.success({
        companies,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
        },
        stats: stats[0] || {
            total: 0,
            active: 0,
            pending: 0,
            totalOrders: 0,
            avgRating: 0
        }
    }, 'Delivery companies retrieved successfully');
});

// Get single delivery company
exports.getDeliveryCompany = asyncHandler(async (req, res) => {
    const company = await DeliveryCompany.findById(req.params.id)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    res.success(company, 'Delivery company retrieved successfully');
});

// Create delivery company
exports.createDeliveryCompany = asyncHandler(async (req, res) => {
    const companyData = {
        ...req.body,
        createdBy: req.user._id
    };

    // Generate code if not provided
    if (!companyData.code && companyData.name) {
        companyData.code = companyData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    }

    const company = new DeliveryCompany(companyData);
    await company.save();

    res.success(company, 'Delivery company created successfully', 201);
});

// Update delivery company
exports.updateDeliveryCompany = asyncHandler(async (req, res) => {
    const company = await DeliveryCompany.findById(req.params.id);

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    const updateData = {
        ...req.body,
        updatedBy: req.user._id
    };

    Object.assign(company, updateData);
    await company.save();

    res.success(company, 'Delivery company updated successfully');
});

// Delete delivery company (soft delete)
exports.deleteDeliveryCompany = asyncHandler(async (req, res) => {
    const company = await DeliveryCompany.findById(req.params.id);

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    company.isActive = false;
    company.status = 'inactive';
    company.updatedBy = req.user._id;
    await company.save();

    res.success(null, 'Delivery company deleted successfully');
});

// Get companies by location
exports.getCompaniesByLocation = asyncHandler(async (req, res) => {
    const { state, city, postalCode } = req.query;

    if (!state && !city && !postalCode) {
        return res.error('At least one location parameter is required', [], 400);
    }

    const companies = await DeliveryCompany.findByLocation(state, city, postalCode);

    res.success(companies, 'Companies retrieved for location');
});

// Update company performance
exports.updatePerformance = asyncHandler(async (req, res) => {
    const { deliveryData } = req.body;
    const company = await DeliveryCompany.findById(req.params.id);

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    await company.updatePerformance(deliveryData);

    res.success(company, 'Performance updated successfully');
});

// Toggle company status
exports.toggleStatus = asyncHandler(async (req, res) => {
    const company = await DeliveryCompany.findById(req.params.id);

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    company.status = company.status === 'active' ? 'inactive' : 'active';
    company.updatedBy = req.user._id;
    await company.save();

    res.success(company, `Company ${company.status === 'active' ? 'activated' : 'deactivated'} successfully`);
});

// Set preferred company
exports.setPreferred = asyncHandler(async (req, res) => {
    const { isPreferred } = req.body;
    const company = await DeliveryCompany.findById(req.params.id);

    if (!company) {
        return res.error('Delivery company not found', [], 404);
    }

    company.isPreferred = isPreferred;
    company.updatedBy = req.user._id;
    await company.save();

    res.success(company, `Company ${isPreferred ? 'set as' : 'removed from'} preferred`);
});

// Get delivery options for location
exports.getDeliveryOptions = asyncHandler(async (req, res) => {
    const { state, city, postalCode, weight = 1, codAmount = 0, orderValue = 0 } = req.query;

    if (!state || !city || !postalCode) {
        return res.error('State, city, and postal code are required', [], 400);
    }

    const companies = await DeliveryCompany.findByLocation(state, city, postalCode);
    
    const options = companies.map(company => {
        const charges = company.calculateCharges(
            parseFloat(weight), 
            null, 
            parseFloat(codAmount), 
            parseFloat(orderValue)
        );
        
        return {
            id: company._id,
            name: company.name,
            code: company.code,
            type: company.type,
            charges: charges,
            estimatedDays: company.deliveryTime.estimatedDays,
            rating: company.performance.rating,
            successRate: company.successRate,
            features: company.services,
            contact: {
                phone: company.contactInfo.companyPhone,
                email: company.contactInfo.companyEmail
            }
        };
    });

    res.success({
        location: { state, city, postalCode },
        options: options,
        count: options.length
    }, 'Delivery options retrieved successfully');
});

// Bulk operations
exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { companyIds, status } = req.body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
        return res.error('Company IDs array is required', [], 400);
    }

    if (!['active', 'inactive', 'suspended', 'pending_approval'].includes(status)) {
        return res.error('Invalid status', [], 400);
    }

    const result = await DeliveryCompany.updateMany(
        { _id: { $in: companyIds } },
        { 
            status: status,
            updatedBy: req.user._id,
            updatedAt: new Date()
        }
    );

    res.success({
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
    }, `${result.modifiedCount} companies updated successfully`);
});

// Export companies data
exports.exportCompanies = asyncHandler(async (req, res) => {
    const { format = 'json' } = req.query;
    
    const companies = await DeliveryCompany.find({ isActive: true })
        .select('-__v -createdAt -updatedAt')
        .lean();

    if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(companies);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=delivery-companies.csv');
        return res.send(csv);
    }

    res.success(companies, 'Companies exported successfully');
});

// Helper function to convert to CSV
exports.convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = ['Name', 'Code', 'Type', 'Status', 'Phone', 'Email', 'City', 'State', 'Rating', 'Total Orders'];
    const rows = data.map(company => [
        company.name,
        company.code,
        company.type,
        company.status,
        company.contactInfo?.companyPhone || '',
        company.contactInfo?.companyEmail || '',
        company.address?.city || '',
        company.address?.state || '',
        company.performance?.rating || 0,
        company.performance?.totalOrders || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// Get dashboard stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await DeliveryCompany.aggregate([
        {
            $facet: {
                statusStats: [
                    { $match: { isActive: true } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                typeStats: [
                    { $match: { isActive: true, status: 'active' } },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ],
                performanceStats: [
                    { $match: { isActive: true, status: 'active' } },
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: '$performance.totalOrders' },
                            avgRating: { $avg: '$performance.rating' },
                            totalCompanies: { $sum: 1 }
                        }
                    }
                ],
                topPerformers: [
                    { $match: { isActive: true, status: 'active' } },
                    { $sort: { 'performance.rating': -1 } },
                    { $limit: 5 },
                    {
                        $project: {
                            name: 1,
                            code: 1,
                            rating: '$performance.rating',
                            totalOrders: '$performance.totalOrders',
                            successRate: 1
                        }
                    }
                ]
            }
        }
    ]);

    res.success(stats[0], 'Dashboard stats retrieved successfully');
});
