const mongoose = require('mongoose');
const Order = require('./models/Order');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testExistingOrderGST() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🧪 TESTING EXISTING ORDER GST DATA');
        console.log('====================================\n');

        // Test 1: Check if there are any existing orders
        console.log('1️⃣ Checking for existing orders...');
        const existingOrders = await Order.find({}).limit(5);
        
        if (existingOrders.length === 0) {
            console.log('❌ No existing orders found in database');
            return;
        }

        console.log(`   📋 Found ${existingOrders.length} existing orders`);

        // Test 2: Check the first order for GST data
        const firstOrder = existingOrders[0];
        console.log('\n2️⃣ Checking first order GST data...');
        console.log(`   📦 Order Number: ${firstOrder.orderNumber || firstOrder._id}`);
        console.log(`   📅 Created: ${firstOrder.createdAt}`);
        console.log(`   👤 User: ${firstOrder.user}`);
        console.log(`   📦 Items: ${firstOrder.items.length}`);
        console.log(`   💰 Subtotal: ₹${firstOrder.pricing?.subtotal || 'Not set'}`);
        console.log(`   🧾 Tax: ₹${firstOrder.pricing?.tax || 'Not set'}`);
        console.log(`   📊 Total: ₹${firstOrder.pricing?.total || 'Not set'}`);

        // Test 3: Check each item for GST fields
        console.log('\n3️⃣ Checking order items for GST fields...');
        firstOrder.items.forEach((item, index) => {
            console.log(`   📦 Item ${index + 1}: ${item.productSnapshot?.name || 'Unknown'}`);
            console.log(`     - Price: ₹${item.unitPrice || 'Not set'}`);
            console.log(`     - Quantity: ${item.quantity || 'Not set'}`);
            console.log(`     - Total: ₹${item.totalPrice || 'Not set'}`);
            console.log(`     - Tax Rate: ${item.taxRate || 'Not set'}%`);
            console.log(`     - Tax Amount: ₹${item.tax || 'Not set'}`);
            console.log(`     - HSN Code: ${item.productSnapshot?.hsnCode || 'Not set'}`);
            console.log(`     - Product GST Rate: ${item.productSnapshot?.gstRate || 'Not set'}%`);
            
            // Check if taxRate is missing
            if (!item.taxRate) {
                console.log(`     ⚠️ WARNING: taxRate field is missing!`);
            }
            
            // Check if tax is missing
            if (!item.tax) {
                console.log(`     ⚠️ WARNING: tax field is missing!`);
            }
        });

        // Test 4: Check if the order has the correct GST calculation
        console.log('\n4️⃣ Verifying GST calculations...');
        let expectedTax = 0;
        let actualTax = firstOrder.pricing?.tax || 0;
        
        firstOrder.items.forEach((item, index) => {
            if (item.taxRate && item.totalPrice) {
                const itemTax = item.totalPrice * (item.taxRate / 100);
                expectedTax += itemTax;
                console.log(`   Item ${index + 1}: ₹${item.totalPrice} × ${item.taxRate}% = ₹${itemTax.toFixed(2)}`);
            } else {
                console.log(`   Item ${index + 1}: Cannot calculate tax - missing data`);
            }
        });
        
        console.log(`   Expected Total Tax: ₹${expectedTax.toFixed(2)}`);
        console.log(`   Actual Total Tax: ₹${actualTax.toFixed(2)}`);
        
        if (Math.abs(expectedTax - actualTax) < 0.01) {
            console.log('   ✅ GST calculations are accurate');
        } else {
            console.log('   ⚠️ GST calculation mismatch');
        }

        // Test 5: Check order schema to see what fields are available
        console.log('\n5️⃣ Checking order schema fields...');
        const orderSchema = Order.schema.obj;
        console.log('   Available fields in order schema:');
        Object.keys(orderSchema).forEach(field => {
            console.log(`     - ${field}: ${typeof orderSchema[field]}`);
        });

        // Test 6: Check if there are any orders with proper GST data
        console.log('\n6️⃣ Looking for orders with proper GST data...');
        const ordersWithGST = await Order.find({
            'items.taxRate': { $exists: true, $ne: null }
        }).limit(3);
        
        if (ordersWithGST.length > 0) {
            console.log(`   ✅ Found ${ordersWithGST.length} orders with taxRate field`);
            ordersWithGST.forEach((order, index) => {
                console.log(`     Order ${index + 1}: ${order.orderNumber || order._id}`);
                order.items.forEach((item, itemIndex) => {
                    if (item.taxRate) {
                        console.log(`       Item ${itemIndex + 1}: ${item.productSnapshot?.name} - GST: ${item.taxRate}%`);
                    }
                });
            });
        } else {
            console.log('   ❌ No orders found with taxRate field');
        }

        // Test 7: Check if there are any orders with tax field
        console.log('\n7️⃣ Looking for orders with tax field...');
        const ordersWithTax = await Order.find({
            'items.tax': { $exists: true, $ne: null }
        }).limit(3);
        
        if (ordersWithTax.length > 0) {
            console.log(`   ✅ Found ${ordersWithTax.length} orders with tax field`);
            ordersWithTax.forEach((order, index) => {
                console.log(`     Order ${index + 1}: ${order.orderNumber || order._id}`);
                order.items.forEach((item, itemIndex) => {
                    if (item.tax) {
                        console.log(`       Item ${itemIndex + 1}: ${item.productSnapshot?.name} - Tax: ₹${item.tax}`);
                    }
                });
            });
        } else {
            console.log('   ❌ No orders found with tax field');
        }

        console.log('\n🎉 EXISTING ORDER GST TEST COMPLETED!');
        console.log('\n📋 SUMMARY:');
        if (ordersWithGST.length > 0) {
            console.log('   ✅ Some orders have proper GST data');
        } else {
            console.log('   ❌ No orders have proper GST data');
        }
        
        if (ordersWithTax.length > 0) {
            console.log('   ✅ Some orders have tax amounts');
        } else {
            console.log('   ❌ No orders have tax amounts');
        }

    } catch (error) {
        console.error('❌ Error testing existing order GST:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the test
if (require.main === module) {
    testExistingOrderGST()
        .then(() => {
            console.log('\n🚀 Existing order GST test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Existing order GST test failed:', error);
            process.exit(1);
        });
}

module.exports = { testExistingOrderGST };
