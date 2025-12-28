// Customers page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();

    // Initialize customers page
    initializeCustomersPage();

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
        loadCustomers(query);
    }, 300));

    // Add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    addCustomerBtn.addEventListener('click', function() {
        showMessage('Customer management from sales will be displayed here automatically!', 'info');
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

function initializeCustomersPage() {
    // Load initial data
    loadCustomers();
    loadCustomerStats();

    // Add fade-in animation
    document.querySelector('main').classList.add('fade-in');
}

function loadCustomers(searchQuery = '') {
    const customersTableBody = document.getElementById('customersTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noCustomersMessage = document.getElementById('noCustomersMessage');

    // Show loading
    loadingIndicator.classList.remove('hidden');
    customersTableBody.innerHTML = '';
    noCustomersMessage.classList.add('hidden');

    // For now, we'll simulate customer data from sales
    // In a real implementation, you'd have a customers API
    fetch(`http://localhost:5000/api/sales?limit=1000`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.classList.add('hidden');

        if (data.success) {
            // Group sales by customer name to create customer list
            const customerMap = new Map();

            data.sales.forEach(sale => {
                const customerName = sale.customerName;
                if (!customerMap.has(customerName)) {
                    customerMap.set(customerName, {
                        name: customerName,
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: null,
                        status: 'Active'
                    });
                }

                const customer = customerMap.get(customerName);
                customer.totalOrders += 1;
                customer.totalSpent += sale.total;

                // Track last order date
                const saleDate = new Date(sale.createdAt);
                if (!customer.lastOrder || saleDate > customer.lastOrder) {
                    customer.lastOrder = saleDate;
                }
            });

            // Filter by search query
            let customers = Array.from(customerMap.values());
            if (searchQuery) {
                customers = customers.filter(customer =>
                    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Sort by total spent (highest first)
            customers.sort((a, b) => b.totalSpent - a.totalSpent);

            if (customers.length === 0) {
                noCustomersMessage.classList.remove('hidden');
                return;
            }

            // Render customers
            customers.forEach(customer => {
                const row = createCustomerRow(customer);
                customersTableBody.appendChild(row);
            });
        } else {
            showMessage('Failed to load customer data', 'error');
        }
    })
    .catch(error => {
        console.error('Failed to load customers:', error);
        loadingIndicator.classList.add('hidden');
        showMessage('Failed to load customer data. Please try again.', 'error');
    });
}

function loadCustomerStats() {
    fetch('http://localhost:5000/api/sales?limit=1000', {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Calculate stats from sales data
            const customerMap = new Map();
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            data.sales.forEach(sale => {
                const customerName = sale.customerName;
                const saleDate = new Date(sale.createdAt);

                if (!customerMap.has(customerName)) {
                    customerMap.set(customerName, {
                        totalSpent: 0,
                        orderCount: 0,
                        lastOrder: saleDate,
                        isNewThisMonth: saleDate >= thisMonth
                    });
                }

                const customer = customerMap.get(customerName);
                customer.totalSpent += sale.total;
                customer.orderCount += 1;

                if (saleDate > customer.lastOrder) {
                    customer.lastOrder = saleDate;
                }
            });

            const customers = Array.from(customerMap.values());

            // Update stats
            document.getElementById('totalCustomers').textContent = customerMap.size.toLocaleString();

            // Active customers (ordered in last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeCustomers = customers.filter(c => c.lastOrder >= thirtyDaysAgo).length;
            document.getElementById('activeCustomers').textContent = activeCustomers.toLocaleString();

            // New customers this month
            const newCustomers = customers.filter(c => c.isNewThisMonth).length;
            document.getElementById('newCustomers').textContent = newCustomers.toLocaleString();

            // Top spender
            if (customers.length > 0) {
                const topCustomer = customers.reduce((max, customer) =>
                    customer.totalSpent > max.totalSpent ? customer : max
                );
                document.getElementById('topSpender').textContent = `₨${topCustomer.totalSpent.toLocaleString()}`;
            }
        }
    })
    .catch(error => {
        console.error('Failed to load customer stats:', error);
    });
}

function createCustomerRow(customer) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    // Generate initials
    const initials = customer.name.split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Format last order date
    const lastOrderDate = customer.lastOrder ?
        customer.lastOrder.toLocaleDateString() : 'Never';

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span class="text-white font-medium text-sm">${initials}</span>
                    </div>
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${customer.name}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">-</div>
            <div class="text-sm text-gray-500">No contact info</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${customer.totalOrders}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ₨${customer.totalSpent.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${lastOrderDate}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                ${customer.status}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex items-center space-x-2">
                <button onclick="viewCustomerHistory('${customer.name}')" class="text-blue-600 hover:text-blue-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                </button>
                <button onclick="contactCustomer('${customer.name}')" class="text-gray-600 hover:text-gray-900">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                </button>
            </div>
        </td>
    `;

    return row;
}

function updatePagination(pagination) {
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalCustomersCount = document.getElementById('totalCustomersCount');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (showingFrom && showingTo && totalCustomersCount) {
        const from = (pagination.current - 1) * 10 + 1;
        const to = Math.min(pagination.current * 10, pagination.totalRecords);

        showingFrom.textContent = from;
        showingTo.textContent = to;
        totalCustomersCount.textContent = pagination.totalRecords;

        if (prevPageBtn) prevPageBtn.disabled = pagination.current <= 1;
        if (nextPageBtn) nextPageBtn.disabled = pagination.current >= pagination.total;
    }
}

// Global functions for inline event handlers
function viewCustomerHistory(customerName) {
    showMessage(`Purchase history for ${customerName} will be displayed in detail view!`, 'info');
}

function contactCustomer(customerName) {
    showMessage(`Contact functionality for ${customerName} will be available soon!`, 'info');
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
    const existingMessage = document.querySelector('.customers-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg customers-message slide-in ${
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
