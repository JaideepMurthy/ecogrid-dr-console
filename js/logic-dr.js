// Phase 4: Enhanced DR event simulation with realistic constraints
// Implements ramping, equipment limits, and rebound effects

const DR_CONFIG = {
  TOTAL_FLEX_CAPACITY_MW: 500,
  SEGMENTS: {
    industrial: { capacity: 400, share: 0.4, rate: { min: 5, max: 30 }, participation: 0.85 },
    ev: { capacity: 375, share: 0.35, rate: { min: 2, max: 10 }, participation: 0.8 },
    commercial: { capacity: 267, share: 0.25, rate: { min: 10, max: 45 }, participation: 0.75 }
  },
  REBOUND_SPIKE: 1.35,
  REBOUND_DURATION_MINUTES: 30,
  EMISSION_FACTOR_TCO2_PER_MWH: 0.45,
  COST_PER_MWH_AVOIDED: 40
};

// Validate DR target against available capacity
export function validateDrTarget(targetMw) {
  const availableMw = DR_CONFIG.TOTAL_FLEX_CAPACITY_MW;
  const errors = [];
  
  if (targetMw > availableMw) {
    errors.push(`Target ${targetMw} MW exceeds available capacity ${availableMw} MW`);
  }
  if (targetMw <= 0) {
    errors.push(`Target must be > 0 MW`);
  }
  if (targetMw < 10) {
    errors.push(`Target must be >= 10 MW for meaningful impact`);
  }
  
  return { valid: errors.length === 0, errors };
}

// Simulate realistic DR event with ramping and rebound
export function simulateDrEvent(targetMw, eventWindow, rampMinutes = 10) {
  // Validate input
  const validation = validateDrTarget(targetMw);
  if (!validation.valid) {
    return { error: validation.errors.join('; '), valid: false };
  }
  
  if (!eventWindow || !eventWindow.durationHours) {
    return { error: 'Invalid event window', valid: false };
  }
  
  const durationHours = eventWindow.durationHours;
  const durationMinutes = durationHours * 60;
  
  // Determine maximum ramp rate across all segments
  let maxSegmentRamp = 5; // minimum is 5 min (EV chargers)
  Object.values(DR_CONFIG.SEGMENTS).forEach(seg => {
    maxSegmentRamp = Math.max(maxSegmentRamp, seg.rate.max);
  });
  
  // Calculate ramping factor: how much reduction can be achieved in available time
  const rampingFactor = Math.min(1, durationMinutes / rampMinutes);
  
  // Apply participation rates and ramping constraint
  let totalAchievable = 0;
  const segmentResults = {};
  Object.entries(DR_CONFIG.SEGMENTS).forEach(([name, seg]) => {
    const segmentTarget = targetMw * seg.share;
    const participationMw = segmentTarget * seg.participation;
    const rampedMw = participationMw * rampingFactor * 0.9; // 90% efficiency
    totalAchievable += rampedMw;
    
    segmentResults[name] = {
      targetMw: Math.round(segmentTarget),
      achievedMw: Math.round(rampedMw),
      participationRate: (seg.participation * 100).toFixed(0) + '%',
      rampMinutesNeeded: seg.rate.min,
      canAchieveInTime: durationMinutes >= seg.rate.max ? 'Yes' : `No (needs ${seg.rate.max} min)`
    };
  });
  
  const achievedMw = Math.round(totalAchievable);
  const costSavedEur = Math.round(achievedMw * durationHours * DR_CONFIG.COST_PER_MWH_AVOIDED);
  const co2AvoidedTons = (achievedMw * durationHours * DR_CONFIG.EMISSION_FACTOR_TCO2_PER_MWH).toFixed(1);
  
  // Calculate rebound effect
  const reboundMw = achievedMw * (DR_CONFIG.REBOUND_SPIKE - 1);
  const reboundEnergyMwh = (reboundMw * DR_CONFIG.REBOUND_DURATION_MINUTES / 60).toFixed(1);
  
  const warnings = [];
  if (rampingFactor < 0.95) {
    warnings.push(`⚠️ Ramping constraint: Can only achieve ${(rampingFactor * 100).toFixed(0)}% of target in ${durationHours} hours`);
  }
  if (achievedMw < targetMw * 0.8) {
    warnings.push(`⚠️ Low achievement rate: Only ${((achievedMw / targetMw) * 100).toFixed(0)}% of target MW`);
  }
  
  return {
    valid: true,
    targetMw,
    achievedMw,
    rampingFactor: rampingFactor.toFixed(2),
    costSavedEur,
    co2AvoidedTons,
    reboundMwPeak: Math.round(reboundMw),
    reboundEnergyMwh,
    reboundDurationMinutes: DR_CONFIG.REBOUND_DURATION_MINUTES,
    segmentResults,
    warnings
  };
}

// Calculate post-event rebound consumption profile
export function calculateReboundProfile(achievedMw, baselineConsumption = 4000) {
  const reboundPeak = achievedMw * DR_CONFIG.REBOUND_SPIKE;
  const profile = [];
  
  // 30-minute rebound window
  for (let minute = 0; minute <= DR_CONFIG.REBOUND_DURATION_MINUTES; minute += 5) {
    const progress = minute / DR_CONFIG.REBOUND_DURATION_MINUTES;
    // Exponential decay from peak
    const consumption = baselineConsumption + (reboundPeak - baselineConsumption) * Math.exp(-2 * progress);
    profile.push({
      minute,
      consumptionMw: Math.round(consumption),
      recoveryPercent: Math.round(((consumption - baselineConsumption) / reboundPeak) * 100)
    });
  }
  
  return profile;
}
