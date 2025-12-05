const API_URL = `${window.getApiBaseUrl()}/pharmacist`;
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'pharmacist') {
  window.location.href = '../login.html';
}

// Common: Display User Info & Logout
const userInfoEl = document.getElementById('userInfo');
if (userInfoEl) userInfoEl.textContent = user.name;

const userNameEl = document.getElementById('userName');
if (userNameEl) userNameEl.textContent = user.name;

// Logout logic is handled by sidebar.js

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

// ---------------------------------------------------------
// DASHBOARD LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('dashboard.html')) {
  // 1. Get Stats
  fetch(`${API_URL}/dashboard`, { headers })
    .then(res => res.json())
    .then(data => {
      document.getElementById('pendingCount').textContent = data.pendingPrescriptions;
      document.getElementById('dispensedCount').textContent = data.dispensedPrescriptions;
    })
    .catch(err => console.error(err));

  // 2. Get Prescriptions List
  const loadPrescriptions = () => {
    fetch(`${API_URL}/prescriptions`, { headers })
      .then(res => res.json())
      .then(prescriptions => {
        const list = document.getElementById('prescriptionsList');
        if (prescriptions.length === 0) {
          list.innerHTML = '<p>No prescriptions found.</p>';
          return;
        }
        list.innerHTML = prescriptions.map(p => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <h4 style="margin: 0;">${p.patient ? p.patient.name : 'Unknown Patient'}</h4>
                                <span class="badge badge-${p.status === 'pharmacy' ? 'warning' : 'success'}">${p.status === 'pharmacy' ? 'Pending' : 'Dispensed'}</span>
                            </div>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                <strong>Diagnosis:</strong> ${p.diagnosis || 'N/A'}
                            </p>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem;">
                                Dr. ${p.doctor ? p.doctor.name : 'Unknown'} • ${new Date(p.date).toLocaleDateString()}
                            </p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="printPrescription('${p._id}')" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                <i class="fa-solid fa-print"></i> Print
                            </button>
                            ${p.status === 'pharmacy' ? `
                                <button onclick="dispense('${p._id}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                    <i class="fa-solid fa-check"></i> Dispense
                                </button>
                            ` : `
                                <button disabled class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; opacity: 0.6; cursor: not-allowed;">
                                    Dispensed
                                </button>
                            `}
                        </div>
                    </div>
                `).join('');
      });
  };
  loadPrescriptions();

  // Dispense Handler
  window.dispense = (id) => {
    if (confirm('Mark this prescription as dispensed?')) {
      fetch(`${API_URL}/prescriptions/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'completed' })
      })
        .then(res => {
          if (res.ok) {
            loadPrescriptions();
            // Refresh stats too
            fetch(`${API_URL}/dashboard`, { headers })
              .then(res => res.json())
              .then(data => {
                document.getElementById('pendingCount').textContent = data.pendingPrescriptions;
                document.getElementById('dispensedCount').textContent = data.dispensedPrescriptions;
              });
          } else {
            alert('Error updating status');
          }
        });
    }
  };

  // Print Handler (Mock)
  window.printPrescription = (id) => {
    // In a real app, this would open a PDF or a print-friendly page
    // For now, we'll just alert the details
    alert(`Printing Prescription ID: ${id}\n(This would open a PDF in a real app)`);
    window.print();
  };
}
