const API_URL = `${window.getApiBaseUrl()}`;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth('nurse');
  loadNurseDashboard();
  setupEventListeners();
});

async function loadNurseDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return; // checkAuth will handle redirect

  const nameEl = document.getElementById('nurseName');
  if (nameEl) nameEl.textContent = user.name || 'Nurse';

  const container = document.getElementById('roomsContainer');

  try {
    const response = await fetch(`${API_URL}/nurse/rooms`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const rooms = await response.json();

    updateStats(rooms);
    renderRooms(rooms);

  } catch (error) {
    console.error('Dashboard Error:', error);
    if (container) {
      container.innerHTML = `
                <div class="glass-panel" style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--warning);">
                    <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 1rem;"></i>
                    <p>Unable to load dashboard data. <br> <small>${error.message}</small></p>
                    <button class="btn-outline" onclick="loadNurseDashboard()" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
    }
  }
}

function updateStats(rooms) {
  const totalRoomsEl = document.getElementById('totalRooms');
  const activePatientsEl = document.getElementById('activePatients');

  if (totalRoomsEl) totalRoomsEl.textContent = rooms.length;

  let patientCount = 0;
  rooms.forEach(r => {
    if (r.patients) patientCount += r.patients.length;
  });

  if (activePatientsEl) activePatientsEl.textContent = patientCount;
}

function renderRooms(rooms) {
  const container = document.getElementById('roomsContainer');
  if (!container) return;

  container.innerHTML = '';

  if (rooms.length === 0) {
    container.innerHTML = `
            <div class="glass-panel" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
                <i class="fas fa-clipboard-check fa-3x" style="color: var(--success); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem;">All clear. No rooms assigned.</p>
            </div>
        `;
    return;
  }

  rooms.forEach(room => {
    const hasPatients = room.patients && room.patients.length > 0;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.height = '100%'; // Ensure full height consistency
    card.style.padding = '1.5rem';
    card.style.transition = 'transform 0.3s';
    card.onmouseover = () => card.style.transform = 'translateY(-5px)';
    card.onmouseout = () => card.style.transform = 'translateY(0)';

    // Room Header
    let statusBadge = hasPatients ?
      `<span style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">Occupied</span>` :
      `<span style="background: rgba(100, 116, 139, 0.1); color: var(--text-muted); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">Empty</span>`;

    let patientsListHtml = '';
    if (hasPatients) {
      room.patients.forEach(rec => {
        patientsListHtml += `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-main);">${rec.patient.name}</h4>
                                <small style="color: var(--text-muted);">Doc: ${rec.doctor.name}</small>
                            </div>
                            <button class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="openLogModal('${rec._id}', '${rec.patient.name}')">
                                <i class="fas fa-plus"></i> Log
                            </button>
                        </div>
                        <div style="background: rgba(255,255,255,0.5); padding: 8px; border-radius: 8px; font-size: 0.9rem;">
                            <i class="fas fa-stethoscope" style="color: var(--primary);"></i> ${rec.diagnosis || 'No diagnosis'}
                        </div>
                    </div>
                `;
      });
    } else {
      patientsListHtml = `<p style="margin-top: 1rem; color: var(--text-muted); text-align: center; font-style: italic;">Ready for admission</p>`;
    }

    card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.4rem;">${room.roomNumber}</h3>
                ${statusBadge}
            </div>
            <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">
                <i class="fas fa-map-marker-alt"></i> ${room.ward ? room.ward.name : 'Unassigned Ward'}
            </div>
            ${patientsListHtml}
        `;

    container.appendChild(card);
  });
}

// Modal handling remains mostly the same but ensure ID matches
const modal = document.getElementById('logModal');
if (modal) {
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

window.openLogModal = function (recordId, patientName) {
  document.getElementById('currentRecordId').value = recordId;
  document.getElementById('modalPatientInfo').textContent = `Patient: ${patientName}`;
  document.getElementById('dailyLogForm').reset();
  document.getElementById('medList').innerHTML = '';
  modal.style.display = 'flex';
};

window.addMedEntry = function () {
  const name = document.getElementById('medName').value;
  const dosage = document.getElementById('medDosage').value;
  if (!name) return;
  const div = document.createElement('div');
  div.innerHTML = `<span style="color: var(--primary);">💊 ${name}</span> - ${dosage}`;
  document.getElementById('medList').appendChild(div);
  document.getElementById('medName').value = '';
  document.getElementById('medDosage').value = '';
};

// Event Listeners
function setupEventListeners() {
  const form = document.getElementById('dailyLogForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recordId = document.getElementById('currentRecordId').value;
      const vitals = {
        bloodPressure: document.getElementById('logBP').value,
        temperature: document.getElementById('logTemp').value,
        heartRate: document.getElementById('logHR').value,
        oxygenSaturation: document.getElementById('logO2').value
      };
      const notes = document.getElementById('logNotes').value;

      try {
        // Submit logic... (Keep existing logic or simplified for now)
        const resLog = await fetch(`${API_URL}/nurse/records/${recordId}/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ vitals, notes })
        });

        if (!resLog.ok) throw new Error('Failed to save log');

        alert('Daily Log Saved!');
        modal.style.display = 'none';
      } catch (err) {
        alert('Error saving log: ' + err.message);
      }
    });
  }
}
