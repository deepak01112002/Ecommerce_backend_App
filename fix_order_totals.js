require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');

async function fixOrderTotals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all orders with zero totals
        const orders = await Order.find({
            $or: [
                { 'pricing.total': { $in: [0, null, undefined] } },
                { total: { $in: [0, null, undefined] } }
            ]
        }).populate('items.product', 'price name');

        console.log(`Found ${orders.length} orders with zero totals`);

        let fixedCount = 0;

        for (const order of orders) {
            console.log(`\nProcessing order: ${order.orderNumber}`);
            
            let subtotal = 0;
            let hasValidItems = false;

            // Recalculate totals from items
            for (const item of order.items) {
                let itemPrice = 0;
                let itemQuantity = item.quantity || 1;

                // Try to get price from different sources
                if (item.unitPrice && item.unitPrice > 0) {
                    itemPrice = item.unitPrice;
                    console.log(`  - Using item.unitPrice: ₹${itemPrice}`);
                } else if (item.price && item.price > 0) {
                    itemPrice = item.price;
                    console.log(`  - Using item.price: ₹${itemPrice}`);
                } else if (item.product && item.product.price && item.product.price > 0) {
                    itemPrice = item.product.price;
                    console.log(`  - Using product.price: ₹${itemPrice}`);
                } else {
                    console.log(`  - No valid price found for item: ${item.product?.name || 'Unknown'}`);
                    continue;
                }

                const itemTotal = itemPrice * itemQuantity;
                subtotal += itemTotal;
                hasValidItems = true;

                // Update item pricing
                item.unitPrice = itemPrice;
                item.totalPrice = itemTotal;
                
                console.log(`  - Item: ${item.product?.name || 'Unknown'} - Qty: ${itemQuantity} - Price: ₹${itemPrice} - Total: ₹${itemTotal}`);
            }

            if (hasValidItems && subtotal > 0) {
                // Update order pricing
                order.pricing = order.pricing || {};
                order.pricing.subtotal = subtotal;
                order.pricing.total = subtotal; // Assuming no additional charges for now

                // Update the main total field using set() to ensure it's saved
                order.set('total', subtotal);

                // Save the order (skip validation to avoid address issues)
                await order.save({ validateBeforeSave: false });
                fixedCount++;

                console.log(`  ✅ Fixed order ${order.orderNumber} - New total: ₹${subtotal}`);
            } else {
                console.log(`  ❌ Could not fix order ${order.orderNumber} - No valid pricing data`);
            }
        }

        console.log(`\n🎉 Fixed ${fixedCount} out of ${orders.length} orders`);

        // Test the fix by getting a sample order
        const sampleOrder = await Order.findOne({ orderNumber: 'ORD2508010010' })
            .populate('items.product', 'price name');
        
        if (sampleOrder) {
            console.log('\n📊 Sample order after fix:');
            console.log(`Order: ${sampleOrder.orderNumber}`);
            console.log(`Total: ₹${sampleOrder.total}`);
            console.log(`Pricing.total: ₹${sampleOrder.pricing?.total}`);
            console.log(`Items:`);
            sampleOrder.items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.product?.name} - Qty: ${item.quantity} - Unit: ₹${item.unitPrice} - Total: ₹${item.totalPrice}`);
            });
        }

    } catch (error) {
        console.error('Error fixing order totals:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the fix
fixOrderTotals();
