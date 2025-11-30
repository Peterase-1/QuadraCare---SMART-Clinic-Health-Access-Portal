const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const LAB_URL = 'http://localhost:5000/api/labtech';

const testLabTechPanel = async () => {
  try {
    // 0. Register Lab Tech
    console.log('Registering Lab Tech...');
    const labEmail = `lab${Date.now()}@test.com`;
    const labRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Lab Tech Test',
      email: labEmail,
      password: 'password123',
      role: 'lab_tech'
    });
    const token = labRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Lab Tech Registered & Logged In');

    // 1. Get Dashboard
    console.log('Fetching Dashboard...');
    const dashboardRes = await axios.get(`${LAB_URL}/dashboard`, config);
    console.log('Dashboard Stats:', dashboardRes.data);

    // 2. Get Requests
    console.log('Fetching Requests...');
    const requestsRes = await axios.get(`${LAB_URL}/requests`, config);
    console.log(`Found ${requestsRes.data.length} requests`);

    // 3. Upload Result (if any exist)
    if (requestsRes.data.length > 0) {
      const reqId = requestsRes.data[0]._id;
      console.log('Uploading Result for:', reqId);
      const updateRes = await axios.put(`${LAB_URL}/requests/${reqId}`, {
        labResults: 'http://example.com/result.pdf'
      }, config);
      console.log('Result Uploaded, Status:', updateRes.data.labStatus);
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testLabTechPanel();
