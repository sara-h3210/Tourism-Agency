// Authentication
const ADMIN_CREDENTIALS = {
    username: 'sarah.boumedien.3210@gmail.com',
    password: 'admin123'
};

// Login functionality
document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('loginMessage');

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('isAuthenticated', 'true');
        window.location.href = '/assets/pages/admin/dashboard.html';
    } else {
        message.textContent = 'Invalid credentials!';
        message.style.color = 'red';
    }
});

// Check authentication
function checkAuth() {
    if (location.pathname.includes('/assets/pages/admin/dashboard.html') &&
        localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = '/assets/pages/admin/dashboard.html';
    }
}
checkAuth();

// Logout
function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/assets/pages/admin/dashboard.html';
}

// Data Storage (Replace with real database in production)
let destinations = [];
let packages = [];




// Helper function
function showMessage(elementId, text, color) {
    const message = document.getElementById(elementId);
    message.textContent = text;
    message.style.color = color;
    setTimeout(() => message.textContent = '', 3000);
}



// Add smooth scroll functionality to section buttons
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', function () {
        const sectionId = this.dataset.section;
        const section = document.getElementById(sectionId);

        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Add temporary active state
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 200);
        }
    });
});

// Optional: Add active class to current section
window.addEventListener('scroll', () => {
    document.querySelectorAll('.admin-section').forEach(section => {
        const rect = section.getBoundingClientRect();
        const navButton = document.querySelector(`[data-section="${section.id}"]`);

        if (rect.top <= 100 && rect.bottom >= 100) {
            navButton?.classList.add('active');
        } else {
            navButton?.classList.remove('active');
        }
    });
});