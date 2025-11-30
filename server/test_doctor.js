const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const DOCTOR_URL = 'http://localhost:5000/api/doctor';

const testDoctorPanel = async () => {
  try {
    // 0. Register Doctor
    console.log('Registering Doctor...');
    const docEmail = `doc${Date.now()}@test.com`;
    const docRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Dr. Test',
      email: docEmail,
      password: 'password123',
      role: 'doctor'
    });
    const token = docRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Doctor Registered & Logged In');

    // 1. Get Dashboard
    console.log('Fetching Dashboard...');
    const dashboardRes = await axios.get(`${DOCTOR_URL}/dashboard`, config);
    console.log('Dashboard Stats:', dashboardRes.data);

    // 2. Get Patients
    console.log('Fetching Patients...');
    const patientsRes = await axios.get(`${DOCTOR_URL}/patients`, config);
    console.log(`Found ${patientsRes.data.length} patients`);

    // 3. Add Medical Record (if patients exist)
    if (patientsRes.data.length > 0) {
      const patientId = patientsRes.data[0]._id;
      console.log('Adding Medical Record for:', patientId);
      const recordRes = await axios.post(`${DOCTOR_URL}/records`, {
        patientId,
        diagnosis: 'Flu',
        prescription: 'Rest and Water',
        labResults: ''
      }, config);
      console.log('Record Added:', recordRes.data._id);
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testDoctorPanel();
