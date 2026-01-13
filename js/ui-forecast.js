import { computePeakRisk } from './logic-forecast.js';
import { fetchGridData } from './api.js';

export async function renderForecastView() {
  const timeline = document.querySelector('#forecast-timeline');
  const summary = document.querySelector('#forecast-summary');
  if (!timeline || !summary) return;

  try {
    const gridData = await fetchGridData();
     // Normalize grid data structure for forecast algorithm
 const normalizedData = normalizeGridData(gridData);
     const forecastResult = computePeakRisk(normalizedData);

    // Render risk bars
    timeline.innerHTML = '';
    forecastResult.hourly.forEach((hour) => {
      const bar = document.createElement('div');
      bar.className = `forecast-slot ${hour.level.toLowerCase()}`;
      
      const riskPercent = Math.round(hour.score * 100);
      bar.innerHTML = `
        <div style="font-size:0.65rem;font-weight:600;">${hour.hour}:00</div>
        <div style="height:24px;background:rgba(255,255,255,0.1);border-radius:3px;margin:2px 0;position:relative;">
          <div style="height:100%;width:${riskPercent}%;background:${hour.level === 'HIGH' ? '#ff5555' : hour.level === 'MEDIUM' ? '#ffb86c' : '#50fa7b'};border-radius:3px;transition:all 0.2s;"></div>
        </div>
        <div style="font-size:0.6rem;text-transform:uppercase;color:#999;">${hour.level}</div>
      `;
      timeline.appendChild(bar);
    });

    // Render summary
    summary.textContent = forecastResult.summary;
  } catch (err) {
    console.warn('Forecast render failed', err);
    summary.textContent = 'Unable to load forecast data.';
  }
}

export async function initForecastView() {
  renderForecastView();
  const btnPlan = document.querySelector('#btn-plan-dr');
  if (btnPlan) {
    btnPlan.addEventListener('click', () => {
      alert('Peak window identified. Use the DR Console to simulate event response.');

      // Helper function to normalize API data structure to match forecast algorithm expectations
function normalizeGridData(gridData) {
 if (!gridData || !gridData.hourly) return gridData;
 
 return {
 ...gridData,
 hourly: gridData.hourly.map((h, idx) => ({
 hour: idx,
 hourIndex: idx,
 timestamp: h.timestamp,
 demandMW: h.demandMW,
 supplyMW: h.supplyMW,
 priceMWh: h.priceMWh,
 solarMW: h.production?.solarMW || 0,
 windMW: h.production?.windMW || 0,
 hydroMW: h.production?.hydroMW || 0,
 gasMW: h.production?.gasMW || 0,
 importsMW: h.production?.importsMW || 0
 }))
 };
}
    });
  }
}
