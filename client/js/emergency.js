const API_URL = window.getApiBaseUrl();
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'emergency') {
  window.location.href = '../login.html';
}

// Display User Info & Logout
document.getElementById('userName').textContent = user.name;
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('user');
  window.location.href = '../login.html';
});

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

// Load Requests
const loadRequests = () => {
  fetch(`${API_URL}/emergency/requests`, { headers })
    .then(res => res.json())
    .then(requests => {
      const list = document.getElementById('requestsList');
      if (requests.length === 0) {
        list.innerHTML = '<p>No active requests.</p>';
        return;
      }

      list.innerHTML = requests.map(req => `
        <div class="card" style="border-left: 5px solid ${req.urgency === 'Critical' ? '#ef4444' : '#f59e0b'}; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                ${req.patient.name}
                <span class="badge badge-${req.urgency === 'Critical' ? 'danger' : 'warning'}">${req.urgency}</span>
              </h4>
              <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                <i class="fa-solid fa-location-dot"></i> ${req.location}
              </p>
              <p style="font-size: 0.9rem; color: var(--text-secondary);">
                Requested: ${new Date(req.createdAt).toLocaleString()}
              </p>
              ${req.assignedDoctor ? `<p style="color: var(--primary-color); font-weight: 500;">Assigned to: Dr. ${req.assignedDoctor.name}</p>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${req.status === 'Pending' ? `
                <button class="btn btn-sm btn-primary" onclick="dispatchAmbulance('${req._id}')">Dispatch</button>
              ` : ''}
              ${req.status === 'Dispatched' ? `
                <button class="btn btn-sm btn-success" onclick="completeRequest('${req._id}')">Complete</button>
              ` : ''}
              ${!req.assignedDoctor ? `
                <button class="btn btn-sm btn-outline" onclick="openAssignModal('${req._id}')">Assign Doctor</button>
              ` : ''}
              <span class="badge badge-${req.status === 'Completed' ? 'success' : 'primary'}">${req.status}</span>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error(err));
};

// Actions
window.dispatchAmbulance = (id) => {
  if (!confirm('Dispatch ambulance for this request?')) return;
  updateStatus(id, 'Dispatched');
};

window.completeRequest = (id) => {
  if (!confirm('Mark this request as completed?')) return;
  updateStatus(id, 'Completed');
};

const updateStatus = (id, status) => {
  fetch(`${API_URL}/emergency/requests/${id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  }).then(() => loadRequests());
};


// Assign Doctor Modal
// Assign Doctor Modal
window.openAssignModal = (id) => {
  console.log('Opening modal for request:', id);
  document.getElementById('currentRequestId').value = id;
  const modal = document.getElementById('assignDoctorModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);

  // Load Doctors
  fetch(`${API_URL}/patient/doctors`, { headers })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch doctors');
      return res.json();
    })
    .then(doctors => {
      console.log('Doctors loaded:', doctors.length);
      const select = document.getElementById('doctorSelect');
      if (doctors.length === 0) {
        select.innerHTML = '<option value="">No doctors found</option>';
      } else {
        select.innerHTML = '<option value="">Select Doctor</option>' +
          doctors.map(doc => `<option value="${doc._id}">${doc.name}</option>`).join('');
      }
    })
    .catch(err => {
      console.error('Error loading doctors:', err);
      alert('Failed to load doctors list');
    });
};

window.closeAssignModal = () => {
  const modal = document.getElementById('assignDoctorModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};

document.getElementById('assignDoctorForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const requestId = document.getElementById('currentRequestId').value;
  const doctorId = document.getElementById('doctorSelect').value;

  fetch(`${API_URL}/emergency/requests/${requestId}/assign`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ doctorId })
  }).then(() => {
    closeAssignModal();
    loadRequests();
  });
});

// Initial Load
loadRequests();
setInterval(loadRequests, 30000); // Auto refresh every 30s
