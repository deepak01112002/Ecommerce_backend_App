const mongoose = require('mongoose');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://deepak:deepak@cluster0.vfzbsjs.mongodb.net/GhanshyamBhandar?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    console.log('✅ Connected to MongoDB');
    
    try {
        // Get all products and their current stock
        const products = await Product.find({}, 'name stock isActive availability');
        console.log('\n📦 Current products and stock:');
        products.forEach(p => {
            console.log(`- ${p.name}: Stock=${p.stock}, Active=${p.isActive}, Availability=${p.availability}`);
        });
        
        // Update all products to have proper stock
        const result = await Product.updateMany(
            {},
            { 
                $set: { 
                    stock: 50,
                    isActive: true,
                    availability: 'in_stock',
                    minOrderQuantity: 1,
                    maxOrderQuantity: 10
                }
            }
        );
        
        console.log(`\n✅ Updated ${result.modifiedCount} products with stock`);
        
        // Verify the update
        const updatedProducts = await Product.find({}, 'name stock isActive availability minOrderQuantity maxOrderQuantity');
        console.log('\n📦 Updated products:');
        updatedProducts.forEach(p => {
            console.log(`- ${p.name}: Stock=${p.stock}, Active=${p.isActive}, Availability=${p.availability}, Min=${p.minOrderQuantity}, Max=${p.maxOrderQuantity}`);
        });
        
        console.log('\n🎉 Product stock update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error updating products:', error);
    } finally {
        mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
})
.catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});
