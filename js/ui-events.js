import { createDrEvent, listDrEvents, createAuditLog, saveAuditLog } from './db.js';
import { renderHistoryView } from './ui-history.js'

export function initDrConsole() {
  const form = document.querySelector('#dr-form');
  const resultContainer = document.querySelector('#dr-result');
  if (!form || !resultContainer) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetMw = Number(document.querySelector('#dr-target-mw').value || 0);
    const startTime = document.querySelector('#dr-start-time').value;
    const fakeAchieved = targetMw * 0.9;  const rampMin = Number(document.querySelector('#dr-ramp-min')?.value || 10);
  const rampingFactor = Math.min(1, (durationH * 60) / rampMin);
  const fakeAchieved = targetMw * 0.9 * rampingFactor;const durationH = Number(document.querySelector('#dr-duration-hours').value || 0);
    if (!targetMw || !startTime || !durationH) { alert('Please fill all DR event fields.'); return; }
    const fakeAchieved = targetMw * 0.9;
    const fakeCost = fakeAchieved * durationH * 40;
    const fakeCo2 = fakeAchieved * durationH * 0.45;
 const operatorName = document.querySelector('#operator-name').value || 'Anonymous';
    const eventDoc = { createdAt: new Date().toISOString(), targetMw, achievedMw: fakeAchieved, durationHdurationH, costSavedEur  , costSavedEur: fakeCost, co2AvoidedTons: fakeCo2, startTime };
    const id = await createDrEvent(eventDoc);
     renderHistoryView(); // Update Event History tab after creating event
    resultContainer.innerHTML = `
      <div class="dr-summary-card">
        <h2 style="margin:0 0 0.4rem;font-size:1rem;">Simulated DR Event #${id}</h2>
        <p style="margin:0 0 0.2rem;font-size:0.85rem;">Target: <strong>${targetMw.toLocaleString()}</strong> MW; Achieved: <strong>${fakeAchieved.toFixed(1)}</strong> MW (${((fakeAchieved / targetMw) * 100).toFixed(0)}%).</p>
        <p style="margin:0 0 0.15rem;font-size:0.85rem;">System cost avoided: <strong>€${fakeCost.toFixed(0)}</strong>.</p>
        <p style="margin:0;font-size:0.85rem;">CO₂ avoided: <strong>${fakeCo2.toFixed(1)}</strong> tons.</p>
      </div>
    `;
    console.info('DR event stored', eventDoc);
  });
  listDrEvents().then((events) => console.debug('Existing DR events in DB:', events.length));
}
