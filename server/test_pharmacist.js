const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const PHARMACY_URL = 'http://localhost:5000/api/pharmacist';

const testPharmacyPanel = async () => {
  try {
    // 0. Register Pharmacist
    console.log('Registering Pharmacist...');
    const pharmEmail = `pharm${Date.now()}@test.com`;
    const pharmRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Pharma Test',
      email: pharmEmail,
      password: 'password123',
      role: 'pharmacist'
    });
    const token = pharmRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Pharmacist Registered & Logged In');

    // 1. Get Dashboard
    console.log('Fetching Dashboard...');
    const dashboardRes = await axios.get(`${PHARMACY_URL}/dashboard`, config);
    console.log('Dashboard Stats:', dashboardRes.data);

    // 2. Get Prescriptions
    console.log('Fetching Prescriptions...');
    const prescriptionsRes = await axios.get(`${PHARMACY_URL}/prescriptions`, config);
    console.log(`Found ${prescriptionsRes.data.length} prescriptions`);

    // 3. Dispense Prescription (if any exist)
    if (prescriptionsRes.data.length > 0) {
      const rxId = prescriptionsRes.data[0]._id;
      console.log('Dispensing Prescription:', rxId);
      const updateRes = await axios.put(`${PHARMACY_URL}/prescriptions/${rxId}`, {
        status: 'dispensed'
      }, config);
      console.log('Status Updated:', updateRes.data.status);
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testPharmacyPanel();
