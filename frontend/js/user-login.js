/**
 * BINUS Lost & Found - User Login JavaScript
 * Handles: login form submission, auth check, error display for students/users
 */

const API_BASE = API_CONFIG.API_BASE;

// ── DOM Elements ──
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

// ── Initialization ──
document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  loginForm.addEventListener('submit', handleLogin);
});

// ── Check if already authenticated ──
async function checkAuth() {
  try {
    var res = await fetch(API_BASE + '/auth/user/check', {
      credentials: 'include'
    });
    var json = await res.json();

    if (json.success) {
      window.location.href = 'index.html';
    }
  } catch (err) {
    // Not logged in, stay on this page
  }
}

// ── Handle Login Form Submission ──
async function handleLogin(e) {
  e.preventDefault();

  var email = emailInput.value.trim();
  var password = passwordInput.value;

  // Basic validation
  if (!email) {
    showError('Email wajib diisi');
    emailInput.focus();
    return;
  }

  if (!password) {
    showError('Password wajib diisi');
    passwordInput.focus();
    return;
  }

  // Hide previous errors
  hideError();

  // Disable button during request
  loginBtn.disabled = true;
  loginBtn.textContent = 'Memproses...';

  try {
    var res = await fetch(API_BASE + '/auth/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email: email, password: password })
    });

    var json = await res.json();

    if (json.success) {
      window.location.href = 'index.html';
    } else {
      showError(json.message || 'Email atau password salah');
    }
  } catch (err) {
    console.error('Login error:', err);
    showError('Gagal terhubung ke server. Pastikan server berjalan.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Masuk';
  }
}

// ── Error Display ──
function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.add('show');
}

function hideError() {
  loginError.textContent = '';
  loginError.classList.remove('show');
}
