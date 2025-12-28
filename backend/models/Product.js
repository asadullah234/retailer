const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: [true, 'Agency is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['snacks', 'beverages', 'dairy', 'bakery', 'household', 'personal_care', 'other'],
        default: 'other'
    },
    price: {
        costPrice: {
            type: Number,
            required: [true, 'Cost price is required'],
            min: [0, 'Cost price cannot be negative']
        },
        sellingPrice: {
            type: Number,
            required: [true, 'Selling price is required'],
            min: [0, 'Selling price cannot be negative']
        }
    },
    stock: {
        current: {
            type: Number,
            default: 0,
            min: [0, 'Current stock cannot be negative']
        },
        minimum: {
            type: Number,
            default: 0,
            min: [0, 'Minimum stock cannot be negative']
        },
        maximum: {
            type: Number,
            default: 0,
            min: [0, 'Maximum stock cannot be negative']
        }
    },
    barcode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    expiryDate: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    totalSold: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    lastSoldDate: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
    if (this.price.costPrice === 0) return 0;
    return ((this.price.sellingPrice - this.price.costPrice) / this.price.costPrice * 100);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.stock.current === 0) return 'out_of_stock';
    if (this.stock.current <= this.stock.minimum) return 'low_stock';
    if (this.stock.current >= this.stock.maximum) return 'over_stock';
    return 'in_stock';
});

// Indexes for better performance
productSchema.index({ name: 1 });
productSchema.index({ agency: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ 'stock.current': 1 });

module.exports = mongoose.model('Product', productSchema);