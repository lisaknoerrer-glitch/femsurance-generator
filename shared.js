/* ══════════ FemSurance Shared JavaScript ══════════ */

// ── API Key ──
const ANTHROPIC_API_KEY = localStorage.getItem('fs_api_key') || 'DEIN_API_KEY_HIER';
if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'DEIN_API_KEY_HIER') {
  console.warn('API-Key fehlt. Bitte auf der Startseite (index.html) eingeben.');
}

// ── Strategie Context (used in all API calls) ──
function getStrategieContext() {
  try {
    const s = JSON.parse(localStorage.getItem('fem_strategie') || '{}');
    const np = JSON.parse(localStorage.getItem('fem_nicht_posten') || '[]');
    const parts = [];
    if (s.fokusThemen?.length) parts.push('Fokus-Themen: ' + s.fokusThemen.map(f => f.thema || f).filter(Boolean).join(' / '));
    if (s.positionierung?.wirken) parts.push('Positionierung: ' + s.positionierung.wirken);
    if (s.positionierung?.nichtWirken) parts.push('Nicht wirken: ' + s.positionierung.nichtWirken);
    if (s.positionierung?.einzigartig) parts.push('Was macht uns einzigartig: ' + s.positionierung.einzigartig);
    if (s.contentPrinzip?.prinzip) parts.push('Content-Prinzip: ' + s.contentPrinzip.prinzip);
    if (s.contentPrinzip?.erfolgsformel) parts.push('Erfolgsformel: ' + s.contentPrinzip.erfolgsformel);
    if (s.zielgruppe?.length) parts.push('Zielgruppe: ' + s.zielgruppe.filter(Boolean).join(' / '));
    if (s.brandVoice?.badges?.length) parts.push('Brand Voice: ' + s.brandVoice.badges.join(' · '));
    if (np.filter(Boolean).length) parts.push('Diese Woche nicht posten: ' + np.filter(Boolean).join(' / '));
    if (parts.length) return '## FemSurance Strategie\n' + parts.join('\n') + '\n\nHalte dich strikt an diese Strategie bei allen generierten Inhalten.\n\n';
  } catch(e) { console.warn('Daten-Ladefehler:', e.message); }
  return '';
}

// ── Dark Mode Toggle ──
document.addEventListener('DOMContentLoaded', () => {
  const dmToggle = document.getElementById('dmToggle');
  if (!dmToggle) return;
  if (localStorage.getItem('fem_dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
    dmToggle.textContent = '\u2600\ufe0f';
  }
  dmToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const on = document.body.classList.contains('dark-mode');
    localStorage.setItem('fem_dark_mode', on);
    this.textContent = on ? '\u2600\ufe0f' : '\ud83c\udf19';
    // Notify other tabs
    if (window._femChannel) window._femChannel.postMessage({ type: 'dark-mode', value: on });
  });
});

// ── Multi-Tab Sync via BroadcastChannel ──
(function() {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel('femsurance_sync');
  window._femChannel = channel;

  channel.onmessage = function(e) {
    const msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'dark-mode') {
      const dmToggle = document.getElementById('dmToggle');
      if (msg.value) {
        document.body.classList.add('dark-mode');
        if (dmToggle) dmToggle.textContent = '\u2600\ufe0f';
      } else {
        document.body.classList.remove('dark-mode');
        if (dmToggle) dmToggle.textContent = '\ud83c\udf19';
      }
      localStorage.setItem('fem_dark_mode', msg.value);
    }

    if (msg.type === 'storage-update' && msg.key) {
      // Another tab updated localStorage — trigger a page-specific refresh if needed
      window.dispatchEvent(new CustomEvent('fem-sync', { detail: { key: msg.key } }));
    }
  };

  // Helper: call this after writing to localStorage to notify other tabs
  window.femNotifySync = function(key) {
    channel.postMessage({ type: 'storage-update', key: key });
  };
})();
