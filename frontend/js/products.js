// Products page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize products page
    initializeProductsPage();

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
            if (href === 'products.html') {
                // Already on products page
                return;
            } else if (href === 'dashboard.html' || href === 'inventory.html' || href === 'sales.html' || href === 'customers.html' || href === 'agencies.html' || href === 'reports.html' || href === 'settings.html') {
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
        loadProducts(query);
    }, 300));

    // Add product button
    const addProductBtn = document.getElementById('addProductBtn');
    const addFirstProductBtn = document.getElementById('addFirstProductBtn');

    addProductBtn.addEventListener('click', function() {
        openProductModal();
    });

    addFirstProductBtn.addEventListener('click', function() {
        openProductModal();
    });

    // Modal functionality
    const productModal = document.getElementById('productModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');

    closeModalBtn.addEventListener('click', closeProductModal);
    cancelBtn.addEventListener('click', closeProductModal);

    // Close modal when clicking outside
    productModal.addEventListener('click', function(e) {
        if (e.target === productModal) {
            closeProductModal();
        }
    });

    // Form submission
    productForm.addEventListener('submit', handleProductSubmit);

    // Pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadProducts(searchInput.value.trim());
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts(searchInput.value.trim());
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
let isEditMode = false;
let editingProductId = null;

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

function initializeProductsPage() {
    // Load initial data
    loadProducts();
    loadProductStats();

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadProducts(searchQuery = '') {
    const productsTableBody = document.getElementById('productsTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noProductsMessage = document.getElementById('noProductsMessage');

    // Show loading
    loadingIndicator.classList.remove('hidden');
    productsTableBody.innerHTML = '';
    noProductsMessage.classList.add('hidden');

    const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchQuery && { search: searchQuery })
    });

    fetch(`http://localhost:5000/api/products?${params}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.classList.add('hidden');

        if (data.success) {
            const { products, pagination } = data;

            // Update pagination info
            totalPages = pagination.total;
            updatePagination(pagination);

            if (products.length === 0) {
                noProductsMessage.classList.remove('hidden');
                return;
            }

            // Render products
            products.forEach(product => {
                const row = createProductRow(product);
                productsTableBody.appendChild(row);
            });
        } else {
            showMessage('Failed to load products', 'error');
        }
    })
    .catch(error => {
        console.error('Failed to load products:', error);
        loadingIndicator.classList.add('hidden');
        showMessage('Failed to load products. Please try again.', 'error');
    });
}

function loadProductStats() {
    fetch('http://localhost:5000/api/products/stats/overview', {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.stats;

            // Update stats cards
            document.getElementById('totalProducts').textContent = stats.total.toLocaleString();
            document.getElementById('lowStockProducts').textContent = stats.lowStock.toLocaleString();
            document.getElementById('outOfStockProducts').textContent = stats.outOfStock.toLocaleString();

            // Calculate total value (this would need to be added to the backend)
            // For now, we'll show a placeholder
            document.getElementById('totalValue').textContent = '₨0';
        }
    })
    .catch(error => {
        console.error('Failed to load product stats:', error);
    });
}

function createProductRow(product) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    // Stock status
    const stockStatus = getStockStatus(product.stock.current, product.stock.minimum);
    const stockClass = stockStatus === 'out' ? 'text-red-600' :
                      stockStatus === 'low' ? 'text-orange-600' : 'text-green-600';

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span class="text-gray-600 font-medium text-sm">
                            ${product.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${product.name}</div>
                    <div class="text-sm text-gray-500">${product.description || 'No description'}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${product.sku}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                ${capitalizeFirst(product.category)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm ${stockClass}">
                ${product.stock.current} ${product.unit || 'pieces'}
            </div>
            ${product.stock.minimum ? `<div class="text-xs text-gray-500">Min: ${product.stock.minimum}</div>` : ''}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ₨${product.price.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }">
                ${product.isActive ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex items-center space-x-2">
                <button onclick="editProduct('${product._id}')" class="text-indigo-600 hover:text-indigo-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                </button>
                <button onclick="deleteProduct('${product._id}', '${product.name}')" class="text-red-600 hover:text-red-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        </td>
    `;

    return row;
}

function getStockStatus(current, minimum) {
    if (current === 0) return 'out';
    if (minimum && current <= minimum) return 'low';
    return 'good';
}

function updatePagination(pagination) {
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalProductsCount = document.getElementById('totalProductsCount');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    const from = (pagination.current - 1) * 10 + 1;
    const to = Math.min(pagination.current * 10, pagination.totalRecords);

    showingFrom.textContent = from;
    showingTo.textContent = to;
    totalProductsCount.textContent = pagination.totalRecords;

    prevPageBtn.disabled = pagination.current <= 1;
    nextPageBtn.disabled = pagination.current >= pagination.total;
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');

    if (productId) {
        // Edit mode
        isEditMode = true;
        editingProductId = productId;
        modalTitle.textContent = 'Edit Product';

        // Load product data
        fetch(`http://localhost:5000/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateProductForm(data.product);
            } else {
                showMessage('Failed to load product data', 'error');
                return;
            }
        })
        .catch(error => {
            console.error('Failed to load product:', error);
            showMessage('Failed to load product data', 'error');
            return;
        });
    } else {
        // Add mode
        isEditMode = false;
        editingProductId = null;
        modalTitle.textContent = 'Add Product';
        form.reset();
    }

    modal.classList.remove('hidden');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');

    modal.classList.add('hidden');
    form.reset();
    isEditMode = false;
    editingProductId = null;
}

function populateProductForm(product) {
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productSku').value = product.sku || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCostPrice').value = product.costPrice || '';
    document.getElementById('productStock').value = product.stock?.current || '';
    document.getElementById('productMinStock').value = product.stock?.minimum || '';
    document.getElementById('productMaxStock').value = product.stock?.maximum || '';
    document.getElementById('productUnit').value = product.unit || 'pieces';
    document.getElementById('productDescription').value = product.description || '';
}

function handleProductSubmit(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveProductBtn');
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtnLoader = document.getElementById('saveBtnLoader');

    // Get form data
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name').trim(),
        sku: formData.get('sku').trim(),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        costPrice: formData.get('costPrice') ? parseFloat(formData.get('costPrice')) : undefined,
        stock: {
            current: parseInt(formData.get('currentStock')),
            minimum: formData.get('minimumStock') ? parseInt(formData.get('minimumStock')) : 0,
            maximum: formData.get('maximumStock') ? parseInt(formData.get('maximumStock')) : undefined
        },
        unit: formData.get('unit') || 'pieces',
        description: formData.get('description').trim()
    };

    // Remove undefined values
    Object.keys(productData).forEach(key => {
        if (productData[key] === undefined || productData[key] === '') {
            delete productData[key];
        }
    });

    if (productData.stock) {
        Object.keys(productData.stock).forEach(key => {
            if (productData.stock[key] === undefined || productData.stock[key] === '') {
                delete productData.stock[key];
            }
        });
    }

    // Show loading state
    saveBtn.disabled = true;
    saveBtnText.textContent = isEditMode ? 'Updating...' : 'Saving...';
    saveBtnLoader.classList.remove('hidden');

    const url = isEditMode
        ? `http://localhost:5000/api/products/${editingProductId}`
        : 'http://localhost:5000/api/products';

    const method = isEditMode ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(
                `Product ${isEditMode ? 'updated' : 'created'} successfully!`,
                'success'
            );
            closeProductModal();
            loadProducts(); // Reload products
            loadProductStats(); // Reload stats
        } else {
            showMessage(data.message || 'Failed to save product', 'error');
        }
    })
    .catch(error => {
        console.error('Product save error:', error);
        showMessage('Failed to save product. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        saveBtn.disabled = false;
        saveBtnText.textContent = 'Save Product';
        saveBtnLoader.classList.add('hidden');
    });
}

// Global functions for inline event handlers
function editProduct(productId) {
    openProductModal(productId);
}

function deleteProduct(productId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
        fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Product deleted successfully', 'success');
                loadProducts(); // Reload products
                loadProductStats(); // Reload stats
            } else {
                showMessage(data.message || 'Failed to delete product', 'error');
            }
        })
        .catch(error => {
            console.error('Product delete error:', error);
            showMessage('Failed to delete product. Please try again.', 'error');
        });
    }
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
    const existingMessage = document.querySelector('.products-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg products-message slide-in ${
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

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
