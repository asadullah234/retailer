const express = require('express');
const Distributor = require('../models/Distributor');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/distributors
// @desc    Get all distributors
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const distributors = await Distributor.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Distributor.countDocuments();

        res.status(200).json({
            success: true,
            distributors,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: distributors.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Get distributors error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting distributors'
        });
    }
});

// @route   GET /api/distributors/:id
// @desc    Get distributor by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const distributor = await Distributor.findById(req.params.id);

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        res.status(200).json({
            success: true,
            distributor
        });
    } catch (error) {
        console.error('Get distributor error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid distributor ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error getting distributor'
        });
    }
});

// @route   POST /api/distributors
// @desc    Create new distributor
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const distributor = await Distributor.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Distributor created successfully',
            distributor
        });
    } catch (error) {
        console.error('Create distributor error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Distributor with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error creating distributor'
        });
    }
});

// @route   PUT /api/distributors/:id
// @desc    Update distributor
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const distributor = await Distributor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Distributor updated successfully',
            distributor
        });
    } catch (error) {
        console.error('Update distributor error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid distributor ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error updating distributor'
        });
    }
});

// @route   DELETE /api/distributors/:id
// @desc    Delete distributor
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const distributor = await Distributor.findById(req.params.id);

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        await Distributor.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Distributor deleted successfully'
        });
    } catch (error) {
        console.error('Delete distributor error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid distributor ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error deleting distributor'
        });
    }
});

module.exports = router;
