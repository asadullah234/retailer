const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isActive: true };

        // Add filters
        if (req.query.category) filter.category = req.query.category;
        if (req.query.agency) filter.agency = req.query.agency;
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { sku: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter)
            .populate('distributor', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            products,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: products.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting products'
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('distributor', 'name contactPerson phone email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error getting product'
        });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const product = await Product.create(req.body);

        // Update distributor's product count
        await product.populate('distributor');
        await product.distributor.updateOne({
            $inc: { totalProducts: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.toUpperCase()} already exists`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error creating product'
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('distributor', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error updating product'
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.isActive = false;
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product deactivated successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error deleting product'
        });
    }
});

// @route   GET /api/products/stats/overview
// @desc    Get product statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ isActive: true });
        const lowStockProducts = await Product.countDocuments({
            isActive: true,
            'stock.current': { $lte: { $multiply: ['$stock.minimum', 1.2] } },
            'stock.current': { $gt: 0 }
        });
        const outOfStockProducts = await Product.countDocuments({
            isActive: true,
            'stock.current': 0
        });

        // Top selling products
        const topProducts = await Product.find({ isActive: true })
            .sort({ totalSold: -1 })
            .limit(5)
            .select('name totalSold totalRevenue');

        res.status(200).json({
            success: true,
            stats: {
                total: totalProducts,
                lowStock: lowStockProducts,
                outOfStock: outOfStockProducts,
                topProducts
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting product statistics'
        });
    }
});

module.exports = router;
