/* ============================================================
   FIFA World Cup 2026 — Constants
   config/constants.js
   ============================================================ */

export const WC2026 = {
  // Tournament dates (USA host opener)
  START_DATE:    new Date('2026-06-11T18:00:00-05:00'),
  END_DATE:      new Date('2026-07-19T18:00:00-05:00'),
  FINAL_VENUE:   'MetLife Stadium, New Jersey',

  // Group letters
  GROUPS: ['A','B','C','D','E','F','G','H','I','J','K','L'],

  // Knockout stages
  STAGES: {
    GROUP:  'Group Stage',
    R32:    'Round of 32',
    R16:    'Round of 16',
    QF:     'Quarter-final',
    SF:     'Semi-final',
    THIRD:  'Third Place',
    FINAL:  'Final'
  },

  // Host nations
  HOSTS: ['USA','Canada','Mexico'],

  // Total teams
  TEAMS: 48,

  // Total matches
  MATCHES: 104
};

export const MATCH_STATUS = {
  // Scheduled
  NS:   'Not Started',
  TBD:  'Time TBD',

  // In Progress
  '1H': '1st Half',
  HT:   'Half Time',
  '2H': '2nd Half',
  ET:   'Extra Time',
  BT:   'Break Time',
  P:    'Penalty',
  SUSP: 'Suspended',
  INT:  'Interrupted',
  LIVE: 'Live',

  // Finished
  FT:   'Full Time',
  AET:  'After Extra Time',
  PEN:  'Penalties',

  // Postponed / Cancelled
  PST:  'Postponed',
  CANC: 'Cancelled',
  ABD:  'Abandoned',
  AWD:  'Technical Loss',
  WO:   'Walkover'
};

export const LIVE_STATUSES = ['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE'];

export const EVENT_ICONS = {
  Goal:         '⚽',
  'Own Goal':   '⚽',
  'Yellow Card':'🟨',
  'Red Card':   '🟥',
  'Yellow+Red': '🟧',
  subst:        '🔄',
  Var:          '📺'
};

export const EVENT_COLORS = {
  Goal:         'var(--wc-gold)',
  'Own Goal':   'var(--wc-text-red)',
  'Yellow Card':'var(--wc-yellow-card)',
  'Red Card':   'var(--wc-red-card)',
  subst:        'var(--wc-text-secondary)',
  Var:          'var(--wc-text-secondary)'
};

export const PAGES = {
  HOME:    '/index.html',
  MATCHES: '/pages/matches.html',
  GROUPS:  '/pages/groups.html',
  BRACKET: '/pages/bracket.html',
  STATS:   '/pages/stats.html',
  TEAM:    '/pages/team.html'
};

export const STORAGE_KEYS = {
  THEME:     'wc2026_theme',
  FAV_TEAMS: 'wc2026_favTeams',
  CACHE_PFX: 'wc2026_cache_'
};