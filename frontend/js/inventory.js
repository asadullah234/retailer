// Inventory page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize inventory page
    initializeInventoryPage();

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
        searchInventory();
    }, 300));

    // Filter functionality
    const stockFilter = document.getElementById('stockFilter');
    stockFilter.addEventListener('change', function() {
        filterByStockStatus();
    });

    // Add stock button
    const addStockBtn = document.getElementById('addStockBtn');
    addStockBtn.addEventListener('click', function() {
        openStockModal();
    });

    // Modal functionality
    const stockModal = document.getElementById('stockModal');
    const closeStockModalBtn = document.getElementById('closeStockModalBtn');

    closeStockModalBtn.addEventListener('click', closeStockModal);

    // Close modal when clicking outside
    stockModal.addEventListener('click', function(e) {
        if (e.target === stockModal) {
            closeStockModal();
        }
    });

    // Pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadInventory(searchInput.value.trim(), currentFilter);
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadInventory(searchInput.value.trim(), currentFilter);
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
let currentFilter = 'all';

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

function initializeInventoryPage() {
    // Load initial data
    loadInventory();
    loadInventoryStats();

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadInventory(searchQuery = '', filter = 'all') {
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noInventoryMessage = document.getElementById('noInventoryMessage');

    // Show loading
    loadingIndicator.classList.remove('hidden');
    inventoryTableBody.innerHTML = '';
    noInventoryMessage.classList.add('hidden');

    // Simulate API delay
    setTimeout(() => {
        const mockInventory = generateMockInventory();

        // Apply search filter
        let filteredInventory = mockInventory;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredInventory = mockInventory.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.sku.toLowerCase().includes(query)
            );
        }

        // Apply stock filter
        if (filter !== 'all') {
            filteredInventory = filteredInventory.filter(item => {
                switch (filter) {
                    case 'low':
                        return item.currentStock <= item.minStock;
                    case 'out':
                        return item.currentStock === 0;
                    case 'good':
                        return item.currentStock > item.minStock;
                    default:
                        return true;
                }
            });
        }

        // Display inventory
        if (filteredInventory.length > 0) {
            filteredInventory.forEach(item => {
                const row = createInventoryRow(item);
                inventoryTableBody.appendChild(row);
            });
        } else {
            noInventoryMessage.classList.remove('hidden');
        }

        // Update pagination (mock)
        updatePagination({
            current: 1,
            total: Math.ceil(filteredInventory.length / 10),
            totalRecords: filteredInventory.length
        });

        // Hide loading
        loadingIndicator.classList.add('hidden');
    }, 500);
}

function generateMockInventory() {
    const agencies = [
        { name: 'Lays', products: ['Lays Classic', 'Lays BBQ', 'Lays Cream & Onion'] },
        { name: 'Shakar Kand Foods', products: ['Shakar Gand', 'Sweet Candy Mix', 'Traditional Sweets'] },
        { name: 'Mugs Foods', products: ['Mugs Cookies', 'Chocolate Chip Cookies', 'Oatmeal Cookies'] },
        { name: 'International Foods', products: ['Imported Chips', 'Global Snacks', 'Premium Cookies'] },
        { name: 'Innovative Biscuits', products: ['Cream Biscuits', 'Wafer Rolls', 'Chocolate Biscuits'] }
    ];

    const inventory = [];
    let id = 1;

    agencies.forEach(agency => {
        agency.products.forEach(product => {
            const currentStock = Math.floor(Math.random() * 200) + 10; // 10-210
            const minStock = Math.floor(Math.random() * 20) + 5; // 5-25
            const maxStock = Math.floor(Math.random() * 100) + 50; // 50-150
            const price = Math.floor(Math.random() * 200) + 50; // 50-250
            const value = currentStock * price;

            let status = 'Good';
            if (currentStock === 0) {
                status = 'Out of Stock';
            } else if (currentStock <= minStock) {
                status = 'Low Stock';
            }

            inventory.push({
                id: id++,
                name: product,
                sku: `SKU${String(id).padStart(4, '0')}`,
                currentStock: currentStock,
                minStock: minStock,
                maxStock: maxStock,
                status: status,
                value: value,
                agency: agency.name
            });
        });
    });

    return inventory;
}

function createInventoryRow(item) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${item.name}</div>
            <div class="text-sm text-gray-500">${item.agency}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.sku}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.currentStock}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.minStock}/${item.maxStock}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                item.status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
            }">
                ${item.status}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₨${item.value.toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button onclick="updateStock('${item.id}', '${item.name}', '${item.currentStock}')"
                    class="text-indigo-600 hover:text-indigo-900 mr-3">Update</button>
            <button onclick="recordIncoming()"
                    class="text-green-600 hover:text-green-900 mr-3">Incoming</button>
            <button onclick="recordOutgoing()"
                    class="text-orange-600 hover:text-orange-900">Outgoing</button>
        </td>
    `;

    return row;
}

// Additional inventory functionalities
function recordIncoming() {
    openStockModalWithType('incoming');
}

function recordOutgoing() {
    openStockModalWithType('outgoing');
}

function openStockModalWithType(type) {
    const modalTitle = document.getElementById('stockModalTitle');
    modalTitle.textContent = type === 'incoming' ? 'Record Incoming Stock' : 'Record Outgoing Stock';

    // Update the adjustment type dropdown
    const adjustmentType = document.getElementById('adjustmentType');
    adjustmentType.value = type === 'incoming' ? 'add' : 'subtract';

    // Trigger the change event to update placeholders
    adjustmentType.dispatchEvent(new Event('change'));

    // Open the modal
    openStockModal();
}

function searchInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 2) return;

        const productName = row.cells[0].textContent.toLowerCase();
        const sku = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';

        const matches = !searchTerm ||
            productName.includes(searchTerm) ||
            sku.includes(searchTerm);

        row.style.display = matches ? '' : 'none';
    });
}

function filterByStockStatus() {
    const status = document.getElementById('stockFilter').value;
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 4) return;

        const stockText = row.cells[2].textContent.trim();
        const stockLevel = parseInt(stockText) || 0;

        let show = true;

        switch (status) {
            case 'low':
                show = stockLevel <= 10; // Assume low stock is <= 10
                break;
            case 'out':
                show = stockLevel === 0;
                break;
            case 'good':
                show = stockLevel > 10;
                break;
            default:
                show = true;
        }

        row.style.display = show ? '' : 'none';
    });
}

function exportInventory() {
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    let csv = 'Product,SKU,Current Stock,Min/Max Stock,Status,Value\n';

    rows.forEach(row => {
        if (row.style.display !== 'none') {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
            csv += rowData + '\n';
        }
    });

    downloadCSV(csv, `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('Inventory exported successfully!', 'success');
}

function addRecentMovement(movementData) {
    // Add the movement to a local storage or in-memory array for display
    // In a real app, this would come from the backend
    const movements = JSON.parse(localStorage.getItem('recentMovements') || '[]');

    // Add new movement
    movements.unshift({
        productName: movementData.productName,
        type: movementData.type,
        quantity: movementData.quantity,
        agency: movementData.agencyId,
        createdAt: movementData.createdAt
    });

    // Keep only last 10 movements
    if (movements.length > 10) {
        movements.splice(10);
    }

    // Save to localStorage
    localStorage.setItem('recentMovements', JSON.stringify(movements));

    // Update dashboard if it's open (this would need to be enhanced for cross-page communication)
    console.log('Movement recorded and stored locally');
}

// Global functions for inline event handlers
function updateStock(productId, productName, currentStock) {
    openStockModal(productId, productName, currentStock);
}
    const to = Math.min(pagination.current * 10, pagination.totalRecords);

    showingFrom.textContent = from;
    showingTo.textContent = to;
    totalInventoryItems.textContent = pagination.totalRecords;

    prevPageBtn.disabled = pagination.current <= 1;
    nextPageBtn.disabled = pagination.current >= pagination.total;
}

function openStockModal(productId = null, productName = '', currentStock = 0) {
    const modal = document.getElementById('stockModal');
    const modalTitle = document.getElementById('stockModalTitle');
    const modalContent = document.getElementById('stockModalContent');

    modalTitle.textContent = productId ? `Update Stock - ${productName}` : 'Update Stock';

    modalContent.innerHTML = `
        <form id="stockUpdateForm">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" id="productName" name="productName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent" placeholder="Enter product name" style="box-shadow: 0 0 0 3px rgba(21, 173, 157, 0.1);">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Current Stock (Optional)</label>
                    <input type="number" id="currentStockDisplay" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent" placeholder="Enter current stock if known" style="box-shadow: 0 0 0 3px rgba(21, 173, 157, 0.1);">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                    <select id="adjustmentType" name="adjustmentType" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="add">Add Stock</option>
                        <option value="subtract">Remove Stock</option>
                        <option value="set">Set Stock Level</option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" id="quantityInput" name="quantity" min="0" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent">
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Reason/Notes</label>
                <textarea id="notesInput" name="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Optional notes about this stock adjustment"></textarea>
            </div>

            <div class="flex justify-end space-x-3">
                <button type="button" id="cancelStockBtn" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" id="saveStockBtn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                    <span id="saveStockBtnText">Update Stock</span>
                    <svg id="saveStockBtnLoader" class="hidden w-4 h-4 animate-spin ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </button>
            </div>
        </form>
    `;

    // Set initial values if product info provided
    if (productId && productName) {
        document.getElementById('productName').value = productName;
    }
    if (currentStock !== undefined) {
        document.getElementById('currentStockDisplay').value = currentStock;
    }

    // Set up form handlers
    const form = document.getElementById('stockUpdateForm');
    const cancelBtn = document.getElementById('cancelStockBtn');
    const adjustmentType = document.getElementById('adjustmentType');

    form.addEventListener('submit', handleStockUpdate);
    cancelBtn.addEventListener('click', closeStockModal);

    // Update quantity input based on adjustment type
    adjustmentType.addEventListener('change', function() {
        const quantityInput = document.getElementById('quantityInput');
        const type = this.value;

        if (type === 'add') {
            quantityInput.placeholder = 'Enter quantity to add';
            quantityInput.min = '1';
        } else if (type === 'subtract') {
            quantityInput.placeholder = 'Enter quantity to remove';
            quantityInput.min = '1';
        } else if (type === 'set') {
            quantityInput.placeholder = 'Enter new stock level';
            quantityInput.min = '0';
        }
    });

    modal.classList.remove('hidden');
}

function closeStockModal() {
    const modal = document.getElementById('stockModal');
    modal.classList.add('hidden');
}

// loadProductsForStockUpdate function removed - now using text input for product names

function handleStockUpdate(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveStockBtn');
    const saveBtnText = document.getElementById('saveStockBtnText');
    const saveBtnLoader = document.getElementById('saveStockBtnLoader');

    const formData = new FormData(e.target);
    const productName = formData.get('productName');
    const adjustmentType = formData.get('adjustmentType');
    const quantity = parseInt(formData.get('quantity'));
    const notes = formData.get('notes');

    if (!productName || !quantity) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtnText.textContent = 'Recording...';
    saveBtnLoader.classList.remove('hidden');

    // Get selected agency from URL or default
    const urlParams = new URLSearchParams(window.location.search);
    const agencyId = urlParams.get('agency') || 'default-agency';

    // Create stock movement record
    const movementData = {
        productName: productName,
        agencyId: agencyId,
        type: adjustmentType === 'add' ? 'incoming' : 'outgoing',
        quantity: quantity,
        adjustmentType: adjustmentType,
        notes: notes,
        recordedBy: 'User', // Could be enhanced to get from user session
        createdAt: new Date().toISOString()
    };

    // Record the stock movement (mock implementation since backend might not exist)
    // In a real implementation, this would send to the backend API
    console.log('Recording stock movement:', movementData);

    // Simulate API call success
    setTimeout(() => {
        showMessage('Stock movement recorded successfully!', 'success');
        closeStockModal();

        // Add the movement to recent activity display
        addRecentMovement(movementData);

        // Reset button state
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Record Movement';
        saveBtnLoader.classList.add('hidden');
    }, 1000);
}

function addRecentMovement(movementData) {
    // Add the movement to a local storage or in-memory array for display
    // In a real app, this would come from the backend
    const movements = JSON.parse(localStorage.getItem('recentMovements') || '[]');

    // Add new movement
    movements.unshift({
        productName: movementData.productName,
        type: movementData.type,
        quantity: movementData.quantity,
        agency: movementData.agencyId,
        createdAt: movementData.createdAt
    });

    // Keep only last 10 movements
    if (movements.length > 10) {
        movements.splice(10);
    }

    // Save to localStorage
    localStorage.setItem('recentMovements', JSON.stringify(movements));

    // Update dashboard if it's open (this would need to be enhanced for cross-page communication)
    console.log('Movement recorded and stored locally');
}

// Additional inventory functionalities
function recordIncoming() {
    openStockModalWithType('incoming');
}

function recordOutgoing() {
    openStockModalWithType('outgoing');
}

function openStockModalWithType(type) {
    const modalTitle = document.getElementById('stockModalTitle');
    modalTitle.textContent = type === 'incoming' ? 'Record Incoming Stock' : 'Record Outgoing Stock';

    // Update the adjustment type dropdown
    const adjustmentType = document.getElementById('adjustmentType');
    adjustmentType.value = type === 'incoming' ? 'add' : 'subtract';

    // Trigger the change event to update placeholders
    adjustmentType.dispatchEvent(new Event('change'));

    // Open the modal
    openStockModal();
}

function searchInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 2) return;

        const productName = row.cells[0].textContent.toLowerCase();
        const sku = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';

        const matches = !searchTerm ||
            productName.includes(searchTerm) ||
            sku.includes(searchTerm);

        row.style.display = matches ? '' : 'none';
    });
}

function filterByStockStatus() {
    const status = document.getElementById('stockFilter').value;
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 4) return;

        const stockText = row.cells[2].textContent.trim();
        const stockLevel = parseInt(stockText) || 0;

        let show = true;

        switch (status) {
            case 'low':
                show = stockLevel <= 10; // Assume low stock is <= 10
                break;
            case 'out':
                show = stockLevel === 0;
                break;
            case 'good':
                show = stockLevel > 10;
                break;
            default:
                show = true;
        }

        row.style.display = show ? '' : 'none';
    });
}

function exportInventory() {
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    let csv = 'Product,SKU,Current Stock,Min/Max Stock,Status,Value\n';

    rows.forEach(row => {
        if (row.style.display !== 'none') {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
            csv += rowData + '\n';
        }
    });

    downloadCSV(csv, `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('Inventory exported successfully!', 'success');
}

// Global functions for inline event handlers
function updateStock(productId, productName, currentStock) {
    openStockModal(productId, productName, currentStock);
}

function viewStockHistory(productId, productName) {
    // This would require a stock history feature in the backend
    showMessage(`Stock history for ${productName} will be available soon!`, 'info');
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
    const existingMessage = document.querySelector('.inventory-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg inventory-message slide-in ${
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
