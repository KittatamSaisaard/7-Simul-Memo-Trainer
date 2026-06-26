const STATS_KEY = 'simul_stats_v1';
const PRACTICE_KEY = 'practice_mode';
const TRAINER_KEY = 'trainer_mode';
const INPUTTYPE_KEY = 'input_type';
const TIMER_KEY = 'timer';
const HOURINDICATORS_KEY = 'hour_indicators';

export function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '[]'); }
  catch { return []; }
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function addStatRow(row) {
  const stats = loadStats();
  stats.push(row);
  const MAX_ROWS = 10000;
  if (stats.length > MAX_ROWS) stats.splice(0, stats.length - MAX_ROWS);
  saveStats(stats);
}

export function deleteLastStat() {
  const stats = loadStats();
  if (stats.length === 0) return false;
  stats.pop();
  saveStats(stats);
  return true;
}

export function clearStats() {
  localStorage.removeItem(STATS_KEY);
}

export function computeInstantStats() {
  const stats = loadStats();
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

export function exportStatsCsv(filename = '7-simul-stats.csv') {
  const stats = loadStats();
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
export const getTimerPref = () => localStorage.getItem(TIMER_KEY) === '1';
export const setTimerPref = on => localStorage.setItem(TIMER_KEY, on ? '1' : '0');
export const getHideHourIndicators = () => localStorage.getItem(HOURINDICATORS_KEY) === '1';
export const setHideHourIndicators = on => localStorage.setItem(HOURINDICATORS_KEY, on ? '1' : '0');
