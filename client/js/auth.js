// Safe fallback if utils.js hasn't loaded (though it should have)
const getBaseUrl = () => window.getApiBaseUrl ? window.getApiBaseUrl() : '/api';
const API_URL = `${getBaseUrl()}/auth`;

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // const role = document.getElementById('role').value;

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        // alert(`LOGIN DEBUG: Server says you are a '${data.role}'. Redirecting...`);
        // alert('Login Successful');

        switch (data.role) {
          case 'admin':
            window.location.href = 'admin/dashboard.html';
            break;
          case 'doctor':
            window.location.href = 'doctor/dashboard.html';
            break;
          case 'pharmacist':
            window.location.href = 'pharmacist/dashboard.html';
            break;
          case 'lab_tech':
            window.location.href = 'labtech/dashboard.html';
            break;
          case 'emergency':
            window.location.href = 'emergency/dashboard.html';
            break;
          case 'patient':
          default:
            window.location.href = 'patient/dashboard.html';
            break;
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Login failed');
    }
  });
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = 'patient'; // Default role for public registration

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        alert('Registration Successful');

        switch (data.role) {
          case 'admin':
            window.location.href = 'admin/dashboard.html';
            break;
          case 'doctor':
            window.location.href = 'doctor/dashboard.html';
            break;
          case 'pharmacist':
            window.location.href = 'pharmacist/dashboard.html';
            break;
          case 'lab_tech':
            window.location.href = 'labtech/dashboard.html';
            break;
          case 'patient':
          default:
            window.location.href = 'patient/dashboard.html';
            break;
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed');
    }
  });
}
