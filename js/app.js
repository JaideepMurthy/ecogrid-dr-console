import { initDb } from './db.js';
import { startRealtimePolling, fetchGridData } from './api.js';
import { renderGridOverview } from './ui-grid.js';
import { renderForecastView } from './ui-forecast.js';
import { initDrConsole } from './ui-events.js';
import { renderHistoryView } from './ui-history.js';
import { initIntegration } from './ui-integration.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('APP: DOMContentLoaded fired');
  
  try {
    console.log('APP: Initializing DB...');
        initIntegration();
    await initDb();
    console.info('✓ IndexedDB initialised');
    
    console.log('APP: Fetching grid data...');
    const sample = await fetchGridData();
    console.info('✓ Sample grid data received:', sample);
    
    console.log('APP: Rendering grid overview...');
    renderGridOverview(sample);
    
    console.log('APP: Rendering forecast view...');
    await renderForecastView();
    
    console.log('APP: Initializing DR console...');
    initDrConsole();
    
    console.log('APP: Rendering history view...');
    await renderHistoryView();
    
    console.log('APP: Starting real-time polling...');
    startRealtimePolling(async () => {
      console.log('APP: Polling update triggered');
      await renderForecastView();
    });
    
    console.log('✓ 40
                ');
  } catch (err) {
    console.error('✗ App init error:', err);
    console.error('Stack:', err.stack);
    
    // Fallback: Show error message
    const el = document.querySelector('#grid-kpis');
    if (el) {
      el.innerHTML = `<div style="padding: 20px; background: #ff6b6b; color: white; border-radius: 8px;">
        <h3>Error Initializing App</h3>
        <p>${err.message}</p>
        <p style="font-size: 12px; margin-top: 10px; font-family: monospace;">${err.toString()}</p>
      </div>`;
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

// Initialize tab navigation
document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const viewName = button.getAttribute('data-view');
    
    // Remove active from all buttons
    document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));
    // Add active to clicked button
    button.classList.add('active');
    
    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(section => {
      section.removeAttribute('data-view');
    });
    
    // Show selected view section
    const selectedSection = document.getElementById(`view-${viewName}`);
    if (selectedSection) {
      selectedSection.setAttribute('data-view', viewName);
      console.log(`✓ Switched to ${viewName} view`);
    }
  });
});

console.log('✓ Tab navigation initialized');

// Initialize with grid view visible
const gridButton = document.querySelector('[data-view="grid"]');
if (gridButton) gridButton.click();
