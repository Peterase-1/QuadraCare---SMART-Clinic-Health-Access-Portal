const API_URL = 'http://localhost:5000/api/patient';
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user.role !== 'patient') {
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
      document.getElementById('totalRecords').textContent = data.totalRecords;

      const activityList = document.getElementById('recentActivity');
      if (data.recentAppointments.length > 0) {
        activityList.innerHTML = data.recentAppointments.map(appt => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${appt.reason}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${new Date(appt.date).toLocaleDateString()}</div>
                        </div>
                        <span class="badge badge-${appt.status === 'pending' ? 'warning' : appt.status === 'approved' ? 'success' : 'danger'}">${appt.status}</span>
                    </div>
                `).join('');
      } else {
        activityList.innerHTML = '<p style="color: var(--text-secondary);">No recent activity.</p>';
      }
    })
    .catch(err => console.error(err));
}

// ---------------------------------------------------------
// APPOINTMENTS LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('appointments.html')) {
  // 1. Load Doctors
  fetch(`${API_URL}/doctors`, { headers })
    .then(res => res.json())
    .then(doctors => {
      const select = document.getElementById('doctor');
      if (select) {
        select.innerHTML = '<option value="">Select Doctor</option>' +
          doctors.map(doc => `<option value="${doc._id}">${doc.name}</option>`).join('');
      }
    });

  // 2. Load Appointments List
  const loadAppointments = () => {
    fetch(`${API_URL}/appointments`, { headers })
      .then(res => res.json())
      .then(appts => {
        const list = document.getElementById('appointmentsList');
        if (!list) return;

        if (appts.length === 0) {
          list.innerHTML = '<p>No appointments found.</p>';
          return;
        }
        list.innerHTML = appts.map(appt => `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.2rem;">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0;">${appt.doctor ? appt.doctor.name : 'Unknown Doctor'}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${new Date(appt.date).toLocaleDateString()} at ${appt.time}</p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${appt.reason}</p>
                    </div>
                </div>
                <span class="badge badge-${appt.status === 'pending' ? 'warning' : appt.status === 'approved' ? 'success' : 'danger'}">${appt.status}</span>
            </div>
        `).join('');
      });
  };
  loadAppointments();

  // 3. Stripe & Booking Logic
  const stripe = Stripe('pk_test_51SO0JF9v3tuRdeFDrUgsiY0Iwm1BkXjcW1bsOQ85hDf24exOYxmRwCGHk5dNggXi9X3uUIS3ZKemHy2GlSbr75Fa00ZStXBfSy');
  let elements;

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Open Payment Modal
      const modal = document.getElementById('paymentModal');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);

      // 2. Create Payment Intent
      try {
        const res = await fetch('http://localhost:5000/api/payment/create-intent', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'appointment' })
        });

        const { clientSecret } = await res.json();

        // 3. Mount Stripe Element
        const appearance = { theme: 'stripe' };
        elements = stripe.elements({ appearance, clientSecret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
      } catch (err) {
        showToast('Error initializing payment: ' + err.message, 'error');
      }
    });
  }

  // Process Payment & Book
  window.processPayment = async () => {
    const btn = document.getElementById('submitPaymentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // No redirect, handle here
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (error) {
      showToast(error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Pay & Book';
    } else {
      // Payment Success! Now Book Appointment
      showToast('Payment Successful!', 'success');
      closePaymentModal();
      bookAppointment();
      btn.disabled = false;
      btn.textContent = 'Pay & Book';
    }
  };

  const bookAppointment = () => {
    const doctorId = document.getElementById('doctor').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const reason = document.getElementById('reason').value;

    fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ doctorId, date, time, reason })
    })
      .then(res => {
        if (res.ok) {
          showToast('Appointment Booked Successfully');
          loadAppointments();
          document.getElementById('bookingForm').reset();
        } else {
          showToast('Error booking appointment', 'error');
        }
      });
  };
}

// ---------------------------------------------------------
// MEDICAL RECORDS LOGIC
// ---------------------------------------------------------
if (window.location.pathname.includes('records.html')) {
  let currentRecordId = null;
  // Initialize Stripe for Records Page
  const stripe = Stripe('pk_test_51SO0JF9v3tuRdeFDrUgsiY0Iwm1BkXjcW1bsOQ85hDf24exOYxmRwCGHk5dNggXi9X3uUIS3ZKemHy2GlSbr75Fa00ZStXBfSy');
  let elements;

  const loadRecords = () => {
    fetch(`${API_URL}/records`, { headers })
      .then(res => res.json())
      .then(records => {
        const list = document.getElementById('recordsList');
        if (records.length === 0) {
          list.innerHTML = '<p>No medical records found.</p>';
          return;
        }
        list.innerHTML = records.map(rec => {
          let labAction = '';
          if (rec.labRequest && rec.labRequest.required) {
            if (rec.labRequest.paymentStatus === 'pending') {
              labAction = `<button class="btn btn-sm btn-primary" onclick="initLabPayment('${rec._id}')">Pay Lab Fee (200 ETB)</button>`;
            } else {
              labAction = `<span class="badge badge-success">Lab Fee Paid</span>`;
            }
          }

          return `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                        <h3 style="font-size: 1.25rem;">${rec.diagnosis || 'Consultation'}</h3>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${new Date(rec.date).toLocaleDateString()}</span>
                    </div>
                    <div style="display: grid; gap: 0.5rem;">
                        <p><strong>Doctor:</strong> ${rec.doctor ? rec.doctor.name : 'Unknown'}</p>
                        <p><strong>Prescription:</strong> ${rec.prescription ? rec.prescription.medicines.map(m => m.name).join(', ') : 'None'}</p>
                        ${rec.labResults && rec.labResults.resultData ? `<p><a href="#" style="color: var(--primary-color); font-weight: 500;">View Lab Results <i class="fa-solid fa-arrow-up-right-from-square"></i></a></p>` : ''}
                        <div style="margin-top: 10px;">${labAction}</div>
                    </div>
                </div>
            `;
        }).join('');
      });
  };
  loadRecords();

  window.initLabPayment = async (recordId) => {
    currentRecordId = recordId;
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);

    try {
      const res = await fetch('http://localhost:5000/api/payment/create-intent', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lab_test' })
      });

      const { clientSecret } = await res.json();

      const appearance = { theme: 'stripe' };
      elements = stripe.elements({ appearance, clientSecret });
      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');
    } catch (err) {
      showToast('Error initializing payment: ' + err.message, 'error');
    }
  };

  window.processLabPayment = async () => {
    const btn = document.getElementById('submitPaymentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required'
    });

    if (error) {
      showToast(error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Pay & Proceed';
    } else {
      // Confirm with Backend
      await fetch('http://localhost:5000/api/payment/confirm', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          recordId: currentRecordId,
          type: 'lab_test'
        })
      });

      showToast('Lab Fee Paid Successfully!', 'success');
      closePaymentModal();
      loadRecords(); // Refresh list
      btn.disabled = false;
      btn.textContent = 'Pay & Proceed';
    }
  };
}
