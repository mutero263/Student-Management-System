if (!localStorage.getItem('user')) {
  window.location.href = 'index.html';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// === FETCH ALL DATA FROM API ===
async function loadAnalytics() {
  try {
    const [studentsRes, subjectsRes, dormsRes, enrollmentsRes] = await Promise.all([
      fetch('http://127.0.0.1:5000/api/students').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/subjects').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/dorms').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/enrollments').then(r => r.json())
    ]);

    // Update metrics
    document.getElementById('totalStudents').textContent = studentsRes.length;
    document.getElementById('totalSubjects').textContent = subjectsRes.length;
    document.getElementById('totalDorms').textContent = dormsRes.length;
    document.getElementById('totalEnrollments').textContent = enrollmentsRes.length;

    // Load dorm occupancy
    loadDormAnalytics();
  } catch (err) {
    console.error('Failed to load analytics:', err);
    document.getElementById('totalStudents').textContent = '—';
    document.getElementById('totalSubjects').textContent = '—';
    document.getElementById('totalDorms').textContent = '—';
    document.getElementById('totalEnrollments').textContent = '—';
  }
}

// === DORM OCCUPANCY ANALYTICS ===
async function loadDormAnalytics() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/dorms');
    const dorms = await res.json();
    const container = document.getElementById('dorms-container');
    container.innerHTML = '';

    dorms.forEach(dorm => {
      const percent = dorm.occupied ? Math.round((dorm.occupied / dorm.capacity) * 100) : 0;
      const barColor = percent > 80 ? '#dc3545' : percent > 60 ? '#ffc107' : '#28a745';

      const card = `
        <div class="metric-card">
          <span class="icon"><i class="fas fa-bed"></i></span>
          <div class="content">
            <h3>${dorm.name}</h3>
            <div class="progress-bar">
              <div class="progress" style="width:${percent}%; background:${barColor}"></div>
            </div>
            <p>${percent}%</p>
            <small>${dorm.occupied} of ${dorm.capacity} occupied</small>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
  } catch (err) {
    console.error('Failed to load dorm analytics:', err);
  }
}

loadAnalytics();