// Configuration
const JSONBIN_API_KEY = '$2a$10$9/8J2F316xoHT9/MJRWScOG86NQgSqHw8CsPltGnTICDQixD77Tpa';
const JSONBIN_BIN_ID = '680141e98a456b79668bab18';
const RAZORPAY_KEY = 'rzp_live_Apno0aW38JljQW';

// DOM Elements
const reviewForm = document.getElementById('review-form');
const reviewsContainer = document.getElementById('reviews-container');
const tipBtn = document.getElementById('tip-btn');
const tipStatus = document.getElementById('tip-status');
const attendanceForm = document.getElementById('attendance-form');
const presentBtn = document.getElementById('present-btn');
const absentBtn = document.getElementById('absent-btn');
const attendanceRecords = document.getElementById('attendance-records');
const weekoffForm = document.getElementById('weekoff-form');
const submitWeekoff = document.getElementById('submit-weekoff');
const weekoffRecords = document.getElementById('weekoff-records');
const attendanceNav = document.getElementById('attendance-nav');
const weekoffNav = document.getElementById('weekoff-nav');
const currentYear = document.getElementById('current-year');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const adminToggle = document.getElementById('admin-toggle');
const adminPasswordInput = document.getElementById('admin-password');
const adminSection = document.getElementById('admin-section');

// Security Variables
let isAdmin = false;
const ADMIN_PASSWORD = 'AIX@2023'; // In production, use environment variables

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set current year
    currentYear.textContent = new Date().getFullYear();
    
    // Load reviews
    loadReviews();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize animations
    initAnimations();
    
    // Initialize security
    initSecurity();
});

// Security Initialization
function initSecurity() {
    // Enhanced security checks
    Object.defineProperty(window, 'isSecureContext', { value: true, writable: false });
    
    // Prevent right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityMessage('Context menu is disabled for security reasons.');
    });
    
    // Prevent developer tools shortcuts
    document.addEventListener('keydown', function(e) {
        const forbiddenKeys = [
            'F12', 
            'F8', 
            'F5', 
            'Ctrl+Shift+I', 
            'Ctrl+Shift+J', 
            'Ctrl+Shift+C', 
            'Ctrl+U',
            'Ctrl+S',
            'Ctrl+P'
        ];
        
        const keyCombination = [
            e.ctrlKey ? 'Ctrl+' : '',
            e.shiftKey ? 'Shift+' : '',
            e.key
        ].join('').replace(/\+$/g, '');
        
        if (forbiddenKeys.includes(e.key) || forbiddenKeys.includes(keyCombination)) {
            e.preventDefault();
            showSecurityMessage('Developer tools are disabled for security reasons.');
            logSecurityViolation(`Attempted to use ${e.key} or ${keyCombination}`);
        }
    });
    
    // Detect if dev tools are open (more reliable method)
    let devtools = /./;
    devtools.toString = function() {
        showSecurityMessage('Developer tools detected. This action has been logged.');
        logSecurityViolation('Developer tools opened');
        return '';
    };
    
    console.log('%c', devtools);
    
    // Prevent iframe embedding
    if (window.location !== window.parent.location) {
        window.top.location = window.location;
    }
    
    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        if (!isAdmin) {
            e.preventDefault();
            return false;
        }
    });
}

// Show security message
function showSecurityMessage(message) {
    let securityMsg = document.querySelector('.security-message');
    if (!securityMsg) {
        securityMsg = document.createElement('div');
        securityMsg.className = 'security-message';
        securityMsg.innerHTML = `
            <div class="security-content">
                <h2>Security Alert</h2>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        document.body.appendChild(securityMsg);
        
        document.querySelectorAll('section, footer').forEach(el => {
            el.classList.add('blur-content');
        });
    }
}

// Log security violation
function logSecurityViolation(action) {
    const timestamp = new Date().toISOString();
    const violationData = {
        action,
        timestamp,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        url: window.location.href
    };
    
    console.warn('Security violation:', violationData);
    // In production, send this to your server
    // sendToServer('/log-violation', violationData);
}

// Setup event listeners
function setupEventListeners() {
    // Review form submission
    reviewForm.addEventListener('submit', submitReview);
    
    // Tip button click
    tipBtn.addEventListener('click', initiateTipPayment);
    
    // Admin toggle
    adminToggle.addEventListener('click', toggleAdminAccess);
    
    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
}

// Toggle admin access
function toggleAdminAccess() {
    const password = adminPasswordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = !isAdmin;
        
        if (isAdmin) {
            adminSection.style.display = 'block';
            attendanceNav.style.display = 'block';
            weekoffNav.style.display = 'block';
            loadAttendance();
            loadWeekOffs();
            adminToggle.textContent = 'Exit Admin Mode';
            showSecurityMessage('Admin mode activated. Be cautious with your actions.');
        } else {
            adminSection.style.display = 'none';
            attendanceNav.style.display = 'none';
            weekoffNav.style.display = 'none';
            adminToggle.textContent = 'Enter Admin Mode';
        }
        
        adminPasswordInput.value = '';
    } else {
        alert('Incorrect password');
    }
}

// Initialize animations
function initAnimations() {
    const sections = document.querySelectorAll('.section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(section);
    });
}

// Load reviews from JSONBin
async function loadReviews() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': 'false'
            },
            cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Failed to load reviews');
        
        const data = await response.json();
        const reviews = data.reviews || [];
        
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = '<p class="error-message">Failed to load reviews. Please try again later.</p>';
    }
}

// Display reviews with enhanced sanitization
function displayReviews(reviews) {
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to leave feedback!</p>';
        return;
    }
    
    reviewsContainer.innerHTML = '';
    
    reviews.forEach(review => {
        // Basic XSS protection
        const sanitize = (str) => {
            if (!str) return '';
            return str.toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
        
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        const date = new Date(review.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <span class="review-name">${sanitize(review.passengerName)}</span>
                <span class="review-date">${date}</span>
            </div>
            <span class="review-service">${sanitize(review.service)}</span>
            <div class="review-content">${sanitize(review.feedback)}</div>
            ${review.tipped ? '<div class="review-tip">❤️ Tipped ₹15</div>' : ''}
        `;
        
        reviewsContainer.appendChild(reviewCard);
    });
}

// Submit review with validation
async function submitReview(e) {
    e.preventDefault();
    
    const passengerName = document.getElementById('passenger-name').value.trim();
    const age = document.getElementById('passenger-age').value.trim();
    const pnr = document.getElementById('pnr').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const feedback = document.getElementById('feedback').value.trim();
    const tipped = tipBtn.textContent.includes('Tipped');
    
    // Enhanced validation
    if (!passengerName || !age || !pnr || !phone || !service || !feedback) {
        alert('Please fill all required fields');
        return;
    }
    
    if (!/^\d+$/.test(age) || parseInt(age) < 1 || parseInt(age) > 120) {
        alert('Please enter a valid age');
        return;
    }
    
    if (!/^[a-zA-Z0-9]{6,10}$/.test(pnr)) {
        alert('Please enter a valid PNR number (6-10 alphanumeric characters)');
        return;
    }
    
    if (!/^[0-9]{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    if (feedback.length < 10 || feedback.length > 500) {
        alert('Feedback must be between 10 and 500 characters');
        return;
    }
    
    // Create review object
    const review = {
        passengerName,
        age,
        pnr,
        phone,
        service,
        feedback,
        tipped,
        date: new Date().toISOString()
    };
    
    try {
        // Get current reviews
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch current reviews');
        
        const data = await response.json();
        const currentData = data.record || {};
        const currentReviews = currentData.reviews || [];
        
        // Add new review
        const updatedReviews = [...currentReviews, review];
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                ...currentData,
                reviews: updatedReviews
            })
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit review');
        
        // Show success message
        alert('Thank you for your feedback!');
        
        // Reset form
        reviewForm.reset();
        tipStatus.textContent = '';
        tipBtn.textContent = 'Add Tip ₹15';
        tipBtn.style.backgroundColor = '';
        
        // Reload reviews
        loadReviews();
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again later.');
    }
}

// Initiate tip payment with enhanced options
function initiateTipPayment() {
    if (tipBtn.textContent.includes('Tipped')) return;
    
    const passengerName = document.getElementById('passenger-name').value.trim() || 'Anonymous';
    
    const options = {
        key: RAZORPAY_KEY,
        amount: 1500, // 15 rupees in paise
        currency: 'INR',
        name: 'Daksh Hande',
        description: 'Service Tip',
        image: 'https://example.com/logo.png', // Add your logo
        handler: function(response) {
            tipStatus.textContent = 'Payment successful! Thank you for your generosity.';
            tipBtn.textContent = '✓ Tipped ₹15';
            tipBtn.style.backgroundColor = '#28a745';
            
            // Log successful payment
            logPayment({
                amount: 15,
                currency: 'INR',
                passengerName,
                paymentId: response.razorpay_payment_id,
                timestamp: new Date().toISOString()
            });
        },
        prefill: {
            name: passengerName,
            email: '',
            contact: document.getElementById('phone').value.trim() || ''
        },
        notes: {
            service: 'Air India Express Service Tip',
            passenger: passengerName
        },
        theme: {
            color: '#003580',
            hide_topbar: true
        },
        modal: {
            ondismiss: function() {
                tipStatus.textContent = 'Payment window closed. You can try again.';
            }
        }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
    rzp.on('payment.failed', function(response) {
        tipStatus.textContent = 'Payment failed. Please try again or contact support.';
        console.error('Payment failed:', response.error);
        
        logPayment({
            status: 'failed',
            error: response.error,
            passengerName,
            timestamp: new Date().toISOString()
        });
    });
}

// Log payment (mock function - implement server-side in production)
function logPayment(paymentData) {
    console.log('Payment log:', paymentData);
    // In production: fetch('/log-payment', { method: 'POST', body: JSON.stringify(paymentData) });
}

// Load attendance records
async function loadAttendance() {
    if (!isAdmin) return;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) throw new Error('Failed to load attendance');
        
        const data = await response.json();
        const attendance = data.attendance || [];
        
        displayAttendance(attendance);
    } catch (error) {
        console.error('Error loading attendance:', error);
        attendanceRecords.innerHTML = '<p class="error-message">Failed to load attendance records.</p>';
    }
}

// Display attendance records
function displayAttendance(records) {
    if (records.length === 0) {
        attendanceRecords.innerHTML = '<p>No attendance records yet.</p>';
        return;
    }
    
    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    attendanceRecords.innerHTML = '';
    
    // Group by month
    const groupedRecords = {};
    records.forEach(record => {
        const date = new Date(record.date);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!groupedRecords[monthYear]) {
            groupedRecords[monthYear] = [];
        }
        
        groupedRecords[monthYear].push(record);
    });
    
    // Display by month
    for (const [monthYear, monthRecords] of Object.entries(groupedRecords)) {
        const monthHeader = document.createElement('h3');
        monthHeader.className = 'attendance-month-header';
        monthHeader.textContent = monthYear;
        attendanceRecords.appendChild(monthHeader);
        
        monthRecords.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = `attendance-record ${record.status.toLowerCase()}`;
            
            const date = new Date(record.date).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric'
            });
            
            recordElement.innerHTML = `
                <span class="attendance-date">${date}</span>
                <span class="attendance-status">${
                    record.status === 'present' ? 
                    '✓ Present' : 
                    '✗ Absent' + (record.note ? ` (${record.note})` : '')
                }</span>
            `;
            
            attendanceRecords.appendChild(recordElement);
        });
    }
}

// Mark present with note option
async function markPresent() {
    const note = prompt('Add any notes (optional):');
    await submitAttendance('present', note);
}

// Mark absent with reason
async function markAbsent() {
    const reason = prompt('Please specify reason for absence:');
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
        alert('Please provide a reason for absence');
        return;
    }
    
    await submitAttendance('absent', reason.trim());
}

// Submit attendance with enhanced validation
async function submitAttendance(status, note = '') {
    if (!isAdmin) {
        alert('Access denied. Please enter admin mode.');
        return;
    }
    
    try {
        // Get current data
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch current data');
        
        const data = await response.json();
        const currentData = data.record || {};
        const currentAttendance = currentData.attendance || [];
        
        // Check if attendance already marked today
        const today = new Date().toISOString().split('T')[0];
        const alreadyMarked = currentAttendance.some(record => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            return recordDate === today;
        });
        
        if (alreadyMarked) {
            alert('Attendance already marked for today');
            return;
        }
        
        // Create new record
        const newRecord = {
            status,
            date: new Date().toISOString(),
            ...(note && { note })
        };
        
        // Update data
        const updatedAttendance = [...currentAttendance, newRecord];
        const updatedData = {
            ...currentData,
            attendance: updatedAttendance
        };
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit attendance');
        
        // Show success message
        alert(`Successfully marked as ${status} for today${note ? ` with note: ${note}` : ''}`);
        
        // Reload attendance
        loadAttendance();
    } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('Failed to submit attendance. Please try again later.');
    }
}

// Load week off records
async function loadWeekOffs() {
    if (!isAdmin) return;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) throw new Error('Failed to load week offs');
        
        const data = await response.json();
        const weekoffs = data.weekoffs || [];
        
        displayWeekOffs(weekoffs);
    } catch (error) {
        console.error('Error loading week offs:', error);
        weekoffRecords.innerHTML = '<p class="error-message">Failed to load week off records.</p>';
    }
}

// Display week off records with grouping
function displayWeekOffs(records) {
    if (records.length === 0) {
        weekoffRecords.innerHTML = '<p>No week off records yet.</p>';
        return;
    }
    
    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    weekoffRecords.innerHTML = '';
    
    // Group by month
    const groupedRecords = {};
    records.forEach(record => {
        const date = new Date(record.date);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!groupedRecords[monthYear]) {
            groupedRecords[monthYear] = [];
        }
        
        groupedRecords[monthYear].push(record);
    });
    
    // Display by month
    for (const [monthYear, monthRecords] of Object.entries(groupedRecords)) {
        const monthHeader = document.createElement('h3');
        monthHeader.className = 'weekoff-month-header';
        monthHeader.textContent = monthYear;
        weekoffRecords.appendChild(monthHeader);
        
        monthRecords.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = 'weekoff-record';
            
            const date = new Date(record.date).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric'
            });
            
            recordElement.innerHTML = `
                <span class="weekoff-date">${date}</span>
                <span class="weekoff-type">${record.type}</span>
                ${record.note ? `<span class="weekoff-note">${record.note}</span>` : ''}
            `;
            
            weekoffRecords.appendChild(recordElement);
        });
    }
}

// Submit week off with enhanced options
async function submitWeekOff() {
    if (!isAdmin) {
        alert('Access denied. Please enter admin mode.');
        return;
    }
    
    const type = document.getElementById('weekoff-type').value;
    const note = document.getElementById('weekoff-note').value.trim();
    
    if (!type) {
        alert('Please select a week off type');
        return;
    }
    
    try {
        // Get current data
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch current data');
        
        const data = await response.json();
        const currentData = data.record || {};
        const currentWeekoffs = currentData.weekoffs || [];
        
        // Check if week off already marked today
        const today = new Date().toISOString().split('T')[0];
        const alreadyMarked = currentWeekoffs.some(record => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            return recordDate === today;
        });
        
        if (alreadyMarked) {
            alert('Week off already marked for today');
            return;
        }
        
        // Create new record
        const newRecord = {
            type,
            date: new Date().toISOString(),
            ...(note && { note })
        };
        
        // Update data
        const updatedWeekoffs = [...currentWeekoffs, newRecord];
        const updatedData = {
            ...currentData,
            weekoffs: updatedWeekoffs
        };
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit week off');
        
        // Show success message
        alert(`Successfully marked ${type} week off for today${note ? ` with note: ${note}` : ''}`);
        
        // Reset form
        weekoffForm.reset();
        
        // Reload week offs
        loadWeekOffs();
    } catch (error) {
        console.error('Error submitting week off:', error);
        alert('Failed to submit week off. Please try again later.');
    }
}
