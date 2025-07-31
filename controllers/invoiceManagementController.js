const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const { asyncHandler } = require('../middlewares/errorHandler');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Generate invoice from order
exports.generateInvoiceFromOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { generatePDF = true, thermalFormat = false } = req.body;

    // Find the order with populated data
    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name description specifications images');

    if (!order) {
        return res.error('Order not found', [], 404);
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ order: orderId });
    
    if (!invoice) {
        // Create new invoice
        invoice = await createInvoiceFromOrder(order);
    }

    // Generate PDF if requested
    let pdfUrl = null;
    let thermalPrintUrl = null;

    if (generatePDF) {
        if (thermalFormat) {
            thermalPrintUrl = await generateThermalInvoicePDF(invoice, order);
        } else {
            pdfUrl = await generateStandardInvoicePDF(invoice, order);
        }
    }

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            orderNumber: order.orderNumber,
            customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
            total: invoice.pricing.grandTotal,
            status: invoice.status,
            createdAt: invoice.createdAt,
            pdfUrl,
            thermalPrintUrl
        }
    }, 'Invoice generated successfully');
});

// Create invoice from order data
async function createInvoiceFromOrder(order) {
    const invoiceNumber = await generateInvoiceNumber();
    
    // Calculate GST (18% for most items)
    const gstRate = 18;
    const items = order.items.map(item => {
        const product = item.product || {};
        const specifications = product.specifications || {};
        const taxableAmount = item.totalPrice || (item.unitPrice * item.quantity);
        const gstAmount = (taxableAmount * gstRate) / 100;
        
        return {
            product: item.product._id,
            name: product.name || 'Product',
            description: `${specifications.material ? `Material: ${specifications.material}, ` : ''}${specifications.height ? `Height: ${specifications.height}, ` : ''}${specifications.weight ? `Weight: ${specifications.weight}` : ''}`.trim(),
            hsnCode: '9999', // Default HSN code for handicrafts
            quantity: item.quantity,
            unit: 'PCS',
            rate: item.unitPrice,
            discount: item.discount || 0,
            taxableAmount,
            gstRate,
            cgst: gstAmount / 2, // Central GST
            sgst: gstAmount / 2, // State GST
            igst: 0, // Inter-state GST (0 for intra-state)
            totalAmount: taxableAmount + gstAmount
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalGST = items.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
    const grandTotal = subtotal + totalGST + (order.pricing?.shipping || 0);

    const invoice = new Invoice({
        invoiceNumber,
        order: order._id,
        customerDetails: {
            name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
            email: order.user?.email || '',
            phone: order.user?.phone || '',
            address: order.shippingAddress?.completeAddress || 
                    `${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.city || ''} ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postalCode || ''}`.trim(),
            gstin: '', // Customer GSTIN if available
            stateCode: '36' // Gujarat state code
        },
        companyDetails: {
            name: 'GHANSHYAM MURTI BHANDAR',
            address: 'CANAL ROAD vasudhra soc, block no 193, near jilla garden cancal road, Rajkot, GUJARAT, 360002',
            phone: '+91-9876543210',
            email: 'info@ghanshyammurtibhandar.com',
            gstin: '24BYAPD0171N1ZP',
            pan: 'BYAPD0171N',
            stateCode: '24'
        },
        items,
        pricing: {
            subtotal,
            cgst: items.reduce((sum, item) => sum + item.cgst, 0),
            sgst: items.reduce((sum, item) => sum + item.sgst, 0),
            igst: items.reduce((sum, item) => sum + item.igst, 0),
            shipping: order.pricing?.shipping || 0,
            discount: order.pricing?.discount || 0,
            grandTotal
        },
        paymentDetails: {
            method: order.paymentInfo?.method || 'COD',
            status: order.paymentInfo?.status === 'completed' ? 'paid' : 'pending',
            paidAmount: order.paymentInfo?.status === 'completed' ? grandTotal : 0,
            balanceAmount: order.paymentInfo?.status === 'completed' ? 0 : grandTotal,
            paymentDate: order.paymentInfo?.paidAt,
            transactionId: order.paymentInfo?.razorpayPaymentId || order.paymentInfo?.transactionId
        },
        taxDetails: {
            placeOfSupply: 'GUJARAT',
            isInterState: false,
            reverseCharge: false,
            taxType: 'GST'
        },
        status: 'sent',
        createdBy: null // Will be set by admin
    });

    await invoice.save();
    return invoice;
}

// Generate unique invoice number
async function generateInvoiceNumber() {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last invoice for current month
    const lastInvoice = await Invoice.findOne({
        invoiceNumber: new RegExp(`^IN-${currentYear}${currentMonth}`)
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }

    return `IN-${currentYear}${currentMonth}-${String(sequence).padStart(4, '0')}`;
}

// Generate standard A4 PDF invoice
async function generateStandardInvoicePDF(invoice, order) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `invoice-${invoice.invoiceNumber}.pdf`;
            const filepath = path.join(__dirname, '../uploads/invoices', filename);

            // Ensure directory exists
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20).text('GHANSHYAM MURTI BHANDAR', 50, 50);
            doc.fontSize(12).text('Tax Invoice/Bill of Supply/Cash Memo', 50, 80);
            doc.text('(Triplicate for Supplier)', 50, 95);

            // Company details
            doc.fontSize(10);
            doc.text('Sold By:', 50, 120);
            doc.text('GHANSHYAM MURTI BHANDAR', 50, 135);
            doc.text('CANAL ROAD vasudhra soc, block no 193, near', 50, 150);
            doc.text('jilla garden cancal road', 50, 165);
            doc.text('Rajkot, GUJARAT, 360002', 50, 180);
            doc.text('IN', 50, 195);
            doc.text('PAN No: BYAPD0171N', 50, 215);
            doc.text('GST Registration No: 24BYAPD0171N1ZP', 50, 230);

            // Customer details
            doc.text('Billing Address:', 350, 120);
            doc.text(invoice.customerDetails.name, 350, 135);
            doc.text(invoice.customerDetails.address, 350, 150, { width: 200 });
            doc.text('IN', 350, 195);
            doc.text('State/UT Code: 36', 350, 210);

            // Order details
            doc.text(`Order Number: ${order.orderNumber}`, 50, 270);
            doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 285);
            doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 270);
            doc.text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 350, 285);

            // Items table
            let yPosition = 320;
            doc.text('Sl.', 50, yPosition);
            doc.text('Description', 80, yPosition);
            doc.text('Unit Price', 250, yPosition);
            doc.text('Qty', 320, yPosition);
            doc.text('Net Amount', 350, yPosition);
            doc.text('Tax Rate', 420, yPosition);
            doc.text('Tax Amount', 470, yPosition);
            doc.text('Total', 520, yPosition);

            yPosition += 20;
            invoice.items.forEach((item, index) => {
                doc.text((index + 1).toString(), 50, yPosition);
                doc.text(item.name, 80, yPosition, { width: 160 });
                doc.text(`₹${item.rate.toFixed(2)}`, 250, yPosition);
                doc.text(item.quantity.toString(), 320, yPosition);
                doc.text(`₹${item.taxableAmount.toFixed(2)}`, 350, yPosition);
                doc.text(`${item.gstRate}%`, 420, yPosition);
                doc.text(`₹${(item.cgst + item.sgst + item.igst).toFixed(2)}`, 470, yPosition);
                doc.text(`₹${item.totalAmount.toFixed(2)}`, 520, yPosition);
                yPosition += 20;
            });

            // Total
            yPosition += 10;
            doc.text('TOTAL:', 470, yPosition);
            doc.text(`₹${invoice.pricing.grandTotal.toFixed(2)}`, 520, yPosition);

            // Amount in words
            yPosition += 30;
            doc.text('Amount in Words:', 50, yPosition);
            doc.text(`Rupees ${convertNumberToWords(invoice.pricing.grandTotal)} only`, 50, yPosition + 15);

            // QR Code for Order Tracking (like Flipkart)
            yPosition += 30;
            try {
                const qrData = JSON.stringify({
                    orderNumber: order.orderNumber,
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: invoice.customerDetails.name,
                    total: invoice.pricing.grandTotal,
                    trackingUrl: `https://ghanshyammurtibhandar.com/track/${order.orderNumber}`,
                    awbCode: order.shipping?.awbCode || null,
                    companyName: 'GHANSHYAM MURTI BHANDAR'
                });

                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 120,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Convert data URL to buffer
                const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                doc.image(qrBuffer, 350, yPosition, { width: 120, height: 120 });

                doc.fontSize(8).text('Scan QR Code for Order Tracking', 350, yPosition + 125, { width: 120, align: 'center' });

            } catch (qrError) {
                console.error('QR Code generation failed:', qrError);
            }

            // Footer
            yPosition += 60;
            doc.text('For GHANSHYAM MURTI BHANDAR:', 50, yPosition);
            doc.text('Authorized Signatory', 50, yPosition + 40);

            doc.text('Whether tax is payable under reverse charge - No', 50, yPosition + 20);

            doc.end();

            doc.on('end', () => {
                resolve(`/uploads/invoices/${filename}`);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Generate thermal printer format PDF (4x6 inch)
async function generateThermalInvoicePDF(invoice, order) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [288, 432], // 4x6 inches in points
                margin: 10
            });
            const filename = `thermal-invoice-${invoice.invoiceNumber}.pdf`;
            const filepath = path.join(__dirname, '../uploads/invoices/thermal', filename);

            // Ensure directory exists
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(12).text('GHANSHYAM MURTI BHANDAR', 10, 10, { align: 'center' });
            doc.fontSize(8).text('Tax Invoice/Bill of Supply', 10, 25, { align: 'center' });

            // Order details
            doc.fontSize(7);
            doc.text(`Order: ${order.orderNumber}`, 10, 45);
            doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 10, 55);
            doc.text(`Invoice: ${invoice.invoiceNumber}`, 10, 65);

            // Customer
            doc.text(`Customer: ${invoice.customerDetails.name}`, 10, 80);
            doc.text(`Phone: ${invoice.customerDetails.phone}`, 10, 90);

            // Items
            let yPos = 110;
            doc.text('Items:', 10, yPos);
            yPos += 10;

            invoice.items.forEach((item, index) => {
                doc.text(`${index + 1}. ${item.name}`, 10, yPos);
                yPos += 8;
                doc.text(`   Qty: ${item.quantity} x ₹${item.rate} = ₹${item.totalAmount.toFixed(2)}`, 10, yPos);
                yPos += 12;
            });

            // Total
            yPos += 10;
            doc.text(`Total: ₹${invoice.pricing.grandTotal.toFixed(2)}`, 10, yPos);
            doc.text(`Payment: ${invoice.paymentDetails.method.toUpperCase()}`, 10, yPos + 10);

            // QR Code for Order Tracking (like Flipkart)
            yPos += 30;
            try {
                const qrData = JSON.stringify({
                    orderNumber: order.orderNumber,
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: invoice.customerDetails.name,
                    total: invoice.pricing.grandTotal,
                    trackingUrl: `https://ghanshyammurtibhandar.com/track/${order.orderNumber}`,
                    awbCode: order.shipping?.awbCode || null
                });

                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 80,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Convert data URL to buffer
                const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                doc.image(qrBuffer, 104, yPos, { width: 80, height: 80 }); // Center the QR code

                yPos += 85;
                doc.fontSize(6).text('Scan QR for Order Tracking', 10, yPos, { align: 'center' });

            } catch (qrError) {
                console.error('QR Code generation failed:', qrError);
                // Fallback to text barcode
                doc.fontSize(16).text(`*${order.orderNumber}*`, 10, yPos, { align: 'center' });
            }

            if (order.shipping?.awbCode) {
                doc.fontSize(8).text(`AWB: ${order.shipping.awbCode}`, 10, yPos + 15, { align: 'center' });
            }

            doc.end();

            doc.on('end', () => {
                resolve(`/uploads/invoices/thermal/${filename}`);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to convert number to words
function convertNumberToWords(num) {
    if (num === 0) return "Zero";
    
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function convertHundreds(n) {
        let result = "";
        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        } else if (n >= 10) {
            result += teens[n - 10] + " ";
            return result;
        }
        if (n > 0) {
            result += ones[n] + " ";
        }
        return result;
    }
    
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const hundreds = num % 1000;
    
    let result = "";
    if (crores > 0) result += convertHundreds(crores) + "Crore ";
    if (lakhs > 0) result += convertHundreds(lakhs) + "Lakh ";
    if (thousands > 0) result += convertHundreds(thousands) + "Thousand ";
    if (hundreds > 0) result += convertHundreds(hundreds);
    
    return result.trim();
}

// Get all invoices (admin)
exports.getAllInvoices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (search) {
        filter.$or = [
            { invoiceNumber: new RegExp(search, 'i') },
            { 'customerDetails.name': new RegExp(search, 'i') },
            { 'customerDetails.email': new RegExp(search, 'i') }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await Invoice.find(filter)
        .populate('order', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.success({
        invoices: invoices.map(invoice => ({
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            orderNumber: invoice.order?.orderNumber,
            customerName: invoice.customerDetails.name,
            total: invoice.pricing.grandTotal,
            status: invoice.status,
            paymentStatus: invoice.paymentDetails.status,
            createdAt: invoice.createdAt,
            pdfUrl: invoice.pdfUrl,
            thermalPrintUrl: invoice.thermalPrintUrl
        })),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNextPage: skip + invoices.length < total,
            hasPrevPage: parseInt(page) > 1
        }
    }, 'Invoices retrieved successfully');
});

// Get single invoice
exports.getInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const invoice = await Invoice.findById(id)
        .populate('order', 'orderNumber items shippingAddress')
        .populate('order.items.product', 'name specifications');

    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            order: invoice.order,
            customerDetails: invoice.customerDetails,
            companyDetails: invoice.companyDetails,
            items: invoice.items,
            pricing: invoice.pricing,
            paymentDetails: invoice.paymentDetails,
            taxDetails: invoice.taxDetails,
            status: invoice.status,
            createdAt: invoice.createdAt,
            pdfUrl: invoice.pdfUrl,
            thermalPrintUrl: invoice.thermalPrintUrl
        }
    }, 'Invoice retrieved successfully');
});

module.exports = exports;
