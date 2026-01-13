import { listDrEvents, createDrEvent } from './db.js';

// Demo control functions
window.loadSampleEvents = async function() {
  const samples = [
    {
      targetMw: 150,
      achievedMw: 135,
      durationH: 1.5,
      startTime: '2026-01-13T06:00:00',
      costSavedEur: 8100,
      co2AvoidedTons: 91
    },
    {
      targetMw: 200,
      achievedMw: 180,
      durationH: 2,
      startTime: '2026-01-13T18:00:00',
      costSavedEur: 14400,
      co2AvoidedTons: 162
    },
    {
      targetMw: 100,
      achievedMw: 95,
      durationH: 1,
      startTime: '2026-01-13T19:30:00',
      costSavedEur: 3800,
      co2AvoidedTons: 43
    }
  ];

  try {
    for (const event of samples) {
      event.createdAt = new Date(event.startTime).toISOString();
      await createDrEvent(event);
    }
    alert('✓ 3 sample events loaded. Refreshing...');
    renderHistoryView(); // Re-render immediately
  } catch (err) {
    alert('Error loading sample events: ' + err.message);
  }
};

window.clearAllEvents = function() {
  if (confirm('🗑️ Clear all DR events and reset demo?')) {
    indexedDB.deleteDatabase('pt_grid_dr');
    alert('✓ Demo reset. Refreshing...');
    location.reload();
  }
};

function renderDemoControls() {
  return `
    <div class="demo-controls" style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button onclick="loadSampleEvents()" style="padding: 8px 16px; background: #2ecc71; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95em;">
        📊 Load Sample Events (Quick Demo)
      </button>
      <button onclick="clearAllEvents()" style="padding: 8px 16px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95em;">
        🔄 Reset Demo
      </button>
    </div>
  `;
}

export async function renderHistoryView() {
  const events = await listDrEvents();
  const tableBody = document.querySelector('#history-table tbody');
  const aggregatesContainer = document.querySelector('#history-aggregates');
  const historyMwCanvas = document.getElementById('chart-history-mw');
  const historyCostCanvas = document.getElementById('chart-history-cost');
  const viewHistory = document.getElementById('view-history');

  if (!tableBody || !aggregatesContainer) return;

  // Calculate aggregates
  const totals = {
    targetMw: events.reduce((sum, e) => sum + (e.targetMw || 0), 0),
    achievedMw: events.reduce((sum, e) => sum + (e.achievedMw || 0), 0),
    costSaved: events.reduce((sum, e) => sum + (e.costSavedEur || 0), 0),
    co2Avoided: events.reduce((sum, e) => sum + (e.co2AvoidedTons || 0), 0),
    totalDuration: events.reduce((sum, e) => sum + (e.durationH || 0), 0)
  };

  // Render demo control buttons
  if (viewHistory) {
    const controlsHtml = renderDemoControls();
    const existingControls = viewHistory.querySelector('.demo-controls');
    if (existingControls) {
      existingControls.remove();
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = controlsHtml;
    viewHistory.insertBefore(tempDiv.firstElementChild, viewHistory.firstChild);
  }

  // Render KPI aggregates
  const avgAchievement = events.length > 0 ? (totals.achievedMw / totals.targetMw * 100).toFixed(0) : 0;
  aggregatesContainer.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Cost Saved</div>
      <div class="kpi-value">€${totals.costSaved.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total CO₂ Avoided</div>
      <div class="kpi-value">${totals.co2Avoided.toFixed(1)} t</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Events Executed</div>
      <div class="kpi-value">${events.length}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Avg Achievement</div>
      <div class="kpi-value">${avgAchievement}%</div>
    </div>
  `;

  // Populate history table
  tableBody.innerHTML = '';
  if (events.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1rem;color:#999;">No events yet. Click "Load Sample Events" to demo.</td></tr>';
  } else {
    events.forEach((e) => {
      const row = document.createElement('tr');
      const date = new Date(e.createdAt).toLocaleDateString('en-US');
      const achievement = ((e.achievedMw / e.targetMw) * 100).toFixed(0);
      row.innerHTML = `
        <td>${date}</td>
        <td>${e.targetMw}</td>
        <td>${e.achievedMw.toFixed(1)}</td>
        <td>${e.durationH}</td>
        <td>€${e.costSavedEur.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
        <td>${e.co2AvoidedTons.toFixed(1)}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Create MW trend chart
  if (historyMwCanvas && window.Chart && events.length > 0) {
    const labels = events.map((e, i) => `Event ${i + 1}`);
    const targetData = events.map(e => e.targetMw);
    const achievedData = events.map(e => e.achievedMw);

    // Destroy existing chart if it exists
    if (historyMwCanvas.chartInstance) {
      historyMwCanvas.chartInstance.destroy();
    }

    historyMwCanvas.chartInstance = new window.Chart(historyMwCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Target MW', data: targetData, backgroundColor: '#FF6B6B', borderRadius: 4 },
          { label: 'Achieved MW', data: achievedData, backgroundColor: '#51CF66', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#ddd' } } },
        scales: { y: { ticks: { color: '#999' }, grid: { color: '#333' } }, x: { ticks: { color: '#999' }, grid: { color: '#333' } } }
      }
    });
  }

  // Create cost trend chart
  if (historyCostCanvas && window.Chart && events.length > 0) {
    const labels = events.map((e, i) => `Event ${i + 1}`);
    const costData = events.map(e => e.costSavedEur);

    // Destroy existing chart if it exists
    if (historyCostCanvas.chartInstance) {
      historyCostCanvas.chartInstance.destroy();
    }

    historyCostCanvas.chartInstance = new window.Chart(historyCostCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cost Saved (€)',
          data: costData,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#ddd' } } },
        scales: { y: { ticks: { color: '#999' }, grid: { color: '#333' } }, x: { ticks: { color: '#999' }, grid: { color: '#333' } } }
      }
    });
  }
}
