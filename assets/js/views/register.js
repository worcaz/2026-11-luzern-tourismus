import { state, update, feed } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, field, formData, toast, chip } from '../ui.js';

const ZIPS = { '6003': ['Luzern', 1061], '6004': ['Luzern', 1061], '6005': ['Luzern', 1061], '6006': ['Luzern', 1061], '6015': ['Luzern', 1061], '6010': ['Kriens', 1059], '6353': ['Weggis', 1069], '6354': ['Vitznau', 1068], '6210': ['Sursee', 1103], '6204': ['Sempach', 1102], '6130': ['Willisau', 1151], '6170': ['Schüpfheim', 1008] };

function draft() {
  if (!state.drafts.reg) state.drafts.reg = { step: 1, kind: 'private', name: '', email: '', uid: '', street: '', zip: '', objName: '', cat: 'fewo', rooms: '', beds: '', commercial: 'yes', direct: true, platform: true, software: 'webapp', iban: '', ebill: true, errors: {} };
  return state.drafts.reg;
}

export function registerView() {
  const d = draft();
  const e = d.errors || {};
  const steps = ['r.s1', 'r.s2', 'r.s3', 'r.s4'];
  const stepper = d.step <= 4 ? `<ol class="g-stepper wide">${steps.map((s, i) => { const n = i + 1; const st = n < d.step ? 'done' : n === d.step ? 'current' : 'next'; return `<li class="is-${st}"><span class="dot">${st === 'done' ? icon('check', 14) : n}</span><span>${esc(t(s))}</span></li>`; }).join('')}</ol>` : '';
  let body = '';
  if (d.step === 1) body = `<form class="card" id="rform" data-submit="r.next" novalidate>
      <h2>${esc(t('r.s1'))}</h2><p class="muted">${esc(t('r.s1hint'))}</p>
      <div class="choice">
        <label class="choice-opt"><input type="radio" name="kind" value="private" ${d.kind === 'private' ? 'checked' : ''}><span>${icon('user', 22)}<strong>${esc(t('r.private'))}</strong><span class="muted">${esc(t('r.privateT'))}</span></span></label>
        <label class="choice-opt"><input type="radio" name="kind" value="business" ${d.kind === 'business' ? 'checked' : ''}><span>${icon('bed', 22)}<strong>${esc(t('r.business'))}</strong><span class="muted">${esc(t('r.businessT'))}</span></span></label>
      </div>
      <div class="grid-2">${field('name', t('r.name'), { value: d.name, required: true, err: e.name && t('g.req') })}${field('email', t('acc.email'), { type: 'email', value: d.email, required: true, err: e.email && t('g.req') })}</div>
      ${field('uid', t('r.uid'), { value: d.uid, hint: t('r.uidHint') })}
      <div class="note">${icon('key', 18)}<span>${esc(t('r.loginNote'))}</span></div>
      <div class="g-actions"><button type="button" class="link-btn demo-fill" data-action="r.fill">${icon('sparkle', 15)} ${esc(t('g.demoFill'))}</button><button class="btn btn-primary" type="submit">${esc(t('common.next'))} ${icon('arrowRight', 18)}</button></div>
    </form>`;
  if (d.step === 2) {
    const m = ZIPS[d.zip];
    body = `<form class="card" id="rform" data-submit="r.next" novalidate>
      <h2>${esc(t('r.s2'))}</h2><p class="muted">${esc(t('r.s2hint'))}</p>
      ${field('objName', t('r.objName'), { value: d.objName, required: true, err: e.objName && t('g.req') })}
      <div class="grid-2">${field('street', t('g.street'), { value: d.street, required: true, err: e.street && t('g.req') })}${field('zip', t('g.zip'), { value: d.zip, required: true, err: e.zip && t('g.req'), attrs: 'inputmode="numeric" maxlength="4" data-input="regZip"' })}</div>
      <div class="detect ${m ? 'ok' : ''}" id="detect">${m ? `${icon('checkCircle', 18)} ${esc(t('r.detected', { m: m[0], bfs: m[1] }))}` : `${icon('map', 18)} ${esc(t('r.detectHint'))}`}</div>
      <div class="grid-3">${field('cat', t('h.category'), { value: d.cat, options: [['fewo', t('cat.fewo')], ['pension', t('cat.pension')], ['hotel13', t('cat.hotel13')], ['hotel45', t('cat.hotel45')]] })}${field('rooms', t('r.rooms'), { type: 'number', value: d.rooms, required: true, err: e.rooms && t('g.req') })}${field('beds', t('r.beds'), { type: 'number', value: d.beds, required: true, err: e.beds && t('g.req') })}</div>
      ${field('commercial', t('r.commercial'), { value: d.commercial, options: [['yes', t('r.commYes')], ['no', t('r.commNo')]], hint: t('r.commHint') })}
      <div class="g-actions"><button type="button" class="btn btn-secondary" data-action="r.goto" data-arg="1">${icon('arrowLeft', 18)} ${esc(t('common.back'))}</button><button class="btn btn-primary" type="submit">${esc(t('common.next'))} ${icon('arrowRight', 18)}</button></div>
    </form>`;
  }
  if (d.step === 3) body = `<form class="card" id="rform" data-submit="r.next" novalidate>
      <h2>${esc(t('r.s3'))}</h2><p class="muted">${esc(t('r.s3hint'))}</p>
      <label class="check"><input type="checkbox" name="direct" ${d.direct ? 'checked' : ''}><span><strong>${esc(t('r.direct'))}</strong><br><span class="muted">${esc(t('r.directT'))}</span></span></label>
      <label class="check"><input type="checkbox" name="platform" ${d.platform ? 'checked' : ''}><span><strong>${esc(t('r.platform'))}</strong><br><span class="muted">${esc(t('r.platformT'))}</span></span></label>
      <h3 class="g-sub">${esc(t('r.software'))}</h3>
      <div class="choice">
        <label class="choice-opt"><input type="radio" name="software" value="webapp" ${d.software === 'webapp' ? 'checked' : ''}><span>${icon('phone', 22)}<strong>${esc(t('h.webapp'))}</strong><span class="muted">${esc(t('r.webappT'))}</span></span></label>
        <label class="choice-opt"><input type="radio" name="software" value="pms" ${d.software === 'pms' ? 'checked' : ''}><span>${icon('link', 22)}<strong>${esc(t('h.pms'))}</strong><span class="muted">${esc(t('r.pmsT'))}</span></span></label>
      </div>
      <div class="g-actions"><button type="button" class="btn btn-secondary" data-action="r.goto" data-arg="2">${icon('arrowLeft', 18)} ${esc(t('common.back'))}</button><button class="btn btn-primary" type="submit">${esc(t('common.next'))} ${icon('arrowRight', 18)}</button></div>
    </form>`;
  if (d.step === 4) body = `<form class="card" id="rform" data-submit="r.next" novalidate>
      <h2>${esc(t('r.s4'))}</h2><p class="muted">${esc(t('r.s4hint'))}</p>
      ${field('iban', 'IBAN', { value: d.iban, required: true, err: e.iban && t('g.req'), attrs: 'autocomplete="off"' })}
      <label class="check"><input type="checkbox" name="ebill" ${d.ebill ? 'checked' : ''}><span>${esc(t('r.ebill'))}</span></label>
      <div class="summary">
        <h3>${esc(t('r.summary'))}</h3>
        <dl class="dl"><dt>${esc(t('r.name'))}</dt><dd>${esc(d.name)}</dd><dt>${esc(t('r.objName'))}</dt><dd>${esc(d.objName)}</dd><dt>${esc(t('h.address'))}</dt><dd>${esc(d.street)}, ${esc(d.zip)} ${esc((ZIPS[d.zip] || ['–'])[0])}</dd><dt>${esc(t('h.category'))}</dt><dd>${esc(t('cat.' + d.cat))}</dd></dl>
      </div>
      <div class="g-actions"><button type="button" class="btn btn-secondary" data-action="r.goto" data-arg="3">${icon('arrowLeft', 18)} ${esc(t('common.back'))}</button><button class="btn btn-primary" type="submit">${icon('check', 18)} ${esc(t('r.submit'))}</button></div>
    </form>`;
  if (d.step === 5) {
    const r = state.registrations[state.registrations.length - 1];
    body = `<section class="card g-done"><div class="done-ic">${icon('check', 34)}</div>
      <h2>${esc(t('r.doneTitle'))}</h2><p class="lead">${esc(t('r.doneText', { no: r ? r.objectNo : '' }))}</p>
      <ul class="rows left">
        <li><div><strong>${esc(t('r.check1'))}</strong><span class="muted">${esc(t('r.check1T'))}</span></div>${chip('ok', t('status.done'), 'check')}</li>
        <li><div><strong>${esc(t('r.check2'))}</strong><span class="muted">${esc(t('r.check2T', { m: r ? r.municipality : '' }))}</span></div>${chip('ok', t('status.done'), 'check')}</li>
        <li><div><strong>${esc(t('r.check3'))}</strong><span class="muted">${esc(t('r.check3T'))}</span></div>${chip('info', t('r.ready'), 'link')}</li>
      </ul>
      <div class="btn-row center"><a class="btn btn-primary" href="#/gastgeber/objekte">${esc(t('r.toObjects'))}</a><button class="btn btn-secondary" data-action="r.restart">${icon('refresh', 18)} ${esc(t('r.again'))}</button></div>
    </section>`;
  }
  return {
    title: t('r.title'),
    sub: t('r.sub'),
    body: `<div class="narrow">${stepper}${body}</div>`,
  };
}

function readForm(d) {
  const f = document.getElementById('rform');
  if (!f) return;
  const v = formData(f);
  if (d.step === 1) Object.assign(d, { kind: v.kind || d.kind, name: v.name, email: v.email, uid: v.uid });
  if (d.step === 2) Object.assign(d, { objName: v.objName, street: v.street, zip: v.zip, cat: v.cat, rooms: v.rooms, beds: v.beds, commercial: v.commercial });
  if (d.step === 3) Object.assign(d, { direct: !!v.direct, platform: !!v.platform, software: v.software || d.software });
  if (d.step === 4) Object.assign(d, { iban: v.iban, ebill: !!v.ebill });
}
function validate(d) {
  const e = {};
  const req = { 1: ['name', 'email'], 2: ['objName', 'street', 'zip', 'rooms', 'beds'], 4: ['iban'] }[d.step] || [];
  req.forEach((k) => { if (!d[k]) e[k] = 1; });
  d.errors = e;
  return !Object.keys(e).length;
}

export const registerActions = {
  'r.next': () => {
    let ok = false;
    update(() => {
      const d = draft(); readForm(d); ok = validate(d);
      if (ok && d.step === 4) {
        const m = ZIPS[d.zip] || ['Kriens', 1059];
        const no = `${m[0].slice(0, 2).toUpperCase()}-${m[1]}-${String(117 + state.registrations.length).padStart(4, '0')}`;
        state.registrations.push({ name: d.objName, address: `${d.street}, ${d.zip} ${m[0]}`, municipality: m[0], objectNo: no });
        feed('feed.reg', { name: d.objName, no, m: m[0] });
      }
      if (ok) d.step += 1;
    });
    if (!ok) toast(t('g.fixErrors'), 'err'); else window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  'r.goto': (arg) => update(() => { const d = draft(); readForm(d); d.step = +arg; d.errors = {}; }),
  'r.fill': () => {
    update(() => { Object.assign(draft(), { name: 'Peter Huber', email: 'peter.huber@example.ch', street: 'Sonnenbergstrasse 21', zip: '6010', objName: 'Ferienwohnung Sonnenberg', rooms: '3', beds: '4', iban: 'CH56 0483 5012 3456 7800 9', errors: {} }); });
    toast(t('g.filled'), 'info');
  },
  'r.restart': () => update(() => { delete state.drafts.reg; }),
};

export const registerInputs = {
  regZip: (v) => {
    const el = document.getElementById('detect');
    if (!el) return;
    const m = ZIPS[v];
    el.className = 'detect' + (m ? ' ok' : '');
    el.innerHTML = m ? `${icon('checkCircle', 18)} ${esc(t('r.detected', { m: m[0], bfs: m[1] }))}` : `${icon('map', 18)} ${esc(t('r.detectHint'))}`;
  },
};
