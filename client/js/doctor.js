const API_URL = 'http://localhost:5000/api/doctor';
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'doctor') {
  window.location.href = '../login.html';
}

// Common: Display User Info & Logout
const userInfoEl = document.getElementById('userInfo');
if (userInfoEl) userInfoEl.textContent = user.name;

const userNameEl = document.getElementById('userName');
if (userNameEl) userNameEl.textContent = user.name;

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('user');
  window.location.href = '../login.html';
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

// ---------------------------------------------------------
// DASHBOARD LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('dashboard.html')) {
  fetch(`${API_URL}/dashboard`, { headers })
    .then(res => res.json())
    .then(data => {
      document.getElementById('totalAppts').textContent = data.totalAppointments;
      document.getElementById('pendingAppts').textContent = data.pendingAppointments;
      document.getElementById('totalPatients').textContent = data.totalPatients;

      const activityList = document.getElementById('recentActivity');
      if (data.recentAppointments.length > 0) {
        activityList.innerHTML = data.recentAppointments.map(appt => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${appt.patient ? appt.patient.name : 'Unknown Patient'}</div> <!-- Handle populated field safely -->
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${new Date(appt.date).toLocaleDateString()} - ${appt.time}</div>
                        </div>
                        <span class="badge badge-${appt.status === 'pending' ? 'warning' : appt.status === 'approved' ? 'success' : 'danger'}">${appt.status}</span>
                    </div>
                `).join('');
      } else {
        activityList.innerHTML = '<p style="color: var(--text-secondary);">No upcoming appointments.</p>';
      }
    })
    .catch(err => console.error(err));
}

// ---------------------------------------------------------
// APPOINTMENTS LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('appointments.html')) {
  const loadAppointments = () => {
    fetch(`${API_URL}/appointments`, { headers })
      .then(res => res.json())
      .then(appts => {
        const list = document.getElementById('appointmentsList');
        if (appts.length === 0) {
          list.innerHTML = '<p>No appointments found.</p>';
          return;
        }
        list.innerHTML = appts.map(appt => `
                    <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem;">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.2rem;">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0;">${appt.patient ? appt.patient.name : 'Unknown'}</h4>
                                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${new Date(appt.date).toLocaleDateString()} at ${appt.time}</p>
                                <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${appt.reason}</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="badge badge-${appt.status === 'pending' ? 'warning' : appt.status === 'approved' ? 'success' : 'danger'}" style="margin-right: 1rem;">${appt.status}</span>
                            ${appt.status === 'pending' ? `
                                <button onclick="updateStatus('${appt._id}', 'approved')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Approve</button>
                                <button onclick="updateStatus('${appt._id}', 'rejected')" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-color: #ef4444; color: #ef4444;">Reject</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
      });
  };
  loadAppointments();

  window.updateStatus = (id, status) => {
    fetch(`${API_URL}/appointments/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    })
      .then(res => {
        if (res.ok) {
          loadAppointments();
        } else {
          alert('Error updating status');
        }
      });
  };
}

// ---------------------------------------------------------
// PATIENTS & RECORDS LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('patients.html')) {
  // 1. Load Patients for Select and List
  fetch(`${API_URL}/patients`, { headers })
    .then(res => res.json())
    .then(patients => {
      const select = document.getElementById('patient');
      const list = document.getElementById('patientsList');

      select.innerHTML = '<option value="">Select Patient</option>' +
        patients.map(pat => `<option value="${pat._id}">${pat.name}</option>`).join('');

      if (patients.length === 0) {
        list.innerHTML = '<p>No patients found.</p>';
      } else {
        list.innerHTML = patients.map(pat => `
                    <div class="card" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1rem;">${pat.name}</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${pat.email}</p>
                        </div>
                    </div>
                `).join('');
      }
    });

  // 2. Add Record Handler
  document.getElementById('recordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = document.getElementById('patient').value;
    const diagnosis = document.getElementById('diagnosis').value;
    const prescription = document.getElementById('prescription').value;
    const labResults = document.getElementById('labResults').value;

    fetch(`${API_URL}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ patientId, diagnosis, prescription, labResults })
    })
      .then(res => {
        if (res.ok) {
          alert('Medical Record Added Successfully');
          e.target.reset();
        } else {
          alert('Error adding record');
        }
      });
  });
}
