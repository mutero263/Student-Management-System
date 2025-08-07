if (!localStorage.getItem('user')) window.location.href = 'index.html';

const subjectForm = document.getElementById('subjectForm');
const subjectTable = document.getElementById('subjectTable').querySelector('tbody');
const studentSelect = document.getElementById('studentSelect');
const subjectSelect = document.getElementById('subjectSelect');
const enrollmentList = document.getElementById('enrollmentList');
const enrollBtn = document.getElementById('enrollBtn');

async function loadSubjects() {
  try {
    const [subjectsRes, enrollmentsRes, studentsRes] = await Promise.all([
      fetch('http://127.0.0.1:5000/api/subjects').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/enrollments').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/students').then(r => r.json())
    ]);

    // Render subjects
    subjectTable.innerHTML = '';
    subjectsRes.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.code}</td>
        <td>${s.enrolled}</td>
        <td>
          <button class="delete-btn" data-code="${s.code}">Delete</button>
        </td>
      `;
      subjectTable.appendChild(tr);
    });
    attachDeleteEvents();

    populateDropdowns(studentsRes, subjectsRes);
  } catch (err) {
    console.error("Load error:", err);
    alert("Failed to load data. Is server running?");
  }
}

// === ADD SUBJECT ===
subjectForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('subjectName').value.trim();
  const code = document.getElementById('subjectCode').value.trim();

  if (!name || !code) {
    alert("Name and code required");
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code })
    });
    const data = await res.json();
    if (res.ok) {
      subjectForm.reset();
      loadSubjects();
    } else {
      alert("Error: " + (data.error || "Unknown"));
    }
  } catch (err) {
    alert("Server connection failed");
  }
});

function populateDropdowns(students, subjects) {
  studentSelect.innerHTML = '<option value="">Select Student</option>';
  subjectSelect.innerHTML = '<option value="">Select Subject</option>';

  students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.studentId;
    opt.textContent = s.name;
    studentSelect.appendChild(opt);
  });

  subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.code;
    opt.textContent = s.name;
    subjectSelect.appendChild(opt);
  });
}

// === ENROLL STUDENT ===
enrollBtn.addEventListener('click', async () => {
  const studentId = studentSelect.value;
  const subjectCode = subjectSelect.value;

  if (!studentId || !subjectCode) {
    return alert("Select both student and subject");
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subjectCode })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Enrolled successfully!");
      loadEnrollments();
    } else {
      alert("❌ " + (data.error || "Enroll failed"));
    }
  } catch (err) {
    alert("Connection failed. Is Flask running?");
  }
});

// === LOAD ENROLLMENTS ===
async function loadEnrollments() {
  try {
    const [enrollments, students, subjects] = await Promise.all([
      fetch('http://127.0.0.1:5000/api/enrollments').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/students').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/subjects').then(r => r.json())
    ]);

    enrollmentList.innerHTML = '';
    const studentMap = Object.fromEntries(students.map(s => [s.studentId, s.name]));
    const subjectMap = Object.fromEntries(subjects.map(s => [s.code, s.name]));

    enrollments.forEach(e => {
      const li = document.createElement('li');
      li.textContent = `${studentMap[e.studentId] || 'Unknown'} → ${subjectMap[e.subjectCode] || 'Unknown'}`;
      enrollmentList.appendChild(li);
    });
  } catch (err) {
    console.error("Load enrollments error:", err);
  }
}

// === DELETE SUBJECT ===
function attachDeleteEvents() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const code = this.getAttribute('data-code');
      if (!confirm(`Delete subject "${code}" and all enrollments?`)) return;

      try {
        const res = await fetch(`http://127.0.0.1:5000/api/subjects/${code}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert("Subject deleted");
          loadSubjects();
        } else {
          alert("Delete failed");
        }
      } catch (err) {
        alert("Connection error");
      }
    });
  });
}

loadSubjects();
loadEnrollments();