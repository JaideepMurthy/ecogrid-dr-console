import { loadGridResponse, saveGridResponse } from './db.js';

const GRID_TTL_MS = 30 * 60 * 1000;
const SAMPLE_ENDPOINT = 'https://api.open-meteo.com/v1/forecast?latitude=38.72&longitude=-9.14&hourly=temperature_2m&timezone=auto';

export async function fetchSampleGridData() {
  const cacheKey = 'sample-pt-grid';
  const cached = await loadGridResponse(cacheKey);
  if (cached && Date.now() - cached.timestamp < GRID_TTL_MS) return cached.data;
  try {
    const res = await fetch(SAMPLE_ENDPOINT);
    if (!res.ok) throw new Error('Bad response');
    const json = await res.json();
    const data = { source: 'demo', fetchedAt: new Date().toISOString(), raw: json };
    saveGridResponse(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Sample endpoint failed, using fallback', err);
    const fallback = { source: 'fallback', fetchedAt: new Date().toISOString(), raw: { hourly: { time: [], temperature_2m: [] } } };
    return fallback;
  }
}

export async function getDailyBalance(dateStr) { console.debug('getDailyBalance called for', dateStr); return null; }
export async function getProductionBreakdown(dateStr) { console.debug('getProductionBreakdown called for', dateStr); return null; }
export async function getMarketPrices(dateStr) { console.debug('getMarketPrices called for', dateStr); return null; }
export async function getDemandForecast(dateStr) { console.debug('getDemandForecast called for', dateStr); return null; }
