export function renderGridOverview(sampleData) {
  const kpiContainer = document.querySelector('#grid-kpis');
  if (!kpiContainer) return;
  const demandMw = 4300;
  const supplyMw = 4450;
  const price = 82.5;
  kpiContainer.innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Total demand</div><div class="kpi-value">${demandMw.toLocaleString()} MW</div><div class="kpi-sub">Approximate current load</div></div>
    <div class="kpi-card"><div class="kpi-label">Total supply</div><div class="kpi-value">${supplyMw.toLocaleString()} MW</div><div class="kpi-sub">${supplyMw - demandMw >= 0 ? 'Surplus' : 'Shortfall'} ${supplyMw - demandMw} MW</div></div>
    <div class="kpi-card"><div class="kpi-label">Market price</div><div class="kpi-value">€${price.toFixed(1)}/MWh</div><div class="kpi-sub">Day-ahead proxy price</div></div>
  `;
  if (window.Chart && document.getElementById('chart-demand-supply')) {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const demandSeries = labels.map((_, i) => 3800 + 600 * Math.sin((Math.PI * i) / 24));
    const supplySeries = demandSeries.map((v) => v + 150);
    new Chart(document.getElementById('chart-demand-supply'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Demand (MW)', data: demandSeries, borderColor: '#ff5555', backgroundColor: 'rgba(255,85,85,0.1)', tension: 0.3 },
          { label: 'Supply (MW)', data: supplySeries, borderColor: '#50fa7b', backgroundColor: 'rgba(80,250,123,0.1)', tension: 0.3 }
        ]
      },
      options: { maintainAspectRatio: false, scales: { x: { ticks: { color: '#7b82a1' } }, y: { ticks: { color: '#7b82a1' } } }, plugins: { legend: { labels: { color: '#f5f7ff' } } } }
    });
  }
  if (window.Chart && document.getElementById('chart-price')) {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const priceSeries = labels.map((_, i) => 60 + 30 * Math.sin((Math.PI * (i + 5)) / 24));
    new Chart(document.getElementById('chart-price'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Price (€/MWh)', data: priceSeries, borderColor: '#8be9fd', backgroundColor: 'rgba(139,233,253,0.1)', tension: 0.3 }] },
      options: { maintainAspectRatio: false, scales: { x: { ticks: { color: '#7b82a1' } }, y: { ticks: { color: '#7b82a1' } } }, plugins: { legend: { labels: { color: '#f5f7ff' } } } }
    });
  }
  const refreshBtn = document.querySelector('#btn-refresh-grid');
  if (refreshBtn) refreshBtn.addEventListener('click', () => alert('Refresh will use live grid API in next phase.'));
}
