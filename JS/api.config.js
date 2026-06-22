/* ============================================================
   FIFA World Cup 2026 — API Config
   config/api.config.js
   ============================================================ */

const API_CONFIG = {
  // Primary: api-football.com (RapidAPI)
  BASE_URL:   'https://v3.football.api-sports.io',
  RAPID_URL:  'https://api-football-v1.p.rapidapi.com/v3',

  // Replace with your actual key (use .env in production)
  API_KEY:    window.__WC_API_KEY__ || 'YOUR_API_KEY_HERE',

  // FIFA World Cup 2026 identifiers (update when confirmed by provider)
  LEAGUE_ID:  1,
  SEASON:     2026,

  // Polling intervals (ms)
  POLL: {
    LIVE:      30_000,   // 30s  — live match scores & events
    STANDINGS: 300_000,  // 5min — group standings
    SCORERS:   300_000,  // 5min — top scorers
    SCHEDULE:  1_800_000 // 30min — full fixture list
  },

  // Cache TTL (ms) — sessionStorage entries expire after:
  CACHE_TTL: {
    LIVE:      25_000,
    STANDINGS: 280_000,
    SCORERS:   280_000,
    SCHEDULE:  1_750_000,
    TEAM:      3_600_000  // 1hr
  },

  // Max retry attempts on failed requests
  MAX_RETRIES:     3,
  RETRY_DELAY_MS:  1_500,

  // API rate limit guard — max requests per minute
  RATE_LIMIT:      10,

  // Use local fallback JSON instead of live API
  USE_MOCK: true   // ← set false when you have a real key
};

export default API_CONFIG;