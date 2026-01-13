// Phase 3: Peak Risk Forecast Heuristic
// Simple rule-based scoring for peak stress prediction

const THRESHOLD_DEMAND_HIGH = 4100;
const THRESHOLD_PRICE_HIGH = 75;
const THRESHOLD_RENEWABLE_LOW = 0.5;

export function computePeakRisk(gridData) {
  if (!gridData || !gridData.hourly) return { hourly: [], summary: '' };
  
  const avgDemand = gridData.totalDemandMW || 4200;
  const avgPrice = gridData.marketPriceEUR || 70;
  
  const hourly = gridData.hourly.map((hour, idx) => {
    const demand = hour.demandMW || 0;
    const price = hour.priceMWh || 0;
    const prod = hour.production || {};
    
    // Calculate renewable share
    const renewables = (prod.solarMW || 0) + (prod.windMW || 0) + (prod.hydroMW || 0);
    const total = renewables + (prod.gasMW || 0) + (prod.importsMW || 0);
    const renewableShare = total > 0 ? renewables / total : 0;
    
    // Compute stress score (0-1)
    let score = 0.2; // baseline
    
    // Demand factor: high demand = higher risk
    if (demand > avgDemand) {
      score += 0.3 * (Math.min(demand, avgDemand * 1.1) - avgDemand) / (avgDemand * 0.1);
    }
    
    // Renewable factor: low renewable = higher risk
    if (renewableShare < THRESHOLD_RENEWABLE_LOW) {
      score += 0.3 * (THRESHOLD_RENEWABLE_LOW - renewableShare) / THRESHOLD_RENEWABLE_LOW;
    }
    
    // Price factor: high price = higher risk (system stress indicator)
    if (price > THRESHOLD_PRICE_HIGH) {
      score += 0.4 * (Math.min(price, 100) - THRESHOLD_PRICE_HIGH) / (100 - THRESHOLD_PRICE_HIGH);
    }
    
    score = Math.min(1.0, score);
    
    // Classify risk level
    let level = 'LOW';
    if (score > 0.65) level = 'HIGH';
    else if (score > 0.40) level = 'MEDIUM';
    
    return { hour: idx, score, level, demand, price, renewableShare };
  });
  
  // Find peak risk window
  const highRiskHours = hourly.filter(h => h.level === 'HIGH');
  let summary = 'Low peak risk expected.';
  if (highRiskHours.length > 0) {
    const start = highRiskHours[0].hour;
    const end = highRiskHours[highRiskHours.length - 1].hour;
    summary = `High peak risk expected between ${start}:00-${end + 1}:00 due to high demand, low renewables, and elevated pricing.`;
  } else if (hourly.some(h => h.level === 'MEDIUM')) {
    summary = 'Moderate peak risk in late afternoon/early evening. Monitor renewable availability and demand trends.';
  }
  
  return { hourly, summary };
}

export function computeStressScore(demand, renewableShare, price) {
  let score = 0.2;
  if (demand > 4100) score += 0.3;
  if (renewableShare < 0.5) score += 0.3;
  if (price > 75) score += 0.4;
  return Math.min(1.0, score);
}
