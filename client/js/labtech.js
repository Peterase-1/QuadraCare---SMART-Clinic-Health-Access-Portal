const API_URL = 'http://localhost:5000/api/labtech';
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
                                <span class="badge badge-${r.labStatus === 'pending' ? 'warning' : 'success'}">${r.labStatus}</span>
                            </div>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                <strong>Diagnosis:</strong> ${r.diagnosis}
                            </p>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem;">
                                Dr. ${r.doctor ? r.doctor.name : 'Unknown'} • ${new Date(r.date).toLocaleDateString()}
                            </p>
                            ${r.labResults ? `<p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--primary-color);"><i class="fa-solid fa-link"></i> ${r.labResults}</p>` : ''}
                        </div>
                        ${r.labStatus === 'pending' ? `
                            <button onclick="uploadResult('${r._id}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                <i class="fa-solid fa-upload"></i> Upload Result
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
  window.uploadResult = (id) => {
    const resultUrl = prompt('Enter Lab Result URL or Summary:');
    if (resultUrl) {
      fetch(`${API_URL}/requests/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ labResults: resultUrl })
      })
        .then(res => {
          if (res.ok) {
            loadRequests();
            // Refresh stats
            fetch(`${API_URL}/dashboard`, { headers })
              .then(res => res.json())
              .then(data => {
                document.getElementById('pendingCount').textContent = data.pendingRequests;
                document.getElementById('completedCount').textContent = data.completedRequests;
              });
          } else {
            alert('Error uploading result');
          }
        });
    }
  };
}
