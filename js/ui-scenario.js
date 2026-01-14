// Scenario Comparison - Side-by-side DR event comparison

export function initScenarioComparison() {
  const scenarios = {};
  
  window.storeScenario = (name, params, result) => {
    scenarios[name] = { params, result, timestamp: new Date().toISOString() };
    console.log(`Scenario '${name}' stored`);
  };
  
  window.compareScenarios = (scenario1, scenario2) => {
    const s1 = scenarios[scenario1];
    const s2 = scenarios[scenario2];
    if (!s1 || !s2) { alert('Both scenarios must exist'); return; }
    
    const comp = {
      targetDelta: s2.result.targetMw - s1.result.targetMw,
      costDelta: s2.result.costSavedEur - s1.result.costSavedEur,
      co2Delta: s2.result.co2AvoidedTons - s1.result.co2AvoidedTons
    };
    
    let html = '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 16px;">';
    html += `<h3>Scenario Comparison: ${scenario1} vs ${scenario2}</h3>`;
    html += '<table style="width:100%; border-collapse: collapse;">';
    html += `<tr><td><strong>Target MW</strong></td><td>${s1.result.targetMw}</td><td>${s2.result.targetMw}</td><td>${comp.targetDelta > 0 ? '+' : ''}${comp.targetDelta}</td></tr>`;
    html += `<tr><td><strong>Cost Savings</strong></td><td>€${s1.result.costSavedEur.toLocaleString()}</td><td>€${s2.result.costSavedEur.toLocaleString()}</td><td style="color: ${comp.costDelta >= 0 ? 'green' : 'red'}">€${comp.costDelta > 0 ? '+' : ''}${comp.costDelta.toLocaleString()}</td></tr>`;
    html += `<tr><td><strong>CO2 Avoided</strong></td><td>${s1.result.co2AvoidedTons}t</td><td>${s2.result.co2AvoidedTons}t</td><td>${comp.co2Delta > 0 ? '+' : ''}${comp.co2Delta}t</td></tr>`;
    html += '</table>';
    html += '<p style="color: #7f8c8d; font-size: 0.9em; margin-top: 12px;">';
    if (comp.costDelta > 500) html += `${scenario2} is more cost-effective. Recommended.`;
    else if (comp.costDelta < -500) html += `${scenario1} is more cost-effective. Maintain strategy.`;
    else html += 'Both scenarios are comparable. Choose based on operational constraints.';
    html += '</p></div>';
    
    const resultContainer = document.querySelector('#dr-result');
    if (resultContainer) resultContainer.innerHTML += html;
  };
}
