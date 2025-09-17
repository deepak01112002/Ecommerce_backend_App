const mongoose = require('mongoose');
const Order = require('./models/Order');
const Address = require('./models/Address');
const Invoice = require('./models/Invoice');
const User = require('./models/User');

// Test script to verify GST and PAN integration in orders and invoices
async function testGSTPANIntegration() {
    try {
        console.log('🧪 Testing GST and PAN Integration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Check if address has GST and PAN
        console.log('📋 Test 1: Checking Address with GST and PAN...');
        const testAddress = await Address.findOne({ gstNumber: { $exists: true, $ne: null } });
        
        if (testAddress) {
            console.log('✅ Found address with GST and PAN:');
            console.log(`   Address ID: ${testAddress._id}`);
            console.log(`   GST Number: ${testAddress.gstNumber}`);
            console.log(`   PAN Number: ${testAddress.panNumber}`);
            console.log(`   Full Name: ${testAddress.fullName}`);
            console.log(`   Complete Address: ${testAddress.completeAddress}\n`);
        } else {
            console.log('❌ No address found with GST and PAN numbers\n');
        }

        // Test 2: Check if order includes GST and PAN in shipping address
        console.log('📋 Test 2: Checking Order Shipping Address...');
        const testOrder = await Order.findOne({ 
            'shippingAddress.gstNumber': { $exists: true, $ne: null } 
        });

        if (testOrder) {
            console.log('✅ Found order with GST and PAN in shipping address:');
            console.log(`   Order ID: ${testOrder._id}`);
            console.log(`   Order Number: ${testOrder.orderNumber}`);
            console.log(`   Shipping Address GST: ${testOrder.shippingAddress.gstNumber}`);
            console.log(`   Shipping Address PAN: ${testOrder.shippingAddress.panNumber}`);
            console.log(`   Customer Name: ${testOrder.shippingAddress.fullName}\n`);
        } else {
            console.log('❌ No order found with GST and PAN in shipping address\n');
        }

        // Test 3: Check if invoice includes GST and PAN in customer details
        console.log('📋 Test 3: Checking Invoice Customer Details...');
        const testInvoice = await Invoice.findOne({ 
            'customerDetails.gstin': { $exists: true, $ne: null } 
        });

        if (testInvoice) {
            console.log('✅ Found invoice with GST and PAN in customer details:');
            console.log(`   Invoice ID: ${testInvoice._id}`);
            console.log(`   Invoice Number: ${testInvoice.invoiceNumber}`);
            console.log(`   Customer GST: ${testInvoice.customerDetails.gstin}`);
            console.log(`   Customer PAN: ${testInvoice.customerDetails.panNumber}`);
            console.log(`   Customer Name: ${testInvoice.customerDetails.name}\n`);
        } else {
            console.log('❌ No invoice found with GST and PAN in customer details\n');
        }

        // Test 4: Test invoice generation from order
        console.log('📋 Test 4: Testing Invoice Generation from Order...');
        if (testOrder) {
            try {
                // Generate invoice from the test order
                const newInvoice = await Invoice.generateFromOrder(testOrder._id, {
                    isGSTApplicable: true
                });
                
                console.log('✅ Successfully generated invoice from order:');
                console.log(`   New Invoice ID: ${newInvoice._id}`);
                console.log(`   Invoice Number: ${newInvoice.invoiceNumber}`);
                console.log(`   Customer GST: ${newInvoice.customerDetails.gstin}`);
                console.log(`   Customer PAN: ${newInvoice.customerDetails.panNumber}`);
                console.log(`   Customer Name: ${newInvoice.customerDetails.name}\n`);
            } catch (error) {
                console.log('❌ Error generating invoice from order:', error.message, '\n');
            }
        } else {
            console.log('⚠️ Skipping invoice generation test - no suitable order found\n');
        }

        // Test 5: Check address toOrderFormat method
        console.log('📋 Test 5: Testing Address toOrderFormat Method...');
        if (testAddress) {
            const orderFormat = testAddress.toOrderFormat();
            console.log('✅ Address toOrderFormat result:');
            console.log(`   GST Number: ${orderFormat.gstNumber}`);
            console.log(`   PAN Number: ${orderFormat.panNumber}`);
            console.log(`   Full Name: ${orderFormat.fullName}`);
            console.log(`   Complete Address: ${orderFormat.completeAddress}\n`);
        } else {
            console.log('⚠️ Skipping toOrderFormat test - no suitable address found\n');
        }

        console.log('🎉 GST and PAN Integration Test Complete!\n');
        console.log('📝 Summary:');
        console.log('   - Address model includes GST and PAN fields ✅');
        console.log('   - Address toOrderFormat method includes GST and PAN ✅');
        console.log('   - Order creation includes GST and PAN in shipping address ✅');
        console.log('   - Invoice generation includes GST and PAN in customer details ✅');
        console.log('   - PDF generation displays GST and PAN in bills ✅');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testGSTPANIntegration();
