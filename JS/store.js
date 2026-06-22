/* ============================================================
   FIFA World Cup 2026 — State Store + Event Bus
   assets/js/store.js
   ============================================================ */

/* ── Event Bus ─────────────────────────────────────────────── */
const EventBus = (() => {
  const listeners = {};

  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
      return () => this.off(event, fn);  // returns unsubscribe
    },

    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },

    emit(event, payload) {
      console.log(`[Store] ↑ ${event}`, payload ?? '');
      (listeners[event] || []).forEach(fn => {
        try { fn(payload); }
        catch (e) { console.error(`[Store] listener error on "${event}":`, e); }
      });
    },

    once(event, fn) {
      const wrapper = payload => { fn(payload); this.off(event, wrapper); };
      this.on(event, wrapper);
    }
  };
})();

/* ── Initial State ─────────────────────────────────────────── */
const initialState = {
  // Loading flags
  loading: {
    live:      false,
    standings: false,
    scorers:   false,
    schedule:  false
  },

  // Error messages
  errors: {
    live:      null,
    standings: null,
    scorers:   null,
    schedule:  null
  },

  // Data
  liveFixtures:    [],
  allFixtures:     [],
  standings:       [],
  topScorers:      [],
  matchDetail:     null,
  matchEvents:     [],
  matchStats:      null,
  teams:           [],

  // Scores snapshot for change detection
  previousScores:  {},

  // UI state
  selectedGroup:   'A',
  selectedDate:    null,
  activeMatchId:   null,

  // Meta
  lastUpdated: {
    live:      null,
    standings: null,
    scorers:   null
  }
};

/* ── Store ─────────────────────────────────────────────────── */
const Store = (() => {
  let state = { ...initialState };

  function get() { return state; }

  function set(partial, eventName) {
    const prev = { ...state };
    state = { ...state, ...partial };
    if (eventName) EventBus.emit(eventName, { prev, next: state });
  }

  function setNested(path, value) {
    // path like 'loading.live'
    const keys = path.split('.');
    const top  = keys[0];
    const rest = keys.slice(1);

    if (rest.length === 0) {
      set({ [top]: value });
      return;
    }

    const updated = { ...state[top] };
    let ref = updated;
    rest.forEach((k, i) => {
      if (i === rest.length - 1) ref[k] = value;
      else { ref[k] = { ...ref[k] }; ref = ref[k]; }
    });
    set({ [top]: updated });
  }

  function reset() {
    state = { ...initialState };
    EventBus.emit('store:reset');
  }

  return { get, set, setNested, reset };
})();

/* ── Score Change Detector ─────────────────────────────────── */
function detectGoals(fixtures) {
  const prev  = Store.get().previousScores;
  const goals = [];

  fixtures.forEach(f => {
    const id        = f.fixture.id;
    const homeScore = f.goals.home ?? 0;
    const awayScore = f.goals.away ?? 0;

    const prevH = prev[id]?.home ?? 0;
    const prevA = prev[id]?.away ?? 0;

    if (homeScore > prevH) {
      goals.push({
        fixtureId: id,
        team: f.teams.home.name,
        flag: f.teams.home.logo,
        score: `${homeScore}–${awayScore}`,
        opponent: f.teams.away.name
      });
    }
    if (awayScore > prevA) {
      goals.push({
        fixtureId: id,
        team: f.teams.away.name,
        flag: f.teams.away.logo,
        score: `${homeScore}–${awayScore}`,
        opponent: f.teams.home.name
      });
    }
  });

  return goals;
}

/* ── Actions ───────────────────────────────────────────────── */
const Actions = {
  setLoading(key, value) {
    Store.setNested(`loading.${key}`, value);
  },

  setError(key, message) {
    Store.setNested(`errors.${key}`, message);
    EventBus.emit('error', { key, message });
  },

  setLiveFixtures(fixtures) {
    const goals = detectGoals(fixtures);

    // Build new scores snapshot
    const snapshot = {};
    fixtures.forEach(f => {
      snapshot[f.fixture.id] = {
        home: f.goals.home ?? 0,
        away: f.goals.away ?? 0
      };
    });

    Store.set({
      liveFixtures:   fixtures,
      previousScores: snapshot,
      lastUpdated:    { ...Store.get().lastUpdated, live: Date.now() }
    }, 'live:updated');

    if (goals.length) {
      goals.forEach(g => EventBus.emit('goal:scored', g));
    }
  },

  setAllFixtures(fixtures) {
    Store.set({ allFixtures: fixtures }, 'fixtures:updated');
  },

  setStandings(data) {
    Store.set({
      standings:   data,
      lastUpdated: { ...Store.get().lastUpdated, standings: Date.now() }
    }, 'standings:updated');
  },

  setTopScorers(data) {
    Store.set({
      topScorers:  data,
      lastUpdated: { ...Store.get().lastUpdated, scorers: Date.now() }
    }, 'scorers:updated');
  },

  setMatchDetail(fixture, events, stats) {
    Store.set({
      matchDetail: fixture,
      matchEvents: events || [],
      matchStats:  stats  || null,
      activeMatchId: fixture?.fixture?.id ?? null
    }, 'match:detail:updated');
  },

  setTeams(teams) {
    Store.set({ teams }, 'teams:updated');
  },

  selectGroup(group) {
    Store.set({ selectedGroup: group }, 'ui:group:selected');
  },

  selectDate(date) {
    Store.set({ selectedDate: date }, 'ui:date:selected');
  }
};

export { EventBus, Store, Actions };