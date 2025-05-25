document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'none';

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: form.email.value,
                password: form.password.value
            })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to dashboard on success
            window.location.href = data.redirectUrl;
        } else {
            // Show error message
            messageDiv.textContent = data.message || 'Login failed';
            messageDiv.style.color = 'red';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageDiv.textContent = 'An error occurred during login';
        messageDiv.style.color = 'red';
        messageDiv.style.display = 'block';
    }
});
