/* ══════════════════════════════════════════════════
   AgroLink — app.js  v7
   Plain JS. No modules. All functions global.
   Auth works. Supabase plugs in later.
   ══════════════════════════════════════════════════ */

// ── SERVICE WORKER ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(function(r) { console.log('[AgroLink] SW:', r.scope); })
      .catch(function(e) { console.warn('[AgroLink] SW:', e); });
  });
}

// ── GLOBAL STATE ──────────────────────────────────
var currentUser = null;

// ══════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {

  // Set date
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

  // Attach pool modal backdrop
  var modal = document.getElementById('pool-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  // Check if already logged in (localStorage session)
  var saved = localStorage.getItem('agrolink_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      _launchApp();
    } catch(e) {
      localStorage.removeItem('agrolink_user');
      _showAuth();
    }
  } else {
    _showAuth();
  }

  // Render marketplace
  renderMarket();
});

// ══════════════════════════════════════════════════
// AUTH HELPERS
// ══════════════════════════════════════════════════
function _showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display   = 'none';
  switchAuth('login');
}

function _launchApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display   = '';

  var name  = currentUser.name || 'Farmer';
  var first = name.split(' ')[0];
  var h     = new Date().getHours();
  var greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  // Update sidebar
  var greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = greet + ', ' + first + ' 👋';

  var nameEl = document.getElementById('sidebar-name');
  if (nameEl) nameEl.textContent = name;

  var metaEl = document.getElementById('sidebar-meta');
  if (metaEl) metaEl.textContent = (currentUser.state || 'Nigeria') + ' · ' + (currentUser.acres || '?') + ' Acres';

  // Settings form
  var setName = document.getElementById('set-name');
  if (setName) setName.value = name;

  // Navigate
  var hash = location.hash.replace('#', '');
  _activatePage((hash && PAGE_TITLES[hash]) ? hash : 'overview');
}

// ══════════════════════════════════════════════════
// AUTH — SWITCH VIEWS
// ══════════════════════════════════════════════════
function switchAuth(view) {
  document.querySelectorAll('.auth-view').forEach(function(v) {
    v.classList.remove('active');
  });
  var target = document.getElementById('auth-' + view);
  if (target) target.classList.add('active');

  // Clear all errors
  ['auth-error', 'signup-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
}

// ══════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════
function doLogin() {
  var email = (document.getElementById('login-email')?.value || '').trim();
  var pass  = (document.getElementById('login-pass')?.value  || '').trim();

  // Clear error
  var errEl = document.getElementById('auth-error');
  if (errEl) errEl.style.display = 'none';

  // Validate
  if (!email || !pass) {
    _showError('auth-error', 'Please enter your email and password.');
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    _showError('auth-error', 'Please enter a valid email address.');
    return;
  }

  // ── Simulate login (replace with Supabase later) ──
  // Accept any valid email + password of 6+ chars
  if (pass.length < 6) {
    _showError('auth-error', 'Incorrect email or password.');
    return;
  }

  // Save user session
  currentUser = {
    name:  email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }),
    email: email,
    state: 'Nigeria',
    acres: '2',
    crop:  'Tomato',
  };
  localStorage.setItem('agrolink_user', JSON.stringify(currentUser));
  _launchApp();
}

// ══════════════════════════════════════════════════
// DEMO LOGIN
// ══════════════════════════════════════════════════
function doDemo() {
  currentUser = {
    name:  'Amina Osei',
    email: 'amina@agrolink.app',
    state: 'Kano State',
    acres: '2',
    crop:  'Tomato',
  };
  localStorage.setItem('agrolink_user', JSON.stringify(currentUser));
  _launchApp();
  showToast('👋 Welcome, Amina! This is a demo account.');
}

// ══════════════════════════════════════════════════
// SIGN UP
// ══════════════════════════════════════════════════
function doSignup() {
  var first = (document.getElementById('su-first')?.value || '').trim();
  var last  = (document.getElementById('su-last')?.value  || '').trim();
  var email = (document.getElementById('su-email')?.value || '').trim();
  var phone = (document.getElementById('su-phone')?.value || '').trim();
  var state = (document.getElementById('su-state')?.value || '');
  var acres = (document.getElementById('su-acres')?.value || '1').trim();
  var crop  = (document.getElementById('su-crop')?.value  || 'Tomato');
  var pass  = (document.getElementById('su-pass')?.value  || '').trim();

  // Clear error
  var errEl = document.getElementById('signup-error');
  if (errEl) errEl.style.display = 'none';

  // Validate
  if (!first) { _showError('signup-error', 'Please enter your first name.'); return; }
  if (!last)  { _showError('signup-error', 'Please enter your last name.');  return; }
  if (!email) { _showError('signup-error', 'Please enter your email address.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { _showError('signup-error', 'Please enter a valid email address.'); return; }
  if (!state) { _showError('signup-error', 'Please select your state.'); return; }
  if (!pass)  { _showError('signup-error', 'Please create a password.'); return; }
  if (pass.length < 8) { _showError('signup-error', 'Password must be at least 8 characters.'); return; }

  // Save user
  currentUser = {
    name:  first + ' ' + last,
    email: email,
    phone: phone,
    state: state,
    acres: acres || '1',
    crop:  crop,
  };
  localStorage.setItem('agrolink_user', JSON.stringify(currentUser));
  _launchApp();
  showToast('🎉 Welcome to AgroLink, ' + first + '!');
}

// ══════════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════════
function doLogout() {
  currentUser = null;
  localStorage.removeItem('agrolink_user');
  advisorHistory = [];
  _showAuth();
}

// ── Error helper ──────────────────────────────────
function _showError(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
var PAGE_TITLES = {
  overview:    'Dashboard Overview',
  prices:      'Market Prices',
  weather:     'Weather & Advisory',
  cooperative: 'My Cooperative',
  pools:       'Harvest Pools',
  transactions:'Transactions',
  advisor:     'AI Price Advisor',
  ussd:        'USSD Simulator',
  marketplace: 'Buyer Marketplace',
  settings:    'Settings',
};

var BN_MAP = {
  overview:    'bn-overview',
  prices:      'bn-prices',
  advisor:     'bn-advisor',
  marketplace: 'bn-marketplace',
  settings:    'bn-settings',
};

function showPage(id) {
  _activatePage(id);
  closeDrawer();
}

function _activatePage(id) {
  if (!PAGE_TITLES[id]) return;

  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');

  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[id];

  document.querySelectorAll('.sidebar .nav-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('onclick') === "showPage('" + id + "')");
  });

  document.querySelectorAll('.bottom-nav-item').forEach(function(el) { el.classList.remove('active'); });
  var bnEl = document.getElementById(BN_MAP[id]);
  if (bnEl) bnEl.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#' + id);
}

// ── DRAWER ────────────────────────────────────────
function openDrawer() {
  document.querySelector('.sidebar')?.classList.add('drawer-open');
  document.getElementById('sidebar-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.querySelector('.sidebar')?.classList.remove('drawer-open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════
function openModal() {
  document.getElementById('pool-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('pool-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function submitPool() {
  closeModal();
  showToast('🌾 Pool created! Members notified via SMS.');
}

// ══════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════
var _toastTimer = null;

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, 3500);
}

// ══════════════════════════════════════════════════
// SAVE SETTINGS
// ══════════════════════════════════════════════════
function saveSettings() {
  var name = (document.getElementById('set-name')?.value || '').trim();
  if (!name) { showToast('⚠️ Name cannot be empty.'); return; }

  if (currentUser) {
    currentUser.name = name;
    localStorage.setItem('agrolink_user', JSON.stringify(currentUser));
    var nameEl = document.getElementById('sidebar-name');
    if (nameEl) nameEl.textContent = name;
  }

  showToast('✅ Settings saved!');
}

// ══════════════════════════════════════════════════
// AI PRICE ADVISOR
// ══════════════════════════════════════════════════
var advisorHistory = [];

function askAdvisor(text) {
  var input = document.getElementById('advisor-input');
  if (input) { input.value = text; sendAdvisor(); }
}

async function sendAdvisor() {
  var input = document.getElementById('advisor-input');
  var text  = (input?.value || '').trim();
  if (!text) return;
  input.value = '';

  var sugg = document.getElementById('advisor-suggestions');
  if (sugg) sugg.style.display = 'none';

  _addAdvisorMsg(text, 'user');
  advisorHistory.push({ role: 'user', content: text });

  var typing = document.createElement('div');
  typing.id = 'advisor-typing';
  typing.className = 'advisor-msg bot advisor-typing';
  typing.innerHTML = '<div class="advisor-avatar">🤖</div><div class="advisor-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  var chat = document.getElementById('advisor-chat');
  if (chat) { chat.appendChild(typing); _scrollAdvisor(); }

  var sendBtn = document.getElementById('advisor-send');
  if (sendBtn) sendBtn.disabled = true;

  var user   = currentUser || {};
  var system = 'You are AgroLink\'s AI Price Advisor for Nigerian smallholder farmers.\n' +
    'Current market prices:\n' +
    '- Tomato: ₦280/kg (+12%) — sell now\n' +
    '- Maize: ₦195/kg (+0.5%) — hold\n' +
    '- Onion: ₦310/kg (+6%) — sell now\n' +
    '- Groundnut: ₦420/kg (-8%) — wait\n' +
    '- Sorghum: ₦160/kg (flat)\n' +
    '- Yam: ₦380/kg (+7%) — rising\n' +
    'Weather: Heavy rain Tuesday–Wednesday in Kano (38mm). Harvest tomatoes before Tuesday.\n' +
    'Farmer: ' + (user.name || 'Amina Osei') + ', grows ' + (user.crop || 'Tomato') + ' in ' + (user.state || 'Kano State') + ', ' + (user.acres || 2) + ' acres.\n' +
    'Give concise (2–4 sentence), warm, practical advice. Use ₦. Be direct and specific.';

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system,
        messages: advisorHistory.slice(-10),
      }),
    });

    var data  = await res.json();
    var reply = (data.content && data.content[0] && data.content[0].text) || 'Sorry, no response. Try again.';

    document.getElementById('advisor-typing')?.remove();
    _addAdvisorMsg(reply, 'bot');
    advisorHistory.push({ role: 'assistant', content: reply });

  } catch(err) {
    document.getElementById('advisor-typing')?.remove();
    _addAdvisorMsg("Can't connect right now. Check your internet and try again.", 'bot');
  }

  if (sendBtn) sendBtn.disabled = false;
  if (input) input.focus();
}

function _addAdvisorMsg(text, role) {
  var chat = document.getElementById('advisor-chat');
  if (!chat) return;
  var div = document.createElement('div');
  div.className = 'advisor-msg ' + role;
  div.innerHTML = role === 'bot'
    ? '<div class="advisor-avatar">🤖</div><div class="advisor-bubble">' + text.replace(/\n/g,'<br>') + '</div>'
    : '<div class="advisor-bubble">' + text + '</div>';
  chat.appendChild(div);
  _scrollAdvisor();
}

function _scrollAdvisor() {
  var chat = document.getElementById('advisor-chat');
  if (chat) setTimeout(function() { chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }); }, 50);
}

// ══════════════════════════════════════════════════
// USSD SIMULATOR
// ══════════════════════════════════════════════════
var USSD_FLOWS = {
  main: 'AgroLink USSD Service\n*347*55#\n\n1. Market Prices\n2. Weather Forecast\n3. Join Harvest Pool\n4. Check Payment\n5. Crop Advisory\n\n0. Exit',
  '1':  'Market Prices — Today\n\n1. Tomato  ₦280/kg (+12%)\n2. Maize   ₦195/kg (flat)\n3. Onion   ₦310/kg (+6%)\n4. Groundnut ₦420/kg (-8%)\n5. Sorghum ₦160/kg\n\n0. Back',
  '11': '🍅 TOMATO — KANO\n\nToday:   ₦280/kg\nYest:    ₦250/kg\nTrend:   ↑ RISING\nAdvice:  SELL TODAY\n\n0. Back to menu',
  '12': '🌽 MAIZE — LAGOS\n\nToday:   ₦195/kg\nTrend:   → STABLE\nAdvice:  HOLD 1-2 weeks\n\n0. Back to menu',
  '13': '🧅 ONION — KANO\n\nToday:   ₦310/kg\nTrend:   ↑ RISING FAST\nAdvice:  SELL NOW\n\n0. Back to menu',
  '14': '🥜 GROUNDNUT — ABUJA\n\nToday:   ₦420/kg\nTrend:   ↓ FALLING\nAdvice:  WAIT 2 weeks\n\n0. Back to menu',
  '2':  'Weather — Kano State\n\nToday: ⛅ 28°C Cloudy\nMon:   🌤 29°C Clear\nTue:   🌧 24°C RAIN\nWed:   ⛈ 22°C STORM\n\n⚠ Harvest tomato before Tue!\n\n0. Back',
  '3':  'Join Harvest Pool\n\n1. Tomato Pool #3\n   72% full · Closes Mar 18\n   Floor: ₦260/kg\n2. Onion Pool #2\n   FULL - Seeking buyer\n\n0. Back',
  '31': 'Tomato Pool #3\n\n21.6 of 30 tonnes pooled\n\nEnter your quantity in kg\ne.g. 500 for 500kg:\n\n0. Back',
  '4':  'Check Payment\n\n1. Tomato · 14 Mar\n   +₦52,000 ✓ PAID\n2. Onion · 12 Mar\n   ₦32,000 ⏳ ESCROW\n3. Maize · 5 Mar\n   +₦28,400 ✓ PAID\n\nTotal pending: ₦32,000\n\n0. Back',
  '5':  'Crop Advisory\n\n1. Harvest tomatoes NOW\n   Rain Tue. Risk ₦18,000 loss\n2. Check maize for armyworm\n3. After harvest: plant cowpea\n\n0. Back',
};

var ussdState = null;

function ussdDial() {
  ussdState = 'main';
  _showUssd(USSD_FLOWS.main);
  var el = document.getElementById('ussd-input');
  if (el) { el.value = ''; el.placeholder = 'Enter option number…'; }
}

function ussdReply() {
  var input = document.getElementById('ussd-input');
  var val   = (input?.value || '').trim();
  if (!val) return;
  input.value = '';

  if (val === '0') {
    if (ussdState && ussdState.length > 1) {
      ussdState = ussdState.slice(0, -1);
      _showUssd(USSD_FLOWS[ussdState] || USSD_FLOWS.main);
    } else {
      ussdState = null;
      _showUssd('Session ended.\n\nThank you for using AgroLink.\nDial *347*55# anytime.');
    }
    return;
  }

  var next = ussdState === 'main' ? val : ussdState + val;

  if (USSD_FLOWS[next]) {
    ussdState = next;
    _showUssd(USSD_FLOWS[next]);
  } else if (ussdState === '31' && !isNaN(parseInt(val)) && parseInt(val) > 0) {
    _showUssd('✓ CONFIRMED\n\nJoined Tomato Pool #3\nContribution: ' + parseInt(val).toLocaleString() + ' kg\n\nSMS sent when buyer found.\nFloor price: ₦260/kg\n\n0. Back to menu');
    ussdState = 'main';
  } else {
    _showUssd('Invalid option "' + val + '".\nPlease try again.\n\n' + (USSD_FLOWS[ussdState] || 'Dial *347*55# to restart.'));
  }
}

function _showUssd(text) {
  var el = document.getElementById('ussd-content');
  if (el) el.innerHTML = text.replace(/\n/g, '<br>');
}

// ══════════════════════════════════════════════════
// BUYER MARKETPLACE
// ══════════════════════════════════════════════════
var MARKET_DATA = [
  { id:1, emoji:'🍅', crop:'Tomato',    coop:'Kano Smallholders Coop',      qty:21.6, price:260, state:'Kano',   status:'Open',           members:22, closes:'Mar 18', grade:'Grade A', verified:true  },
  { id:2, emoji:'🧅', crop:'Onion',     coop:'Plateau Farmers Alliance',    qty:20,   price:305, state:'Jos',    status:'Awaiting Buyer', members:18, closes:'Mar 20', grade:'Premium', verified:true  },
  { id:3, emoji:'🌽', crop:'Maize',     coop:'Kaduna Grain Collective',     qty:45,   price:195, state:'Kaduna', status:'Open',           members:31, closes:'Mar 25', grade:'Grade B', verified:true  },
  { id:4, emoji:'🥜', crop:'Groundnut', coop:'Katsina Groundnut Union',     qty:12,   price:430, state:'Lagos',  status:'Open',           members:14, closes:'Mar 30', grade:'Premium', verified:true  },
  { id:5, emoji:'🍠', crop:'Yam',       coop:'Benue Root Crops Coop',       qty:30,   price:375, state:'Abuja',  status:'Awaiting Buyer', members:25, closes:'Apr 2',  grade:'Grade A', verified:false },
  { id:6, emoji:'🌾', crop:'Sorghum',   coop:'Kano North Farmers Union',    qty:60,   price:158, state:'Kano',   status:'Open',           members:40, closes:'Apr 5',  grade:'Grade B', verified:true  },
  { id:7, emoji:'🍅', crop:'Tomato',    coop:'Oyo Fresh Produce Coop',      qty:15,   price:270, state:'Oyo',    status:'Open',           members:19, closes:'Mar 22', grade:'Grade A', verified:true  },
  { id:8, emoji:'🌽', crop:'Maize',     coop:'Rivers Smallholders Network', qty:28,   price:200, state:'Rivers', status:'Open',           members:22, closes:'Apr 1',  grade:'Grade A', verified:false },
];

function renderMarket(data) {
  var list      = data || MARKET_DATA;
  var container = document.getElementById('market-listings');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div style="text-align:center;padding:48px 20px;color:var(--gray)"><div style="font-size:40px;margin-bottom:12px">🔍</div><p>No pools match your filters.</p></div>';
    return;
  }

  container.innerHTML = list.map(function(l) {
    return '<div class="mkt-listing">' +
      '<div class="mkt-listing-top">' +
        '<div class="mkt-listing-crop">' + l.emoji + '</div>' +
        '<div class="mkt-listing-info">' +
          '<div class="mkt-listing-name">' + l.crop + ' — ' + l.qty + 't</div>' +
          '<div class="mkt-listing-coop">' + l.coop + '</div>' +
        '</div>' +
        '<span class="pool-status ' + (l.status === 'Open' ? 'status-open' : 'status-pending') + '">' + l.status + '</span>' +
      '</div>' +
      '<div class="mkt-listing-meta">' +
        '<span class="mkt-tag price">₦' + l.price.toLocaleString() + '/kg floor</span>' +
        '<span class="mkt-tag">📍 ' + l.state + '</span>' +
        '<span class="mkt-tag">🌾 ' + l.grade + '</span>' +
        '<span class="mkt-tag">👥 ' + l.members + ' farmers</span>' +
        '<span class="mkt-tag">📅 Closes ' + l.closes + '</span>' +
      '</div>' +
      '<div class="mkt-listing-footer">' +
        '<div class="mkt-seller">' +
          '<div class="mkt-seller-avatar">🤝</div>' +
          '<div>' +
            '<div style="font-size:12px;font-weight:500;color:var(--ink)">' + l.coop + '</div>' +
            (l.verified ? '<div class="mkt-verified">⛓ Verified Cooperative</div>' : '<div style="font-size:10px;color:var(--lgray)">Pending verification</div>') +
          '</div>' +
        '</div>' +
        '<div class="mkt-actions">' +
          '<button class="btn btn-outline" style="font-size:12px;padding:6px 12px" onclick="showToast(\'💬 Message sent!\')">Message</button>' +
          '<button class="btn btn-primary"  style="font-size:12px;padding:6px 14px" onclick="showToast(\'✅ Offer sent! Coop responds within 24h.\')">Make Offer</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function filterMarket(reset) {
  if (reset) {
    ['mkt-crop','mkt-state','mkt-status'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderMarket();
    return;
  }
  var crop   = (document.getElementById('mkt-crop')?.value   || '').toLowerCase();
  var state  = (document.getElementById('mkt-state')?.value  || '').toLowerCase();
  var status = (document.getElementById('mkt-status')?.value || '').toLowerCase();

  renderMarket(MARKET_DATA.filter(function(l) {
    return (!crop   || l.crop.toLowerCase()   === crop)  &&
           (!state  || l.state.toLowerCase()  === state) &&
           (!status || l.status.toLowerCase() === status);
  }));
}

// ══════════════════════════════════════════════════
// PWA INSTALL BANNER
// ══════════════════════════════════════════════════
var _installPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _installPrompt = e;
  setTimeout(_showInstallBanner, 5000);
});

window.addEventListener('appinstalled', function() {
  var b = document.getElementById('install-banner');
  if (b) b.remove();
  _installPrompt = null;
});

function _showInstallBanner() {
  if (document.getElementById('install-banner') || !currentUser) return;
  var d = document.createElement('div');
  d.id = 'install-banner';
  d.innerHTML = '<div style="position:fixed;bottom:calc(var(--bottom-nav-h,60px) + 14px);left:14px;right:14px;background:#0F1F0F;color:#fff;border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.35);z-index:500;font-family:\'Outfit\',sans-serif;border:1px solid rgba(123,198,123,0.25);">' +
    '<span style="font-size:22px;flex-shrink:0">🌿</span>' +
    '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">Install AgroLink</div><div style="font-size:11px;color:rgba(255,255,255,0.45)">Works offline · Add to home screen</div></div>' +
    '<button id="install-btn" style="background:#2D6A2D;color:#fff;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">Install</button>' +
    '<button id="install-dismiss" style="background:transparent;border:none;color:rgba(255,255,255,0.4);font-size:20px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0">×</button>' +
  '</div>';
  document.body.appendChild(d);

  document.getElementById('install-btn').addEventListener('click', async function() {
    if (!_installPrompt) return;
    _installPrompt.prompt();
    var result = await _installPrompt.userChoice;
    if (result.outcome === 'accepted') showToast('✅ Added to home screen!');
    _installPrompt = null;
    d.remove();
  });

  document.getElementById('install-dismiss').addEventListener('click', function() { d.remove(); });
}
