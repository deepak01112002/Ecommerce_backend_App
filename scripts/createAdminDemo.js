const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const colors = require('colors');

// Demo admin credentials
const DEMO_ADMIN = {
  firstName: 'Admin',
  lastName: 'Demo',
  email: 'admin@demo.com',
  password: 'Admin@123456',
  phone: '+91-9999999999',
  role: 'admin',
  isEmailVerified: true,
  isActive: true
};

const SUPER_ADMIN = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'superadmin@demo.com',
  password: 'SuperAdmin@123456',
  phone: '+91-8888888888',
  role: 'admin',
  isEmailVerified: true,
  isActive: true
};

const DEMO_USER = {
  firstName: 'Demo',
  lastName: 'Customer',
  email: 'customer@demo.com',
  password: 'Customer@123456',
  phone: '+91-7777777777',
  role: 'user',
  isEmailVerified: true,
  isActive: true
};

async function createDemoCredentials() {
  try {
    console.log('🔐 Creating Demo Admin Credentials'.cyan.bold);
    console.log('=' .repeat(50).gray);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_ecommerce');
    console.log('✅ Connected to MongoDB'.green);

    // Create Demo Admin
    const existingAdmin = await User.findOne({ email: DEMO_ADMIN.email });
    if (existingAdmin) {
      console.log('⚠️  Demo Admin already exists'.yellow);
    } else {
      const hashedPassword = await bcrypt.hash(DEMO_ADMIN.password, 12);
      const adminUser = new User({
        ...DEMO_ADMIN,
        password: hashedPassword
      });
      
      // Create wallet for admin
      const wallet = new Wallet({
        user: adminUser._id,
        balance: 0
      });
      await wallet.save();
      adminUser.wallet = wallet._id;
      
      await adminUser.save();
      console.log('✅ Demo Admin created successfully'.green);
      console.log(`   Email: ${DEMO_ADMIN.email}`.cyan);
      console.log(`   Password: ${DEMO_ADMIN.password}`.cyan);
    }

    // Create Super Admin
    const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN.email });
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists'.yellow);
    } else {
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12);
      const superAdminUser = new User({
        ...SUPER_ADMIN,
        password: hashedPassword
      });
      
      // Create wallet for super admin
      const wallet = new Wallet({
        user: superAdminUser._id,
        balance: 0
      });
      await wallet.save();
      superAdminUser.wallet = wallet._id;
      
      await superAdminUser.save();
      console.log('✅ Super Admin created successfully'.green);
      console.log(`   Email: ${SUPER_ADMIN.email}`.cyan);
      console.log(`   Password: ${SUPER_ADMIN.password}`.cyan);
    }

    // Create Demo Customer
    const existingCustomer = await User.findOne({ email: DEMO_USER.email });
    if (existingCustomer) {
      console.log('⚠️  Demo Customer already exists'.yellow);
    } else {
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12);
      const customerUser = new User({
        ...DEMO_USER,
        password: hashedPassword
      });
      
      // Create wallet for customer with some balance
      const wallet = new Wallet({
        user: customerUser._id,
        balance: 5000 // Demo balance
      });
      await wallet.save();
      customerUser.wallet = wallet._id;
      
      await customerUser.save();
      console.log('✅ Demo Customer created successfully'.green);
      console.log(`   Email: ${DEMO_USER.email}`.cyan);
      console.log(`   Password: ${DEMO_USER.password}`.cyan);
    }

    console.log('\n🎯 DEMO CREDENTIALS SUMMARY'.rainbow.bold);
    console.log('=' .repeat(50).gray);
    console.log('👨‍💼 ADMIN CREDENTIALS:'.green.bold);
    console.log(`   Email: ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}`);
    console.log(`   Role: Admin`);
    
    console.log('\n🔑 SUPER ADMIN CREDENTIALS:'.blue.bold);
    console.log(`   Email: ${SUPER_ADMIN.email}`);
    console.log(`   Password: ${SUPER_ADMIN.password}`);
    console.log(`   Role: Super Admin`);
    
    console.log('\n👤 CUSTOMER CREDENTIALS:'.yellow.bold);
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log(`   Role: Customer`);
    console.log(`   Wallet Balance: ₹5,000`);

    console.log('\n🚀 Ready for Testing!'.green.bold);
    console.log('Use these credentials to test the admin panel and APIs.'.gray);

  } catch (error) {
    console.error('❌ Error creating demo credentials:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB'.green);
  }
}

// Run the script
if (require.main === module) {
  createDemoCredentials();
}

module.exports = { createDemoCredentials };
