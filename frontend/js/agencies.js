// Agencies page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize agencies page
    initializeAgenciesPage();

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

    // Back to agencies button
    const backToAgenciesBtn = document.getElementById('backToAgenciesBtn');
    backToAgenciesBtn.addEventListener('click', function() {
        showAgenciesGrid();
    });

    // Modal functionality
    const agencyDetailModal = document.getElementById('agencyDetailModal');
    const closeAgencyDetailModalBtn = document.getElementById('closeAgencyDetailModalBtn');

    closeAgencyDetailModalBtn.addEventListener('click', function() {
        agencyDetailModal.classList.add('hidden');
    });

    agencyDetailModal.addEventListener('click', function(e) {
        if (e.target === agencyDetailModal) {
            agencyDetailModal.classList.add('hidden');
        }
    });

    // Inventory modal functionality
    const inventoryModal = document.getElementById('inventoryModal');
    const closeInventoryModalBtn = document.getElementById('closeInventoryModalBtn');
    const cancelInventoryBtn = document.getElementById('cancelInventoryBtn');
    const inventoryForm = document.getElementById('inventoryForm');

    closeInventoryModalBtn.addEventListener('click', function() {
        inventoryModal.classList.add('hidden');
    });

    cancelInventoryBtn.addEventListener('click', function() {
        inventoryModal.classList.add('hidden');
    });

    inventoryModal.addEventListener('click', function(e) {
        if (e.target === inventoryModal) {
            inventoryModal.classList.add('hidden');
        }
    });

    // Form submission
    inventoryForm.addEventListener('submit', handleInventoryForm);

    // Movement type change handler
    const movementType = document.getElementById('movementType');
    movementType.addEventListener('change', function() {
        toggleInventoryFields(this.value);
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

let currentAgencyId = null;

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

function initializeAgenciesPage() {
    // Load agencies
    loadAgencies();

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadAgencies() {
    const agenciesGrid = document.getElementById('agenciesGrid');

    // Use only the 5 specific agencies the user requested
    const userRequestedAgencies = [
        {
            _id: 'lays-001',
            name: 'Lays',
            contactPerson: 'Ahmed Khan',
            phone: '03001234567',
            email: 'contact@lays.pk',
            address: {
                street: '123 Food Street',
                city: 'Lahore',
                state: 'Punjab',
                country: 'Pakistan'
            },
            isActive: true,
            totalProducts: 0,
            currentStock: 0,
            totalSales: 0,
            totalProfit: 0,
            lastSaleDate: null
        },
        {
            _id: 'shakar-002',
            name: 'Shakar Kand Foods',
            contactPerson: 'Sara Ahmed',
            phone: '03009876543',
            email: 'info@shakarkand.pk',
            address: {
                street: '456 Sweet Avenue',
                city: 'Karachi',
                state: 'Sindh',
                country: 'Pakistan'
            },
            isActive: true,
            totalProducts: 0,
            currentStock: 0,
            totalSales: 0,
            totalProfit: 0,
            lastSaleDate: null
        },
        {
            _id: 'mugs-003',
            name: 'Mugs Foods',
            contactPerson: 'Ali Hassan',
            phone: '03005556677',
            email: 'sales@mugs.pk',
            address: {
                street: '789 Food Plaza',
                city: 'Islamabad',
                state: 'ICT',
                country: 'Pakistan'
            },
            isActive: true,
            totalProducts: 0,
            currentStock: 0,
            totalSales: 0,
            totalProfit: 0,
            lastSaleDate: null
        },
        {
            _id: 'international-004',
            name: 'International Foods',
            contactPerson: 'Fatima Khan',
            phone: '03004443322',
            email: 'contact@intfoods.pk',
            address: {
                street: '321 Global Market',
                city: 'Rawalpindi',
                state: 'Punjab',
                country: 'Pakistan'
            },
            isActive: true,
            totalProducts: 0,
            currentStock: 0,
            totalSales: 0,
            totalProfit: 0,
            lastSaleDate: null
        },
        {
            _id: 'innovative-005',
            name: 'Innovative Biscuits',
            contactPerson: 'Zahid Ahmed',
            phone: '03007778899',
            email: 'info@innovative.pk',
            address: {
                street: '654 Bakery Lane',
                city: 'Faisalabad',
                state: 'Punjab',
                country: 'Pakistan'
            },
            isActive: true,
            totalProducts: 0,
            currentStock: 0,
            totalSales: 0,
            totalProfit: 0,
            lastSaleDate: null
        }
    ];

    // Simulate loading delay for better UX
    setTimeout(() => {
        renderAgencies(userRequestedAgencies);
    }, 500);
}

function renderAgencies(agencies) {
    const agenciesGrid = document.getElementById('agenciesGrid');

    if (agencies.length === 0) {
        agenciesGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No agencies found</p></div>';
        return;
    }

    agenciesGrid.innerHTML = agencies.map(agency => `
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">
                            ${agency.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${agency.name}</h3>
                        <p class="text-sm text-gray-500">Agency</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="recordIncoming('${agency._id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Record Incoming Stock">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button onclick="recordOutgoing('${agency._id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Record Outgoing Stock">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button onclick="viewAgencyDetails('${agency._id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center">
                    <div class="text-xl font-bold text-green-600">${agency.totalProducts || 0}</div>
                    <div class="text-xs text-gray-500">Products</div>
                </div>
                <div class="text-center">
                    <div class="text-xl font-bold text-blue-600">${agency.currentStock || 0}</div>
                    <div class="text-xs text-gray-500">Stock</div>
                </div>
            </div>

            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Sales:</span>
                    <span class="font-medium text-green-600">₨${(agency.totalSales || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Profit:</span>
                    <span class="font-medium text-purple-600">₨${(agency.totalProfit || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Last Sale:</span>
                    <span class="font-medium text-gray-900">${agency.lastSaleDate ? new Date(agency.lastSaleDate).toLocaleDateString() : 'Never'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showAgenciesGrid() {
    const agenciesGrid = document.getElementById('agenciesGrid');
    const agencyDetailView = document.getElementById('agencyDetailView');
    const backToAgenciesBtn = document.getElementById('backToAgenciesBtn');

    agenciesGrid.classList.remove('hidden');
    agencyDetailView.classList.add('hidden');
    backToAgenciesBtn.classList.add('hidden');

    // Reset current agency
    currentAgencyId = null;
}

function viewAgencyDetails(agencyId) {
    currentAgencyId = agencyId;

    fetch(`http://localhost:5000/api/agencies/${agencyId}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAgencyDetailModal(data);
        } else {
            showMessage('Failed to load agency details', 'error');
        }
    })
    .catch(error => {
        console.error('Failed to load agency details:', error);
        showMessage('Failed to load agency details', 'error');
    });
}

function showAgencyDetailModal(data) {
    const modal = document.getElementById('agencyDetailModal');
    const modalTitle = document.getElementById('agencyDetailModalTitle');
    const content = document.getElementById('agencyDetailContent');

    const { agency, products, recentSales, movements } = data;

    modalTitle.textContent = `${agency.name} - Details`;

    content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Agency Stats -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-3">Agency Statistics</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span>Total Products:</span>
                        <span class="font-medium">${products.length}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Total Sales:</span>
                        <span class="font-medium text-green-600">₨${agency.totalSales.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Total Profit:</span>
                        <span class="font-medium text-purple-600">₨${agency.totalProfit.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Current Stock:</span>
                        <span class="font-medium">${agency.currentStock}</span>
                    </div>
                </div>
            </div>

            <!-- Recent Sales -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 mb-3">Recent Sales</h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    ${recentSales.slice(0, 5).map(sale => `
                        <div class="flex justify-between text-sm">
                            <span>${sale.customerName}</span>
                            <span class="font-medium">₨${sale.total.toLocaleString()}</span>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-sm">No recent sales</p>'}
                </div>
            </div>
        </div>

        <!-- Recent Inventory Movements -->
        <div class="mt-6">
            <h4 class="font-semibold text-gray-900 mb-3">Recent Inventory Movements</h4>
            <div class="bg-gray-50 rounded-lg overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-2 text-left">Type</th>
                            <th class="px-4 py-2 text-left">Product</th>
                            <th class="px-4 py-2 text-left">Quantity</th>
                            <th class="px-4 py-2 text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movements.slice(0, 10).map(movement => `
                            <tr class="border-t">
                                <td class="px-4 py-2 capitalize ${movement.type === 'incoming' ? 'text-green-600' : 'text-red-600'}">
                                    ${movement.type}
                                </td>
                                <td class="px-4 py-2">${movement.product?.name || 'Unknown'}</td>
                                <td class="px-4 py-2">${movement.quantity}</td>
                                <td class="px-4 py-2">${new Date(movement.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">No movements found</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function recordIncoming(agencyId) {
    currentAgencyId = agencyId;
    openInventoryModal('incoming');
}

function recordOutgoing(agencyId) {
    currentAgencyId = agencyId;
    openInventoryModal('outgoing');
}

function openInventoryModal(type) {
    const modal = document.getElementById('inventoryModal');
    const modalTitle = document.getElementById('inventoryModalTitle');
    const movementType = document.getElementById('movementType');

    movementType.value = type;
    modalTitle.textContent = type === 'incoming' ? 'Record Incoming Stock' : 'Record Outgoing Stock';

    toggleInventoryFields(type);
    loadProductsForInventory();

    modal.classList.remove('hidden');
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryForm');

    modal.classList.add('hidden');
    form.reset();
}

function toggleInventoryFields(type) {
    const batchNumberField = document.getElementById('batchNumberField');
    const expiryDateField = document.getElementById('expiryDateField');

    if (type === 'incoming') {
        batchNumberField.classList.remove('hidden');
        expiryDateField.classList.remove('hidden');
    } else {
        batchNumberField.classList.add('hidden');
        expiryDateField.classList.add('hidden');
    }
}

function loadProductsForInventory() {
    const productSelect = document.getElementById('inventoryProductSelect');

    // Clear existing options
    productSelect.innerHTML = '<option value="">Select Product</option>';

    // Load products for current agency
    fetch(`http://localhost:5000/api/products?agency=${currentAgencyId}&limit=100`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            data.products.forEach(product => {
                const option = document.createElement('option');
                option.value = product._id;
                option.textContent = `${product.name} (${product.sku}) - Stock: ${product.stock.current}`;
                option.dataset.stock = product.stock.current;
                productSelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Failed to load products:', error);
    });
}

function handleInventoryForm(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveInventoryBtn');
    const saveBtnText = document.getElementById('saveInventoryBtnText');
    const saveBtnLoader = document.getElementById('saveInventoryBtnLoader');

    const formData = new FormData(e.target);
    const movementData = {
        productId: formData.get('productId'),
        quantity: parseInt(formData.get('quantity')),
        unitPrice: parseFloat(formData.get('unitPrice')),
        batchNumber: formData.get('batchNumber') || undefined,
        expiryDate: formData.get('expiryDate') || undefined,
        notes: formData.get('notes') || undefined
    };

    const movementType = formData.get('movementType');

    // Validation
    if (!movementData.productId || !movementData.quantity || !movementData.unitPrice) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtnText.textContent = 'Recording...';
    saveBtnLoader.classList.remove('hidden');

    const url = movementType === 'incoming'
        ? `http://localhost:5000/api/agencies/${currentAgencyId}/inventory/incoming`
        : `http://localhost:5000/api/agencies/${currentAgencyId}/inventory/outgoing`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(movementData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(`Stock ${movementType} recorded successfully!`, 'success');
            closeInventoryModal();
            loadAgencies(); // Refresh agency data
        } else {
            showMessage(data.message || `Failed to record ${movementType} stock`, 'error');
        }
    })
    .catch(error => {
        console.error('Inventory recording error:', error);
        showMessage(`Failed to record ${movementType} stock. Please try again.`, 'error');
    })
    .finally(() => {
        // Reset button state
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Record Movement';
        saveBtnLoader.classList.add('hidden');
    });
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
    const existingMessage = document.querySelector('.agencies-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg agencies-message slide-in ${
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
