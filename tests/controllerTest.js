require('dotenv').config();
const mongoose = require('mongoose');

async function testController() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test importing the controller
        console.log('🔍 Testing controller import...');
        const controller = require('../controllers/adminOrderController');
        
        console.log('Controller exports:');
        console.log('- updateOrderDeliveryMethod:', typeof controller.updateOrderDeliveryMethod);
        console.log('- getOrdersByDeliveryMethod:', typeof controller.getOrdersByDeliveryMethod);
        console.log('- getOrdersPendingDeliveryAssignment:', typeof controller.getOrdersPendingDeliveryAssignment);
        console.log('- getDeliveryMethodOptions:', typeof controller.getDeliveryMethodOptions);

        // Test the Order model within controller context
        const Order = require('../models/Order');
        console.log('\n🔍 Testing Order model in controller context...');
        console.log('Order model:', typeof Order);
        console.log('Order.find:', typeof Order.find);

        // Test a simple query
        const orders = await Order.find({}).limit(1);
        console.log(`✅ Found ${orders.length} orders`);

        await mongoose.disconnect();
        console.log('✅ Controller test completed successfully');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testController();
