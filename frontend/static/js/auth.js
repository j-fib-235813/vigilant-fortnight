// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    // Password toggle functionality
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPassword.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Password strength checker
    if (password) {
        password.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        let feedback = '';

        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;

        // Character variety checks
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        // Update strength bar
        strengthFill.className = 'strength-fill';
        if (strength <= 2) {
            strengthFill.classList.add('weak');
            feedback = 'Weak';
        } else if (strength <= 3) {
            strengthFill.classList.add('fair');
            feedback = 'Fair';
        } else if (strength <= 4) {
            strengthFill.classList.add('good');
            feedback = 'Good';
        } else {
            strengthFill.classList.add('strong');
            feedback = 'Strong';
        }

        strengthText.textContent = feedback;
    }

    // Login form handling
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            // Show loading state
            const loginBtn = document.getElementById('loginBtn');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            loginBtn.disabled = true;

            // Send login request
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    showNotification(data.error || 'Login failed', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('An error occurred during login', 'error');
            })
            .finally(() => {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            });
        });
    }

    // Register form handling
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            // Validation
            if (!email || !password || !confirmPassword) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            if (password.length < 8) {
                showNotification('Password must be at least 8 characters long', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            if (!terms) {
                showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }

            // Show loading state
            const registerBtn = document.getElementById('registerBtn');
            const originalText = registerBtn.innerHTML;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            registerBtn.disabled = true;

            // Send registration request
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Account created successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    showNotification(data.error || 'Registration failed', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('An error occurred during registration', 'error');
            })
            .finally(() => {
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            });
        });
    }

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        document.body.appendChild(notification);
    }

    // Initialize
    console.log('Authentication page initialized');
});
