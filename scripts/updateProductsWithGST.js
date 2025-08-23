const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateProductsWithGST() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all products that don't have GST fields
        const productsToUpdate = await Product.find({
            $or: [
                { gstRate: { $exists: false } },
                { hsnCode: { $exists: false } },
                { taxCategory: { $exists: false } }
            ]
        });

        console.log(`📦 Found ${productsToUpdate.length} products to update with GST fields`);

        if (productsToUpdate.length === 0) {
            console.log('✅ All products already have GST fields');
            return;
        }

        // Update products with default GST values
        const updateResult = await Product.updateMany(
            {
                $or: [
                    { gstRate: { $exists: false } },
                    { hsnCode: { $exists: false } },
                    { taxCategory: { $exists: false } }
                ]
            },
            {
                $set: {
                    gstRate: 18, // Default 18% GST
                    hsnCode: '9999', // Default HSN code
                    taxCategory: 'taxable' // Default tax category
                }
            }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} products with GST fields`);

        // Verify the update
        const updatedProducts = await Product.find({
            gstRate: { $exists: true },
            hsnCode: { $exists: true },
            taxCategory: { $exists: true }
        });

        console.log(`✅ Total products with GST fields: ${updatedProducts.length}`);

        // Show sample of updated products
        const sampleProducts = await Product.find({}, 'name gstRate hsnCode taxCategory').limit(5);
        console.log('\n📋 Sample of updated products:');
        sampleProducts.forEach(product => {
            console.log(`  - ${product.name}: GST ${product.gstRate}%, HSN: ${product.hsnCode}, Category: ${product.taxCategory}`);
        });

    } catch (error) {
        console.error('❌ Error updating products with GST:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    updateProductsWithGST()
        .then(() => {
            console.log('🎉 GST update script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 GST update script failed:', error);
            process.exit(1);
        });
}

module.exports = { updateProductsWithGST };
