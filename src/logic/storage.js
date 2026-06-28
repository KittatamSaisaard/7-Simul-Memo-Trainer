const PRACTICE_KEY = 'practice_mode';
const TRAINER_KEY = 'trainer_mode';
const INPUTTYPE_KEY = 'input_type';
const TIMER_KEY = 'timer';
const HOURINDICATORS_KEY = 'hour_indicators';
const ACTIVE_SESSION_KEY = 'simul_active_session';

const NUM_SESSIONS = 5;

// Session 1 reuses the original key so existing data is preserved
function statsKey(session) {
  return session === 1 ? 'simul_stats_v1' : `simul_stats_v1_s${session}`;
}

export const getActiveSession = () => {
  const n = parseInt(localStorage.getItem(ACTIVE_SESSION_KEY) || '1', 10);
  return n >= 1 && n <= NUM_SESSIONS ? n : 1;
};
export const setActiveSession = n => localStorage.setItem(ACTIVE_SESSION_KEY, String(n));
export const NUM_STAT_SESSIONS = NUM_SESSIONS;

export function loadStats(session = getActiveSession()) {
  try { return JSON.parse(localStorage.getItem(statsKey(session)) || '[]'); }
  catch { return []; }
}

export function saveStats(stats, session = getActiveSession()) {
  localStorage.setItem(statsKey(session), JSON.stringify(stats));
}

const MAX_STAT_ROWS = 30000;

export function addStatRow(row, session = getActiveSession()) {
  const stats = loadStats(session);
  if (stats.length >= MAX_STAT_ROWS) return;
  stats.push(row);
  saveStats(stats, session);
}

export function deleteStatAt(index, session = getActiveSession()) {
  const stats = loadStats(session);
  if (index < 0 || index >= stats.length) return false;
  stats.splice(index, 1);
  saveStats(stats, session);
  return true;
}

export function clearStats(session = getActiveSession()) {
  localStorage.removeItem(statsKey(session));
}

export function computeInstantStats(session = getActiveSession()) {
  const stats = loadStats(session);
  const totalSolves = stats.length;
  const totalSuccess = stats.filter(s => s.is_correct === true).length;
  const successRate = totalSolves ? ((totalSuccess / totalSolves) * 100).toFixed(1) : '0.0';
  let streak = 0;
  for (let i = stats.length - 1; i >= 0; i--) {
    if (stats[i]?.is_correct === true) streak++;
    else break;
  }
  return { totalSolves, successRate, currentStreak: streak };
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportStatsCsv(session = getActiveSession()) {
  const stats = loadStats(session);
  const filename = `7-simul-stats-session${session}.csv`;
  const headers = ['timestamp','pinorder','time_seconds','correct_memo','input_memo','is_correct','scramble'];
  const lines = [headers.join(','), ...stats.map(r => headers.map(h => csvCell(r[h])).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const isPracticeMode = () => localStorage.getItem(PRACTICE_KEY) === '1';
export const setPracticeMode = on => localStorage.setItem(PRACTICE_KEY, on ? '1' : '0');
export const isTrainerMode = () => localStorage.getItem(TRAINER_KEY) === '1';
export const setTrainerMode = on => localStorage.setItem(TRAINER_KEY, on ? '1' : '0');
export const getInputLetterType = () => localStorage.getItem(INPUTTYPE_KEY) ?? 'letters';
export const setInputLetterType = t => localStorage.setItem(INPUTTYPE_KEY, t);
const CUSTOM_CHARS_KEY = 'customChars';
export const getCustomChars = () => localStorage.getItem(CUSTOM_CHARS_KEY) ?? 'ABCDEFGHIJKL';
export const setCustomChars = v => localStorage.setItem(CUSTOM_CHARS_KEY, v);
export const getTimerPref = () => localStorage.getItem(TIMER_KEY) === '1';
export const setTimerPref = on => localStorage.setItem(TIMER_KEY, on ? '1' : '0');
export const getHideHourIndicators = () => localStorage.getItem(HOURINDICATORS_KEY) === '1';
export const setHideHourIndicators = on => localStorage.setItem(HOURINDICATORS_KEY, on ? '1' : '0');

const SWAP_M3M4_KEY = 'swapM3M4';
export const getSwapM3M4 = () => localStorage.getItem(SWAP_M3M4_KEY) !== '0';
export const setSwapM3M4Pref = on => localStorage.setItem(SWAP_M3M4_KEY, on ? '1' : '0');

const CUSTOM_PIN_ORDER_KEY = 'customPinOrder';
const CHECKED_PAIRS_KEY = 'customCheckedPairs';
export const getCustomPinOrder = () => localStorage.getItem(CUSTOM_PIN_ORDER_KEY) ?? '';
export const setCustomPinOrder = v => localStorage.setItem(CUSTOM_PIN_ORDER_KEY, v);
export const getSavedCheckedPairs = () => {
  try { return JSON.parse(localStorage.getItem(CHECKED_PAIRS_KEY)); }
  catch { return null; }
};
export const setSavedCheckedPairs = v => localStorage.setItem(CHECKED_PAIRS_KEY, JSON.stringify(v));
