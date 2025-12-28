const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // For development, use local MongoDB without authentication
        // If you have MongoDB Atlas, replace this with your connection string
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retailer-system';

        const options = {
            // Modern MongoDB connection options
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };

        const conn = await mongoose.connect(mongoURI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.log('⚠️  Server will continue without database connection for development');
        console.log('💡 To fix this:');
        console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   2. Start MongoDB service: mongod');
        console.log('   3. Or use MongoDB Atlas: https://cloud.mongodb.com/');

        // Don't exit, let the server run without DB for now
        return;
    }
};

module.exports = connectDB;
