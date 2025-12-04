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
                            <div style="font-weight: 600;">${appt.patient && appt.patient.name ? appt.patient.name : 'Unknown Patient'}</div> <!-- Handle populated field safely -->
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
  // Initialize Calendar
  let calendar;
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      dayMaxEvents: true, // allow "more" link when too many events
      navLinks: true, // can click day/week names to navigate views
      events: [] // Will be populated
    });
    calendar.render();
  }

  const loadAppointments = () => {
    fetch(`${API_URL}/appointments`, { headers })
      .then(res => res.json())
      .then(appts => {
        const list = document.getElementById('appointmentsList');

        // Update Calendar Events
        if (calendar) {
          const events = appts
            .filter(a => a.status === 'approved')
            .map(a => ({
              title: a.patient ? a.patient.name : 'Unknown',
              start: `${a.date.split('T')[0]}T${a.time}`, // Combine date and time
              color: '#16a34a' // Green
            }));
          calendar.removeAllEvents();
          calendar.addEventSource(events);
        }

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
                                <h4 style="margin: 0;">${appt.patient && appt.patient.name ? appt.patient.name : 'Unknown'}</h4>
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
      .then(async res => {
        if (res.ok) {
          loadAppointments();
        } else {
          const data = await res.json();
          showToast(data.message || 'Error updating status');
        }
      })
      .catch(err => showToast('Error: ' + err.message));
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
        requestDescription: document.getElementById('labRequestDescription').value,
        assignedTo: null // In a real app, select a lab tech
      };
    }

    fetch(`${API_URL}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(record => {
        if (record._id) {
          closeModal();
          e.target.reset();

          if (action === 'lab') {
            showToast('Consultation Started. Sent to Lab.');
          } else {
            // Direct Prescription Flow
            // Open Finalize Modal immediately
            // We need to pass the record object to openFinalizeModal
            // But openFinalizeModal expects a record with populated fields?
            // The response 'record' might not be populated.
            // We can construct a minimal object or fetch it.
            // Let's try to use the record returned.
            // We need to define openFinalizeModal in appointments.html scope or global scope.
            // It is currently in patients.html logic block.
            // We should move openFinalizeModal to global scope or duplicate it.
            // Since we are in doctor.js, we can make it global.

            // Wait, openFinalizeModal is defined inside the patients.html block (line 230).
            // We need to move it out to be accessible here.
            // I will do that in a separate edit or assume I will move it.
            // For now, let's call it assuming it's available or I'll fix it.
            // Actually, I should define it globally.

            // Let's trigger it.
            openFinalizeModal(record);
          }
        } else {
          showToast('Error starting consultation');
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

  // 2. Load Patients Directory
  let currentPage = 1;
  const limit = 6; // Adjust limit as needed

  const loadPatients = (page = 1) => {
    fetch(`${API_URL}/patients?page=${page}&limit=${limit}`, { headers })
      .then(res => res.json())
      .then(data => {
        const { patients, total, pages } = data;
        currentPage = data.page;

        const list = document.getElementById('patientsList');
        const searchInput = document.getElementById('patientSearch');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        // Update Pagination Controls
        if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${pages || 1}`;
        if (prevBtn) {
          prevBtn.disabled = currentPage <= 1;
          prevBtn.onclick = () => loadPatients(currentPage - 1);
        }
        if (nextBtn) {
          nextBtn.disabled = currentPage >= pages;
          nextBtn.onclick = () => loadPatients(currentPage + 1);
        }

        const render = (filter = '') => {
          // Note: Client-side filtering only works on the current page of data with this implementation.
          // For full search, backend search is better. For now, we filter the fetched page.
          const filtered = patients.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.email.toLowerCase().includes(filter.toLowerCase()));

          if (filtered.length === 0) {
            list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No patients found.</p>';
            return;
          }

          list.innerHTML = filtered.map(p => `
                <div class="card" style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; transition: transform 0.2s; cursor: pointer;" onclick="viewPatientHistory('${p._id}')">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.2rem;">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.1rem;">${p.name}</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${p.email}</p>
                        </div>
                    </div>
                    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Click to view history</span>
                        <i class="fa-solid fa-chevron-right" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
                    </div>
                </div>
            `).join('');
        };

        render();

        if (searchInput) {
          // Re-attach listener to filter current page results
          // Ideally, search should trigger a backend call with ?search=...
          searchInput.oninput = (e) => render(e.target.value);
        }
      });
  };
  loadPatients();

  // View Patient History
  window.viewPatientHistory = (id) => {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');

    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
    }

    if (content) content.innerHTML = '<p>Loading history...</p>';

    fetch(`${API_URL}/patients/${id}/records`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          content.innerHTML = `<p style="color: red;">Error: ${data.message}</p>`;
          return;
        }
        const records = data;

        if (records.length === 0) {
          content.innerHTML = '<p>No medical history found for this patient.</p>';
          return;
        }

        content.innerHTML = records.map(r => `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span class="badge badge-${r.status === 'closed' ? 'success' : 'warning'}">${r.status.toUpperCase()}</span>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    ${r.diagnosis ? `<p><strong>Diagnosis:</strong> ${r.diagnosis}</p>` : ''}
                    ${r.prescription && r.prescription.medicines && r.prescription.medicines.length > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <strong>Prescription:</strong>
                            <ul style="margin: 0.5rem 0 0 1.5rem; color: var(--text-secondary);">
                                ${r.prescription.medicines.map(m => `<li>${m.name} - ${m.dosage} (${m.frequency})</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${r.labResults && r.labResults.resultData ? `
                        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1;">
                            <strong>Lab Results:</strong>
                            <p style="white-space: pre-wrap; margin: 0.25rem 0; font-size: 0.9rem;">${r.labResults.resultData}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('');
      })
      .catch(err => {
        content.innerHTML = `<p style="color: red;">Error loading history: ${err.message}</p>`;
      });
  };

  // 3. Finalize Modal Handler
  window.openFinalizeModal = (record) => {
    document.getElementById('finalizeRecordId').value = record._id;

    // Show Lab Results
    const labDisplay = document.getElementById('displayLabResults');
    const labComments = document.getElementById('displayLabComments');
    const labSection = document.getElementById('labResultsSection');

    if (record.labResults && record.labResults.resultData) {
      if (labDisplay) {
        labDisplay.textContent = record.labResults.resultData;
        labDisplay.style.color = 'var(--text-main)';
      }
      if (labComments) labComments.textContent = record.labResults.comments ? `Note: ${record.labResults.comments}` : '';
      if (labSection) labSection.style.display = 'block';
    } else {
      if (labDisplay) {
        labDisplay.textContent = 'No Lab Results (Direct Consultation)';
        labDisplay.style.color = 'var(--text-secondary)';
      }
      if (labComments) labComments.textContent = '';
      if (labSection) labSection.style.display = 'none'; // Hide if no results
    }

    const modal = document.getElementById('finalizeModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
    }
  };

  // 4. Submit Finalize
  const finalizeForm = document.getElementById('finalizeForm');
  if (finalizeForm) {
    finalizeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('finalizeRecordId').value;
      const diagnosis = document.getElementById('finalDiagnosis').value;
      const instructions = document.getElementById('finalInstructions').value;

      // Gather Medicines
      const medicines = [];
      document.querySelectorAll('.medicine-row').forEach(item => {
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
          showToast('Consultation Finalized!');
          closeFinalizeModal();
          if (typeof loadActiveCases === 'function') loadActiveCases();

          // Show Print Preview
          showPrintPreview(updatedRecord);
        })
        .catch(err => showToast('Error finalizing: ' + err.message));
    });
  }
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

// 6. AI Suggestion Logic
window.askAI = async () => {
  const recordId = document.getElementById('finalizeRecordId').value;
  if (!recordId) {
    showToast('Error: No record selected', 'error');
    return;
  }

  const btn = document.querySelector('button[onclick="askAI()"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';

  try {
    // 1. Fetch Record Details (to get symptoms, vitals, lab results)
    const recordRes = await fetch(`${API_URL}/records/${recordId}`, { headers });
    const record = await recordRes.json();

    if (!recordRes.ok) throw new Error(record.message || 'Failed to fetch record details');

    // 2. Prepare Payload for AI
    const payload = {
      symptoms: record.patientDetails ? record.patientDetails.symptoms : '',
      vitals: record.patientDetails ? {
        bloodPressure: record.patientDetails.bloodPressure,
        weight: record.patientDetails.weight,
        age: record.patientDetails.age
      } : {},
      labResults: record.labResults ? record.labResults : null
    };

    // 3. Call AI Service
    // Note: We need to call the AI route, which is under /api/ai, not /api/doctor
    // So we construct the URL manually or assume a global AI_URL
    const aiRes = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) throw new Error(aiData.message || 'AI generation failed');

    // 4. Populate Form
    document.getElementById('finalDiagnosis').value = aiData.diagnosis;

    // Populate Medicines
    const medicineList = document.getElementById('medicineList');
    medicineList.innerHTML = ''; // Clear existing

    aiData.medicines.forEach(med => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="medicine-row" style="margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; align-items: start;">
                <input type="text" class="form-input med-name" placeholder="Medicine Name" value="${med.name}" required>
                <input type="text" class="form-input med-dosage" placeholder="Dosage" value="${med.dosage}" required>
                <input type="text" class="form-input med-freq" placeholder="Freq" value="${med.frequency}" required>
                <input type="text" class="form-input med-dur" placeholder="Duration" value="${med.duration}" required>
                <input type="text" class="form-input med-route" placeholder="Route (Oral)" value="${med.route || 'Oral'}" required>
                <input type="text" class="form-input med-timing" placeholder="Timing (After Meal)" value="${med.timing || 'After Meal'}" required>
            </div>
            <div class="medicine-notes">
                <input type="text" class="form-input med-notes" placeholder="Notes (Optional)" value="${med.notes || ''}" style="font-size: 0.9rem;">
            </div>
        </div>
      `;
      medicineList.appendChild(container);
    });

    showToast('AI Suggestions Applied!', 'success');

  } catch (error) {
    console.error(error);
    showToast('AI Error: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
};

