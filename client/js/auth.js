// Safe fallback if utils.js hasn't loaded (though it should have)
const getBaseUrl = () => window.getApiBaseUrl ? window.getApiBaseUrl() : '/api';
const API_URL = `${getBaseUrl()}/auth`;

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('loginError');

    // Basic Validation
    if (!emailInput.value || !passwordInput.value) {
      if (errorDiv) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.style.display = 'block';
        passwordInput.classList.add('error');
      }
      return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

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
        window.location.href = getRedirectPath(data.role);
      } else {
        if (errorDiv) {
          errorDiv.textContent = data.message;
          errorDiv.style.display = 'block';
        } else {
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      if (errorDiv) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
      }
    }
  });
}

function getRedirectPath(role) {
  switch (role) {
    case 'admin': return '../admin/dashboard.html';
    case 'doctor': return '../doctor/dashboard.html';
    case 'pharmacist': return '../pharmacist/dashboard.html';
    case 'lab_tech': return '../labtech/dashboard.html';
    case 'emergency': return '../emergency/dashboard.html';
    case 'nurse': return '../nurse/dashboard.html';
    default: return '../patient/dashboard.html';
  }
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const passwordInput = document.getElementById('password');
  const strengthContainer = document.getElementById('strengthContainer');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const passwordError = document.getElementById('passwordError');

  // Password Strength Checker
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      if (password.length > 0) {
        strengthContainer.style.display = 'block';
        const strength = checkStrength(password);
        updateStrengthUI(strength);
      } else {
        strengthContainer.style.display = 'none';
      }
    });
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    const role = 'patient';

    // Validation
    const strength = checkStrength(password);
    if (strength.score < 2) { // Require at least Medium
      passwordError.textContent = 'Password is too weak. Please use a stronger password.';
      passwordError.style.display = 'block';
      passwordInput.classList.add('error');
      return;
    } else {
      passwordError.style.display = 'none';
      passwordInput.classList.remove('error');
    }

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
        window.location.href = getRedirectPath(data.role);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed');
    }
  });
}

function checkStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return {
    score: score, // 0-4
    label: getLabel(score)
  };
}

function getLabel(score) {
  if (score < 2) return 'Weak';
  if (score < 3) return 'Medium';
  return 'Strong';
}

function updateStrengthUI(strength) {
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');

  // Reset classes
  strengthBar.className = 'strength-bar';

  let width = '0%';
  let colorClass = '';

  if (strength.label === 'Weak') {
    width = '33%';
    colorClass = 'strength-weak';
  } else if (strength.label === 'Medium') {
    width = '66%';
    colorClass = 'strength-medium';
  } else {
    width = '100%';
    colorClass = 'strength-strong';
  }

  strengthBar.style.width = width;
  strengthBar.classList.add(colorClass);
  strengthText.textContent = strength.label;
}
