import { state, update, host, booking, bookingLevy, invoiceAmounts, meldescheine, feed, runningNights, docLabel } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, chf, num, fdate, fdt, frange, fmonth, statusChip, kpi, toast, openDrawer, closeDrawer, field, formData, chip } from '../ui.js';
import { DEMO_TODAY } from '../data.js';

const H = () => host('H1');
const arrivals = () => state.bookings.filter((b) => b.host === 'H1' && b.arrival === DEMO_TODAY);
const inHouse = () => state.bookings.filter((b) => b.host === 'H1' && b.status === 'checkedin');
const curInv = () => state.invoices.find((i) => i.id === 'R-2026-10-H1');

export function hostNext() {
  const ready = arrivals().filter((b) => b.status === 'precheckin');
  const claire = booking('B-24017');
  const inv = curInv();
  if (ready.length) return { title: t('h.nextReady', { n: ready.length }), text: t('h.nextReadyT'), cta: t('h.toArrivals'), href: '#/gastgeber/ankuenfte', icon: 'id' };
  if (claire.status === 'invited') return { title: t('h.nextInvited'), text: t('h.nextInvitedT'), cta: t('h.toArrivals'), href: '#/gastgeber/ankuenfte', icon: 'mail' };
  if (inv.status === 'review') return { title: t('h.nextInvoice'), text: t('h.nextInvoiceT', { due: fdate(inv.due) }), cta: t('h.toInvoice'), href: '#/gastgeber/abrechnungen', icon: 'file' };
  return { title: t('h.nextNone'), text: t('h.nextNoneT'), cta: t('h.toArrivals'), href: '#/gastgeber/ankuenfte', icon: 'checkCircle', calm: true };
}

export function hostView(tab) {
  const h = H();
  switch (tab) {
    case 'ankuenfte': return arrivalsView(h);
    case 'meldungen': return reportsView(h);
    case 'abrechnungen': return invoicesView(h);
    case 'objekte': return objectsView(h);
    case 'konto': return accountView(h);
    default: return overview(h);
  }
}

function overview(h) {
  const arr = arrivals();
  const pre = arr.filter((b) => b.status !== 'invited').length;
  const inv = curInv();
  const a = invoiceAmounts(inv);
  const quote = Math.round((pre / arr.length) * 100);
  return {
    title: t('h.hello', { name: 'Sandra' }),
    sub: `${h.name} · ${fdate(DEMO_TODAY)}`,
    next: hostNext(),
    body: `<div class="grid-kpi">
      ${kpi(t('h.kArrivals'), String(arr.length), t('h.kArrivalsSub', { n: pre }), 'calendar')}
      ${kpi(t('h.kQuote'), quote + ' %', t('h.kQuoteSub'), 'checkCircle', 'kpi-ok')}
      ${kpi(t('h.kInHouse'), String(inHouse().length), t('h.kInHouseSub'), 'bed')}
      ${kpi(t('h.kInvoice'), chf(a.total), t('status.' + inv.status), 'file', inv.status === 'review' ? 'kpi-warn' : 'kpi-ok')}
    </div>
    <div class="grid-2 gap">
      <section class="card">
        <div class="card-head"><h2>${icon('calendar', 20)} ${esc(t('h.today'))}</h2><a class="link" href="#/gastgeber/ankuenfte">${esc(t('common.all'))} ${icon('chevronRight', 16)}</a></div>
        <ul class="rows">${arr.map((b) => `<li><div><strong>${esc(b.main.first)} ${esc(b.main.last)}</strong>${b.group ? ` <span class="chip chip-neutral">${esc(t('h.group'))}</span>` : ''}<span class="muted">${esc(b.room)} · ${esc(t('h.persons', { n: b.adults + b.children }))}</span></div>${statusChip(b.status)}</li>`).join('')}</ul>
      </section>
      <section class="card">
        <div class="card-head"><h2>${icon('zap', 20)} ${esc(t('h.auto'))}</h2></div>
        <p class="muted">${esc(t('h.autoText'))}</p>
        <ul class="ticks">
          <li>${esc(t('h.auto1'))}</li><li>${esc(t('h.auto2'))}</li><li>${esc(t('h.auto3'))}</li><li>${esc(t('h.auto4'))}</li>
        </ul>
        <div class="integr">${chip('ok', t('h.pmsOn'), 'link')}${chip('ok', t('h.cmOn'), 'link')}</div>
      </section>
    </div>`,
  };
}

function arrivalsView(h) {
  const arr = arrivals();
  const rows = arr.map((b) => {
    let act = '';
    if (b.status === 'precheckin') act = `<button class="btn btn-primary btn-sm" data-action="h.checkin" data-arg="${b.id}">${icon('id', 16)} ${esc(t('h.doCheckin'))}</button>`;
    else if (b.status === 'invited') act = `<button class="btn btn-secondary btn-sm" data-action="h.remind" data-arg="${b.id}">${icon('send', 16)} ${esc(t('h.remind'))}</button> <button class="btn btn-ghost btn-sm" data-action="h.desk" data-arg="${b.id}">${icon('edit', 16)} ${esc(t('h.desk'))}</button>`;
    else act = `<button class="btn btn-ghost btn-sm" data-action="h.showMs" data-arg="${b.id}">${icon('file', 16)} ${esc(t('h.viewMs'))}</button>`;
    return `<tr class="${b.id === 'B-24017' ? 'row-hl' : ''}">
      <td data-label="${esc(t('h.colGuest'))}"><strong>${esc(b.main.first)} ${esc(b.main.last)}</strong>${b.group ? ` <span class="chip chip-neutral">${esc(t('h.group'))}</span>` : ''}<div class="muted small">${esc(b.id)} · ${esc(b.email)}</div></td>
      <td data-label="${esc(t('h.colStay'))}">${esc(frange(b.arrival, b.departure))}<div class="muted small">${esc(t('h.persons', { n: b.adults + b.children }))} · ${esc(b.room)}</div></td>
      <td data-label="${esc(t('h.colStatus'))}">${statusChip(b.status)}${b.status === 'invited' ? `<div class="muted small">${esc(t('h.linkSent', { at: fdt(b.invitedAt) }))}</div>` : ''}</td>
      <td data-label="" class="td-act">${act}</td>
    </tr>`;
  }).join('');
  const house = inHouse().filter((b) => b.arrival !== DEMO_TODAY);
  return {
    title: t('h.arrivalsTitle'),
    sub: t('h.arrivalsSub', { date: fdate(DEMO_TODAY) }),
    next: hostNext(),
    body: `<div class="note">${icon('info', 18)}<span>${esc(t('h.arrivalsNote'))}</span></div>
    <section class="card p0"><table class="tbl"><thead><tr><th>${esc(t('h.colGuest'))}</th><th>${esc(t('h.colStay'))}</th><th>${esc(t('h.colStatus'))}</th><th><span class="sr">${esc(t('common.action'))}</span></th></tr></thead><tbody>${rows}</tbody></table></section>
    <section class="card"><div class="card-head"><h2>${icon('bed', 20)} ${esc(t('h.inHouse'))}</h2></div>
      <ul class="rows">${house.map((b) => `<li><div><strong>${esc(b.main.first)} ${esc(b.main.last)}</strong><span class="muted">${esc(frange(b.arrival, b.departure))} · ${esc(b.room)}</span></div>${statusChip('checkedin')}</li>`).join('') || `<li class="muted">–</li>`}</ul></section>`,
  };
}

function reportsView(h) {
  const list = meldescheine().filter((m) => m.host === 'H1' && !m.companion);
  const q = (state.ui.hostQ || '').toLowerCase();
  const fl = list.filter((m) => !q || `${m.first} ${m.last} ${m.ms}`.toLowerCase().includes(q));
  return {
    title: t('h.reportsTitle'),
    sub: t('h.reportsSub'),
    body: `<div class="toolbar"><label class="search">${icon('search', 18)}<input type="search" value="${esc(state.ui.hostQ || '')}" placeholder="${esc(t('h.searchPh'))}" data-input="hostQ" aria-label="${esc(t('common.search'))}"></label></div>
    <section class="card p0"><table class="tbl"><thead><tr><th>${esc(t('h.colMs'))}</th><th>${esc(t('h.colGuest'))}</th><th>${esc(t('h.colStay'))}</th><th>${esc(t('h.colStatus'))}</th></tr></thead><tbody>
    ${fl.map((m) => `<tr><td data-label="${esc(t('h.colMs'))}" class="mono">${esc(m.ms)}</td><td data-label="${esc(t('h.colGuest'))}"><strong>${esc(m.first)} ${esc(m.last)}</strong><div class="muted small">${esc(m.nat)} · ${esc(t('h.persons', { n: m.persons }))}</div></td><td data-label="${esc(t('h.colStay'))}">${esc(frange(m.arrival, m.departure))}</td><td data-label="${esc(t('h.colStatus'))}">${chip('ok', t('h.reported'), 'check')}</td></tr>`).join('')}
    </tbody></table></section>
    <p class="muted small">${icon('lock', 14)} ${esc(t('h.reportsNote'))}</p>`,
  };
}

function invoiceDetail(inv) {
  const a = invoiceAmounts(inv);
  return `<div class="inv">
    <div class="inv-row"><span>${esc(t('h.invNights'))}</span><span>${esc(num(inv.nights))}</span></div>
    <div class="inv-row muted"><span>${esc(t('h.invExempt'))}</span><span>− ${esc(num(inv.exempt))}</span></div>
    <div class="inv-row"><strong>${esc(t('h.invCharge'))}</strong><strong>${esc(num(a.chargeable))}</strong></div>
    <hr>
    <div class="inv-row"><span>${esc(t('h.invKurtaxe', { r: a.rate.kurtaxe.toFixed(2) }))}</span><span>${esc(chf(a.kurtaxe))}</span></div>
    <div class="inv-row"><span>${esc(t('h.invOertlich', { r: a.rate.oertlich.toFixed(2) }))}</span><span>${esc(chf(a.oertlich))}</span></div>
    <div class="inv-row"><span>${esc(t('h.invKantonal', { r: a.rate.kantonal.toFixed(2) }))}</span><span>${esc(chf(a.kantonal))}</span></div>
    <div class="inv-row inv-total"><strong>${esc(t('h.invTotal'))}</strong><strong>${esc(chf(a.total))}</strong></div>
  </div>`;
}

function invoicesView(h) {
  const inv = curInv();
  const hist = state.invoices.filter((i) => i.host === 'H1');
  const running = runningNights('H1');
  const reviewCard = inv.status === 'review' ? `<section class="card card-focus">
      <div class="card-head"><h2>${icon('file', 20)} ${esc(t('h.invTitle', { m: fmonth(inv.period) }))}</h2>${statusChip(inv.status)}</div>
      <p class="muted">${esc(t('h.invAuto', { due: fdate(inv.due) }))}</p>
      ${invoiceDetail(inv)}
      <div class="btn-row"><button class="btn btn-primary" data-action="h.pay">${icon('check', 18)} ${esc(t('h.confirmPay'))}</button><button class="btn btn-secondary" data-action="h.correct">${icon('edit', 18)} ${esc(t('h.correct'))}</button></div>
    </section>` : `<section class="card card-ok"><div class="card-head"><h2>${icon('checkCircle', 20)} ${esc(t('h.invTitle', { m: fmonth(inv.period) }))}</h2>${statusChip(inv.status)}</div><p>${esc(t('h.invPaid', { at: fdate(inv.paidAt) }))}</p>${invoiceDetail(inv)}</section>`;
  return {
    title: t('h.invoicesTitle'),
    sub: t('h.invoicesSub'),
    next: hostNext(),
    body: `<div class="grid-2 gap">${reviewCard}
      <section class="card"><div class="card-head"><h2>${icon('clock', 20)} ${esc(t('h.running', { m: fmonth('2026-11') }))}</h2>${chip('info', t('h.live'), 'zap')}</div>
        <div class="big-num">${esc(num(running))}</div><p class="muted">${esc(t('h.runningText'))}</p>
        <div class="note">${icon('info', 18)}<span>${esc(t('h.runningNote'))}</span></div>
      </section></div>
    <section class="card p0"><div class="card-head pad"><h2>${esc(t('h.history'))}</h2></div><table class="tbl"><thead><tr><th>${esc(t('h.colPeriod'))}</th><th>${esc(t('h.invCharge'))}</th><th>${esc(t('h.invTotal'))}</th><th>${esc(t('h.colStatus'))}</th><th><span class="sr">PDF</span></th></tr></thead><tbody>
      ${hist.map((i) => { const a = invoiceAmounts(i); return `<tr><td data-label="${esc(t('h.colPeriod'))}"><strong>${esc(fmonth(i.period))}</strong><div class="muted small mono">${esc(i.id)}</div></td><td data-label="${esc(t('h.invCharge'))}">${esc(num(a.chargeable))}</td><td data-label="${esc(t('h.invTotal'))}">${esc(chf(a.total))}</td><td data-label="${esc(t('h.colStatus'))}">${statusChip(i.status)}</td><td class="td-act"><button class="btn btn-ghost btn-sm" data-action="toastInfo" data-arg="${esc(t('common.pdfToast'))}">${icon('download', 16)} PDF</button></td></tr>`; }).join('')}
    </tbody></table></section>`,
  };
}

function objectsView(h) {
  const regs = state.registrations;
  return {
    title: t('h.objectsTitle'),
    sub: t('h.objectsSub'),
    actions: `<a class="btn btn-primary" href="#/registrierung">${icon('plus', 18)} ${esc(t('h.addObject'))}</a>`,
    body: `<div class="grid-2 gap"><section class="card">
      <div class="card-head"><h2>${icon('bed', 20)} ${esc(h.name)}</h2>${chip('ok', t('h.registered'), 'check')}</div>
      <dl class="dl">
        <dt>${esc(t('h.objNo'))}</dt><dd class="mono">${esc(h.objectNo)}</dd>
        <dt>${esc(t('h.address'))}</dt><dd>${esc(h.address)}</dd>
        <dt>${esc(t('h.municipality'))}</dt><dd>${esc(h.municipality)} (BFS ${h.bfs})</dd>
        <dt>${esc(t('h.category'))}</dt><dd>${esc(t('cat.' + h.cat))}</dd>
        <dt>${esc(t('h.capacity'))}</dt><dd>${esc(t('h.capacityV', { r: h.rooms, b: h.beds }))}</dd>
      </dl></section>
      <section class="card"><div class="card-head"><h2>${icon('link', 20)} ${esc(t('h.channels'))}</h2></div>
        <ul class="rows">
          <li><div><strong>${esc(t('h.pms'))}</strong><span class="muted">${esc(t('h.pmsT'))}</span></div>${chip('ok', t('common.connected'), 'check')}</li>
          <li><div><strong>${esc(t('h.cm'))}</strong><span class="muted">${esc(t('h.cmT'))}</span></div>${chip('ok', t('common.connected'), 'check')}</li>
          <li><div><strong>${esc(t('h.webapp'))}</strong><span class="muted">${esc(t('h.webappT'))}</span></div>${chip('neutral', t('common.available'))}</li>
        </ul></section></div>
      ${regs.length ? `<section class="card"><div class="card-head"><h2>${esc(t('h.newRegs'))}</h2></div><ul class="rows">${regs.map((r) => `<li><div><strong>${esc(r.name)}</strong><span class="muted">${esc(r.address)} · ${esc(r.objectNo)}</span></div>${chip('ok', t('h.registered'), 'check')}</li>`).join('')}</ul></section>` : ''}`,
  };
}

function accountView(h) {
  return {
    title: t('acc.title'),
    sub: `${h.contact} · ${h.name}`,
    body: `<div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${icon('user', 20)} ${esc(t('acc.profile'))}</h2></div>
        <dl class="dl"><dt>${esc(t('acc.name'))}</dt><dd>Sandra Meier</dd><dt>${esc(t('acc.role'))}</dt><dd>${esc(t('acc.roleAdmin'))}</dd><dt>${esc(t('acc.email'))}</dt><dd>${esc(h.email)}</dd><dt>${esc(t('acc.login'))}</dt><dd>${icon('key', 15)} ${esc(t('acc.passkey'))}</dd></dl></section>
      <section class="card"><div class="card-head"><h2>${icon('users', 20)} ${esc(t('acc.users'))}</h2><button class="btn btn-ghost btn-sm" data-action="toastInfo" data-arg="${esc(t('common.protoToast'))}">${icon('plus', 16)} ${esc(t('acc.invite'))}</button></div>
        <ul class="rows"><li><div><strong>Sandra Meier</strong><span class="muted">${esc(t('acc.roleAdmin'))}</span></div>${chip('ok', t('acc.active'))}</li><li><div><strong>Luca Brunner</strong><span class="muted">${esc(t('acc.roleFront'))}</span></div>${chip('ok', t('acc.active'))}</li><li><div><strong>Treuhand Brun AG</strong><span class="muted">${esc(t('acc.roleFinance'))}</span></div>${chip('neutral', t('acc.readonly'))}</li></ul></section>
      <section class="card"><div class="card-head"><h2>${icon('wallet', 20)} ${esc(t('acc.payment'))}</h2></div>
        <dl class="dl"><dt>IBAN</dt><dd class="mono">CH93 0076 2011 6238 5295 7</dd><dt>${esc(t('acc.ebill'))}</dt><dd>${chip('ok', t('acc.ebillOn'), 'check')}</dd></dl></section>
      <section class="card"><div class="card-head"><h2>${icon('bell', 20)} ${esc(t('acc.notif'))}</h2></div>
        ${toggle('n1', t('acc.n1'), true)}${toggle('n2', t('acc.n2'), true)}${toggle('n3', t('acc.n3'), false)}</section>
    </div>`,
  };
}

export function toggle(id, label, on) {
  return `<label class="toggle"><input type="checkbox" ${on ? 'checked' : ''} data-action="noop"><span class="tg"></span><span>${esc(label)}</span></label>`;
}

// ---------- Aktionen ----------
function checkinDrawer(b) {
  const lv = bookingLevy(b);
  const people = (b.guests || []).map((g) => `<li><span>${esc(g.first)} ${esc(g.last)}</span><span class="muted">${esc(fdate(g.birth))} · ${esc(g.nat)}</span></li>`).join('');
  return `<form data-submit="h.confirmCheckin" data-arg="${b.id}" class="stack">
    <div class="ms-card"><div class="ms-head"><span>${icon('user', 18)} ${esc(t('h.guestData'))}</span>${chip('info', t('status.precheckin'), 'checkCircle')}</div>
      <ul class="rv-list">${people}</ul>
      ${b.group ? `<p class="muted small">${esc(t('h.groupNote'))}</p>` : ''}
    </div>
    <div class="ms-card"><div class="ms-head"><span>${icon('id', 18)} ${esc(t('h.idDoc'))}</span></div>
      <p><strong>${esc(docLabel(b.doc.type))}</strong> · <span class="mono">${esc(b.doc.no)}</span>${b.doc.exp ? ` · ${esc(t('g.validUntil'))} ${esc(fdate(b.doc.exp))}` : ''}</p>
    </div>
    <label class="check"><input type="checkbox" name="idok" required><span>${esc(t('h.idCheck'))}</span></label>
    <div class="note">${icon('zap', 18)}<span>${esc(t('h.onConfirm', { n: lv.nights, amount: chf(lv.total) }))}</span></div>
    <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('check', 20)} ${esc(t('h.confirmCheckin'))}</button>
  </form>`;
}

function doCheckin(b) {
  update(() => {
    b.status = 'checkedin';
    b.checkedInAt = new Date().toISOString();
    b.ms = 'MS-2026-' + (118734 + state.bookings.filter((x) => x.status === 'checkedin').length);
    const lv = bookingLevy(b);
    feed('feed.ms', { ms: b.ms, name: `${b.main.first} ${b.main.last}`, host: host(b.host).name });
    feed('feed.levy', { n: lv.nights, amount: chf(lv.total), id: b.id });
    feed('feed.card', { name: `${b.main.first} ${b.main.last}` });
  });
}

export const hostActions = {
  'h.checkin': (id) => { const b = booking(id); openDrawer(checkinDrawer(b), t('h.checkinTitle', { name: `${b.main.first} ${b.main.last}` })); },
  'h.confirmCheckin': (id, form) => {
    if (!form.querySelector('[name=idok]').checked) { toast(t('h.idRequired'), 'err'); return; }
    const b = booking(id);
    doCheckin(b);
    closeDrawer();
    toast(t('h.checkedIn', { ms: b.ms }), 'ok');
  },
  'h.remind': (id) => { const b = booking(id); update(() => feed('feed.remind', { name: `${b.main.first} ${b.main.last}` })); toast(t('h.reminded', { email: b.email }), 'ok'); },
  'h.desk': (id) => {
    const b = booking(id);
    openDrawer(`<form data-submit="h.deskSave" data-arg="${b.id}" class="stack">
      <p class="muted">${esc(t('h.deskHint'))}</p>
      <button type="button" class="btn btn-secondary btn-block" data-action="h.deskScan">${icon('camera', 18)} ${esc(t('h.deskScan'))}</button>
      ${field('first', t('g.first'), { value: b.main.first, required: true })}
      ${field('last', t('g.last'), { value: b.main.last, required: true })}
      ${field('birth', t('g.birth'), { type: 'date', value: '', required: true })}
      ${b.main.nat === 'CH' ? field('doc', t('g.heimatort'), { value: '', required: true }) : field('doc', t('g.docNo'), { value: '', required: true })}
      <label class="check"><input type="checkbox" name="idok" required><span>${esc(t('h.idCheck'))}</span></label>
      <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('check', 20)} ${esc(t('h.confirmCheckin'))}</button>
    </form>`, t('h.deskTitle', { name: `${b.main.first} ${b.main.last}` }));
  },
  'h.deskScan': () => {
    const f = document.querySelector('.drawer form');
    if (!f) return;
    f.querySelector('[name=birth]').value = '1979-02-17';
    f.querySelector('[name=doc]').value = 'Luzern';
    toast(t('h.deskScanned'), 'ok');
  },
  'h.deskSave': (id, form) => {
    const v = formData(form);
    if (!v.first || !v.last || !v.birth || !v.doc || !v.idok) { toast(t('g.fixErrors'), 'err'); return; }
    const b = booking(id);
    update(() => { b.guests = [{ first: v.first, last: v.last, birth: v.birth, nat: b.main.nat }]; b.doc = { type: b.main.nat === 'CH' ? 'other' : 'passport', no: b.main.nat === 'CH' ? 'Heimatort ' + v.doc : v.doc, exp: '' }; });
    doCheckin(b);
    closeDrawer();
    toast(t('h.checkedIn', { ms: b.ms }), 'ok');
  },
  'h.showMs': (id) => {
    const b = booking(id);
    const lv = bookingLevy(b);
    openDrawer(`<div class="stack"><div class="ms-card"><div class="ms-head"><span class="mono">${esc(b.ms)}</span>${chip('ok', t('h.reported'), 'check')}</div>
      <ul class="rv-list">${(b.guests || []).map((g) => `<li><span>${esc(g.first)} ${esc(g.last)}</span><span class="muted">${esc(fdate(g.birth))} · ${esc(g.nat)}</span></li>`).join('')}</ul>
      <p class="muted small">${esc(docLabel(b.doc.type))} · ${esc(b.doc.no)}</p></div>
      <div class="ms-card"><div class="ms-head"><span>${icon('wallet', 18)} ${esc(t('g.levyTitle'))}</span></div><p>${esc(t('g.levyCalc', { p: lv.payers, n: b.nights, rate: lv.rate.total.toFixed(2) }))}: <strong>${esc(chf(lv.total))}</strong></p></div>
      <div class="ms-card"><div class="ms-head"><span>${icon('ticket', 18)} ${esc(t('g.card'))}</span>${chip('ok', t('g.cardActive'))}</div></div></div>`, t('h.msTitle'));
  },
  'h.pay': () => {
    const inv = curInv();
    const a = invoiceAmounts(inv);
    openDrawer(`<div class="stack"><p>${esc(t('h.payIntro', { amount: chf(a.total) }))}</p>
      <button class="pay-opt" data-action="h.payWith" data-arg="ebill">${icon('phone', 22)}<span><strong>eBill</strong><span class="muted">${esc(t('h.payEbill'))}</span></span>${icon('chevronRight', 18)}</button>
      <button class="pay-opt" data-action="h.payWith" data-arg="qr">${icon('qr', 22)}<span><strong>${esc(t('h.payQr'))}</strong><span class="muted">${esc(t('h.payQrT'))}</span></span>${icon('chevronRight', 18)}</button>
      <button class="pay-opt" data-action="h.payWith" data-arg="lsv">${icon('refresh', 22)}<span><strong>${esc(t('h.payLsv'))}</strong><span class="muted">${esc(t('h.payLsvT'))}</span></span>${icon('chevronRight', 18)}</button>
    </div>`, t('h.payTitle'));
  },
  'h.payWith': () => {
    const inv = curInv();
    const a = invoiceAmounts(inv);
    update(() => {
      inv.status = 'paid'; inv.paidAt = DEMO_TODAY;
      feed('feed.paid', { amount: chf(a.total), host: H().name });
      feed('feed.dist', { k: chf(a.kurtaxe), o: chf(a.oertlich), c: chf(a.kantonal) });
    });
    closeDrawer();
    toast(t('h.paid'), 'ok');
  },
  'h.correct': () => {
    openDrawer(`<form data-submit="h.correctSend" class="stack"><p class="muted">${esc(t('h.correctHint'))}</p>${field('msg', t('h.correctMsg'), { type: 'textarea', required: true, value: '' })}<button class="btn btn-primary btn-block" type="submit">${icon('send', 18)} ${esc(t('common.send'))}</button></form>`, t('h.correct'));
  },
  'h.correctSend': () => { closeDrawer(); toast(t('h.correctSent'), 'ok'); },
};
