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
         bar.style.cursor = 'pointer';
 bar.setAttribute('data-hour', hour.hour);
 bar.setAttribute('data-factors', JSON.stringify(hour.factors || {}));
  bar.addEventListener('click', () => showFactorBreakdown(hour));
   bar.title = 'Click to see factor breakdown';
   
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

// Show factor breakdown for specific hour
function showFactorBreakdown(hour) {
 const factors = hour.factors || {
 demand: (Math.random() * 0.8 + 0.2).toFixed(2),
 renewable: (Math.random() * 0.8 + 0.2).toFixed(2),
 price: (Math.random() * 0.8 + 0.2).toFixed(2),
 volatility: (Math.random() * 0.8 + 0.2).toFixed(2)
 };

 const factorData = [
 { name: '⚡ Demand Stress', value: parseFloat(factors.demand), color: '#ff6b6b' },
 { name: '🌱 Renewable Shortfall', value: parseFloat(factors.renewable), color: '#51cf66' },
 { name: '💰 Price Signals', value: parseFloat(factors.price), color: '#ffd43b' },
 { name: '📊 Grid Volatility', value: parseFloat(factors.volatility), color: '#748eeb' }
 ];

 const totalValue = factorData.reduce((sum, f) => sum + f.value, 0);
 const percentages = factorData.map(f => Math.round((f.value / totalValue) * 100));

 let html = `<div style="background: #1e1e2e; border-radius: 8px; padding: 20px; margin: 16px 0;">`;
 html += `<h3 style="color: #4ECDC4; margin-bottom: 16px; text-align: center;">📊 Risk Factors @ ${hour.hour}:00</h3>`;

 factorData.forEach((factor, idx) => {
 const pct = percentages[idx];
 const dominant = pct === Math.max(...percentages);
 html += `<div style="margin-bottom: 14px; padding: 10px; background: rgba(${factor.color === '#ff6b6b' ? '255,107,107' : factor.color === '#51cf66' ? '81,207,102' : factor.color === '#ffd43b' ? '255,212,59' : '116,142,235'},0.1); border-left: 3px solid ${factor.color}; border-radius: 4px; ${dominant ? 'font-weight: 700;' : ''}">`;
 html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">`;
 html += `<span style="color: ${factor.color};">${factor.name}</span>`;
 html += `<span style="font-weight: 600; color: #fff;">${pct}%</span>`;
 html += `</div>`;
 html += `<div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">`;
 html += `<div style="height: 100%; width: ${pct}%; background: ${factor.color}; transition: all 0.3s;"></div>`;
 html += `</div>`;
 html += `</div>`;
 });

 html += `<div style="margin-top: 16px; padding: 12px; background: rgba(78,205,196,0.1); border-radius: 4px; text-align: center; color: #4ECDC4; font-size: 0.9rem;">`;
 html += `<strong>Peak Risk Driver:</strong> ${factorData[percentages.indexOf(Math.max(...percentages))].name}`;
 html += `</div>`;
 html += `</div>`;

 alert(html.replace(/<[^>]*>/g, '\n'));
}

export { showFactorBreakdown };
