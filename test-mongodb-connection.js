const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB Atlas connection...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/.*:.*@/, '//[HIDDEN]@'));
    
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    // Test connection with increased timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      bufferCommands: false,
      maxPoolSize: 5
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📁 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`📊 Ready state: ${mongoose.connection.readyState}`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.collections();
    console.log(`📋 Existing collections: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n🔍 Troubleshooting suggestions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas IP whitelist includes your current IP');
      console.log('3. Check if your firewall is blocking connections to port 27017');
      console.log('4. Verify your MongoDB Atlas cluster is running');
      console.log('5. Check your MongoDB Atlas credentials');
    }
    
    process.exit(1);
  }
}

testConnection();
