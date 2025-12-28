// Reports page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize reports page
    initializeReportsPage();

    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    sidebarToggle.addEventListener('click', function() {
        toggleSidebar();
    });

    sidebarOverlay.addEventListener('click', function() {
        toggleSidebar();
    });

    // Navigation links
    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');

            // Handle navigation
            const href = this.getAttribute('href');
            if (href === 'dashboard.html' || href === 'products.html' || href === 'inventory.html' || href === 'sales.html' || href === 'customers.html' || href === 'agencies.html' || href === 'reports.html' || href === 'settings.html') {
                window.location.href = href;
            } else {
                showMessage(`${this.textContent.trim()} functionality coming soon!`, 'info');
            }

            // Close sidebar on mobile after navigation
            if (window.innerWidth < 1024) {
                toggleSidebar();
            }
        });
    });

    // Date range selector
    const dateRange = document.getElementById('dateRange');
    const customDateRange = document.getElementById('customDateRange');
    const endDateContainer = document.getElementById('endDateContainer');

    dateRange.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.classList.remove('hidden');
            endDateContainer.classList.remove('hidden');
        } else {
            customDateRange.classList.add('hidden');
            endDateContainer.classList.add('hidden');
        }
    });

    // Generate report button
    const generateReportBtn = document.getElementById('generateReportBtn');
    generateReportBtn.addEventListener('click', generateReport);

    // Export report button
    const exportReportBtn = document.getElementById('exportReportBtn');
    exportReportBtn.addEventListener('click', exportReport);

    // Window resize handler
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
        }
    });
});

function checkAuthentication() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    // Verify token with backend
    fetch('http://localhost:5000/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateUserProfile(data.user);
        } else {
            // Token invalid, redirect to login
            logout();
        }
    })
    .catch(error => {
        console.error('Token verification failed:', error);
        logout();
    });
}

function updateUserProfile(user) {
    const userInitial = document.getElementById('userInitial');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        userInitial.textContent = initials;
        userName.textContent = user.name;
    }

    if (user.email) {
        userEmail.textContent = user.email;
    }
}

function initializeReportsPage() {
    // Load agencies for filter
    loadAgenciesForReports();

    // Load initial report data
    generateReport();

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadAgenciesForReports() {
    const agencySelect = document.getElementById('reportAgency');

    // Use only the 5 specific agencies the user requested
    const userRequestedAgencies = [
        { _id: 'lays-001', name: 'Lays' },
        { _id: 'shakar-002', name: 'Shakar Kand Foods' },
        { _id: 'mugs-003', name: 'Mugs Foods' },
        { _id: 'international-004', name: 'International Foods' },
        { _id: 'innovative-005', name: 'Innovative Biscuits' }
    ];

    agencySelect.innerHTML = '<option value="all">All Agencies</option>';

    userRequestedAgencies.forEach(agency => {
        const option = document.createElement('option');
        option.value = agency._id;
        option.textContent = agency.name;
        agencySelect.appendChild(option);
    });
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    const agencyId = document.getElementById('reportAgency').value;

    // Show loading
    const generateBtn = document.getElementById('generateReportBtn');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;

    // Get date range
    let startDate, endDate;
    const now = new Date();

    switch (dateRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1);
            endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            startDate = new Date(document.getElementById('startDate').value);
            endDate = new Date(document.getElementById('endDate').value);
            endDate.setHours(23, 59, 59, 999);
            break;
    }

    // Load report data based on type
    loadReportData(reportType, startDate, endDate).then(() => {
        // Reset button
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    });
}

async function loadReportData(reportType, startDate, endDate) {
    try {
        const agencyId = document.getElementById('reportAgency').value;

        // Generate mock sales data for the selected agency/date range
        const salesData = generateMockSalesData(agencyId, startDate, endDate);

        if (reportType === 'agency') {
            updateAgencyReport(salesData, startDate, endDate, agencyId);
        } else if (reportType === 'profit') {
            updateProfitLossReport(salesData, startDate, endDate, agencyId);
        } else {
            updateSalesReport(salesData, startDate, endDate);
            updateTopProducts(salesData);
            updateRecentActivity(salesData);
        }
    } catch (error) {
        console.error('Report generation error:', error);
        showMessage('Failed to generate report. Please try again.', 'error');
    }
}

function generateMockSalesData(agencyId, startDate, endDate) {
    const agencies = {
        'lays-001': { name: 'Lays', products: ['Lays Classic', 'Lays Cream & Onion', 'Lays Salted', 'Lays BBQ'] },
        'shakar-002': { name: 'Shakar Kand Foods', products: ['Shakar Gand', 'Sweet Candy Mix', 'Traditional Sweets', 'Fruit Candies'] },
        'mugs-003': { name: 'Mugs Foods', products: ['Mugs Cookies', 'Chocolate Chip Cookies', 'Oatmeal Cookies', 'Biscuit Assortment'] },
        'international-004': { name: 'International Foods', products: ['Imported Chips', 'Global Snacks', 'Premium Cookies', 'Specialty Candies'] },
        'innovative-005': { name: 'Innovative Biscuits', products: ['Cream Biscuits', 'Wafer Rolls', 'Chocolate Biscuits', 'Fruit Biscuits'] }
    };

    const customers = ['Ahmed Store', 'Sara Mart', 'Khan Traders', 'Ali General Store', 'Fatima Wholesale', 'Zahid Retail', 'Hassan Shop', 'Maryam Store'];

    const sales = [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Generate sales data for the date range
    for (let i = 0; i < Math.min(daysDiff * 2, 50); i++) { // Max 50 sales or 2 per day
        const randomDays = Math.floor(Math.random() * daysDiff);
        const saleDate = new Date(startDate);
        saleDate.setDate(startDate.getDate() + randomDays);

        const agency = agencyId === 'all' ?
            Object.values(agencies)[Math.floor(Math.random() * Object.values(agencies).length)] :
            agencies[agencyId];

        if (!agency) continue;

        const customer = customers[Math.floor(Math.random() * customers.length)];
        const products = agency.products;
        const numItems = Math.floor(Math.random() * 5) + 1;
        let total = 0;
        const items = [];

        for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 10) + 1;
            const price = Math.floor(Math.random() * 500) + 50; // 50-550 PKR
            const itemTotal = quantity * price;
            total += itemTotal;

            items.push({
                product: { name: product },
                quantity: quantity,
                price: price,
                total: itemTotal
            });
        }

        sales.push({
            _id: `sale_${i + 1}`,
            customerName: customer,
            agency: { name: agency.name },
            invoiceNumber: `INV-${String(1000 + i).padStart(4, '0')}`,
            items: items,
            total: total,
            date: saleDate.toISOString(),
            status: 'completed'
        });
    }

    return { sales: sales, success: true };
}

function updateSalesReport(sales, startDate, endDate) {
    // Calculate metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Find top product
    const productSales = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const productName = item.product?.name || 'Unknown Product';
            if (!productSales[productName]) {
                productSales[productName] = 0;
            }
            productSales[productName] += item.quantity;
        });
    });

    const topProduct = Object.entries(productSales).reduce((max, [name, qty]) =>
        qty > max.qty ? { name, qty } : max,
        { name: 'N/A', qty: 0 }
    );

    // Update UI
    document.getElementById('totalRevenue').textContent = `₨${totalRevenue.toLocaleString()}`;
    document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
    document.getElementById('avgOrderValue').textContent = `₨${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    document.getElementById('topProduct').textContent = topProduct.name;
}

function updateTopProducts(sales) {
    const topProductsList = document.getElementById('topProductsList');

    // Calculate product performance
    const productStats = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const productName = item.product?.name || 'Unknown Product';
            const revenue = item.quantity * item.unitPrice * (1 - item.discount / 100);

            if (!productStats[productName]) {
                productStats[productName] = {
                    name: productName,
                    quantity: 0,
                    revenue: 0,
                    orders: 0
                };
            }

            productStats[productName].quantity += item.quantity;
            productStats[productName].revenue += revenue;
            productStats[productName].orders += 1;
        });
    });

    // Sort by revenue and take top 5
    const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    if (topProducts.length === 0) {
        topProductsList.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">No sales data available</p></div>';
        return;
    }

    topProductsList.innerHTML = topProducts.map(product => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 font-medium text-sm">
                        ${product.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                    <div class="text-sm font-medium text-gray-900">${product.name}</div>
                    <div class="text-xs text-gray-500">${product.quantity} units sold</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-gray-900">₨${product.revenue.toLocaleString()}</div>
                <div class="text-xs text-gray-500">${product.orders} orders</div>
            </div>
        </div>
    `).join('');
}

function updateRecentActivity(sales) {
    const recentActivity = document.getElementById('recentActivity');

    // Sort by date (most recent first) and take last 5
    const recentSales = sales
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentSales.length === 0) {
        recentActivity.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">No recent activity</p></div>';
        return;
    }

    recentActivity.innerHTML = recentSales.map(sale => {
        const saleDate = new Date(sale.createdAt).toLocaleDateString();
        const saleTime = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-medium text-xs">
                            ${sale.customerName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${sale.customerName}</div>
                        <div class="text-xs text-gray-500">${saleDate} at ${saleTime}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">₨${sale.total.toLocaleString()}</div>
                    <div class="text-xs text-green-600">${sale.status}</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateAgencyReport(sales, startDate, endDate, agencyId) {
    const reportContent = document.getElementById('reportContent');

    // Group sales by agency
    const agencyStats = {};

    sales.forEach(sale => {
        const agencyName = sale.agency?.name || 'Unknown Agency';
        if (!agencyStats[agencyName]) {
            agencyStats[agencyName] = {
                name: agencyName,
                totalSales: 0,
                totalProfit: 0,
                totalOrders: 0,
                avgOrderValue: 0
            };
        }

        agencyStats[agencyName].totalSales += sale.total;
        agencyStats[agencyName].totalProfit += sale.profit || 0;
        agencyStats[agencyName].totalOrders += 1;
    });

    // Calculate averages
    Object.values(agencyStats).forEach(agency => {
        agency.avgOrderValue = agency.totalOrders > 0 ? agency.totalSales / agency.totalOrders : 0;
    });

    const agencies = Object.values(agencyStats);

    reportContent.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Agency Performance Report</h3>
                <span class="text-sm text-gray-500">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profit</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${agencies.map(agency => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${agency.name}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₨${agency.totalSales.toLocaleString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₨${agency.totalProfit.toLocaleString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${agency.totalOrders}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₨${agency.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No agency data available</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function updateProfitLossReport(sales, startDate, endDate, agencyId) {
    const reportContent = document.getElementById('reportContent');

    // Calculate profit/loss metrics
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let totalProfit = 0;
    let totalTransactions = sales.length;

    sales.forEach(sale => {
        totalRevenue += sale.total;
        totalCostOfGoods += sale.costOfGoodsSold || 0;
        totalProfit += sale.profit || 0;
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    reportContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Profit & Loss Summary -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Profit & Loss Summary</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span class="text-gray-700">Total Revenue</span>
                        <span class="font-semibold text-green-600">₨${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span class="text-gray-700">Cost of Goods Sold</span>
                        <span class="font-semibold text-red-600">₨${totalCostOfGoods.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                        <span class="text-gray-900 font-medium">Net Profit</span>
                        <span class="font-bold text-green-600">₨${totalProfit.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span class="text-gray-700">Profit Margin</span>
                        <span class="font-semibold text-blue-600">${profitMargin.toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <!-- Monthly Breakdown -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span class="text-gray-700">Total Transactions</span>
                        <span class="font-semibold text-purple-600">${totalTransactions}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                        <span class="text-gray-700">Average Order Value</span>
                        <span class="font-semibold text-indigo-600">₨${totalTransactions > 0 ? (totalRevenue / totalTransactions).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span class="text-gray-700">Period</span>
                        <span class="font-semibold text-orange-600">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg">
                        <span class="text-gray-900 font-medium">Status</span>
                        <span class="font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
                            ${totalProfit >= 0 ? '✓ Profitable' : '⚠ Loss'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function exportReport() {
    const reportType = document.getElementById('reportType').value;
    const agencyId = document.getElementById('reportAgency').value;
    const dateRange = document.getElementById('dateRange').value;

    // Generate current report data
    let startDate, endDate;
    const now = new Date();

    switch (dateRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1);
            endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            startDate = new Date(document.getElementById('startDate').value);
            endDate = new Date(document.getElementById('endDate').value);
            endDate.setHours(23, 59, 59, 999);
            break;
    }

    const salesData = generateMockSalesData(agencyId, startDate, endDate);

    if (reportType === 'agency') {
        exportAgencyReportCSV(salesData.sales, startDate, endDate, agencyId);
    } else if (reportType === 'profit') {
        exportProfitLossReportCSV(salesData.sales, startDate, endDate, agencyId);
    } else {
        exportSalesReportCSV(salesData.sales, startDate, endDate);
    }
}

function exportSalesReportCSV(sales, startDate, endDate) {
    const csvContent = generateSalesCSV(sales);
    downloadCSV(csvContent, `sales_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`);
}

function exportAgencyReportCSV(sales, startDate, endDate, agencyId) {
    // Group sales by agency
    const agencyStats = {};

    sales.forEach(sale => {
        const agencyName = sale.agency?.name || 'Unknown Agency';
        if (!agencyStats[agencyName]) {
            agencyStats[agencyName] = {
                name: agencyName,
                totalSales: 0,
                totalProfit: 0,
                totalOrders: 0,
                avgOrderValue: 0
            };
        }

        agencyStats[agencyName].totalSales += sale.total;
        agencyStats[agencyName].totalProfit += sale.profit || 0;
        agencyStats[agencyName].totalOrders += 1;
    });

    // Calculate averages
    Object.values(agencyStats).forEach(agency => {
        agency.avgOrderValue = agency.totalOrders > 0 ? agency.totalSales / agency.totalOrders : 0;
    });

    const csvContent = generateAgencyCSV(Object.values(agencyStats));
    downloadCSV(csvContent, `agency_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`);
}

function exportProfitLossReportCSV(sales, startDate, endDate, agencyId) {
    const csvContent = generateProfitLossCSV(sales);
    downloadCSV(csvContent, `profit_loss_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`);
}

function generateSalesCSV(sales) {
    let csv = 'Date,Customer,Agency,Invoice Number,Total,Status\n';

    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const customer = sale.customerName;
        const agency = sale.agency?.name || 'Unknown';
        const invoice = sale.invoiceNumber;
        const total = sale.total;
        const status = sale.status;

        csv += `"${date}","${customer}","${agency}","${invoice}","${total}","${status}"\n`;
    });

    return csv;
}

function generateAgencyCSV(agencies) {
    let csv = 'Agency Name,Total Sales,Total Profit,Total Orders,Avg Order Value\n';

    agencies.forEach(agency => {
        csv += `"${agency.name}","${agency.totalSales}","${agency.totalProfit}","${agency.totalOrders}","${agency.avgOrderValue.toFixed(2)}"\n`;
    });

    return csv;
}

function generateProfitLossCSV(sales) {
    let csv = 'Date,Customer,Agency,Invoice Number,Revenue,Cost,Profit\n';

    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const customer = sale.customerName;
        const agency = sale.agency?.name || 'Unknown';
        const invoice = sale.invoiceNumber;
        const revenue = sale.total;
        const cost = sale.total * 0.7; // Assuming 70% cost
        const profit = revenue - cost;

        csv += `"${date}","${customer}","${agency}","${invoice}","${revenue}","${cost.toFixed(2)}","${profit.toFixed(2)}"\n`;
    });

    return csv;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showMessage('CSV report downloaded successfully!', 'success');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
}

function logout() {
    // Clear stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Show logout message
    showMessage('Logged out successfully', 'success');

    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.querySelector('.reports-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg reports-message slide-in ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'info' ? 'bg-blue-500 text-white' :
        'bg-gray-500 text-white'
    }`;

    messageDiv.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 00-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(messageDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    // Handle navigation state changes if needed
    console.log('Navigation state changed');
});

// Error handling for failed resource loads
window.addEventListener('error', function(e) {
    console.error('Resource failed to load:', e.target.src || e.target.href);
});

// Handle online/offline status
window.addEventListener('online', function() {
    showMessage('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showMessage('You are offline. Some features may not work.', 'error');
});
