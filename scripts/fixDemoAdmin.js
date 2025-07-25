const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function fixDemoAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_ecommerce');
    console.log('Connected to MongoDB');

    // Update demo admin password
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    
    const result = await User.updateOne(
      { email: 'admin@demo.com' },
      { 
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true
      }
    );
    
    console.log('Demo admin updated:', result);
    
    // Test the password
    const demoAdmin = await User.findOne({ email: 'admin@demo.com' });
    const isPasswordValid = await bcrypt.compare('Admin@123456', demoAdmin.password);
    console.log('Password test:', isPasswordValid);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDemoAdmin();
