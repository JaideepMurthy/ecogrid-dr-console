export function renderGridOverview(gridData) {
  if (!gridData) return;
  const kpiContainer = document.querySelector('#grid-kpis');
  if (!kpiContainer) return;
  const demandMw = gridData.totalDemandMW || 4300;
  const supplyMw = gridData.totalSupplyMW || 4450;
  const price = gridData.marketPriceEUR || 82.5;
  kpiContainer.innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Total demand</div><div class="kpi-value">${demandMw.toLocaleString()} MW</div><div class="kpi-sub">Current grid load</div></div>
    <div class="kpi-card"><div class="kpi-label">Total supply</div><div class="kpi-value">${supplyMw.toLocaleString()} MW</div><div class="kpi-sub">${supplyMw - demandMw >= 0 ? 'Surplus' : 'Shortfall'} ${Math.abs(supplyMw - demandMw)} MW</div></div>
    <div class="kpi-card"><div class="kpi-label">Market price</div><div class="kpi-value">EUR ${price.toFixed(2)}/MWh</div><div class="kpi-sub">Day-ahead price</div></div>
    <div class="kpi-card"><div class="kpi-label">Renewable %</div><div class="kpi-value">78%</div><div class="kpi-sub">Solar+Wind+Hydro</div></div>
  `;
  if (window.Chart && document.getElementById('chart-demand-supply') && gridData.hourly) {
    const labels = gridData.hourly.map((h, i) => `${i}:00`);
    const demandSeries = gridData.hourly.map(h => h.demandMW);
    const supplySeries = gridData.hourly.map(h => h.supplyMW);
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
  if (window.Chart && document.getElementById('chart-price') && gridData.hourly) {
    const labels = gridData.hourly.map((h, i) => `${i}:00`);
    const priceSeries = gridData.hourly.map(h => h.priceMWh);
    new Chart(document.getElementById('chart-price'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Price (EUR/MWh)', data: priceSeries, borderColor: '#8be9fd', backgroundColor: 'rgba(139,233,253,0.1)', tension: 0.3 }] },
      options: { maintainAspectRatio: false, scales: { x: { ticks: { color: '#7b82a1' } }, y: { ticks: { color: '#7b82a1' } } }, plugins: { legend: { labels: { color: '#f5f7ff' } } } }
    });
  }
  const refreshBtn = document.querySelector('#btn-refresh-grid');
  if (refreshBtn) refreshBtn.addEventListener('click', () => alert('Live API integration in Phase 3'));
}
