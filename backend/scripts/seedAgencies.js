const mongoose = require('mongoose');
const Distributor = require('../models/Distributor');

const agencies = [
    {
        name: 'Lays',
        contactPerson: 'Ahmed Khan',
        phone: '03001234567',
        email: 'contact@lays.pk',
        address: {
            street: '123 Food Street',
            city: 'Lahore',
            state: 'Punjab',
            country: 'Pakistan'
        },
        isActive: true
    },
    {
        name: 'Shakar Kand Foods',
        contactPerson: 'Sara Ahmed',
        phone: '03009876543',
        email: 'info@shakarkand.pk',
        address: {
            street: '456 Sweet Avenue',
            city: 'Karachi',
            state: 'Sindh',
            country: 'Pakistan'
        },
        isActive: true
    },
    {
        name: 'Mugs Foods',
        contactPerson: 'Ali Hassan',
        phone: '03005556677',
        email: 'sales@mugs.pk',
        address: {
            street: '789 Food Plaza',
            city: 'Islamabad',
            state: 'ICT',
            country: 'Pakistan'
        },
        isActive: true
    },
    {
        name: 'International Foods',
        contactPerson: 'Fatima Khan',
        phone: '03004443322',
        email: 'contact@intfoods.pk',
        address: {
            street: '321 Global Market',
            city: 'Rawalpindi',
            state: 'Punjab',
            country: 'Pakistan'
        },
        isActive: true
    },
    {
        name: 'Innovative Biscuits',
        contactPerson: 'Zahid Ahmed',
        phone: '03007778899',
        email: 'info@innovative.pk',
        address: {
            street: '654 Bakery Lane',
            city: 'Faisalabad',
            state: 'Punjab',
            country: 'Pakistan'
        },
        isActive: true
    }
];

async function seedAgencies() {
    try {
        console.log('🌱 Seeding agencies...');

        for (const agency of agencies) {
            const existingAgency = await Distributor.findOne({ name: agency.name });

            if (!existingAgency) {
                await Distributor.create(agency);
                console.log(`✅ Created agency: ${agency.name}`);
            } else {
                console.log(`⚠️  Agency already exists: ${agency.name}`);
            }
        }

        console.log('🎉 Agency seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding agencies:', error);
    }
}

module.exports = seedAgencies;

// Run if called directly
if (require.main === module) {
    require('dotenv').config({ path: '../.env' });
    const connectDB = require('../config/database');

    connectDB()
        .then(() => {
            return seedAgencies();
        })
        .then(() => {
            console.log('✅ Seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}
