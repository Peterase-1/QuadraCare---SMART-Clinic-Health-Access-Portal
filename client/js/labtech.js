const API_URL = `${window.getApiBaseUrl()}/labtech`;
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'lab_tech') {
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
  // 1. Get Stats
  fetch(`${API_URL}/dashboard`, { headers })
    .then(res => res.json())
    .then(data => {
      document.getElementById('pendingCount').textContent = data.pendingRequests;
      document.getElementById('completedCount').textContent = data.completedRequests;
    })
    .catch(err => console.error(err));

  // 2. Get Requests List
  const loadRequests = () => {
    fetch(`${API_URL}/requests`, { headers })
      .then(res => res.json())
      .then(requests => {
        const list = document.getElementById('requestsList');
        if (requests.length === 0) {
          list.innerHTML = '<p>No lab requests found.</p>';
          return;
        }
        list.innerHTML = requests.map(r => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <h4 style="margin: 0;">${r.patient ? r.patient.name : 'Unknown Patient'}</h4>
                                <span class="badge badge-${r.status === 'lab_test' ? 'warning' : 'success'}">${r.status === 'lab_test' ? 'Pending' : 'Completed'}</span>
                            </div>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                <strong>Test:</strong> ${r.labRequest ? r.labRequest.testType : 'N/A'}
                            </p>
                            <p style="margin: 0.5rem 0 0 0; color: var(--text-main); font-size: 0.9rem; background: #f8fafc; padding: 0.5rem; border-radius: 4px;">
                                ${r.labRequest && r.labRequest.requestDescription ? r.labRequest.requestDescription : 'No details provided.'}
                            </p>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem;">
                                Dr. ${r.doctor ? r.doctor.name : 'Unknown'} • ${new Date(r.date).toLocaleDateString()}
                            </p>
                            <button onclick='viewRequestDetails(${JSON.stringify(r.labRequest || {})})' class="btn btn-outline" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                <i class="fa-solid fa-eye"></i> View Full Details
                            </button>
                        </div>
                        ${r.status === 'lab_test' ? `
                            <button onclick="uploadResult('${r._id}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                <i class="fa-solid fa-upload"></i> Enter Results
                            </button>
                        ` : `
                            <button disabled class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; opacity: 0.6; cursor: not-allowed;">
                                Completed
                            </button>
                        `}
                    </div>
                `).join('');
      });
  };
  loadRequests();

  // Upload Result Handler
  // Open Modal Handler
  window.uploadResult = (id) => {
    document.getElementById('labRecordId').value = id;
    const modal = document.getElementById('labResultModal');
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  };

  // Form Submit Handler
  const labForm = document.getElementById('labResultForm');
  if (labForm) {
    labForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('labRecordId').value;
      const resultData = document.getElementById('labResultData').value;
      const comments = document.getElementById('labComments').value;

      const payload = {
        resultData,
        comments,
        bloodPressure: document.getElementById('labBP').value,
        temperature: document.getElementById('labTemp').value,
        heartRate: document.getElementById('labHR').value,
        bloodSugar: document.getElementById('labSugar').value,
        cholesterol: document.getElementById('labCholesterol').value,
        wbc: document.getElementById('labWBC').value,
        hemoglobin: document.getElementById('labHemoglobin').value
      };

      fetch(`${API_URL}/requests/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (res.ok) {
            showToast('Results Uploaded Successfully');
            closeLabModal();
            loadRequests();
            // Refresh stats
            fetch(`${API_URL}/dashboard`, { headers })
              .then(res => res.json())
              .then(data => {
                document.getElementById('pendingCount').textContent = data.pendingRequests;
                document.getElementById('completedCount').textContent = data.completedRequests;
              });
            e.target.reset();
          } else {
            showToast('Error uploading result');
          }
        });
    });
  }
}

// View Details Handler
window.viewRequestDetails = (labRequest) => {
  document.getElementById('detailsTestType').textContent = labRequest.testType || 'N/A';
  document.getElementById('detailsDescription').textContent = labRequest.requestDescription || 'No additional instructions provided.';

  const modal = document.getElementById('labRequestDetailsModal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
};
