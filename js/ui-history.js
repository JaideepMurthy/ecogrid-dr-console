import { listDrEvents } from './db.js';

export async function renderHistoryView() {
  const events = await listDrEvents();
  const tableBody = document.querySelector('#history-table tbody');
  const aggregatesContainer = document.querySelector('#history-aggregates');
  const historyMwCanvas = document.getElementById('chart-history-mw');
  const historyCostCanvas = document.getElementById('chart-history-cost');

  if (!tableBody || !aggregatesContainer) return;

  // Calculate aggregates
  const totals = {
    targetMw: events.reduce((sum, e) => sum + (e.targetMw || 0), 0),
    achievedMw: events.reduce((sum, e) => sum + (e.achievedMw || 0), 0),
    costSaved: events.reduce((sum, e) => sum + (e.costSavedEur || 0), 0),
    co2Avoided: events.reduce((sum, e) => sum + (e.co2AvoidedTons || 0), 0),
    totalDuration: events.reduce((sum, e) => sum + (e.durationH || 0), 0)
  };

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
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1rem;">No events yet</td></tr>';
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

    new window.Chart(historyMwCanvas, {
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

    new window.Chart(historyCostCanvas, {
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
