const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const DOCTOR_URL = 'http://localhost:5000/api/doctor';

const reproduce = async () => {
  try {
    // 1. Register Patient
    console.log('Registering Patient...');
    const patEmail = `pat${Date.now()}@test.com`;
    const patRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Patient Zero',
      email: patEmail,
      password: 'password123',
      role: 'patient'
    });
    const patientId = patRes.data._id; // Wait, register returns user object with token?
    // Let's check auth controller return. Usually it returns { _id, name, email, role, token }
    console.log('Patient Registered:', patientId);

    // 2. Register Doctor
    console.log('Registering Doctor...');
    const docEmail = `doc${Date.now()}@test.com`;
    const docRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Dr. Debug',
      email: docEmail,
      password: 'password123',
      role: 'doctor'
    });
    const token = docRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Doctor Registered');

    // 3. Create Consultation (The Failing Request)
    console.log('Attempting createConsultation...');
    const payload = {
      patientId: patientId, // Use the ID from registration
      patientDetails: {
        age: "30",
        weight: "70",
        bloodPressure: "120/80",
        symptoms: "Headache"
      },
      labRequest: null
    };

    const res = await axios.post(`${DOCTOR_URL}/records`, payload, config);
    console.log('Success!', res.data);

  } catch (error) {
    console.error('--- ERROR CAUGHT ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
};

reproduce();
