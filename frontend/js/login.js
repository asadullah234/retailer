// Login form functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    // Get API base URL
    function getApiBaseUrl() {
        return 'http://localhost:5000';
    }

    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Update icon
        const icon = this.querySelector('svg');
        if (type === 'password') {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>';
        }
    });

    // Check for registration success message
    if (sessionStorage.getItem('registrationSuccess')) {
        sessionStorage.removeItem('registrationSuccess');
        showAlert('Registration successful! Please sign in with your credentials.', 'success');
    }

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoadingState(true);

        try {
            const formData = new FormData(this);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            };

            const response = await fetch(getApiBaseUrl() + '/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                // Store token
                const storage = loginData.remember ? localStorage : sessionStorage;
                storage.setItem('token', result.token);
                storage.setItem('user', JSON.stringify(result.user));

                showAlert('Login successful! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showAlert(result.message || 'Invalid email or password', 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            showAlert('Network error. Please try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function validateForm() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showAlert('Please enter a valid email address', 'error');
            return false;
        }

        if (!password) {
            showAlert('Please enter your password', 'error');
            return false;
        }

        return true;
    }

    function setLoadingState(loading) {
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');

        btn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnLoader.classList.toggle('hidden', !loading);
    }

    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        successAlert.classList.add('hidden');
        errorAlert.classList.add('hidden');

        if (type === 'success') {
            successMessage.textContent = message;
            successAlert.classList.remove('hidden');
        } else {
            errorMessage.textContent = message;
            errorAlert.classList.remove('hidden');
        }

        alertContainer.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => hideAlert('success'), 5000);
        }
    }

    function hideAlert(type) {
        const alert = document.getElementById(type + 'Alert');
        const alertContainer = document.getElementById('alertContainer');

        alert.classList.add('hidden');

        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');

        if (successAlert.classList.contains('hidden') && errorAlert.classList.contains('hidden')) {
            alertContainer.classList.add('hidden');
        }
    }
});