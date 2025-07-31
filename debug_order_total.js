const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');

async function debugOrderTotal() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('Connected to MongoDB');

        // Get the latest order with populated product
        const order = await Order.findOne()
            .populate('items.product', 'name price')
            .sort({createdAt: -1});

        if (!order) {
            console.log('No orders found');
            return;
        }

        console.log('\n=== ORDER DEBUG ===');
        console.log('Order ID:', order._id);
        console.log('Order Number:', order.orderNumber);
        console.log('Items count:', order.items.length);

        if (order.items.length > 0) {
            const item = order.items[0];
            console.log('\n=== ITEM DEBUG ===');
            console.log('Product populated:', !!item.product);
            console.log('Product ID:', item.product?._id);
            console.log('Product Name:', item.product?.name);
            console.log('Product Price:', item.product?.price);
            console.log('Item unitPrice:', item.unitPrice);
            console.log('Item totalPrice:', item.totalPrice);
            console.log('Item quantity:', item.quantity);

            // Test the calculation logic from the controller
            const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null) ? item.unitPrice : 
                             (item.price !== undefined && item.price !== null) ? item.price : 
                             (item.product && item.product.price !== undefined && item.product.price !== null) ? item.product.price : 0;
            const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 0;
            const totalPrice = (item.totalPrice !== undefined && item.totalPrice !== null) ? item.totalPrice : 
                              (quantity * unitPrice);

            console.log('\n=== CALCULATED VALUES ===');
            console.log('Calculated unitPrice:', unitPrice);
            console.log('Calculated quantity:', quantity);
            console.log('Calculated totalPrice:', totalPrice);
        }

        console.log('\n=== ORDER PRICING ===');
        console.log('Order pricing object:', order.pricing);
        console.log('Order total field:', order.total);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugOrderTotal();
