if (!localStorage.getItem('user')) window.location.href = 'index.html';

const dormForm = document.getElementById('dormForm');
const assignForm = document.getElementById('assignForm');
const assignStudent = document.getElementById('assignStudent');
const assignDorm = document.getElementById('assignDorm');
const tableBody = document.getElementById('dormTable').querySelector('tbody');

// === LOAD DATA ===
async function loadDormsAndStudents() {
  try {
    const [dormsRes, studentsRes, assignmentsRes] = await Promise.all([
      fetch('http://127.0.0.1:5000/api/dorms').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/students').then(r => r.json()),
      fetch('http://127.0.0.1:5000/api/assignments').then(r => r.json())
    ]);

    // Update dorm list
    tableBody.innerHTML = '';
    dormsRes.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.capacity}</td>
        <td>${d.occupied}</td>
        <td>${d.available}</td>
        <td>${d.gender}</td>
        <td><button class="delete-btn" data-name="${d.name}">Delete</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Populate dropdowns
    const unassignedStudents = studentsRes.filter(s =>
      !assignmentsRes.some(a => a.studentId === s.studentId)
    );

    assignStudent.innerHTML = '<option value="">Select Student</option>';
    assignDorm.innerHTML = '<option value="">Select Dormitory</option>';

    unassignedStudents.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.studentId;
      opt.textContent = `${s.name} (${s.studentId})`;
      assignStudent.appendChild(opt);
    });

    dormsRes.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.textContent = `${d.name} (${d.occupied}/${d.capacity}) - ${d.gender}`;
      assignDorm.appendChild(opt);
    });

    attachDeleteEvents();
  } catch (err) {
    console.error("Load error:", err);
    alert("Failed to load data. Is Flask running?");
  }
}

// === ADD DORM ===
dormForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('dormName').value.trim();
  const capacity = parseInt(document.getElementById('dormCapacity').value);
  const gender = document.getElementById('dormGender').value;

  if (!name || !capacity || !gender) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/dorms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, capacity, gender })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Dorm added!");
      dormForm.reset();
      loadDormsAndStudents();
    } else {
      alert("❌ " + (data.error || "Save failed"));
    }
  } catch (err) {
    alert("Connection failed. Is Flask running?");
  }
});

// === ASSIGN STUDENT ===
assignForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const studentId = assignStudent.value;
  const dormName = assignDorm.value;

  if (!studentId || !dormName) {
    alert("Select both student and dorm");
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, dormName })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Assigned!");
      assignForm.reset();
      loadDormsAndStudents();
    } else {
      alert("❌" + (data.error || "Assign failed"));
    }
  } catch (err) {
    alert("Connection failed. Is Flask running?");
  }
});

// === DELETE DORM ===
function attachDeleteEvents() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const name = this.getAttribute('data-name');
      if (!confirm(`Delete dormitory ${name}?`)) return;
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/dorms/${name}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert("Deleted!");
          loadDormsAndStudents();
        } else {
          alert("Delete failed");
        }
      } catch (err) {
        alert("Connection error");
      }
    });
  });
}

loadDormsAndStudents();