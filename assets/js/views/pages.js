import { state } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fdt, chip } from '../ui.js';
import { STAGES, TASKS, taskDone, stageStatus, ROLES } from '../process.js';

const MODE = { manual: 'mode.manual', semi: 'mode.semi', auto: 'mode.auto', self: 'mode.self' };

export function homeView() {
  const roles = ['guest', 'host', 'municipality', 'police', 'canton'];
  const { index, current } = stageStatus();
  return `<div class="home">
    <section class="hero">
      <div class="hero-in">
        <span class="eyebrow">${icon('layers', 16)} ${esc(t('home.eyebrow'))}</span>
        <h1>${esc(t('home.title'))}</h1>
        <p class="lead">${esc(t('home.lead'))}</p>
        <div class="btn-row"><button class="btn btn-primary btn-lg" data-action="tourStart">${icon('play', 18)} ${esc(t('home.tour'))}</button><a class="btn btn-secondary btn-lg" href="#/prozess">${icon('route', 18)} ${esc(t('home.process'))}</a></div>
        <p class="hero-status">${icon('route', 16)} ${esc(t('proc.case'))} · ${esc(current ? t('proc.position', { n: index, total: 6, stage: t('stage.' + current) }) : t('proc.allDone'))}</p>
      </div>
      <div class="hero-flow" aria-hidden="true">
        ${STAGES.map((s, i) => `<div class="hf-step"><span class="hf-ic">${icon(s.icon, 20)}</span><span>${esc(t('stage.' + s.id))}</span></div>${i < STAGES.length - 1 ? '<span class="hf-line"></span>' : ''}`).join('')}
      </div>
    </section>
    <section class="section">
      <h2 class="section-title">${esc(t('home.roles'))}</h2>
      <div class="role-grid">
        ${roles.map((r) => `<a class="role-card" href="${ROLES[r].home}">
          <span class="role-ic">${icon(ROLES[r].icon, 24)}</span>
          <span class="role-name">${esc(t('role.' + r))}</span>
          <span class="role-who">${esc(t('role.' + r + '.who'))}</span>
          <span class="role-do">${esc(t('role.' + r + '.do'))}</span>
          <span class="role-go">${esc(t('home.open'))} ${icon('arrowRight', 16)}</span>
        </a>`).join('')}
        <a class="role-card role-card-alt" href="#/registrierung"><span class="role-ic">${icon('plus', 24)}</span><span class="role-name">${esc(t('home.reg'))}</span><span class="role-who">${esc(t('home.regWho'))}</span><span class="role-do">${esc(t('home.regDo'))}</span><span class="role-go">${esc(t('home.open'))} ${icon('arrowRight', 16)}</span></a>
      </div>
    </section>
    <section class="section grid-3 gap">
      <div class="card feat">${icon('user', 22)}<h3>${esc(t('home.f1'))}</h3><p class="muted">${esc(t('home.f1t'))}</p></div>
      <div class="card feat">${icon('zap', 22)}<h3>${esc(t('home.f2'))}</h3><p class="muted">${esc(t('home.f2t'))}</p></div>
      <div class="card feat">${icon('lock', 22)}<h3>${esc(t('home.f3'))}</h3><p class="muted">${esc(t('home.f3t'))}</p></div>
    </section>
  </div>`;
}

export function processView() {
  const d = taskDone();
  const { status } = stageStatus();
  const total = TASKS.length;
  const doneN = TASKS.filter((x) => d[x.id]).length;
  const stages = STAGES.map((s, i) => {
    const st = status[s.id];
    const list = TASKS.filter((x) => x.stage === s.id);
    const tasks = list.map((x) => `<li><a class="task ${d[x.id] ? 'is-done' : ''}" href="${x.href}">
        <span class="task-st">${d[x.id] ? icon('checkCircle', 20) : '<span class="task-open"></span>'}</span>
        <span class="task-main"><strong>${esc(t('task.' + x.id))}</strong><span class="muted small">${x.id.replace('T', '')} · ${esc(t('actor.' + x.actor))} · ${esc(t(MODE[x.mode]))}</span></span>
        ${icon('chevronRight', 18)}
      </a></li>`).join('');
    const right = st === 'current' ? chip('info', t('proc.now')) : st === 'done' ? `<span class="muted small">${list.length}/${list.length}</span>` : '';
    return `<details class="stage card is-${st}" ${st === 'done' ? '' : 'open'}>
      <summary class="stage-head"><span class="stage-num">${st === 'done' ? icon('check', 18) : i + 1}</span><span class="stage-ttl"><h2>${esc(t('stage.' + s.id))}</h2><span class="muted">${esc(t('stage.' + s.id + '.d'))}</span></span>${right}${icon('chevronDown', 18, 'stage-chev')}</summary>
      <ul class="tasks">${tasks}</ul></details>`;
  }).join('');
  const feed = state.feed.slice(0, 8).map((f) => `<li><span>${esc(t(f.k, f.v))}</span><span class="muted small">${esc(fdt(f.at))}</span></li>`).join('');
  return {
    title: t('proc.title'),
    sub: t('proc.progress', { done: doneN, total }),
    actions: `<button class="btn btn-primary" data-action="tourStart">${icon('play', 18)} ${esc(t('home.tour'))}</button>`,
    body: `<div class="proc-wrap"><div class="stages">${stages}</div>
    <details class="card fold"><summary>${esc(t('proc.feed'))}${icon('chevronDown', 18, 'stage-chev')}</summary><p class="muted small">${esc(t('proc.feedT'))}</p><ul class="feed-list">${feed}</ul></details>
    <details class="card fold"><summary>${esc(t('proc.assumptions'))}${icon('chevronDown', 18, 'stage-chev')}</summary><ul class="ticks">${[1, 2, 3, 4, 5, 6].map((n) => `<li>${esc(t('proc.a' + n))}</li>`).join('')}</ul></details></div>`,
  };
}
