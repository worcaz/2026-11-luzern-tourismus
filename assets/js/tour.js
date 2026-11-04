import { state, update } from './store.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { esc } from './ui.js';

export const TOUR = [
  '#/prozess',
  '#/registrierung',
  '#/gastgeber/ankuenfte',
  '#/gast/B-24017',
  '#/gastgeber/ankuenfte',
  '#/polizei/suche',
  '#/gastgeber/abrechnungen',
  '#/gemeinde/auffaelligkeiten',
  '#/kanton',
  '#/prozess',
];

export function renderTour() {
  const el = document.getElementById('tour');
  document.body.classList.toggle('has-tour', !!state.tour.active && !state.tour.min);
  if (!state.tour.active) { el.innerHTML = ''; el.className = 'tour'; return; }
  const i = state.tour.step;
  const n = i + 1;
  el.className = 'tour open' + (state.tour.min ? ' min' : '');
  el.innerHTML = `<div class="tour-card" role="dialog" aria-label="${esc(t('tour.label'))}">
    <div class="tour-top"><span class="tour-step">${esc(t('tour.step', { n, total: TOUR.length }))}</span>
      <div><button class="icon-btn" data-action="tourMin" aria-label="${esc(t('tour.min'))}">${icon(state.tour.min ? 'chevronDown' : 'chevronDown', 18, state.tour.min ? 'rot' : '')}</button><button class="icon-btn" data-action="tourEnd" aria-label="${esc(t('tour.end'))}">${icon('x', 18)}</button></div></div>
    <div class="tour-progress"><div style="width:${(n / TOUR.length) * 100}%"></div></div>
    <h3>${esc(t(`tour.${n}.t`))}</h3>
    <p>${esc(t(`tour.${n}.d`))}</p>
    <div class="tour-actions">
      <button class="btn btn-ghost-light btn-sm" data-action="tourPrev" ${i === 0 ? 'disabled' : ''}>${icon('arrowLeft', 16)} ${esc(t('common.back'))}</button>
      ${n < TOUR.length ? `<button class="btn btn-light btn-sm" data-action="tourNext">${esc(t('common.next'))} ${icon('arrowRight', 16)}</button>` : `<button class="btn btn-light btn-sm" data-action="tourEnd">${esc(t('tour.finish'))}</button>`}
    </div>
  </div>`;
}

export const tourActions = {
  tourStart: () => { update((s) => { s.tour = { active: true, step: 0, min: false }; }); location.hash = TOUR[0]; },
  tourNext: () => { update((s) => { s.tour.step = Math.min(TOUR.length - 1, s.tour.step + 1); s.tour.min = false; }); location.hash = TOUR[state.tour.step]; },
  tourPrev: () => { update((s) => { s.tour.step = Math.max(0, s.tour.step - 1); s.tour.min = false; }); location.hash = TOUR[state.tour.step]; },
  tourEnd: () => update((s) => { s.tour.active = false; }),
  tourMin: () => update((s) => { s.tour.min = !s.tour.min; }),
};
