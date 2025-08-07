function showAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.right = '20px';
    alertBox.style.padding = '15px';
    alertBox.style.borderRadius = '8px';
    alertBox.style.color = 'white';
    alertBox.style.fontFamily = 'Arial, sans-serif';
    alertBox.style.fontSize = '14px';
    alertBox.style.zIndex = '1000';
    alertBox.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    alertBox.textContent = message;

    if (type === 'success') alertBox.style.backgroundColor = '#4CAF50';
    else if (type === 'error') alertBox.style.backgroundColor = '#f44336';
    else alertBox.style.backgroundColor = '#2196F3';

    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.remove();
    }, 4000);
}

function alertMe() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    document.querySelectorAll('input').forEach(input => {
        input.style.border = '1px solid #ccc';
    });

    // Validation
    if (!username) {
        document.getElementById('username').style.border = '2px solid red';
        showAlert('Username required.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').style.border = '2px solid red';
        showAlert('Valid email required.', 'error');
        return;
    }

    if (!password || password.length < 6) {
        document.getElementById('password').style.border = '2px solid red';
        showAlert('Password too short.', 'error');
        return;
    }

    // Disable button
    const btn = document.getElementById('submit');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    // SEND TO LOCALHOST:5000
    fetch('http://127.0.0.1:5000/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showAlert('Success! Redirecting...', 'success');
            document.getElementById('myForm').reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert('❌ ' + data.message, 'error');
        }
    })
    .catch(err => {
        console.error('Error:', err);
        showAlert('⚠️ Failed to connect. Is Flask running?', 'error');
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Submit';
    });
}

// Prevent default form submission
document.getElementById('myForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alertMe();
});