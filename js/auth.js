// auth.js - Enhanced Authentication functionality

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const togglePasswordButtons = document.querySelectorAll('.password-toggle');

// Constants
const SESSION_EXPIRY_HOURS = 24;
const SESSION_WARNING_MINUTES = 5;

// Toggle password visibility
togglePasswordButtons.forEach(button => {
  button.addEventListener('click', function() {
    const input = this.parentElement.querySelector('input');
    const icon = this.querySelector('iconify-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('icon', 'mdi:eye-off-outline');
    } else {
      input.type = 'password';
      icon.setAttribute('icon', 'mdi:eye-outline');
    }
  });
});

// Check if user is already logged in (for login/signup pages)
function checkAuth() {
  if (validateSession()) {
    window.location.href = 'dashboard.html';
  }
}

// Handle login
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = this.email.value.trim();
    const password = this.password.value.trim();
    
    // Validate inputs
    if (!email || !password) {
      showError(loginError, 'Please fill in all fields');
      return;
    }
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
      await simulateLogin(email, password);
      
      // On successful login
      createSession(email);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showError(loginError, error.message);
    } finally {
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
    }
  });
}

// Handle signup
if (signupForm) {
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = this.email.value.trim();
    const password = this.password.value.trim();
    const confirmPassword = this.confirmPassword.value.trim();
    
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      showError(signupError, 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      showError(signupError, 'Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      showError(signupError, 'Password must be at least 8 characters');
      return;
    }
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
      await simulateSignup(email, password);
      
      // On successful signup, automatically log the user in
      createSession(email);
      window.location.href = 'dashboard.html';
    } catch (error) {
      showError(signupError, error.message);
    } finally {
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
    }
  });
}

// Helper functions
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hide');
}

function hideError(element) {
  element.textContent = '';
  element.classList.add('hide');
}

function createSession(email) {
  const session = {
    email,
    token: 'simulated-token-' + Math.random().toString(36).substr(2),
    expires: Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
  };
  localStorage.setItem('currentSession', JSON.stringify(session));
  localStorage.setItem('userEmail', email);
}

function validateSession() {
  const session = JSON.parse(localStorage.getItem('currentSession'));
  if (!session) return false;
  
  if (session.expires < Date.now()) {
    localStorage.removeItem('currentSession');
    localStorage.removeItem('userEmail');
    return false;
  }
  
  return true;
}

async function simulateSignup(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userExists = users.some(u => u.email === email);
      
      if (userExists) {
        reject(new Error('User already exists'));
      } else {
        // Store hashed password in production (this is just a simulation)
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));
        resolve();
      }
    }, 1000);
  });
}

async function simulateLogin(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.email === email);
      
      if (!user) {
        reject(new Error('User not found'));
      } else if (user.password !== password) {
        reject(new Error('Incorrect password'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

// Session timeout warning (for dashboard)
function checkSessionTimeout() {
  if (!validateSession()) {
    window.location.href = 'login.html';
    return;
  }

  const session = JSON.parse(localStorage.getItem('currentSession'));
  const warningTime = SESSION_WARNING_MINUTES * 60 * 1000;
  const timeLeft = session.expires - Date.now();
  
  if (timeLeft < warningTime && timeLeft > 0) {
    const warning = document.getElementById('sessionWarning');
    if (warning) {
      warning.classList.remove('hide');
      
      warning.addEventListener('click', () => {
        // Extend session
        session.expires = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        localStorage.setItem('currentSession', JSON.stringify(session));
        warning.classList.add('hide');
      });
    }
  } else if (timeLeft <= 0) {
    // Session expired
    localStorage.removeItem('currentSession');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
  }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // For login/signup pages
  if (window.location.pathname.includes('login.html') || 
      window.location.pathname.includes('signup.html')) {
    checkAuth();
  }
  
  // For dashboard page
  if (window.location.pathname.includes('dashboard.html')) {
    if (!validateSession()) {
      window.location.href = 'login.html';
    } else {
      // Start session timeout checker
      setInterval(checkSessionTimeout, 60000);
      checkSessionTimeout();
    }
  }
});
