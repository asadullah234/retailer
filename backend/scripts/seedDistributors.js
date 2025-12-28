const mongoose = require('mongoose');
const Distributor = require('../models/Distributor');
require('dotenv').config();

const distributors = [
    {
        name: 'Lays',
        contactPerson: 'Ahmed Khan',
        phone: '03001234567',
        email: 'contact@lays.pk',
        address: {
            street: '123 Industrial Area',
            city: 'Karachi',
            state: 'Sindh',
            zipCode: '75000',
            country: 'Pakistan'
        }
    },
    {
        name: 'Shakargand Food',
        contactPerson: 'Fatima Ahmed',
        phone: '03009876543',
        email: 'info@shakargand.com',
        address: {
            street: '456 Food Street',
            city: 'Lahore',
            state: 'Punjab',
            zipCode: '54000',
            country: 'Pakistan'
        }
    },
    {
        name: 'International Food',
        contactPerson: 'Mohammed Ali',
        phone: '03005551234',
        email: 'sales@internationalfood.pk',
        address: {
            street: '789 Trade Center',
            city: 'Islamabad',
            state: 'Islamabad',
            zipCode: '44000',
            country: 'Pakistan'
        }
    },
    {
        name: 'Mugs Food',
        contactPerson: 'Sara Khan',
        phone: '03004449876',
        email: 'contact@mugsfood.com',
        address: {
            street: '321 Bakery Lane',
            city: 'Rawalpindi',
            state: 'Punjab',
            zipCode: '46000',
            country: 'Pakistan'
        }
    },
    {
        name: 'Innovative Biscuits',
        contactPerson: 'Hassan Raza',
        phone: '03007771234',
        email: 'info@innovativebiscuits.pk',
        address: {
            street: '654 Sweet Street',
            city: 'Faisalabad',
            state: 'Punjab',
            zipCode: '38000',
            country: 'Pakistan'
        }
    }
];

async function seedDistributors() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing distributors
        await Distributor.deleteMany({});
        console.log('Cleared existing distributors');

        // Insert new distributors
        const insertedDistributors = await Distributor.insertMany(distributors);
        console.log(`Successfully seeded ${insertedDistributors.length} distributors`);

        // Log the inserted distributors
        insertedDistributors.forEach(distributor => {
            console.log(`- ${distributor.name} (${distributor._id})`);
        });

    } catch (error) {
        console.error('Error seeding distributors:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seeder
seedDistributors();
