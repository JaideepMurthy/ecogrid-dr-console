import { loadGridResponse, saveGridResponse } from './db.js';
const GRID_TTL_MS = 30 * 60 * 1000;
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
export async function fetchGridData() {
  const cacheKey = 'pt-grid-data';
  const cached = await loadGridResponse(cacheKey);
  if (cached && Date.now() - cached.timestamp < GRID_TTL_MS) {
    console.info('[API] Cached grid data');
    return cached.data;
  }
  try {
    const data = generatePTGridData();
    saveGridResponse(cacheKey, data);
    console.info('[API] Fresh grid data for Portugal');
    return data;
  } catch (err) {
    console.warn('[API] Failed, fallback:', err);
    return generatePTGridData();
  }
}
export async function getDailyBalance(dateStr) { console.debug('getDailyBalance:', dateStr); return null; }
export async function getProductionBreakdown(dateStr) { console.debug('getProductionBreakdown:', dateStr); return null; }
export async function getMarketPrices(dateStr) { console.debug('getMarketPrices:', dateStr); return null; }
export async function getDemandForecast(dateStr) { console.debug('getDemandForecast:', dateStr); return null; }
export function parseGridResponse(rawJSON) {
  if (!rawJSON) return null;
  return {
    timestamp: rawJSON.timestamp,
    region: rawJSON.region || 'Portugal',
    demand: { current: rawJSON.totalDemandMW, historical: rawJSON.hourly || [] },
    supply: { current: rawJSON.totalSupplyMW, historical: rawJSON.hourly || [] },
    price: { current: rawJSON.marketPriceEUR, historical: rawJSON.hourly || [] },
    production: rawJSON.productionMix || {}
  };
}
