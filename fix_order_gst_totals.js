require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function fixOrderGSTTotals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all orders
        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders to check`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;

        for (const order of orders) {
            const subtotal = order.pricing?.subtotal || 0;
            const tax = order.pricing?.tax || 0;
            const shipping = order.pricing?.shipping || 0;
            const discount = order.pricing?.discount || 0;
            
            // Calculate correct total
            const correctTotal = subtotal + tax + shipping - discount;
            const currentTotal = order.pricing?.total || 0;

            console.log(`\nOrder ${order.orderNumber || order._id}:`);
            console.log(`- Current total: ${currentTotal}`);
            console.log(`- Calculated total: ${correctTotal} (${subtotal} + ${tax} + ${shipping} - ${discount})`);

            if (Math.abs(currentTotal - correctTotal) > 0.01) { // Allow for small rounding differences
                console.log(`❌ FIXING: ${currentTotal} → ${correctTotal}`);
                
                // Update the order
                await Order.findByIdAndUpdate(
                    order._id,
                    {
                        'pricing.total': correctTotal
                    },
                    { validateBeforeSave: false }
                );
                
                fixedCount++;
            } else {
                console.log(`✅ Already correct`);
                alreadyCorrectCount++;
            }
        }

        console.log(`\n🎉 SUMMARY:`);
        console.log(`- Total orders checked: ${orders.length}`);
        console.log(`- Orders fixed: ${fixedCount}`);
        console.log(`- Orders already correct: ${alreadyCorrectCount}`);

        await mongoose.disconnect();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error fixing order totals:', error);
        process.exit(1);
    }
}

fixOrderGSTTotals();
