const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const PATIENT_URL = 'http://localhost:5000/api/patient';

const testPatientPortal = async () => {
  try {
    // 0. Register Patient
    console.log('Registering Patient...');
    const patientEmail = `pat${Date.now()}@patient.com`;
    const patientRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Test Patient',
      email: patientEmail,
      password: 'password123',
      role: 'patient'
    });
    const token = patientRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Patient Registered & Logged In');

    // 1. Get Doctors
    console.log('Fetching Doctors...');
    const doctorsRes = await axios.get(`${PATIENT_URL}/doctors`, config);
    console.log(`Found ${doctorsRes.data.length} doctors`);

    // 2. Register a Doctor (to book with)
    console.log('Registering a Doctor...');
    const docEmail = `doc${Date.now()}@hospital.com`;
    const docRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Dr. House',
      email: docEmail,
      password: 'password123',
      role: 'doctor'
    });
    const doctorId = docRes.data._id;
    console.log('Doctor Registered:', doctorId);

    // 3. Book Appointment
    console.log('Booking Appointment...');
    const apptRes = await axios.post(`${PATIENT_URL}/appointments`, {
      doctorId: doctorId,
      date: '2025-12-25',
      time: '10:00',
      reason: 'Checkup'
    }, config);
    console.log('Appointment Booked:', apptRes.data._id);

    // 4. Get Dashboard Stats
    console.log('Fetching Dashboard Stats...');
    const dashboardRes = await axios.get(`${PATIENT_URL}/dashboard`, config);
    console.log('Dashboard Stats:', dashboardRes.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testPatientPortal();
