const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    type: {
        type: String,
        required: true,
        enum: ['incoming', 'outgoing']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        enum: ['purchase', 'return', 'damage', 'expiry', 'sale', 'adjustment', 'initial_stock']
    },
    reference: {
        type: String,
        trim: true,
        maxlength: [100, 'Reference cannot exceed 100 characters']
    },
    costPrice: {
        type: Number,
        min: [0, 'Cost price cannot be negative'],
        default: 0
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total value
inventorySchema.virtual('totalValue').get(function() {
    return this.quantity * this.costPrice;
});

// Indexes
inventorySchema.index({ product: 1, createdAt: -1 });
inventorySchema.index({ type: 1 });
inventorySchema.index({ reason: 1 });
inventorySchema.index({ processedBy: 1 });

// Pre-save middleware to update product stock
inventorySchema.pre('save', async function(next) {
    try {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);

        if (!product) {
            return next(new Error('Product not found'));
        }

        if (this.type === 'incoming') {
            product.stock.current += this.quantity;
        } else if (this.type === 'outgoing') {
            if (product.stock.current < this.quantity) {
                return next(new Error('Insufficient stock'));
            }
            product.stock.current -= this.quantity;
        }

        await product.save();
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Inventory', inventorySchema);
