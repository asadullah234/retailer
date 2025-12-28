const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: [true, 'Agency is required']
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    type: {
        type: String,
        enum: ['incoming', 'outgoing', 'adjustment', 'sale', 'return'],
        required: [true, 'Movement type is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative']
    },
    totalValue: {
        type: Number,
        required: [true, 'Total value is required'],
        min: [0, 'Total value cannot be negative']
    },
    costPrice: {
        type: Number,
        default: 0,
        min: [0, 'Cost price cannot be negative']
    },
    profit: {
        type: Number,
        default: 0
    },
    reference: {
        type: String,
        trim: true,
        maxlength: [100, 'Reference cannot exceed 100 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Processed by user is required']
    },
    batchNumber: {
        type: String,
        trim: true
    },
    expiryDate: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for profit margin
inventoryMovementSchema.virtual('profitMargin').get(function() {
    if (this.type !== 'outgoing' && this.type !== 'sale') return 0;
    if (this.costPrice === 0) return 0;
    return ((this.unitPrice - this.costPrice) / this.costPrice * 100);
});

// Indexes for better performance
inventoryMovementSchema.index({ agency: 1, createdAt: -1 });
inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1, createdAt: -1 });
inventoryMovementSchema.index({ processedBy: 1 });

// Pre-save middleware to calculate profit for outgoing movements
inventoryMovementSchema.pre('save', async function(next) {
    try {
        if ((this.type === 'outgoing' || this.type === 'sale') && this.costPrice === 0) {
            // Get cost price from product if not provided
            const Product = mongoose.model('Product');
            const product = await Product.findById(this.product);
            if (product) {
                this.costPrice = product.price.costPrice;
                this.profit = (this.unitPrice - this.costPrice) * this.quantity;
            }
        } else if (this.type === 'outgoing' || this.type === 'sale') {
            this.profit = (this.unitPrice - this.costPrice) * this.quantity;
        }

        this.totalValue = this.unitPrice * this.quantity;

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
