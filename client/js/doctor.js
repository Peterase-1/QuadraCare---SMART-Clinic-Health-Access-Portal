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
                            ${appt.status === 'approved' ? `
                                <button onclick="startConsultation('${appt.patient._id}', '${appt.patient.name}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Start Consultation</button>
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

  document.getElementById('consultationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = document.getElementById('consultPatientId').value;
    const age = document.getElementById('patientAge').value;
    const weight = document.getElementById('patientWeight').value;
    const bp = document.getElementById('patientBP').value;
    const symptoms = document.getElementById('patientSymptoms').value;
    const action = document.getElementById('consultAction').value;

    const payload = {
      patientId,
      patientDetails: { age, weight, bloodPressure: bp, symptoms },
      labRequest: null
    };

    if (action === 'lab') {
      payload.labRequest = {
        required: true,
        testType: document.getElementById('labTestType').value,
        assignedTo: null // In a real app, select a lab tech
      };
    }

    fetch(`${API_URL}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          alert('Consultation Started. ' + (action === 'lab' ? 'Sent to Lab.' : 'Proceed to Prescription.'));
          closeModal();
          e.target.reset();
          // In a real app, redirect to a "Consultation Active" page or refresh
        } else {
          alert('Error starting consultation');
        }
      });
  });
}

// Global Modal Functions
window.startConsultation = (patientId, patientName) => {
  document.getElementById('consultPatientId').value = patientId;
  const modal = document.getElementById('consultationModal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
};

window.closeModal = () => {
  const modal = document.getElementById('consultationModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};

// ---------------------------------------------------------
// PATIENTS & RECORDS LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('patients.html')) {
  // 1. Load Active Cases (Reviews)
  const loadActiveCases = () => {
    fetch(`${API_URL}/records/active`, { headers })
      .then(res => res.json())
      .then(records => {
        const list = document.getElementById('reviewsList');
        if (records.length === 0) {
          list.innerHTML = '<p>No active cases.</p>';
          return;
        }
        list.innerHTML = records.map(r => `
          <div class="card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h4 style="margin: 0;">${r.patient ? r.patient.name : 'Unknown'}</h4>
                <span class="badge badge-${r.status === 'review' ? 'warning' : 'info'}">${r.status === 'review' ? 'Lab Finished' : r.status}</span>
              </div>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">
                ${r.labRequest && r.labRequest.required ? `Lab: ${r.labRequest.testType}` : 'Consultation'}
              </p>
            </div>
            ${r.status === 'review' || r.status === 'consultation' ? `
              <button onclick='openFinalizeModal(${JSON.stringify(r)})' class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                <i class="fa-solid fa-clipboard-check"></i> Finalize
              </button>
            ` : `
              <button disabled class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; opacity: 0.6;">Waiting...</button>
            `}
          </div>
        `).join('');
      });
  };
  loadActiveCases();

  // 2. Load Patients Directory (Keep existing logic simplified)
  fetch(`${API_URL}/patients`, { headers })
    .then(res => res.json())
    .then(patients => {
      const list = document.getElementById('patientsList');
      if (list) {
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

  // 3. Finalize Modal Handler
  window.openFinalizeModal = (record) => {
    document.getElementById('finalizeRecordId').value = record._id;

    // Show Lab Results
    const labDisplay = document.getElementById('displayLabResults');
    const labComments = document.getElementById('displayLabComments');

    if (record.labResults && record.labResults.resultData) {
      labDisplay.textContent = record.labResults.resultData;
      labDisplay.style.color = 'var(--text-main)';
      labComments.textContent = record.labResults.comments ? `Note: ${record.labResults.comments}` : '';
    } else {
      labDisplay.textContent = 'No Lab Results (Direct Consultation)';
      labDisplay.style.color = 'var(--text-secondary)';
      labComments.textContent = '';
    }

    const modal = document.getElementById('finalizeModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
  };

  // 4. Submit Finalize
  document.getElementById('finalizeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('finalizeRecordId').value;
    const diagnosis = document.getElementById('finalDiagnosis').value;
    const instructions = document.getElementById('finalInstructions').value;

    // Gather Medicines
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
      medicines.push({
        name: item.querySelector('.med-name').value,
        dosage: item.querySelector('.med-dosage').value,
        frequency: item.querySelector('.med-freq').value,
        duration: item.querySelector('.med-dur').value,
        route: item.querySelector('.med-route').value,
        timing: item.querySelector('.med-timing').value,
        notes: item.querySelector('.med-notes').value
      });
    });
  });

  const payload = {
    diagnosis,
    prescription: {
      medicines,
      instructions
    }
  };

  fetch(`${API_URL}/records/${id}/finalize`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(updatedRecord => {
      alert('Consultation Finalized!');
      closeFinalizeModal();
      loadActiveCases();

      // Show Print Preview
      showPrintPreview(updatedRecord);
    })
    .catch(err => alert('Error finalizing: ' + err.message));
};

// 5. Print Preview Logic
window.showPrintPreview = (record) => {
  const printArea = document.getElementById('printArea');
  const medicinesHtml = record.prescription.medicines.map(m => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.dosage}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.frequency}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.duration}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.route}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.timing}</td>
      </tr>
      ${m.notes ? `<tr><td colspan="6" style="padding: 4px 8px; color: #666; font-size: 0.85rem; border-bottom: 1px solid #eee;">Note: ${m.notes}</td></tr>` : ''}
      </tr>
    `).join('');

  printArea.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: var(--primary-color); margin: 0;">QuadraCare Medical Center</h1>
        <p style="color: var(--text-secondary);">Excellence in Healthcare</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem;">
        <div>
          <strong>Patient:</strong> ${record.patientDetails ? record.patientDetails.age : ''} yrs / ${record.patientDetails ? record.patientDetails.weight : ''}<br>
          <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <div style="text-align: right;">
          <strong>Dr. ${user.name}</strong><br>
          General Physician
        </div>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">Diagnosis</h3>
        <p>${record.diagnosis}</p>
      </div>

      <div style="margin-bottom: 2rem;">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">Rx (Prescription)</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; background: #f8fafc;">
              <th style="padding: 8px;">Medicine</th>
              <th style="padding: 8px;">Dosage</th>
              <th style="padding: 8px;">Freq</th>
              <th style="padding: 8px;">Duration</th>
              <th style="padding: 8px;">Route</th>
              <th style="padding: 8px;">Timing</th>
            </tr>
          </thead>
          <tbody>
            ${medicinesHtml}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 0.5rem;">Instructions</h3>
        <p>${record.prescription.instructions || 'None'}</p>
      </div>
      
      <div style="margin-top: 4rem; text-align: right;">
        <p>_______________________</p>
        <p>Doctor's Signature</p>
      </div>
    `;

  const modal = document.getElementById('printModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);

  // Store record ID for closing
  modal.dataset.recordId = record._id;
};

window.closeCase = () => {
  const modal = document.getElementById('printModal');
  const recordId = modal.dataset.recordId;

  if (!recordId) return;

  fetch(`${API_URL}/records/${recordId}/close`, {
    method: 'PUT',
    headers
  })
    .then(res => {
      if (res.ok) {
        alert('Case Closed Successfully');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
        loadActiveCases(); // Refresh list
      } else {
        alert('Error closing case');
      }
    });
};

