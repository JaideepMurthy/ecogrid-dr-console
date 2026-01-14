import { initDb } from './db.js';
import { startRealtimePolling } from './api.js';
import { fetchGridData } from './api.js';
import { renderGridOverview } from './ui-grid.js';
import { renderForecastView } from './ui-forecast.js';
import { initDrConsole } from './ui-events.js';
import { renderHistoryView } from './ui-history.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDb();
    console.info('IndexedDB initialised');
    const sample = await fetchGridData();
    console.info('Sample grid data:', sample);
    renderGridOverview(sample);
    await renderForecastView();
    initDrConsole();
    await renderHistoryView();
    startRealtimePolling(async () => {
      await renderForecastView();
    });
  } catch (err) {
    console.error('App init error', err);
    const el = document.querySelector('#grid-kpis');
    if (el) {
      el.innerHTML = '<div class="kpi-card"><div class="kpi-label">Status</div><div class="kpi-value">Demo mode</div><div class="kpi-subtitle">Offline / Error</div></div>';
    }
  }
});

window.refreshHistory = async function() {
  try {
    await renderHistoryView();
    console.log('✓ Event History refreshed');
  } catch (err) {
    console.error('Error refreshing history:', err);
  }
};
