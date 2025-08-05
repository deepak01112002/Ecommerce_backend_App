require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function testOrderModel() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔍 Testing Order model...');
        console.log('Order model:', typeof Order);
        console.log('Order.find:', typeof Order.find);

        const orders = await Order.find({}).limit(1);
        console.log(`✅ Found ${orders.length} orders`);

        if (orders.length > 0) {
            console.log('Sample order structure:');
            console.log('- _id:', orders[0]._id);
            console.log('- orderNumber:', orders[0].orderNumber);
            console.log('- status:', orders[0].status);
            console.log('- shipping:', orders[0].shipping);
        }

        await mongoose.disconnect();
        console.log('✅ Test completed successfully');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testOrderModel();
