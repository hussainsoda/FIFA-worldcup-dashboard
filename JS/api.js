/* ============================================================
   FIFA World Cup 2026 — API Manager
   assets/js/api.js
   ============================================================ */

import API_CONFIG from '../../config/api.config.js';
import { STORAGE_KEYS } from '../../config/constants.js';

/* ── Rate Limiter ──────────────────────────────────────────── */
const rateLimiter = (() => {
  const queue = [];
  let requestCount = 0;
  let windowStart  = Date.now();

  return {
    async throttle(fn) {
      const now = Date.now();
      if (now - windowStart > 60_000) {
        requestCount = 0;
        windowStart  = now;
      }
      if (requestCount >= API_CONFIG.RATE_LIMIT) {
        const waitMs = 60_000 - (now - windowStart) + 100;
        console.warn(`[API] Rate limit reached. Waiting ${waitMs}ms.`);
        await sleep(waitMs);
        requestCount = 0;
        windowStart  = Date.now();
      }
      requestCount++;
      return fn();
    }
  };
})();

/* ── Helpers ───────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

const cacheKey = endpoint =>
  `${STORAGE_KEYS.CACHE_PFX}${endpoint.replace(/\W+/g, '_')}`;

function readCache(endpoint) {
  try {
    const raw = sessionStorage.getItem(cacheKey(endpoint));
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      sessionStorage.removeItem(cacheKey(endpoint));
      return null;
    }
    return data;
  } catch { return null; }
}

function writeCache(endpoint, data, ttl) {
  try {
    sessionStorage.setItem(cacheKey(endpoint), JSON.stringify({
      data,
      expires: Date.now() + ttl
    }));
  } catch (e) {
    // sessionStorage full — clear old WC entries
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(STORAGE_KEYS.CACHE_PFX))
      .forEach(k => sessionStorage.removeItem(k));
  }
}

/* ── Core Fetch ────────────────────────────────────────────── */
async function apiFetch(endpoint, params = {}, options = {}) {
  const { ttl = API_CONFIG.CACHE_TTL.STANDINGS, retries = API_CONFIG.MAX_RETRIES } = options;

  // Build URL
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const key = `${endpoint}?${url.searchParams.toString()}`;

  // 1. Check cache
  const cached = readCache(key);
  if (cached) {
    console.log(`[API] Cache hit: ${key}`);
    return cached;
  }

  // 2. Use mock data in dev mode
  if (API_CONFIG.USE_MOCK) {
    console.log(`[API] Mock mode — loading local JSON for: ${endpoint}`);
    return fetchMock(endpoint, params);
  }

  // 3. Live request with retry
  return rateLimiter.throttle(() => fetchWithRetry(key, url, ttl, retries));
}

async function fetchWithRetry(cacheKeyStr, url, ttl, retriesLeft) {
  for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: {
          'x-apisports-key': API_CONFIG.API_KEY,
          'x-rapidapi-key':  API_CONFIG.API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });

      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[API] 429 Too Many Requests — backing off');
          await sleep(API_CONFIG.RETRY_DELAY_MS * attempt * 2);
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      writeCache(cacheKeyStr, json, ttl);
      return json;

    } catch (err) {
      console.error(`[API] Attempt ${attempt} failed for ${url}: ${err.message}`);
      if (attempt < API_CONFIG.MAX_RETRIES) {
        await sleep(API_CONFIG.RETRY_DELAY_MS * attempt);
      } else {
        throw err;
      }
    }
  }
}

/* ── Mock Data Loader ──────────────────────────────────────── */
async function fetchMock(endpoint) {
  const map = {
    '/fixtures':         '/data/schedule.json',
    '/standings':        '/data/groups.json',
    '/players/topscorers': '/data/scorers.json',
    '/teams':            '/data/teams.json',
    '/fixtures/statistics': '/data/match_stats.json',
    '/fixtures/events':  '/data/match_events.json'
  };

  const file = Object.entries(map).find(([k]) => endpoint.startsWith(k))?.[1];
  if (!file) return { response: [] };

  try {
    const res = await fetch(file);
    return res.json();
  } catch {
    console.error(`[API] Mock file not found: ${file}`);
    return { response: [] };
  }
}

/* ── Public API Methods ────────────────────────────────────── */
const API = {
  /** Live fixtures currently in play */
  getLiveFixtures() {
    return apiFetch('/fixtures', {
      live: 'all',
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON
    }, { ttl: API_CONFIG.CACHE_TTL.LIVE });
  },

  /** All fixtures for the tournament */
  getAllFixtures(params = {}) {
    return apiFetch('/fixtures', {
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON,
      ...params
    }, { ttl: API_CONFIG.CACHE_TTL.SCHEDULE });
  },

  /** Fixtures by date */
  getFixturesByDate(date) {
    return apiFetch('/fixtures', {
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON,
      date
    }, { ttl: API_CONFIG.CACHE_TTL.SCHEDULE });
  },

  /** Group stage standings */
  getStandings() {
    return apiFetch('/standings', {
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON
    }, { ttl: API_CONFIG.CACHE_TTL.STANDINGS });
  },

  /** Top goal scorers */
  getTopScorers() {
    return apiFetch('/players/topscorers', {
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON
    }, { ttl: API_CONFIG.CACHE_TTL.SCORERS });
  },

  /** Match statistics by fixture ID */
  getMatchStats(fixtureId) {
    return apiFetch('/fixtures/statistics', {
      fixture: fixtureId
    }, { ttl: API_CONFIG.CACHE_TTL.LIVE });
  },

  /** Match events (goals, cards, subs) */
  getMatchEvents(fixtureId) {
    return apiFetch('/fixtures/events', {
      fixture: fixtureId
    }, { ttl: API_CONFIG.CACHE_TTL.LIVE });
  },

  /** All teams in tournament */
  getTeams() {
    return apiFetch('/teams', {
      league: API_CONFIG.LEAGUE_ID,
      season: API_CONFIG.SEASON
    }, { ttl: API_CONFIG.CACHE_TTL.TEAM });
  },

  /** Team squad */
  getSquad(teamId) {
    return apiFetch('/players/squads', {
      team: teamId
    }, { ttl: API_CONFIG.CACHE_TTL.TEAM });
  }
};

export default API;