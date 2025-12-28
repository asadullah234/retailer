// Signup form functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');

    // Get API base URL
    function getApiBaseUrl() {
        return 'http://localhost:5000';
    }

    // Password visibility toggles
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

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

    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);

        // Update icon
        const icon = this.querySelector('svg');
        if (type === 'password') {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>';
        }
    });

    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        setLoadingState(true);

        try {
            const formData = new FormData(this);
            const userData = {
                name: formData.get('name')?.trim(),
                email: formData.get('email')?.trim(),
                phone: formData.get('phone')?.trim(),
                productName: formData.get('productName')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            console.log('📤 Form data being sent:', {
                name: `"${userData.name}"`,
                email: `"${userData.email}"`,
                phone: `"${userData.phone}"`,
                productName: `"${userData.productName}"`,
                passwordLength: userData.password?.length,
                confirmPasswordLength: userData.confirmPassword?.length
            });

            // Validate the data
            if (!validateFormData(userData)) {
                setLoadingState(false);
                return;
            }

            console.log('🌐 Making API call to:', getApiBaseUrl() + '/api/auth/signup');
            console.log('📨 Request body:', userData);

            const response = await fetch(getApiBaseUrl() + '/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            const result = await response.json();
            console.log('📨 Response data:', result);

            if (response.ok) {
                showAlert('Account created successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Show specific validation errors if available
                let errorMessage = result.message || 'Failed to create account';
                if (result.errors && result.errors.length > 0) {
                    errorMessage = result.errors[0].msg;
                }
                showAlert(errorMessage, 'error');
            }

        } catch (error) {
            console.error('Signup error:', error);
            showAlert('Network error. Please try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function validateFormData(userData) {
        console.log('🔍 Starting data validation...');

        const { name, email, phone, productName, password, confirmPassword } = userData;

        console.log('📝 Data being validated:', {
            name: `"${name}"`,
            email: `"${email}"`,
            phone: `"${phone}"`,
            productName: `"${productName}"`,
            passwordLength: password?.length,
            confirmPasswordLength: confirmPassword?.length
        });

        if (!name || name.length < 2) {
            showAlert('Please enter a valid name (at least 2 characters)', 'error');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showAlert('Please enter a valid email address', 'error');
            return false;
        }

        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phone || !phoneRegex.test(phone)) {
            showAlert('Please enter a valid phone number (must start with a digit 1-9, no leading zeros)', 'error');
            return false;
        }

        if (!productName || productName.length < 2) {
            showAlert('Please enter a valid business name (at least 2 characters)', 'error');
            return false;
        }

        if (!password || password.length < 8) {
            showAlert('Password must be at least 8 characters long', 'error');
            return false;
        }

        // Check password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(password)) {
            showAlert('Password must contain at least one lowercase letter, one uppercase letter, and one number', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return false;
        }

        return true;
    }

    function setLoadingState(loading) {
        const btn = document.getElementById('registerBtn');
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