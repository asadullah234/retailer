const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Agency name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Agency name cannot exceed 100 characters']
    },
    type: {
        type: String,
        enum: ['agency', 'distributor'],
        default: 'agency'
    },
    contactPerson: {
        type: String,
        trim: true,
        maxlength: [50, 'Contact person name cannot exceed 50 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Agency-specific fields
    totalProducts: {
        type: Number,
        default: 0
    },
    currentStock: {
        type: Number,
        default: 0
    },
    totalValue: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalProfit: {
        type: Number,
        default: 0
    },
    lastSupplyDate: Date,
    lastSaleDate: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full address
distributorSchema.virtual('fullAddress').get(function() {
    const address = this.address;
    if (!address) return '';
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}, ${address.country || ''}`.replace(/^, |, $/, '');
});

// Index for faster queries
distributorSchema.index({ name: 1 });
distributorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Distributor', distributorSchema);