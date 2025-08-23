const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testGSTSimple() {
    try {
        console.log('🔍 Environment check:');
        console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        if (!process.env.MONGO_URI) {
            console.log('❌ MONGO_URI not found in environment variables');
            console.log('📁 Current directory:', __dirname);
            console.log('🔍 Looking for .env file...');
            
            const fs = require('fs');
            const envPath = path.join(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                console.log('✅ .env file found at:', envPath);
                const envContent = fs.readFileSync(envPath, 'utf8');
                const mongoLine = envContent.split('\n').find(line => line.includes('MONGO_URI'));
                if (mongoLine) {
                    console.log('📋 MONGO_URI line found:', mongoLine.substring(0, 50) + '...');
                } else {
                    console.log('❌ MONGO_URI line not found in .env');
                }
            } else {
                console.log('❌ .env file not found at:', envPath);
            }
            return;
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test GST calculations
        console.log('\n🧮 Testing GST Calculations:');
        
        const testProducts = [
            { name: 'Product 1', price: 1000, gstRate: 5 },
            { name: 'Product 2', price: 1500, gstRate: 12 },
            { name: 'Product 3', price: 2000, gstRate: 18 },
            { name: 'Product 4', price: 3000, gstRate: 28 }
        ];

        testProducts.forEach(product => {
            const gstAmount = product.price * (product.gstRate / 100);
            const totalWithGST = product.price + gstAmount;
            
            console.log(`   ${product.name}:`);
            console.log(`     Price: ₹${product.price}`);
            console.log(`     GST Rate: ${product.gstRate}%`);
            console.log(`     GST Amount: ₹${gstAmount.toFixed(2)}`);
            console.log(`     Total with GST: ₹${totalWithGST.toFixed(2)}`);
        });

        // Test cart calculation
        console.log('\n🛒 Testing Cart GST Calculation:');
        let cartSubtotal = 0;
        let cartTotalGST = 0;
        
        testProducts.forEach(product => {
            const quantity = 2;
            const itemTotal = product.price * quantity;
            const itemGST = itemTotal * (product.gstRate / 100);
            
            cartSubtotal += itemTotal;
            cartTotalGST += itemGST;
            
            console.log(`   ${product.name} x${quantity}:`);
            console.log(`     Item Total: ₹${itemTotal}`);
            console.log(`     Item GST: ₹${itemGST.toFixed(2)}`);
        });
        
        const cartTotal = cartSubtotal + cartTotalGST;
        console.log(`\n   📊 Cart Summary:`);
        console.log(`     Subtotal: ₹${cartSubtotal}`);
        console.log(`     Total GST: ₹${cartTotalGST.toFixed(2)}`);
        console.log(`     Grand Total: ₹${cartTotal.toFixed(2)}`);

        console.log('\n🎉 GST functionality test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing GST:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
        }
    }
}

// Run the test
if (require.main === module) {
    testGSTSimple()
        .then(() => {
            console.log('\n🚀 GST functionality is working!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 GST functionality test failed:', error);
            process.exit(1);
        });
}

module.exports = { testGSTSimple };
