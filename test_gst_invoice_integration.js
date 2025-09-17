const mongoose = require('mongoose');
const Order = require('./models/Order');
const Invoice = require('./models/Invoice');
const User = require('./models/User');
const Address = require('./models/Address');

// Test script to verify GST number integration in invoice generation
async function testGSTInvoiceIntegration() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('✅ Connected to MongoDB');

        // Find an order with GST/PAN data
        const order = await Order.findOne({
            'shippingAddress.gstNumber': { $exists: true, $ne: null }
        }).populate('user');

        if (!order) {
            console.log('❌ No orders found with GST number in shipping address');
            return;
        }

        console.log('📋 Found order with GST data:');
        console.log('   Order ID:', order._id);
        console.log('   Order Number:', order.orderNumber);
        console.log('   Customer:', order.user?.firstName, order.user?.lastName);
        console.log('   GST Number:', order.shippingAddress?.gstNumber);
        console.log('   PAN Number:', order.shippingAddress?.panNumber);

        // Test invoice generation
        console.log('\n🧪 Testing invoice generation...');
        
        try {
            const invoice = await Invoice.generateFromOrder(order._id, {
                createdBy: order.user._id
            });

            console.log('✅ Invoice generated successfully:');
            console.log('   Invoice ID:', invoice._id);
            console.log('   Invoice Number:', invoice.invoiceNumber);
            console.log('   Customer GSTIN:', invoice.customerDetails.gstin);
            console.log('   Billing Address GST:', invoice.customerDetails.billingAddress?.gstNumber);
            console.log('   Shipping Address GST:', invoice.customerDetails.shippingAddress?.gstNumber);

            // Verify GST number is properly stored
            if (invoice.customerDetails.gstin === order.shippingAddress.gstNumber) {
                console.log('✅ GST number correctly stored in invoice customer details');
            } else {
                console.log('❌ GST number mismatch in invoice customer details');
            }

            // Test PDF generation (just check if it doesn't throw errors)
            console.log('\n🧪 Testing PDF generation...');
            
            // Import the PDF generation functions
            const invoiceController = require('./controllers/invoiceController');
            
            // Test standard PDF generation
            try {
                const standardPDF = await invoiceController.generateStandardPDF(invoice);
                console.log('✅ Standard PDF generation successful');
            } catch (error) {
                console.log('❌ Standard PDF generation failed:', error.message);
            }

            // Test thermal PDF generation
            try {
                const thermalPDF = await invoiceController.generateThermalPDF(invoice);
                console.log('✅ Thermal PDF generation successful');
            } catch (error) {
                console.log('❌ Thermal PDF generation failed:', error.message);
            }

            // Test 4x6 PDF generation
            try {
                const pdf4x6 = await invoiceController.generate4x6InvoicePDF(invoice);
                console.log('✅ 4x6 PDF generation successful');
            } catch (error) {
                console.log('❌ 4x6 PDF generation failed:', error.message);
            }

        } catch (error) {
            console.log('❌ Invoice generation failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testGSTInvoiceIntegration();
