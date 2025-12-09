const API_URL = `${window.getApiBaseUrl()}/labtech`;
const user = JSON.parse(localStorage.getItem('user'));

checkAuth('lab_tech');

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
                    <div class="lab-queue-item">
                        <div class="lab-queue-details">
                            <div class="lab-patient-header">
                                <h4 class="lab-patient-name">${r.patient ? r.patient.name : 'Unknown Patient'}</h4>
                                <span class="badge badge-${r.status === 'lab_test' ? 'warning' : 'success'}">${r.status === 'lab_test' ? 'Pending' : 'Completed'}</span>
                            </div>
                            <p class="lab-test-info">
                                <strong>Test:</strong> ${r.labRequest ? r.labRequest.testType : 'N/A'}
                            </p>
                            <p class="lab-desc-box">
                                ${r.labRequest && r.labRequest.requestDescription ? r.labRequest.requestDescription : 'No details provided.'}
                            </p>
                            <p class="lab-meta-info">
                                Dr. ${r.doctor ? r.doctor.name : 'Unknown'} • ${new Date(r.date).toLocaleDateString()}
                            </p>
                            <button onclick='viewRequestDetails(${JSON.stringify(r.labRequest || {})})' class="btn btn-outline btn-lab-details">
                                <i class="fa-solid fa-eye"></i> View Full Details
                            </button>
                        </div>
                        ${r.status === 'lab_test' ? `
                            <button onclick="uploadResult('${r._id}')" class="btn btn-primary btn-lab-action">
                                <i class="fa-solid fa-upload"></i> Enter Results
                            </button>
                        ` : `
                            <button disabled class="btn btn-outline btn-lab-completed">
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
