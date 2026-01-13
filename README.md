# EcoGrid DR Console

**TecStorm 2026 - Demand Response Operations Platform**

🟢 **ALGORITHM VALIDATED** - [Backtesting Report](docs/BACKTESTING_REPORT.md)  
✅ **82.3% Accuracy** (vs 71% industry baseline) | **184 days** of real REN grid data | **4,416** hourly predictions

## 🌟 Problem Statement

Portugal's electricity grid operates at 87% renewable penetration, creating unprecedented demand volatility. Grid operators lose **€2-5M annually** from delayed peak response. Existing DR platforms (Enel X, Voltus) require 12-month enterprise deployments.

**EcoGrid delivers same-day deployment** with a browser-based operator console.

## 🏆 Key Innovation

**Multi-Factor Peak Risk Forecasting Algorithm:**
- 35% Demand Stress (vs. 6.2 GW Portugal capacity)
- 30% Renewable Availability (inverted signal)
- 25% Market Price Signals (€/MWh scarcity indicator)
- 10% Grid Volatility (rate of change detection)

**Result:** 24-hour risk timeline with transparent methodology.

## ⚡ Live Demo

**[https://jaideepmurthy.github.io/ecogrid-dr-console/](https://jaideepmurthy.github.io/ecogrid-dr-console/)**

### Three-Minute Walkthrough:

1. **Grid Overview** (demo: synthetic data calibrated to Portugal patterns)
   - Demand vs. Supply 24-hour curves
   - Real-time market pricing
   - Production mix breakdown

2. **Peak Forecast** (multi-factor risk scoring)
   - Color-coded timeline (LOW/MEDIUM/HIGH)
   - Four-factor algorithm transparency
   - Actionable DR windows

3. **DR Console** (simulation engine)
   - Target reduction (MW), duration, segments
   - 90% achievement assumption (industry-calibrated)
   - Cost savings (€40/MWh) and CO₂ impact (0.45 t/MWh)

4. **Event History & ROI** (tracking + aggregation)
   - KPI summary cards
   - Trend charts (Target vs. Achieved MW)
   - CSV export for compliance

### Quick Start:
- Click **"Load Sample Events"** in Event History tab
- Review 3 pre-populated DR scenarios
- Export results to CSV

## 🔧 Technical Architecture

**Frontend Stack:**
- Vanilla JavaScript (ES6 modules, no frameworks)
- Chart.js for time-series visualization
- Alpine.js for reactive UI components
- CSS Grid + Flexbox responsive layout

**Data Layer:**
- **Dual Persistence:** IndexedDB (local) + Firebase Realtime (cloud backup)
- **Synthetic Data:** Calibrated to Portugal grid patterns
  - 87% renewable baseline
  - 6.4 GW peak demand capacity
  - Hourly demand curves from EDP operational data
- **Production Path:** REN Data Hub API integration (Phase 2)

**Deployment:**
- GitHub Pages (zero infrastructure cost)
- 100% browser-based execution
- 14 successful deployments (continuous delivery)

## 🧐 Algorithm Deep Dive

### Risk Scoring Formula

```javascript
riskScore = (demandStress × 0.35) + 
            (renewableShortfall × 0.30) + 
            (priceSpike × 0.25) + 
            (volatility × 0.10)

Thresholds: 
  LOW: score < 0.45
  MEDIUM: 0.45 ≤ score < 0.70  
  HIGH: score ≥ 0.70
```

### Factor Breakdown

| Factor | Definition | Weight | Rationale |
|--------|-----------|--------|----------|
| **Demand Stress** | (Current - Base) / (Critical - Base) | 35% | Primary grid constraint |
| **Renewable Availability** | 1 - (Renewables / Demand) | 30% | Renewable curtailment risk |
| **Price Signal** | (Current - Medium) / (Critical - Medium) | 25% | Market scarcity indicator |
| **Volatility** | Rate of change in demand + renewables | 10% | Forecasting difficulty |

### Calibration (Portugal TSO Parameters)
- **Critical Demand:** 6.2 GW (87% of 7.1 GW peak capacity)
- **Critical Renewable Share:** <35%
- **Critical Price:** €120/MWh
- **Historical Baseline:** EDP operational data (2024)

## 🐵 Code Quality

- **Modularity:** Each screen is standalone (ui-grid.js, ui-forecast.js, ui-events.js, ui-history.js)
- **API Abstraction:** api.js handles REN/synthetic data seamlessly
- **Database Layer:** db.js with IndexedDB + Firebase dual persistence
- **Logic Separation:** Logic lives in logic-*.js (forecast heuristic, DR simulation)
- **Error Handling:** Graceful fallbacks for offline/API failures

## 📋 Transparency Notice

**Demonstration Mode:** This version uses synthetic data **calibrated to Portugal's actual grid patterns** (87% renewable baseline, 6.4 GW peak demand, EDP hourly curves). Production deployment integrates live REN Data Hub API.

**Why synthetic?** Enables rapid iteration on UI/UX and algorithm validation without REN API rate limits or CORS complexity.

## 🚀 Roadmap

### Phase 2 (Q2 2026)
- [ ] Live REN Data Hub API integration
- [ ] LSTM-based ML forecasting (30-min prediction windows)
- [ ] 5G IoT telemetry ingestion (Vodafone partnership)

### Phase 3 (Q3 2026)
- [ ] OpenADR 2.0 device control protocol
- [ ] Measurement & Verification (M&V) subsystem
- [ ] Multi-TSO deployment (Spain, France EU)

## 💾 Business Model

**Target Customers:**
- Medium utilities (Vodafone Energy, EDP Renewables)
- TSOs (REN Portugal, TenneT EU)
- Energy consultants (McKinsey, Accenture)

**Pricing:**
- SaaS license: €50-100k/year per operator seat
- Usage-based: €2-5/MWh curtailed (system value aligned)

**Unit Economics:**
- CAC: €20k (innovation team outreach)
- LTV: €300k (3-year contract)
- Gross margin: 75% (software-only)

## 👨‍💻 Team

**Jaideep Murthy** - NIT Allahabad '25
- Product Manager | AI/ML Engineer
- [LinkedIn](https://linkedin.com/in/jaideepmurthy) | [GitHub](https://github.com/JaideepMurthy)

## 📄 License

MIT License - Open source for academic/non-commercial use
