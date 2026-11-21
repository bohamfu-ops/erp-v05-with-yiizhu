<script>
V.follow = () => {
  const cols = [[2, '易助下单', 1], [3, '生产', 1], [4, '质检', 1], [5, '订舱', 0], [6, '出库', 1], [9, '收款', 0]];
  const list = DB.contracts.filter(c => c.type === '外销');
  return head('跟单看板', '每张外销 PI 按节点推进 · 红框为逾期 · 标“易助”的栏位进度自动读回') +
    `<div class="kanban">${cols.map(([n, name, yz]) => { const cs = list.filter(c => c.node === n); return `<div class="col"><h4><span>${name}${yz ? '<span class="tag yz">易助</span>' : ''}</span><span>${cs.length}</span></h4>${cs.map(c => {
      const w = DB.wos.filter(x => c.wo.includes(x.id)), d = w.reduce((a, x) => a + x.done, 0), q = w.reduce((a, x) => a + x.qty, 0);
      return `<div class="kc ${c.late ? 'late' : ''}"><div class="t">${c.pi}</div><div class="s">${custOf(c.cust).short} · ${c.cur} ${fmt(total(c))}</div><div class="s">${c.lines.map(l => prodOf(l[0]).name).join('、')}</div>${q ? `<div class="s">工单 ${fmt(d)} / ${fmt(q)}</div>` : ''}<div class="f">${c.late ? `<span class="dn">逾期 ${c.late} 天</span>` : c.block ? '<span class="dn">待审批</span>' : '<span class="s">正常</span>'}<button class="btn sm" type="button" data-go="contract|${c.pi}">打开</button></div></div>`;
    }).join('') || '<p class="note" style="margin:4px">没有合同</p>'}</div>`; }).join('')}</div>
    <p class="note">生产、质检、出库的进度来自易助工单与出库单；订舱、收款由跟单与财务在本系统更新。</p>`;
};

V.samples = () => {
  const list = DB.samples.filter(s => S.sampleF === '全部' || s.st === S.sampleF);
  const k = st => DB.samples.filter(s => s.st === st).length;
  return head('样品与借出', '寄样登记后同步为易助借出单，到期提醒归还；测试通过可直接转 PI', `<button class="btn pri" type="button" data-act="toast" data-msg="已登记寄样，等待主管审批后同步易助借出单（演示）">${ic('plus')}登记寄样</button>`) + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">测试中</div><div class="v">${k('测试中')}</div></div>
    <div class="card kpi"><div class="k">逾期未还</div><div class="v dn">${k('逾期未还')}</div></div>
    <div class="card kpi"><div class="k">待借出</div><div class="v">${k('待借出')}</div></div>
    <div class="card kpi"><div class="k">近 90 天样品转订单率</div><div class="v">38%</div><div class="d">8 次寄样中 3 次成单</div></div>
  </div>
  <div class="toolbar mt" style="margin-bottom:12px"><div class="filters">${['全部', '测试中', '逾期未还', '待借出', '已转订单'].map(f => `<button type="button" data-act="sampleF" data-id="${f}" aria-pressed="${S.sampleF === f}">${f}</button>`).join('')}</div></div>` +
  table(['寄样单', '客户', '产品', '数量', '寄出', '应还', '易助借出单', '状态', '说明', ''], list.map(s => [mono(s.id), custOf(s.cust).short, prodOf(s.prod).name, s.qty, s.out, s.due, s.jc ? mono(s.jc) : '—',
    s.st === '逾期未还' ? pill(`逾期 ${daysPast(s.due)} 天`, 'bad') : s.st === '已转订单' ? pill('已转订单', 'ok') : s.st === '待借出' ? pill('待借出', 'mute') : pill('测试中', 'run'), `<span class="wrap">${s.note}</span>`,
    s.st === '测试中' ? `<button class="btn sm pri" type="button" data-act="sampleWin" data-id="${s.id}">测试通过，转 PI</button>` : s.st === '逾期未还' ? `<button class="btn sm" type="button" data-act="toast" data-msg="已通过 ${custOf(s.cust).ch} 提醒客户归还（演示）">提醒归还</button>` : s.pi ? piBtn(s.pi) : '']), { num: [3] }) +
  `<p class="note">样品不计价（价税合计为 0），但成本会记到“样品费用”。客户决定买下时，可直接把借出转成销货，不用先还再卖。</p>`;
};

V.ship = () => {
  const s = DB.ships.find(x => x.id === S.shipSel) || DB.ships[0];
  const w = s.items.map(i => i[2] * prodOf(i[1]).kg), tw = w.reduce((a, b) => a + b, 0);
  const cc = custOf((scOf(s.items[0][0]) || {}).cust).cc;
  const comp = { VN: [['产地证', 'Form E（中国—东盟），越南进口光模块税率 0%', 1], ['越文标签', '已在装箱单附越文品名', 1]], TH: [['产地证', 'RCEP 原产地证书', 1], ['NBTC', '光模块非无线设备，不需认证（已确认）', 1]], MX: [['西班牙语品名', '商业发票已附西语品名', 1], ['原产地声明', '一般贸易，附原产地声明即可', 0], ['进口商 RFC', '客户税号已登记', 1]] }[cc] || [];
  const nDoc = Object.values(s.docs).filter(Boolean).length;
  return head('出运与单证', '订舱、单证与合规检查集中在这里，关联易助出库单') + `
  <div class="banner own"><b>取代现在的做法</b><span>出库单备注手写 PI 号、用聊天软件传报关资料，改成在这里生成并存档，每份单证都连到 PI 与易助出库单。</span></div>` +
  table(['出运', '方式', '路线', '出发', 'PI', '易助出库单', '单证', '状态'], DB.ships.map(x => [mono(x.id), x.mode, x.route, x.etd, [...new Set(x.items.map(i => i[0]))].join('、'), mono(x.ck), `${Object.values(x.docs).filter(Boolean).length}/5`, pill(x.st, x.st === '待订舱' ? 'run' : 'ok')]), { click: i => `data-act="shipSel" data-id="${DB.ships[i].id}"`, sel: i => DB.ships[i].id === s.id }) + `
  <div class="grid g2 mt">
    <div class="card"><h3>${s.id} 货物与运费 <small>${s.mode} · 毛重约 ${fmt(tw, 1)} kg</small></h3>` + table(['PI', '品项', '数量', '重量 kg', '分摊运费 USD'], [...s.items.map((i, k) => [piBtn(i[0]), prodOf(i[1]).name, fmt(i[2]), fmt(w[k], 1), fmt(s.freight * w[k] / tw, 2)]), ['<b>合计</b>', '', '', `<b>${fmt(tw, 1)}</b>`, `<b>${fmt(s.freight, 2)}</b>`]], { num: [2, 3, 4] }) + `<p class="note">运费按重量分摊回每张 PI，单票利润才算得准。</p></div>
    <div class="card"><h3>单证 <small>${nDoc}/5 已生成</small></h3>${table(['单证', '状态'], Object.entries(s.docs).map(([k, v]) => [k, v ? pill('已生成', 'ok') : pill('未生成', 'mute')]))}
      <div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="genDocs" data-id="${s.id}" ${nDoc === 5 ? 'disabled' : ''}>一键生成单证</button><button class="btn" type="button" data-go="window">导出单一窗口资料</button></div></div>
  </div>
  <div class="card mt"><h3>国别合规 <small>${{ VN: '越南', TH: '泰国', MX: '墨西哥' }[cc] || ''}</small></h3>${table(['检查项', '说明', '结果'], comp.map(r => [r[0], `<span class="wrap">${r[1]}</span>`, r[2] ? pill('通过', 'ok') : pill('待补', 'warn')]))}</div>`;
};

V.after = () => head('售后与返修', '客户反映问题时反查原 PI，返修与退货进度一目了然', `<button class="btn pri" type="button" data-act="toast" data-msg="已登记售后单（演示）">${ic('plus')}登记售后</button>`) +
  table(['售后单', '原 PI', '客户', '产品', '数量', '类型', '原因', '进度', ''], DB.after.map(a => [mono(a.id), mono(a.pi), custOf(a.cust).short, prodOf(a.prod).name, a.qty, a.kind === '退货' ? pill('退货', 'warn') : pill('返修', 'run'), `<span class="wrap">${a.reason}</span>`, `${a.steps[a.step]}（${a.step + 1}/${a.steps.length}）`, a.step < a.steps.length - 1 ? `<button class="btn sm" type="button" data-act="afterNext" data-id="${a.id}">下一步</button>` : pill('已完成', 'ok')]), { num: [4] }) + `
  <div class="grid g2 mt">${DB.after.map(a => `<div class="card"><h3>${a.id} · ${a.kind} <small>${custOf(a.cust).short}</small></h3><div class="stepper">${a.steps.map((x, i) => `<div class="st ${i < a.step ? 'done' : i === a.step ? 'now' : ''}"><span class="dot">${i < a.step ? ic('check') : ''}</span>${x}</div>`).join('')}</div></div>`).join('')}</div>
  <p class="note">退货入库以易助销退单入账，本系统记录原因与处理过程，方便统计哪些型号问题最多。</p>`;

V.receipts = () => {
  const r = DB.receipts.find(x => x.id === S.arg) || DB.receipts.find(x => x.id === S.recSel) || DB.receipts[0];
  S.recSel = r.id;
  const cands = DB.contracts.flatMap(c => c.pay.map((p, i) => ({ c, p, i }))).filter(x => x.c.cur === r.cur && x.p[3] !== '已收');
  const best = cands.find(x => custOf(x.c.cust).name.toUpperCase() === r.payer.replace(/\s+/g, ' ')) || cands.find(x => Math.abs(x.p[1] - r.amt) < 1);
  const mismatch = best && custOf(best.c.cust).name.toUpperCase() !== r.payer;
  const lk = curLock()[1];
  return head('收款登记', '银行或收款平台的到账流水，按原币认领到 PI 的对应期数') + `
  <div class="grid g2">
    <div class="card"><h3>到账流水 <small>点一行认领</small></h3>${table(['流水', '日期', '付款人', '金额', '渠道', '状态'], DB.receipts.map(x => [mono(x.id), x.date, `<span class="wrap">${x.payer}</span>`, `${x.cur} ${fmt(x.amt, 2)}`, x.bank, x.claimed ? pill('已认领', 'ok') : pill('待认领', 'warn')]), { num: [3], click: i => `data-act="recSel" data-id="${DB.receipts[i].id}"`, sel: i => DB.receipts[i].id === r.id })}</div>
    <div class="card"><h3>认领 ${mono(r.id)}</h3>
      ${r.claimed ? `<div class="banner ok"><b>已认领</b><span>${r.claimed}<br>记账汇率 ${r.rate.toFixed(4)}，折合 ¥${fmt(r.amt * r.rate, 2)}${r.yz ? `<br>${r.yz}` : ''}</span></div>` : best ? `
      <div class="kv"><div><span>付款人</span>${r.payer}</div><div><span>金额（原币）</span>${r.cur} ${fmt(r.amt, 2)}</div><div><span>建议对应</span>${best.c.pi} · ${best.p[0]}</div><div><span>合同买方</span>${custOf(best.c.cust).name}</div><div><span>记账汇率（本月锁定）</span>${lk.toFixed(4)}</div><div><span>折合人民币</span>¥${fmt(r.amt * lk, 2)}</div></div>
      ${mismatch ? `<div class="banner warn mt"><b>付款人与买方不一致</b><span>外汇规定“谁出口谁收汇”，第三方代付要留存客户的付款委托书，否则可能影响出口退税。</span></div><label class="chk"><input type="checkbox" id="ackPayer"> 已取得客户付款委托书</label>` : '<div class="banner ok mt"><b>付款人与买方一致</b><span>可以直接认领。</span></div>'}
      <div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="claim" data-id="${best.c.pi}|${best.i}">认领到 ${best.c.pi} ${best.p[0]}</button></div>` : '<p class="note">没有找到可对应的未收款项。</p>'}
      <p class="note">认领后通知出纳在易助开收款单并核销对应销售发票；结汇时再记实际汇率，差额计入汇差。</p></div>
  </div>`;
};

V.ar = () => {
  const open = arOpen().filter(r => S.arF === '全部' || (S.arF === '逾期' ? daysPast(r.due) > 0 : agingBucket(daysPast(r.due)) === S.arF));
  const all = arOpen(), sum = all.reduce((a, r) => a + r.amt - r.got, 0);
  const by = BUCKETS.map(([b, col]) => [b, col, all.filter(r => agingBucket(daysPast(r.due)) === b).reduce((a, r) => a + r.amt - r.got, 0)]);
  return head('应收跟催', '发票与核销读自易助，账龄按 30／60／90／180 天分段，跟催记录留在本系统') + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">未收合计</div><div class="v">USD ${fmt(sum)}</div></div>
    <div class="card kpi"><div class="k">逾期金额</div><div class="v dn">USD ${fmt(overdueAmt())}</div></div>
    <div class="card kpi"><div class="k">逾期 90 天以上</div><div class="v dn">USD ${fmt(by[4][2] + by[5][2])}</div><div class="d">建议评估坏账风险</div></div>
    <div class="card kpi"><div class="k">本月已回款</div><div class="v up">USD ${fmt(24800 + 12090)}</div></div>
  </div>
  <div class="card mt"><h3>账龄分布</h3><div class="aging">${by.map(([b, col, v]) => v ? `<i style="width:${v / sum * 100}%;background:${col}" title="${b} USD ${fmt(v)}"></i>` : '').join('')}</div>
    <div class="legend">${by.map(([b, col, v]) => `<span><i style="background:${col}"></i>${b} · USD ${fmt(v)}</span>`).join('')}</div></div>
  <div class="toolbar mt" style="margin-bottom:12px"><div class="filters">${['全部', '逾期', '未到期', '1–30 天', '31–60 天', '61–90 天', '91–180 天', '180 天以上'].map(f => `<button type="button" data-act="arF" data-id="${f}" aria-pressed="${S.arF === f}">${f}</button>`).join('')}</div></div>` +
  table(['发票', 'PI', '客户', '负责业务', '到期日', '未收', '账龄', '最近跟催', ''], open.map(r => { const d = daysPast(r.due); return [mono(r.zp), mono(r.pi), custOf(r.cust).short, custOf(r.cust).sales, r.due, `${r.cur} ${fmt(r.amt - r.got, 2)}`, d > 0 ? pill(`逾期 ${d} 天`, d > 90 ? 'bad' : 'warn') : pill('未到期', 'mute'), r.log[0] ? `<span class="wrap">${r.log[0][0]} ${r.log[0][1]}：${r.log[0][2]}</span>` : '<span class="dn">尚未跟催</span>', d > 0 ? `<button class="btn sm" type="button" data-act="dun" data-id="${r.zp}">记录跟催</button>` : '']; }), { num: [5] }) +
  `<p class="note">逾期第 1、15、30 天自动提醒负责业务；超过 90 天提醒老板。账龄分段可以在设置里调整。</p>`;
};

V.fx = () => {
  const lk = curLock(), d = DB.fx.daily, last = d[d.length - 1], u = DB.fx.unsettled;
  const W = 520, H = 150, mn = Math.min(...d.map(x => x[1]), lk[1]) - .003, mx = Math.max(...d.map(x => x[1]), lk[1]) + .003;
  const X = i => 40 + i * (W - 60) / (d.length - 1), Y = v => 14 + (mx - v) / (mx - mn) * (H - 34);
  const line = d.map((x, i) => `${X(i).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' ');
  return head('汇率与结汇', '财务每月锁定一次记账汇率；结汇时记录实际汇率，差额就是汇差') + `
  <div class="banner warn"><b>易助每日汇率需要更新</b><span>易助“每日汇率”最新一笔停在 ${DB.fx.yzLast}（USD ${DB.fx.yzRate}），之后没有再登记。本系统每月锁定后可同步写入易助，避免两边汇率不一致。</span></div>
  <div class="grid g4">
    <div class="card kpi"><div class="k">本月锁定汇率</div><div class="v">${lk[1].toFixed(4)}</div><div class="d">${lk[2]} · ${lk[3]}</div></div>
    <div class="card kpi"><div class="k">今日参考汇率</div><div class="v">${last[1].toFixed(4)}</div><div class="d ${last[1] > lk[1] ? 'up' : 'dn'}">比锁定 ${last[1] > lk[1] ? '+' : ''}${fmt((last[1] - lk[1]) / lk[1] * 100, 2)}%</div></div>
    <div class="card kpi"><div class="k">未结汇美元</div><div class="v">USD ${fmt(u)}</div><div class="d">按今日折 ¥${fmt(u * last[1])}</div></div>
    <div class="card kpi"><div class="k">人民币每升值 1%</div><div class="v dn">−¥${fmt(u * last[1] * .01)}</div><div class="d">少收的人民币</div></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>参考汇率走势 <small>虚线为本月锁定汇率</small></h3><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近一周美元兑人民币参考汇率从 7.1395 升到 7.1503" style="width:100%;height:auto">
      <line x1="40" x2="${W - 20}" y1="${Y(lk[1]).toFixed(1)}" y2="${Y(lk[1]).toFixed(1)}" stroke="var(--yz)" stroke-dasharray="4 4"/><text x="${W - 20}" y="${(Y(lk[1]) - 5).toFixed(1)}" text-anchor="end" style="fill:var(--yz)">锁定 ${lk[1].toFixed(4)}</text>
      <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2"/>${d.map((x, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="3" fill="var(--accent)"/><text x="${X(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">${x[0]}</text>`).join('')}</svg></div>
    <div class="card"><h3>登记结汇</h3><div class="form">
      <label for="fx-amt">结汇金额（USD）<input id="fx-amt" type="number" value="${u}" min="0" step="100"></label>
      <label for="fx-rate">银行结汇汇率<input id="fx-rate" type="number" value="${last[1].toFixed(4)}" step="0.0001"></label>
    </div><div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="settle" ${u ? '' : 'disabled'}>登记结汇</button><button class="btn" type="button" data-act="toast" data-msg="已登记远期锁汇 USD 50,000 @ 7.1200（演示）">登记远期锁汇</button></div><p class="note">实际结汇汇率与记账汇率的差额，会带回对应 PI 的单票利润。</p></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>每月锁定记录</h3>${table(['月份', '汇率', '锁定人', '时间', '同步易助'], DB.fx.locks.map(l => [l[0], l[1].toFixed(4), l[2], l[3], pill('已写入', 'ok')]), { num: [1] })}<div class="toolbar" style="margin-top:12px"><button class="btn" type="button" data-act="toast" data-msg="12 月 1 日 9:00 会提醒财务锁定汇率（演示）">设定下月提醒</button></div></div>
    <div class="card"><h3>结汇记录</h3>${table(['日期', '金额 USD', '结汇汇率', '对应'], DB.fx.hist.map(h => [h[0], fmt(h[1]), h[2].toFixed(4), h[3]]), { num: [1, 2] })}</div>
  </div>`;
};

V.rebate = () => head('出口退税', '专票与报关单配对，申报前先检查品名、规格是否一致') + `
  <div class="banner own"><b>申报期限</b><span>出口退税须在报关出口之日次月起至次年 4 月 30 日前申报。系统会对每张报关单倒数提醒。</span></div>` +
  table(['报关单号', 'PI', '进项发票', '一致性', '可退税额 ¥', '状态', ''], DB.rebates.map(r => [mono(r.cd), mono(r.pi), r.inv, r.match === '一致' ? pill('一致', 'ok') : r.match === '—' ? '—' : pill(r.match, 'warn'), r.amt ? fmt(r.amt) : '—', r.st === '可申报' ? pill('可申报', 'ok') : r.st === '待更正' ? pill('待更正', 'warn') : pill(r.st, 'mute'), r.st === '待更正' ? `<button class="btn sm" type="button" data-act="toast" data-msg="已通知供应商重开专票，规格改为“100G QSFP28 LR4 光模块”（演示）">通知更正</button>` : '']), { num: [4] }) + `
  <div class="card mt"><h3>不一致明细 <small>PI20261015BKN</small></h3>${table(['项目', '报关单', '进项专票', '结果'], [['品名', '光模块', '光模块', pill('一致', 'ok')], ['规格', '10G SFP+ LR 10km', 'SFP+ 10G 光收发器', pill('写法不同', 'warn')], ['数量', '3,000 只', '3,000 个', pill('单位需核对', 'warn')]])}<p class="note">规格、单位写法不同可能被退税审核退回，提前在这里发现。</p></div>`;

V.profit = () => {
  const c = scOf('PI20261021SGF');
  const rows = [['收入（折人民币）', 177151, 176948], ['生产成本', -152000, -152760], ['运费与杂费', -4300, -4428], ['退税', 17489, 17489], ['佣金', -3540, -3540]];
  const est = rows.reduce((a, r) => a + r[1], 0), act = rows.reduce((a, r) => a + r[2], 0);
  const diffs = rows.map(r => [r[0], r[2] - r[1]]).filter(d => d[1]), maxAbs = Math.max(...diffs.map(d => Math.abs(d[1])));
  const W = 520, mid = 300;
  const bars = diffs.map(([n, d], i) => { const w = Math.abs(d) / maxAbs * 180, y = 14 + i * 40, x = d < 0 ? mid - w : mid; return `<text x="8" y="${y + 17}" style="fill:var(--ink);font-size:12.5px">${n}</text><rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="26" rx="5" fill="${d < 0 ? 'var(--bad)' : 'var(--ok)'}" opacity=".8"/><text x="${d < 0 ? (x - 6).toFixed(1) : (x + w + 6).toFixed(1)}" y="${y + 17}" text-anchor="${d < 0 ? 'end' : 'start'}" style="fill:var(--ink)">${d < 0 ? '−' : '+'}¥${fmt(Math.abs(d))}</text>`; }).join('');
  return head('单票利润', `${c.pi} · ${custOf(c.cust).short} · 预估与实际对比（人民币）`) + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">预估利润</div><div class="v">¥${fmt(est)}</div></div>
    <div class="card kpi"><div class="k">实际利润</div><div class="v">¥${fmt(act)}</div><div class="d dn">比预估少 ¥${fmt(est - act)}</div></div>
    <div class="card kpi"><div class="k">预估毛利率</div><div class="v">${fmt(est / rows[0][1] * 100, 1)}%</div></div>
    <div class="card kpi"><div class="k">实际毛利率</div><div class="v">${fmt(act / rows[0][2] * 100, 1)}%</div></div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h3>差异拆解 <small>实际减预估</small></h3><svg class="chart" viewBox="0 0 ${W} ${14 + diffs.length * 40}" role="img" aria-label="利润差异：汇差少 203 元，生产成本多 760 元，运费多 128 元" style="width:100%;height:auto"><line x1="${mid}" x2="${mid}" y1="6" y2="${10 + diffs.length * 40}" stroke="var(--line)"/>${bars}</svg><p class="note">生产成本读自易助（月加权平均）；收入差异来自汇差：报价按 7.1432，结汇 7.1350。</p></div>
    <div class="card"><h3>各合同利润</h3>${table(['PI', '客户', '预估', '实际', '状态'], DB.contracts.map(x => [piBtn(x.pi), custOf(x.cust).short, '¥' + fmt(x.est), x.act == null ? '—' : '¥' + fmt(x.act), x.act == null ? pill('进行中', 'run') : pill('已结案', 'ok')]), { num: [2, 3] })}</div>
  </div>`;
};

V.comm = () => {
  const fxr = curLock()[1];
  const rows = ['林晓', '陈一凡', '周可'].map(n => {
    const cs = DB.contracts.filter(c => c.sales === n);
    const rev = cs.reduce((a, c) => a + total(c) * (c.cur === 'USD' ? fxr : 1), 0), gp = cs.reduce((a, c) => a + (c.act ?? c.est), 0);
    const got = cs.reduce((a, c) => a + c.pay.filter(p => p[3] === '已收').reduce((x, p) => x + p[1], 0) * (c.cur === 'USD' ? fxr : 1), 0);
    const ratio = S.perfCash ? got / Math.max(1, rev) : 1, base = S.perfRule === 'gp' ? gp : rev, rate = S.perfRule === 'gp' ? .12 : .008;
    return [n, cs.length, '¥' + fmt(rev), '¥' + fmt(gp), fmt(ratio * 100, 0) + '%', '¥' + fmt(base * rate * ratio)];
  });
  return head('业绩与提成', '每张合同记录“归属业务”，与录单人分开；业绩与提成按归属业务统计') + `
  <div class="grid g23">
    <div class="card"><h3>提成规则</h3><div style="display:grid;gap:10px">
      <label class="chk"><input type="radio" name="pr" ${S.perfRule === 'gp' ? 'checked' : ''} data-act="perfRule" data-id="gp"> 按毛利的 12%</label>
      <label class="chk"><input type="radio" name="pr" ${S.perfRule === 'rev' ? 'checked' : ''} data-act="perfRule" data-id="rev"> 按销售额的 0.8%</label>
      <label class="chk"><input type="checkbox" ${S.perfCash ? 'checked' : ''} data-act="perfCash"> 以回款为准（没收到的钱不计提成）</label>
    </div><p class="note">外销金额按本月锁定汇率折算。退税是否计入毛利、提成何时发放，依贵司口径设定。</p></div>
    <div class="card"><h3>本月业绩与提成试算</h3>${table(['归属业务', '合同数', '销售额', '毛利', '回款比例', '提成'], rows, { num: [1, 2, 3, 4, 5] })}
    <p class="note">建单人可以是助理或跟单，“归属业务”才是业绩的依据；移交客户时可选择是否连同进行中的合同一起移交。</p></div>
  </div>`;
};

V.trace = () => {
  const c = scOf(S.traceSel) || DB.contracts[0];
  return head('订单追溯', '从 PI 一路查到易助订单、工单、委外、出库、发票与收款') + `
  <div class="grid g23">
    <div class="card"><h3>选择 PI</h3>${table(['PI', '客户', '节点'], DB.contracts.map(x => [mono(x.pi), custOf(x.cust).short, scStatus(x)]), { click: i => `data-act="traceSel" data-id="${DB.contracts[i].pi}"`, sel: i => DB.contracts[i].pi === c.pi })}</div>
    <div class="card"><h3>${c.pi} <small>${custOf(c.cust).name}</small></h3>${traceTree(c)}<div class="toolbar" style="margin-top:12px"><button class="btn" type="button" data-go="contract|${c.pi}">打开合同</button><button class="btn" type="button" data-act="toast" data-msg="已复制进度链接，可发给客户（演示）">${ic('copy')}复制进度给客户</button></div></div>
  </div>`;
};

V.prod = () => {
  const b = DB.bom, cost = b.parts.reduce((a, p) => a + p[2] * p[3], 0);
  return head('生产与库存', '工单、委外、库存与 BOM 都读自易助，业务看得到但不能修改') + yzBanner('工单、委外、库存与 BOM') + `
  <div class="card"><h3>工单 <small>前置单号就是易助订单号，可对回 PI</small></h3>${table(['工单', '易助订单', 'PI', '内部品号', '数量', '已完工', '预计完工', '状态'], DB.wos.map(w => { const c = DB.contracts.find(x => x.xs === w.xs); return [mono(w.id), mono(w.xs), c ? piBtn(c.pi) : '—', mono(w.item), fmt(w.qty), fmt(w.done), w.due, w.st.startsWith('欠料') ? pill(w.st, 'bad') : w.st === '已完工' ? pill(w.st, 'ok') : w.st === '待领料' ? pill(w.st, 'mute') : pill(`${w.st} ${Math.round(w.done / w.qty * 100)}%`, 'run')]; }), { num: [4, 5] })}</div>
  <div class="grid g2 mt">
    <div class="card"><h3>委外贴片</h3>${table(['委外单', '外协厂', '主件', '数量', '已送料', '已回货', '预计回货'], DB.wws.map(w => [mono(w.id), w.sup, mono(w.item), w.qty, w.sent, w.back, w.due]), { num: [3, 4, 5] })}<p class="note">芯片、电容电阻由我方送料给外协厂，回货后经检验入库。</p></div>
    <div class="card"><h3>成品库存 <small>可用 = 现有 − 已分配</small></h3>${table(['客户品号', '品名', '现有', '已分配', '可用', '可齐套'], DB.stock.map(r => [mono(r[0]), r[1], fmt(r[3]), fmt(r[4]), fmt(r[3] - r[4]), fmt(r[5])]), { num: [2, 3, 4, 5] })}<p class="note">“可齐套”是依现有料件还能生产的数量，接单前先看这里。</p></div>
  </div>
  <div class="card mt"><h3>客户品号与 BOM <small>${b.code} → ${b.inner}</small></h3>
    <div class="lvl" style="margin-bottom:12px"><span class="chip on">${b.code}</span><span class="sep">客户品号（销售用）</span><span class="sep">→</span><span class="chip">${b.inner}</span><span class="sep">内部品号（生产用）</span></div>
    ${table(['子件', '名称', '用量', '参考单价 ¥', '小计 ¥', '来源'], b.parts.map(p => [mono(p[0]), p[1], p[2], fmt(p[3], 2), fmt(p[2] * p[3], 2), p[4]]), { num: [2, 3, 4] })}
    <p class="note">材料成本约 ¥${fmt(cost, 2)}／只，报价时可作为成本底价参考。</p></div>`;
};

V.yzlink = () => {
  const flows = [
    ['客户、品号、BOM', '易助', '易助 → 本系统', '只读同步', '11-18 10:15', '7 / 5 / 5'],
    ['报价、PI、出运单证、原币收款登记', '本系统', '本系统新建', '—', '—', '—'],
    ['订单（含 PI 号、归属业务）', '本系统产生', '本系统 → 易助', 'Excel 订单汇入', '11-03 10:12', '5 张'],
    ['订单变更', '本系统', '本系统 → 易助', '订单变更单汇入', '11-17 16:40', '1 张'],
    ['工单、委外、生产进度', '易助', '易助 → 本系统', '只读，用订单号对回 PI', '11-18 10:15', '5 张'],
    ['出库、销货', '易助', '易助 → 本系统', '只读，只取已审核', '11-18 10:15', '3 张'],
    ['销售发票、应收、核销', '易助', '易助 → 本系统', '只读，显示在合同收款页', '11-18 10:15', '7 张'],
    ['每月记账汇率', '本系统', '本系统 → 易助', '写入每日汇率表', '11-01 09:12', '1 笔']
  ];
  return head('对接状态', '谁是主档、往哪个方向同步、最近一次是什么时候') + `
  <div class="grid g4">
    <div class="card kpi"><div class="k">同步状态</div><div class="v up">正常</div><div class="d">最近一次 11-18 10:15</div></div>
    <div class="card kpi"><div class="k">对照编号</div><div class="v" style="font-size:17px">PI ⇄ XS</div><div class="d">PI 写进易助“客户单号”</div></div>
    <div class="card kpi"><div class="k">今日汇入</div><div class="v">0</div><div class="d">本周 2 批</div></div>
    <div class="card kpi"><div class="k">待处理</div><div class="v dn">1</div><div class="d">信用额度待审批</div></div>
  </div>
  <div class="card mt"><h3>数据流向</h3>${table(['数据', '主档', '方向', '方式', '最近同步', '笔数'], flows.map(f => [f[0], f[1] === '易助' ? yzTag : ownTag, f[2], f[3], f[4], f[5]]))}</div>
  <div class="grid g2 mt">
    <div class="card"><h3>汇入批次</h3>${table(['批次', '时间', '类型', '内容', '结果'], DB.batches.map(b => [mono(b[0]), b[1], b[2], `<span class="wrap">${b[3]}</span>`, b[4] === '已汇入' ? pill('已汇入', 'ok') : pill(b[4], 'warn')]))}</div>
    <div class="card"><h3>上线时的历史资料</h3>${table(['资料', '处理方式'], [['客户、品号、BOM', '直接读易助，不用迁移'], ['进行中订单', '按 XS 号补登 PI，建立对照'], ['易助报价附件', '导入附件清单，按客户与产品可查'], ['未收应收', '读易助发票与核销，不另建账']])}
      <p class="note">对接用易助只读数据库账号（不用管理员账号），只读已审核的单据；写入一律走官方 Excel 汇入，不直接改易助数据库。</p></div>
  </div>`;
};

V.apprset = () => {
  const docs = [['报价单', '毛利低于 12%', '业务主管', '总经理（毛利低于 8%）', '业务助理'], ['合同（PI）', '超过信用额度或金额 > USD 100,000', '业务主管', '总经理', '财务'], ['订单变更', '任何变更', '业务主管', '—', '跟单、生产计划'], ['收款认领', '付款人与买方不一致', '财务主管', '—', '负责业务'], ['样品借出', '单次价值 > USD 500', '业务主管', '—', '仓库'], ['出运', '合规检查未通过', '单证主管', '—', '负责业务']];
  const sel = (id, v, opts) => `<select id="${id}" aria-label="审批人">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  const P = ['业务主管', '财务主管', '单证主管', '总经理', '—'];
  return head('审批设置', '每种单据各自设定：什么情况要审批、谁审、批完通知谁') + `
  <div class="banner own"><b>默认两段</b><span>“送审＋审核”两段，与易助现在的做法一致。需要时可以加到第 3～6 层，或设金额门槛与会签。</span></div>
  <div class="tbl"><table><thead><tr><th>单据</th><th>触发条件</th><th>第 1 层</th><th>第 2 层</th><th>批完通知</th><th></th></tr></thead><tbody>${docs.map((d, i) => `<tr><td><b>${d[0]}</b></td><td class="wrap">${d[1]}</td><td>${sel('ap1-' + i, d[2], P)}</td><td>${d[3] === '—' ? '<span class="note" style="margin:0">不需要</span>' : `<span class="wrap">${d[3]}</span>`}</td><td class="wrap">${d[4]}</td><td><button class="btn sm" type="button" data-act="toast" data-msg="已为「${d[0]}」新增一层审批（演示）">${ic('plus')}加一层</button></td></tr>`).join('')}</tbody></table></div>
  <div class="grid g2 mt">
    <div class="card"><h3>审批方式</h3><div style="display:grid;gap:10px"><label class="chk"><input type="radio" name="am" checked> 依序审批（第 1 层通过才到第 2 层）</label><label class="chk"><input type="radio" name="am"> 会签（同一层所有人都要同意）</label><label class="chk"><input type="checkbox" checked> 推送到企业微信</label><label class="chk"><input type="checkbox" checked> 超过 24 小时未处理，提醒上一级</label></div></div>
    <div class="card"><h3>预览：报价单毛利 9.4%</h3><div class="trace">
      <div class="tn"><span class="dot d"></span><span class="lbl"><b>送审</b><span>周可 · 11-17 16:02</span></span><span></span></div>
      <div class="tn"><span class="dot a"></span><span class="lbl"><b>第 1 层 · 业务主管</b><span>等待处理，已推送企业微信</span></span><span></span></div>
      <div class="tn"><span class="dot w"></span><span class="lbl"><b>通知业务助理</b><span>审批完成后</span></span><span></span></div>
    </div></div>
  </div>
  <div class="toolbar mt"><button class="btn pri" type="button" data-act="toast" data-msg="审批设置已保存（演示）">保存设置</button></div>`;
};

V.category = () => {
  const opt = { 业务类型: ['外销', '内销', '—'], 用途: ['量产', '样品', '验证', '需求预测', '—'], 产品线: ['光模块', '芯片', '—'] };
  const map = [['外贸', '业务类型', '外销'], ['国外', '业务类型', '外销'], ['内贸', '业务类型', '内销'], ['国内', '业务类型', '内销'], ['样品', '用途', '样品'], ['验证', '用途', '验证'], ['需求', '用途', '需求预测'], ['芯片', '产品线', '芯片'], ['22', '项目号', '待确认'], ['365', '项目号', '待确认'], ['647', '项目号', '待确认']];
  return head('业务分类', '易助“性质类型”一个下拉混了内外销、用途、产品线和项目号，这里拆成四个字段') + `
  <div class="grid g2">
    <div class="card"><h3>现有值怎么对应 <small>易助 → 本系统</small></h3><div style="display:grid;gap:8px">${map.map(([o, f, v], i) => `<div class="map"><span class="old">${o}</span><span class="arr">→</span><span class="toolbar" style="flex-wrap:nowrap"><span class="tag own">${f}</span>${f === '项目号' ? pill('请贵司确认含义', 'warn') : `<select id="cat-${i}" aria-label="${o} 对应值" style="width:auto">${opt[f].map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select>`}</span></div>`).join('')}</div></div>
    <div class="card"><h3>拆分后的四个字段</h3>${table(['字段', '可选值', '用在哪里'], [['业务类型', '外销、内销', '流程节点、单证、开票'], ['用途', '量产、样品、验证、需求预测', '样品统计、利润分开看'], ['产品线', '光模块、芯片', '业绩与毛利按产品线'], ['项目号', '自由输入', '对应客户项目或专案']])}
      <p class="note">拆开后，报表才能直接按“外销量产”“样品”分开统计；同步回易助时，仍写回原来的性质值，易助那边不用改。</p>
      <h3 class="mt">示例：一张合同</h3><div class="lvl"><span class="chip on">外销</span><span class="sep">·</span><span class="chip on">量产</span><span class="sep">·</span><span class="chip on">光模块</span><span class="sep">·</span><span class="chip">项目号（空）</span></div></div>
  </div>`;
};

V.perm = () => {
  const roles = [['业务员', '自己的客户与合同', '可看', '隐藏', '隐藏'], ['业务主管', '本部门', '可看', '可看', '可看'], ['跟单', '分配给自己的合同', '可看', '隐藏', '隐藏'], ['单证', '全部出运', '隐藏', '隐藏', '隐藏'], ['财务', '全部', '可看', '可看', '可看'], ['总经理', '全部', '可看', '可看', '可看']];
  const cell = v => v === '可看' ? pill('可看', 'ok') : pill('隐藏', 'mute');
  return head('权限', '按角色决定看得到哪些客户、哪些字段') + `
  <div class="banner ok"><b>新账号默认看不到任何客户</b><span>先指定角色与负责的客户范围才开放，避免新账号一建好就看到全部客户与供应商资料。</span></div>` +
  table(['角色', '数据范围', '售价', '成本与底价', '利润'], roles.map(r => [`<b>${r[0]}</b>`, r[1], cell(r[2]), cell(r[3]), cell(r[4])])) + `
  <p class="note">业务员的客户范围可按“负责业务＋客户地区”限定，与易助现有的“用户限定基础数据”一致。</p>`;
};

V.country = () => head('国家配置', '开拓新国家只改配置，不改程序') +
  table(['国家', '语言', '币种', '日期格式', '产地证', '合规要点'], [['越南', '英文、越南文', 'USD', 'DD/MM/YYYY', 'Form E', '越文标签'], ['泰国', '英文', 'USD', 'DD/MM/YYYY', 'RCEP / Form E', '—'], ['菲律宾', '英文', 'USD', 'MM/DD/YYYY', 'Form E', '—'], ['印尼', '英文、印尼文', 'USD', 'DD/MM/YYYY', 'Form E', 'SDPPI 认证（通信设备）'], ['墨西哥', '英文、西班牙文', 'USD', 'DD/MM/YYYY', '原产地声明', '进口商 RFC 税号'], ['德国', '英文、德文', 'USD／EUR', 'DD.MM.YYYY', '—', 'CE、RoHS 声明']]) +
  `<p class="note">单证模板、发票语言、金额小数位都跟着国家走。</p>`;

V.window = () => head('国际贸易单一窗口', '先做“导出符合格式的资料”，再评估直接对接') + `
  <div class="grid g2">
    <div class="card"><h3>可导出的资料</h3>${table(['资料', '格式', '状态'], [['报关单草稿', '单一窗口导入格式', pill('可用', 'ok')], ['原产地证申请', 'Form E / RCEP', pill('可用', 'ok')], ['商业发票与装箱单', 'PDF、Excel', pill('可用', 'ok')]])}<div class="toolbar" style="margin-top:12px"><button class="btn pri" type="button" data-act="toast" data-msg="已导出 SH-2611-03 报关资料（演示）">导出 SH-2611-03</button></div></div>
    <div class="card"><h3>为什么先导出</h3><p class="note" style="margin-top:0">单一窗口直接对接需要企业资质与接口申请，时间较长。先导出符合格式的资料，单证员复制导入即可，已经能省掉大部分重复输入。</p></div>
  </div>`;

V.portal = () => head('客户门户', '客户用链接登录，只看自己的 PI 与单证') + `
  <div class="grid g2">
    <div class="card"><h3>客户看到的画面</h3><div class="phone"><div class="pc"><h5>Kepler Telecom · Orders</h5>
      <div style="display:grid;gap:8px">${[['PI20261103KEP', 'In production 45%', 'ETD 11-28'], ['PI20260912KEP', 'Delivered', 'Invoice due']].map(r => `<div style="border-top:1px solid var(--line);padding-top:8px"><b class="m">${r[0]}</b><br><span style="color:var(--muted)">${r[1]} · ${r[2]}</span></div>`).join('')}</div>
      <div class="toolbar" style="margin-top:10px"><span class="btn sm">Download PI</span><span class="btn sm">Packing list</span></div></div></div></div>
    <div class="card"><h3>外协厂看到的画面</h3><p class="note" style="margin-top:0">外协厂只看到分配给自己的委外单、送料清单与预计回货日，可以上传回货照片与检验报告。</p>${table(['委外单', '主件', '数量', '预计回货'], [[mono('WW20261116001'), 'PCBA-QS100', 220, '11-23']], { num: [2] })}</div>
  </div>`;
</script>
