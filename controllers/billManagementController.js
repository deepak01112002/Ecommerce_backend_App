const Invoice = require('../models/Invoice');
const TaxReport = require('../models/TaxReport');
const Order = require('../models/Order');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get bill management dashboard
exports.getBillDashboard = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.invoiceDate = {};
        if (startDate) dateFilter.invoiceDate.$gte = new Date(startDate);
        if (endDate) dateFilter.invoiceDate.$lte = new Date(endDate);
    }
    
    // Get invoice statistics
    const invoiceStats = await Invoice.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                totalTaxCollected: { $sum: '$pricing.totalGST' },
                paidAmount: { $sum: '$paymentDetails.paidAmount' },
                pendingAmount: { $sum: '$paymentDetails.balanceAmount' }
            }
        }
    ]);
    
    // Payment status breakdown
    const paymentStatusBreakdown = await Invoice.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
            $group: {
                _id: '$paymentDetails.status',
                count: { $sum: 1 },
                amount: { $sum: '$pricing.grandTotal' }
            }
        }
    ]);
    
    // Monthly trend
    const monthlyTrend = await Invoice.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
            $group: {
                _id: {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' }
                },
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                totalTax: { $sum: '$pricing.totalGST' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Top customers by invoice value
    const topCustomers = await Invoice.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
            $group: {
                _id: '$customerDetails.name',
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                totalTax: { $sum: '$pricing.totalGST' }
            }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
    ]);
    
    // GST collection summary
    const gstSummary = await Invoice.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
            $group: {
                _id: null,
                totalCGST: { $sum: '$pricing.totalCGST' },
                totalSGST: { $sum: '$pricing.totalSGST' },
                totalIGST: { $sum: '$pricing.totalIGST' },
                totalGST: { $sum: '$pricing.totalGST' }
            }
        }
    ]);
    
    res.success({
        dashboard: {
            summary: invoiceStats[0] || {
                totalInvoices: 0,
                totalAmount: 0,
                totalTaxCollected: 0,
                paidAmount: 0,
                pendingAmount: 0
            },
            paymentStatusBreakdown,
            monthlyTrend,
            topCustomers,
            gstSummary: gstSummary[0] || {
                totalCGST: 0,
                totalSGST: 0,
                totalIGST: 0,
                totalGST: 0
            }
        }
    }, 'Bill management dashboard retrieved successfully');
});

// Get all bills with advanced filtering
exports.getAllBills = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
        search,
        sortBy = 'invoiceDate',
        sortOrder = 'desc',
        customerName,
        minAmount,
        maxAmount
    } = req.query;
    
    const query = { isActive: true };
    
    // Filters
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.status'] = paymentStatus;
    
    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    if (search) {
        query.$or = [
            { invoiceNumber: new RegExp(search, 'i') },
            { 'customerDetails.name': new RegExp(search, 'i') },
            { 'customerDetails.email': new RegExp(search, 'i') }
        ];
    }
    
    if (customerName) {
        query['customerDetails.name'] = new RegExp(customerName, 'i');
    }
    
    if (minAmount || maxAmount) {
        query['pricing.grandTotal'] = {};
        if (minAmount) query['pricing.grandTotal'].$gte = parseFloat(minAmount);
        if (maxAmount) query['pricing.grandTotal'].$lte = parseFloat(maxAmount);
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const bills = await Invoice.find(query)
        .populate('order', 'orderNumber status')
        .populate('user', 'firstName lastName email phone')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    const formattedBills = bills.map(bill => ({
        _id: bill._id,
        invoiceNumber: bill.formattedInvoiceNumber,
        invoiceDate: bill.invoiceDate,
        dueDate: bill.dueDate,
        orderNumber: bill.order?.orderNumber,
        customerName: bill.customerDetails.name,
        customerEmail: bill.customerDetails.email,
        customerPhone: bill.customerDetails.phone,
        customerGSTIN: bill.customerDetails.gstin,
        grandTotal: bill.pricing.grandTotal,
        taxableAmount: bill.pricing.taxableAmount,
        totalGST: bill.pricing.totalGST,
        totalCGST: bill.pricing.totalCGST,
        totalSGST: bill.pricing.totalSGST,
        totalIGST: bill.pricing.totalIGST,
        paidAmount: bill.paymentDetails.paidAmount,
        balanceAmount: bill.paymentDetails.balanceAmount,
        status: bill.status,
        paymentStatus: bill.paymentDetails.status,
        paymentMethod: bill.paymentDetails.method,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
    }));
    
    res.success({
        bills: formattedBills,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        },
        filters: {
            status,
            paymentStatus,
            startDate,
            endDate,
            search,
            customerName,
            minAmount,
            maxAmount
        }
    }, 'Bills retrieved successfully');
});

// Export bills to Excel for CA
exports.exportBillsToExcel = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        status,
        paymentStatus,
        format = 'detailed' // detailed or summary
    } = req.query;
    
    const query = { isActive: true };
    
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.status'] = paymentStatus;
    
    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    const bills = await Invoice.find(query)
        .populate('order', 'orderNumber')
        .sort({ invoiceDate: -1 });
    
    const workbook = new ExcelJS.Workbook();
    
    if (format === 'detailed') {
        // Detailed format for CA
        const worksheet = workbook.addWorksheet('Bills Detail');
        
        // Headers
        worksheet.addRow([
            'Invoice Number', 'Invoice Date', 'Due Date', 'Order Number',
            'Customer Name', 'Customer Email', 'Customer GSTIN',
            'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total GST',
            'Grand Total', 'Payment Status', 'Paid Amount', 'Balance Amount',
            'Payment Method', 'Status'
        ]);
        
        // Data rows
        bills.forEach(bill => {
            worksheet.addRow([
                bill.formattedInvoiceNumber,
                bill.invoiceDate.toLocaleDateString(),
                bill.dueDate ? bill.dueDate.toLocaleDateString() : '',
                bill.order?.orderNumber || '',
                bill.customerDetails.name,
                bill.customerDetails.email,
                bill.customerDetails.gstin || '',
                bill.pricing.taxableAmount,
                bill.pricing.totalCGST,
                bill.pricing.totalSGST,
                bill.pricing.totalIGST,
                bill.pricing.totalGST,
                bill.pricing.grandTotal,
                bill.paymentDetails.status,
                bill.paymentDetails.paidAmount,
                bill.paymentDetails.balanceAmount,
                bill.paymentDetails.method,
                bill.status
            ]);
        });
        
        // Summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        const totalAmount = bills.reduce((sum, bill) => sum + bill.pricing.grandTotal, 0);
        const totalTax = bills.reduce((sum, bill) => sum + bill.pricing.totalGST, 0);
        const totalPaid = bills.reduce((sum, bill) => sum + bill.paymentDetails.paidAmount, 0);
        const totalPending = bills.reduce((sum, bill) => sum + bill.paymentDetails.balanceAmount, 0);
        
        summarySheet.addRow(['Bills Summary Report']);
        summarySheet.addRow(['Generated On', new Date().toLocaleDateString()]);
        summarySheet.addRow(['Period', `${startDate || 'All'} to ${endDate || 'All'}`]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Total Bills', bills.length]);
        summarySheet.addRow(['Total Amount', totalAmount]);
        summarySheet.addRow(['Total Tax Collected', totalTax]);
        summarySheet.addRow(['Total Paid', totalPaid]);
        summarySheet.addRow(['Total Pending', totalPending]);
        
    } else {
        // Summary format
        const worksheet = workbook.addWorksheet('Bills Summary');
        
        worksheet.addRow([
            'Invoice Number', 'Date', 'Customer', 'Amount', 'Tax', 'Status'
        ]);
        
        bills.forEach(bill => {
            worksheet.addRow([
                bill.formattedInvoiceNumber,
                bill.invoiceDate.toLocaleDateString(),
                bill.customerDetails.name,
                bill.pricing.grandTotal,
                bill.pricing.totalGST,
                bill.paymentDetails.status
            ]);
        });
    }
    
    // Style the headers
    const worksheet = workbook.getWorksheet(1);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.width = 15;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `Bills-Export-${format}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// Get bill analytics for CA
exports.getBillAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
        matchStage.invoiceDate = {};
        if (startDate) matchStage.invoiceDate.$gte = new Date(startDate);
        if (endDate) matchStage.invoiceDate.$lte = new Date(endDate);
    }
    
    let groupStage;
    switch (groupBy) {
        case 'day':
            groupStage = {
                _id: {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' },
                    day: { $dayOfMonth: '$invoiceDate' }
                }
            };
            break;
        case 'week':
            groupStage = {
                _id: {
                    year: { $year: '$invoiceDate' },
                    week: { $week: '$invoiceDate' }
                }
            };
            break;
        case 'year':
            groupStage = {
                _id: {
                    year: { $year: '$invoiceDate' }
                }
            };
            break;
        default: // month
            groupStage = {
                _id: {
                    year: { $year: '$invoiceDate' },
                    month: { $month: '$invoiceDate' }
                }
            };
    }
    
    const analytics = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                ...groupStage,
                totalBills: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                totalTaxableAmount: { $sum: '$pricing.taxableAmount' },
                totalGST: { $sum: '$pricing.totalGST' },
                totalCGST: { $sum: '$pricing.totalCGST' },
                totalSGST: { $sum: '$pricing.totalSGST' },
                totalIGST: { $sum: '$pricing.totalIGST' },
                totalPaid: { $sum: '$paymentDetails.paidAmount' },
                totalPending: { $sum: '$paymentDetails.balanceAmount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    // Payment method breakdown
    const paymentMethodBreakdown = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$paymentDetails.method',
                count: { $sum: 1 },
                amount: { $sum: '$pricing.grandTotal' }
            }
        }
    ]);
    
    // Customer type breakdown (B2B vs B2C)
    const customerTypeBreakdown = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    $cond: {
                        if: { $ne: ['$customerDetails.gstin', null] },
                        then: 'B2B',
                        else: 'B2C'
                    }
                },
                count: { $sum: 1 },
                amount: { $sum: '$pricing.grandTotal' },
                tax: { $sum: '$pricing.totalGST' }
            }
        }
    ]);
    
    res.success({
        analytics: {
            periodWise: analytics,
            paymentMethodBreakdown,
            customerTypeBreakdown,
            summary: {
                totalBills: analytics.reduce((sum, item) => sum + item.totalBills, 0),
                totalAmount: analytics.reduce((sum, item) => sum + item.totalAmount, 0),
                totalTax: analytics.reduce((sum, item) => sum + item.totalGST, 0),
                totalPaid: analytics.reduce((sum, item) => sum + item.totalPaid, 0),
                totalPending: analytics.reduce((sum, item) => sum + item.totalPending, 0)
            }
        }
    }, 'Bill analytics retrieved successfully');
});

// Generate CA report (Comprehensive report for Chartered Accountant)
exports.generateCAReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, reportType = 'comprehensive' } = req.body;
    
    if (!startDate || !endDate) {
        return res.error('Start date and end date are required', [], 400);
    }
    
    const matchStage = {
        isActive: true,
        invoiceDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };
    
    // Get all invoices for the period
    const invoices = await Invoice.find(matchStage)
        .populate('order', 'orderNumber')
        .sort({ invoiceDate: 1 });
    
    // Generate comprehensive Excel report
    const workbook = new ExcelJS.Workbook();
    
    // 1. Invoice Register
    const invoiceRegister = workbook.addWorksheet('Invoice Register');
    invoiceRegister.addRow([
        'Sr.No', 'Invoice No', 'Invoice Date', 'Customer Name', 'GSTIN',
        'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Amount',
        'Payment Status', 'Payment Date'
    ]);
    
    invoices.forEach((invoice, index) => {
        invoiceRegister.addRow([
            index + 1,
            invoice.formattedInvoiceNumber,
            invoice.invoiceDate.toLocaleDateString(),
            invoice.customerDetails.name,
            invoice.customerDetails.gstin || 'N/A',
            invoice.pricing.taxableAmount,
            invoice.pricing.totalCGST,
            invoice.pricing.totalSGST,
            invoice.pricing.totalIGST,
            invoice.pricing.totalGST,
            invoice.pricing.grandTotal,
            invoice.paymentDetails.status,
            invoice.paymentDetails.paymentDate ? invoice.paymentDetails.paymentDate.toLocaleDateString() : ''
        ]);
    });
    
    // 2. GST Summary
    const gstSummary = workbook.addWorksheet('GST Summary');
    const gstData = invoices.reduce((acc, invoice) => {
        acc.totalSales += invoice.pricing.grandTotal;
        acc.totalTaxable += invoice.pricing.taxableAmount;
        acc.totalCGST += invoice.pricing.totalCGST;
        acc.totalSGST += invoice.pricing.totalSGST;
        acc.totalIGST += invoice.pricing.totalIGST;
        acc.totalGST += invoice.pricing.totalGST;
        return acc;
    }, {
        totalSales: 0,
        totalTaxable: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalGST: 0
    });
    
    gstSummary.addRow(['GST Summary Report']);
    gstSummary.addRow(['Period', `${startDate} to ${endDate}`]);
    gstSummary.addRow([]);
    gstSummary.addRow(['Total Sales', gstData.totalSales]);
    gstSummary.addRow(['Total Taxable Amount', gstData.totalTaxable]);
    gstSummary.addRow(['Total CGST', gstData.totalCGST]);
    gstSummary.addRow(['Total SGST', gstData.totalSGST]);
    gstSummary.addRow(['Total IGST', gstData.totalIGST]);
    gstSummary.addRow(['Total GST', gstData.totalGST]);
    
    // 3. Customer-wise Summary
    const customerSummary = workbook.addWorksheet('Customer Summary');
    const customerData = new Map();
    
    invoices.forEach(invoice => {
        const key = invoice.customerDetails.name;
        if (!customerData.has(key)) {
            customerData.set(key, {
                name: invoice.customerDetails.name,
                gstin: invoice.customerDetails.gstin,
                invoiceCount: 0,
                totalAmount: 0,
                totalTax: 0
            });
        }
        const data = customerData.get(key);
        data.invoiceCount += 1;
        data.totalAmount += invoice.pricing.grandTotal;
        data.totalTax += invoice.pricing.totalGST;
    });
    
    customerSummary.addRow(['Customer Name', 'GSTIN', 'Invoice Count', 'Total Amount', 'Total Tax']);
    Array.from(customerData.values()).forEach(customer => {
        customerSummary.addRow([
            customer.name,
            customer.gstin || 'N/A',
            customer.invoiceCount,
            customer.totalAmount,
            customer.totalTax
        ]);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `CA-Report-${startDate}-to-${endDate}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

module.exports = exports;
