// ── SERVICE WORKER REGISTRATION ──────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[AgroLink] SW registered:', reg.scope))
      .catch(err => console.warn('[AgroLink] SW registration failed:', err));
  });
}

// ── PWA INSTALL PROMPT ────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (document.getElementById('install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <div style="
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#0F1F0F; color:white; border-radius:14px;
      padding:14px 20px; display:flex; align-items:center; gap:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.35); z-index:400;
      font-family:'Outfit',sans-serif; font-size:14px;
      border:1px solid rgba(123,198,123,0.25);
      max-width:360px; width:90vw;
    ">
      <span style="font-size:26px">🌿</span>
      <div style="flex:1; min-width:0">
        <div style="font-weight:600; margin-bottom:2px">Install AgroLink</div>
        <div style="font-size:11px; color:rgba(255,255,255,0.45); line-height:1.4">
          Add to home screen for instant offline access
        </div>
      </div>
      <button id="install-btn" style="
        background:#2D6A2D; color:white; border:none; border-radius:8px;
        padding:8px 14px; font-size:12px; font-weight:600;
        cursor:pointer; font-family:'Outfit',sans-serif; white-space:nowrap;
        flex-shrink:0;
      ">Install</button>
      <button id="install-dismiss" style="
        background:transparent; border:none; color:rgba(255,255,255,0.35);
        font-size:20px; cursor:pointer; padding:0 2px; line-height:1;
        flex-shrink:0;
      ">×</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') showToast('✅ AgroLink added to your home screen!');
    deferredInstallPrompt = null;
    banner.remove();
  });

  document.getElementById('install-dismiss').addEventListener('click', () => banner.remove());
}

window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('install-banner');
  if (banner) banner.remove();
  showToast('✅ AgroLink installed successfully!');
  deferredInstallPrompt = null;
});

// ── PAGE TITLES MAP ───────────────────────────────
const pageTitles = {
  overview:     'Dashboard Overview',
  prices:       'Market Prices',
  weather:      'Weather & Advisory',
  cooperative:  'My Cooperative',
  pools:        'Harvest Pools',
  transactions: 'Transactions',
  settings:     'Settings'
};

// ── SET CURRENT DATE ──────────────────────────────
document.getElementById('current-date').textContent =
  new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

// ── PAGE NAVIGATION ───────────────────────────────
function showPage(id, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  if (navEl)  navEl.classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[id] || id;
  history.replaceState(null, '', '#' + id);
}

// Handle hash on load (for manifest shortcuts)
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && pageTitles[hash]) {
    const idx = Object.keys(pageTitles).indexOf(hash);
    showPage(hash, document.querySelectorAll('.nav-item')[idx] || null);
  }
});

// ── MODAL ─────────────────────────────────────────
function openModal()  { document.getElementById('pool-modal').classList.add('open'); }
function closeModal() { document.getElementById('pool-modal').classList.remove('open'); }
function submitPool() {
  closeModal();
  showToast('🌾 Harvest pool created! Members have been notified via SMS.');
}

document.getElementById('pool-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── TOAST NOTIFICATIONS ───────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
  
