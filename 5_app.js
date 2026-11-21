<script>
/* ================= 外框 ================= */
function side() {
  const badge = { approvals: pendingAp(), receipts: DB.receipts.filter(r => !r.claimed).length, ar: arOpen().filter(r => daysPast(r.due) > 0).length, samples: DB.samples.filter(s => s.st === '逾期未还').length };
  const cur = S.view === 'contract' ? 'contracts' : S.view;
  $('side').innerHTML = `<div class="brand"><span class="mk">光</span><div><b>光数外贸</b><small>演示版 v0.5 · 示例数据</small></div></div>` +
    NAV.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([k, n]) => `<button type="button" class="nav" data-go="${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic(k)}<span>${n}</span>${badge[k] ? `<span class="ct ${k === 'approvals' || k === 'ar' ? 'hot' : ''}">${badge[k]}</span>` : ''}</button>`).join('')).join('') +
    `<div class="foot">所有客户、金额、人名均为虚构示例。<br>标“易助”的资料表示上线后由易助只读同步。</div>`;
}
function topbar() {
  const t = TITLE[S.view] || ['', ''];
  const sk = document.documentElement.dataset.skin;
  $('top').innerHTML = `<button class="menu" type="button" data-act="menu" aria-label="打开导航">${ic('menu')}</button>
    <div class="crumb">${t[0]} <span>›</span> <b>${S.view === 'contract' ? (S.arg || '合同明细') : t[1]}</b></div>
    <div class="search">${ic('search')}<input id="q" type="search" placeholder="搜索 PI 号、XS 号、客户、工单" autocomplete="off" aria-label="搜索"><div class="results" id="results" hidden></div></div>
    <div class="skin" role="group" aria-label="外观"><button type="button" data-act="skin" data-id="light" aria-pressed="${sk !== 'dark'}">${ic('sun')}<span>浅色</span></button><button type="button" data-act="skin" data-id="dark" aria-pressed="${sk === 'dark'}">${ic('moon')}<span>深色</span></button></div>
    <span class="who" title="林晓 · 业务">林</span>`;
}
function drawer() {
  $('layer').innerHTML = S.drawer ? `<div class="layer" data-act="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="客户中心">${custDrawer(S.drawer)}</aside>` : '';
}
function render() {
  side(); topbar();
  $('main').innerHTML = `<div class="view">${V[S.view]()}</div>`;
  drawer();
}
function go(spec) {
  const [v, a, t] = String(spec).split('|');
  if (v === 'customers' && a) { S.view = 'customers'; S.drawer = a; render(); return; }
  if (v === 'contracts' && a) { S.scF = a; S.view = 'contracts'; S.arg = null; }
  else if (v === 'ship' && a) { S.shipSel = a; S.view = 'ship'; S.arg = null; }
  else if (v === 'receipts' && a) { S.recSel = a; S.view = 'receipts'; S.arg = null; }
  else { S.view = V[v] ? v : 'dash'; S.arg = a || null; if (v === 'contract') S.tab = t || 'lines'; }
  S.drawer = null; $('side').classList.remove('open');
  render(); window.scrollTo(0, 0);
  try { if (location.hash !== '#' + S.view) history.replaceState(null, '', '#' + S.view); } catch (_) {}
}

/* ================= 外观：浅色＝素白，深色＝墨石 ================= */
let skinSaved = null;
try { skinSaved = localStorage.getItem('erp5-skin'); } catch (_) {}
function systemSkin() {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark' || t === 'light') return t;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applySkin(s) { document.documentElement.dataset.skin = s; }
applySkin(skinSaved || systemSkin());
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!skinSaved) { applySkin(systemSkin()); topbar(); } }); } catch (_) {}
try { new MutationObserver(() => { if (!skinSaved) { const s = systemSkin(); if (document.documentElement.dataset.skin !== s) { applySkin(s); topbar(); } } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (_) {}

/* ================= 需求确认导出 ================= */
function save() { try { localStorage.setItem('erp5-req', JSON.stringify(S.choice)); localStorage.setItem('erp5-note', JSON.stringify(S.note)); } catch (_) {} }
function exportText() {
  const lines = ['【外贸 ERP 需求确认结果 · v0.5】'];
  REQ.forEach(([g, , items]) => {
    lines.push('', `■ ${g}`);
    items.forEach(([id, name]) => { lines.push(`- ${name}：${CH[S.choice[id]] || '未选'}`); if (S.note[id]) lines.push(`  意见：${S.note[id]}`); });
  });
  if (S.note._all) lines.push('', '■ 其他意见', S.note._all);
  return lines.join('\n');
}

let tt;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 2800); }
function keep(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }
let seqQ = 3, seqP = 1;

/* ================= 操作 ================= */
const ACT = {
  toast: el => toast(el.dataset.msg),
  menu: () => $('side').classList.toggle('open'),
  skin: el => { skinSaved = el.dataset.id; try { localStorage.setItem('erp5-skin', skinSaved); } catch (_) {} applySkin(skinSaved); topbar(); },
  close: () => { S.drawer = null; drawer(); },
  openCust: el => { S.drawer = el.dataset.id; drawer(); },
  claimCust: el => { const c = custOf(el.dataset.id); c.pool = '私海'; c.sales = '林晓'; keep(render); toast(`已领取 ${c.short}，归属林晓`); },
  custF: el => { S.custF = el.dataset.id; keep(render); },
  scF: el => { S.scF = el.dataset.id; keep(render); },
  sampleF: el => { S.sampleF = el.dataset.id; keep(render); },
  arF: el => { S.arF = el.dataset.id; keep(render); },
  tab: el => { S.tab = el.dataset.id; keep(render); },
  shipSel: el => { S.shipSel = el.dataset.id; keep(render); },
  recSel: el => { S.recSel = el.dataset.id; S.arg = null; keep(render); },
  traceSel: el => { S.traceSel = el.dataset.id; keep(render); },
  perfRule: el => { S.perfRule = el.dataset.id; keep(render); },
  perfCash: () => { S.perfCash = !S.perfCash; keep(render); },
  apply: () => { ALL.forEach(r => { S.choice[r[0]] = r[2] === 'r2' || r[2] === 'ro' ? 'later' : 'yes'; }); save(); keep(render); toast('已按建议选好，可以再逐项调整'); },
  reset: () => { S.choice = {}; save(); keep(render); toast('已清空选择'); },
  copy: () => { const t = $('exportText'); const done = () => toast('已复制，可以贴到微信或邮件');
    try { navigator.clipboard.writeText(t.value).then(done, () => { t.select(); toast('请按 Ctrl+C 复制已选中的文字'); }); } catch (_) { t.select(); toast('请按 Ctrl+C 复制已选中的文字'); } },
  approve: el => {
    const a = DB.approvals.find(x => x.id === el.dataset.id); a.status = '已核准';
    if (a.ref === 'PI20261009MNO') { const c = scOf(a.ref); delete c.block; c.xs = 'XS20261100075'; c.node = 3; DB.batches.unshift(['IMP-1118-01', '11-18 10:32', '订单', 'PI20261009MNO → XS20261100075', '已汇入']); DB.batches = DB.batches.filter(b => b[0] !== 'IMP-1109-01'); toast('已核准，订单已汇入易助 XS20261100075'); }
    else if (a.ref === 'BG-0013') { const ch = DB.changes.find(x => x.id === 'BG-0013'); ch.st = '已同步易助'; scOf(ch.pi).ver = 2; toast('已核准，易助订单变更单 V002 已建立'); }
    else if (a.ref === 'BJ2026111702') { DB.quotes.find(q => q.id === a.ref).status = '已批准'; toast('已核准，报价可以转 PI'); }
    else toast('已核准');
    keep(render);
  },
  reject: el => { const a = DB.approvals.find(x => x.id === el.dataset.id); a.status = '已退回'; keep(render); toast(`已退回给 ${a.who}`); },
  saveQuote: () => {
    const q = S.q, id = 'BJ20261118' + String(seqQ++).padStart(2, '0'), low = S.calc.rate < 12;
    DB.quotes.unshift({ id, ver: 1, cust: q.cust, prod: q.prod, qty: q.qty, price: +S.calc.price.toFixed(2), margin: +S.calc.rate.toFixed(1), status: low ? '待审批' : '已发客户', att: 0, sales: '林晓' });
    if (low) DB.approvals.unshift({ id: 'AP-4' + (13 + seqQ), type: '报价毛利低于门槛', ref: id, who: '林晓', detail: `毛利 ${fmt(S.calc.rate, 1)}%，门槛 12%`, status: '待审批', step: '第 1 层 · 业务主管', go: 'quote' });
    keep(render); toast(low ? `${id} 已保存并送业务主管审批` : `${id} 已保存`);
  },
  toContract: el => {
    const q = DB.quotes.find(x => x.id === el.dataset.id), cu = custOf(q.cust);
    const pi = 'PI20261118' + cu.short.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    q.status = '已转合同'; q.pi = pi;
    DB.contracts.unshift({ pi, xs: '', cust: q.cust, type: '外销', term: 'FOB 深圳', cur: 'USD', sales: q.sales, lines: [[q.prod, q.qty, q.price]], node: 1, ver: 1, pay: [['订金 30%', +(q.qty * q.price * .3).toFixed(2), '11-25', '未收'], ['出货前 70%', +(q.qty * q.price * .7).toFixed(2), '12-20', '未收']], wo: [], ww: '', ck: '', xh: '', zp: '', est: Math.round(q.qty * q.price * curLock()[1] * q.margin / 100), act: null, co: '—', late: 0, use: '量产' });
    go('contract|' + pi); toast(`已生成 ${pi}，确认后汇入易助`);
  },
  advance: el => {
    const c = scOf(el.dataset.id), n = NODES[c.type];
    if (c.node === 1 && !c.xs) { c.xs = 'XS2026111' + String(80 + seqP++); DB.batches.unshift(['IMP-1118-0' + seqP, '11-18 10:40', '订单', `${c.pi} → ${c.xs}`, '已汇入']); }
    c.node = Math.min(c.node + 1, n.length - 1); c.late = 0;
    keep(render); toast(`${c.pi} 进入「${n[c.node]}」${c.node === 2 ? '，订单已汇入易助 ' + c.xs : ''}`);
  },
  sampleWin: el => { const s = DB.samples.find(x => x.id === el.dataset.id); s.st = '已转订单'; s.note = '测试通过，已建立报价单'; S.q.cust = s.cust; S.q.prod = s.prod; go('quote'); toast(`${custOf(s.cust).short} 测试通过，已带入报价`); },
  genDocs: el => { const s = DB.ships.find(x => x.id === el.dataset.id); Object.keys(s.docs).forEach(k => { s.docs[k] = 1; }); keep(render); toast(`${s.id} 单证已全部生成并存档`); },
  afterNext: el => { const a = DB.after.find(x => x.id === el.dataset.id); a.step = Math.min(a.step + 1, a.steps.length - 1); keep(render); toast(`${a.id} 进入「${a.steps[a.step]}」`); },
  claim: el => {
    const [pi, i] = el.dataset.id.split('|'), c = scOf(pi), r = DB.receipts.find(x => x.id === S.recSel);
    const ack = $('ackPayer');
    if (ack && !ack.checked) { toast('请先确认已取得客户付款委托书'); ack.focus(); return; }
    c.pay[+i][3] = '已收'; r.claimed = `${pi} · ${c.pay[+i][0]}`; r.rate = curLock()[1]; r.yz = '已通知出纳在易助开收款单';
    DB.fx.unsettled += r.amt;
    keep(render); toast(`已认领到 ${pi}，折合 ¥${fmt(r.amt * r.rate, 2)}`);
  },
  dun: el => { const r = DB.ar.find(x => x.zp === el.dataset.id); r.log.unshift(['11-18', custOf(r.cust).ch, '已提醒付款，等待客户回复']); keep(render); toast(`已记录 ${r.zp} 的跟催`); },
  settle: () => {
    const a = Math.min(+$('fx-amt').value || 0, DB.fx.unsettled), rate = +$('fx-rate').value || 0;
    if (!a || !rate) { toast('请填写结汇金额与汇率'); return; }
    DB.fx.hist.unshift(['11-18', a, rate, '本次结汇']); DB.fx.unsettled -= a;
    const diff = a * (rate - curLock()[1]);
    keep(render); toast(`已登记结汇 USD ${fmt(a)}，汇差 ${diff >= 0 ? '+' : '−'}¥${fmt(Math.abs(diff), 2)}`);
  }
};

/* ================= 搜索 ================= */
function searchIndex() {
  return [
    ...DB.contracts.map(c => [c.pi + ' ' + c.xs + ' ' + custOf(c.cust).name, c.pi, `${custOf(c.cust).short}${c.xs ? ' · ' + c.xs : ''}`, 'contract|' + c.pi]),
    ...DB.customers.map(c => [c.name + ' ' + c.short + ' ' + c.yz, c.name, c.country, 'customers|' + c.id]),
    ...DB.quotes.map(q => [q.id + ' ' + custOf(q.cust).name, q.id, '报价单', 'quote']),
    ...DB.wos.map(w => [w.id + ' ' + w.xs, w.id, '易助工单', 'prod']),
    ...DB.samples.map(s => [s.id + ' ' + s.jc + ' ' + custOf(s.cust).name, s.id, '样品', 'samples'])
  ];
}
function search(v) {
  const box = $('results'); if (!box) return;
  const k = v.trim().toLowerCase();
  if (!k) { box.hidden = true; return; }
  const hits = searchIndex().filter(x => x[0].toLowerCase().includes(k)).slice(0, 8);
  box.innerHTML = hits.length ? hits.map(h => `<button type="button" data-go="${h[3]}"><span class="m">${esc(h[1])}</span><small>${esc(h[2])}</small></button>`).join('') : '<div class="note" style="margin:8px 10px">没有找到符合的结果</div>';
  box.hidden = false;
}

/* ================= 事件 ================= */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'), a = e.target.closest('[data-act]'), r = e.target.closest('[data-req]');
  if (r) { S.choice[r.dataset.req] = r.dataset.v; save(); keep(render); return; }
  if (a && a.tagName !== 'INPUT' && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a); return; }
  if (g) { e.preventDefault(); go(g.dataset.go); return; }
  if (!e.target.closest('.search')) { const b = $('results'); if (b) b.hidden = true; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act && ACT[t.dataset.act]) { ACT[t.dataset.act](t); return; }
  if (t.dataset.qs) { S.q[t.dataset.qs] = t.value; if (t.dataset.qs === 'prod') S.q.cost = prodOf(t.value).cost; keep(render); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.note) { S.note[t.dataset.note] = t.value; save(); const ex = $('exportText'); if (ex) ex.value = exportText(); }
  if (t.dataset.q) { const v = parseFloat(t.value); if (!isNaN(v)) { S.q[t.dataset.q] = v; const id = t.id, pos = t.selectionStart; keep(render); const n = $(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} } } }
  if (t.id === 'q') search(t.value);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (S.drawer) ACT.close(); const b = $('results'); if (b) b.hidden = true; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const q = $('q'); if (q) q.focus(); }
});

const start = (location.hash || '').replace('#', '');
S.view = V[start] ? start : 'dash';
render();
</script>
