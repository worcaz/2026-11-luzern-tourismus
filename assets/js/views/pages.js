import { state } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fdt, chip } from '../ui.js';
import { STAGES, TASKS, taskDone, stageStatus, ROLES } from '../process.js';

const MODE = { manual: ['warn', 'mode.manual'], semi: ['violet', 'mode.semi'], auto: ['ok', 'mode.auto'], self: ['info', 'mode.self'] };

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
    const tasks = TASKS.filter((x) => x.stage === s.id).map((x) => `<li class="task ${d[x.id] ? 'is-done' : ''}">
        <span class="task-st">${d[x.id] ? icon('checkCircle', 20) : icon('clock', 20)}</span>
        <div class="task-main"><div class="task-top"><span class="task-id">${x.id.replace('T', '')}</span><strong>${esc(t('task.' + x.id))}</strong></div>
          <div class="task-meta">${chip('neutral', t('actor.' + x.actor), x.actor === 'platform' ? 'zap' : (ROLES[x.actor] || {}).icon)}${chip(MODE[x.mode][0], t(MODE[x.mode][1]))}</div></div>
        <a class="btn btn-ghost btn-sm" href="${x.href}">${esc(t('proc.open'))} ${icon('arrowRight', 15)}</a>
      </li>`).join('');
    return `<section class="stage card is-${status[s.id]}">
      <div class="stage-head"><span class="stage-num">${status[s.id] === 'done' ? icon('check', 18) : i + 1}</span><div><h2>${esc(t('stage.' + s.id))}</h2><p class="muted">${esc(t('stage.' + s.id + '.d'))}</p></div>${status[s.id] === 'current' ? chip('info', t('proc.now'), 'route') : status[s.id] === 'done' ? chip('ok', t('status.done'), 'check') : ''}</div>
      <ul class="tasks">${tasks}</ul></section>`;
  }).join('');
  const feed = state.feed.slice(0, 14).map((f) => `<li><span class="feed-ic">${icon('zap', 15)}</span><div><span>${esc(t(f.k, f.v))}</span><span class="muted small">${esc(fdt(f.at))}</span></div></li>`).join('');
  return {
    title: t('proc.title'),
    sub: t('proc.sub'),
    actions: `<button class="btn btn-primary" data-action="tourStart">${icon('play', 18)} ${esc(t('home.tour'))}</button>`,
    body: `<div class="cover"><div class="cover-num"><strong>${doneN}/${total}</strong><span>${esc(t('proc.coverage'))}</span></div><div class="cover-bar"><div style="width:${(doneN / total) * 100}%"></div></div><p class="muted small">${esc(t('proc.coverNote'))}</p></div>
    <div class="proc-layout"><div class="stages">${stages}</div>
    <aside class="card feed"><div class="card-head"><h2>${icon('zap', 20)} ${esc(t('proc.feed'))}</h2>${chip('ok', t('h.live'))}</div><p class="muted small">${esc(t('proc.feedT'))}</p><ul class="feed-list">${feed}</ul></aside></div>
    <section class="card"><div class="card-head"><h2>${icon('info', 20)} ${esc(t('proc.assumptions'))}</h2></div><ul class="ticks">${[1, 2, 3, 4, 5, 6].map((n) => `<li>${esc(t('proc.a' + n))}</li>`).join('')}</ul></section>`,
  };
}
