document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    // Clear previous error
    error.textContent = '';

    // Show button loading state
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Logging in...';

    // DEBUG: Log what we're sending
    console.log(' Login Attempt:');
    console.log('Username:', username);
    console.log('Password length:', password.length);
    console.log('Sending to:', 'http://127.0.0.1:5000/login');

    // Prevent empty submission
    if (!username || !password) {
        error.textContent = 'Username and password are required.';
        button.disabled = false;
        button.textContent = originalText;
        return;
    }

    // Send login request
    fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(res => {
        // DEBUG: Check response status
        console.log(' Response Status:', res.status, res.statusText);
        if (!res.ok) {
            console.error('HTTP Error:', res.status, res.statusText);
        }
        return res.json();
    })
    .then(data => {
        //  DEBUG: Log full response
        console.log(' Response from server:', data);

        if (data.success) {
            // Save to localStorage
            localStorage.setItem('user', username);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);
            console.log('Login successful! Redirecting...');
            window.location.href = 'dashboard.html';
        } else {
            // Show server message
            error.textContent = data.message || 'Invalid credentials!';
            console.warn('Login failed:', data.message);
        }
    })
    .catch(err => {
        // CATCH  ERRORS
        console.error('Critical Error:', err);

        // More detailed error context
        if (err.name === 'TypeError') {
            error.textContent = 'Failed to connect to server. Is Flask running?';
        } else {
            error.textContent = 'Error: ' + err.message;
        }
    })
    .finally(() => {
        // Restore button
        button.disabled = false;
        button.textContent = originalText;
    });
});