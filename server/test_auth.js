const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

const testAuth = async () => {
  try {
    // 1. Register
    console.log('Testing Registration...');
    const user = {
      name: 'Test Patient',
      email: `test${Date.now()}@patient.com`, // Unique email
      password: 'password123',
      role: 'patient'
    };

    const regRes = await axios.post(`${API_URL}/register`, user);
    console.log('Registration Successful:', regRes.data);

    // 2. Login
    console.log('Testing Login...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: user.email,
      password: user.password
    });
    console.log('Login Successful:', loginRes.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testAuth();
