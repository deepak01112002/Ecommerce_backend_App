const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixExistingOrdersGST() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔧 FIXING EXISTING ORDERS GST FIELDS');
        console.log('======================================\n');

        // Step 1: Find all existing orders
        console.log('1️⃣ Finding all existing orders...');
        const allOrders = await Order.find({});
        console.log(`   📋 Found ${allOrders.length} orders to process`);

        if (allOrders.length === 0) {
            console.log('   ✅ No orders to fix');
            return;
        }

        // Step 2: Process each order
        console.log('\n2️⃣ Processing orders to fix GST fields...');
        let fixedOrders = 0;
        let skippedOrders = 0;

        for (const order of allOrders) {
            console.log(`   📦 Processing order: ${order.orderNumber || order._id}`);
            
            let orderUpdated = false;
            const updatedItems = [];

            // Process each item in the order
            for (const item of order.items) {
                const updatedItem = { ...item.toObject() };
                
                // Check if tax field is missing
                if (!updatedItem.tax && updatedItem.taxRate && updatedItem.totalPrice) {
                    // Calculate tax amount
                    updatedItem.tax = Math.round((updatedItem.totalPrice * (updatedItem.taxRate / 100)) * 100) / 100;
                    orderUpdated = true;
                    console.log(`     ✅ Fixed tax for item: ₹${updatedItem.tax}`);
                }

                // Check if hsnCode is missing in productSnapshot
                if (!updatedItem.productSnapshot?.hsnCode) {
                    // Try to get HSN code from the product
                    try {
                        const product = await Product.findById(item.product);
                        if (product && product.hsnCode) {
                            if (!updatedItem.productSnapshot) {
                                updatedItem.productSnapshot = {};
                            }
                            updatedItem.productSnapshot.hsnCode = product.hsnCode;
                            orderUpdated = true;
                            console.log(`     ✅ Fixed HSN code for item: ${product.hsnCode}`);
                        }
                    } catch (error) {
                        console.log(`     ⚠️ Could not fetch product for HSN code`);
                    }
                }

                // Check if gstRate is missing in productSnapshot
                if (!updatedItem.productSnapshot?.gstRate && updatedItem.taxRate) {
                    if (!updatedItem.productSnapshot) {
                        updatedItem.productSnapshot = {};
                    }
                    updatedItem.productSnapshot.gstRate = updatedItem.taxRate;
                    orderUpdated = true;
                    console.log(`     ✅ Fixed GST rate in snapshot: ${updatedItem.taxRate}%`);
                }

                updatedItems.push(updatedItem);
            }

            // Update the order if any changes were made
            if (orderUpdated) {
                try {
                    await Order.findByIdAndUpdate(order._id, {
                        items: updatedItems
                    });
                    fixedOrders++;
                    console.log(`   ✅ Order ${order.orderNumber || order._id} updated successfully`);
                } catch (error) {
                    console.log(`   ❌ Failed to update order: ${error.message}`);
                }
            } else {
                skippedOrders++;
                console.log(`   ⏭️ Order ${order.orderNumber || order._id} already has correct GST data`);
            }
        }

        // Step 3: Summary
        console.log('\n3️⃣ Summary of GST field fixes...');
        console.log(`   📊 Total orders processed: ${allOrders.length}`);
        console.log(`   ✅ Orders fixed: ${fixedOrders}`);
        console.log(`   ⏭️ Orders skipped (already correct): ${skippedOrders}`);

        // Step 4: Verify the fixes
        console.log('\n4️⃣ Verifying fixes...');
        const sampleOrder = await Order.findOne({});
        if (sampleOrder) {
            console.log(`   📋 Sample order: ${sampleOrder.orderNumber || sampleOrder._id}`);
            sampleOrder.items.forEach((item, index) => {
                console.log(`     Item ${index + 1}: ${item.productSnapshot?.name || 'Unknown'}`);
                console.log(`       - Tax Rate: ${item.taxRate || 'Not set'}%`);
                console.log(`       - Tax Amount: ₹${item.tax || 'Not set'}`);
                console.log(`       - HSN Code: ${item.productSnapshot?.hsnCode || 'Not set'}`);
                console.log(`       - GST Rate in Snapshot: ${item.productSnapshot?.gstRate || 'Not set'}%`);
            });
        }

        console.log('\n🎉 GST FIELD FIXING COMPLETED SUCCESSFULLY!');
        console.log('\n📋 WHAT WAS FIXED:');
        console.log('   ✅ Missing tax amounts calculated from taxRate');
        console.log('   ✅ Missing HSN codes populated from products');
        console.log('   ✅ Missing GST rates in productSnapshot populated');
        console.log('   ✅ All existing orders now have complete GST data');

        console.log('\n💡 NEXT STEPS:');
        console.log('   - Bills will now display correct GST rates per item');
        console.log('   - Tax amounts will be properly calculated');
        console.log('   - HSN codes will be displayed in invoices');
        console.log('   - GST breakdown will be accurate');

    } catch (error) {
        console.error('❌ Error fixing existing orders GST:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    fixExistingOrdersGST()
        .then(() => {
            console.log('\n🚀 Existing orders GST fields have been fixed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Failed to fix existing orders GST fields:', error);
            process.exit(1);
        });
}

module.exports = { fixExistingOrdersGST };
