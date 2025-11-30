const API_URL = 'http://localhost:5000/api/auth';

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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
        alert('Login Successful');

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

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        alert('Registration Successful');
        window.location.href = 'patient/dashboard.html';
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed');
    }
  });
}
