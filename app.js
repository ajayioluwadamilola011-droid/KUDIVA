// ==========================================
// SUPABASE LIVE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://hbleacgjtfkvjdzchjov.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jvldVxF-_wdvvq_UHYUEaw_sVyF-GsZ';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUser = null;
let isAdmin = false;
let selectedPlanForInvest = null;
let privacyMask = false;

const INVESTMENT_PLANS = [
    { id: 1, name: "UBA Micro Treasury Alpha", minAmount: 10000, image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80", tag: "Plan 1 · Entry Tier" },
    { id: 2, name: "Nigeria Sovereign Growth Yield", minAmount: 25000, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80", tag: "Plan 2 · Bonus Eligible" },
    { id: 3, name: "Lagos Commercial Real Estate Syndicate", minAmount: 50000, image: "https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=600&q=80", tag: "Plan 3 · Balanced" },
    { id: 4, name: "Pan-African Fintech Venture Fund", minAmount: 100000, image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80", tag: "Plan 4 · Growth" },
    { id: 5, name: "West Africa Agro-Export Trust", minAmount: 250000, image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80", tag: "Plan 5 · Commodities" },
    { id: 6, name: "Abuja Prime Infrastructure Bond", minAmount: 500000, image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80", tag: "Plan 6 · Infrastructure" },
    { id: 7, name: "Kudiva Dollar-Hedge Bluechip Pool", minAmount: 1000000, image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80", tag: "Plan 7 · High Yield" },
    { id: 8, name: "Continental Energy & Power Fund", minAmount: 2500000, image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80", tag: "Plan 8 · Energy" },
    { id: 9, name: "Executive Private Wealth Syndicate", minAmount: 5000000, image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80", tag: "Plan 9 · Executive" },
    { id: 10, name: "Sovereign Apex Elite Portfolio", minAmount: 10000000, image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80", tag: "Plan 10 · Apex Tier" }
];

async function getPlatformSettings() {
    if (!supabaseClient) return { minDeposit: 10000, minWithdrawal: 1000, withdrawalFeePercent: 15, ubaAccountNumber: '2231165369', ubaAccountName: 'AKINSANYA TIMOTHY OLAKUNLE' };
    const { data } = await supabaseClient.from('platform_settings').select('*');
    let settings = { minDeposit: 10000, minWithdrawal: 1000, withdrawalFeePercent: 15, ubaAccountNumber: '2231165369', ubaAccountName: 'AKINSANYA TIMOTHY OLAKUNLE' };
    if (data) {
        data.forEach(item => {
            if (item.key === 'min_deposit') settings.minDeposit = parseFloat(item.value);
            if (item.key === 'min_withdrawal') settings.minWithdrawal = parseFloat(item.value);
            if (item.key === 'withdrawal_fee_percent') settings.withdrawalFeePercent = parseFloat(item.value);
            if (item.key === 'uba_account_number') settings.ubaAccountNumber = item.value;
            if (item.key === 'uba_account_name') settings.ubaAccountName = item.value;
        });
    }
    return settings;
}

window.addEventListener('DOMContentLoaded', async () => {
    renderExplorePlans();
    
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
        const refInput = document.getElementById('reg-refcode');
        if (refInput) refInput.value = refParam.toUpperCase();
        switchAuthTab('register');
    }

    const activeSession = localStorage.getItem('kudiva_active_session');
    if (activeSession) {
        currentUser = JSON.parse(activeSession);
        isAdmin = currentUser.email.toLowerCase() === 'omoopeola1@gmail.com';
        unlockApp();
        setupRealtimeSync();
    }
    
    runStrict24HourYieldDaemon();
    updateGlobalUIStrings();
});

// Render the 10 Investment Plans cleanly using data-id attributes to avoid inline JSON issues
function renderExplorePlans() {
    const container = document.getElementById('plans-container');
    if (!container) return;

    container.innerHTML = INVESTMENT_PLANS.map(plan => {
        const dailyIncome = plan.minAmount * 0.10;
        const totalIncome24Days = dailyIncome * 24;

        return `
            <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-700 transition group">
                <div>
                    <div class="h-44 overflow-hidden relative bg-slate-900">
                        <img src="${plan.image}" alt="${plan.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>
                        <span class="absolute bottom-3 left-4 px-2.5 py-1 bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow">${plan.tag}</span>
                        <span class="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-full shadow">24h Auto-Yield</span>
                    </div>
                    <div class="p-6 space-y-3">
                        <h3 class="font-serif font-bold text-lg text-slate-900">${plan.name}</h3>
                        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                            <div class="flex justify-between text-slate-500 font-medium"><span>Minimum Capital:</span><strong class="text-slate-900 font-bold">₦${Number(plan.minAmount).toLocaleString()}</strong></div>
                            <div class="flex justify-between text-slate-500 font-medium"><span>Daily Return (10%):</span><strong class="text-emerald-800 font-bold">₦${Number(dailyIncome).toLocaleString()} / 24h</strong></div>
                            <div class="flex justify-between text-slate-500 font-medium pt-1.5 border-t border-slate-200"><span>Total Return (24 Days):</span><strong class="text-slate-900 font-bold">₦${Number(totalIncome24Days).toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>
                <div class="p-6 pt-0">
                    <button onclick="openInvestModalById(${plan.id})" class="w-full py-3 bg-[#09120e] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 transition flex items-center justify-center space-x-2 shadow">
                        <span>Deploy Capital</span>
                        <i class="fa-solid fa-bolt text-amber-400 text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openInvestModalById(planId) {
    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) return;
    selectedPlanForInvest = plan;
    document.getElementById('invest-modal-title').innerText = `Invest in ${plan.name}`;
    document.getElementById('invest-modal-subtitle').innerText = `Min ₦${Number(plan.minAmount).toLocaleString()} · 10% Daily Auto Return (Every 24h) for 24 Days`;
    document.getElementById('invest-amount').value = plan.minAmount;
    document.getElementById('modal-invest').classList.remove('hidden');
}

function setupRealtimeSync() {
    if (!supabaseClient || !currentUser) return;

    supabaseClient
        .channel('public-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', filter: `user_email=eq.${currentUser.email}` }, async () => {
            await refreshUserDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `email=eq.${currentUser.email}` }, async () => {
            await refreshUserDataFromSupabase();
        })
        .subscribe();
}

async function refreshUserDataFromSupabase() {
    if (!currentUser) return;
    if (currentUser.email.toLowerCase() === 'omoopeola1@gmail.com') return;

    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('email', currentUser.email).single();
    if (profile) {
        currentUser.balance = parseFloat(profile.balance) || 0;
        currentUser.invested = parseFloat(profile.invested) || 0;
        currentUser.dailyYield = parseFloat(profile.daily_yield) || 0;
        currentUser.hasFunded = profile.has_funded;
        currentUser.hasActivatedInvestment = profile.has_activated_investment;
    }

    const { data: txs } = await supabaseClient.from('transactions').select('*').eq('user_email', currentUser.email).order('created_at', { ascending: false });
    if (txs) {
        currentUser.transactions = txs.map(t => ({
            desc: t.description,
            ref: t.reference,
            date: new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            type: t.type,
            amount: t.amount,
            status: t.status
        }));
    }

    const { data: tickets } = await supabaseClient.from('support_tickets').select('*').eq('user_email', currentUser.email).order('created_at', { ascending: false });
    if (tickets) {
        currentUser.tickets = tickets.map(t => ({
            id: t.id,
            category: t.category,
            msg: t.message,
            reply: t.reply || '',
            date: new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));
    }

    localStorage.setItem('kudiva_active_session', JSON.stringify(currentUser));
    updateUserUI();
}

async function updateGlobalUIStrings() {
    const s = await getPlatformSettings();
    document.querySelectorAll('.label-min-dep').forEach(el => el.innerText = '₦' + Number(s.minDeposit).toLocaleString());
    document.querySelectorAll('.label-min-wit').forEach(el => el.innerText = '₦' + Number(s.minWithdrawal).toLocaleString());
    
    const ubaDisplay = document.getElementById('display-uba-info');
    if (ubaDisplay) ubaDisplay.innerText = `${s.ubaAccountNumber} (${s.ubaAccountName}) — UBA`;
    const ubaModalName = document.getElementById('modal-uba-name');
    if (ubaModalName) ubaModalName.innerText = s.ubaAccountName;
    const ubaAccNum = document.getElementById('uba-acc-num');
    if (ubaAccNum) ubaAccNum.innerText = s.ubaAccountNumber;
    
    const feePct = document.getElementById('label-fee-pct');
    if (feePct) feePct.innerText = s.withdrawalFeePercent;
    const feeLabel = document.getElementById('w-fee-label');
    if (feeLabel) feeLabel.innerText = `Processing Fee (${s.withdrawalFeePercent}%):`;
}

function runStrict24HourYieldDaemon() {
    setInterval(async () => {
        if (!currentUser || !supabaseClient) return;
        const now = Date.now();
        let updated = false;

        if (currentUser.investments && currentUser.investments.length > 0) {
            currentUser.investments.forEach(inv => {
                if (!inv.nextYieldDue) inv.nextYieldDue = now + 86400000;
                if (!inv.daysRemaining) inv.daysRemaining = 24;

                if (now >= inv.nextYieldDue && inv.daysRemaining > 0) {
                    let dailyYieldAmount = inv.amount * 0.10;
                    currentUser.balance += dailyYieldAmount;
                    currentUser.dailyYield += dailyYieldAmount;
                    inv.daysRemaining -= 1;
                    inv.nextYieldDue = now + 86400000;
                    updated = true;

                    currentUser.transactions.unshift({
                        desc: `10% Daily Auto-Yield Drop (${inv.name})`,
                        ref: 'KDV-YLD-' + Math.floor(100000 + Math.random() * 900000),
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        type: 'Yield Drop',
                        amount: '₦' + dailyYieldAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
                        status: 'Added to Balance'
                    });
                }
            });

            currentUser.investments = currentUser.investments.filter(inv => inv.daysRemaining > 0);
            if (updated) {
                await persistUserData();
            }
        }
    }, 10000);
}

function switchAuthTab(tab) {
    document.getElementById('tab-login').className = tab === 'login' ? 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-white text-slate-900 shadow-sm transition' : 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-slate-500 transition';
    document.getElementById('tab-register').className = tab === 'register' ? 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-white text-slate-900 shadow-sm transition' : 'flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-slate-500 transition';
    
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();

    if (email === 'omoopeola1@gmail.com') {
        currentUser = {
            name: 'Ola Omoope',
            email: 'omoopeola1@gmail.com',
            bank: 'UBA Nigeria',
            accountNumber: '2231165369',
            accountHolder: 'Ola Omoope',
            refCode: 'KUDIVA-ADMIN',
            uplineRef: '',
            balance: 150000.00,
            invested: 50000.00,
            dailyYield: 12500.00,
            hasFunded: true,
            hasActivatedInvestment: true,
            investments: [],
            transactions: [],
            goals: [],
            tickets: []
        };
        completeLogin();
        return;
    }

    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('email', email).single();
        if (data) {
            currentUser = {
                name: data.name,
                email: data.email,
                bank: data.bank || '',
                accountNumber: data.account_number || '',
                accountHolder: data.account_holder || '',
                refCode: data.ref_code,
                uplineRef: data.upline_ref || '',
                balance: parseFloat(data.balance) || 0,
                invested: parseFloat(data.invested) || 0,
                dailyYield: parseFloat(data.daily_yield) || 0,
                hasFunded: data.has_funded,
                hasActivatedInvestment: data.has_activated_investment,
                investments: [],
                transactions: [],
                goals: [{ name: 'Emergency Reserve', target: 500000, current: 0 }],
                tickets: []
            };

            const { data: txs } = await supabaseClient.from('transactions').select('*').eq('user_email', email).order('created_at', { ascending: false });
            if (txs) {
                currentUser.transactions = txs.map(t => ({ desc: t.description, ref: t.reference, date: new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), type: t.type, amount: t.amount, status: t.status }));
            }

            const { data: tickets } = await supabaseClient.from('support_tickets').select('*').eq('user_email', email).order('created_at', { ascending: false });
            if (tickets) {
                currentUser.tickets = tickets.map(t => ({ id: t.id, category: t.category, msg: t.message, reply: t.reply || '', date: new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }));
            }

            completeLogin();
            return;
        }
    }
    alert('Account not found in database. Please register first.');
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const refCodeInput = document.getElementById('reg-refcode').value.trim().toUpperCase();
    const generatedRef = 'KUDIVA-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    currentUser = {
        name,
        email,
        bank: '',
        accountNumber: '',
        accountHolder: '',
        refCode: generatedRef,
        uplineRef: refCodeInput || '',
        balance: 0.00,
        invested: 0.00,
        dailyYield: 0.00,
        hasFunded: false,
        hasActivatedInvestment: false,
        investments: [],
        transactions: [],
        goals: [{ name: 'Initial Savings Target', target: 200000, current: 0 }],
        tickets: []
    };

    if (supabaseClient) {
        await supabaseClient.from('profiles').insert({
            email: email,
            name: name,
            ref_code: generatedRef,
            upline_ref: refCodeInput || '',
            balance: 0.00,
            invested: 0.00,
            daily_yield: 0.00
        });
    }

    completeLogin();
}

function completeLogin() {
    localStorage.setItem('kudiva_active_session', JSON.stringify(currentUser));
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-wrapper').classList.remove('opacity-40', 'pointer-events-none');
    
    const adminNav = document.getElementById('admin-nav-container');
    if (currentUser.email.toLowerCase() === 'omoopeola1@gmail.com') {
        adminNav.classList.remove('hidden');
    } else {
        adminNav.classList.add('hidden');
    }

    setupRealtimeSync();
    renderExplorePlans();
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

    setupRealtimeSync();
    renderExplorePlans();
    switchTab('overview');
    loadUserData();
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('user-sidebar');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
}

async function loadUserData() {
    if (!currentUser) return;
    await refreshUserDataFromSupabase();

    const firstName = currentUser.name.split(' ')[0];
    document.getElementById('welcome-heading').innerText = `Welcome back, ${firstName}`;
    document.getElementById('topbar-username').innerText = currentUser.name;
    document.getElementById('topbar-bankinfo').innerText = currentUser.accountNumber ? `${currentUser.bank || 'Bank'} • ${currentUser.accountNumber}` : 'No Bank Set';
    document.getElementById('topbar-bank-tag').innerText = currentUser.accountNumber ? 'Edit Bank Account' : 'Configure Bank';
    document.getElementById('user-initials-badge').innerText = currentUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    
    const userRefCode = currentUser.refCode || 'KUDIVA-LEKKXY26';
    const refLink = `${window.location.origin}${window.location.pathname}?ref=${userRefCode}`;
    document.getElementById('referral-link-display').innerText = refLink;

    updateUserUI();
    updateGlobalUIStrings();
    await loadReferralDownlines();
}

async function persistUserData() {
    localStorage.setItem('kudiva_active_session', JSON.stringify(currentUser));
    if (supabaseClient) {
        await supabaseClient.from('profiles').update({
            bank: currentUser.bank,
            account_number: currentUser.accountNumber,
            account_holder: currentUser.accountHolder,
            balance: currentUser.balance,
            invested: currentUser.invested,
            daily_yield: currentUser.dailyYield,
            has_funded: currentUser.hasFunded,
            has_activated_investment: currentUser.hasActivatedInvestment
        }).eq('email', currentUser.email);
    }
    updateUserUI();
}

function updateUserUI() {
    const fmtBal = privacyMask ? '₦••••••' : '₦' + Number(currentUser.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const fmtPort = privacyMask ? '₦••••••' : '₦' + Number(currentUser.invested).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const fmtYield = privacyMask ? '₦••••••' : '₦' + Number(currentUser.dailyYield).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    document.getElementById('stat-portfolio-value').innerText = fmtPort;
    document.getElementById('stat-available-balance').innerText = fmtBal;
    document.getElementById('stat-daily-yield').innerText = fmtYield;
    document.getElementById('portfolio-total-large').innerText = fmtPort;
    
    const exploreBalTag = document.getElementById('explore-balance-tag');
    if (exploreBalTag) exploreBalTag.innerText = fmtBal;

    const pendingCount = currentUser.transactions ? currentUser.transactions.filter(t => t.status && t.status.includes('Pending')).length : 0;
    const pendingStat = document.getElementById('stat-pending-count');
    if (pendingStat) pendingStat.innerText = pendingCount;

    const tbody = document.getElementById('transactions-table-body');
    if (!currentUser.transactions || currentUser.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No transactions recorded yet.</td></tr>`;
    } else {
        tbody.innerHTML = currentUser.transactions.map(tx => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-semibold text-slate-900">${tx.desc}</td>
                <td class="p-4 text-xs font-mono text-slate-500">${tx.ref}</td>
                <td class="p-4 text-xs text-slate-500">${tx.date}</td>
                <td class="p-4"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">${tx.type}</span></td>
                <td class="p-4 font-bold text-slate-900">${tx.amount}</td>
                <td class="p-4"><span class="px-2.5 py-1 ${tx.status === 'Success' || tx.status.includes('Balance') || tx.status.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-xs rounded-full font-bold">${tx.status}</span></td>
            </tr>
        `).join('');
    }

    const holdingsList = document.getElementById('portfolio-holdings-list');
    if (!currentUser.investments || currentUser.investments.length === 0) {
        holdingsList.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm"><i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300 block"></i>No active investments yet. Explore our 10 plans to earn daily for 24 days.</div>`;
    } else {
        holdingsList.innerHTML = currentUser.investments.map((inv) => {
            const timeLeft = Math.max(0, Math.floor((inv.nextYieldDue - Date.now()) / 1000));
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);

            return `
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h5 class="font-bold text-slate-900 text-sm">${inv.name}</h5>
                        <p class="text-xs text-slate-500">Principal: ₦${Number(inv.amount).toLocaleString()} · Daily Drop: ₦${Number(inv.amount * 0.10).toLocaleString()} · Days Left: <strong>${inv.daysRemaining}/24</strong></p>
                    </div>
                    <div class="text-right bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-xs">
                        <span class="text-emerald-900 font-bold block"><i class="fa-solid fa-clock mr-1"></i> Next Yield Drop in:</span>
                        <strong class="font-mono text-emerald-950">${hours}h ${minutes}m</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = currentUser.goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        return `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex justify-between items-center text-sm">
                    <span class="font-bold text-slate-900">${g.name}</span>
                    <span class="font-bold text-emerald-800">${pct}%</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-700 h-full rounded-full" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500">
                    <span>Current: ₦${Number(g.current).toLocaleString()}</span>
                    <span>Target: ₦${Number(g.target).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    const ticketsList = document.getElementById('user-tickets-list');
    if (!currentUser.tickets || currentUser.tickets.length === 0) {
        ticketsList.innerHTML = `<div class="text-slate-400 text-xs italic">No support tickets submitted yet.</div>`;
    } else {
        ticketsList.innerHTML = currentUser.tickets.map(t => `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-700">
                    <span>${t.category}</span>
                    <span class="text-slate-400">${t.date}</span>
                </div>
                <p class="text-xs text-slate-700"><strong>Query:</strong> ${t.msg}</p>
                <p class="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200"><strong>Admin Reply:</strong> ${t.reply || 'Pending Admin review...'}</p>
            </div>
        `).join('');
    }
}

async function loadReferralDownlines() {
    const downlineTbody = document.getElementById('referral-downlines-tbody');
    if (!supabaseClient) return;

    const { data: downlines } = await supabaseClient.from('profiles').select('*').eq('upline_ref', currentUser.refCode);
    let totalTeamDeposit = 0;
    let totalTeamEarnings = 0;

    let rowsHtml = '';
    if (!downlines || downlines.length === 0) {
        downlineTbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400 text-xs">No referral downlines yet. Share your link to start earning!</td></tr>`;
    } else {
        downlines.forEach(d => {
            let userInvested = parseFloat(d.invested) || 0;
            totalTeamDeposit += userInvested;

            let commEarned = 0;
            currentUser.transactions.forEach(tx => {
                if (tx.desc && tx.desc.includes(d.name)) {
                    let parts = tx.amount.replace('₦','').replace(/,/g,'');
                    commEarned += parseFloat(parts) || 0;
                }
            });
            totalTeamEarnings += commEarned;

            rowsHtml += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4">
                        <div class="font-bold text-slate-900">${d.name}</div>
                        <div class="text-xs text-slate-500">${d.email}</div>
                    </td>
                    <td class="p-4 text-xs text-slate-500">${new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td class="p-4 font-bold text-slate-900">₦${userInvested.toLocaleString()}</td>
                    <td class="p-4 font-bold text-emerald-800">₦${commEarned.toLocaleString()}</td>
                </tr>
            `;
        });
        downlineTbody.innerHTML = rowsHtml;
    }

    document.getElementById('stat-team-deposit').innerText = '₦' + totalTeamDeposit.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('stat-team-earnings').innerText = '₦' + totalTeamEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('stat-team-count').innerText = downlines ? downlines.length : 0;
}

function switchTab(tabId) {
    if (tabId === 'explore') {
        renderExplorePlans();
    }

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
            el.className = 'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition hover:bg-emerald-950/50 text-slate-300';
        }
    });

    const viewEl = document.getElementById('view-' + tabId);
    if (viewEl) viewEl.classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        if (tabId === 'admin-dashboard') {
            activeBtn.className = 'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/40';
        } else {
            activeBtn.className = 'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition bg-emerald-950 text-emerald-300 border border-emerald-800/40 shadow-sm';
        }
    }
    
    const titles = {
        overview: 'Executive Overview',
        portfolio: 'Portfolio Holdings',
        explore: 'Explore 10 Investment Plans',
        transactions: 'Ledger & Approvals',
        planning: 'Compound Calculator',
        rewards: 'Referral Network',
        support: 'Client Support Desk',
        'admin-dashboard': 'Admin Management'
    };
    document.getElementById('current-breadcrumb').innerText = titles[tabId] || 'Overview';

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('user-sidebar');
        const backdrop = document.getElementById('mobile-sidebar-backdrop');
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
}

function switchAdminTab(subId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('admin-sub-' + subId).classList.add('active');

    ['approvals', 'users', 'tickets', 'settings'].forEach(id => {
        const btn = document.getElementById('adm-btn-' + id);
        if (btn) {
            btn.className = subId === id ? 'px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-800 text-white transition shadow shrink-0' : 'px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-slate-700 border border-slate-200 transition shrink-0';
        }
    });

    loadAdminDashboard();
}

function openBankModal() {
    if (currentUser) {
        document.getElementById('user-bank-name').value = currentUser.bank || '';
        document.getElementById('user-bank-num').value = currentUser.accountNumber || '';
        document.getElementById('user-bank-holder').value = currentUser.accountHolder || currentUser.name || '';
    }
    document.getElementById('modal-bank').classList.remove('hidden');
}

async function saveUserBankAccount() {
    const bankName = document.getElementById('user-bank-name').value.trim();
    const bankNum = document.getElementById('user-bank-num').value.trim();
    const bankHolder = document.getElementById('user-bank-holder').value.trim();

    if (!bankName || !bankNum || !bankHolder) {
        alert('Please fill out all bank account fields.');
        return;
    }
    if (bankNum.length !== 10) {
        alert('Account number must be 10 digits.');
        return;
    }

    currentUser.bank = bankName;
    currentUser.accountNumber = bankNum;
    currentUser.accountHolder = bankHolder;

    await persistUserData();
    closeModal('modal-bank');
    loadUserData();
    alert('Withdrawal bank account saved successfully!');
}

function openDepositModal() { document.getElementById('modal-deposit').classList.remove('hidden'); }
function openWithdrawModal() { 
    if (!currentUser.accountNumber) {
        alert('Please set your withdrawal bank account first.');
        openBankModal();
        return;
    }
    document.getElementById('withdraw-bank-preview').innerText = `${currentUser.bank} - ${currentUser.accountNumber} (${currentUser.accountHolder})`;
    document.getElementById('modal-withdraw').classList.add('hidden'); 
    calculateWithdrawFee(); 
    document.getElementById('modal-withdraw').classList.remove('hidden'); 
}
function openGoalModal() { document.getElementById('modal-goal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

async function copyUBAAccount() {
    const s = await getPlatformSettings();
    navigator.clipboard.writeText(s.ubaAccountNumber);
    alert(`UBA Account Number (${s.ubaAccountNumber} - ${s.ubaAccountName}) copied to clipboard!`);
}

function copyReferralLink() {
    const linkText = document.getElementById('referral-link-display').innerText;
    navigator.clipboard.writeText(linkText);
    alert('Referral link copied to clipboard!');
}

async function submitDepositRequest() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const ref = document.getElementById('deposit-ref').value.trim();
    const s = await getPlatformSettings();
    
    if (!amount || amount < s.minDeposit) {
        alert(`Minimum deposit amount is ₦${Number(s.minDeposit).toLocaleString()}.`);
        return;
    }
    if (!ref) {
        alert('Please enter your UBA transfer reference or teller number.');
        return;
    }

    const reqId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (supabaseClient) {
        await supabaseClient.from('pending_queue').insert({
            request_id: reqId,
            user_email: currentUser.email,
            type: 'Deposit',
            amount: amount,
            details: `UBA Ref: ${ref}`
        });

        await supabaseClient.from('transactions').insert({
            user_email: currentUser.email,
            description: 'UBA Direct Deposit (Pending Admin)',
            reference: ref,
            type: 'Deposit',
            amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Pending Approval'
        });
    }

    currentUser.transactions.unshift({
        desc: 'UBA Direct Deposit (Pending Admin)',
        ref: ref,
        date: dateStr,
        type: 'Deposit',
        amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Pending Approval'
    });

    await persistUserData();
    closeModal('modal-deposit');
    alert(`Deposit submitted successfully! Awaiting Admin approval.`);
}

async function calculateWithdrawFee() {
    const s = await getPlatformSettings();
    const gross = parseFloat(document.getElementById('withdraw-gross').value) || 0;
    const feePct = s.withdrawalFeePercent || 15;
    const fee = gross * (feePct / 100);
    const net = gross - fee;
    document.getElementById('w-gross-display').innerText = '₦' + gross.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('w-fee-display').innerText = '-₦' + fee.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    document.getElementById('w-net-display').innerText = '₦' + net.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

async function submitWithdrawRequest() {
    const s = await getPlatformSettings();
    const gross = parseFloat(document.getElementById('withdraw-gross').value);
    if (!gross || gross < s.minWithdrawal) {
        alert(`Minimum withdrawal amount is ₦${Number(s.minWithdrawal).toLocaleString()}.`);
        return;
    }
    if (gross > currentUser.balance) {
        alert('Insufficient available balance in wallet.');
        return;
    }

    const feePct = s.withdrawalFeePercent || 15;
    const fee = gross * (feePct / 100);
    const net = gross - fee;

    currentUser.balance -= gross;
    const reqId = 'WIT-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (supabaseClient) {
        await supabaseClient.from('pending_queue').insert({
            request_id: reqId,
            user_email: currentUser.email,
            type: 'Withdrawal',
            amount: gross,
            net_amount: net,
            fee: fee,
            details: `Bank: ${currentUser.bank} (${currentUser.accountNumber}) · Net: ₦${net.toLocaleString()}`
        });

        await supabaseClient.from('transactions').insert({
            user_email: currentUser.email,
            description: `Withdrawal to ${currentUser.bank} (${currentUser.accountNumber}) (Pending)`,
            reference: reqId,
            type: 'Withdrawal',
            amount: '₦' + gross.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: `Pending Approval (${feePct}% Fee)`
        });
    }

    currentUser.transactions.unshift({
        desc: `Withdrawal to ${currentUser.bank} (${currentUser.accountNumber}) (Pending)`,
        ref: reqId,
        date: dateStr,
        type: 'Withdrawal',
        amount: '₦' + gross.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: `Pending Approval (${feePct}% Fee)`
    });

    await persistUserData();
    closeModal('modal-withdraw');
    alert(`Withdrawal request submitted! ₦${net.toLocaleString()} will be sent to your bank upon Admin approval.`);
}

async function executeInvestment() {
    const amount = parseFloat(document.getElementById('invest-amount').value);
    if (!selectedPlanForInvest) return;
    if (!amount || amount < selectedPlanForInvest.minAmount) {
        alert(`Minimum investment for ${selectedPlanForInvest.name} is ₦${Number(selectedPlanForInvest.minAmount).toLocaleString()}`);
        return;
    }
    if (amount > currentUser.balance) {
        alert('Insufficient available cash in wallet. Please deposit first.');
        return;
    }

    currentUser.balance -= amount;
    currentUser.invested += amount;
    currentUser.investments.push({
        name: selectedPlanForInvest.name,
        rate: 10.0,
        amount: amount,
        cycleDays: 24,
        daysRemaining: 24,
        nextYieldDue: Date.now() + 86400000,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    const txDesc = `Investment: ${selectedPlanForInvest.name}`;
    const txRef = 'KDV-INV-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    currentUser.transactions.unshift({
        desc: txDesc,
        ref: txRef,
        date: dateStr,
        type: 'Investment',
        amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
        status: 'Active (10% Daily Auto Every 24h)'
    });

    if (supabaseClient) {
        await supabaseClient.from('investments').insert({
            user_email: currentUser.email,
            plan_name: selectedPlanForInvest.name,
            amount: amount,
            next_yield_due: new Date(Date.now() + 86400000).toISOString()
        });

        await supabaseClient.from('transactions').insert({
            user_email: currentUser.email,
            description: txDesc,
            reference: txRef,
            type: 'Investment',
            amount: '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Active'
        });
    }

    if (!currentUser.hasActivatedInvestment) {
        currentUser.hasActivatedInvestment = true;
        await distributeReferralCommissions(amount);
    }

    await persistUserData();
    closeModal('modal-invest');
    alert(`Successfully deployed ₦${amount.toLocaleString()} into ${selectedPlanForInvest.name}! First 10% daily yield will drop in exactly 24 hours.`);
}

async function distributeReferralCommissions(investAmount) {
    if (!currentUser.uplineRef || !supabaseClient) return;
    const { data: uplineUser } = await supabaseClient.from('profiles').select('*').eq('ref_code', currentUser.uplineRef).single();

    if (uplineUser && uplineUser.email !== currentUser.email) {
        let comm1 = investAmount * 0.10;
        let newBalance = parseFloat(uplineUser.balance) + comm1;

        await supabaseClient.from('profiles').update({ balance: newBalance }).eq('email', uplineUser.email);
        await supabaseClient.from('transactions').insert({
            user_email: uplineUser.email,
            description: `Referral Commission (Level 1 - 10% from ${currentUser.name})`,
            reference: 'REF-L1-' + Math.floor(1000 + Math.random() * 9000),
            type: 'Commission',
            amount: '₦' + comm1.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Success'
        });
    }
}

async function executeCreateGoal() {
    const name = document.getElementById('goal-name-input').value;
    const target = parseFloat(document.getElementById('goal-target-input').value);
    if (!name || !target) return alert('Fill in all fields');
    currentUser.goals.push({ name, target, current: 0 });
    await persistUserData();
    closeModal('modal-goal');
}

async function submitSupportTicket() {
    const category = document.getElementById('support-category').value;
    const msg = document.getElementById('support-msg').value.trim();
    if (!msg) return alert('Enter your support message');

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const ticket = {
        id: Date.now(),
        email: currentUser.email,
        category,
        msg,
        reply: '',
        date: dateStr
    };

    currentUser.tickets.unshift(ticket);
    if (supabaseClient) {
        await supabaseClient.from('support_tickets').insert({
            user_email: currentUser.email,
            category: category,
            message: msg
        });
    }

    await persistUserData();
    document.getElementById('support-msg').value = '';
    alert('Support ticket submitted successfully to Admin desk.');
    await refreshUserDataFromSupabase();
}

function togglePrivacy() {
    privacyMask = !privacyMask;
    document.getElementById('privacy-icon').className = privacyMask ? 'fa-regular fa-eye-slash text-sm' : 'fa-regular fa-eye text-sm';
    updateUserUI();
}

async function loadAdminDashboard() {
    if (!currentUser || currentUser.email.toLowerCase() !== 'omoopeola1@gmail.com' || !supabaseClient) return;

    const { data: usersData } = await supabaseClient.from('profiles').select('*');
    const { data: queueData } = await supabaseClient.from('pending_queue').select('*');
    const { data: ticketsData } = await supabaseClient.from('support_tickets').select('*');
    const settings = await getPlatformSettings();

    document.getElementById('count-pending-approvals').innerText = queueData ? queueData.length : 0;
    document.getElementById('count-total-users').innerText = usersData ? usersData.length : 0;
    document.getElementById('count-support-tickets').innerText = ticketsData ? ticketsData.length : 0;

    document.getElementById('setting-min-dep').value = settings.minDeposit;
    document.getElementById('setting-min-wit').value = settings.minWithdrawal;
    document.getElementById('setting-wit-fee').value = settings.withdrawalFeePercent;
    document.getElementById('setting-uba-num').value = settings.ubaAccountNumber;
    document.getElementById('setting-uba-name').value = settings.ubaAccountName;

    const appTable = document.getElementById('admin-approvals-table');
    if (!queueData || queueData.length === 0) {
        appTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No pending requests in queue.</td></tr>`;
    } else {
        appTable.innerHTML = queueData.map((item) => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-bold text-slate-900">${item.user_email}</td>
                <td class="p-4"><span class="px-2.5 py-1 ${item.type === 'Deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} text-xs rounded-full font-bold">${item.type}</span></td>
                <td class="p-4 font-bold text-slate-900">₦${Number(item.amount).toLocaleString()}</td>
                <td class="p-4 text-xs text-slate-600">${item.details}</td>
                <td class="p-4 text-xs text-slate-500">${new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="adminApprove('${item.request_id}')" class="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition">Approve</button>
                    <button onclick="adminReject('${item.request_id}')" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition">Reject</button>
                </td>
            </tr>
        `).join('');
    }

    const usersTable = document.getElementById('admin-users-table');
    if (!usersData || usersData.length === 0) {
        usersTable.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">No registered users found.</td></tr>`;
    } else {
        usersTable.innerHTML = usersData.map(u => `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4">
                    <div class="font-bold text-slate-900">${u.name}</div>
                    <div class="text-xs text-slate-500">${u.email} (${u.account_number ? u.bank + ' - ' + u.account_number : 'No Bank'})</div>
                </td>
                <td class="p-4 text-xs">
                    <div class="font-mono font-bold text-emerald-800">${u.ref_code || 'N/A'}</div>
                    <div class="text-slate-500">Upline: ${u.upline_ref || 'None'}</div>
                </td>
                <td class="p-4 font-bold text-slate-900">₦${Number(u.balance).toLocaleString()}</td>
                <td class="p-4 font-bold text-slate-900">₦${Number(u.invested).toLocaleString()}</td>
                <td class="p-4 font-bold text-emerald-800">₦${Number(u.daily_yield).toLocaleString()}</td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="adminCreditUser('${u.email}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition">+ Credit</button>
                </td>
            </tr>
        `).join('');
    }

    const ticketsList = document.getElementById('admin-tickets-list');
    if (!ticketsData || ticketsData.length === 0) {
        ticketsList.innerHTML = `<div class="text-slate-400 text-xs italic">No support tickets submitted.</div>`;
    } else {
        ticketsList.innerHTML = ticketsData.map((t) => `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex justify-between text-xs font-bold text-slate-700">
                    <span>User: ${t.user_email} (${t.category})</span>
                    <span class="text-slate-400">${new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <p class="text-xs text-slate-800"><strong>Query:</strong> ${t.message}</p>
                <div class="flex space-x-2 pt-2">
                    <input type="text" id="admin-reply-${t.id}" placeholder="Type admin response..." value="${t.reply || ''}" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
                    <button onclick="adminSendReply('${t.id}')" class="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition">Send Reply</button>
                </div>
            </div>
        `).join('');
    }
}

async function saveAdminSettings() {
    if (!supabaseClient) return;
    const minDep = document.getElementById('setting-min-dep').value;
    const minWit = document.getElementById('setting-min-wit').value;
    const fee = document.getElementById('setting-wit-fee').value;
    const ubaNum = document.getElementById('setting-uba-num').value;
    const ubaName = document.getElementById('setting-uba-name').value;

    await supabaseClient.from('platform_settings').upsert([
        { key: 'min_deposit', value: minDep },
        { key: 'min_withdrawal', value: minWit },
        { key: 'withdrawal_fee_percent', value: fee },
        { key: 'uba_account_number', value: ubaNum },
        { key: 'uba_account_name', value: ubaName }
    ]);

    updateGlobalUIStrings();
    alert('Platform settings saved successfully and applied platform-wide!');
}

async function adminApprove(requestId) {
    if (!supabaseClient) return;
    const { data: item } = await supabaseClient.from('pending_queue').select('*').eq('request_id', requestId).single();
    if (!item) return;

    const { data: targetUser } = await supabaseClient.from('profiles').select('*').eq('email', item.user_email).single();

    if (targetUser) {
        if (item.type === 'Deposit') {
            let finalCredit = parseFloat(item.amount);
            let bonusAwarded = 0;

            if (!targetUser.has_funded) {
                bonusAwarded = finalCredit >= 50000 ? 2000 : 1000;
                finalCredit += bonusAwarded;
            }

            let newBalance = parseFloat(targetUser.balance) + finalCredit;
            await supabaseClient.from('profiles').update({ balance: newBalance, has_funded: true }).eq('email', item.user_email);
            
            await supabaseClient.from('transactions').insert({
                user_email: item.user_email,
                description: `UBA Direct Deposit ${bonusAwarded > 0 ? `(+₦${bonusAwarded.toLocaleString()} Bonus)` : ''} (Approved)`,
                reference: requestId,
                type: 'Deposit',
                amount: '₦' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
                status: 'Success'
            });
        } else if (item.type === 'Withdrawal') {
            await supabaseClient.from('transactions').insert({
                user_email: item.user_email,
                description: `Withdrawal Approved (Fee: ₦${Number(item.fee).toLocaleString()})`,
                reference: requestId,
                type: 'Withdrawal',
                amount: '₦' + Number(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }),
                status: `Paid Net ₦${Number(item.net_amount).toLocaleString()}`
            });
        }
    }

    await supabaseClient.from('pending_queue').delete().eq('request_id', requestId);
    loadAdminDashboard();
    alert(`Successfully approved ${item.type} of ₦${Number(item.amount).toLocaleString()} for ${item.user_email}`);
}

async function adminReject(requestId) {
    if (!supabaseClient) return;
    const { data: item } = await supabaseClient.from('pending_queue').select('*').eq('request_id', requestId).single();
    if (!item) return;

    if (item.type === 'Withdrawal') {
        const { data: targetUser } = await supabaseClient.from('profiles').select('*').eq('email', item.user_email).single();
        if (targetUser) {
            let restoredBalance = parseFloat(targetUser.balance) + parseFloat(item.amount);
            await supabaseClient.from('profiles').update({ balance: restoredBalance }).eq('email', item.user_email);
        }
    }

    await supabaseClient.from('pending_queue').delete().eq('request_id', requestId);
    loadAdminDashboard();
    alert(`Rejected ${item.type} request.`);
}

async function adminCreditUser(email) {
    const amtStr = prompt(`Enter amount in NGN to credit ${email}:`, '10000');
    const amt = parseFloat(amtStr);
    if (!amt || amt <= 0 || !supabaseClient) return;

    const { data: targetUser } = await supabaseClient.from('profiles').select('*').eq('email', email).single();
    if (targetUser) {
        let newBalance = parseFloat(targetUser.balance) + amt;
        await supabaseClient.from('profiles').update({ balance: newBalance }).eq('email', email);
        await supabaseClient.from('transactions').insert({
            user_email: email,
            description: 'Admin Manual Credit',
            reference: 'KDV-ADM-' + Math.floor(1000 + Math.random() * 9000),
            type: 'Credit',
            amount: '₦' + amt.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            status: 'Success'
        });
        loadAdminDashboard();
        alert(`Successfully credited ₦${amt.toLocaleString()} to ${email}`);
    }
}

async function adminSendReply(ticketId) {
    const replyText = document.getElementById(`admin-reply-${ticketId}`).value.trim();
    if (!replyText || !supabaseClient) return alert('Enter a reply message');

    await supabaseClient.from('support_tickets').update({ reply: replyText }).eq('id', ticketId);
    loadAdminDashboard();
    alert('Support reply sent successfully.');
}

async function calculateCompound() {
    const p = parseFloat(document.getElementById('calc-principal').value) || 0;
    const days = parseInt(document.getElementById('calc-days').value) || 24;
    document.getElementById('days-display').innerText = `${days} Days`;
    const total = p * Math.pow(1.10, days);
    document.getElementById('calc-result').innerText = '₦' + Math.round(total).toLocaleString('en-NG');
}
