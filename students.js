console.log('students.js loaded');

if (!localStorage.getItem('user')) {
    console.log('Not logged in, redirecting...');
    window.location.href = 'index.html';
}

const studentForm = document.getElementById('studentForm');
const tableBody = document.getElementById('studentTable')?.querySelector('tbody');

if (!studentForm) {
    console.error('Could not find #studentForm');
}
if (!tableBody) {
    console.error('Could not find #studentTable tbody');
}

let editingId = null;

// === LOAD STUDENTS ===
async function loadStudents() {
    console.log('🔍 Starting loadStudents...');
    try {
        const res = await fetch('http://127.0.0.1:5000/api/students');
        console.log('📡 Response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const students = await res.json();
        console.log('Students loaded:', students);

        tableBody.innerHTML = '';
        students.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.studentId}</td>
                <td>${s.email}</td>
                <td>${s.gender}</td>
                <td>
                    <button class="edit-btn" data-id="${s.studentId}">Edit</button>
                    <button class="delete-btn" data-id="${s.studentId}">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        attachEvents();
    } catch (err) {
        console.error('Load failed:', err);
        alert('Failed to load students. Is Flask running?');
    }
}

// === FORM SUBMIT ===
console.log('Attaching submit event...');
studentForm?.addEventListener('submit', async function(e) {
    console.log('Form submitted!');  
    e.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const studentId = document.getElementById('studentId')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const gender = document.getElementById('gender')?.value;

    if (!name || !studentId || !email || !gender) {
        alert('All fields are required');
        return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
        ? `http://127.0.0.1:5000/api/students/${editingId}`
        : 'http://127.0.0.1:5000/api/students';

    console.log('Sending to:', method, url);
    console.log('Data:', { name, studentId, email, gender });

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, studentId, email, gender })
        });

        console.log('Response:', res.status, res.statusText);

        if (res.ok) {
            alert(`Student ${editingId ? 'updated' : 'added'}!`);
            studentForm.reset();
            editingId = null;
            document.getElementById('studentId').readOnly = false;
            loadStudents();
        } else {
            const data = await res.json();
            alert('❌ ' + (data.error || 'Save failed'));
        }
    } catch (err) {
        console.error('❌ Network error:', err);
        alert('Could not connect to server. Is Flask running?');
    }
});

function attachDeleteEvents() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            console.log('Delete clicked:', this.getAttribute('data-id'));
            const id = this.getAttribute('data-id');
            if (!confirm(`Delete student ${id}?`)) return;

            try {
                const res = await fetch(`http://127.0.0.1:5000/api/students/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    alert('Deleted!');
                    loadStudents();
                } else {
                    alert('Delete failed');
                }
            } catch (err) {
                alert('Connection error');
            }
        });
    });
}

function attachEditEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Edit clicked:', this.getAttribute('data-id'));
            const id = this.getAttribute('data-id');
            const row = this.closest('tr');
            const cells = row.querySelectorAll('td');

            document.getElementById('name').value = cells[0].textContent;
            document.getElementById('studentId').value = cells[1].textContent;
            document.getElementById('studentId').readOnly = true;
            document.getElementById('email').value = cells[2].textContent;
            document.getElementById('gender').value = cells[3].textContent;
            editingId = id;
        });
    });
}

function attachEvents() {
    attachDeleteEvents();
    attachEditEvents();
}

loadStudents();