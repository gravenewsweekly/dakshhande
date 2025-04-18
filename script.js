// Configuration
const CONFIG = {
  JSONBIN_API_KEY: '$2a$10$9/8J2F316xoHT9/MJRWScOG86NQgSqHw8CsPltGnTICDQixD77Tpa',
  JSONBIN_BIN_ID: '680141e98a456b79668bab18',
  RAZORPAY_KEY: 'rzp_live_Apno0aW38JljQW',
  ADMIN_SECRET_TOKEN: 'secure-admin-token-123', // In production, store in env vars
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  CSP: "default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.jsonbin.io https://api.ipify.org",
};

// DOM Elements
const DOM = {
  reviewForm: document.getElementById('review-form'),
  reviewsContainer: document.getElementById('reviews-container'),
  tipBtn: document.getElementById('tip-btn'),
  tipStatus: document.getElementById('tip-status'),
  attendanceForm: document.getElementById('attendance-form'),
  presentBtn: document.getElementById('present-btn'),
  absentBtn: document.getElementById('absent-btn'),
  attendanceRecords: document.getElementById('attendance-records'),
  weekoffForm: document.getElementById('weekoff-form'),
  submitWeekoff: document.getElementById('submit-weekoff'),
  weekoffRecords: document.getElementById('weekoff-records'),
  attendanceNav: document.getElementById('attendance-nav'),
  weekoffNav: document.getElementById('weekoff-nav'),
  currentYear: document.getElementById('current-year'),
  hamburger: document.querySelector('.hamburger'),
  navLinks: document.querySelector('.nav-links'),
};

// Security Variables
let isAdmin = false;
const requestCounts = new Map(); // For rate limiting

// Utility Functions
const Utils = {
  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  validateInput(input, type) {
    switch (type) {
      case 'name': return /^[a-zA-Z\s]{2,50}$/.test(input);
      case 'age': return /^\d{1,3}$/.test(input) && input >= 1 && input <= 150;
      case 'pnr': return /^[0-9]{10}$/.test(input);
      case 'phone': return /^[0-9]{10}$/.test(input);
      case 'feedback': return input.length >= 10 && input.length <= 500;
      default: return false;
    }
  },

  generateCSRFToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  isRateLimited(ip) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT_WINDOW_MS;
    const requests = requestCounts.get(ip) || [];

    // Clear old requests
    requestCounts.set(ip, requests.filter(req => req > windowStart));

    if (requests.length >= CONFIG.RATE_LIMIT_REQUESTS) {
      return true;
    }

    requests.push(now);
    requestCounts.set(ip, requests);
    return false;
  },

  showMessage(message, type = 'error') {
    let msgElement = document.querySelector('.security-message');
    if (!msgElement) {
      msgElement = document.createElement('div');
      msgElement.className = `security-message ${type}`;
      msgElement.innerHTML = `
        <h2>${type === 'error' ? 'Security Alert' : 'Info'}</h2>
        <p>${Utils.sanitizeInput(message)}</p>
        <button onclick="this.parentElement.remove(); clearBlur();">OK</button>
      `;
      document.body.appendChild(msgElement);

      // Blur content
      document.querySelectorAll('section, footer').forEach(el => {
        el.classList.add('blur-content');
      });
    }
  },

  logSecurityViolation(action) {
    console.warn(`Security violation: ${action}`);
    // In production, send to server-side logging
  },
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Set current year
  DOM.currentYear.textContent = new Date().getFullYear();

  // Add CSP meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
  cspMeta.setAttribute('content', CONFIG.CSP);
  document.head.appendChild(cspMeta);

  // Initialize security
  await initSecurity();

  // Load reviews
  loadReviews();

  // Load admin features
  if (isAdmin) {
    DOM.attendanceNav.style.display = 'block';
    DOM.weekoffNav.style.display = 'block';
    loadAttendance();
    loadWeekOffs();
  }

  // Setup event listeners
  setupEventListeners();

  // Initialize animations
  initAnimations();
});

// Security Initialization
async function initSecurity() {
  // Prompt for admin token (in production, use a secure method)
  const token = prompt('Enter admin token (leave blank for user access):');
  isAdmin = token === CONFIG.ADMIN_SECRET_TOKEN;

  // Prevent right-click
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    Utils.showMessage('Context menu is disabled for security reasons.');
  });

  // Prevent dev tools shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J'].includes(e.key)) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      Utils.showMessage('Developer tools are disabled for security reasons.');
    }
  });

  // Detect dev tools
  setInterval(() => {
    const before = Date.now();
    debugger;
    const after = Date.now();
    if (after - before > 100) {
      Utils.showMessage('Developer tools detected. This action has been logged.');
      Utils.logSecurityViolation('Developer tools opened');
    }
  }, 1000);

  // Rate limiting check
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    if (Utils.isRateLimited(data.ip)) {
      Utils.showMessage('Too many requests. Please try again later.');
      document.body.innerHTML = '<h1>Rate Limit Exceeded</h1>';
    }
  } catch (error) {
    console.error('Error fetching IP:', error);
  }
}

// Clear blur effect
function clearBlur() {
  document.querySelectorAll('.blur-content').forEach(el => {
    el.classList.remove('blur-content');
  });
}

// Setup Event Listeners
function setupEventListeners() {
  DOM.reviewForm.addEventListener('submit', submitReview);
  DOM.tipBtn.addEventListener('click', initiateTipPayment);

  if (isAdmin) {
    DOM.presentBtn.addEventListener('click', markPresent);
    DOM.absentBtn.addEventListener('click', markAbsent);
    DOM.submitWeekoff.addEventListener('click', submitWeekOff);
  }

  DOM.hamburger.addEventListener('click', () => {
    DOM.hamburger.classList.toggle('active');
    DOM.navLinks.classList.toggle('active');
  });

  document.querySelectorAll('.nav-links a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 70,
          behavior: 'smooth',
        });
        DOM.hamburger.classList.remove('active');
        DOM.navLinks.classList.remove('active');
      }
    });
  });
}

// Initialize Animations
function initAnimations() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  sections.forEach(section => {
    section.style.opacity = 0;
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(section);
  });
}

// Load Reviews
async function loadReviews() {
  try {
    DOM.reviewsContainer.innerHTML = '<p>Loading reviews...</p>';
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to load reviews');

    const data = await response.json();
    const reviews = data.record?.reviews || [];
    displayReviews(reviews);
  } catch (error) {
    console.error('Error loading reviews:', error);
    DOM.reviewsContainer.innerHTML = '<p>Failed to load reviews. Please try again later.</p>';
  }
}

// Display Reviews
function displayReviews(reviews) {
  if (!reviews.length) {
    DOM.reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to leave feedback!</p>';
    return;
  }

  DOM.reviewsContainer.innerHTML = '';
  reviews.forEach(review => {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    const date = new Date(review.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    reviewCard.innerHTML = `
      <div class="review-header">
        <span class="review-name">${Utils.sanitizeInput(review.passengerName)}</span>
        <span class="review-date">${date}</span>
      </div>
      <span class="review-service">${Utils.sanitizeInput(review.service)}</span>
      <div class="review-content">${Utils.sanitizeInput(review.feedback)}</div>
      ${review.tipped ? '<div class="review-tip">❤️ Tipped ₹15</div>' : ''}
    `;
    DOM.reviewsContainer.appendChild(reviewCard);
  });
}

// Submit Review
async function submitReview(e) {
  e.preventDefault();

  const passengerName = DOM.reviewForm.querySelector('#passenger-name').value.trim();
  const age = DOM.reviewForm.querySelector('#passenger-age').value.trim();
  const pnr = DOM.reviewForm.querySelector('#pnr').value.trim();
  const phone = DOM.reviewForm.querySelector('#phone').value.trim();
  const service = DOM.reviewForm.querySelector('#service').value.trim();
  const feedback = DOM.reviewForm.querySelector('#feedback').value.trim();
  const tipped = DOM.tipBtn.textContent.includes('Tipped');
  const csrfToken = Utils.generateCSRFToken();

  // Validate inputs
  const validations = [
    { value: passengerName, type: 'name', msg: 'Please enter a valid name (2-50 characters, letters only)' },
    { value: age, type: 'age', msg: 'Please enter a valid age (1-150)' },
    { value: pnr, type: 'pnr', msg: 'Please enter a valid 10-digit PNR' },
    { value: phone, type: 'phone', msg: 'Please enter a valid 10-digit phone number' },
    { value: feedback, type: 'feedback', msg: 'Feedback must be 10-500 characters' },
  ];

  for (const { value, type, msg } of validations) {
    if (!Utils.validateInput(value, type)) {
      Utils.showMessage(msg);
      return;
    }
  }

  const review = {
    passengerName,
    age,
    pnr,
    phone,
    service,
    feedback,
    tipped,
    date: new Date().toISOString(),
    csrfToken,
  };

  try {
    DOM.reviewForm.setAttribute('disabled', 'true');
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to fetch current reviews');

    const data = await response.json();
    const currentReviews = data.record?.reviews || [];
    const updatedReviews = [...currentReviews, review];

    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ reviews: updatedReviews }),
    });

    if (!updateResponse.ok) throw new Error('Failed to submit review');

    Utils.showMessage('Thank you for your feedback!', 'success');
    DOM.reviewForm.reset();
    DOM.tipStatus.textContent = '';
    DOM.tipBtn.textContent = 'Add Tip ₹15';
    loadReviews();
  } catch (error) {
    console.error('Error submitting review:', error);
    Utils.showMessage('Failed to submit review. Please try again later.');
  } finally {
    DOM.reviewForm.removeAttribute('disabled');
  }
}

// Initiate Tip Payment
function initiateTipPayment() {
  if (DOM.tipBtn.textContent.includes('Tipped')) return;

  const options = {
    key: CONFIG.RAZORPAY_KEY,
    amount: 1500,
    currency: 'INR',
    name: 'Daksh Hande',
    description: 'Service Tip',
    image: '',
    handler: (response) => {
      DOM.tipStatus.textContent = 'Payment successful!';
      DOM.tipBtn.textContent = '✓ Tipped ₹15';
      DOM.tipBtn.style.backgroundColor = '#28a745';
    },
    prefill: {
      name: DOM.reviewForm.querySelector('#passenger-name').value || '',
      contact: DOM.reviewForm.querySelector('#phone').value || '',
    },
    notes: { address: 'Air India Express Service Tip' },
    theme: { color: '#003580' },
  };

  const rzp = new Razorpay(options);
  rzp.open();

  rzp.on('payment.failed', (response) => {
    DOM.tipStatus.textContent = 'Payment failed. Please try again.';
    console.error(response.error);
  });
}

// Load Attendance
async function loadAttendance() {
  if (!isAdmin) return;

  try {
    DOM.attendanceRecords.innerHTML = '<p>Loading attendance...</p>';
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to load attendance');

    const data = await response.json();
    const attendance = data.record?.attendance || [];
    displayAttendance(attendance);
  } catch (error) {
    console.error('Error loading attendance:', error);
    DOM.attendanceRecords.innerHTML = '<p>Failed to load attendance records.</p>';
  }
}

// Display Attendance
function displayAttendance(records) {
  if (!records.length) {
    DOM.attendanceRecords.innerHTML = '<p>No attendance records yet.</p>';
    return;
  }

  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  DOM.attendanceRecords.innerHTML = '';

  records.forEach(record => {
    const recordElement = document.createElement('div');
    recordElement.className = `attendance-record ${record.status.toLowerCase()}`;
    const date = new Date(record.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    recordElement.innerHTML = `
      <span class="attendance-date">${date}</span>
      <span class="attendance-status">${record.status === 'present' ? '✓ Present' : '✗ Absent'}</span>
    `;
    DOM.attendanceRecords.appendChild(recordElement);
  });
}

// Mark Attendance
async function submitAttendance(status) {
  if (!isAdmin) {
    Utils.showMessage('Access denied');
    return;
  }

  try {
    DOM.attendanceForm.setAttribute('disabled', 'true');
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to fetch current attendance');

    const data = await response.json();
    const currentAttendance = data.record?.attendance || [];
    const currentRecord = {
      status,
      date: new Date().toISOString(),
    };

    const today = new Date().toLocaleDateString();
    const alreadyMarked = currentAttendance.some(record => {
      return new Date(record.date).toLocaleDateString() === today;
    });

    if (alreadyMarked) {
      Utils.showMessage('Attendance already marked for today');
      return;
    }

    const updatedAttendance = [...currentAttendance, currentRecord];
    const currentData = data.record || {};

    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
      },
      body: JSON.stringify({ ...currentData, attendance: updatedAttendance }),
    });

    if (!updateResponse.ok) throw new Error('Failed to submit attendance');

    Utils.showMessage(`Marked ${status} for today`, 'success');
    loadAttendance();
  } catch (error) {
    console.error('Error submitting attendance:', error);
    Utils.showMessage('Failed to submit attendance. Please try again later.');
  } finally {
    DOM.attendanceForm.removeAttribute('disabled');
  }
}

// Mark Present/Absent
const markPresent = () => submitAttendance('present');
const markAbsent = () => submitAttendance('absent');

// Load Week Offs
async function loadWeekOffs() {
  if (!isAdmin) return;

  try {
    DOM.weekoffRecords.innerHTML = '<p>Loading week offs...</p>';
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to load week offs');

    const data = await response.json();
    const weekoffs = data.record?.weekoffs || [];
    displayWeekOffs(weekoffs);
  } catch (error) {
    console.error('Error loading week offs:', error);
    DOM.weekoffRecords.innerHTML = '<p>Failed to load week off records.</p>';
  }
}

// Display Week Offs
function displayWeekOffs(records) {
  if (!records.length) {
    DOM.weekoffRecords.innerHTML = '<p>No week off records yet.</p>';
    return;
  }

  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  DOM.weekoffRecords.innerHTML = '';

  records.forEach(record => {
    const recordElement = document.createElement('div');
    recordElement.className = 'weekoff-record';
    const date = new Date(record.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    recordElement.innerHTML = `
      <span class="weekoff-date">${date}</span>
      <span class="weekoff-type">${Utils.sanitizeInput(record.type)}</span>
    `;
    DOM.weekoffRecords.appendChild(recordElement);
  });
}

// Submit Week Off
async function submitWeekOff() {
  if (!isAdmin) {
    Utils.showMessage('Access denied');
    return;
  }

  const type = DOM.weekoffForm.querySelector('#weekoff-type').value.trim();
  if (!type) {
    Utils.showMessage('Please select a week off type');
    return;
  }

  try {
    DOM.weekoffForm.setAttribute('disabled', 'true');
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_API_KEY },
    });

    if (!response.ok) throw new Error('Failed to fetch current week offs');

    const data = await response.json();
    const currentWeekoffs = data.record?.weekoffs || [];
    const currentRecord = {
      type,
      date: new Date().toISOString(),
    };

    const today = new Date().toLocaleDateString();
    const alreadyMarked = currentWeekoffs.some(record => {
      return new Date(record.date).toLocaleDateString() === today;
    });

    if (alreadyMarked) {
      Utils.showMessage('Week off already marked for today');
      return;
    }

    const updatedWeekoffs = [...currentWeekoffs, currentRecord];
    const currentData = data.record || {};

    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
      },
      body: JSON.stringify({ ...currentData, weekoffs: updatedWeekoffs }),
    });

    if (!updateResponse.ok) throw new Error('Failed to submit week off');

    Utils.showMessage(`Marked ${type} week off for today`, 'success');
    loadWeekOffs();
  } catch (error) {
    console.error('Error submitting week off:', error);
    Utils.showMessage('Failed to submit week off. Please try again later.');
  } finally {
    DOM.weekoffForm.removeAttribute('disabled');
  }
}
