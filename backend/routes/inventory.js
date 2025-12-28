const express = require('express');
const InventoryMovement = require('../models/InventoryMovement');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/inventory/movements
// @desc    Get all inventory movements with optional filtering
// @access  Private
router.get('/movements', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type; // 'incoming', 'outgoing', or undefined for all
        const agencyId = req.query.agency;

        let query = {};

        if (type) {
            query.type = type;
        }

        if (agencyId) {
            query.distributor = agencyId;
        }

        const movements = await InventoryMovement.find(query)
            .populate('product', 'name sku')
            .populate('distributor', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            movements
        });

    } catch (error) {
        console.error('Get inventory movements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting inventory movements'
        });
    }
});

// @route   POST /api/inventory/movements
// @desc    Create a new inventory movement
// @access  Private
router.post('/movements', protect, async (req, res) => {
    try {
        const { product, distributor, type, quantity, notes } = req.body;

        const movement = await InventoryMovement.create({
            product,
            distributor,
            type,
            quantity,
            notes,
            processedBy: req.user._id
        });

        await movement.populate(['product', 'distributor', 'processedBy']);

        res.status(201).json({
            success: true,
            message: 'Inventory movement recorded successfully',
            movement
        });

    } catch (error) {
        console.error('Create inventory movement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating inventory movement'
        });
    }
});

module.exports = router;