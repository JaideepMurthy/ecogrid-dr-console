import { loadGridResponse, saveGridResponse } from './db.js';

// REN Data Hub API configuration
const REN_API_BASE = 'https://datahub.ren.pt/api/v1';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'; // Fallback CORS proxy
const GRID_TTL_MS = 30 * 60 * 1000; // 30-minute cache for REN data
const SYNTHETIC_TTL_MS = 5 * 60 * 1000; // 5-minute cache for synthetic fallback

let currentDataSource = 'unknown'; // Track data source for badge

// Attempt to fetch REAL data from REN Data Hub with intelligent fallback
async function fetchRealRENData() {
  const cacheKey = 'ren_grid_data';
  const cached = await loadGridResponse(cacheKey);
  
  // Check cache freshness
  if (cached && (Date.now() - cached.timestamp < GRID_TTL_MS)) {
    console.log('[API] ✓ Using cached REN data from', new Date(cached.timestamp).toLocaleString());
    currentDataSource = cached.source || 'REN Data Hub (cached)';
    updateDataSourceBadge(true);
    return cached.data;
  }
  
  // Try direct REN API first
  let realData = await tryDirectRENAPI();
  
  // If direct API fails, try with CORS proxy
  if (!realData) {
    realData = await tryRENAPIWithProxy();
  }
  
  // If both fail, fall back to synthetic data
  if (!realData) {
    console.warn('[API] ⚠ REN API unavailable, falling back to synthetic data');
    currentDataSource = 'Synthetic Demo Data';
    updateDataSourceBadge(false);
    return generatePTGridData();
  }
  
  // Cache the real data
  await saveGridResponse(cacheKey, { ...realData, source: 'REN Data Hub (live)' });
  currentDataSource = 'REN Data Hub (live)';
  updateDataSourceBadge(true);
  
  return realData;
}

// Try direct REN API without CORS proxy
async function tryDirectRENAPI() {
  try {
    console.log('[API] Attempting direct REN Data Hub API...');
    
    // Fetch all three endpoints in parallel with timeout
    const [consumptionRes, productionRes, pricesRes] = await Promise.race([
      Promise.all([
        fetch(`${REN_API_BASE}/electricity-consumption-supply-daily`),
        fetch(`${REN_API_BASE}/electricity-production-breakdown-daily`),
        fetch(`${REN_API_BASE}/electricity-market-prices-daily`)
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 8000))
    ]);
    
    // Handle HTTP errors
    if (!consumptionRes.ok || !productionRes.ok || !pricesRes.ok) {
      console.warn('[API] ⚠ REN API returned non-200 status');
      return null;
    }
    
    const consumption = await consumptionRes.json();
    const production = await productionRes.json();
    const prices = await pricesRes.json();
    
    console.log('[API] ✓ Successfully fetched real REN data');
    
    // Transform REN format to our grid format
    return transformRENToGridData(consumption, production, prices);
  } catch (error) {
    console.warn('[API] Direct REN API failed:', error.message);
    return null;
  }
}

// Try REN API with CORS proxy (for local development)
async function tryRENAPIWithProxy() {
  try {
    console.log('[API] Attempting REN API with CORS proxy...');
    
    const [consumptionRes, productionRes, pricesRes] = await Promise.race([
      Promise.all([
        fetch(`${CORS_PROXY}${REN_API_BASE}/electricity-consumption-supply-daily`),
        fetch(`${CORS_PROXY}${REN_API_BASE}/electricity-production-breakdown-daily`),
        fetch(`${CORS_PROXY}${REN_API_BASE}/electricity-market-prices-daily`)
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy timeout')), 8000))
    ]);
    
    if (!consumptionRes.ok || !productionRes.ok || !pricesRes.ok) {
      console.warn('[API] ⚠ CORS proxy returned non-200 status');
      return null;
    }
    
    const consumption = await consumptionRes.json();
    const production = await productionRes.json();
    const prices = await pricesRes.json();
    
    console.log('[API] ✓ Successfully fetched REN data via CORS proxy');
    
    return transformRENToGridData(consumption, production, prices);
  } catch (error) {
    console.warn('[API] CORS proxy failed:', error.message);
    return null;
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
      badge.textContent = '🟢 Live: REN Data Hub API';
      badge.style.background = '#2ecc71';
    } else {
      badge.textContent = '🟡 Demo: Synthetic Data';
      badge.style.background = '#f39c12';
    }
  }
}

// Export current data source for display
export function getDataSource() {
  return currentDataSource;
}

// Main export: Use real API with fallback
export async function fetchGridData() {
  return await fetchRealRENData();
}

// Backwards compatibility exports (kept for legacy code)
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


// Real-time monitoring: 15-minute polling interval
let pollingInterval = null;
let lastUpdateTime = null;
const POLLING_INTERVAL_MS = 15 * 60 * 1000;

export function startRealtimePolling(onDataUpdate) {
   if (pollingInterval) return;
   console.log('🔄 Starting real-time monitoring');
   pollingInterval = setInterval(async () => { await fetchGridData(); lastUpdateTime = new Date(); if (onDataUpdate) onDataUpdate(); }, POLLING_INTERVAL_MS);
  }

export function stopRealtimePolling() { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; } }

export function getLastUpdateTime() { return lastUpdateTime; }
