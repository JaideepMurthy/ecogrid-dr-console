export function renderForecastView() {
  const timeline = document.querySelector('#forecast-timeline');
  const summary = document.querySelector('#forecast-summary');
  if (!timeline || !summary) return;
  const now = new Date();
  const hours = Array.from({ length: 12 }, (_, i) => new Date(now.getTime() + i * 60 * 60 * 1000));
  const peakWindowStartIdx = 5;
  const peakWindowEndIdx = 7;
  timeline.innerHTML = '';
  hours.forEach((d, idx) => {
    let level = 'low';
    if (idx >= peakWindowStartIdx && idx <= peakWindowEndIdx) level = 'high';
    else if (idx >= 3 && idx <= 4) level = 'medium';
    const label = d.toTimeString().slice(0, 5);
    const div = document.createElement('div');
    div.className = `forecast-slot ${level}`;
    div.innerHTML = `<div>${label}</div><div style="margin-top:2px;text-transform:uppercase;font-size:0.65rem;">${level}</div>`;
    timeline.appendChild(div);
  });
  const start = hours[peakWindowStartIdx].toTimeString().slice(0, 5);
  const end = hours[peakWindowEndIdx].toTimeString().slice(0, 5);
  summary.textContent = `High peak risk expected between ${start}–${end} due to falling solar output and rising evening demand.`;
  const btnPlan = document.querySelector('#btn-plan-dr');
  if (btnPlan) btnPlan.addEventListener('click', () => alert('In final version, will pre-fill DR event for peak window.'));
}
