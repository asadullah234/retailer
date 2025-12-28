const express = require('express');
const Sale = require('../models/Sale');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};

        // Add filters
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
        if (req.query.customerName) {
            filter.customerName = { $regex: req.query.customerName, $options: 'i' };
        }

        const sales = await Sale.find(filter)
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Sale.countDocuments(filter);

        res.status(200).json({
            success: true,
            sales,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: sales.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting sales'
        });
    }
});

// @route   GET /api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('items.product', 'name sku category')
            .populate('processedBy', 'name');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.status(200).json({
            success: true,
            sale
        });
    } catch (error) {
        console.error('Get sale error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error getting sale'
        });
    }
});

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const saleData = {
            ...req.body,
            processedBy: req.user._id
        };

        // Validate that agency exists and is active
        const Distributor = require('../models/Distributor');
        const agency = await Distributor.findById(saleData.agency);
        if (!agency || !agency.isActive || agency.type !== 'agency') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive agency'
            });
        }

        // Calculate totals
        let subtotal = 0;
        saleData.items = saleData.items.map(item => {
            const total = item.quantity * item.unitPrice * (1 - item.discount / 100);
            subtotal += total;
            return {
                ...item,
                total
            };
        });

        saleData.subtotal = subtotal;
        saleData.total = subtotal + (saleData.tax || 0) - (saleData.discount || 0);

        const sale = await Sale.create(saleData);

        await sale.populate('items.product', 'name sku');
        await sale.populate('processedBy', 'name');

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            sale
        });
    } catch (error) {
        console.error('Create sale error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Invoice number already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error creating sale'
        });
    }
});

// @route   PUT /api/sales/:id
// @desc    Update sale
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const sale = await Sale.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('processedBy', 'name');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Sale updated successfully',
            sale
        });
    } catch (error) {
        console.error('Update sale error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error updating sale'
        });
    }
});

// @route   GET /api/sales/stats/overview
// @desc    Get sales statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        // Today's sales
        const todaySales = await Sale.aggregate([
            { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);

        // This month's sales
        const monthSales = await Sale.aggregate([
            { $match: { createdAt: { $gte: thisMonth }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);

        // Total sales ever
        const totalSales = await Sale.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);

        // Top selling products this month
        const topProducts = await Sale.aggregate([
            { $match: { createdAt: { $gte: thisMonth }, status: 'completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 0,
                    productName: '$product.name',
                    totalSold: 1,
                    totalRevenue: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                today: todaySales[0] || { total: 0, count: 0 },
                thisMonth: monthSales[0] || { total: 0, count: 0 },
                total: totalSales[0] || { total: 0, count: 0 },
                topProducts
            }
        });
    } catch (error) {
        console.error('Get sales stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting sales statistics'
        });
    }
});

module.exports = router;
