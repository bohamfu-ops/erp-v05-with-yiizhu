<script>
/* ================= 共用片段 ================= */
const pill = (t, k) => `<span class="pill p-${k}">${t}</span>`;
const mono = s => `<span class="m">${s}</span>`;
const piBtn = pi => `<button type="button" class="btn sm" data-go="contract|${pi}">${pi}</button>`;
const yzTag = '<span class="tag yz">易助</span>', ownTag = '<span class="tag own">本系统</span>';
function table(head, rows, opt = {}) {
  const n = opt.num || [];
  return `<div class="tbl"><table><thead><tr>${head.map((h, i) => `<th class="${n.includes(i) ? 'n' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, ri) => `<tr ${opt.click ? `class="click ${opt.sel && opt.sel(ri) ? 'sel' : ''}" ${opt.click(ri)}` : ''}>${r.map((c, i) => `<td class="${n.includes(i) ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const head = (t, p, right = '') => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div>${right}</div>`;
const yzBanner = what => `<div class="banner yz"><b>读自易助</b><span>${what}由易助只读同步，约每 15 分钟更新一次，只取已审核的单据。需要修改请在易助中操作。</span></div>`;
function spark(arr, color) {
  const w = 88, h = 32, max = Math.max(...arr), min = Math.min(...arr), r = max - min || 1;
  const pts = arr.map((v, i) => [i / (arr.length - 1) * (w - 4) + 2, h - 4 - (v - min) / r * (h - 8)]);
  const line = pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '), last = pts[pts.length - 1];
  return `<svg class="sp" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polygon points="2,${h - 2} ${line} ${w - 2},${h - 2}" fill="${color}" opacity=".12"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.5" fill="${color}"/></svg>`;
}
function scStatus(c) {
  if (c.block) return pill('待审批', 'warn');
  const n = NODES[c.type];
  if (c.node >= n.length - 1) return pill('已完成', 'ok');
  if (c.late) return pill(`${n[c.node]} · 逾期 ${c.late} 天`, 'bad');
  return pill(n[c.node], 'run');
}
function stepper(c) {
  const n = NODES[c.type], yz = YZN[c.type];
  return `<div class="stepper">${n.map((x, i) => `<div class="st ${i < c.node ? 'done' : i === c.node ? 'now' : ''}"><span class="dot">${i < c.node ? ic('check') : ''}</span>${x}${yz.includes(i) ? '<span class="tag yz" style="margin-top:-2px">易助</span>' : ''}</div>`).join('')}</div>`;
}
const agingBucket = d => d <= 0 ? '未到期' : d <= 30 ? '1–30 天' : d <= 60 ? '31–60 天' : d <= 90 ? '61–90 天' : d <= 180 ? '91–180 天' : '180 天以上';
const BUCKETS = [['未到期', 'var(--accent)'], ['1–30 天', 'var(--ok)'], ['31–60 天', 'var(--warn)'], ['61–90 天', '#D9822B'], ['91–180 天', 'var(--bad)'], ['180 天以上', '#8E1B13']];

/* ================= 页面 ================= */
const V = {};

V.req = () => {
  const c = ALL.filter(r => S.choice[r[0]]), n = k => ALL.filter(r => S.choice[r[0]] === k).length;
  const pct = Math.round(c.length / ALL.length * 100), nNew = ALL.filter(r => r[9]).length;
  return head('需求确认', `共 ${ALL.length} 项，其中 ${nNew} 项是看过易助实际用法后新增的（标“新增”）。逐项选“要”“之后再说”“不要”或“待讨论”，不确定的先点“看演示”。`,
    `<div class="toolbar"><button class="btn" type="button" data-act="apply">${ic('check')}全部按我们的建议选</button><button class="btn" type="button" data-act="reset">${ic('reset')}清空选择</button></div>`) + `
  <div class="card">
    <h3>进度 <small>已确认 ${c.length} / ${ALL.length} 项</small></h3>
    <div class="req-sum"><div><b>${n('yes')}</b><span>要</span></div><div><b>${n('later')}</b><span>之后再说</span></div><div><b>${n('no')}</b><span>不要</span></div><div><b>${n('talk')}</b><span>待讨论</span></div></div>
    <div class="req-prog"><i style="width:${pct}%"></i></div>
    <p class="note">标签说明：<span class="rec rm">必要</span> 系统要运作就一定要有；<span class="rec r1">建议一期</span> 第一版就做；<span class="rec r2">建议二期</span> 第一版稳定后再做；<span class="rec ro">可选</span> 看贵司需要；<span class="rec new">新增</span> 本版新增。</p>
  </div>` +
  REQ.map(([g, sub, items]) => `<section class="req-group"><h2>${g}<small>${sub}</small></h2><div class="req-list">${items.map(([id, name, rec, who, when, what, result, why, demo, isNew]) => `
    <article class="req" data-c="${S.choice[id] || ''}">
      <div class="hd"><b>${name}</b><span class="toolbar" style="gap:4px">${isNew ? '<span class="rec new">新增</span>' : ''}<span class="rec ${rec}">${REC[rec]}</span></span></div>
      <dl class="scn"><dt>谁</dt><dd>${who}</dd><dt>情境</dt><dd>${when}</dd><dt>操作</dt><dd>${what}</dd><dt>结果</dt><dd>${result}</dd></dl>
      ${why ? `<div class="why">${why}</div>` : ''}
      <div class="choose" role="group" aria-label="${name}">${Object.entries(CH).map(([k, t]) => `<button type="button" data-req="${id}" data-v="${k}" aria-pressed="${S.choice[id] === k}">${t}</button>`).join('')}<button type="button" class="go" data-go="${demo}">看演示 ${ic('arrow')}</button></div>
      <label class="fb" for="note-${id}">意见或补充说明<textarea id="note-${id}" data-note="${id}" rows="2" placeholder="例如：我们现在的做法是……／希望增加……">${esc(S.note[id] || '')}</textarea></label>
    </article>`).join('')}</div></section>`).join('') + `
  <section class="req-group"><h2>导出结果<small>复制后贴到微信或邮件发给我们</small></h2>
    <div class="card export"><label class="fb" for="note-_all" style="margin-bottom:12px">其他意见（清单以外想补充的功能、现在使用上的不便等）<textarea id="note-_all" data-note="_all" rows="4" placeholder="例如：希望手机上能查库存；每月要手工合并报表……">${esc(S.note._all || '')}</textarea></label><textarea id="exportText" readonly aria-label="确认结果">${exportText()}</textarea>
    <div class="toolbar" style="margin-top:10px"><button class="btn pri" type="button" data-act="copy">${ic('copy')}复制结果</button><span class="note" style="margin:0">选择会保存在这台电脑的浏览器里，关掉再开还在。</span></div></div>
  </section>`;
};

V.dash = () => {
  const lk = curLock(), od = overdueAmt();
  const open = DB.contracts.filter(c => c.node < NODES[c.type].length - 1).length;
  const months = [['6月', 186], ['7月', 214], ['8月', 198], ['9月', 241], ['10月', 263], ['11月', 228]];
  const max = 300, cw = 520, chh = 170;
  const bars = months.map(([m, v], i) => { const x = 46 + i * 78, hh = v / max * (chh - 30), y = chh - 10 - hh; return `<rect x="${x}" y="${y.toFixed(1)}" width="40" height="${hh.toFixed(1)}" rx="5" fill="var(--accent)" opacity="${i === months.length - 1 ? 1 : .32}"/><text x="${x + 20}" y="${chh + 6}" text-anchor="middle">${m}</text><text x="${x + 20}" y="${(y - 6).toFixed(1)}" text-anchor="middle" style="fill:var(--ink)">${v}</text>`; }).join('');
  const grid = [0, 100, 200, 300].map(v => { const y = chh - 10 - v / max * (chh - 30); return `<line x1="34" x2="${cw}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="28" y="${(y + 4).toFixed(1)}" text-anchor="end">${v}</text>`; }).join('');
  const todo = [
    ...DB.approvals.filter(a => a.status === '待审批').map(a => [a.type, mono(a.ref), `<button class="btn sm" type="button" data-go="approvals">去审批</button>`]),
    ...DB.receipts.filter(r => !r.claimed).map(r => [`到账待认领 USD ${fmt(r.amt)}`, mono(r.id), `<button class="btn sm" type="button" data-go="receipts|${r.id}">去认领</button>`]),
    ...DB.samples.filter(s => s.st === '逾期未还').map(s => [`样品逾期未还 · ${custOf(s.cust).short}`, mono(s.id), `<button class="btn sm" type="button" data-go="samples">查看</button>`]),
    ['易助每日汇率已很久未更新', mono('汇率'), `<button class="btn sm" type="button" data-go="fx">查看</button>`]
  ];
  return head('工作台', `早上好，林晓。今天是 11 月 18 日，有 ${todo.length} 件事要处理。`, `<button class="btn" type="button" data-act="toast" data-msg="已导出本月报表 Excel（演示）">导出报表</button>`) + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">进行中合同</div><div class="row"><div><div class="v">${open}</div><div class="d">其中 1 张待审批</div></div>${spark([4, 5, 5, 6, 7, open], 'var(--accent)')}</div></div>
    <div class="card kpi"><div class="k">本月出运（千美元）</div><div class="row"><div><div class="v">228</div><div class="d up">截至今天，比上月同期 +6%</div></div>${spark([186, 214, 198, 241, 263, 228], 'var(--accent)')}</div></div>
    <div class="card kpi"><div class="k">逾期应收（原币）</div><div class="row"><div><div class="v">USD ${fmt(od / 1000, 1)}k</div><div class="d dn">${arOpen().filter(r => daysPast(r.due) > 0).length} 张发票逾期</div></div>${spark([38, 52, 61, 70, 68, od / 1000], 'var(--bad)')}</div></div>
    <div class="card kpi"><div class="k">本月锁定汇率</div><div class="row"><div><div class="v">${lk[1].toFixed(4)}</div><div class="d">USD/CNY · ${lk[3].split(' ')[0]} 锁定</div></div>${spark(DB.fx.daily.map(d => d[1]), 'var(--yz)')}</div></div>
  </div>
  <div class="grid g32 mt">
    <div class="card"><h3>出运金额趋势 <small>千美元</small></h3><svg class="chart" viewBox="0 0 ${cw} ${chh + 14}" role="img" aria-label="近六个月出运金额，十月最高为 263 千美元" style="width:100%;height:auto">${grid}${bars}</svg></div>
    <div class="card"><h3>待办 <small>${todo.length} 项</small></h3>${table(['事项', '单号', ''], todo)}</div>
  </div>
  <div class="card mt"><h3>生产与出货 ${yzTag} <small>工单数据读自易助</small></h3>${table(['PI', '客户', '当前节点', '易助订单', '工单进度', '预计出货'], DB.contracts.filter(c => c.type === '外销' && c.node < 9).map(c => {
    const w = DB.wos.filter(x => c.wo.includes(x.id)), d = w.reduce((a, x) => a + x.done, 0), q = w.reduce((a, x) => a + x.qty, 0);
    return [piBtn(c.pi), custOf(c.cust).short, scStatus(c), c.xs ? mono(c.xs) : '—', q ? `${fmt(d)} / ${fmt(q)}` : '—', c.pi === 'PI20261028ALT' ? '11-24' : c.pi === 'PI20261103KEP' ? '11-28' : '待定'];
  }))}</div>`;
};

V.approvals = () => head('审批中心', '报价、合同、订单变更、收款异常都在这里处理，也会推送到企业微信') + `
  <div class="grid g32">
    <div class="card"><h3>审批事项 <small>${pendingAp()} 项待处理</small></h3>${table(['单号', '类型', '关联', '说明', '申请人', '进度', ''], DB.approvals.map(a => [mono(a.id), a.type, `<button class="btn sm" type="button" data-go="${a.go}">${a.ref}</button>`, `<span class="wrap">${a.detail}</span>`, a.who,
      a.status === '待审批' ? pill(a.step, 'warn') : a.status === '已核准' ? pill('已核准', 'ok') : pill('已退回', 'mute'),
      a.status === '待审批' ? `<div class="toolbar"><button class="btn sm pri" type="button" data-act="approve" data-id="${a.id}">核准</button><button class="btn sm dng" type="button" data-act="reject" data-id="${a.id}">退回</button></div>` : '']))}
    <p class="note">审批层级与门槛在 <button class="btn sm" type="button" data-go="apprset">审批设置</button> 调整。默认“送审＋审核”两段，与易助现在的用法一致。</p></div>
    <div class="card"><h3>企业微信推送预览</h3><div class="phone">
      <div class="pc"><h5>光数外贸 · 待审批</h5>${DB.approvals.filter(a => a.status === '待审批').slice(0, 2).map(a => `<div style="border-top:1px solid var(--line);padding-top:6px;margin-top:6px"><b>${a.type}</b><br><span style="color:var(--muted)">${a.ref} · ${a.detail}</span></div>`).join('') || '<span style="color:var(--muted)">目前没有待审批</span>'}<div class="toolbar" style="margin-top:10px"><span class="btn sm pri">打开处理</span></div></div>
    </div></div>
  </div>`;

V.customers = () => {
  const list = DB.customers.filter(c => S.custF === '全部' || c.pool === S.custF || c.type === S.custF);
  return head('客户', '公海与私海 · 30 天没跟进自动回公海 · 点一行打开客户中心', `<button class="btn pri" type="button" data-act="toast" data-msg="已新增客户，审核后同步到易助客户档（演示）">${ic('plus')}新增客户</button>`) + `
  <div class="toolbar" style="margin-bottom:12px"><div class="filters">${['全部', '私海', '公海', '外销', '内销'].map(f => `<button type="button" data-act="custF" data-id="${f}" aria-pressed="${S.custF === f}">${f}</button>`).join('')}</div></div>` +
    table(['客户', '国家', '币种', '等级', '归属业务', '易助编号', '未收（原币）', '沟通', '最近跟进', ''], list.map(c => {
      const due = arOpen().filter(r => r.cust === c.id).reduce((a, r) => a + r.amt - r.got, 0);
      return [`<b>${c.name}</b>`, c.country, c.cur, c.level, c.sales, c.yz === '—' ? '<span class="note" style="margin:0">未建档</span>' : mono(c.yz), due ? `${c.cur} ${fmt(due)}` : '—', c.ch, c.last,
        c.pool === '公海' ? `<button class="btn sm" type="button" data-act="claimCust" data-id="${c.id}">领取</button>` : pill('私海', 'run')];
    }), { num: [6], click: i => `data-act="openCust" data-id="${list[i].id}"` }) +
    `<p class="note">新客户在本系统建立，审核后同步到易助客户档，易助编号自动回填。</p>`;
};
function custDrawer(id) {
  const c = custOf(id), scs = DB.contracts.filter(x => x.cust === id);
  const ar = arOpen().filter(r => r.cust === id), due = ar.reduce((a, r) => a + r.amt - r.got, 0), od = ar.filter(r => daysPast(r.due) > 0).reduce((a, r) => a + r.amt - r.got, 0);
  const ordered = scs.filter(x => x.node < 6).reduce((a, x) => a + total(x), 0), shipped = scs.filter(x => x.node >= 6 && x.node < 9).reduce((a, x) => a + total(x), 0);
  const used = due + ordered;
  return `<div class="dh"><div><h2>${c.name}</h2><p class="note" style="margin:3px 0 0">${c.country} · ${c.level} 级 · 归属 ${c.sales} · 易助 ${c.yz}</p></div><button class="x" type="button" data-act="close" aria-label="关闭">${ic('x')}</button></div>
  <div class="mini">
    <div><span>未收应收</span><b>${c.cur} ${fmt(due)}</b></div>
    <div><span>其中逾期</span><b class="${od ? 'dn' : ''}">${c.cur} ${fmt(od)}</b></div>
    <div><span>已订未出</span><b>${c.cur} ${fmt(ordered)}</b></div>
    <div><span>已出未收</span><b>${c.cur} ${fmt(shipped)}</b></div>
    <div><span>信用额度</span><b>${c.cur} ${fmt(c.credit)}</b></div>
    <div><span>额度已用</span><b class="${used > c.credit ? 'dn' : ''}">${Math.round(used / c.credit * 100)}%</b></div>
  </div>
  <div class="kv sep"><div><span>联系人</span>${c.contact}</div><div><span>沟通渠道</span>${c.ch}</div><div><span>付款条件</span>${c.terms}</div><div><span>业务类型</span>${c.type}</div></div>
  <h3>合同</h3>${scs.length ? table(['PI', '金额', '状态'], scs.map(x => [piBtn(x.pi), `${x.cur} ${fmt(total(x), 2)}`, scStatus(x)]), { num: [1] }) : '<p class="note">还没有合同。</p>'}
  ${ar.length ? `<h3>未收发票 ${yzTag}</h3>${table(['发票', '到期', '未收', '账龄'], ar.map(r => [mono(r.zp), r.due, `${r.cur} ${fmt(r.amt - r.got)}`, daysPast(r.due) > 0 ? pill(`逾期 ${daysPast(r.due)} 天`, 'bad') : pill('未到期', 'mute')]), { num: [2] })}` : ''}
  <h3>跟进记录</h3><div class="timeline">${c.follow.map(f => `<div><span class="t">${f[0]}</span><span class="d"></span><span><b>${f[1]}</b> · ${f[2]}</span></div>`).join('')}</div>
  <h3>${c.ch} 对话归档 <span class="tag own">自动归档</span></h3><div class="chat">${c.chat.map(m => `<div class="bubble ${m[0] === '我' ? 'me' : ''}"><small>${m[0] === '我' ? c.sales : c.contact.split('（')[0]} · ${m[1]}</small>${esc(m[2])}</div>`).join('')}</div>
  <div class="toolbar" style="margin-top:18px"><button class="btn pri" type="button" data-act="toast" data-msg="已新增跟进记录（演示）">新增跟进</button><button class="btn" type="button" data-act="toast" data-msg="已移交给陈一凡（演示）">移交给其他业务</button></div>`;
}

V.quote = () => {
  const q = S.q, p = prodOf(q.prod), cu = custOf(q.cust);
  const rebate = q.cost / 1.13 * q.rebate / 100, unit = q.cost - rebate + q.extra;
  const price = unit / q.fx / (1 - q.margin / 100) / (1 - q.comm / 100) + q.freight;
  const profit = (price - q.freight) * q.fx * (1 - q.comm / 100) - unit, rate = profit / ((price - q.freight) * q.fx) * 100, low = rate < 12;
  S.calc = { price, rate };
  const f = (k, lab, step) => `<label for="q-${k}">${lab}<input id="q-${k}" type="number" step="${step}" value="${q[k]}" data-q="${k}"></label>`;
  const vers = DB.quoteVers.BJ2026110301;
  return head('报价', '试算后保存为报价单，每次改价都留一版；毛利低于 12% 自动送审，核准后可一键转 PI') + `
  <div class="grid g2">
    <div class="card"><h3>成本与条件</h3><div class="form">
      <label for="q-cust">客户<select id="q-cust" data-qs="cust">${DB.customers.filter(c => c.type === '外销').map(c => `<option value="${c.id}" ${c.id === q.cust ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      <label for="q-prod">产品（客户品号）<select id="q-prod" data-qs="prod">${DB.products.map(x => `<option value="${x.code}" ${x.code === q.prod ? 'selected' : ''}>${x.code} · ${x.name}</option>`).join('')}</select></label>
      ${f('cost', '含税成本（元／只）', 1)}${f('rebate', '出口退税率（%）', 1)}
      ${f('fx', '报价汇率（USD/CNY）', 0.0001)}${f('extra', '包装与杂费（元／只）', 0.5)}
      ${f('freight', '运费分摊（USD／只）', 0.05)}${f('qty', '数量（只）', 10)}
      ${f('comm', '佣金（%）', 0.5)}${f('margin', '目标利润率（%）', 0.5)}
    </div><p class="note">内部品号 ${mono(p.inner)} · 海关编码 ${mono(p.hs)}。成本参考易助“商品平均成本”（月加权平均），汇率默认带入本月锁定汇率 ${curLock()[1].toFixed(4)}。</p></div>
    <div class="card"><h3>报价结果 <small>${cu.short}</small></h3><div class="res">
      <div><span>退税（元／只）</span><span class="m">${fmt(rebate, 2)}</span></div>
      <div><span>实际成本（元／只）</span><span class="m">${fmt(unit, 2)}</span></div>
      <div><span>每只利润（元）</span><span class="m">${fmt(profit, 2)}</span></div>
      <div><span>毛利率</span><span>${low ? pill(fmt(rate, 1) + '%，低于 12% 需审批', 'warn') : pill(fmt(rate, 1) + '%', 'ok')}</span></div>
      <div><span>合计（${fmt(q.qty)} 只）</span><span class="m">USD ${fmt(price * q.qty, 2)}</span></div>
      <div class="big"><span>报价（USD／只）</span><span class="m">${fmt(price, 2)}</span></div>
    </div>
    <div class="toolbar" style="margin-top:14px"><button class="btn pri" type="button" data-act="saveQuote">${low ? '保存并送审批' : '保存报价单'}</button><button class="btn" type="button" data-act="toast" data-msg="已生成英文报价单 PDF（演示）">英文报价单</button><button class="btn" type="button" data-act="toast" data-msg="已附加规格书 PDF（演示）">${ic('clip')}附件</button></div></div>
  </div>
  <div class="card mt"><h3>报价单 <small>编号沿用易助 BJ 规则</small></h3>${table(['报价单', '版本', '客户', '产品', '数量', '单价 USD', '毛利率', '附件', '状态', ''], DB.quotes.map(x => [mono(x.id), 'V' + x.ver, custOf(x.cust).short, prodOf(x.prod).name, fmt(x.qty), fmt(x.price, 2), fmt(x.margin, 1) + '%', x.att,
    x.status === '待审批' ? pill('待审批', 'warn') : x.status === '已批准' ? pill('已批准', 'ok') : x.status === '已退回' ? pill('已退回', 'mute') : x.status === '已发客户' ? pill('已发客户', 'yz') : pill('已转合同', 'run'),
    x.status === '已批准' || x.status === '已发客户' ? `<button class="btn sm pri" type="button" data-act="toContract" data-id="${x.id}">转 PI</button>` : x.pi ? piBtn(x.pi) : x.status === '待审批' ? `<button class="btn sm" type="button" data-go="approvals">去审批</button>` : '']), { num: [4, 5, 6, 7] })}</div>
  <div class="grid g2 mt">
    <div class="card"><h3>版本记录 <small>BJ2026110301 · Kepler</small></h3>${table(['版本', '日期', '单价', '说明'], vers.map(v => [v[0], v[1], v[2], `<span class="wrap">${v[3]}</span>`]))}<p class="note">每一版都保留，客户问“上次报多少”时一查就有。</p></div>
    <div class="card"><h3>易助中的历史报价 ${yzTag}</h3>${table(['易助报价单', '日期', '附件'], [[mono('BJ2026103002'), '2026-10-30', 'PI_100G_LR4_v2.xlsx'], [mono('BJ2026102201'), '2026-10-22', 'Quotation_25G_SR.xlsx'], [mono('BJ2026101503'), '2026-10-15', 'PI_GPON_C+.xlsx']])}<p class="note">易助里的报价目前多以 Excel 附件保存（数量很多）。上线时可以把附件清单导入，按客户、产品查得到，新报价则改用结构化录入。</p></div>
  </div>`;
};

V.contracts = () => {
  const list = DB.contracts.filter(c => S.scF === '全部' || c.type === S.scF || (S.scF === '待收款' && c.pay.some(p => p[3] !== '已收')));
  return head('合同（PI）', '以客户 PI 号为主，易助订单号（XS）为对照；外销与内销共用同一套流程', `<button class="btn pri" type="button" data-go="quote">${ic('plus')}新建合同</button>`) + `
  <div class="toolbar" style="margin-bottom:12px"><div class="filters">${['全部', '外销', '内销', '待收款'].map(f => `<button type="button" data-act="scF" data-id="${f}" aria-pressed="${S.scF === f}">${f}</button>`).join('')}</div></div>` +
    table(['PI／合同号', '易助订单', '客户', '归属业务', '贸易条件', '金额', '当前节点', '版本', ''], list.map(c => [`<b class="m">${c.pi}</b>`, c.xs ? mono(c.xs) : '<span class="note" style="margin:0">未下单</span>', custOf(c.cust).short, c.sales, c.term, `${c.cur} ${fmt(total(c), 2)}`, scStatus(c), 'V' + String(c.ver).padStart(3, '0'), `<button class="btn sm" type="button" data-go="contract|${c.pi}">打开</button>`]), { num: [5] }) +
    `<p class="note">PI 号由本系统产生，汇入易助时写进订单的“客户单号”，合同号写进自定义栏，两边都能互相查到。</p>`;
};

V.contract = () => {
  const c = scOf(S.arg) || DB.contracts[0], cu = custOf(c.cust);
  const paid = c.pay.filter(p => p[3] === '已收').reduce((a, p) => a + p[1], 0);
  const ships = DB.ships.filter(s => s.items.some(i => i[0] === c.pi));
  const chg = DB.changes.filter(x => x.pi === c.pi);
  const tabs = [['lines', '明细'], ['pay', '款项'], ['change', `变更${chg.length ? ' ' + chg.length : ''}`], ['ship', '出运与单证'], ['trace', '追溯'], ['profit', '利润']];
  if (!tabs.some(t => t[0] === S.tab)) S.tab = 'lines';
  const T = {
    lines: () => table(['客户品号', '内部品号', '品名', '海关编码', '数量', '单价', '金额'], c.lines.map(l => [mono(l[0]), mono(prodOf(l[0]).inner), prodOf(l[0]).name, mono(prodOf(l[0]).hs), fmt(l[1]), fmt(l[2], 2), fmt(l[1] * l[2], 2)]), { num: [4, 5, 6] }) + `<p class="note">客户品号（C91 开头）汇入易助时自动对应内部生产品号（91 开头），生产仍按内部品号排单。</p>`,
    pay: () => table(['款项', '金额', '到期日', '状态', ''], c.pay.map(p => [p[0], `${c.cur} ${fmt(p[1], 2)}`, p[2], p[3] === '已收' ? pill('已收', 'ok') : p[3] === '逾期' ? pill(`逾期 ${daysPast(p[2])} 天`, 'bad') : p[3] === '到账待认领' ? pill('到账待认领', 'yz') : pill(p[3], 'mute'), p[3] !== '已收' && c.cur === 'USD' ? `<button class="btn sm" type="button" data-go="receipts">去认领</button>` : '']), { num: [1] }) + `<p class="note">已收 ${c.cur} ${fmt(paid, 2)}，未收 ${c.cur} ${fmt(total(c) - paid, 2)}。收款按原币记录；易助的销售发票与收款核销结果会自动读回。</p>`,
    change: () => chg.length ? chg.map(x => `<div class="card" style="margin-bottom:12px;background:var(--card2)"><h3>${x.id} · V${x.ver} <small>${x.date} · ${x.by} · ${x.reason}</small>${x.st === '待审批' ? pill('待审批', 'warn') : pill(x.st, 'ok')}</h3>${table(['项目', '原内容', '变更后'], x.diff.map(d => [d[0], `<span style="text-decoration:line-through;color:var(--faint)">${d[1]}</span>`, `<b>${d[2]}</b>`]))}</div>`).join('') + `<div class="toolbar"><button class="btn pri" type="button" data-act="toast" data-msg="已建立变更单 V${String(c.ver + 1).padStart(3, '0')}（演示）">${ic('plus')}新增变更</button></div><p class="note">审批通过后自动生成易助“订单变更单”，版本号与本系统一致。</p>` : `<p class="note">这张合同还没有变更。</p><div class="toolbar"><button class="btn pri" type="button" data-act="toast" data-msg="已建立变更单 V002（演示）">${ic('plus')}新增变更</button></div>`,
    ship: () => ships.length ? table(['出运', '方式', '路线', '本合同数量', '易助出库单', '单证', '状态'], ships.map(s => [`<button class="btn sm" type="button" data-go="ship|${s.id}">${s.id}</button>`, s.mode, s.route, fmt(s.items.filter(i => i[0] === c.pi).reduce((a, i) => a + i[2], 0)), mono(s.ck), `${Object.values(s.docs).filter(Boolean).length}/5`, pill(s.st, s.st === '待订舱' ? 'run' : 'ok')])) : '<p class="note">还没有出运计划。</p>',
    trace: () => traceTree(c),
    profit: () => `<div class="kv"><div><span>预估利润</span>¥${fmt(c.est)}</div><div><span>实际利润</span>${c.act == null ? '未结案' : '¥' + fmt(c.act)}</div><div><span>合同金额</span>${c.cur} ${fmt(total(c), 2)}</div><div><span>产地证</span>${c.co}</div></div>${c.act != null ? `<p class="note">实际比预估少 ¥${fmt(c.est - c.act)}，主要是汇差：报价按 7.1432，结汇 7.1350。<button class="btn sm" type="button" data-go="profit">看差异拆解</button></p>` : ''}`
  };
  return `<button class="back" type="button" data-go="contracts">${ic('left')}返回合同列表</button>` + `
  <div class="card">
    ${c.block ? `<div class="banner warn"><b>暂停</b><span>${c.block}。<button class="btn sm" type="button" data-go="approvals">去审批</button></span></div>` : ''}
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:baseline">
      <div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><span class="m" style="font-size:21px;font-weight:650">${c.pi}</span><button class="btn sm" type="button" data-act="openCust" data-id="${cu.id}">${cu.name}</button>${c.xs ? `<span class="tag yz">易助 ${c.xs}</span>` : ''}${scStatus(c)}</div>
      <div><span style="font-family:var(--font-d);font-size:21px;font-weight:700">${c.cur} ${fmt(total(c), 2)}</span> <span class="note" style="margin:0">${c.term}</span></div>
    </div>
    ${stepper(c)}
    <div class="kv sep">
      <div><span>付款条件</span>${c.pay.map(p => p[0]).join('，')}</div>
      <div><span>归属业务</span>${c.sales}</div>
      <div><span>业务类型 · 用途</span>${c.type} · ${c.use}</div>
      <div><span>当前版本</span>V${String(c.ver).padStart(3, '0')}</div>
    </div>
    <div class="toolbar" style="margin-top:14px"><button class="btn pri" type="button" data-act="advance" data-id="${c.pi}" ${c.block || c.node >= NODES[c.type].length - 1 ? 'disabled' : ''}>完成「${NODES[c.type][c.node]}」，进入下一步</button><button class="btn" type="button" data-act="toast" data-msg="已发送更新后的 PI 给客户（演示）">发 PI 给客户</button></div>
  </div>
  <div class="card mt"><div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" aria-selected="${S.tab === k}" data-act="tab" data-id="${k}">${n}</button>`).join('')}</div>${T[S.tab]()}</div>`;
};

/* 订单追溯树：外贸段在本系统，生产到核销读自易助 */
function traceTree(c) {
  const cu = custOf(c.cust), wos = DB.wos.filter(w => c.wo.includes(w.id)), wws = DB.wws.filter(w => w.xs && w.xs === c.xs);
  const recv = c.pay.filter(p => p[3] === '已收').reduce((a, p) => a + p[1], 0);
  const node = (st, t, sub, ref, src, cls = '') => `<div class="tn ${cls}"><span class="dot ${st}"></span><span class="lbl"><b>${t} ${src}</b><span>${sub}</span></span><span class="m" style="color:var(--muted)">${ref}</span></div>`;
  const q = DB.quotes.find(x => x.pi === c.pi);
  return `<div class="trace">
    ${node('d', '报价', q ? `V${q.ver} · 毛利 ${q.margin}%` : '直接下单', q ? q.id : '—', ownTag)}
    ${node('d', 'PI 确认', `${cu.short} · ${c.cur} ${fmt(total(c), 2)}`, c.pi, ownTag)}
    ${node(c.xs ? 'd' : c.block ? 'a' : 'w', '易助订单', c.xs ? `V${String(c.ver).padStart(3, '0')} 已同步` : c.block ? '等待信用额度审批' : '未下单', c.xs || '—', yzTag)}
    ${wos.map(w => node(w.st === '已完工' ? 'd' : w.done > 0 || w.st.startsWith('生产') ? 'a' : 'w', '工单', `${w.item} · ${fmt(w.done)} / ${fmt(w.qty)} · ${w.st}`, w.id, yzTag, 'sub')).join('')}
    ${wws.map(w => node('a', '委外贴片', `${w.sup} · 已送料 ${w.sent} 套 · 预计 ${w.due} 回货`, w.id, yzTag, 'sub')).join('')}
    ${node(c.ck ? 'd' : 'w', '出库', c.ck ? '已出库' : '未出库', c.ck || '—', yzTag)}
    ${node(c.xh ? 'd' : 'w', '销货与发票', c.zp ? `发票 ${c.zp}` : '未开票', c.xh || '—', yzTag)}
    ${node(recv >= total(c) ? 'd' : recv > 0 ? 'a' : 'w', '收款（原币）', `${c.cur} ${fmt(recv, 2)} / ${fmt(total(c), 2)}`, c.pay.some(p => p[3] === '到账待认领') ? '有到账待认领' : '', ownTag)}
  </div><p class="note">“易助”标记的节点由易助只读同步：工单的前置单号就是易助订单号，所以能自动对上这张 PI。</p>`;
}
</script>
