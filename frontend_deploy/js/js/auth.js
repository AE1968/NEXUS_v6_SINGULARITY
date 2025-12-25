
class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('kdh_user')) || null;

        // Base users
        this.users = {
            'admin': { pass: 'Andrada_1968!', role: 'admin', storage: 'Unlimited' },
            'Adrian': { pass: 'Andrada_1968!', role: 'admin', storage: 'Unlimited', plan: 'subscription' },
            'PrepayKid': { pass: '1234', role: 'user', storage: '1GB', plan: 'prepay', parentEmail: 'parent@test.com' },
            'SubKid': { pass: '1234', role: 'user', storage: 'Unl.', plan: 'subscription', parentEmail: 'parent@test.com' },
            'demo': { pass: 'demo', role: 'free', storage: '100MB' }
        };

        // Load custom registered users
        const customUsers = JSON.parse(localStorage.getItem('kdh_registered_users') || '{}');
        this.users = { ...this.users, ...customUsers };
    }

    register(username, password, email, plan, billingDetails) {
        if (this.users[username]) {
            return { success: false, message: 'Nume utilizator existent!' };
        }

        const newUser = {
            pass: password,
            email: email || '',
            role: 'user',
            storage: plan === 'free' ? '100MB' : 'Unlimited',
            plan: plan, // 'free', 'monthly', 'yearly'
            billing: billingDetails || {}, // Legal details for subscriptions
            joined: new Date().toISOString()
        };

        // Save to memory
        this.users[username] = newUser;

        // Persist
        const customUsers = JSON.parse(localStorage.getItem('kdh_registered_users') || '{}');
        customUsers[username] = newUser;
        localStorage.setItem('kdh_registered_users', JSON.stringify(customUsers));

        return { success: true, message: 'Cont creat cu succes!' };
    }

    login(username, password) {
        // Direct override for testing easy access during dev
        if (username === 'Adrian' && password === 'Andrada_1968!') {
            return this.performLogin({
                username: 'Adrian',
                role: 'admin',
                storage: 'Unlimited',
                plan: 'subscription',
                parentEmail: 'adrian@kdh.com'
            });
        }

        // Specific Test User for Prepay Timer
        if (username === 'Prepay' && password === '1234') {
            return this.performLogin({
                username: 'PrepayKid',
                role: 'user',
                storage: '1GB',
                plan: 'prepay',
                dailyLimit: 120, // 2 hours
                parentEmail: 'parent@test.com'
            });
        }

        const user = this.users[username];
        if (user && user.pass === password) {
            // Remove admin flag if it's a normal user
            if (user.role !== 'admin') {
                localStorage.removeItem('kdh_admin_mode');
            }
            return this.performLogin({ username, ...user });
        }
        return false;
    }

    performLogin(userObj) {
        this.currentUser = userObj;
        localStorage.setItem('kdh_user', JSON.stringify(this.currentUser));

        if (userObj.role === 'admin') {
            localStorage.setItem('kdh_admin_mode', 'true');
        } else {
            localStorage.removeItem('kdh_admin_mode');
        }

        // Reset session logs on new login
        localStorage.setItem('kdh_activity_log', '[]');
        localStorage.setItem('kdh_today_seconds', '0');

        window.location.reload();
        return true;
    }

    logout() {
        // Trigger Report
        if (window.sessionManager) window.sessionManager.sendReport();

        this.currentUser = null;
        localStorage.removeItem('kdh_user');
        localStorage.removeItem('kdh_admin_mode');
        window.location.href = 'index.html';
    }

    isLoggedIn() { return !!this.currentUser; }
    isAdmin() { return this.currentUser && this.currentUser.role === 'admin'; }
    getStorageLimit() { return this.currentUser ? this.currentUser.storage : '0GB'; }

    applyProtection() {
        const premiumSlots = document.querySelectorAll('.slot .empty-label span');
        const premiumContainers = [];
        document.querySelectorAll('.slot').forEach(slot => {
            if (slot.innerText.includes('Premium')) premiumContainers.push(slot);
        });

        if (!this.isLoggedIn()) {
            premiumContainers.forEach(slot => {
                slot.closest('.slot') ? slot.closest('.slot').style.display = 'none' : slot.style.display = 'none';
            });
            document.querySelectorAll('.premium-slot').forEach(el => el.style.display = 'none');
        } else {
            premiumContainers.forEach(slot => {
                slot.closest('.slot') ? slot.closest('.slot').style.display = 'flex' : slot.style.display = 'flex';
            });
            document.querySelectorAll('.premium-slot').forEach(el => el.style.display = 'flex');
        }

        const deleteBtns = document.querySelectorAll('.btn-delete');
        deleteBtns.forEach(btn => {
            if (!this.isAdmin()) btn.style.display = 'none';
            else btn.style.display = 'flex';
        });

        if (this.isAdmin()) document.body.classList.add('admin-active');

        // Init Session Manager if logged in
        if (this.isLoggedIn() && window.sessionManager) {
            window.sessionManager.init(this.currentUser);
        }
    }
}

// --- SESSION MANAGER CLASS ---
class SessionManager {
    constructor() {
        this.timerInterval = null;
        this.user = null;
    }

    init(user) {
        if (this.timerInterval) clearInterval(this.timerInterval); // Avoid dupes
        this.user = user;
        this.logActivity();
        this.startSessionTimer();

        // ONLY Render Visual Timer for PREPAY plan
        if (this.user.plan === 'prepay') {
            this.renderVisualTimer();
        }
    }

    startSessionTimer() {
        let usedSeconds = parseInt(localStorage.getItem('kdh_today_seconds') || 0);

        this.timerInterval = setInterval(() => {
            usedSeconds++;
            localStorage.setItem('kdh_today_seconds', usedSeconds);

            if (this.user.plan === 'prepay') {
                const limitSeconds = (this.user.dailyLimit || 120) * 60; // default 2 hours
                const remaining = limitSeconds - usedSeconds;
                this.updateVisualTimer(remaining);
                if (remaining <= 0) this.lockSession();
            }
        }, 1000);
    }

    renderVisualTimer() {
        if (document.getElementById('kidsTimer')) return;
        const timerDiv = document.createElement('div');
        timerDiv.id = 'kidsTimer';
        timerDiv.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            background: #FF6F00; color: white; padding: 10px 20px;
            border-radius: 50px; font-family: 'Fredoka', sans-serif;
            font-size: 1.5rem; font-weight: bold; border: 4px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 99999;
            display: flex; align-items: center; gap: 10px;
        `;
        timerDiv.innerHTML = `<span>⏳</span><span id="timerText">--:--</span>`;
        document.body.appendChild(timerDiv);
    }

    updateVisualTimer(remainingSeconds) {
        const el = document.getElementById('timerText');
        if (!el) return;
        if (remainingSeconds < 0) remainingSeconds = 0;
        const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secs = (remainingSeconds % 60).toString().padStart(2, '0');
        el.innerText = `${mins}:${secs}`;
    }

    logActivity() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const activityLog = JSON.parse(localStorage.getItem('kdh_activity_log') || '[]');
        activityLog.push({ page: page, time: new Date().toLocaleTimeString(), title: document.title });
        localStorage.setItem('kdh_activity_log', JSON.stringify(activityLog));
    }

    sendReport() {
        if (!this.user || !this.user.parentEmail) return;
        const activityLog = JSON.parse(localStorage.getItem('kdh_activity_log') || '[]');
        const totalSeconds = localStorage.getItem('kdh_today_seconds') || 0;
        const mins = Math.floor(totalSeconds / 60);

        // Simulating Backend Email Trigger (To be replaced with real API call)
        console.log(`[Report] Sending to ${this.user.parentEmail}... Time: ${mins}m`);
    }

    lockSession() {
        clearInterval(this.timerInterval);
        alert("⏰ Time's Up! See you tomorrow!");
        this.sendReport();
        auth.logout();
    }
}

const auth = new AuthManager();
const sessionManager = new SessionManager();



// --- NETLIFY IDENTITY INTEGRATION (REAL AUTH) ---
// This enables real User/Password login without a custom backend
function initNetlifyAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                console.log('No user logged in via Netlify Identity');
            } else {
                console.log('User logged in:', user);
                // Sync Netlify User to our Local Manager
                auth.performLogin({
                    username: user.user_metadata.full_name || user.email.split('@')[0],
                    email: user.email,
                    role: user.app_metadata.roles ? user.app_metadata.roles[0] : 'user', // "premium" role comes from here
                    plan: 'subscription' // Assume sub if authenticated via this strict method
                });
            }
        });

        window.netlifyIdentity.on('login', user => {
            window.location.reload();
        });

        window.netlifyIdentity.on('logout', () => {
            auth.logout();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for DOM
    auth.applyProtection();

    // Init Real Auth
    initNetlifyAuth();

    // Existing Login Form (Legacy/Demo fallback)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // ... (Existing UI Logic) ...
        if (auth.isLoggedIn()) {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('profile-section').style.display = 'block';
            document.getElementById('user-name-display').textContent = auth.currentUser.username;
            document.getElementById('storage-display').textContent = auth.currentUser.storage;
            if (document.getElementById('btn-logout')) document.getElementById('btn-logout').style.display = 'block';
        } else {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('profile-section').style.display = 'none';
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            if (!auth.login(u, p)) alert('Invalid credentials! Try "Adrian" / "1234"');
        });
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        if (window.netlifyIdentity && window.netlifyIdentity.currentUser()) {
            window.netlifyIdentity.logout();
        } else {
            auth.logout();
        }
    });
});
