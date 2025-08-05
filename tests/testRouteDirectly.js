require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { responseMiddleware } = require('../middlewares/responseMiddleware');

async function testRouteDirectly() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Create a minimal Express app to test the route
        const app = express();
        app.use(express.json());
        app.use(responseMiddleware);

        // Import and test the controller directly
        const controller = require('../controllers/adminDeliveryController');
        
        // Create a test route
        app.get('/test-delivery-orders', controller.getOrdersByDeliveryMethod);

        // Start server
        const server = app.listen(3001, () => {
            console.log('✅ Test server running on port 3001');
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test the route
        const fetch = (await import('node-fetch')).default;
        
        console.log('\n🔍 Testing route directly...');
        const response = await fetch('http://localhost:3001/test-delivery-orders?deliveryMethod=manual');
        const result = await response.json();

        console.log('Response status:', response.status);
        console.log('Response success:', response.ok);
        console.log('Response data keys:', Object.keys(result));
        
        if (result.success) {
            console.log('✅ Route test successful!');
            console.log('Orders found:', result.data?.orders?.length || 0);
            console.log('Stats found:', result.data?.stats?.length || 0);
        } else {
            console.log('❌ Route test failed:', result.message);
        }

        // Close server
        server.close();
        await mongoose.disconnect();
        console.log('\n✅ Test completed');
    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testRouteDirectly();
