import { createDrEvent, listDrEvents, createAuditLog, saveAuditLog } from './db.js';
import { simulateDrEvent, calculateReboundProfile, validateDrTarget } from './logic-dr.js';
import { renderHistoryView } from './ui-history.js';

export function initDrConsole() {
  const form = document.querySelector('#dr-form');
  const resultContainer = document.querySelector('#dr-result');
  if (!form || !resultContainer) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form inputs
    const targetMw = Number(document.querySelector('#dr-target-mw').value || 0);
    const startTime = document.querySelector('#dr-start-time').value;
    const durationHours = Number(document.querySelector('#dr-duration-hours').value || 0);
    const rampMinutes = Number(document.querySelector('#dr-ramp-min')?.value || 10);
    const operatorName = document.querySelector('#operator-name').value || 'Anonymous';
    
    // Validate inputs
    if (!targetMw || !startTime || !durationHours) {
      alert('Please fill all DR event fields.');
      return;
    }
    
    // Validate against capacity
    const validation = validateDrTarget(targetMw);
    if (!validation.valid) {
      resultContainer.innerHTML = `
        <div style="background: #fee; border: 1px solid #f00; padding: 16px; border-radius: 4px; color: #d00;">
          <h3 style="margin-top: 0;">❌ Invalid Target</h3>
          ${validation.errors.map(e => `<p style="margin: 4px 0;">• ${e}</p>`).join('')}
        </div>
      `;
      return;
    }
    
    // Simulate DR event with realistic constraints
    const eventWindow = { durationHours };
    const result = simulateDrEvent(targetMw, eventWindow, rampMinutes);
    
    if (!result.valid) {
      resultContainer.innerHTML = `
        <div style="background: #fee; border: 1px solid #f00; padding: 16px; border-radius: 4px; color: #d00;">
          <h3 style="margin-top: 0;">❌ Simulation Failed</h3>
          <p>${result.error}</p>
        </div>
      `;
      return;
    }
    
    // Calculate rebound effect
    const reboundProfile = calculateReboundProfile(result.achievedMw);
    
    // Build HTML result with warnings
    let html = `
      <div class="dr-summary-card" style="background: #f0f9ff; border-left: 4px solid #4ECDC4;">
        <h2 style="margin: 0 0 12px; font-size: 1.1rem; color: #2c5aa0;">DR Simulation Results</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div><strong>Target Reduction:</strong> ${result.targetMw} MW</div>
          <div><strong>Achievable:</strong> ${result.achievedMw} MW (${((result.achievedMw/result.targetMw)*100).toFixed(0)}%)</div>
          <div><strong>Ramping Factor:</strong> ${(result.rampingFactor * 100).toFixed(0)}% in ${durationHours}h</div>
          <div><strong>Duration:</strong> ${durationHours} hour(s)</div>
          <div style="grid-column: 1/3;"><strong>Cost Saved:</strong> €${result.costSavedEur.toLocaleString()} | <strong>CO₂ Avoided:</strong> ${result.co2AvoidedTons} tons</div>
        </div>
    `;
    
    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      html += `
        <div style="background: #ffeaa7; border: 1px solid #fdcb6e; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
          ${result.warnings.map(w => `<p style="margin: 4px 0; color: #d63031;">${w}</p>`).join('')}
        </div>
      `;
    }
    
    // Show segment breakdown
    html += `<h3 style="margin-top: 16px; font-size: 0.95rem;">📊 Segment Breakdown</h3><table style="width: 100%; font-size: 0.85rem; margin-bottom: 16px;">`;
    html += `<thead style="background: #ecf0f1;"><tr><th>Segment</th><th>Target MW</th><th>Achievable MW</th><th>Participation</th></tr></thead><tbody>`;
    Object.entries(result.segmentResults).forEach(([segment, data]) => {
      html += `<tr><td>${segment}</td><td>${data.targetMw}</td><td>${data.achievedMw}</td><td>${data.participationRate}</td></tr>`;
    });
    html += `</tbody></table>`;
    
    // Show rebound effect
    html += `<h3 style="font-size: 0.95rem;">⚡ Post-Event Rebound</h3>`;
    html += `<div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 16px;">`;
    html += `<p><strong>Peak rebound:</strong> ${result.reboundMwPeak} MW (+35% above baseline)</p>`;
    html += `<p><strong>Rebound duration:</strong> ${result.reboundDurationMinutes} minutes</p>`;
    html += `<p><strong>Rebound energy:</strong> ${result.reboundEnergyMwh} MWh over recovery period</p>`;
    html += `</div>`;
    
    html += `</div>`;
    resultContainer.innerHTML = html;
    
    // Save event to database
    const eventDoc = {
      createdAt: new Date().toISOString(),
      operatorName,
      targetMw: result.targetMw,
      achievedMw: result.achievedMw,
      durationHours,
      rampMinutes,
      costSavedEur: result.costSavedEur,
      co2AvoidedTons: result.co2AvoidedTons,
      startTime,
      reboundMwPeak: result.reboundMwPeak,
      reboundEnergyMwh: result.reboundEnergyMwh
    };
    
    const id = await createDrEvent(eventDoc);
    await renderHistoryView();
    
    console.info('DR event stored with realistic constraints', { id, ...eventDoc });
  });
  
  // Load initial events
  listDrEvents().then((events) => console.debug('Existing DR events in DB:', events.length));
}
