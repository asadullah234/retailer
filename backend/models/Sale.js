const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
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
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    total: {
        type: Number,
        required: [true, 'Total is required'],
        min: [0, 'Total cannot be negative']
    }
}, { _id: false });

const saleSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: [true, 'Invoice number is required'],
        unique: true,
        trim: true
    },
    agency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: [true, 'Agency is required']
    },
    customerName: {
        type: String,
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerPhone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: [true, 'Subtotal is required'],
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    total: {
        type: Number,
        required: [true, 'Total is required'],
        min: [0, 'Total cannot be negative']
    },
    costOfGoodsSold: {
        type: Number,
        default: 0,
        min: [0, 'Cost of goods sold cannot be negative']
    },
    profit: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'credit'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'cancelled'],
        default: 'completed'
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

// Virtual for item count
saleSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Indexes
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ customerPhone: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ processedBy: 1 });
saleSchema.index({ createdAt: -1 });

// Pre-save middleware to generate invoice number and update inventory
saleSchema.pre('save', async function(next) {
    try {
        // Generate invoice number if not provided
        if (!this.invoiceNumber) {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            // Find the last invoice for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const lastSale = await mongoose.model('Sale').findOne({
                createdAt: { $gte: today, $lt: tomorrow }
            }).sort({ createdAt: -1 });

            let sequence = 1;
            if (lastSale && lastSale.invoiceNumber) {
                const parts = lastSale.invoiceNumber.split('-');
                if (parts.length === 3) {
                    sequence = parseInt(parts[2]) + 1;
                }
            }

            this.invoiceNumber = `INV-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
        }

        // Calculate cost of goods sold and profit
        if (this.status === 'completed') {
            const Product = mongoose.model('Product');
            const InventoryMovement = mongoose.model('InventoryMovement');

            let totalCost = 0;

            for (const item of this.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    const costPrice = product.price.costPrice;
                    const itemCost = costPrice * item.quantity;
                    totalCost += itemCost;

                    // Create inventory movement for outgoing sale
                    await InventoryMovement.create({
                        agency: this.agency,
                        product: item.product,
                        type: 'sale',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        costPrice: costPrice,
                        totalValue: item.total,
                        profit: (item.unitPrice - costPrice) * item.quantity,
                        reference: this.invoiceNumber,
                        processedBy: this.processedBy
                    });

                    // Update product stock and sales data
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: {
                            'stock.current': -item.quantity,
                            totalSold: item.quantity,
                            totalRevenue: item.total
                        },
                        lastSoldDate: new Date()
                    });
                }
            }

            this.costOfGoodsSold = totalCost;
            this.profit = this.total - totalCost;

            // Update agency stats
            const Distributor = mongoose.model('Distributor');
            await Distributor.findByIdAndUpdate(this.agency, {
                $inc: {
                    totalSales: this.total,
                    totalProfit: this.profit
                },
                lastSaleDate: new Date()
            });
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Sale', saleSchema);
