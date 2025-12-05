document.addEventListener('DOMContentLoaded', () => {
  checkAuth('nurse');
  loadNurseDashboard();
  setupEventListeners();
});

let assignedRooms = [];

async function loadNurseDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('nurseName').textContent = user.name;

  try {
    const response = await fetch(`${API_URL}/nurse/rooms`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch rooms');

    assignedRooms = await response.json();
    renderRooms(assignedRooms);
    updateStats(assignedRooms);
  } catch (error) {
    console.error('Error:', error);
    alert('Could not load dashboard data');
  }
}

function updateStats(rooms) {
  document.getElementById('totalRooms').textContent = rooms.length;

  let activePatients = 0;
  rooms.forEach(room => {
    if (room.patients) activePatients += room.patients.length;
  });
  document.getElementById('activePatients').textContent = activePatients;
}

function renderRooms(rooms) {
  const container = document.getElementById('roomsContainer');
  container.innerHTML = '';

  if (rooms.length === 0) {
    container.innerHTML = '<p>No rooms assigned yet.</p>';
    return;
  }

  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';

    let patientsHtml = '';
    if (room.patients && room.patients.length > 0) {
      room.patients.forEach(record => {
        patientsHtml += `
                    <div class="patient-info">
                        <strong>${record.patient.name}</strong><br>
                        <small>Doc: ${record.doctor.name}</small><br>
                        <small>Diag: ${record.diagnosis || 'N/A'}</small>
                        <button class="action-btn" onclick="openLogModal('${record._id}', '${record.patient.name}')">
                            <i class="fas fa-edit"></i> Daily Log
                        </button>
                    </div>
                `;
      });
    } else {
      patientsHtml = '<p style="color: #999; font-style: italic;">Empty</p>';
    }

    card.innerHTML = `
            <h3>
                <span>Room ${room.roomNumber}</span>
                <span style="font-size: 0.8em; background: #eee; padding: 2px 8px; border-radius: 10px;">
                    ${room.ward ? room.ward.name : 'Unknown Ward'}
                </span>
            </h3>
            <div style="margin: 10px 0;">
                ${patientsHtml}
            </div>
        `;
    container.appendChild(card);
  });
}

// Modal Logic
const modal = document.getElementById('logModal');
const closeBtn = document.querySelector('.close-modal');

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};

function openLogModal(recordId, patientName) {
  document.getElementById('currentRecordId').value = recordId;
  document.getElementById('modalPatientInfo').textContent = `Patient: ${patientName}`;
  document.getElementById('dailyLogForm').reset();
  document.getElementById('medList').innerHTML = ''; // Clear temporary meds list
  modal.style.display = 'flex';
}

function addMedEntry() {
  const name = document.getElementById('medName').value;
  const dosage = document.getElementById('medDosage').value;

  if (!name) return;

  const div = document.createElement('div');
  div.textContent = `💊 ${name} - ${dosage}`;
  document.getElementById('medList').appendChild(div);

  // Clear inputs
  document.getElementById('medName').value = '';
  document.getElementById('medDosage').value = '';
}

function setupEventListeners() {
  document.getElementById('dailyLogForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const recordId = document.getElementById('currentRecordId').value;
    const vitals = {
      bloodPressure: document.getElementById('logBP').value,
      temperature: document.getElementById('logTemp').value,
      heartRate: document.getElementById('logHR').value,
      oxygenSaturation: document.getElementById('logO2').value
    };
    const notes = document.getElementById('logNotes').value;

    // 1. Submit Basic Log
    try {
      const resLog = await fetch(`${API_URL}/nurse/records/${recordId}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vitals, notes })
      });

      if (!resLog.ok) throw new Error('Failed to save log');

      // 2. Submit Meds (if any in the UI list - currently UI list is just visual, need to capture)
      // Ideally we'd loop through the medList items.
      // For MVP, let's just grab the last one if it's in the input fields or implement a better collection

      // Better: Iterate through medList children
      const medNodes = document.getElementById('medList').children;
      for (let node of medNodes) {
        // Parse "💊 Name - Dosage"
        const text = node.textContent.replace('💊 ', '');
        const [name, dosage] = text.split(' - ');

        await fetch(`${API_URL}/nurse/records/${recordId}/medicate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ name, dosage })
        });
      }

      alert('Daily Log Updated Successfully');
      modal.style.display = 'none';
    } catch (error) {
      console.error(error);
      alert('Error updating log');
    }
  });
}
