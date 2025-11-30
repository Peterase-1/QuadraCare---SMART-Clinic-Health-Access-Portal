const axios = require('axios');

const AUTH_URL = 'http://localhost:5000/api/auth';
const ADMIN_URL = 'http://localhost:5000/api/admin';

const testAdminPanel = async () => {
  try {
    // 0. Register Admin
    console.log('Registering Admin...');
    const adminEmail = `admin${Date.now()}@test.com`;
    const adminRes = await axios.post(`${AUTH_URL}/register`, {
      name: 'Admin Test',
      email: adminEmail,
      password: 'password123',
      role: 'admin'
    });
    const token = adminRes.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Admin Registered & Logged In');

    // 1. Get Dashboard
    console.log('Fetching Dashboard...');
    const dashboardRes = await axios.get(`${ADMIN_URL}/dashboard`, config);
    console.log('Dashboard Stats:', dashboardRes.data);

    // 2. Create New Doctor
    console.log('Creating New Doctor...');
    const newDocEmail = `newdoc${Date.now()}@test.com`;
    const createRes = await axios.post(`${ADMIN_URL}/users`, {
      name: 'Dr. New',
      email: newDocEmail,
      password: 'password123',
      role: 'doctor'
    }, config);
    console.log('Created User:', createRes.data.name, createRes.data.role);

    // 3. Get All Users
    console.log('Fetching All Users...');
    const usersRes = await axios.get(`${ADMIN_URL}/users`, config);
    console.log(`Found ${usersRes.data.length} users`);

    // 4. Delete Created User
    const userIdToDelete = createRes.data._id;
    console.log('Deleting User:', userIdToDelete);
    await axios.delete(`${ADMIN_URL}/users/${userIdToDelete}`, config);
    console.log('User Deleted');

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

testAdminPanel();
