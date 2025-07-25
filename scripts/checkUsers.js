const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_ecommerce');
    console.log('Connected to MongoDB');

    // Check if demo admin exists
    const demoAdmin = await User.findOne({ email: 'admin@demo.com' });
    console.log('Demo Admin:', demoAdmin ? 'EXISTS' : 'NOT FOUND');
    
    if (demoAdmin) {
      console.log('Demo Admin Details:');
      console.log('- Email:', demoAdmin.email);
      console.log('- Role:', demoAdmin.role);
      console.log('- Active:', demoAdmin.isActive);
      console.log('- Email Verified:', demoAdmin.isEmailVerified);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('Admin@123456', demoAdmin.password);
      console.log('- Password Valid:', isPasswordValid);
    }

    // Check existing admin
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    console.log('\nExisting Admin:', existingAdmin ? 'EXISTS' : 'NOT FOUND');
    
    if (existingAdmin) {
      console.log('Existing Admin Details:');
      console.log('- Email:', existingAdmin.email);
      console.log('- Role:', existingAdmin.role);
      console.log('- Active:', existingAdmin.isActive);
      console.log('- Email Verified:', existingAdmin.isEmailVerified);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('Admin@123', existingAdmin.password);
      console.log('- Password Valid (Admin@123):', isPasswordValid);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
