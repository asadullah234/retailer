const express = require('express');
const Distributor = require('../models/Distributor');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const InventoryMovement = require('../models/InventoryMovement');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/agencies
// @desc    Get all agencies
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const agencies = await Distributor.find({ type: 'agency', isActive: true })
            .select('name totalProducts currentStock totalValue totalSales totalProfit lastSaleDate')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            agencies
        });
    } catch (error) {
        console.error('Get agencies error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting agencies'
        });
    }
});

// @route   GET /api/agencies/:id
// @desc    Get agency by ID with detailed stats
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const agency = await Distributor.findById(req.params.id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: 'Agency not found'
            });
        }

        // Get agency products
        const products = await Product.find({ agency: req.params.id, isActive: true })
            .select('name sku category stock price totalSold totalRevenue')
            .sort({ name: 1 });

        // Get recent sales
        const recentSales = await Sale.find({ agency: req.params.id })
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('invoiceNumber customerName total profit createdAt');

        // Get inventory movements
        const movements = await InventoryMovement.find({ agency: req.params.id })
            .populate('product', 'name sku')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(20)
            .select('type quantity unitPrice totalValue profit reference createdAt');

        res.status(200).json({
            success: true,
            agency,
            products,
            recentSales,
            movements
        });
    } catch (error) {
        console.error('Get agency error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting agency'
        });
    }
});

// @route   GET /api/agencies/:id/stats
// @desc    Get agency statistics
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
    try {
        const agencyId = req.params.id;
        const { period = 'month' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Get sales stats
        const salesStats = await Sale.aggregate([
            {
                $match: {
                    agency: mongoose.Types.ObjectId(agencyId),
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    totalProfit: { $sum: '$profit' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            }
        ]);

        // Get inventory movements
        const incomingMovements = await InventoryMovement.aggregate([
            {
                $match: {
                    agency: mongoose.Types.ObjectId(agencyId),
                    type: 'incoming',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncoming: { $sum: '$quantity' },
                    totalIncomingValue: { $sum: '$totalValue' }
                }
            }
        ]);

        const outgoingMovements = await InventoryMovement.aggregate([
            {
                $match: {
                    agency: mongoose.Types.ObjectId(agencyId),
                    type: { $in: ['outgoing', 'sale'] },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOutgoing: { $sum: '$quantity' },
                    totalOutgoingValue: { $sum: '$totalValue' },
                    totalProfit: { $sum: '$profit' }
                }
            }
        ]);

        // Get current stock levels
        const products = await Product.find({ agency: agencyId, isActive: true });
        const totalStock = products.reduce((sum, product) => sum + product.stock.current, 0);
        const totalStockValue = products.reduce((sum, product) =>
            sum + (product.stock.current * product.price.costPrice), 0);

        const stats = {
            period,
            sales: salesStats[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0, avgOrderValue: 0 },
            inventory: {
                currentStock: totalStock,
                currentValue: totalStockValue,
                incoming: incomingMovements[0] || { totalIncoming: 0, totalIncomingValue: 0 },
                outgoing: outgoingMovements[0] || { totalOutgoing: 0, totalOutgoingValue: 0, totalProfit: 0 }
            },
            products: {
                total: products.length,
                lowStock: products.filter(p => p.stock.current <= p.stock.minimum).length,
                outOfStock: products.filter(p => p.stock.current === 0).length
            }
        };

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get agency stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting agency statistics'
        });
    }
});

// @route   POST /api/agencies/:id/inventory/incoming
// @desc    Record incoming inventory
// @access  Private
router.post('/:id/inventory/incoming', protect, async (req, res) => {
    try {
        const { productId, quantity, unitPrice, batchNumber, expiryDate, notes } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Create inventory movement
        const movement = await InventoryMovement.create({
            agency: req.params.id,
            product: productId,
            type: 'incoming',
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            totalValue: parseFloat(unitPrice) * parseInt(quantity),
            batchNumber,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            notes,
            processedBy: req.user._id
        });

        // Update product stock
        await Product.findByIdAndUpdate(productId, {
            $inc: { 'stock.current': parseInt(quantity) },
            $set: { expiryDate: expiryDate ? new Date(expiryDate) : undefined }
        });

        // Update agency stats
        await Distributor.findByIdAndUpdate(req.params.id, {
            $inc: {
                currentStock: parseInt(quantity),
                totalValue: parseFloat(unitPrice) * parseInt(quantity)
            },
            lastSupplyDate: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Incoming inventory recorded successfully',
            movement
        });
    } catch (error) {
        console.error('Record incoming inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error recording incoming inventory'
        });
    }
});

// @route   POST /api/agencies/:id/inventory/outgoing
// @desc    Record outgoing inventory
// @access  Private
router.post('/:id/inventory/outgoing', protect, async (req, res) => {
    try {
        const { productId, quantity, unitPrice, notes } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock.current < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Create inventory movement
        const movement = await InventoryMovement.create({
            agency: req.params.id,
            product: productId,
            type: 'outgoing',
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            costPrice: product.price.costPrice,
            totalValue: parseFloat(unitPrice) * parseInt(quantity),
            profit: (parseFloat(unitPrice) - product.price.costPrice) * parseInt(quantity),
            notes,
            processedBy: req.user._id
        });

        // Update product stock
        await Product.findByIdAndUpdate(productId, {
            $inc: { 'stock.current': -parseInt(quantity) }
        });

        // Update agency stats
        await Distributor.findByIdAndUpdate(req.params.id, {
            $inc: {
                currentStock: -parseInt(quantity),
                totalValue: -parseFloat(unitPrice) * parseInt(quantity),
                totalProfit: (parseFloat(unitPrice) - product.price.costPrice) * parseInt(quantity)
            }
        });

        res.status(201).json({
            success: true,
            message: 'Outgoing inventory recorded successfully',
            movement
        });
    } catch (error) {
        console.error('Record outgoing inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error recording outgoing inventory'
        });
    }
});

// @route   GET /api/agencies/:id/inventory/movements
// @desc    Get inventory movements for agency
// @access  Private
router.get('/:id/inventory/movements', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { agency: req.params.id };

        // Add type filter if provided
        if (req.query.type) {
            filter.type = req.query.type;
        }

        // Add date range filter
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const movements = await InventoryMovement.find(filter)
            .populate('product', 'name sku category')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await InventoryMovement.countDocuments(filter);

        res.status(200).json({
            success: true,
            movements,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: movements.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Get inventory movements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting inventory movements'
        });
    }
});

// @route   GET /api/agencies/:id/inventory/movements
// @desc    Get inventory movements for a specific agency
// @access  Private
router.get('/:id/inventory/movements', protect, async (req, res) => {
    try {
        const agencyId = req.params.id;
        const limit = parseInt(req.query.limit) || 10;

        const movements = await InventoryMovement.find({ distributor: agencyId })
            .populate('product', 'name sku')
            .populate('distributor', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            movements
        });

    } catch (error) {
        console.error('Get agency inventory movements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting inventory movements'
        });
    }
});

module.exports = router;
