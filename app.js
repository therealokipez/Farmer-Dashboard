/* ══════════════════════════════════════════════════
   AgroLink — app.js  v5
   No auth. Dashboard loads directly.
   ══════════════════════════════════════════════════ */

// ── SERVICE WORKER ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(r => console.log('[AgroLink] SW:', r.scope))
      .catch(e => console.warn('[AgroLink] SW:', e));
  });
}

// ── PAGE CONFIG ───────────────────────────────────
const PAGE_TITLES = {
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

const BN_MAP = {
  overview:    'bn-overview',
  prices:      'bn-prices',
  advisor:     'bn-advisor',
  marketplace: 'bn-marketplace',
  settings:    'bn-settings',
};

// ── INIT ON LOAD ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set date
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Navigate to hash if present (PWA shortcuts)
  const hash = location.hash.replace('#', '');
  if (hash && PAGE_TITLES[hash]) _activatePage(hash);

  // Attach modal close-on-backdrop
  document.getElementById('pool-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Render marketplace listings
  renderMarket();
});

// ── NAVIGATION ────────────────────────────────────
function showPage(id) { _activatePage(id); closeDrawer(); }

function _activatePage(id) {
  if (!PAGE_TITLES[id]) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');

  document.getElementById('page-title').textContent = PAGE_TITLES[id];

  document.querySelectorAll('.sidebar .nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick') === `showPage('${id}')`);
  });

  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(BN_MAP[id])?.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#' + id);
}

// ── SIDEBAR DRAWER ────────────────────────────────
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

// ── MODAL ─────────────────────────────────────────
function openModal()  { document.getElementById('pool-modal')?.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal() { document.getElementById('pool-modal')?.classList.remove('open'); document.body.style.overflow = ''; }
function submitPool() { closeModal(); showToast('🌾 Pool created! Members notified via SMS.'); }

// ── TOAST ─────────────────────────────────────────
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ══════════════════════════════════════════════════
// AI PRICE ADVISOR
// ══════════════════════════════════════════════════
let advisorHistory = [];

function askAdvisor(text) {
  const input = document.getElementById('advisor-input');
  if (input) { input.value = text; sendAdvisor(); }
}

async function sendAdvisor() {
  const input = document.getElementById('advisor-input');
  const text  = (input?.value || '').trim();
  if (!text) return;
  input.value = '';

  document.getElementById('advisor-suggestions')?.style &&
    (document.getElementById('advisor-suggestions').style.display = 'none');

  _addAdvisorMsg(text, 'user');
  advisorHistory.push({ role: 'user', content: text });

  // Typing indicator
  const typing = document.createElement('div');
  typing.id = 'advisor-typing';
  typing.className = 'advisor-msg bot advisor-typing';
  typing.innerHTML = `<div class="advisor-avatar">🤖</div><div class="advisor-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  document.getElementById('advisor-chat')?.appendChild(typing);
  _scrollAdvisor();

  const sendBtn = document.getElementById('advisor-send');
  if (sendBtn) sendBtn.disabled = true;

  const system = `You are AgroLink's AI Price Advisor for Nigerian smallholder farmers.
Current market data:
- Tomato: ₦280/kg (+12%) — good time to sell
- Maize: ₦195/kg (+0.5%) — stable, hold
- Onion: ₦310/kg (+6%) — good time to sell
- Groundnut: ₦420/kg (-8%) — falling, wait
- Sorghum: ₦160/kg (flat)
- Yam: ₦380/kg (+7%) — rising
Weather: Heavy rain Tuesday–Wednesday in Kano (38mm). Harvest tomatoes before Tuesday.
Active pools: Tomato Pool #3 (72% full, closes Mar 18, floor ₦260/kg), Onion Pool #2 (full, seeking buyer ₦305/kg).
Farmer: Amina Osei, grows Tomato & Onion in Kano State, 2 acres.
Give concise (2–4 sentence), warm, practical advice. Use ₦. Be direct and specific.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages: advisorHistory.slice(-10),
      }),
    });

    const data  = await res.json();
    const reply = data.content?.[0]?.text || 'Sorry, no response. Please try again.';

    document.getElementById('advisor-typing')?.remove();
    _addAdvisorMsg(reply, 'bot');
    advisorHistory.push({ role: 'assistant', content: reply });

  } catch {
    document.getElementById('advisor-typing')?.remove();
    _addAdvisorMsg("I'm having trouble connecting. Check your internet and try again.", 'bot');
  }

  if (sendBtn) sendBtn.disabled = false;
  input?.focus();
}

function _addAdvisorMsg(text, role) {
  const chat = document.getElementById('advisor-chat');
  if (!chat) return;
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
  if (chat) setTimeout(() => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }), 50);
}

// ══════════════════════════════════════════════════
// USSD SIMULATOR
// ══════════════════════════════════════════════════
const USSD_FLOWS = {
  main: `AgroLink USSD Service\n*347*55#\n\n1. Market Prices\n2. Weather Forecast\n3. Join Harvest Pool\n4. Check Payment\n5. Crop Advisory\n\n0. Exit`,
  '1':  `Market Prices — Today\n\n1. Tomato  ₦280/kg (+12%)\n2. Maize   ₦195/kg (flat)\n3. Onion   ₦310/kg (+6%)\n4. Groundnut ₦420/kg (-8%)\n5. Sorghum ₦160/kg\n\n0. Back`,
  '11': `🍅 TOMATO — KANO\n\nToday:   ₦280/kg\nYest:    ₦250/kg\nLast wk: ₦240/kg\nTrend:   ↑ RISING\nAdvice:  SELL TODAY\n\nBest market: Kano Central\n\n0. Back to menu`,
  '12': `🌽 MAIZE — LAGOS\n\nToday:   ₦195/kg\nYest:    ₦194/kg\nTrend:   → STABLE\nAdvice:  HOLD 1-2 weeks\n\n0. Back to menu`,
  '13': `🧅 ONION — KANO\n\nToday:   ₦310/kg\nYest:    ₦292/kg\nTrend:   ↑ RISING FAST\nAdvice:  SELL NOW\n\n0. Back to menu`,
  '14': `🥜 GROUNDNUT — ABUJA\n\nToday:   ₦420/kg\nYest:    ₦456/kg\nTrend:   ↓ FALLING\nAdvice:  WAIT 2 weeks\n\n0. Back to menu`,
  '2':  `Weather — Kano State\n\nToday: ⛅ 28°C Cloudy\nMon:   🌤 29°C Clear\nTue:   🌧 24°C RAIN\nWed:   ⛈ 22°C STORM\nThu:   🌤 26°C Clear\n\n⚠ Harvest tomato before Tue!\n\n0. Back`,
  '3':  `Join Harvest Pool\n\n1. Tomato Pool #3\n   72% full · Closes Mar 18\n   Floor: ₦260/kg\n\n2. Onion Pool #2\n   FULL - Seeking buyer\n   Best offer: ₦305/kg\n\n0. Back`,
  '31': `Tomato Pool #3\n\n21.6 of 30 tonnes pooled\n22 members joined\n\nEnter your quantity in kg\ne.g. type 500 for 500kg:\n\n0. Back`,
  '4':  `Check Payment\n\n1. Tomato · 14 Mar\n   +₦52,000 ✓ PAID\n\n2. Onion · 12 Mar\n   ₦32,000 ⏳ ESCROW\n\n3. Maize · 5 Mar\n   +₦28,400 ✓ PAID\n\nTotal pending: ₦32,000\n\n0. Back`,
  '5':  `Crop Advisory\n\n1. Harvest tomatoes NOW\n   Rain Tue. Risk: ₦18,000 loss\n\n2. Check maize for armyworm\n   Scout early morning\n\n3. After harvest: plant cowpea\n   to restore soil nitrogen\n\n0. Back`,
};

let ussdState = null;

function ussdDial() {
  ussdState = 'main';
  _showUssd(USSD_FLOWS.main);
  const input = document.getElementById('ussd-input');
  if (input) { input.value = ''; input.placeholder = 'Enter option number…'; }
}

function ussdReply() {
  const input = document.getElementById('ussd-input');
  const val   = (input?.value || '').trim();
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

  const next = ussdState === 'main' ? val : (ussdState + val);

  if (USSD_FLOWS[next]) {
    ussdState = next;
    _showUssd(USSD_FLOWS[next]);
  } else if (ussdState === '31' && !isNaN(parseInt(val)) && parseInt(val) > 0) {
    _showUssd(`✓ CONFIRMED\n\nYou joined Tomato Pool #3\nContribution: ${parseInt(val).toLocaleString()} kg\n\nSMS sent when buyer found.\n\nPool closes: 18 Mar 2026\nFloor price: ₦260/kg\n\n0. Back to menu`);
    ussdState = 'main';
  } else {
    _showUssd(`Invalid option "${val}".\nPlease try again.\n\n${USSD_FLOWS[ussdState] || 'Dial *347*55# to restart.'}`);
  }
}

function _showUssd(text) {
  const el = document.getElementById('ussd-content');
  if (el) el.innerHTML = text.replace(/\n/g, '<br>');
}

// ══════════════════════════════════════════════════
// BUYER MARKETPLACE
// ══════════════════════════════════════════════════
const MARKET_DATA = [
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
  const list = data || MARKET_DATA;
  const container = document.getElementById('market-listings');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--gray)"><div style="font-size:40px;margin-bottom:12px">🔍</div><p>No pools match your filters.</p></div>`;
    return;
  }

  container.innerHTML = list.map(l => `
    <div class="mkt-listing">
      <div class="mkt-listing-top">
        <div class="mkt-listing-crop">${l.emoji}</div>
        <div class="mkt-listing-info">
          <div class="mkt-listing-name">${l.crop} — ${l.qty}t</div>
          <div class="mkt-listing-coop">${l.coop}</div>
        </div>
        <span class="pool-status ${l.status === 'Open' ? 'status-open' : 'status-pending'}">${l.status}</span>
      </div>
      <div class="mkt-listing-meta">
        <span class="mkt-tag price">₦${l.price.toLocaleString()}/kg floor</span>
        <span class="mkt-tag">📍 ${l.state}</span>
        <span class="mkt-tag">🌾 ${l.grade}</span>
        <span class="mkt-tag">👥 ${l.members} farmers</span>
        <span class="mkt-tag">📅 Closes ${l.closes}</span>
      </div>
      <div class="mkt-listing-footer">
        <div class="mkt-seller">
          <div class="mkt-seller-avatar">🤝</div>
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--ink)">${l.coop}</div>
            ${l.verified
              ? '<div class="mkt-verified">⛓ Verified Cooperative</div>'
              : '<div style="font-size:10px;color:var(--lgray)">Pending verification</div>'}
          </div>
        </div>
        <div class="mkt-actions">
          <button class="btn btn-outline" style="font-size:12px;padding:6px 12px" onclick="showToast('💬 Message sent!')">Message</button>
          <button class="btn btn-primary"  style="font-size:12px;padding:6px 14px" onclick="showToast('✅ Offer sent! Coop responds within 24h.')">Make Offer</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterMarket(reset) {
  if (reset) {
    ['mkt-crop','mkt-state','mkt-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderMarket();
    return;
  }
  const crop   = (document.getElementById('mkt-crop')?.value   || '').toLowerCase();
  const state  = (document.getElementById('mkt-state')?.value  || '').toLowerCase();
  const status = (document.getElementById('mkt-status')?.value || '').toLowerCase();
  renderMarket(MARKET_DATA.filter(l =>
    (!crop   || l.crop.toLowerCase()   === crop)   &&
    (!state  || l.state.toLowerCase()  === state)  &&
    (!status || l.status.toLowerCase() === status)
  ));
}

// ══════════════════════════════════════════════════
// PWA INSTALL BANNER
// ══════════════════════════════════════════════════
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  setTimeout(_showInstallBanner, 5000);
});

window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner')?.remove();
  _installPrompt = null;
});

function _showInstallBanner() {
  if (document.getElementById('install-banner')) return;
  const d = document.createElement('div');
  d.id = 'install-banner';
  d.innerHTML = `
    <div style="position:fixed;bottom:calc(var(--bottom-nav-h,60px) + 14px);left:14px;right:14px;
      background:#0F1F0F;color:#fff;border-radius:14px;padding:13px 16px;
      display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.35);
      z-index:500;font-family:'Outfit',sans-serif;border:1px solid rgba(123,198,123,0.25);">
      <span style="font-size:22px;flex-shrink:0">🌿</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px">Install AgroLink</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45)">Works offline · Add to home screen</div>
      </div>
      <button id="install-btn" style="background:#2D6A2D;color:#fff;border:none;border-radius:8px;
        padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;
        font-family:'Outfit',sans-serif;white-space:nowrap;flex-shrink:0">Install</button>
      <button id="install-dismiss" style="background:transparent;border:none;
        color:rgba(255,255,255,0.4);font-size:20px;cursor:pointer;padding:0 4px;
        line-height:1;flex-shrink:0">×</button>
    </div>`;
  document.body.appendChild(d);
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!_installPrompt) return;
    _installPrompt.prompt();
    const { outcome } = await _installPrompt.userChoice;
    if (outcome === 'accepted') showToast('✅ Added to home screen!');
    _installPrompt = null;
    d.remove();
  });
  document.getElementById('install-dismiss').addEventListener('click', () => d.remove());
}
