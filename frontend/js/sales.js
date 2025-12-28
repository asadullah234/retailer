// Sales page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize sales page
    initializeSalesPage();

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

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(function(e) {
        const query = e.target.value.trim();
        currentPage = 1; // Reset to first page
        loadSales(query, currentStatus, currentStartDate, currentEndDate);
    }, 300));

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', function() {
        currentStatus = this.value;
        currentPage = 1; // Reset to first page
        loadSales(searchInput.value.trim(), currentStatus, currentStartDate, currentEndDate);
    });

    // Date filter
    const applyDateFilter = document.getElementById('applyDateFilter');
    applyDateFilter.addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            showMessage('Start date cannot be after end date', 'error');
            return;
        }

        currentStartDate = startDate;
        currentEndDate = endDate;
        currentPage = 1; // Reset to first page
        loadSales(searchInput.value.trim(), currentStatus, currentStartDate, currentEndDate);
    });

    // New sale button
    const newSaleBtn = document.getElementById('newSaleBtn');
    const createFirstSaleBtn = document.getElementById('createFirstSaleBtn');

    newSaleBtn.addEventListener('click', function() {
        openSaleModal();
    });

    createFirstSaleBtn.addEventListener('click', function() {
        openSaleModal();
    });

    // Modal functionality
    const saleModal = document.getElementById('saleModal');
    const closeSaleModalBtn = document.getElementById('closeSaleModalBtn');
    const cancelSaleBtn = document.getElementById('cancelSaleBtn');
    const saleForm = document.getElementById('saleForm');

    closeSaleModalBtn.addEventListener('click', closeSaleModal);
    cancelSaleBtn.addEventListener('click', closeSaleModal);

    // Close modal when clicking outside
    saleModal.addEventListener('click', function(e) {
        if (e.target === saleModal) {
            closeSaleModal();
        }
    });

    // Form submission
    saleForm.addEventListener('submit', handleSaleSubmit);

    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    addItemBtn.addEventListener('click', function() {
        addSaleItem();
    });

    // Tax and discount change handlers
    const taxInput = document.getElementById('tax');
    const discountInput = document.getElementById('discount');

    taxInput.addEventListener('input', calculateTotal);
    discountInput.addEventListener('input', calculateTotal);

    // Pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadSales(searchInput.value.trim(), currentStatus, currentStartDate, currentEndDate);
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadSales(searchInput.value.trim(), currentStatus, currentStartDate, currentEndDate);
        }
    });

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

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentStatus = '';
let currentStartDate = '';
let currentEndDate = '';
let itemCounter = 0;

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

function initializeSalesPage() {
    // Load initial data
    loadSales();
    loadSalesStats();

    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    currentStartDate = startDate.toISOString().split('T')[0];
    currentEndDate = endDate.toISOString().split('T')[0];

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadSales(searchQuery = '', status = '', startDate = '', endDate = '') {
    const salesTableBody = document.getElementById('salesTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noSalesMessage = document.getElementById('noSalesMessage');

    // Show loading
    loadingIndicator.classList.remove('hidden');
    salesTableBody.innerHTML = '';
    noSalesMessage.classList.add('hidden');

    const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchQuery && { customerName: searchQuery }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
    });

    fetch(`http://localhost:5000/api/sales?${params}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.classList.add('hidden');

        if (data.success) {
            const { sales, pagination } = data;

            // Update pagination info
            totalPages = pagination.total;
            updatePagination(pagination);

            if (sales.length === 0) {
                noSalesMessage.classList.remove('hidden');
                return;
            }

            // Render sales
            sales.forEach(sale => {
                const row = createSaleRow(sale);
                salesTableBody.appendChild(row);
            });
        } else {
            showMessage('Failed to load sales', 'error');
        }
    })
    .catch(error => {
        console.error('Failed to load sales:', error);
        loadingIndicator.classList.add('hidden');
        showMessage('Failed to load sales. Please try again.', 'error');
    });
}

function loadSalesStats() {
    fetch('http://localhost:5000/api/sales/stats/overview', {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.stats;

            // Update stats cards
            document.getElementById('todaySales').textContent = `₨${stats.today.total.toLocaleString()}`;
            document.getElementById('todaySalesCount').textContent = `${stats.today.count} transactions`;

            document.getElementById('monthSales').textContent = `₨${stats.thisMonth.total.toLocaleString()}`;
            document.getElementById('monthSalesCount').textContent = `${stats.thisMonth.count} transactions`;

            document.getElementById('totalSales').textContent = `₨${stats.total.total.toLocaleString()}`;
            document.getElementById('totalSalesCount').textContent = `${stats.total.count} total transactions`;

            // Calculate average order value
            const avgOrderValue = stats.total.count > 0 ? stats.total.total / stats.total.count : 0;
            document.getElementById('avgOrderValue').textContent = `₨${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        }
    })
    .catch(error => {
        console.error('Failed to load sales stats:', error);
    });
}

function createSaleRow(sale) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    // Format date
    const saleDate = new Date(sale.createdAt).toLocaleDateString();

    // Get status color
    const statusColor = getStatusColor(sale.status);

    // Count items
    const itemCount = sale.items ? sale.items.length : 0;

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${sale.invoiceNumber || 'N/A'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${sale.customerName}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${saleDate}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${itemCount} items</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ₨${sale.total.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                ${sale.paymentMethod || 'N/A'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor} capitalize">
                ${sale.status}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex items-center space-x-2">
                <button onclick="viewSale('${sale._id}')" class="text-blue-600 hover:text-blue-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                </button>
                <button onclick="printSale('${sale._id}')" class="text-gray-600 hover:text-gray-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        </td>
    `;

    return row;
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function updatePagination(pagination) {
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalSalesCount = document.getElementById('totalSalesCount');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    const from = (pagination.current - 1) * 10 + 1;
    const to = Math.min(pagination.current * 10, pagination.totalRecords);

    showingFrom.textContent = from;
    showingTo.textContent = to;
    totalSalesCount.textContent = pagination.totalRecords;

    prevPageBtn.disabled = pagination.current <= 1;
    nextPageBtn.disabled = pagination.current >= pagination.total;
}

function openSaleModal(saleId = null) {
    const modal = document.getElementById('saleModal');
    const modalTitle = document.getElementById('saleModalTitle');
    const form = document.getElementById('saleForm');

    if (saleId) {
        // Edit mode - not implemented yet
        modalTitle.textContent = 'Edit Sale';
        showMessage('Sale editing will be available soon!', 'info');
        return;
    } else {
        // Create mode
        modalTitle.textContent = 'Create New Sale';
        form.reset();
        itemCounter = 0;

        // Clear items container
        document.getElementById('itemsContainer').innerHTML = '';

        // Add one empty item
        addSaleItem();

        // Load agencies
        loadAgenciesForSale();

        // Add agency change listener
        const agencySelect = document.getElementById('saleAgency');
        agencySelect.addEventListener('change', function() {
            // Clear existing items and add a new empty one
            document.getElementById('itemsContainer').innerHTML = '';
            addSaleItem();
            calculateTotal();
        });

        // Set default date
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('saleDate').value = now.toISOString().slice(0, 16);

        // Generate invoice number
        generateInvoiceNumber();

        // Reset totals
        calculateTotal();
    }

    modal.classList.remove('hidden');
}

function closeSaleModal() {
    const modal = document.getElementById('saleModal');
    modal.classList.add('hidden');
}

function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);

    const invoiceNumber = `INV-${year}${month}${day}-${timestamp}`;
    document.getElementById('invoiceNumber').value = invoiceNumber;
}

function addSaleItem(productId = '', quantity = 1, unitPrice = 0, discount = 0) {
    itemCounter++;
    const itemsContainer = document.getElementById('itemsContainer');

    const itemDiv = document.createElement('div');
    itemDiv.className = 'sale-item flex items-center space-x-2 p-3 bg-gray-50 rounded-lg';
    itemDiv.dataset.itemId = itemCounter;

    itemDiv.innerHTML = `
        <div class="flex-1">
            <select class="product-select w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" required>
                <option value="">Select Product</option>
            </select>
        </div>
        <div class="w-20">
            <input type="number" class="quantity-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Qty" min="1" value="${quantity}" required>
        </div>
        <div class="w-24">
            <input type="number" class="unit-price-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Price" step="0.01" min="0" value="${unitPrice}" required>
        </div>
        <div class="w-20">
            <input type="number" class="discount-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Disc %" min="0" max="100" value="${discount}">
        </div>
        <div class="w-24">
            <input type="number" class="total-input w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" readonly placeholder="Total">
        </div>
        <button type="button" class="remove-item-btn text-red-600 hover:text-red-900 p-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 00-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
        </button>
    `;

    itemsContainer.appendChild(itemDiv);

    // Load products for the select
    loadProductsForItem(itemDiv.querySelector('.product-select'), productId);

    // Set up event listeners
    setupItemEventListeners(itemDiv);

    // Calculate initial total
    calculateItemTotal(itemDiv);
}

function loadAgenciesForSale() {
    const agencySelect = document.getElementById('saleAgency');

    // Use only the 5 specific agencies the user requested
    const userRequestedAgencies = [
        { _id: 'lays-001', name: 'Lays' },
        { _id: 'shakar-002', name: 'Shakar Kand Foods' },
        { _id: 'mugs-003', name: 'Mugs Foods' },
        { _id: 'international-004', name: 'International Foods' },
        { _id: 'innovative-005', name: 'Innovative Biscuits' }
    ];

    agencySelect.innerHTML = '<option value="">Select Agency</option>';

    userRequestedAgencies.forEach(agency => {
        const option = document.createElement('option');
        option.value = agency._id;
        option.textContent = agency.name;
        agencySelect.appendChild(option);
    });
}

function loadProductsForItem(selectElement, selectedProductId = '') {
    const agencyId = document.getElementById('saleAgency').value;

    if (!agencyId) {
        selectElement.innerHTML = '<option value="">Select Agency First</option>';
        return;
    }

    fetch(`http://localhost:5000/api/products?agency=${agencyId}&limit=1000`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            selectElement.innerHTML = '<option value="">Select Product</option>';

            data.products.forEach(product => {
                const option = document.createElement('option');
                option.value = product._id;
                option.textContent = `${product.name} (${product.sku}) - ₨${product.price}`;
                option.dataset.price = product.price;
                option.dataset.sku = product.sku;
                selectElement.appendChild(option);
            });

            if (selectedProductId) {
                selectElement.value = selectedProductId;
            }
        }
    })
    .catch(error => {
        console.error('Failed to load products:', error);
    });
}

function setupItemEventListeners(itemDiv) {
    const productSelect = itemDiv.querySelector('.product-select');
    const quantityInput = itemDiv.querySelector('.quantity-input');
    const unitPriceInput = itemDiv.querySelector('.unit-price-input');
    const discountInput = itemDiv.querySelector('.discount-input');
    const removeBtn = itemDiv.querySelector('.remove-item-btn');

    // Product selection change
    productSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            unitPriceInput.value = selectedOption.dataset.price || 0;
            calculateItemTotal(itemDiv);
        }
    });

    // Quantity, price, discount changes
    quantityInput.addEventListener('input', () => calculateItemTotal(itemDiv));
    unitPriceInput.addEventListener('input', () => calculateItemTotal(itemDiv));
    discountInput.addEventListener('input', () => calculateItemTotal(itemDiv));

    // Remove item
    removeBtn.addEventListener('click', function() {
        itemDiv.remove();
        calculateTotal();
    });
}

function calculateItemTotal(itemDiv) {
    const quantity = parseFloat(itemDiv.querySelector('.quantity-input').value) || 0;
    const unitPrice = parseFloat(itemDiv.querySelector('.unit-price-input').value) || 0;
    const discount = parseFloat(itemDiv.querySelector('.discount-input').value) || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;

    itemDiv.querySelector('.total-input').value = total.toFixed(2);

    calculateTotal();
}

function calculateTotal() {
    const itemDivs = document.querySelectorAll('.sale-item');
    let subtotal = 0;

    itemDivs.forEach(itemDiv => {
        const totalInput = itemDiv.querySelector('.total-input');
        subtotal += parseFloat(totalInput.value) || 0;
    });

    document.getElementById('subtotal').value = subtotal.toFixed(2);

    const tax = parseFloat(document.getElementById('tax').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    const taxAmount = subtotal * (tax / 100);
    const finalTotal = subtotal + taxAmount - discount;

    document.getElementById('totalAmount').textContent = `₨${finalTotal.toFixed(2)}`;
}

function handleSaleSubmit(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveSaleBtn');
    const saveBtnText = document.getElementById('saveSaleBtnText');
    const saveBtnLoader = document.getElementById('saveSaleBtnLoader');

    // Get form data
    const formData = new FormData(e.target);
    const saleData = {
        customerName: formData.get('customerName').trim(),
        paymentMethod: formData.get('paymentMethod'),
        notes: formData.get('notes').trim(),
        tax: parseFloat(formData.get('tax')) || 0,
        discount: parseFloat(formData.get('discount')) || 0,
        items: []
    };

    // Set invoice number
    saleData.invoiceNumber = formData.get('invoiceNumber');

    // Set sale date if provided
    if (formData.get('saleDate')) {
        saleData.createdAt = new Date(formData.get('saleDate')).toISOString();
    }

    // Collect items
    const itemDivs = document.querySelectorAll('.sale-item');
    itemDivs.forEach(itemDiv => {
        const productSelect = itemDiv.querySelector('.product-select');
        const quantityInput = itemDiv.querySelector('.quantity-input');
        const unitPriceInput = itemDiv.querySelector('.unit-price-input');
        const discountInput = itemDiv.querySelector('.discount-input');

        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);
        const unitPrice = parseFloat(unitPriceInput.value);
        const discount = parseFloat(discountInput.value) || 0;

        if (productId && quantity > 0 && unitPrice >= 0) {
            saleData.items.push({
                product: productId,
                quantity: quantity,
                unitPrice: unitPrice,
                discount: discount
            });
        }
    });

    // Validation
    if (!saleData.customerName) {
        showMessage('Customer name is required', 'error');
        return;
    }

    if (saleData.items.length === 0) {
        showMessage('At least one item is required', 'error');
        return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtnText.textContent = 'Creating Sale...';
    saveBtnLoader.classList.remove('hidden');

    fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(saleData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Sale created successfully!', 'success');
            closeSaleModal();
            loadSales(); // Reload sales
            loadSalesStats(); // Reload stats
        } else {
            showMessage(data.message || 'Failed to create sale', 'error');
        }
    })
    .catch(error => {
        console.error('Sale creation error:', error);
        showMessage('Failed to create sale. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Create Sale';
        saveBtnLoader.classList.add('hidden');
    });
}

// Global functions for inline event handlers
function viewSale(saleId) {
    // This would open a detailed view modal
    showMessage(`Sale details view for ${saleId} will be available soon!`, 'info');
}

function printSale(saleId) {
    // This would generate and print a receipt
    showMessage(`Printing functionality for sale ${saleId} will be available soon!`, 'info');
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
    const existingMessage = document.querySelector('.sales-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg sales-message slide-in ${
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

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
