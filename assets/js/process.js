import { state, demoBooking } from './store.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { esc } from './ui.js';

export const ROLES = {
  guest: { icon: 'user', home: '#/gast/B-24017' },
  host: { icon: 'bed', home: '#/gastgeber' },
  municipality: { icon: 'building', home: '#/gemeinde' },
  police: { icon: 'shield', home: '#/polizei' },
  canton: { icon: 'landmark', home: '#/kanton' },
};

export const STAGES = [
  { id: 's1', icon: 'database', roles: ['host', 'municipality'] },
  { id: 's2', icon: 'mail', roles: ['guest'] },
  { id: 's3', icon: 'id', roles: ['host', 'guest'] },
  { id: 's4', icon: 'zap', roles: ['police'] },
  { id: 's5', icon: 'file', roles: ['host', 'municipality'] },
  { id: 's6', icon: 'chart', roles: ['municipality', 'canton'] },
];

// 13 Tasks aus dem Soll-Prozess
export const TASKS = [
  { id: 'T1', stage: 's1', actor: 'host', mode: 'manual', href: '#/registrierung' },
  { id: 'T2', stage: 's1', actor: 'platform', mode: 'semi', href: '#/gemeinde/auffaelligkeiten' },
  { id: 'T3', stage: 's2', actor: 'platform', mode: 'auto', href: '#/gastgeber/ankuenfte' },
  { id: 'T4', stage: 's2', actor: 'guest', mode: 'self', href: '#/gast/B-24017' },
  { id: 'T5', stage: 's3', actor: 'host', mode: 'manual', href: '#/gastgeber/ankuenfte' },
  { id: 'T6', stage: 's4', actor: 'platform', mode: 'auto', href: '#/gastgeber/meldungen' },
  { id: 'T7', stage: 's4', actor: 'police', mode: 'auto', href: '#/polizei/suche' },
  { id: 'T8', stage: 's5', actor: 'platform', mode: 'auto', href: '#/gastgeber/abrechnungen' },
  { id: 'T9', stage: 's5', actor: 'host', mode: 'manual', href: '#/gastgeber/abrechnungen' },
  { id: 'T10', stage: 's5', actor: 'municipality', mode: 'semi', href: '#/gemeinde/abrechnungen' },
  { id: 'T11', stage: 's6', actor: 'platform', mode: 'auto', href: '#/gemeinde/verteilung' },
  { id: 'T12', stage: 's6', actor: 'canton', mode: 'auto', href: '#/kanton' },
  { id: 'T13', stage: 's6', actor: 'platform', mode: 'auto', href: '#/prozess' },
];

export function taskDone() {
  const b = demoBooking();
  const inv = state.invoices.find((i) => i.id === 'R-2026-10-H1');
  const paid = inv && inv.status === 'paid';
  const ci = b.status === 'checkedin';
  return {
    T1: true, T2: true, T3: true,
    T4: b.status !== 'invited',
    T5: ci, T6: ci, T7: ci,
    T8: true, T9: paid,
    T10: state.alerts.some((a) => a.status === 'done') || paid,
    T11: paid, T12: !!state.ui.cantonVisited && paid, T13: true,
  };
}

export function stageStatus() {
  const d = taskDone();
  const done = {};
  STAGES.forEach((s) => { done[s.id] = TASKS.filter((x) => x.stage === s.id).every((x) => d[x.id]); });
  let current = STAGES.find((s) => !done[s.id]);
  const res = {};
  STAGES.forEach((s) => { res[s.id] = done[s.id] ? 'done' : (current && s.id === current.id ? 'current' : 'next'); });
  return { status: res, current: current ? current.id : null, index: current ? STAGES.indexOf(current) + 1 : STAGES.length };
}

export function navigator(role) {
  const { status, index, current } = stageStatus();
  const segs = STAGES.map((s, i) => {
    const st = status[s.id];
    const mine = role && s.roles.includes(role);
    return `<span class="pl-seg is-${st} ${mine ? 'is-mine' : ''}" title="${i + 1}. ${esc(t('stage.' + s.id))}${mine ? ' · ' + esc(t('nav.yourPart')) : ''}"></span>`;
  }).join('');
  const label = current ? t('proc.position', { n: index, total: STAGES.length, stage: t('stage.' + current) }) : t('proc.allDone');
  return `<a class="pline" href="#/prozess" title="${esc(t('proc.case'))}"><span class="pl-bar" aria-hidden="true">${segs}</span><span class="pl-txt">${esc(label)}</span></a>`;
}
