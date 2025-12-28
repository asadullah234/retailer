const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const users = [
    {
        name: 'Test User',
        email: 'test@example.com',
        phone: '3001234567',
        productName: 'Test Business',
        password: 'password123',
        role: 'user',
        isActive: true,
        emailVerified: true
    },
    {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '3009876543',
        productName: 'Admin Business',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        emailVerified: true
    }
];

async function seedUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Insert new users one by one to trigger pre-save middleware
        const insertedUsers = [];
        for (const userData of users) {
            const user = await User.create(userData);
            insertedUsers.push(user);
        }
        console.log(`Successfully seeded ${insertedUsers.length} users`);

        // Log the inserted users
        insertedUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email})`);
        });

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seeder
seedUsers();
