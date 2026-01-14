import { createDrEvent, listDrEvents, createAuditLog, saveAuditLog } from './db.js';
import { simulateDREvent, calculateReboundProfile, validateDRTarget } from './logic-dr.js';
import { renderHistoryView } from './ui-history.js';

export function initDrConsole() {
  const form = document.querySelector('#dr-form');
  const resultContainer = document.querySelector('#dr-result');
  
  if (!form || !resultContainer) {
    console.warn('DR form or result container not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Extract form inputs
    const targetMW = Number(document.querySelector('#dr-target-mw').value || 0);
    const startTime = document.querySelector('#dr-start-time').value;
    const durationHours = Number(document.querySelector('#dr-duration-hours').value || 0);
    const rampMinutes = Number(document.querySelector('#dr-ramp-min').value || 10);
    const operatorName = document.querySelector('#operator-name').value || 'Anonymous';
    
    // Validate inputs
    if (!targetMW || !startTime || !durationHours) {
      alert('Please fill all DR event fields.');
      return;
    }
    
    if (!validateDRTarget(targetMW)) {
      alert('Invalid DR target. Must be 100-2000 MW.');
      return;
    }
    
    try {
      // Create DR event object
      const drEvent = {
        targetMW,
        startTime,
        durationHours,
        rampMinutes,
        operatorName,
        timestamp: new Date().toISOString(),
        status: 'Created'
      };
      
      console.log('APP: DR Event created:', drEvent);
      
      // Simulate DR impact
      const simulation = simulateDREvent(drEvent);
      
      console.log('APP: DR Simulation result:', simulation);
      
      // Calculate rebound profile
      const reboundProfile = calculateReboundProfile(simulation.energySaved);
      
      console.log('APP: Rebound profile calculated:', reboundProfile);
      
      // Store in database
      const storedEvent = createDrEvent(drEvent);
      
      // Create and save audit log
      const auditEntry = createAuditLog({
        action: 'DR_EVENT_CREATED',
        targetMW,
        durationHours,
        operatorName,
        timestamp: new Date().toISOString()
      });
      
      saveAuditLog(auditEntry);
      
      // Render results
      renderDRResults(drEvent, simulation, reboundProfile, resultContainer);
      
      console.info('✓ DR event simulation complete. Results displayed.');
      
    } catch (error) {
      console.error('Error processing DR event:', error);
      resultContainer.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
    }
  });
  
  console.info('✓ DR Console event handlers initialized');
}

function renderDRResults(drEvent, simulation, reboundProfile, container) {
  const html = `
    <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 10px;">
      <h4>DR Event Results</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <strong>Target MW:</strong> ${drEvent.targetMW} MW
        </div>
        <div>
          <strong>Duration:</strong> ${drEvent.durationHours} hours
        </div>
        <div>
          <strong>Ramp Time:</strong> ${drEvent.rampMinutes} minutes
        </div>
        <div>
          <strong>Status:</strong> ${drEvent.status}
        </div>
        <div>
          <strong>Energy Saved:</strong> ${simulation.energySaved.toFixed(2)} MWh
        </div>
        <div>
          <strong>Peak Reduction:</strong> ${(simulation.peakReduction * 100).toFixed(1)}%
        </div>
        <div>
          <strong>Rebound Energy:</strong> ${reboundProfile.totalReboundEnergy.toFixed(2)} MWh
        </div>
        <div>
          <strong>Compliance Check:</strong> ${simulation.compliance ? '✓ Pass' : '✗ Fail'}
        </div>
      </div>
      <div style="margin-top: 10px; padding: 10px; background: white; border-left: 3px solid #4CAF50;">
        <strong>Operator:</strong> ${drEvent.operatorName}<br>
        <strong>Timestamp:</strong> ${new Date(drEvent.timestamp).toLocaleString()}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  console.log('DR results rendered to UI');
}
