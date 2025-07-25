const GSTConfig = require('../models/GSTConfig');
const TaxReport = require('../models/TaxReport');
const Invoice = require('../models/Invoice');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');

// Get GST configuration
exports.getGSTConfig = asyncHandler(async (req, res) => {
    const config = await GSTConfig.getCurrentConfig();
    
    res.success({
        config: {
            _id: config._id,
            gstRates: config.getActiveGSTRates(),
            hsnCodes: config.getActiveHSNCodes(),
            companyGSTDetails: config.companyGSTDetails,
            taxRules: config.taxRules,
            invoiceConfig: config.invoiceConfig,
            complianceSettings: config.complianceSettings,
            lastUpdated: config.lastUpdated
        }
    }, 'GST configuration retrieved successfully');
});

// Update GST configuration (Admin only)
exports.updateGSTConfig = asyncHandler(async (req, res) => {
    const { companyGSTDetails, taxRules, invoiceConfig, complianceSettings } = req.body;
    
    const config = await GSTConfig.getCurrentConfig();
    
    if (companyGSTDetails) {
        await config.updateCompanyDetails(companyGSTDetails);
    }
    
    if (taxRules) {
        config.taxRules = { ...config.taxRules, ...taxRules };
    }
    
    if (invoiceConfig) {
        config.invoiceConfig = { ...config.invoiceConfig, ...invoiceConfig };
    }
    
    if (complianceSettings) {
        config.complianceSettings = { ...config.complianceSettings, ...complianceSettings };
    }
    
    config.updatedBy = req.user._id;
    config.lastUpdated = new Date();
    await config.save();
    
    res.success({
        config: {
            _id: config._id,
            companyGSTDetails: config.companyGSTDetails,
            taxRules: config.taxRules,
            invoiceConfig: config.invoiceConfig,
            complianceSettings: config.complianceSettings,
            lastUpdated: config.lastUpdated
        }
    }, 'GST configuration updated successfully');
});

// Add HSN code
exports.addHSNCode = asyncHandler(async (req, res) => {
    const { code, description, gstRate, category } = req.body;
    
    const config = await GSTConfig.getCurrentConfig();
    
    try {
        await config.addHSNCode({
            code,
            description,
            gstRate,
            category,
            isActive: true
        });
        
        res.success({
            hsnCode: { code, description, gstRate, category }
        }, 'HSN code added successfully', 201);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Update HSN code
exports.updateHSNCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const updateData = req.body;
    
    const config = await GSTConfig.getCurrentConfig();
    
    try {
        await config.updateHSNCode(code, updateData);
        
        res.success({
            hsnCode: { code, ...updateData }
        }, 'HSN code updated successfully');
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Calculate GST for amount
exports.calculateGST = asyncHandler(async (req, res) => {
    const { amount, gstRate, fromState, toState } = req.body;
    
    const gstCalculation = await GSTConfig.calculateGST(amount, gstRate, fromState, toState);
    
    res.success({
        calculation: {
            baseAmount: amount,
            gstRate: gstRate,
            isInterState: fromState !== toState,
            ...gstCalculation,
            finalAmount: amount + gstCalculation.totalGST
        }
    }, 'GST calculated successfully');
});

// Generate tax report
exports.generateTaxReport = asyncHandler(async (req, res) => {
    const { reportType, month, year, quarter } = req.body;
    
    let report;
    
    try {
        switch (reportType) {
            case 'monthly_summary':
                if (!month || !year) {
                    return res.error('Month and year are required for monthly report', [], 400);
                }
                report = await TaxReport.generateMonthlyReport(month, year, req.user._id);
                break;
                
            case 'GSTR1':
                // Implementation for GSTR1 report
                report = await generateGSTR1Report(month, year, req.user._id);
                break;
                
            case 'GSTR3B':
                // Implementation for GSTR3B report
                report = await generateGSTR3BReport(month, year, req.user._id);
                break;
                
            default:
                return res.error('Invalid report type', [], 400);
        }
        
        // Validate the report
        await report.validateReport();
        
        res.success({
            report: {
                _id: report._id,
                reportType: report.reportType,
                reportPeriod: report.reportPeriod,
                salesSummary: report.salesSummary,
                taxLiability: report.taxLiability,
                validationResults: report.validationResults,
                generatedAt: report.generationDetails.generatedAt
            }
        }, 'Tax report generated successfully', 201);
    } catch (error) {
        return res.error('Failed to generate tax report', [error.message], 500);
    }
});

// Get all tax reports
exports.getTaxReports = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        reportType,
        year,
        month,
        filingStatus
    } = req.query;
    
    const query = { isActive: true };
    
    if (reportType) query.reportType = reportType;
    if (year) query['reportPeriod.year'] = parseInt(year);
    if (month) query['reportPeriod.month'] = parseInt(month);
    if (filingStatus) query['filingDetails.filingStatus'] = filingStatus;
    
    const reports = await TaxReport.find(query)
        .populate('generationDetails.generatedBy', 'firstName lastName')
        .populate('filingDetails.filedBy', 'firstName lastName')
        .sort({ 'generationDetails.generatedAt': -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await TaxReport.countDocuments(query);
    
    const formattedReports = reports.map(report => ({
        _id: report._id,
        reportType: report.reportType,
        reportPeriod: report.reportPeriod,
        salesSummary: report.salesSummary,
        taxLiability: report.taxLiability,
        filingStatus: report.filingDetails.filingStatus,
        filingDate: report.filingDetails.filingDate,
        isValid: report.validationResults.isValid,
        generatedAt: report.generationDetails.generatedAt,
        generatedBy: report.generationDetails.generatedBy
    }));
    
    res.success({
        reports: formattedReports,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Tax reports retrieved successfully');
});

// Get single tax report
exports.getTaxReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const report = await TaxReport.findById(id)
        .populate('generationDetails.generatedBy', 'firstName lastName')
        .populate('filingDetails.filedBy', 'firstName lastName');
    
    if (!report) {
        return res.error('Tax report not found', [], 404);
    }
    
    res.success({
        report: {
            _id: report._id,
            reportType: report.reportType,
            reportPeriod: report.reportPeriod,
            salesSummary: report.salesSummary,
            purchaseSummary: report.purchaseSummary,
            gstRateWiseBreakdown: report.gstRateWiseBreakdown,
            hsnWiseSummary: report.hsnWiseSummary,
            b2bSummary: report.b2bSummary,
            b2cSummary: report.b2cSummary,
            taxLiability: report.taxLiability,
            filingDetails: report.filingDetails,
            validationResults: report.validationResults,
            generationDetails: report.generationDetails,
            notes: report.notes
        }
    }, 'Tax report retrieved successfully');
});

// Export tax report to Excel
exports.exportTaxReportToExcel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const report = await TaxReport.findById(id);
    if (!report) {
        return res.error('Tax report not found', [], 404);
    }
    
    try {
        const workbook = new ExcelJS.Workbook();
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.addRow(['Tax Report Summary']);
        summarySheet.addRow(['Report Type', report.reportType]);
        summarySheet.addRow(['Period', `${report.reportPeriod.month}/${report.reportPeriod.year}`]);
        summarySheet.addRow(['Generated On', report.generationDetails.generatedAt]);
        summarySheet.addRow([]);
        
        summarySheet.addRow(['Sales Summary']);
        summarySheet.addRow(['Total Sales', report.salesSummary.totalSales]);
        summarySheet.addRow(['Taxable Sales', report.salesSummary.taxableSales]);
        summarySheet.addRow(['Total Tax Collected', report.salesSummary.totalTaxCollected]);
        summarySheet.addRow(['CGST', report.salesSummary.totalCGST]);
        summarySheet.addRow(['SGST', report.salesSummary.totalSGST]);
        summarySheet.addRow(['IGST', report.salesSummary.totalIGST]);
        
        // GST Rate-wise Sheet
        if (report.gstRateWiseBreakdown.length > 0) {
            const gstSheet = workbook.addWorksheet('GST Rate-wise');
            gstSheet.addRow(['GST Rate', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Count']);
            
            report.gstRateWiseBreakdown.forEach(item => {
                gstSheet.addRow([
                    `${item.gstRate}%`,
                    item.taxableAmount,
                    item.cgstAmount,
                    item.sgstAmount,
                    item.igstAmount,
                    item.totalTax,
                    item.invoiceCount
                ]);
            });
        }
        
        // HSN-wise Sheet
        if (report.hsnWiseSummary.length > 0) {
            const hsnSheet = workbook.addWorksheet('HSN-wise');
            hsnSheet.addRow(['HSN Code', 'Description', 'Quantity', 'Taxable Value', 'GST Rate', 'Total Tax']);
            
            report.hsnWiseSummary.forEach(item => {
                hsnSheet.addRow([
                    item.hsnCode,
                    item.description,
                    item.totalQuantity,
                    item.taxableValue,
                    `${item.gstRate}%`,
                    item.totalTax
                ]);
            });
        }
        
        // B2B Summary Sheet
        if (report.b2bSummary.length > 0) {
            const b2bSheet = workbook.addWorksheet('B2B Summary');
            b2bSheet.addRow(['Customer GSTIN', 'Customer Name', 'State', 'Invoice Count', 'Total Value', 'Total Tax']);
            
            report.b2bSummary.forEach(item => {
                b2bSheet.addRow([
                    item.customerGSTIN,
                    item.customerName,
                    item.customerState,
                    item.invoiceCount,
                    item.totalInvoiceValue,
                    item.totalTax
                ]);
            });
        }
        
        // Generate Excel buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Update export details
        report.exportDetails.excelExported = true;
        report.exportDetails.excelExportedAt = new Date();
        await report.save();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Tax-Report-${report.reportType}-${report.reportPeriod.month}-${report.reportPeriod.year}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        return res.error('Failed to export tax report', [error.message], 500);
    }
});

// Mark tax report as filed
exports.markReportAsFiled = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { acknowledgmentNumber } = req.body;
    
    const report = await TaxReport.findById(id);
    if (!report) {
        return res.error('Tax report not found', [], 404);
    }
    
    await report.markAsFiled(acknowledgmentNumber, req.user._id);
    
    res.success({
        report: {
            _id: report._id,
            filingStatus: report.filingDetails.filingStatus,
            filingDate: report.filingDetails.filingDate,
            acknowledgmentNumber: report.filingDetails.acknowledgmentNumber
        }
    }, 'Tax report marked as filed successfully');
});

// Get GST analytics
exports.getGSTAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, period = 'month' } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
        matchStage.invoiceDate = {};
        if (startDate) matchStage.invoiceDate.$gte = new Date(startDate);
        if (endDate) matchStage.invoiceDate.$lte = new Date(endDate);
    }
    
    const analytics = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalSales: { $sum: '$pricing.grandTotal' },
                totalTaxableAmount: { $sum: '$pricing.taxableAmount' },
                totalGSTCollected: { $sum: '$pricing.totalGST' },
                totalCGST: { $sum: '$pricing.totalCGST' },
                totalSGST: { $sum: '$pricing.totalSGST' },
                totalIGST: { $sum: '$pricing.totalIGST' }
            }
        }
    ]);
    
    // GST rate-wise breakdown
    const gstRateBreakdown = await Invoice.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.gstRate',
                count: { $sum: 1 },
                totalTaxableAmount: { $sum: '$items.taxableAmount' },
                totalTax: { $sum: { $add: ['$items.cgst', '$items.sgst', '$items.igst'] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    res.success({
        summary: analytics[0] || {
            totalInvoices: 0,
            totalSales: 0,
            totalTaxableAmount: 0,
            totalGSTCollected: 0,
            totalCGST: 0,
            totalSGST: 0,
            totalIGST: 0
        },
        gstRateBreakdown
    }, 'GST analytics retrieved successfully');
});

// Helper functions
async function generateGSTR1Report(month, year, generatedBy) {
    // Implementation for GSTR1 report generation
    // This would be more complex in real implementation
    return await TaxReport.generateMonthlyReport(month, year, generatedBy);
}

async function generateGSTR3BReport(month, year, generatedBy) {
    // Implementation for GSTR3B report generation
    // This would include input tax credit calculations
    return await TaxReport.generateMonthlyReport(month, year, generatedBy);
}

module.exports = exports;
