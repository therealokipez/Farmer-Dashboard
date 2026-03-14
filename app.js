/* ══════════════════════════════════════════════════
   AgroLink v2.0 — app.js
   Auth · Navigation · AI Advisor · USSD · Marketplace
   ══════════════════════════════════════════════════ */

// ── SERVICE WORKER ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(r => console.log('[AgroLink] SW:', r.scope))
      .catch(e => console.warn('[AgroLink] SW error:', e));
  });
}

// ── PAGE CONFIG ───────────────────────────────────
const PAGE_TITLES = {
  overview: 'Dashboard Overview', prices: 'Market Prices',
  weather: 'Weather & Advisory', cooperative: 'My Cooperative',
  pools: 'Harvest Pools', transactions: 'Transactions',
  advisor: 'AI Price Advisor', ussd: 'USSD Simulator',
  marketplace: 'Buyer Marketplace', settings: 'Settings',
};

const BN_MAP = {
  overview: 'bn-overview', prices: 'bn-prices',
  advisor: 'bn-advisor', marketplace: 'bn-marketplace', settings: 'bn-settings',
};

// ══════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════
let currentUser = null;

function switchAuth(view) {
  document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));
  document.getElementById('auth-' + view).classList.add('active');
}

function doLogin() {
  const phone = (document.getElementById('login-phone')?.value || '').trim();
  const pass  = (document.getElementById('login-pass')?.value  || '').trim();
  // Demo: accept anything or empty (demo button)
  currentUser = { name: 'Amina Osei', state: 'Kano State', acres: '2', crop: 'Tomato' };
  _launchApp();
}

function doSignup() {
  const first = document.getElementById('su-first')?.value.trim();
  const last  = document.getElementById('su-last')?.value.trim();
  const phone = document.getElementById('su-phone')?.value.trim();
  const state = document.getElementById('su-state')?.value;
  const acres = document.getElementById('su-acres')?.value.trim();
  const crop  = document.getElementById('su-crop')?.value;
  const pass  = document.getElementById('su-pass')?.value.trim();

  // Basic validation
  const card = document.querySelector('#auth-signup .auth-card');
  const existing = card.querySelector('.auth-error');
  if (existing) existing.remove();

  if (!first || !last || !phone || !state || !pass) {
    const err = document.createElement('div');
    err.className = 'auth-error';
    err.textContent = 'Please fill in all required fields.';
    card.insertBefore(err, card.querySelector('.auth-btn'));
    return;
  }

  if (pass.length < 8) {
    const err = document.createElement('div');
    err.className = 'auth-error';
    err.textContent = 'Password must be at least 8 characters.';
    card.insertBefore(err, card.querySelector('.auth-btn'));
    return;
  }

  currentUser = {
    name:  first + ' ' + last,
    state: state,
    acres: acres || '1',
    crop:  crop || 'Tomato'
  };

  _launchApp();
  showToast('🎉 Welcome to AgroLink, ' + first + '!');
}

function _launchApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = '';

  // Personalize
  const firstName = currentUser.name.split(' ')[0];
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greet + ', ' + firstName + ' 👋';
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('sidebar-meta').textContent = currentUser.state + ' · ' + currentUser.acres + ' Acres';

  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Set active page from hash
  const hash = location.hash.replace('#', '');
  if (hash && PAGE_TITLES[hash]) _activatePage(hash);

  // Load marketplace listings
  renderMarket();
}

function doLogout() {
  currentUser = null;
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  switchAuth('login');
}

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
function showPage(id) {
  _activatePage(id);
  closeDrawer();
}

function _activatePage(id) {
  if (!PAGE_TITLES[id]) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');

  document.getElementById('page-title').textContent = PAGE_TITLES[id];

  document.querySelectorAll('.sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick') === `showPage('${id}')`);
  });

  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const bnEl = document.getElementById(BN_MAP[id]);
  if (bnEl) bnEl.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#' + id);
}

function openDrawer() {
  document.querySelector('.sidebar').classList.add('drawer-open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.querySelector('.sidebar').classList.remove('drawer-open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════
function openModal()  { document.getElementById('pool-modal').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { document.getElementById('pool-modal').classList.remove('open'); document.body.style.overflow = ''; }
function submitPool() { closeModal(); showToast('🌾 Pool created! Members notified via SMS.'); }
document.getElementById('pool-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

// ══════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ══════════════════════════════════════════════════
// AI PRICE ADVISOR
// ══════════════════════════════════════════════════
const ADVISOR_SYSTEM = `You are an expert agricultural market advisor for smallholder farmers in Nigeria.
You know current crop prices: Tomato ₦280/kg (+12%), Maize ₦195/kg (+0.5%), Groundnut ₦420/kg (-8%), Onion ₦310/kg (+6%), Sorghum ₦160/kg (-1%), Yam ₦380/kg (+7%).
Weather: Heavy rain forecast Tuesday-Wednesday in Kano. Harvest tomatoes before Tuesday.
The user's name is ${currentUser ? currentUser.name.split(' ')[0] : 'farmer'}, growing ${currentUser ? currentUser.crop : 'crops'} in ${currentUser ? currentUser.state : 'Nigeria'}.
Give concise, practical, actionable advice in 2-4 sentences. Use Nigerian Naira (₦). Be warm and direct.`;

let advisorHistory = [];

function askAdvisor(text) {
  document.getElementById('advisor-input').value = text;
  sendAdvisor();
}

async function sendAdvisor() {
  const input = document.getElementById('advisor-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  document.getElementById('advisor-suggestions').style.display = 'none';

  // Add user message
  _addAdvisorMsg(text, 'user');
  advisorHistory.push({ role: 'user', content: text });

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  const typingEl = document.createElement('div');
  typingEl.className = 'advisor-msg bot advisor-typing';
  typingEl.id = typingId;
  typingEl.innerHTML = `<div class="advisor-avatar">🤖</div><div class="advisor-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  document.getElementById('advisor-chat').appendChild(typingEl);
  _scrollAdvisor();

  const sendBtn = document.getElementById('advisor-send');
  sendBtn.disabled = true;

  try {
    const systemPrompt = `You are an expert agricultural market advisor for smallholder farmers in Nigeria.
Current prices: Tomato ₦280/kg (+12%), Maize ₦195/kg (flat), Groundnut ₦420/kg (-8%), Onion ₦310/kg (+6%), Sorghum ₦160/kg (flat), Yam ₦380/kg (+7%).
Weather alert: Heavy rain Tuesday-Wednesday in Kano — harvest tomatoes before Tuesday.
User: ${currentUser ? currentUser.name : 'farmer'}, grows ${currentUser ? currentUser.crop : 'crops'} in ${currentUser ? currentUser.state : 'Nigeria'}.
Give concise (2-4 sentence), warm, practical advice. Use ₦. Focus on actionable steps.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: advisorHistory,
      })
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not get a response right now. Please try again.';

    typingEl.remove();
    _addAdvisorMsg(reply, 'bot');
    advisorHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    typingEl.remove();
    _addAdvisorMsg('Sorry, I\'m having trouble connecting right now. Check your internet and try again.', 'bot');
  }

  sendBtn.disabled = false;
  input.focus();
}

function _addAdvisorMsg(text, role) {
  const chat = document.getElementById('advisor-chat');
  const div = document.createElement('div');
  div.className = 'advisor-msg ' + role;
  div.innerHTML = role === 'bot'
    ? `<div class="advisor-avatar">🤖</div><div class="advisor-bubble">${text.replace(/\n/g,'<br>')}</div>`
    : `<div class="advisor-bubble">${text}</div>`;
  chat.appendChild(div);
  _scrollAdvisor();
}

function _scrollAdvisor() {
  const chat = document.getElementById('advisor-chat');
  setTimeout(() => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }), 50);
}

// ══════════════════════════════════════════════════
// USSD SIMULATOR
// ══════════════════════════════════════════════════
const USSD_FLOWS = {
  main: `AgroLink USSD Service\n*347*55#\n\n1. Market Prices\n2. Weather Forecast\n3. Join Harvest Pool\n4. Check Payment\n5. Crop Advisory\n\n0. Exit`,
  '1': `Market Prices — Today\n\nSelect crop:\n1. Tomato  ₦280/kg (+12%)\n2. Maize   ₦195/kg (flat)\n3. Onion   ₦310/kg (+6%)\n4. Groundnut ₦420/kg (-8%)\n5. Sorghum ₦160/kg\n\n0. Back`,
  '11': `🍅 TOMATO — KANO\n\nToday:    ₦280/kg\nYest:     ₦250/kg\nLast wk:  ₦240/kg\n\nTrend: ↑ RISING\nAdvice: SELL TODAY\n\nBest market: Kano Central\nBuyer offer: ₦275/kg min\n\n0. Back to menu`,
  '12': `🌽 MAIZE — LAGOS\n\nToday:    ₦195/kg\nYest:     ₦194/kg\nLast wk:  ₦190/kg\n\nTrend: → STABLE\nAdvice: HOLD 1-2 weeks\n\n0. Back to menu`,
  '13': `🧅 ONION — KANO\n\nToday:    ₦310/kg\nYest:     ₦292/kg\nLast wk:  ₦270/kg\n\nTrend: ↑ RISING FAST\nAdvice: SELL NOW\n\n0. Back to menu`,
  '14': `🥜 GROUNDNUT — ABUJA\n\nToday:    ₦420/kg\nYest:     ₦456/kg\nLast wk:  ₦490/kg\n\nTrend: ↓ FALLING\nAdvice: WAIT 2 weeks\n\n0. Back to menu`,
  '2': `Weather — Kano State\n\nToday:  ⛅ 28°C Cloudy\nMon:    🌤 29°C Clear\nTue:    🌧 24°C RAIN\nWed:    ⛈ 22°C STORM\nThu:    🌤 26°C Clear\n\n⚠ WARNING: Harvest tomato\nbefore Tuesday rain!\n\n0. Back`,
  '3': `Join Harvest Pool\n\nOpen Pools:\n1. Tomato Pool #3\n   72% full · Closes Mar18\n   Floor: ₦260/kg\n\n2. Onion Pool #2\n   FULL - Seeking buyer\n   Best offer: ₦305/kg\n\nReply pool number to join\n0. Back`,
  '31': `Tomato Pool #3\n\n21.6 of 30 tonnes pooled\nYour contribution: 0 kg\n\nEnter your quantity (kg):\n(e.g. 500 for 500kg)\n\n0. Back`,
  '4': `Check Payment\n\nLast 3 transactions:\n\n1. Tomato · 14 Mar\n   +₦52,000 ✓ PAID\n\n2. Onion · 12 Mar\n   ₦32,000 ⏳ ESCROW\n\n3. Maize · 5 Mar\n   +₦28,400 ✓ PAID\n\nTotal pending: ₦32,000\n\n0. Back`,
  '5': `Crop Advisory\n\n1. 🍅 Tomato — Harvest NOW\n   Rain Tue. Risk: ₦18,000 loss\n\n2. 🌽 Maize — Check for\n   armyworm. Scout morning.\n\n3. 🌱 After harvest: plant\n   cowpea to restore nitrogen\n\nFor full report: visit\nagrolink.netlify.app\n\n0. Back`,
  '0': null,
};

let ussdState = null;

function ussdDial() {
  ussdState = 'main';
  _showUssd(USSD_FLOWS.main);
  document.getElementById('ussd-input').value = '';
  document.getElementById('ussd-input').placeholder = 'Enter option number…';
}

function ussdReply() {
  const val = document.getElementById('ussd-input').value.trim();
  if (!val || ussdState === null) return;
  document.getElementById('ussd-input').value = '';

  if (val === '0') {
    if (ussdState.length > 1) {
      // Go up one level
      ussdState = ussdState.slice(0, -1);
      _showUssd(USSD_FLOWS[ussdState] || USSD_FLOWS.main);
    } else {
      ussdState = null;
      _showUssd('Session ended.\n\nThank you for using AgroLink.\nDial *347*55# anytime.');
    }
    return;
  }

  const next = ussdState === 'main' ? val : ussdState + val;

  if (USSD_FLOWS[next]) {
    ussdState = next;
    _showUssd(USSD_FLOWS[next]);
  } else if (ussdState === '31' && !isNaN(parseInt(val))) {
    // Joining a pool with quantity
    _showUssd(`✓ CONFIRMED\n\nYou joined Tomato Pool #3\nContribution: ${parseInt(val).toLocaleString()} kg\n\nYou will receive SMS when\nbuyer is found.\n\nPool closes: 18 Mar 2026\nFloor price: ₦260/kg\n\n0. Back to menu`);
    ussdState = 'main';
  } else {
    _showUssd(`Invalid option "${val}".\nPlease try again.\n\n${USSD_FLOWS[ussdState] || ''}`);
  }
}

function _showUssd(text) {
  const el = document.getElementById('ussd-content');
  el.innerHTML = text.replace(/\n/g, '<br>');
}

// ══════════════════════════════════════════════════
// BUYER MARKETPLACE
// ══════════════════════════════════════════════════
const MARKET_DATA = [
  { id:1, emoji:'🍅', crop:'Tomato',    coop:'Kano Smallholders Coop',    qty:21.6, unit:'tonnes', price:260, state:'Kano',  status:'Open',           members:22, closes:'Mar 18', grade:'Grade A', verified:true },
  { id:2, emoji:'🧅', crop:'Onion',     coop:'Plateau Farmers Alliance',   qty:20,   unit:'tonnes', price:305, state:'Kano',  status:'Awaiting Buyer', members:18, closes:'Mar 20', grade:'Grade A', verified:true },
  { id:3, emoji:'🌽', crop:'Maize',     coop:'Kaduna Grain Collective',    qty:45,   unit:'tonnes', price:195, state:'Kaduna',status:'Open',           members:31, closes:'Mar 25', grade:'Grade B', verified:true },
  { id:4, emoji:'🥜', crop:'Groundnut', coop:'Katsina Groundnut Union',    qty:12,   unit:'tonnes', price:430, state:'Lagos', status:'Open',           members:14, closes:'Mar 30', grade:'Premium', verified:true },
  { id:5, emoji:'🍠', crop:'Yam',       coop:'Benue Root Crops Coop',      qty:30,   unit:'tonnes', price:375, state:'Abuja', status:'Awaiting Buyer', members:25, closes:'Apr 2',  grade:'Grade A', verified:false },
  { id:6, emoji:'🌾', crop:'Sorghum',   coop:'Kano North Farmers Union',   qty:60,   unit:'tonnes', price:158, state:'Kano',  status:'Open',           members:40, closes:'Apr 5',  grade:'Grade B', verified:true },
  { id:7, emoji:'🍅', crop:'Tomato',    coop:'Oyo Fresh Produce Coop',     qty:15,   unit:'tonnes', price:270, state:'Oyo',   status:'Open',           members:19, closes:'Mar 22', grade:'Grade A', verified:true },
  { id:8, emoji:'🌽', crop:'Maize',     coop:'Rivers Smallholders Network',qty:28,   unit:'tonnes', price:200, state:'Rivers',status:'Open',           members:22, closes:'Apr 1',  grade:'Grade A', verified:false },
];

function renderMarket(data) {
  const list = data || MARKET_DATA;
  const container = document.getElementById('market-listings');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--gray)"><div style="font-size:40px;margin-bottom:12px">🔍</div><div>No pools match your filters.</div></div>`;
    return;
  }

  container.innerHTML = list.map(l => `
    <div class="mkt-listing">
      <div class="mkt-listing-top">
        <div class="mkt-listing-crop">${l.emoji}</div>
        <div class="mkt-listing-info">
          <div class="mkt-listing-name">${l.crop} — ${l.qty} ${l.unit}</div>
          <div class="mkt-listing-coop">${l.coop}</div>
        </div>
        <span class="pool-status ${l.status === 'Open' ? 'status-open' : 'status-pending'}">${l.status}</span>
      </div>
      <div class="mkt-listing-meta">
        <span class="mkt-tag price">₦${l.price.toLocaleString()}/kg floor</span>
        <span class="mkt-tag qty">${l.qty}t available</span>
        <span class="mkt-tag">📍 ${l.state}</span>
        <span class="mkt-tag">🌾 ${l.grade}</span>
        <span class="mkt-tag">👥 ${l.members} farmers</span>
        <span class="mkt-tag">📅 Closes ${l.closes}</span>
      </div>
      <div class="mkt-listing-footer">
        <div class="mkt-seller">
          <div class="mkt-seller-avatar">🤝</div>
          <div>
            <div>${l.coop}</div>
            ${l.verified ? '<div class="mkt-verified">✓ Verified Cooperative</div>' : '<div style="font-size:10px;color:var(--lgray)">Pending verification</div>'}
          </div>
        </div>
        <div class="mkt-actions">
          <button class="btn btn-outline" style="font-size:12px;padding:6px 12px" onclick="showToast('💬 Message sent to ${l.coop.replace(/'/g,"\\'")}')">Message</button>
          <button class="btn btn-primary" style="font-size:12px;padding:6px 14px" onclick="showToast('✅ Offer sent! Coop will respond within 24h.')">Make Offer</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterMarket(reset) {
  if (reset) {
    document.getElementById('mkt-crop').value = '';
    document.getElementById('mkt-state').value = '';
    document.getElementById('mkt-status').value = '';
    renderMarket();
    return;
  }

  const crop   = document.getElementById('mkt-crop').value.toLowerCase();
  const state  = document.getElementById('mkt-state').value.toLowerCase();
  const status = document.getElementById('mkt-status').value.toLowerCase();

  const filtered = MARKET_DATA.filter(l =>
    (!crop   || l.crop.toLowerCase()   === crop) &&
    (!state  || l.state.toLowerCase()  === state) &&
    (!status || l.status.toLowerCase() === status)
  );

  renderMarket(filtered);
}

// ══════════════════════════════════════════════════
// PWA INSTALL BANNER
// ══════════════════════════════════════════════════
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  setTimeout(_showInstallBanner, 4000); // delay — don't interrupt auth
});

window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner')?.remove();
  _installPrompt = null;
});

function _showInstallBanner() {
  if (document.getElementById('install-banner') || !currentUser) return;

  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `<div style="position:fixed;bottom:calc(var(--bottom-nav-h,0px) + 14px + env(safe-area-inset-bottom,0px));left:14px;right:14px;background:#0F1F0F;color:#fff;border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.35);z-index:500;font-family:'Outfit',sans-serif;font-size:14px;border:1px solid rgba(123,198,123,0.25);max-width:420px">
    <span style="font-size:24px;flex-shrink:0">🌿</span>
    <div style="flex:1;min-width:0"><div style="font-weight:600;margin-bottom:2px">Install AgroLink</div><div style="font-size:11px;color:rgba(255,255,255,0.45)">Works offline · Add to home 
