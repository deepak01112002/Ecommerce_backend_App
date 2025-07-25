const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const colors = require('colors');

async function createSampleData() {
  try {
    console.log('🎯 Creating Sample Data for Testing'.cyan.bold);
    console.log('=' .repeat(50).gray);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_ecommerce');
    console.log('✅ Connected to MongoDB'.green);

    // Create Categories
    console.log('\n📁 Creating Categories...'.yellow);
    const categories = [
      {
        name: 'Electronics',
        description: 'Electronic items and gadgets',
        image: 'https://via.placeholder.com/300x200?text=Electronics',
        isActive: true
      },
      {
        name: 'Clothing',
        description: 'Fashion and clothing items',
        image: 'https://via.placeholder.com/300x200?text=Clothing',
        isActive: true
      },
      {
        name: 'Home & Garden',
        description: 'Home and garden products',
        image: 'https://via.placeholder.com/300x200?text=Home+Garden',
        isActive: true
      },
      {
        name: 'Books',
        description: 'Books and educational materials',
        image: 'https://via.placeholder.com/300x200?text=Books',
        isActive: true
      },
      {
        name: 'Sports',
        description: 'Sports and fitness equipment',
        image: 'https://via.placeholder.com/300x200?text=Sports',
        isActive: true
      }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        createdCategories.push(category);
        console.log(`  ✅ Created category: ${category.name}`.green);
      } else {
        createdCategories.push(existingCategory);
        console.log(`  ⚠️  Category already exists: ${existingCategory.name}`.yellow);
      }
    }

    // Create Products
    console.log('\n📦 Creating Products...'.yellow);
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features and powerful performance',
        price: 99999,
        originalPrice: 109999,
        category: createdCategories[0]._id, // Electronics
        stock: 50,
        images: ['https://via.placeholder.com/400x400?text=iPhone+15+Pro'],
        isActive: true,
        isFeatured: true,
        brand: 'Apple',
        sku: 'IPH15PRO001'
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Premium Android smartphone with excellent camera',
        price: 79999,
        originalPrice: 89999,
        category: createdCategories[0]._id, // Electronics
        stock: 30,
        images: ['https://via.placeholder.com/400x400?text=Galaxy+S24'],
        isActive: true,
        isFeatured: true,
        brand: 'Samsung',
        sku: 'SAM24001'
      },
      {
        name: 'MacBook Air M3',
        description: 'Lightweight laptop with M3 chip for professionals',
        price: 119999,
        originalPrice: 129999,
        category: createdCategories[0]._id, // Electronics
        stock: 25,
        images: ['https://via.placeholder.com/400x400?text=MacBook+Air'],
        isActive: true,
        brand: 'Apple',
        sku: 'MBA001'
      },
      {
        name: 'Nike Air Max',
        description: 'Comfortable running shoes for daily wear',
        price: 8999,
        originalPrice: 12999,
        category: createdCategories[1]._id, // Clothing
        stock: 100,
        images: ['https://via.placeholder.com/400x400?text=Nike+Air+Max'],
        isActive: true,
        brand: 'Nike',
        sku: 'NIKE001'
      },
      {
        name: 'Adidas T-Shirt',
        description: 'Premium cotton t-shirt for sports and casual wear',
        price: 1999,
        originalPrice: 2999,
        category: createdCategories[1]._id, // Clothing
        stock: 200,
        images: ['https://via.placeholder.com/400x400?text=Adidas+TShirt'],
        isActive: true,
        brand: 'Adidas',
        sku: 'ADI001'
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker for perfect morning brew',
        price: 15999,
        originalPrice: 19999,
        category: createdCategories[2]._id, // Home & Garden
        stock: 40,
        images: ['https://via.placeholder.com/400x400?text=Coffee+Maker'],
        isActive: true,
        brand: 'Philips',
        sku: 'PHI001'
      },
      {
        name: 'JavaScript: The Good Parts',
        description: 'Essential book for JavaScript developers',
        price: 899,
        originalPrice: 1299,
        category: createdCategories[3]._id, // Books
        stock: 75,
        images: ['https://via.placeholder.com/400x400?text=JS+Book'],
        isActive: true,
        brand: 'O\'Reilly',
        sku: 'BOOK001'
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat for fitness and meditation',
        price: 2499,
        originalPrice: 3499,
        category: createdCategories[4]._id, // Sports
        stock: 150,
        images: ['https://via.placeholder.com/400x400?text=Yoga+Mat'],
        isActive: true,
        brand: 'Decathlon',
        sku: 'YOGA001'
      },
      {
        name: 'Bluetooth Headphones',
        description: 'Wireless headphones with noise cancellation',
        price: 4999,
        originalPrice: 7999,
        category: createdCategories[0]._id, // Electronics
        stock: 80,
        images: ['https://via.placeholder.com/400x400?text=Headphones'],
        isActive: true,
        brand: 'Sony',
        sku: 'SONY001'
      },
      {
        name: 'Gaming Mouse',
        description: 'High precision gaming mouse with RGB lighting',
        price: 3499,
        originalPrice: 4999,
        category: createdCategories[0]._id, // Electronics
        stock: 60,
        images: ['https://via.placeholder.com/400x400?text=Gaming+Mouse'],
        isActive: true,
        brand: 'Logitech',
        sku: 'LOG001'
      }
    ];

    let createdProductsCount = 0;
    for (const productData of products) {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (!existingProduct) {
        const product = new Product(productData);
        await product.save();
        createdProductsCount++;
        console.log(`  ✅ Created product: ${product.name}`.green);
      } else {
        console.log(`  ⚠️  Product already exists: ${existingProduct.name}`.yellow);
      }
    }

    // Create some sample orders
    console.log('\n🛒 Creating Sample Orders...'.yellow);
    const adminUser = await User.findOne({ email: 'admin@admin.com' });
    const sampleProducts = await Product.find().limit(3);
    
    if (adminUser && sampleProducts.length > 0) {
      const sampleOrders = [
        {
          user: adminUser._id,
          orderNumber: 'ORD001',
          items: [
            {
              product: sampleProducts[0]._id,
              name: sampleProducts[0].name,
              quantity: 2,
              unitPrice: sampleProducts[0].price
            }
          ],
          pricing: {
            subtotal: sampleProducts[0].price * 2,
            tax: (sampleProducts[0].price * 2) * 0.18,
            shipping: 100,
            total: (sampleProducts[0].price * 2) + ((sampleProducts[0].price * 2) * 0.18) + 100
          },
          status: 'pending',
          paymentInfo: {
            method: 'cod',
            status: 'pending'
          }
        },
        {
          user: adminUser._id,
          orderNumber: 'ORD002',
          items: [
            {
              product: sampleProducts[1]._id,
              name: sampleProducts[1].name,
              quantity: 1,
              unitPrice: sampleProducts[1].price
            }
          ],
          pricing: {
            subtotal: sampleProducts[1].price,
            tax: sampleProducts[1].price * 0.18,
            shipping: 100,
            total: sampleProducts[1].price + (sampleProducts[1].price * 0.18) + 100
          },
          status: 'confirmed',
          paymentInfo: {
            method: 'online',
            status: 'completed'
          }
        }
      ];

      let createdOrdersCount = 0;
      for (const orderData of sampleOrders) {
        const existingOrder = await Order.findOne({ orderNumber: orderData.orderNumber });
        if (!existingOrder) {
          const order = new Order(orderData);
          await order.save();
          createdOrdersCount++;
          console.log(`  ✅ Created order: ${order.orderNumber}`.green);
        } else {
          console.log(`  ⚠️  Order already exists: ${existingOrder.orderNumber}`.yellow);
        }
      }
    }

    console.log('\n🎯 SAMPLE DATA CREATION SUMMARY'.rainbow.bold);
    console.log('=' .repeat(50).gray);
    console.log(`📁 Categories: ${createdCategories.length} total`);
    console.log(`📦 Products: ${createdProductsCount} created`);
    console.log(`🛒 Orders: Sample orders created`);
    
    console.log('\n✅ Sample data creation completed!'.green.bold);
    console.log('🎯 You can now test the admin panel with real data!'.cyan);

  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB'.green);
  }
}

// Run the script
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };
