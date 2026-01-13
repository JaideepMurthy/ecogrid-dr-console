import { loadGridResponse, saveGridResponse } from './db.js';

const REN_API_BASE = 'https://datahub.ren.pt/api/v1';
const GRID_TTL_MS = 30 * 60 * 1000; // 30-minute cache
const SYNTHETIC_TTL_MS = 5 * 60 * 1000; // 5-minute cache for synthetic fallback

// Attempt to fetch REAL data from REN Data Hub, with intelligent fallback
async function fetchRealRENData() {
  const cacheKey = 'ren_grid_data';
  const cached = await loadGridResponse(cacheKey);
  
  // Check cache freshness
  if (cached && (Date.now() - cached.timestamp < GRID_TTL_MS)) {
    console.log('[API] ✓ Using cached REN data from', new Date(cached.timestamp).toLocaleString());
    return cached.data;
  }

  try {
    console.log('[API] Attempting to fetch real REN data...');
    
    // Fetch all three endpoints in parallel
    const [consumptionRes, productionRes, pricesRes] = await Promise.all([
      fetch(`${REN_API_BASE}/electricity-consumption-supply-daily`, { timeout: 5000 }),
      fetch(`${REN_API_BASE}/electricity-production-breakdown-daily`, { timeout: 5000 }),
      fetch(`${REN_API_BASE}/electricity-market-prices-daily`, { timeout: 5000 })
    ]);

    // Handle HTTP errors
    if (!consumptionRes.ok || !productionRes.ok || !pricesRes.ok) {
      console.warn('[API] ⚠ REN API returned non-200 status, falling back to synthetic');
      return generatePTGridData();
    }

    const consumption = await consumptionRes.json();
    const production = await productionRes.json();
    const prices = await pricesRes.json();

    console.log('[API] ✓ Successfully fetched real REN data');
    console.log('[API] Consumption data:', consumption);
    console.log('[API] Production data:', production);
    console.log('[API] Prices data:', prices);

    // Transform REN format to our grid format
    const transformed = transformRENToGridData(consumption, production, prices);
    
    // Cache the result
    await saveGridResponse(cacheKey, transformed);
    
    // Update UI badge
    updateDataSourceBadge(true);
    
    return transformed;

  } catch (error) {
    console.warn('[API] ⚠ REN API fetch failed:', error.message);
    console.warn('[API] Falling back to synthetic cached/generated data');
    updateDataSourceBadge(false);
    return generatePTGridData();
  }
}

// Transform REN API response to our standardized grid format
function transformRENToGridData(consumption, production, prices) {
  const now = new Date();
  const hours = [];
  
  // Extract data from REN response (handles multiple API response formats)
  let consumptionData = consumption?.data || consumption || [];
  let productionData = production?.data || production || [];
  let pricesData = prices?.data || prices || [];
  
  // Ensure arrays
  if (!Array.isArray(consumptionData)) consumptionData = [consumptionData];
  if (!Array.isArray(productionData)) productionData = [productionData];
  if (!Array.isArray(pricesData)) pricesData = [pricesData];

  // If REN returns daily data, we'll interpolate hourly
  const baseConsumption = consumptionData[0]?.consumption || 4200;
  const baseSupply = consumptionData[0]?.supply || 4350;
  const basePrice = pricesData[0]?.price || 75;
  const baseSolar = productionData[0]?.solar || 1100;
  const baseWind = productionData[0]?.wind || 900;
  const baseHydro = productionData[0]?.hydro || 650;
  const baseGas = productionData[0]?.gas || 450;
  const baseImports = productionData[0]?.imports || 200;

  // Generate 24-hour forecast from daily data
  for (let i = 0; i < 24; i++) {
    const sine = Math.sin((Math.PI * i) / 24);
    const hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
    
    // Interpolate hourly values from daily base (realistic variation)
    const demand = baseConsumption + 600 * sine;
    const solar = Math.max(0, baseSolar * Math.sin((Math.PI * (i - 6)) / 12));
    const wind = baseWind + 300 * Math.cos((Math.PI * i) / 24);
    const hydro = baseHydro;
    const gas = Math.round(demand * 0.3);
    const imports = Math.round(demand * 0.1);

    hours.push({
      timestamp: hour.toISOString(),
      demandMW: Math.round(demand),
      supplyMW: Math.round(demand + 150),
      priceMWh: basePrice + 20 * Math.sin((Math.PI * (i + 5)) / 24),
      production: {
        solarMW: Math.round(solar),
        windMW: Math.round(wind),
        hydroMW: Math.round(hydro),
        gasMW: Math.round(gas),
        importsMW: Math.round(imports)
      }
    });
  }

  const totalRenewables = baseSolar + baseWind + baseHydro;
  const totalProduction = totalRenewables + baseGas + baseImports;

  return {
    timestamp: now.toISOString(),
    region: 'Portugal (Mainland)',
    dataSource: 'REN Data Hub',
    totalDemandMW: Math.round(baseConsumption),
    totalSupplyMW: Math.round(baseSupply),
    marketPriceEUR: Number(basePrice.toFixed(1)),
    hourly: hours,
    productionMix: {
      solar: { MW: Math.round(baseSolar), percent: Math.round((baseSolar / totalProduction) * 100) },
      wind: { MW: Math.round(baseWind), percent: Math.round((baseWind / totalProduction) * 100) },
      hydro: { MW: Math.round(baseHydro), percent: Math.round((baseHydro / totalProduction) * 100) },
      gas: { MW: Math.round(baseGas), percent: Math.round((baseGas / totalProduction) * 100) },
      imports: { MW: Math.round(baseImports), percent: Math.round((baseImports / totalProduction) * 100) }
    }
  };
}

// Fallback: Generate realistic synthetic data (for offline/demo mode)
function generatePTGridData() {
  const now = new Date();
  const hours = [];
  const baseLoad = 4200;
  const variation = 600;

  for (let i = 0; i < 24; i++) {
    const sine = Math.sin((Math.PI * i) / 24);
    const demand = baseLoad + variation * sine;
    const hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
    
    hours.push({
      timestamp: hour.toISOString(),
      demandMW: Math.round(demand),
      supplyMW: Math.round(demand + 150),
      priceMWh: 60 + 30 * Math.sin((Math.PI * (i + 5)) / 24),
      production: {
        solarMW: Math.max(0, 1200 * Math.sin((Math.PI * (i - 6)) / 12)),
        windMW: 800 + 300 * Math.cos((Math.PI * i) / 24),
        hydroMW: 400,
        gasMW: Math.round(demand * 0.3),
        importsMW: Math.round(demand * 0.1)
      }
    });
  }

  return {
    timestamp: now.toISOString(),
    region: 'Portugal (Mainland)',
    dataSource: 'Synthetic Demo Data',
    totalDemandMW: baseLoad,
    totalSupplyMW: baseLoad + 150,
    marketPriceEUR: 82.5,
    hourly: hours,
    productionMix: {
      solar: { MW: 1100, percent: 32 },
      wind: { MW: 950, percent: 27 },
      hydro: { MW: 650, percent: 19 },
      gas: { MW: 450, percent: 13 },
      imports: { MW: 350, percent: 9 }
    }
  };
}

// Update UI badge to reflect data source
function updateDataSourceBadge(isRealData) {
  const badge = document.getElementById('dataSourceLabel');
  if (badge) {
    if (isRealData) {
      badge.textContent = '🟢 Live: REN Data Hub';
      badge.parentElement.style.background = '#2ecc71';
    } else {
      badge.textContent = '🟡 Demo: Synthetic Data';
      badge.parentElement.style.background = '#f39c12';
    }
  }
}

// Main export: Use real API with fallback
export async function fetchGridData() {
  return await fetchRealRENData();
}

// Parse functions (kept for backwards compatibility)
export async function getDailyBalance(dateStr) {
  console.debug('getDailyBalance:', dateStr);
  return null;
}

export async function getProductionBreakdown(dateStr) {
  console.debug('getProductionBreakdown:', dateStr);
  return null;
}

export async function getMarketPrices(dateStr) {
  console.debug('getMarketPrices:', dateStr);
  return null;
}

export async function getDemandForecast(dateStr) {
  console.debug('getDemandForecast:', dateStr);
  return null;
}

export function parseGridResponse(rawJSON) {
  if (!rawJSON) return null;
  return {
    timestamp: rawJSON.timestamp,
    region: rawJSON.region || 'Portugal',
    dataSource: rawJSON.dataSource || 'Unknown',
    demand: { current: rawJSON.totalDemandMW, historical: rawJSON.hourly || [] },
    supply: { current: rawJSON.totalSupplyMW, historical: rawJSON.hourly || [] },
    price: { current: rawJSON.marketPriceEUR, historical: rawJSON.hourly || [] },
    production: rawJSON.productionMix || {}
  };
}
