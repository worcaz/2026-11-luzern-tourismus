import { state, update, booking, demoBooking, host, ageAt, bookingLevy, feed } from '../store.js';
import { t, LANGS } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, chf, fdate, frange, field, formData, toast, qr } from '../ui.js';
import { TARIFFS } from '../data.js';

const NATS = ['CH', 'DE', 'FR', 'IT', 'AT', 'GB', 'US', 'JP', 'CN', 'IN', 'ES', 'NL', 'BE', 'SG', 'KR', 'AU', 'CA', 'BR'];

function gl(b) { return state.guestLang || b.lang || 'de'; }
function natName(code, lang) {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code); } catch (e) { return code; }
}

function draftFor(b) {
  if (!state.drafts[b.id]) {
    const n = b.adults + b.children;
    const tr = [{ first: b.main.first, last: b.main.last, birth: '', nat: b.main.nat }];
    for (let i = 1; i < n; i++) tr.push({ first: '', last: b.main.last, birth: '', nat: b.main.nat });
    state.drafts[b.id] = { step: b.status === 'invited' ? 0 : 4, travellers: tr, street: '', zip: '', city: '', country: b.main.nat, travel: '', plate: '', docType: 'passport', docNo: '', docExp: '', heimatort: '', consent: false, errors: {} };
  }
  const d = state.drafts[b.id];
  if (b.status !== 'invited') d.step = 4;
  return d;
}

const landscape = `<svg class="g-land" viewBox="0 0 600 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <path d="M0 120 L70 70 L120 95 L190 30 L250 85 L300 60 L360 100 L430 40 L500 90 L560 65 L600 85 V160 H0z" fill="rgba(255,255,255,.14)"/>
  <path d="M0 135 L90 100 L150 118 L230 80 L320 120 L400 92 L480 122 L600 100 V160 H0z" fill="rgba(255,255,255,.22)"/>
  <path d="M0 140 C120 132 220 146 320 138 S520 132 600 140 V160 H0z" fill="rgba(255,255,255,.35)"/>
</svg>`;

export function renderGuest(param) {
  const b = booking(param) || demoBooking();
  const h = host(b.host);
  const L = gl(b);
  const tg = (k, v) => t(k, v, L);
  const d = draftFor(b);
  const step = d.step;
  const stars = h.stars ? Array.from({ length: h.stars }, () => icon('star', 14, 'star')).join('') : '';
  const guestsTxt = tg('g.party', { a: b.adults, c: b.children });

  const steps = ['g.s1', 'g.s2', 'g.s3'];
  const stepper = step >= 1 && step <= 3 ? `<ol class="g-stepper" aria-label="${esc(tg('g.progress'))}">${steps.map((s, i) => {
    const n = i + 1; const st = n < step ? 'done' : n === step ? 'current' : 'next';
    return `<li class="is-${st}" ${st === 'current' ? 'aria-current="step"' : ''}><span class="dot">${st === 'done' ? icon('check', 14) : n}</span><span>${esc(tg(s))}</span></li>`;
  }).join('')}</ol><p class="g-steptxt">${esc(tg('g.stepOf', { n: step, total: 3 }))}</p>` : '';

  let body = '';
  if (step === 0) body = welcome(b, h, d, tg);
  if (step === 1) body = travellers(b, d, tg, L);
  if (step === 2) body = documentStep(b, d, tg);
  if (step === 3) body = review(b, h, d, tg, L);
  if (step === 4) body = done(b, h, d, tg, L);

  return `<div class="guest" style="--hotel:${h.color}">
    <header class="g-official">
      <div class="g-wrap g-official-in">
        <span class="g-seal">${icon('shieldCheck', 22)}</span>
        <div class="g-official-txt"><strong>${esc(tg('g.official'))}</strong><span>${esc(tg('g.officialSub'))}</span></div>
        <label class="g-lang"><span class="sr">${esc(tg('common.language'))}</span>${icon('globe', 18)}
          <select data-change="guestLang" aria-label="${esc(tg('common.language'))}">${LANGS.map((l) => `<option value="${l.id}" ${l.id === L ? 'selected' : ''}>${l.label}</option>`).join('')}</select>
        </label>
      </div>
    </header>
    <section class="g-hero">
      ${landscape}
      <div class="g-wrap g-hero-in">
        <div class="g-mono" aria-hidden="true">${esc(h.name.split(' ').filter((w) => /^[A-ZÄÖÜ]/.test(w)).slice(1, 3).map((w) => w[0]).join('') || 'H')}</div>
        <div>
          <div class="g-hotel">${esc(h.name)} <span class="g-stars" aria-label="${h.stars} ★">${stars}</span></div>
          <div class="g-addr">${icon('map', 15)} ${esc(h.address)}</div>
        </div>
      </div>
    </section>
    <main class="g-wrap g-main" id="main">
      <div class="g-verified">${icon('checkCircle', 16)} ${esc(tg('g.verified', { no: h.objectNo, m: h.municipality }))}</div>
      <section class="card g-booking" aria-label="${esc(tg('g.booking'))}">
        <div><span class="lbl">${esc(tg('g.stay'))}</span><strong>${esc(frange(b.arrival, b.departure, L))}</strong><span class="muted">${esc(tg('g.nights', { n: b.nights }))}</span></div>
        <div><span class="lbl">${esc(tg('g.guests'))}</span><strong>${esc(guestsTxt)}</strong><span class="muted">${esc(b.room)}</span></div>
        <div><span class="lbl">${esc(tg('g.bookingNo'))}</span><strong>${esc(b.id)}</strong><span class="muted">${esc(b.email)}</span></div>
      </section>
      ${stepper}
      ${body}
    </main>
    <footer class="g-foot g-wrap">
      <p>${esc(tg('g.help', { hotel: h.name }))}</p>
      <p class="muted">${icon('lock', 14)} ${esc(tg('g.footPrivacy'))}</p>
    </footer>
  </div>`;
}

function welcome(b, h, d, tg) {
  return `<section class="card g-card">
    <h1 class="g-h1">${esc(tg('g.hello', { name: b.main.first }))}</h1>
    <p class="lead">${esc(tg('g.intro', { hotel: h.name }))}</p>
    <ul class="g-benefits">
      <li>${icon('clock', 22)}<span><strong>${esc(tg('g.b1'))}</strong>${esc(tg('g.b1t'))}</span></li>
      <li>${icon('file', 22)}<span><strong>${esc(tg('g.b2'))}</strong>${esc(tg('g.b2t'))}</span></li>
      <li>${icon('ticket', 22)}<span><strong>${esc(tg('g.b3'))}</strong>${esc(tg('g.b3t'))}</span></li>
    </ul>
    <button class="btn btn-primary btn-lg btn-block" data-action="g.goto" data-arg="1">${esc(tg('g.start'))} ${icon('arrowRight', 20)}</button>
    <p class="g-time">${icon('clock', 15)} ${esc(tg('g.duration'))}</p>
  </section>
  <details class="card g-why">
    <summary>${icon('scale', 18)} ${esc(tg('g.why'))}</summary>
    <p>${esc(tg('g.whyText'))}</p>
    <ul class="ticks"><li>${esc(tg('g.why1'))}</li><li>${esc(tg('g.why2'))}</li><li>${esc(tg('g.why3'))}</li></ul>
  </details>`;
}

function natOptions(L, sel) {
  const list = NATS.map((c) => [c, natName(c, L)]).sort((a, b) => a[1].localeCompare(b[1], L));
  return list.map(([c, n]) => [c, n]);
}

function travellers(b, d, tg, L) {
  const e = d.errors || {};
  const tr = d.travellers;
  const main = tr[0];
  const comp = tr.slice(1).map((p, i) => {
    const k = i + 1;
    const age = ageAt(p.birth, b.arrival);
    return `<div class="person">
      <div class="person-head"><strong>${esc(tg('g.companion', { n: k }))}</strong>
        ${age !== null && age < TARIFFS.childAge ? `<span class="chip chip-ok">${icon('check', 13)}${esc(tg('g.childFree'))}</span>` : ''}
        <button type="button" class="link-btn" data-action="g.removePerson" data-arg="${k}">${icon('trash', 15)} ${esc(tg('common.remove'))}</button></div>
      <div class="grid-3">
        ${field(`p${k}_first`, tg('g.first'), { value: p.first, required: true, err: e[`p${k}_first`] && tg('g.req'), autocomplete: 'off' })}
        ${field(`p${k}_last`, tg('g.last'), { value: p.last, required: true, err: e[`p${k}_last`] && tg('g.req') })}
        ${field(`p${k}_birth`, tg('g.birth'), { type: 'date', value: p.birth, required: true, err: e[`p${k}_birth`] && tg('g.req'), attrs: 'max="2026-11-04"' })}
      </div>
    </div>`;
  }).join('');
  return `<form class="card g-card" id="gform" data-submit="g.next" data-arg="1" novalidate>
    <div class="g-card-head"><h2>${esc(tg('g.s1'))}</h2><button type="button" class="link-btn demo-fill" data-action="g.fill">${icon('sparkle', 15)} ${esc(tg('g.demoFill'))}</button></div>
    <p class="muted">${esc(tg('g.s1hint'))}</p>
    <h3 class="g-sub">${esc(tg('g.mainGuest'))}</h3>
    <div class="grid-2">
      ${field('m_first', tg('g.first'), { value: main.first, required: true, err: e.m_first && tg('g.req'), autocomplete: 'given-name' })}
      ${field('m_last', tg('g.last'), { value: main.last, required: true, err: e.m_last && tg('g.req'), autocomplete: 'family-name' })}
      ${field('m_birth', tg('g.birth'), { type: 'date', value: main.birth, required: true, err: e.m_birth && tg('g.req'), autocomplete: 'bday', attrs: 'max="2026-11-04"' })}
      ${field('m_nat', tg('g.nat'), { value: main.nat, required: true, options: natOptions(L) })}
    </div>
    ${field('street', tg('g.street'), { value: d.street, required: true, err: e.street && tg('g.req'), autocomplete: 'street-address' })}
    <div class="grid-2">
      ${field('zip', tg('g.zip'), { value: d.zip, required: true, err: e.zip && tg('g.req'), autocomplete: 'postal-code' })}
      ${field('city', tg('g.city'), { value: d.city, required: true, err: e.city && tg('g.req'), autocomplete: 'address-level2' })}
    </div>
    <h3 class="g-sub">${esc(tg('g.companions'))}</h3>
    ${comp || `<p class="muted">${esc(tg('g.noCompanions'))}</p>`}
    <button type="button" class="btn btn-ghost" data-action="g.addPerson">${icon('plus', 18)} ${esc(tg('g.addPerson'))}</button>
    <details class="g-optional">
      <summary>${esc(tg('g.travel'))} <span class="opt">${esc(tg('common.optional'))}</span></summary>
      <div class="grid-2">
        ${field('travel', tg('g.travelMode'), { value: d.travel, required: false, options: [['', '–'], ['pt', tg('g.pt')], ['car', tg('g.car')]] })}
        ${field('plate', tg('g.plate'), { value: d.plate, required: false })}
      </div>
    </details>
    <div class="g-actions">
      <button type="button" class="btn btn-secondary" data-action="g.goto" data-arg="0">${icon('arrowLeft', 18)} ${esc(tg('common.back'))}</button>
      <button type="submit" class="btn btn-primary">${esc(tg('common.next'))} ${icon('arrowRight', 18)}</button>
    </div>
  </form>`;
}

function documentStep(b, d, tg) {
  const e = d.errors || {};
  const main = d.travellers[0];
  const swiss = main.nat === 'CH';
  const inner = swiss
    ? `<p class="muted">${esc(tg('g.swissHint'))}</p>${field('heimatort', tg('g.heimatort'), { value: d.heimatort, required: true, err: e.heimatort && tg('g.req') })}`
    : `<div class="scan-box">
        <div class="scan-ic">${icon('camera', 30)}</div>
        <div><strong>${esc(tg('g.scan'))}</strong><p class="muted">${esc(tg('g.scanHint'))}</p></div>
        <button type="button" class="btn btn-secondary" data-action="g.scan">${icon('camera', 18)} ${esc(tg('g.scanBtn'))}</button>
      </div>
      <div class="or"><span>${esc(tg('g.orManual'))}</span></div>
      <div class="grid-3">
        ${field('docType', tg('g.docType'), { value: d.docType, required: true, options: [['passport', tg('g.passport')], ['idcard', tg('g.idcard')]] })}
        ${field('docNo', tg('g.docNo'), { value: d.docNo, required: true, err: e.docNo && tg('g.req'), autocomplete: 'off' })}
        ${field('docExp', tg('g.docExp'), { type: 'date', value: d.docExp, required: true, err: e.docExp && tg('g.req') })}
      </div>`;
  return `<form class="card g-card" id="gform" data-submit="g.next" data-arg="2" novalidate>
    <div class="g-card-head"><h2>${esc(tg('g.s2'))}</h2></div>
    <p class="muted">${esc(tg('g.s2hint', { name: main.first }))}</p>
    ${inner}
    <div class="note">${icon('info', 18)}<span>${esc(tg('g.bringId'))}</span></div>
    <div class="g-actions">
      <button type="button" class="btn btn-secondary" data-action="g.goto" data-arg="1">${icon('arrowLeft', 18)} ${esc(tg('common.back'))}</button>
      <button type="submit" class="btn btn-primary">${esc(tg('common.next'))} ${icon('arrowRight', 18)}</button>
    </div>
  </form>`;
}

function draftLevy(b, d) {
  const tmp = { ...b, guests: d.travellers };
  return bookingLevy(tmp);
}

function review(b, h, d, tg, L) {
  const lv = draftLevy(b, d);
  const main = d.travellers[0];
  const people = d.travellers.map((p, i) => {
    const age = ageAt(p.birth, b.arrival);
    return `<li><span>${esc(p.first)} ${esc(p.last)}</span><span class="muted">${esc(fdate(p.birth, L))}${i === 0 ? ' · ' + esc(natName(p.nat, L)) : ''}</span>${age !== null && age < TARIFFS.childAge ? `<span class="chip chip-ok">${esc(tg('g.childFree'))}</span>` : ''}</li>`;
  }).join('');
  const docTxt = main.nat === 'CH' ? `${tg('g.heimatort')}: ${d.heimatort}` : `${tg(d.docType === 'idcard' ? 'g.idcard' : 'g.passport')} · ${d.docNo} · ${tg('g.validUntil')} ${fdate(d.docExp, L)}`;
  return `<form class="card g-card" id="gform" data-submit="g.submit" novalidate>
    <div class="g-card-head"><h2>${esc(tg('g.s3'))}</h2></div>
    <div class="rv"><div class="rv-head"><h3>${esc(tg('g.guests'))}</h3><button type="button" class="link-btn" data-action="g.goto" data-arg="1">${icon('edit', 15)} ${esc(tg('common.edit'))}</button></div><ul class="rv-list">${people}</ul>
      <p class="muted">${esc(d.street)}, ${esc(d.zip)} ${esc(d.city)}</p></div>
    <div class="rv"><div class="rv-head"><h3>${esc(tg('g.s2'))}</h3><button type="button" class="link-btn" data-action="g.goto" data-arg="2">${icon('edit', 15)} ${esc(tg('common.edit'))}</button></div><p>${esc(docTxt)}</p></div>
    <div class="levy">
      <div class="levy-head">${icon('wallet', 20)}<h3>${esc(tg('g.levyTitle'))}</h3></div>
      <div class="levy-row"><span>${esc(tg('g.levyCalc', { p: lv.payers, n: b.nights, rate: lv.rate.total.toFixed(2) }))}</span><strong>${esc(chf(lv.total))}</strong></div>
      ${lv.exempt ? `<div class="levy-row muted"><span>${esc(tg('g.levyExempt', { n: lv.exempt }))}</span><span>${esc(chf(0))}</span></div>` : ''}
      <p class="muted small">${esc(tg('g.levyNote', { k: lv.rate.kurtaxe.toFixed(2), o: lv.rate.oertlich.toFixed(2), c: lv.rate.kantonal.toFixed(2) }))}</p>
    </div>
    <label class="check ${d.errors && d.errors.consent ? 'has-err' : ''}"><input type="checkbox" name="consent" ${d.consent ? 'checked' : ''}><span>${esc(tg('g.consent'))}</span></label>
    <p class="muted small">${esc(tg('g.consentNote'))}</p>
    <div class="g-actions">
      <button type="button" class="btn btn-secondary" data-action="g.goto" data-arg="2">${icon('arrowLeft', 18)} ${esc(tg('common.back'))}</button>
      <button type="submit" class="btn btn-primary">${icon('check', 18)} ${esc(tg('g.finish'))}</button>
    </div>
  </form>`;
}

function done(b, h, d, tg, L) {
  const active = b.status === 'checkedin';
  const lv = bookingLevy(b);
  return `<section class="card g-card g-done">
    <div class="done-ic">${icon('check', 34)}</div>
    <h1 class="g-h1">${esc(active ? tg('g.doneActive', { name: b.main.first }) : tg('g.doneTitle', { name: b.main.first }))}</h1>
    <p class="lead">${esc(active ? tg('g.doneActiveText') : tg('g.doneText', { hotel: h.name }))}</p>
    ${active ? '' : `<div class="g-code"><div class="qr-wrap">${qr(b.id)}</div><div><span class="lbl">${esc(tg('g.code'))}</span><strong class="mono">${esc(b.id)}</strong><p class="muted small">${esc(tg('g.codeHint'))}</p></div></div>`}
  </section>
  <section class="g-steps card">
    <h2>${esc(tg('g.next'))}</h2>
    <ol class="timeline">
      <li class="is-done"><span class="tl-dot">${icon('check', 14)}</span><div><strong>${esc(tg('g.tl1'))}</strong><span class="muted">${esc(tg('g.tl1t'))}</span></div></li>
      <li class="${active ? 'is-done' : 'is-current'}"><span class="tl-dot">${active ? icon('check', 14) : '2'}</span><div><strong>${esc(tg('g.tl2'))}</strong><span class="muted">${esc(tg('g.tl2t'))}</span></div></li>
      <li class="${active ? 'is-done' : ''}"><span class="tl-dot">${active ? icon('check', 14) : '3'}</span><div><strong>${esc(tg('g.tl3'))}</strong><span class="muted">${esc(tg('g.tl3t', { amount: chf(lv.total) }))}</span></div></li>
    </ol>
  </section>
  <section class="guestcard ${active ? 'is-active' : ''}" aria-label="${esc(tg('g.card'))}">
    <div class="gc-top"><span>${icon('ticket', 20)} ${esc(tg('g.card'))}</span><span class="chip ${active ? 'chip-ok' : 'chip-neutral'}">${esc(active ? tg('g.cardActive') : tg('g.cardPending'))}</span></div>
    <div class="gc-name">${esc(b.main.first)} ${esc(b.main.last)} <span>+${b.adults + b.children - 1}</span></div>
    <div class="gc-meta">${esc(frange(b.arrival, b.departure, L))} · ${esc(h.municipality)}</div>
    <ul class="gc-perks"><li>${icon('route', 16)} ${esc(tg('g.perk1'))}</li><li>${icon('landmark', 16)} ${esc(tg('g.perk2'))}</li><li>${icon('star', 16)} ${esc(tg('g.perk3'))}</li></ul>
    <button class="btn btn-light" data-action="g.wallet">${icon('phone', 18)} ${esc(tg('g.wallet'))}</button>
  </section>
  <details class="card g-why">
    <summary>${icon('lock', 18)} ${esc(tg('g.dataTitle'))}</summary>
    <ul class="ticks"><li>${esc(tg('g.data1'))}</li><li>${esc(tg('g.data2'))}</li><li>${esc(tg('g.data3'))}</li><li>${esc(tg('g.data4'))}</li></ul>
  </details>`;
}

// ---------- Aktionen ----------
function readForm(b, d) {
  const f = document.getElementById('gform');
  if (!f) return;
  const v = formData(f);
  if (d.step === 1) {
    const tr = d.travellers;
    tr[0] = { first: v.m_first, last: v.m_last, birth: v.m_birth, nat: v.m_nat };
    for (let k = 1; k < tr.length; k++) tr[k] = { first: v[`p${k}_first`], last: v[`p${k}_last`], birth: v[`p${k}_birth`], nat: tr[0].nat };
    Object.assign(d, { street: v.street, zip: v.zip, city: v.city, travel: v.travel, plate: v.plate });
  }
  if (d.step === 2) {
    if (d.travellers[0].nat === 'CH') d.heimatort = v.heimatort;
    else Object.assign(d, { docType: v.docType, docNo: v.docNo, docExp: v.docExp });
  }
  if (d.step === 3) d.consent = !!v.consent;
}

function validate(d) {
  const e = {};
  if (d.step === 1) {
    const m = d.travellers[0];
    ['first', 'last', 'birth'].forEach((k) => { if (!m[k]) e['m_' + k] = 1; });
    ['street', 'zip', 'city'].forEach((k) => { if (!d[k]) e[k] = 1; });
    d.travellers.slice(1).forEach((p, i) => { ['first', 'last', 'birth'].forEach((k) => { if (!p[k]) e[`p${i + 1}_${k}`] = 1; }); });
  }
  if (d.step === 2) {
    if (d.travellers[0].nat === 'CH') { if (!d.heimatort) e.heimatort = 1; }
    else { if (!d.docNo) e.docNo = 1; if (!d.docExp) e.docExp = 1; }
  }
  if (d.step === 3 && !d.consent) e.consent = 1;
  d.errors = e;
  return Object.keys(e).length === 0;
}

function curBooking() {
  const id = (location.hash.split('/')[2] || 'B-24017').split('?')[0];
  return booking(id) || demoBooking();
}

export const guestActions = {
  'g.goto': (arg) => {
    const b = curBooking();
    update((s) => { const d = draftFor(b); if (+arg < d.step) readForm(b, d); d.errors = {}; d.step = +arg; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  'g.next': () => {
    const b = curBooking();
    let ok = false;
    update(() => { const d = draftFor(b); readForm(b, d); ok = validate(d); if (ok) d.step += 1; });
    if (!ok) { toast(t('g.fixErrors', {}, gl(b)), 'err'); const el = document.querySelector('.has-err input, .has-err select'); if (el) el.focus(); }
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  'g.fill': () => {
    const b = curBooking();
    update(() => {
      const d = draftFor(b);
      const demo = [
        { first: 'Claire', last: 'Martin', birth: '1987-04-12', nat: 'FR' },
        { first: 'Lucas', last: 'Martin', birth: '1985-09-03', nat: 'FR' },
        { first: 'Léa', last: 'Martin', birth: '2018-05-20', nat: 'FR' },
      ];
      d.travellers = d.travellers.map((p, i) => demo[i] ? { ...demo[i], first: i === 0 ? b.main.first : demo[i].first, last: b.main.last } : p);
      Object.assign(d, { street: '14 rue des Lilas', zip: '69003', city: 'Lyon', travel: 'pt', errors: {} });
    });
    toast(t('g.filled', {}, gl(b)), 'info');
  },
  'g.addPerson': () => { const b = curBooking(); update(() => { const d = draftFor(b); readForm(b, d); d.travellers.push({ first: '', last: d.travellers[0].last, birth: '', nat: d.travellers[0].nat }); }); },
  'g.removePerson': (arg) => { const b = curBooking(); update(() => { const d = draftFor(b); readForm(b, d); d.travellers.splice(+arg, 1); }); },
  'g.scan': () => {
    const b = curBooking();
    const L = gl(b);
    const ov = document.getElementById('overlay');
    ov.innerHTML = `<div class="backdrop"></div><div class="scanner" role="dialog" aria-label="${esc(t('g.scan', {}, L))}"><div class="scan-frame"><div class="scan-doc"><span></span><span></span><span></span></div><div class="scan-line"></div></div><p>${esc(t('g.scanning', {}, L))}</p></div>`;
    ov.classList.add('open');
    setTimeout(() => {
      ov.classList.remove('open'); ov.innerHTML = '';
      update(() => { const d = draftFor(b); Object.assign(d, { docType: 'passport', docNo: '18AB23456', docExp: '2031-05-14', errors: {} }); });
      toast(t('g.scanned', {}, L), 'ok');
    }, 1600);
  },
  'g.submit': () => {
    const b = curBooking();
    let ok = false;
    update((s) => {
      const d = draftFor(b); readForm(b, d); ok = validate(d);
      if (ok) {
        b.guests = d.travellers.map((p) => ({ ...p }));
        b.adults = d.travellers.filter((p) => { const a = ageAt(p.birth, b.arrival); return a === null || a >= TARIFFS.childAge; }).length;
        b.children = d.travellers.length - b.adults;
        b.doc = d.travellers[0].nat === 'CH' ? { type: 'other', no: 'Heimatort ' + d.heimatort, exp: '' } : { type: d.docType, no: d.docNo, exp: d.docExp };
        b.address = `${d.street}, ${d.zip} ${d.city}`;
        b.status = 'precheckin';
        b.precheckinAt = new Date().toISOString();
        d.step = 4;
        feed('feed.precheckin', { name: `${b.main.first} ${b.main.last}`, id: b.id });
      }
    });
    if (!ok) toast(t('g.consentErr', {}, gl(b)), 'err');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  'g.wallet': () => { toast(t('g.walletToast', {}, gl(curBooking())), 'info'); },
};

export const guestChanges = {
  guestLang: (v) => update((s) => { s.guestLang = v; }),
};
