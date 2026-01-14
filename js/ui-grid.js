// Mock grid data with realistic demand/supply patterns
const mockGridData = {
  totalDemandMW: 4300,
  totalSupplyMW: 4450,
  renewablePercentage: 78,
  marketPriceEUR: 82.50,
  hourly: {
    timestamps: Array.from({length: 24}, (_, i) => `${i}:00`),
    demand: [2100, 1950, 1850, 1800, 1950, 2200, 2800, 3200, 3800, 4100, 4300, 4400, 4350, 4200, 3900, 3600, 3800, 4100, 4300, 4200, 3900, 3400, 2800, 2300],
    supply: [2200, 2050, 1950, 1950, 2100, 2350, 2950, 3350, 3900, 4100, 4300, 4500, 4450, 4300, 4000, 3700, 3900, 4200, 4400, 4300, 4000, 3500, 2900, 2400]
  }
};

export function renderGridOverview(gridData = mockGridData) {
  // Input validation
  if (!gridData) return;
  
  const kpiContainer = document.querySelector('#grid-kpis');
  if (!kpiContainer) {
    console.warn('Grid KPI container not found');
    return;
  }

  // Render KPI cards
  const demandMW = gridData.totalDemandMW || 4300;
  const supplyMW = gridData.totalSupplyMW || 4450;
  const renewablePercent = gridData.renewablePercentage || 78;
  const priceEUR = gridData.marketPriceEUR || 82.50;

  kpiContainer.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total Demand</div>
      <div class="kpi-value">${demandMW.toLocaleString()} MW</div>
      <div class="kpi-sub">Current load</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Supply</div>
      <div class="kpi-value">${supplyMW.toLocaleString()} MW</div>
      <div class="kpi-sub">Available capacity</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Renewable %</div>
      <div class="kpi-value">${renewablePercent}%</div>
      <div class="kpi-sub">Wind + Solar</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Market Price</div>
      <div class="kpi-value">€${priceEUR.toFixed(2)}</div>
      <div class="kpi-sub">EUR/MWh</div>
    </div>
  `;

  // Render demand-supply chart
  if (window.Chart && gridData.hourly) {
    renderDemandSupplyChart(gridData.hourly);
  }

  console.info('✓ Grid overview rendered successfully');
}

function renderDemandSupplyChart(hourlyData) {
  const chartContainer = document.getElementById('chart-demand-supply');
  if (!chartContainer) return;

  // Destroy existing chart if it exists
  const canvasId = 'chart-demand-supply';
  if (window.chartInstances && window.chartInstances[canvasId]) {
    window.chartInstances[canvasId].destroy();
  }

  if (!window.chartInstances) window.chartInstances = {};

  const ctx = chartContainer.getContext('2d');
  if (!ctx) return;

  window.chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hourlyData.timestamps || [],
      datasets: [
        {
          label: 'Demand (MW)',
          data: hourlyData.demand || [],
          borderColor: '#ff5555',
          backgroundColor: 'rgba(255,85,85,0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Supply (MW)',
          data: hourlyData.supply || [],
          borderColor: '#55dd55',
          backgroundColor: 'rgba(85,221,85,0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Hourly Demand vs Supply (24h)'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'MW'
          }
        }
      }
    }
  });

  console.info('✓ Demand-supply chart initialized');
}
