const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get this month's date range
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        // Get last month's date range for comparison
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        lastMonth.setHours(0, 0, 0, 0);
        const thisMonthStart = new Date(thisMonth);

        // Parallel queries for better performance
        const [
            totalProducts,
            totalCustomers,
            agencies,
            todaySales,
            monthSales,
            lastMonthSales,
            recentOrders,
            lowStockProducts,
            agencyStats
        ] = await Promise.all([
            // Total active products
            Product.countDocuments({ isActive: true }),

            // Total customers (users with role 'user')
            User.countDocuments({ role: 'user', isActive: true }),

            // Get all active agencies
            Distributor.find({ type: 'agency', isActive: true })
                .select('name totalProducts currentStock totalValue totalSales totalProfit lastSaleDate'),

            // Today's sales
            Sale.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]),

            // This month's sales
            Sale.aggregate([
                { $match: { createdAt: { $gte: thisMonth }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]),

            // Last month's sales for comparison
            Sale.aggregate([
                { $match: { createdAt: { $gte: lastMonth, $lt: thisMonthStart }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]),

            // Recent orders (last 5)
            Sale.find({ status: 'completed' })
                .populate('agency', 'name')
                .populate('processedBy', 'name')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('agency customerName total profit status createdAt invoiceNumber'),

            // Low stock products (stock <= minimum * 1.2)
            Product.countDocuments({
                isActive: true,
                $expr: { $lte: ['$stock.current', { $multiply: ['$stock.minimum', 1.2] }] },
                'stock.current': { $gt: 0 }
            }),

            // Agency-wise sales for this month
            Sale.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thisMonth },
                        status: 'completed'
                    }
                },
                {
                    $lookup: {
                        from: 'distributors',
                        localField: 'agency',
                        foreignField: '_id',
                        as: 'agencyInfo'
                    }
                },
                {
                    $unwind: '$agencyInfo'
                },
                {
                    $group: {
                        _id: '$agency',
                        agencyName: { $first: '$agencyInfo.name' },
                        totalSales: { $sum: '$total' },
                        totalProfit: { $sum: '$profit' },
                        totalOrders: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalSales: -1 }
                }
            ])
        ]);

        // Calculate percentage changes
        const currentMonthTotal = monthSales[0]?.total || 0;
        const lastMonthTotal = lastMonthSales[0]?.total || 0;
        const salesChangePercent = lastMonthTotal > 0 ?
            ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

        // Get sales data for chart (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesChartData = await Sale.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'completed' } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalSales: {
                    amount: currentMonthTotal,
                    change: salesChangePercent,
                    changeType: salesChangePercent >= 0 ? 'increase' : 'decrease'
                },
                products: {
                    count: totalProducts,
                    lowStock: lowStockProducts
                },
                customers: {
                    count: totalCustomers
                },
                orders: {
                    count: monthSales[0]?.count || 0
                },
                todaySales: todaySales[0] || { total: 0, count: 0 },
                recentOrders: recentOrders,
                salesChart: salesChartData,
                agencies: agencies,
                agencyPerformance: agencyStats
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting dashboard statistics'
        });
    }
});

module.exports = router;
