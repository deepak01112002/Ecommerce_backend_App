require('dotenv').config();
const mongoose = require('mongoose');

async function debugOrderModel() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test direct Order model import
        console.log('\n🔍 Testing Order model import...');
        const Order = require('../models/Order');
        console.log('Order model type:', typeof Order);
        console.log('Order.find type:', typeof Order.find);
        console.log('Order.findById type:', typeof Order.findById);

        // Test the controller import
        console.log('\n🔍 Testing controller import...');
        const controller = require('../controllers/adminDeliveryController');
        console.log('Controller type:', typeof controller);
        console.log('Available functions:', Object.keys(controller));

        // Test a simple query
        console.log('\n🔍 Testing Order query...');
        const orders = await Order.find({}).limit(1);
        console.log(`Found ${orders.length} orders`);

        if (orders.length > 0) {
            console.log('Sample order ID:', orders[0]._id);
            console.log('Sample order status:', orders[0].status);
        }

        // Test the specific function that's failing
        console.log('\n🔍 Testing getOrdersByDeliveryMethod function...');
        const mockReq = {
            query: { deliveryMethod: 'manual', page: 1, limit: 20 }
        };
        const mockRes = {
            success: (data, message) => {
                console.log('✅ Function executed successfully');
                console.log('Data keys:', Object.keys(data));
                console.log('Message:', message);
            },
            error: (message, code) => {
                console.log('❌ Function returned error:', message, code);
            }
        };

        try {
            await controller.getOrdersByDeliveryMethod(mockReq, mockRes, () => {});
        } catch (error) {
            console.log('❌ Function threw error:', error.message);
            console.log('Stack:', error.stack);
        }

        await mongoose.disconnect();
        console.log('\n✅ Debug completed');
    } catch (error) {
        console.error('❌ Debug error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

debugOrderModel();
