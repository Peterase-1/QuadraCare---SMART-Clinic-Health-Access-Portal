const API_URL = 'http://localhost:5000/api/patient';
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'patient') {
  window.location.href = '../login.html';
}

// Common: Display User Info & Logout
document.getElementById('userInfo').textContent = user.name;
if (document.getElementById('userName')) document.getElementById('userName').textContent = user.name;

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('user');
  window.location.href = '../login.html';
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

// Dashboard Logic
if (window.location.pathname.includes('dashboard.html')) {
  fetch(`${API_URL}/dashboard`, { headers })
    .then(res => res.json())
    .then(data => {
      document.getElementById('totalAppts').textContent = data.totalAppointments;
      document.getElementById('pendingAppts').textContent = data.pendingAppointments;
      document.getElementById('totalRecords').textContent = data.totalRecords;

      const activityList = document.getElementById('recentActivity');
      if (data.recentAppointments.length > 0) {
        activityList.innerHTML = data.recentAppointments.map(appt => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                        <strong>${new Date(appt.date).toLocaleDateString()}</strong> - ${appt.reason} 
                        <span style="float: right; color: var(--primary-color);">${appt.status}</span>
                    </div>
                `).join('');
      } else {
        activityList.innerHTML = '<p>No recent activity.</p>';
      }
    })
    .catch(err => console.error(err));
}

// Appointments Logic
if (window.location.pathname.includes('appointments.html')) {
  // Load Doctors
  fetch(`${API_URL}/doctors`, { headers })
    .then(res => res.json())
    .then(doctors => {
      const select = document.getElementById('doctor');
      select.innerHTML = '<option value="">Select Doctor</option>' +
        doctors.map(doc => `<option value="${doc._id}">${doc.name}</option>`).join('');
    });

  // Load Appointments
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
                    <div class="appt-card">
                        <div>
                            <h3>${appt.doctor.name}</h3>
                            <p>${new Date(appt.date).toLocaleDateString()} at ${appt.time}</p>
                            <p style="color: var(--text-dim);">${appt.reason}</p>
                        </div>
                        <span class="status-badge status-${appt.status}">${appt.status}</span>
                    </div>
                `).join('');
      });
  };
  loadAppointments();

  // Book Appointment
  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const doctorId = document.getElementById('doctor').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const reason = document.getElementById('reason').value;

    fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ doctorId, date, time, reason })
    })
      .then(res => {
        if (res.ok) {
          alert('Appointment Booked Successfully');
          loadAppointments();
          e.target.reset();
        } else {
          alert('Error booking appointment');
        }
      });
  });
}

// Records Logic
if (window.location.pathname.includes('records.html')) {
  fetch(`${API_URL}/records`, { headers })
    .then(res => res.json())
    .then(records => {
      const list = document.getElementById('recordsList');
      if (records.length === 0) {
        list.innerHTML = '<p>No medical records found.</p>';
        return;
      }
      list.innerHTML = records.map(rec => `
                <div class="record-card">
                    <div class="record-header">
                        <h3>${rec.diagnosis}</h3>
                        <span class="record-date">${new Date(rec.date).toLocaleDateString()}</span>
                    </div>
                    <p><strong>Doctor:</strong> ${rec.doctor.name}</p>
                    <p><strong>Prescription:</strong> ${rec.prescription}</p>
                    ${rec.labResults ? `<p><a href="${rec.labResults}" target="_blank" style="color: var(--primary-color);">View Lab Results</a></p>` : ''}
                </div>
            `).join('');
    });
}
