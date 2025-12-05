const API_URL = `${window.getApiBaseUrl()}/admin`;
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'admin') {
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
      document.getElementById('totalUsers').textContent = data.totalUsers;
      document.getElementById('totalAppts').textContent = data.totalAppointments;
      document.getElementById('activeDoctors').textContent = data.doctors;
      document.getElementById('totalPatients').textContent = data.patients;
    })
    .catch(err => console.error(err));
}

// ---------------------------------------------------------
// USER MANAGEMENT LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('users.html')) {
  const loadUsers = () => {
    fetch(`${API_URL}/users`, { headers })
      .then(res => res.json())
      .then(users => {
        const list = document.getElementById('usersList');
        if (users.length === 0) {
          list.innerHTML = '<p>No users found.</p>';
          return;
        }
        list.innerHTML = users.map(u => `
                    <div class="card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
                                <i class="fa-solid fa-${u.role === 'admin' ? 'user-shield' : u.role === 'doctor' ? 'user-doctor' : 'user'}"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 1rem;">${u.name}</h4>
                                <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${u.email} <span class="badge badge-success" style="margin-left: 0.5rem; font-size: 0.7rem;">${u.role}</span></p>
                            </div>
                        </div>
                        ${u._id !== user._id ? `
                            <button onclick="deleteUser('${u._id}')" class="btn btn-outline" style="padding: 0.5rem; border-color: #ef4444; color: #ef4444;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('');
      });
  };
  loadUsers();

  // Add User
  document.getElementById('addUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    fetch(`${API_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, email, password, role })
    })
      .then(res => {
        if (res.ok) {
          showToast('User Created Successfully');
          loadUsers();
          e.target.reset();
        } else {
          res.json().then(data => showToast(data.message || 'Error creating user'));
        }
      });
  });

  // Delete User
  window.deleteUser = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers
      })
        .then(res => {
          if (res.ok) {
            loadUsers();
          } else {
            showToast('Error deleting user');
          }
        });
    }
  };
}
