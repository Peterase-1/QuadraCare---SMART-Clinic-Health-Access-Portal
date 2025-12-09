const axios = require('axios');

async function testProfileUpdate() {
  try {
    const randomEmail = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    // 1. Register
    console.log(`Registering user ${randomEmail}...`);
    try {
      const regRes = await axios.post('http://localhost:8000/api/auth/register', {
        name: 'Test User',
        email: randomEmail,
        password: password,
        role: 'patient' // explicitly set role
      });
      console.log('Registration success:', regRes.status);
    } catch (regError) {
      console.error('Registration Failed:', regError.message);
      if (regError.response) console.error('Reg Data:', regError.response.data);
      throw regError;
    }

    // 2. Login to get token
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
      email: randomEmail,
      password: password
    });

    const token = loginRes.data.token;
    console.log('Login successful, token received.');

    // 3. Update Profile (without password change)
    console.log('Updating profile (no password change)...');

    // We send name, email, and undefined/empty password effectively
    const updateRes = await axios.put('http://localhost:8000/api/auth/profile', {
      name: 'Test User Updated',
      email: randomEmail,
      password: '' // Simulate empty password field
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Update response status:', updateRes.status);
    console.log('Update response data:', updateRes.data);

    if (updateRes.status === 200) {
      console.log('SUCCESS: Profile updated without 500 error.');
    }

  } catch (error) {
    if (error.response) {
      console.error('FAILED with status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testProfileUpdate();
