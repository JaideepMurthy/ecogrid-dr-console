import { initDb } from './db.js';
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
    renderForecastView();
    initDrConsole();
        renderHistoryView();
  } catch (err) {
    console.error('App init error', err);
    const el = document.querySelector('#grid-kpis');
    if (el) {
      el.innerHTML = '<div class="kpi-card"><div class="kpi-label">Status</div><div class="kpi-value">Demo mode</div><div class="kpi-sub">Live grid API unavailable</div></div>';
    }
  }
});
