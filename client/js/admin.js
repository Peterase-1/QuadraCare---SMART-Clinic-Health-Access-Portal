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

// Logout logic is handled by sidebar.js

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

// ---------------------------------------------------------
// DASHBOARD LOGIC
// ---------------------------------------------------------
// ---------------------------------------------------------
// DASHBOARD LOGIC
// ---------------------------------------------------------
// ---------------------------------------------------------
// DOM LOADED WRAPPER
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin.js: DOM Content Loaded');

  // DASHBOARD
  if (document.getElementById('totalUsers')) {
    console.log('Admin.js: Dashboard detected');
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

  // USERS
  if (document.getElementById('usersList')) {
    console.log('Admin.js: Users detected');
    let currentPage = 1;
    const limit = 10;
    let totalPages = 1;

    const loadUsers = (page = 1, search = '') => {
      fetch(`${API_URL}/users?page=${page}&limit=${limit}&search=${search}`, { headers })
        .then(res => res.json())
        .then(response => {
          let users = [];
          if (Array.isArray(response)) {
            users = response;
            const btn = document.getElementById('loadMoreUsersBtn');
            if (btn) btn.style.display = 'none';
          } else {
            users = response.users;
            currentPage = response.currentPage;
            totalPages = response.totalPages;

            const btn = document.getElementById('loadMoreUsersBtn');
            if (btn) {
              btn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
            }
          }

          const list = document.getElementById('usersList');
          if (page === 1) list.innerHTML = '';

          if (users.length === 0 && page === 1) {
            list.innerHTML = '<p>No users found.</p>';
            return;
          }

          const usersHtml = users.map(u => `
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
                                <button onclick="deleteUser('${u._id}')" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; color: #ef4444; border-color: #ef4444;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        `).join('');

          list.insertAdjacentHTML('beforeend', usersHtml);
        })
        .catch(err => console.error(err));
    };

    loadUsers();


    // Search input listener
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          loadUsers(1, e.target.value);
        }, 500);
      });
    }

    const loadMoreBtn = document.getElementById('loadMoreUsersBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const currentSearch = document.getElementById('userSearch') ? document.getElementById('userSearch').value : '';
        if (currentPage < totalPages) {
          loadUsers(currentPage + 1, currentSearch);
        }
      });
    }

    // Add User
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => {
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
    }

    // Define global delete function
    window.deleteUser = (id) => {
      if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_URL}/users/${id}`, {
          method: 'DELETE',
          headers
        })
          .then(res => {
            if (res.ok) {
              loadUsers(1); // Reload first page
            } else {
              showToast('Error deleting user');
            }
          });
      }
    };
  }

  // WARDS & ROOMS
  if (document.getElementById('wardsContainer')) {
    console.log('Admin.js: Wards detected');

    const loadWardsAndRooms = async () => {
      try {
        const [wardsRes, roomsRes] = await Promise.all([
          fetch(`${API_URL}/wards`, { headers }),
          fetch(`${API_URL}/rooms`, { headers })
        ]);
        const wards = await wardsRes.json();
        const rooms = await roomsRes.json();

        const container = document.getElementById('wardsContainer');
        container.innerHTML = '';

        if (wards.length === 0) {
          container.innerHTML = '<p>No wards found. Create one to get started.</p>';
        } else {
          wards.forEach(ward => {
            const wardRooms = rooms.filter(r => r.ward && (r.ward._id === ward._id || r.ward.name === ward.name));
            const roomsHtml = wardRooms.map(room => `
                    <div style="background: #f8fafc; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid ${room.status === 'Available' ? '#22c55e' : '#ef4444'};">
                        <div style="display: flex; justify-content: space-between;">
                            <strong>Room ${room.roomNumber}</strong>
                            <span class="badge" style="background: ${room.status === 'Available' ? '#dcfce7' : '#fee2e2'}; color: ${room.status === 'Available' ? '#166534' : '#991b1b'}; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">${room.status}</span>
                        </div>
                        <small>Type: ${room.type} | Cap: ${room.currentOccupancy}/${room.capacity}</small>
                        <div><small>Nurses: ${room.assignedNurses ? room.assignedNurses.map(n => n.name).join(', ') : 'None'}</small></div>
                        <div style="margin-top: 5px; text-align: right;">
                             <button onclick="openEditRoomModal('${room._id}')" style="font-size: 0.8em; color: var(--primary); background: none; border: none; cursor: pointer; margin-right: 10px;">Edit</button>
                             <button onclick="deleteRoom('${room._id}')" style="font-size: 0.8em; color: red; background: none; border: none; cursor: pointer;">Delete</button>
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                `).join('');

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <div>
                            <h3 style="margin: 0;">${ward.name} <span style="font-size:0.6em; background:#e0f2fe; padding:2px 5px; border-radius:4px;">${ward.type}</span></h3>
                            <small>${ward.description || ''}</small>
                        </div>
                        <div>
                             <button onclick="openEditWardModal('${ward._id}')" class="btn btn-outline" style="padding: 5px 10px; margin-right:5px;"><i class="fa-solid fa-pen"></i></button>
                             <button onclick="deleteWard('${ward._id}')" class="btn btn-outline" style="padding: 5px 10px; color: red; border-color: red;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size: 0.9em; color: #64748b;">Rooms</h4>
                        ${roomsHtml || '<p style="color: #94a3b8; font-style: italic;">No rooms in this ward.</p>'}
                    </div>
                `;
            container.appendChild(card);
          });
        }

        // Populate Ward Select
        const roomWardSelect = document.getElementById('roomWard');
        if (roomWardSelect) {
          roomWardSelect.innerHTML = '<option value="">Select Ward</option>' + wards.map(w => `<option value="${w._id}">${w.name}</option>`).join('');
        }

      } catch (error) {
        console.error(error);
        showToast('Error loading data');
      }
    };

    loadWardsAndRooms();

    const addWardForm = document.getElementById('addWardForm');
    if (addWardForm) {
      addWardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('wardName').value;
        const type = document.getElementById('wardType').value;
        const capacity = document.getElementById('wardCapacity').value;

        try {
          const res = await fetch(`${API_URL}/wards`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, type, capacity })
          });
          if (res.ok) {
            document.getElementById('addWardModal').style.display = 'none';
            e.target.reset();
            loadWardsAndRooms();
            showToast('Ward Created');
          } else {
            showToast('Error creating ward');
          }
        } catch (err) { console.error(err); }
      });
    }

    // Helper to get selected values from multi-select
    const getSelectValues = (select) => {
      let result = [];
      let options = select && select.options;
      let opt;
      for (let i = 0, iLen = options.length; i < iLen; i++) {
        opt = options[i];
        if (opt.selected) {
          result.push(opt.value || opt.text);
        }
      }
      return result;
    };

    // Helper to populate nurse select
    const populateNurseSelect = async (selectId, selectedIds = []) => {
      const select = document.getElementById(selectId);
      if (!select) return;

      try {
        const res = await fetch(`${API_URL}/users`, { headers });
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.users;
        const nurses = list.filter(u => u.role === 'nurse');

        select.innerHTML = nurses.map(n =>
          `<option value="${n._id}" ${selectedIds.includes(n._id) ? 'selected' : ''}>${n.name}</option>`
        ).join('');
      } catch (e) { console.error(e); }
    };

    // Define global openers
    window.openAddRoomModal = () => {
      document.getElementById('addRoomModal').style.display = 'flex'; // CSS handles opacity
      populateNurseSelect('roomNurses');
    };

    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm) {
      addRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const roomNumber = document.getElementById('roomNumber').value;
        const ward = document.getElementById('roomWard').value;
        const type = document.getElementById('roomType').value;
        const capacity = document.getElementById('roomCapacity').value;

        try {
          const res = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ roomNumber, ward, type, capacity })
          });

          if (res.ok) {
            const room = await res.json();
            const selectedNurses = getSelectValues(document.getElementById('roomNurses'));

            if (selectedNurses.length > 0) {
              await fetch(`${API_URL}/rooms/${room._id}/assign`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ nurseIds: selectedNurses })
              });
            }
            document.getElementById('addRoomModal').style.display = 'none';
            e.target.reset();
            loadWardsAndRooms();
            showToast('Room Created');
          } else {
            showToast('Error creating room');
          }
        } catch (err) { console.error(err); }
      });
    }

    window.deleteWard = async (id) => {
      if (confirm('Delete this ward?')) {
        await fetch(`${API_URL}/wards/${id}`, { method: 'DELETE', headers });
        loadWardsAndRooms();
      }
    };
    window.deleteRoom = async (id) => {
      if (confirm('Delete this room?')) {
        await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE', headers });
        loadWardsAndRooms();
      }
    };

    // EDIT WARD LOGIC
    window.openEditWardModal = async (id) => {
      try {
        const res = await fetch(`${API_URL}/wards`, { headers });
        const wards = await res.json();
        const ward = wards.find(w => w._id === id);

        if (ward) {
          document.getElementById('editWardId').value = ward._id;
          document.getElementById('editWardName').value = ward.name;
          document.getElementById('editWardType').value = ward.type;
          document.getElementById('editWardCapacity').value = ward.capacity;
          document.getElementById('editWardModal').style.display = 'flex';
        }
      } catch (e) { console.error(e); }
    }

    const editWardForm = document.getElementById('editWardForm');
    if (editWardForm) {
      editWardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editWardId').value;
        const name = document.getElementById('editWardName').value;
        const type = document.getElementById('editWardType').value;
        const capacity = document.getElementById('editWardCapacity').value;

        try {
          const res = await fetch(`${API_URL}/wards/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ name, type, capacity })
          });
          if (res.ok) {
            document.getElementById('editWardModal').style.display = 'none';
            loadWardsAndRooms();
            showToast('Ward Updated');
          } else {
            showToast('Error updating ward');
          }
        } catch (err) { console.error(err); }
      })
    }

    // EDIT ROOM LOGIC
    window.openEditRoomModal = async (id) => {
      try {
        const res = await fetch(`${API_URL}/rooms`, { headers });
        const rooms = await res.json();
        const room = rooms.find(r => r._id === id);

        if (room) {
          document.getElementById('editRoomId').value = room._id;
          document.getElementById('editRoomNumber').value = room.roomNumber;
          const wardId = typeof room.ward === 'object' ? room.ward._id : room.ward;

          const sel = document.getElementById('editRoomWard');
          // Populate if empty (fallback)
          if (sel.options.length <= 1) {
            const roomWardSelect = document.getElementById('roomWard');
            if (roomWardSelect) sel.innerHTML = roomWardSelect.innerHTML;
          }
          sel.value = wardId;
          document.getElementById('editRoomType').value = room.type;
          document.getElementById('editRoomCapacity').value = room.capacity;
          document.getElementById('editRoomStatus').value = room.status || 'Available';

          // Populate Nurses
          const assignedIds = room.assignedNurses ? room.assignedNurses.map(n => n._id) : [];
          populateNurseSelect('editRoomNurses', assignedIds);

          document.getElementById('editRoomModal').style.display = 'flex';
        }
      } catch (e) { console.error('Error opening edit room modal:', e); }
    }

    const editRoomForm = document.getElementById('editRoomForm');
    if (editRoomForm) {
      editRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editRoomId').value;
        const roomNumber = document.getElementById('editRoomNumber').value;
        const ward = document.getElementById('editRoomWard').value;
        const type = document.getElementById('editRoomType').value;
        const capacity = document.getElementById('editRoomCapacity').value;
        const status = document.getElementById('editRoomStatus').value;
        const assignedNurses = getSelectValues(document.getElementById('editRoomNurses'));

        try {
          const res = await fetch(`${API_URL}/rooms/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ roomNumber, ward, type, capacity, status, assignedNurses })
          });

          if (res.ok) {
            document.getElementById('editRoomModal').style.display = 'none';
            loadWardsAndRooms();
            showToast('Room Updated');
          } else {
            showToast('Error updating room');
          }
        } catch (err) { console.error(err); }
      })
    }
  }
});
