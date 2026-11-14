// Supabase Project Constants
const SUPABASE_URL = "https://hbleacgjtfkvjdzchjov.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jvldVxF-_wdvvq_UHYUEaw_sVyF-GsZ";

// Global Platform State
let currentUser = null;
let isAdmin = false;
let selectedProductForInvest = { name: '', rate: 10.0 };
let privacyMask = false;

// Central Database in LocalStorage mimicking Supabase backend tables
function getDB() {
    let db = localStorage.getItem('kudiva_master_db');
    if (!db) {
        db = {
            users: {
                'omoopeola1@gmail.com': {
                    name: 'Ola Omoope',
                    email: 'omoopeola1@gmail.com',
                    bank: 'UBA Nigeria',
                    accountNumber: '2084920194',
                    balance: 150000.00,
                    invested: 50000.00,
                    dailyYield: 12500.00,
                    investments: [
                        { name: 'UBA Treasury Prime Growth', rate: 10.0, amount: 50000.00, date: '14 Nov 2026' }
                    ],
                    transactions: [
                        { desc: 'UBA Direct Deposit', ref: 'TRF-UBA-98214', date: '14 Nov 2026', type: 'Deposit', amount: '₦150,000.00', status: 'Success' }
                    ],
                    goals: [
                        { name: 'UBA Emergency Reserve', target: 500000, current: 50000 }
                    ],
                    tickets: [
                        { category: 'UBA Deposit Approval Delay', msg: 'Please confirm deposit TRF-UBA-98214.', reply: 'Verified and approved by Admin.', date: '14 Nov 2026' }
                    ]
                }
            },
            pendingQueue: [],
            globalTickets: [
                { id: 1, email: 'omoopeola1@gmail.com', category: 'UBA Deposit Approval Delay', msg: 'Please confirm deposit TRF-UBA-98214.', reply: 'Verified and approved by Admin.', date: '14 Nov 2026' }
            ]
        };
        localStorage.setItem('kudiva_master_db', JSON.stringify(db));
    }
    return JSON.parse(db);
}

function saveDB(db) {
    localStorage.setItem('kudiva_master_db', JSON.stringify(db));
}

// Initialization on load
window.addEventListener('DOMContentLoaded', () => {
    const activeSession = localStorage.getItem('kudiva_active_session');
    if (activeSession) {
        const session = JSON.parse(activeSession);
        currentUser = session.user;
        // Strict Admin verification check
        isAdmin = currentUser.email.toLowerCase() === 'omoopeola1@gmail.com';
        unlockApp();
    }
});

// Auth Tabs
function switchAuthTab(tab) {
    document.getElementById('tab-login').className = tab === 'login' ? 'flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-slate-900 shadow-sm transition' : 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-500 transition';
    document.getElementById('tab-register').className = tab === 'register' ? 'flex-1 py-2 text-sm font-semibold rounded-lg bg-white text-slate-900 shadow-sm transition' : 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-500 transition';
    
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const db = getDB();
    if (!db.users[email]) {
        alert('Account not found. Please register first.');
        return;
    }
    currentUser = db.users[email];
    isAdmin = currentUser.email.toLowerCase() === 'omoopeola1@gmail.com';
    completeLogin();
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const bank = document.getElementById('reg-bank').value;
    const accountNumber = document.getElementById('reg-accno').value.trim();

    const db = getDB();
    if (db.users[email]) {
        alert('An account with this email already exists.');
        return;
    }

    db.users[email] = {
        name,
        email,
        bank,
        accountNumber,
        balance: 0.00,
        invested: 0.00,
        dailyYield: 0.00,
        investments: [],
        transactions: [],
        goals: [{ name: 'Initial Savings Target', target: 200000, current: 0 }],
        tickets: []
    };
    saveDB(db);

    currentUser = db.users[email];
    isAdmin = currentUser.email.toLowerCase() === 'omoopeola1@gmail.com';
    completeLogin();
}

function completeLogin() {
    localStorage.setItem('kudiva_active_session', JSON.stringify({ user: currentUser }));
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('opacity-40', 'pointer-events-none');
    
    // Toggle Admin Navigation Button Visibility based strictly on email
    const adminNav = document.getElementById('admin-nav-container');
    if (currentUser.email.toLowerCase() === 'omoopeola1@gmail.com') {
        adminNav.classList.remove('hidden');
    } else {
        adminNav.classList.add('hidden');
    }

    switchTab('overview');
    loadUserData();
}

function handleLogout() {
    localStorage.removeItem('kudiva_active_session');
    location.reload();
}

function unlockApp() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('opacity-40', 'pointer-events-none');
    
    const adminNav = document.getElementById('admin-nav-container');
    if (currentUser && currentUser.email.toLowerCase() === 'omoopeola1@gmail.com') {
        adminNav.classList.remove('hidden');
    } else {
        adminNav.classList.add('hidden');
    }

    switchTab('overview');
    loadUserData();
}

// Data Sync for User
function loadUserData() {
    const db = getDB();
    if (!currentUser || !db.users[currentUser.email]) return;
    currentUser = db.users[currentUser.email];

    const firstName = currentUser.name.split(' ')[0];
    document.getElementById('welcome-heading').innerText = `Welcome back, ${firstName}`;
    document.getElementById('topbar-username').innerText = currentUser.name;
    document.getElementById('topbar-bankinfo').innerText = `${currentUser.bank} • ${currentUser.accountNumber}`;
    document.getElementById('user-initials-badge').innerText = currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

    updateUserUI();
}

function persistUserData() {
    const db = getDB();
    db.users[currentUser.email] = currentUser;
    saveDB(db);
    updateUserUI();
}

function updateUserUI() {
    const fmtBal = privacyMask ? '₦••••••' : '₦' + Number(currentUser.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const fmtPort = privacyMask ? '₦••••••' : '₦' + Number(currentUser.invested + currentUser.dailyYield).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const fmtYield = privacyMask ? '₦••••••' : '₦' + Number(currentUser.dailyYield).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    document.getElementById('stat-portfolio-value').innerText = fmtPort;
    document.getElementById('stat-available-balance').innerText = fmtBal;
    document.getElementById('stat-daily-yield').innerText = fmtYield;
    document.getElementById('portfolio-total-large').innerText = fmtPort;
    
    const db = getDB();
    const pendingCount = db.pendingQueue.filter(q => q.email === currentUser.email).length;
    document.getElementById('stat-pending-count').innerText = pendingCount;

    // Transactions Table
    const tbody = document.getElementById('transactions-table-body');
    if (currentUser.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No transactions recorded yet.</td></tr>`;
    } else {
        tbody.innerHTML = currentUser.transactions.map(tx => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-semibold text-slate-900">${tx.desc}</td>
                <td class="p-4 text-xs font-mono text-slate-500">${tx.ref}</td>
                <td class="p-4 text-xs text-slate-500">${tx.date}</td>
                <td class="p-4"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">${tx.type}</span></td>
                <td class="p-4 font-bold text-slate-900">${tx.amount}</td>
                <td class="p-4"><span class="px-2.5 py-1 ${tx.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-xs rounded-full font-bold">${tx.status}</span></td>
            </tr>
        `).join('');
    }

    // Portfolio Holdings List
    const holdingsList = document.getElementById('portfolio-holdings-list');
    if (currentUser.investments.length === 0) {
        holdingsList.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm"><i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300 block"></i>No active investments yet. Explore products to earn 10% daily.</div>`;
    } else {
        holdingsList.innerHTML = currentUser.investments.map((inv, idx) => `
            <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h5 class="font-bold text-slate-900 text-sm">${inv.name}</h5>
                    <p class="text-xs text-slate-500">Rate: ${inv.rate}% Daily · Principal: ₦${Number(inv.amount).toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <div class="font-bold text-emerald-700">+ 10% Daily Yield Active</div>
                    <button onclick="harvestYield(${idx})" class="text-[11px] bg-emerald-700 text-white px-3 py-1 rounded-lg mt-1 font-bold hover:bg-emerald-800 transition">Harvest Yield to Wallet</button>
                </div>
            </div>
        `).join('');
    }

    // Goals List
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = currentUser.goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        return `
            <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <div class="flex justify-between items-center text-sm">
                    <span class="font-bold text-slate-900">${g.name}</span>
                    <span class="font-bold text-emerald-700">${pct}%</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-600 h-full rounded-full" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Current: ₦${Number(g.current).toLocaleString()}</span>
                    <span>Target: ₦${Number(g.target).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    // Support Tickets List
    const ticketsList = document.getElementById('user-tickets-list');
    if (!currentUser.tickets || currentUser.tickets.length === 0) {
        ticketsList.innerHTML = `<div class="text-slate-400 text-xs italic">No support tickets submitted yet.</div>`;
    } else {
        ticketsList.innerHTML = currentUser.tickets.map(t => `
            <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-700">
                    <span>${t.category}</span>
                    <span class="text-slate-400">${t.date}</span>
                </div>
                <p class="text-xs text-slate-600"><strong>Query:</strong> ${t.msg}</p>
                <p class="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200"><strong>Admin Reply:</strong> ${t.reply || 'Pending Admin review...'}</p>
            </div>
        `).join('');
    }
}

// Navigation
function switchTab(tabId) {
    // If switching to admin-dashboard, double-verify email
    if (tabId === 'admin-dashboard') {
        if (!currentUser || currentUser.email.toLowerCase() !== 'omoopeola1@gmail.com') {
            alert('Access Denied. Admin Dashboard is restricted to omoopeola1@gmail.com.');
            return;
        }
        loadAdminDashboard();
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#nav-menu button').forEach(el => {
        if (el.getAttribute('data-tab') !== 'admin-dashboard') {
            el.className = 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition hover:bg-emerald-950/50 text-slate-300';
        }
    });

    document.getElementById('view-' + tabId).classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        if (tabId === 'admin-dashboard') {
            activeBtn.className = 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition bg-amber-500 text-emerald-950 shadow-sm';
        } else {
            activeBtn.className = 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition bg-emerald-950 text-white shadow-sm';
        }
    }
    
    const titles = {
        overview: 'Your wealth, clearly understood',
        portfolio: 'My portfolio',
        explore: 'Explore investments (10% Daily)',
        transactions: 'Transactions & Approvals',
        planning: 'Financial planning',
        rewards: 'Rewards & referrals',
        support: 'Help & support',
        'admin-dashboard': 'Admin Control Center'
    };
    document.getElementById('current-breadcrumb').innerText = titles[tabId];
}

// Admin Sub-tabs
function switchAdminTab(subId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-sub-' + subId).classList.add('active');

    document.getElementById('adm-btn-approvals').className = subId === 'approvals' ? 'px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 text-white transition shadow' : 'px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-700 border border-slate-200 transition';
    document.getElementById('adm-btn-users').className = subId === 'users' ? 'px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 text-white transition shadow' : 'px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-700 border border-slate-200 transition';
    document.getElementById('adm-btn-tickets').className = subId === 'tickets' ? 'px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 text-white transition shadow' : 'px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-700 border border-slate-200 transition';

    loadAdminDashboard();
}

// Modals
function openDepositModal() { document.getElementById('modal-deposit').classList.remove('hidden'); }
function openWithdrawModal() { document.getElementById('modal-withdraw').classList.add('hidden'); calculateWithdrawFee(); document.getElementById('modal-withdraw').classList.remove('hidden'); }
function openGoalModal() { document.getElementById('modal-goal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function openInvestModal(productName, rate) {
    selectedProductForInvest = { name: productName, rate: rate };
    document.getElementById('invest-title').innerText = `Invest in ${productName}`;
    document.getElementById('modal-invest').classList.remove('hidden');
}

// Financial & Approval Workflows
function submitDepositRequest() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const ref = document.getElementById('deposit-ref').value.trim();
    if (!amount || amount <= 0 || !ref) {
        alert('Please enter a valid amount and UBA reference number.');
        return;
    }

    const db = getDB();
    db.pendingQueue.push({
        id: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        email: currentUser.email,
        type: 'Deposit',
        amount: amount,
        details: `UBA Ref: ${ref}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    currentUser.transactions.unshift({
        desc: 'UBA Direct Deposit (Pending Admin)',
        ref: ref,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Deposit',
        amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Pending Approval'
    });

    saveDB(db);
    persistUserData();
    closeModal('modal-deposit');
    alert('Deposit submitted successfully! Awaiting Admin approval.');
}

function calculateWithdrawFee() {
    const gross = parseFloat(document.getElementById('withdraw-gross').value) || 0;
    const fee = gross * 0.15;
    const net = gross - fee;
    document.getElementById('w-gross-display').innerText = '₦' + gross.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('w-fee-display').innerText = '-₦' + fee.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('w-net-display').innerText = '₦' + net.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function submitWithdrawRequest() {
    const gross = parseFloat(document.getElementById('withdraw-gross').value);
    if (!gross || gross <= 0) return alert('Enter a valid amount');
    if (gross > currentUser.balance) return alert('Insufficient available balance in wallet');

    const fee = gross * 0.15;
    const net = gross - fee;

    currentUser.balance -= gross;

    const db = getDB();
    db.pendingQueue.push({
        id: 'WIT-' + Math.floor(100000 + Math.random() * 900000),
        email: currentUser.email,
        type: 'Withdrawal',
        amount: gross,
        netAmount: net,
        fee: fee,
        details: `Bank: ${currentUser.bank} (${currentUser.accountNumber}) · Net: ₦${net.toLocaleString()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    currentUser.transactions.unshift({
        desc: `Withdrawal to ${currentUser.bank} (Pending)`,
        ref: 'KDV-WIT-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Withdrawal',
        amount: '₦' + gross.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Pending Approval (15% Fee)'
    });

    saveDB(db);
    persistUserData();
    closeModal('modal-withdraw');
    alert(`Withdrawal request submitted! ₦${net.toLocaleString()} will be sent to your ${currentUser.bank} account upon Admin approval (15% fee applied).`);
}

function executeInvestment() {
    const amount = parseFloat(document.getElementById('invest-amount').value);
    if (!amount || amount <= 0) return alert('Enter valid amount');
    if (amount > currentUser.balance) return alert('Insufficient available cash in wallet');

    currentUser.balance -= amount;
    currentUser.invested += amount;
    currentUser.investments.push({
        name: selectedProductForInvest.name,
        rate: selectedProductForInvest.rate,
        amount: amount,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    currentUser.transactions.unshift({
        desc: `Investment: ${selectedProductForInvest.name}`,
        ref: 'KDV-INV-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Investment',
        amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Active (10% Daily)'
    });

    persistUserData();
    closeModal('modal-invest');
    alert(`Successfully invested ₦${amount.toLocaleString()} into ${selectedProductForInvest.name} (10% daily return active)!`);
}

function triggerDailyReturnSimulation() {
    if (!currentUser) return;
    let yieldEarned = 0;
    currentUser.investments.forEach(inv => {
        yieldEarned += inv.amount * 0.10;
    });
    if (yieldEarned <= 0) {
        alert('No active investments to generate 10% daily returns. Explore investments first.');
        return;
    }
    currentUser.dailyYield += yieldEarned;
    persistUserData();
    alert(`⚡ 10% Daily Return Accrued! Added ₦${yieldEarned.toLocaleString()} to your yield ledger.`);
}

function harvestYield(idx) {
    const yieldAmount = currentUser.dailyYield;
    if (yieldAmount <= 0) return alert('No accrued yield to harvest');
    currentUser.balance += yieldAmount;
    currentUser.dailyYield = 0;
    currentUser.transactions.unshift({
        desc: 'Harvested 10% Daily Yield to Wallet',
        ref: 'KDV-YLD-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Yield Harvest',
        amount: '₦' + yieldAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Success'
    });
    persistUserData();
    alert(`Successfully transferred ₦${yieldAmount.toLocaleString()} to your Available Balance!`);
}

function executeCreateGoal() {
    const name = document.getElementById('goal-name-input').value;
    const target = parseFloat(document.getElementById('goal-target-input').value);
    if (!name || !target) return alert('Fill in all fields');
    currentUser.goals.push({ name, target, current: 0 });
    persistUserData();
    closeModal('modal-goal');
}

function submitSupportTicket() {
    const category = document.getElementById('support-category').value;
    const msg = document.getElementById('support-msg').value.trim();
    if (!msg) return alert('Enter your support message');

    const ticket = {
        id: Date.now(),
        email: currentUser.email,
        category,
        msg,
        reply: '',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    currentUser.tickets.unshift(ticket);
    const db = getDB();
    db.globalTickets.unshift(ticket);
    saveDB(db);
    persistUserData();

    document.getElementById('support-msg').value = '';
    alert('Support ticket submitted to Admin successfully!');
}

function togglePrivacy() {
    privacyMask = !privacyMask;
    document.getElementById('privacy-icon').className = privacyMask ? 'fa-regular fa-eye-slash text-sm' : 'fa-regular fa-eye text-sm';
    updateUserUI();
}

function copyReferralCode() {
    navigator.clipboard.writeText('KUDIVA-LEKKXY26');
    alert('Referral code copied to clipboard!');
}

// ================= ADMIN DASHBOARD LOGIC =================
function loadAdminDashboard() {
    if (!currentUser || currentUser.email.toLowerCase() !== 'omoopeola1@gmail.com') return;

    const db = getDB();
    document.getElementById('count-pending-approvals').innerText = db.pendingQueue.length;
    document.getElementById('count-total-users').innerText = Object.keys(db.users).length;
    document.getElementById('count-support-tickets').innerText = db.globalTickets.length;

    const appTable = document.getElementById('admin-approvals-table');
    if (db.pendingQueue.length === 0) {
        appTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No pending requests in queue.</td></tr>`;
    } else {
        appTable.innerHTML = db.pendingQueue.map((item, index) => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-slate-900">${item.email}</td>
                <td class="p-4"><span class="px-2.5 py-1 ${item.type === 'Deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-xs rounded-full font-bold">${item.type}</span></td>
                <td class="p-4 font-bold text-slate-900">₦${Number(item.amount).toLocaleString()}</td>
                <td class="p-4 text-xs text-slate-600">${item.details}</td>
                <td class="p-4 text-xs text-slate-500">${item.date}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="adminApprove(${index})" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition">Approve</button>
                    <button onclick="adminReject(${index})" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">Reject</button>
                </td>
            </tr>
        `).join('');
    }

    const usersTable = document.getElementById('admin-users-table');
    const userKeys = Object.keys(db.users);
    if (userKeys.length === 0) {
        usersTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No registered users found.</td></tr>`;
    } else {
        usersTable.innerHTML = userKeys.map(email => {
            const u = db.users[email];
            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4">
                        <div class="font-bold text-slate-900">${u.name}</div>
                        <div class="text-xs text-slate-500">${u.email}</div>
                    </td>
                    <td class="p-4 text-xs">
                        <div class="font-bold">${u.bank}</div>
                        <div class="font-mono text-slate-500">${u.accountNumber}</div>
                    </td>
                    <td class="p-4 font-bold text-slate-900">₦${Number(u.balance).toLocaleString()}</td>
                    <td class="p-4 font-bold text-slate-900">₦${Number(u.invested).toLocaleString()}</td>
                    <td class="p-4 font-bold text-emerald-700">₦${Number(u.dailyYield).toLocaleString()}</td>
                    <td class="p-4 text-right space-x-2">
                        <button onclick="adminCreditUser('${email}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition">+ Credit</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const ticketsList = document.getElementById('admin-tickets-list');
    if (!db.globalTickets || db.globalTickets.length === 0) {
        ticketsList.innerHTML = `<div class="text-slate-400 text-xs italic">No support tickets submitted.</div>`;
    } else {
        ticketsList.innerHTML = db.globalTickets.map((t, idx) => `
            <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-700">
                    <span>User: ${t.email} (${t.category})</span>
                    <span class="text-slate-400">${t.date}</span>
                </div>
                <p class="text-xs text-slate-800"><strong>Query:</strong> ${t.msg}</p>
                <div class="flex space-x-2 pt-2">
                    <input type="text" id="admin-reply-${idx}" placeholder="Type admin response..." value="${t.reply || ''}" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
                    <button onclick="adminSendReply(${idx})" class="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition">Send Reply</button>
                </div>
            </div>
        `).join('');
    }
}

function adminApprove(index) {
    const db = getDB();
    const item = db.pendingQueue.splice(index, 1)[0];
    const targetUser = db.users[item.email];

    if (targetUser) {
        if (item.type === 'Deposit') {
            targetUser.balance += item.amount;
            targetUser.transactions.unshift({
                desc: 'UBA Direct Deposit (Approved)',
                ref: item.id,
                date: item.date,
                type: 'Deposit',
                amount: '₦' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
                status: 'Success'
            });
        } else if (item.type === 'Withdrawal') {
            targetUser.transactions.unshift({
                desc: `Withdrawal Approved (15% Fee: ₦${Number(item.fee).toLocaleString()})`,
                ref: item.id,
                date: item.date,
                type: 'Withdrawal',
                amount: '₦' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
                status: `Paid Net ₦${Number(item.netAmount).toLocaleString()}`
            });
        }
    }

    saveDB(db);
    loadAdminDashboard();
    alert(`Successfully approved ${item.type} of ₦${Number(item.amount).toLocaleString()} for ${item.email}`);
}

function adminReject(index) {
    const db = getDB();
    const item = db.pendingQueue.splice(index, 1)[0];
    const targetUser = db.users[item.email];

    if (targetUser) {
        if (item.type === 'Withdrawal') {
            targetUser.balance += item.amount;
        }
        targetUser.transactions.unshift({
            desc: `${item.type} Request Rejected by Admin`,
            ref: item.id,
            date: item.date,
            type: item.type,
            amount: '₦' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Rejected'
        });
    }

    saveDB(db);
    loadAdminDashboard();
    alert(`Rejected ${item.type} request.`);
}

function adminCreditUser(email) {
    const amtStr = prompt(`Enter amount in NGN to credit ${email}:`, '50000');
    const amt = parseFloat(amtStr);
    if (!amt || amt <= 0) return;

    const db = getDB();
    if (db.users[email]) {
        db.users[email].balance += amt;
        db.users[email].transactions.unshift({
            desc: 'Admin Manual Credit',
            ref: 'KDV-ADM-' + Math.floor(1000 + Math.random() * 9000),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            type: 'Credit',
            amount: '₦' + amt.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Success'
        });
        saveDB(db);
        loadAdminDashboard();
        alert(`Successfully credited ₦${amt.toLocaleString()} to ${email}`);
    }
}

function adminTriggerAllDailyYields() {
    const db = getDB();
    let count = 0;
    Object.keys(db.users).forEach(email => {
        let u = db.users[email];
        let earned = 0;
        u.investments.forEach(inv => {
            earned += inv.amount * 0.10;
        });
        if (earned > 0) {
            u.dailyYield += earned;
            count++;
        }
    });
    saveDB(db);
    loadAdminDashboard();
    alert(`Successfully triggered 10% daily returns across all active investments for ${count} users!`);
}

function adminSendReply(idx) {
    const replyText = document.getElementById(`admin-reply-${idx}`).value.trim();
    if (!replyText) return alert('Enter a reply message');

    const db = getDB();
    const ticket = db.globalTickets[idx];
    ticket.reply = replyText;

    if (db.users[ticket.email]) {
        const uTicket = db.users[ticket.email].tickets.find(t => t.id === ticket.id || t.msg === ticket.msg);
        if (uTicket) uTicket.reply = replyText;
    }

    saveDB(db);
    loadAdminDashboard();
    alert('Support reply sent successfully.');
}

function calculateCompound() {
    const p = parseFloat(document.getElementById('calc-principal').value) || 0;
    const days = parseInt(document.getElementById('calc-days').value) || 10;
    document.getElementById('days-display').innerText = `${days} Days`;
    const total = p * Math.pow(1.10, days);
    document.getElementById('calc-result').innerText = '₦' + Math.round(total).toLocaleString('en-NG');
}
