// Security Configuration
const ALLOWED_IP = '106.222.216.143';
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

// Security Variables
let isAdmin = false;
let clientIP = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set current year
    currentYear.textContent = new Date().getFullYear();
    
    // Initialize security checks
    initSecurity();
    
    // Load reviews
    loadReviews();
    
    // Load attendance records if admin
    if (isAdmin) {
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
    // Get client IP
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        clientIP = data.ip;
        
        // Check if IP matches admin IP
        if (clientIP === ALLOWED_IP) {
            isAdmin = true;
            attendanceNav.style.display = 'block';
            weekoffNav.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching IP:', error);
        // If IP detection fails, assume non-admin
        isAdmin = false;
    }
    
    // Prevent right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityMessage('Context menu is disabled for security reasons.');
    });
    
    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') || 
            (e.ctrlKey && e.shiftKey && e.key === 'J') || 
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            showSecurityMessage('Developer tools are disabled for security reasons.');
        }
    });
    
    // Detect if dev tools are open
    setInterval(function() {
        const before = new Date().getTime();
        debugger;
        const after = new Date().getTime();
        if (after - before > 100) {
            showSecurityMessage('Developer tools detected. This action has been logged.');
            logSecurityViolation('Developer tools opened');
        }
    }, 1000);
}

// Show security message
function showSecurityMessage(message) {
    // Create security message element if it doesn't exist
    let securityMsg = document.querySelector('.security-message');
    if (!securityMsg) {
        securityMsg = document.createElement('div');
        securityMsg.className = 'security-message';
        securityMsg.innerHTML = `
            <h2>Security Alert</h2>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(securityMsg);
        
        // Blur the content
        document.querySelectorAll('section, footer').forEach(el => {
            el.classList.add('blur-content');
        });
    }
}

// Log security violation
function logSecurityViolation(action) {
    // In a real application, you would send this to your server
    console.warn(`Security violation: ${action} from IP: ${clientIP}`);
}

// Setup event listeners
function setupEventListeners() {
    // Review form submission
    reviewForm.addEventListener('submit', submitReview);
    
    // Tip button click
    tipBtn.addEventListener('click', initiateTipPayment);
    
    // Attendance buttons
    if (isAdmin) {
        presentBtn.addEventListener('click', markPresent);
        absentBtn.addEventListener('click', markAbsent);
        submitWeekoff.addEventListener('click', submitWeekOff);
    }
    
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
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to load reviews');
        
        const data = await response.json();
        const reviews = data.record?.reviews || [];
        
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = '<p>Failed to load reviews. Please try again later.</p>';
    }
}

// Display reviews
function displayReviews(reviews) {
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to leave feedback!</p>';
        return;
    }
    
    reviewsContainer.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        const date = new Date(review.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <span class="review-name">${review.passengerName}</span>
                <span class="review-date">${date}</span>
            </div>
            <span class="review-service">${review.service}</span>
            <div class="review-content">${review.feedback}</div>
            ${review.tipped ? '<div class="review-tip">❤️ Tipped ₹15</div>' : ''}
        `;
        
        reviewsContainer.appendChild(reviewCard);
    });
}

// Submit review
async function submitReview(e) {
    e.preventDefault();
    
    const passengerName = document.getElementById('passenger-name').value;
    const age = document.getElementById('passenger-age').value;
    const pnr = document.getElementById('pnr').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const feedback = document.getElementById('feedback').value;
    const tipped = tipBtn.textContent.includes('Tipped');
    
    // Validate form
    if (!passengerName || !age || !pnr || !phone || !service || !feedback) {
        alert('Please fill all required fields');
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
        const currentReviews = data.record?.reviews || [];
        
        // Add new review
        const updatedReviews = [...currentReviews, review];
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ reviews: updatedReviews })
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit review');
        
        // Show success message
        alert('Thank you for your feedback!');
        
        // Reset form
        reviewForm.reset();
        tipStatus.textContent = '';
        tipBtn.textContent = 'Add Tip ₹15';
        
        // Reload reviews
        loadReviews();
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again later.');
    }
}

// Initiate tip payment
function initiateTipPayment() {
    if (tipBtn.textContent.includes('Tipped')) return;
    
    const options = {
        key: RAZORPAY_KEY,
        amount: 1500, // 15 rupees in paise
        currency: 'INR',
        name: 'Daksh Hande',
        description: 'Service Tip',
        image: '',
        handler: function(response) {
            tipStatus.textContent = 'Payment successful!';
            tipBtn.textContent = '✓ Tipped ₹15';
            tipBtn.style.backgroundColor = '#28a745';
        },
        prefill: {
            name: document.getElementById('passenger-name').value || '',
            email: '',
            contact: document.getElementById('phone').value || ''
        },
        notes: {
            address: 'Air India Express Service Tip'
        },
        theme: {
            color: '#003580'
        }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
    rzp.on('payment.failed', function(response) {
        tipStatus.textContent = 'Payment failed. Please try again.';
        console.error(response.error);
    });
}

// Load attendance records
async function loadAttendance() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to load attendance');
        
        const data = await response.json();
        const attendance = data.record?.attendance || [];
        
        displayAttendance(attendance);
    } catch (error) {
        console.error('Error loading attendance:', error);
        attendanceRecords.innerHTML = '<p>Failed to load attendance records.</p>';
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
    
    records.forEach(record => {
        const recordElement = document.createElement('div');
        recordElement.className = `attendance-record ${record.status.toLowerCase()}`;
        
        const date = new Date(record.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        recordElement.innerHTML = `
            <span class="attendance-date">${date}</span>
            <span class="attendance-status">${record.status === 'present' ? '✓ Present' : '✗ Absent'}</span>
        `;
        
        attendanceRecords.appendChild(recordElement);
    });
}

// Mark present
async function markPresent() {
    await submitAttendance('present');
}

// Mark absent
async function markAbsent() {
    await submitAttendance('absent');
}

// Submit attendance
async function submitAttendance(status) {
    if (!isAdmin) {
        alert('Access denied');
        return;
    }
    
    try {
        // Get current attendance
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch current attendance');
        
        const data = await response.json();
        const currentAttendance = data.record?.attendance || [];
        const currentRecord = {
            status,
            date: new Date().toISOString(),
            ip: clientIP
        };
        
        // Check if attendance already marked today
        const today = new Date().toLocaleDateString();
        const alreadyMarked = currentAttendance.some(record => {
            const recordDate = new Date(record.date).toLocaleDateString();
            return recordDate === today;
        });
        
        if (alreadyMarked) {
            alert('Attendance already marked for today');
            return;
        }
        
        // Add new record
        const updatedAttendance = [...currentAttendance, currentRecord];
        
        // Get current data
        const currentData = data.record || {};
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                ...currentData,
                attendance: updatedAttendance
            })
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit attendance');
        
        // Show success message
        alert(`Marked ${status} for today`);
        
        // Reload attendance
        loadAttendance();
    } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('Failed to submit attendance. Please try again later.');
    }
}

// Load week off records
async function loadWeekOffs() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to load week offs');
        
        const data = await response.json();
        const weekoffs = data.record?.weekoffs || [];
        
        displayWeekOffs(weekoffs);
    } catch (error) {
        console.error('Error loading week offs:', error);
        weekoffRecords.innerHTML = '<p>Failed to load week off records.</p>';
    }
}

// Display week off records
function displayWeekOffs(records) {
    if (records.length === 0) {
        weekoffRecords.innerHTML = '<p>No week off records yet.</p>';
        return;
    }
    
    // Sort by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    weekoffRecords.innerHTML = '';
    
    records.forEach(record => {
        const recordElement = document.createElement('div');
        recordElement.className = 'weekoff-record';
        
        const date = new Date(record.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        recordElement.innerHTML = `
            <span class="weekoff-date">${date}</span>
            <span class="weekoff-type">${record.type}</span>
        `;
        
        weekoffRecords.appendChild(recordElement);
    });
}

// Submit week off
async function submitWeekOff() {
    if (!isAdmin) {
        alert('Access denied');
        return;
    }
    
    const type = document.getElementById('weekoff-type').value;
    
    try {
        // Get current week offs
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch current week offs');
        
        const data = await response.json();
        const currentWeekoffs = data.record?.weekoffs || [];
        const currentRecord = {
            type,
            date: new Date().toISOString(),
            ip: clientIP
        };
        
        // Check if week off already marked today
        const today = new Date().toLocaleDateString();
        const alreadyMarked = currentWeekoffs.some(record => {
            const recordDate = new Date(record.date).toLocaleDateString();
            return recordDate === today;
        });
        
        if (alreadyMarked) {
            alert('Week off already marked for today');
            return;
        }
        
        // Add new record
        const updatedWeekoffs = [...currentWeekoffs, currentRecord];
        
        // Get current data
        const currentData = data.record || {};
        
        // Update JSONBin
        const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({
                ...currentData,
                weekoffs: updatedWeekoffs
            })
        });
        
        if (!updateResponse.ok) throw new Error('Failed to submit week off');
        
        // Show success message
        alert(`Marked ${type} week off for today`);
        
        // Reload week offs
        loadWeekOffs();
    } catch (error) {
        console.error('Error submitting week off:', error);
        alert('Failed to submit week off. Please try again later.');
    }
}
