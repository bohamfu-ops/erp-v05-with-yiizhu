<script>
/* ================= 基础工具 ================= */
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = t => String(t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const TODAY = new Date(2026, 10, 18);
const md = s => { const [m, d] = s.split('-').map(Number); return new Date(2026, m - 1, d); };
const daysPast = s => Math.round((TODAY - md(s)) / 864e5);
const S = {
  view: 'dash', arg: null, tab: 'lines', drawer: null, choice: {}, note: {},
  custF: '全部', scF: '全部', recSel: 'SK-1188', shipSel: 'SH-2611-03', traceSel: 'PI20261103KEP', sampleF: '全部', arF: '全部', perfRule: 'gp', perfCash: true,
  q: { cust: 'C-304', prod: 'C91QS100LR4-A2', cost: 680, rebate: 13, fx: 7.1432, freight: 0.9, qty: 300, comm: 2, margin: 12, extra: 4 }
};
try { const c = JSON.parse(localStorage.getItem('erp5-req') || '{}'); if (c && typeof c === 'object') S.choice = c; } catch (_) {}
try { const n = JSON.parse(localStorage.getItem('erp5-note') || '{}'); if (n && typeof n === 'object') S.note = n; } catch (_) {}

/* ================= 示例数据（全部为虚构） ================= */
function seed() {
  return {
    customers: [
      { id: 'C-301', name: 'Kepler Telecom GmbH', short: 'Kepler', country: '德国', cc: 'DE', cur: 'USD', level: 'A', sales: '林晓', pool: '私海', last: '2 天前', type: '外销', yz: 'N0042', contact: 'Jonas Weber（采购经理）', ch: '邮件', credit: 150000, terms: '30% 订金，出货前付清',
        follow: [['11-16', '邮件', '确认追加 300 只 10G LR，交期改 11-28'], ['11-03', '视频会议', 'PI 确认，订金三天内付'], ['10-21', '邮件', '100G LR4 样品测试通过']],
        chat: [['客户', '11-16 15:02', 'Can you add 300 pcs of 10G LR to the current PI?'], ['我', '11-16 15:20', 'Yes. Updated PI will be sent today, lead time 11/28.'], ['客户', '11-16 15:22', 'Perfect, thanks Lin.']] },
      { id: 'C-302', name: 'Altamira Networks S.A. de C.V.', short: 'Altamira', country: '墨西哥', cc: 'MX', cur: 'USD', level: 'A', sales: '陈一凡', pool: '私海', last: '昨天', type: '外销', yz: 'N0051', contact: 'Lucía Romero（技术采购）', ch: 'WhatsApp', credit: 120000, terms: '30% 订金，见提单副本付清',
        follow: [['11-17', 'WhatsApp', '客户要求改中性包装＋英文说明书'], ['11-09', '快递', '寄出 100G LR4 样品 4 只'], ['10-28', 'WhatsApp', 'PI 确认']],
        chat: [['客户', '11-17 09:41', 'Please ship with neutral packing and English manual.'], ['我', '11-17 09:55', 'Noted, change order submitted. No extra cost.']] },
      { id: 'C-303', name: 'Saigon FiberLink JSC', short: 'Saigon FL', country: '越南', cc: 'VN', cur: 'USD', level: 'B', sales: '林晓', pool: '私海', last: '6 天前', type: '外销', yz: 'N0063', contact: 'Nguyen Thu Ha（采购）', ch: 'Zalo', credit: 60000, terms: '全款发货',
        follow: [['11-12', 'Zalo', '已签收，询问下一批 CWDM 价格'], ['10-21', 'Zalo', 'PI 确认，全款已付']],
        chat: [['客户', '11-12 10:05', 'Goods received. Price for next 6,000 pcs?'], ['我', '11-12 10:30', 'Will send quotation by Friday.']] },
      { id: 'C-304', name: 'Bangkok NetOps Co., Ltd.', short: 'BKK NetOps', country: '泰国', cc: 'TH', cur: 'USD', level: 'B', sales: '周可', pool: '私海', last: '今天', type: '外销', yz: 'N0067', contact: 'Somchai P.（老板）', ch: 'LINE', credit: 50000, terms: '30% 订金，到货后 20 天付清',
        follow: [['11-18', 'LINE', '催收尾款，客户说月底前付'], ['11-17', 'LINE', '询价 100G LR4 300 只'], ['11-08', 'LINE', '反映 12 只 10G LR 的 DDM 读数异常']],
        chat: [['我', '11-18 10:12', 'Kindly arrange the balance USD 26,320, it is 12 days overdue.'], ['客户', '11-18 10:40', 'Will pay before month end.']] },
      { id: 'C-305', name: 'Manila Opticom Inc.', short: 'Manila Opticom', country: '菲律宾', cc: 'PH', cur: 'USD', level: 'C', sales: '陈一凡', pool: '私海', last: '4 天前', type: '外销', yz: 'N0072', contact: 'Paolo Reyes（采购）', ch: 'WhatsApp', credit: 30000, terms: '30% 订金，出货前付清',
        follow: [['11-14', 'WhatsApp', '订金由香港贸易公司代付'], ['11-09', 'WhatsApp', 'PI 确认 GPON 1,200 只']],
        chat: [['客户', '11-14 18:20', 'Deposit paid by our HK partner, Optimax Trading.'], ['我', '11-14 18:31', 'Please send a payment authorization letter.']] },
      { id: 'C-306', name: 'PT Jakarta LinkWorks', short: 'Jakarta LW', country: '印尼', cc: 'ID', cur: 'USD', level: 'C', sales: '—', pool: '公海', last: '35 天前', type: '外销', yz: '—', contact: 'Budi S.', ch: 'WhatsApp', credit: 20000, terms: '—',
        follow: [['10-14', 'WhatsApp', '询价 10G LR 800 只，提到需要 SDPPI 认证']], chat: [['客户', '10-14 11:02', 'Do you have SDPPI certificate?']] },
      { id: 'C-307', name: '深圳云帆网络科技有限公司', short: '云帆网络', country: '中国', cc: 'CN', cur: 'CNY', level: 'B', sales: '周可', pool: '私海', last: '今天', type: '内销', yz: 'N0018', contact: '刘工（采购）', ch: '微信', credit: 500000, terms: '货到 30 天',
        follow: [['11-18', '微信', '确认 11-30 送货']], chat: [['客户', '11-18 08:50', '25G 那批 11 月底能到吗？'], ['我', '11-18 09:02', '可以，排在 11 月 30 日。']] }
    ],
    products: [
      { code: 'C91QS100LR4-A2', inner: '91QS100LR4-A2', name: '100G QSFP28 LR4 10km', hs: '8517.6200', kg: 0.12, cost: 680, rebate: 13 },
      { code: 'C91SP10LR-D1', inner: '91SP10LR-D1', name: '10G SFP+ LR 1310nm 10km', hs: '8517.6200', kg: 0.05, cost: 58, rebate: 13 },
      { code: 'C91SP25SR-B1', inner: '91SP25SR-B1', name: '25G SFP28 SR 850nm 100m', hs: '8517.6200', kg: 0.05, cost: 72, rebate: 13 },
      { code: 'C91SPCW55-40', inner: '91SPCW55-40', name: '1.25G SFP CWDM 1550nm 40km', hs: '8517.6200', kg: 0.05, cost: 38, rebate: 13 },
      { code: 'C91GPON-CP', inner: '91GPON-CP', name: 'GPON OLT Class C+ SFP', hs: '8517.6200', kg: 0.05, cost: 96, rebate: 13 }
    ],
    quotes: [
      { id: 'BJ2026111702', ver: 1, cust: 'C-304', prod: 'C91QS100LR4-A2', qty: 300, price: 121.0, margin: 9.4, status: '待审批', att: 2, sales: '周可' },
      { id: 'BJ2026111401', ver: 1, cust: 'C-306', prod: 'C91SP10LR-D1', qty: 800, price: 10.4, margin: 18.1, status: '已发客户', att: 1, sales: '林晓' },
      { id: 'BJ2026110301', ver: 3, cust: 'C-301', prod: 'C91QS100LR4-A2', qty: 200, price: 128.0, margin: 15.8, status: '已转合同', pi: 'PI20261103KEP', att: 3, sales: '林晓' },
      { id: 'BJ2026102501', ver: 2, cust: 'C-302', prod: 'C91SP25SR-B1', qty: 3000, price: 14.6, margin: 16.4, status: '已转合同', pi: 'PI20261028ALT', att: 2, sales: '陈一凡' }
    ],
    quoteVers: { BJ2026110301: [['V1', '10-21', 'USD 136.00', '首次报价'], ['V2', '10-28', 'USD 131.00', '客户要求 200 只以上降价'], ['V3', '11-02', 'USD 128.00', '加订 10G LR 1,500 只打包价']] },
    contracts: [
      { pi: 'PI20261103KEP', xs: 'XS20261100071', cust: 'C-301', type: '外销', term: 'FOB 深圳', cur: 'USD', sales: '林晓', lines: [['C91QS100LR4-A2', 200, 128.0], ['C91SP10LR-D1', 1500, 9.8]], node: 3, ver: 2,
        pay: [['订金 30%', 12090, '11-06', '已收'], ['出货前 70%', 28210, '11-28', '未收']], wo: ['WO20261116007', 'WO20261116008'], ww: 'WW20261116001', ck: '', xh: '', zp: '', est: 61200, act: null, co: '—', late: 0, use: '量产' },
      { pi: 'PI20261028ALT', xs: 'XS20261100064', cust: 'C-302', type: '外销', term: 'CIP 墨西哥城', cur: 'USD', sales: '陈一凡', lines: [['C91SP25SR-B1', 3000, 14.6]], node: 5, ver: 1,
        pay: [['订金 30%', 13140, '10-30', '已收'], ['见提单副本 70%', 30660, '12-05', '到账待认领']], wo: ['WO20261102015'], ww: '', ck: 'CK2026111702', xh: '', zp: '', est: 52300, act: null, co: '—', late: 0, use: '量产' },
      { pi: 'PI20261021SGF', xs: 'XS20261000058', cust: 'C-303', type: '外销', term: 'CPT 胡志明', cur: 'USD', sales: '林晓', lines: [['C91SPCW55-40', 4000, 6.2]], node: 10, ver: 1,
        pay: [['全款', 24800, '11-10', '已收']], wo: ['WO20261024011'], ww: '', ck: 'CK2026110402', xh: 'XH2026110503', zp: 'ZP2026110501', est: 27900, act: 27120, co: 'Form E', late: 0, use: '量产' },
      { pi: 'PI20261015BKN', xs: 'XS20261000049', cust: 'C-304', type: '外销', term: 'FOB 深圳', cur: 'USD', sales: '周可', lines: [['C91SP10LR-D1', 3000, 9.5], ['C91GPON-CP', 500, 18.2]], node: 9, ver: 1,
        pay: [['订金 30%', 11280, '10-17', '已收'], ['尾款 70%', 26320, '11-06', '逾期']], wo: ['WO20261018004'], ww: '', ck: 'CK2026102902', xh: 'XH2026103001', zp: 'ZP2026102702', est: 46800, act: null, co: 'RCEP', late: 12, use: '量产' },
      { pi: 'PI20261009MNO', xs: '', cust: 'C-305', type: '外销', term: 'CPT 马尼拉', cur: 'USD', sales: '陈一凡', lines: [['C91GPON-CP', 1200, 17.6]], node: 2, ver: 1,
        pay: [['订金 30%', 6336, '11-14', '到账待认领'], ['出货前 70%', 14784, '12-10', '未收']], wo: [], ww: '', ck: '', xh: '', zp: '', est: 21400, act: null, co: 'Form E', late: 0, use: '量产', block: '信用额度待审批，暂不下单到易助' },
      { pi: 'HT20261108YF', xs: 'XS20261100052', cust: 'C-307', type: '内销', term: '送货上门', cur: 'CNY', sales: '周可', lines: [['C91SP25SR-B1', 2000, 98.0]], node: 3, ver: 1,
        pay: [['货到 30 天', 196000, '12-30', '未收']], wo: ['WO20261113055'], ww: '', ck: '', xh: '', zp: '', est: 33600, act: null, co: '—', late: 0, use: '量产' }
    ],
    changes: [
      { id: 'BG-0013', pi: 'PI20261028ALT', ver: '002', date: '11-17', diff: [['包装', '标准彩盒', '中性包装＋英文说明书'], ['标签', '贵司 Logo', '无 Logo']], reason: '客户要求中性包装', st: '待审批', by: '陈一凡' },
      { id: 'BG-0012', pi: 'PI20261103KEP', ver: '002', date: '11-12', diff: [['C91SP10LR-D1 数量', '1,200', '1,500'], ['交期', '11-25', '11-28'], ['合同金额', 'USD 37,360.00', 'USD 40,300.00']], reason: '客户追加 300 只', st: '已同步易助', by: '林晓' }
    ],
    samples: [
      { id: 'YP-0033', cust: 'C-304', prod: 'C91QS100LR4-A2', qty: 2, out: '11-18', due: '12-18', jc: '', st: '待借出', note: '客户评估 100G 方案' },
      { id: 'YP-0031', cust: 'C-302', prod: 'C91QS100LR4-A2', qty: 4, out: '11-09', due: '12-09', jc: 'JC2026110901', st: '测试中', note: '客户实验室兼容性测试' },
      { id: 'YP-0028', cust: 'C-301', prod: 'C91SP25SR-B1', qty: 10, out: '10-15', due: '11-15', jc: 'JC2026101502', st: '逾期未还', note: '客户说测试完会归还 6 只' },
      { id: 'YP-0024', cust: 'C-303', prod: 'C91SPCW55-40', qty: 6, out: '09-20', due: '10-20', jc: 'JC2026092001', st: '已转订单', note: '测试通过，转为 PI20261021SGF', pi: 'PI20261021SGF' }
    ],
    receipts: [
      { id: 'SK-1188', date: '11-17', payer: 'ALTAMIRA NETWORKS S.A. DE C.V.', amt: 30660, cur: 'USD', bank: '中国银行 美元户', claimed: null },
      { id: 'SK-1186', date: '11-14', payer: 'OPTIMAX TRADING LIMITED (HK)', amt: 6336, cur: 'USD', bank: '跨境收款平台', claimed: null },
      { id: 'SK-1179', date: '11-06', payer: 'KEPLER TELECOM GMBH', amt: 12090, cur: 'USD', bank: '中国银行 美元户', claimed: 'PI20261103KEP · 订金 30%', rate: 7.1432, yz: '收款单 SK2026110601 已核销' }
    ],
    ar: [
      { zp: 'ZP2026102702', pi: 'PI20261015BKN', cust: 'C-304', cur: 'USD', amt: 26320, got: 0, due: '11-06', log: [['11-18', 'LINE', '客户承诺月底前付']] },
      { zp: 'ZP2026091803', pi: 'PI20260912KEP', cust: 'C-301', cur: 'USD', amt: 18600, got: 0, due: '10-08', log: [['11-10', '邮件', '客户付款流程卡在内部审批'], ['10-20', '邮件', '第一次提醒']] },
      { zp: 'ZP2026080401', pi: 'PI20260728ALT', cust: 'C-302', cur: 'USD', amt: 22400, got: 12000, due: '09-03', log: [['10-30', 'WhatsApp', '已付 12,000，余款等对方银行放行']] },
      { zp: 'ZP2026061102', pi: 'PI20260605MNO', cust: 'C-305', cur: 'USD', amt: 9800, got: 0, due: '07-11', log: [['09-02', 'WhatsApp', '客户称货有质量问题，要求扣款']] },
      { zp: 'ZP2026042001', pi: 'PI20260416BKN', cust: 'C-304', cur: 'USD', amt: 7400, got: 0, due: '05-20', log: [] },
      { zp: 'ZP2026111201', pi: 'PI20261103KEP', cust: 'C-301', cur: 'USD', amt: 28210, got: 0, due: '11-28', log: [] },
      { zp: 'ZP2026110501', pi: 'PI20261021SGF', cust: 'C-303', cur: 'USD', amt: 24800, got: 24800, due: '11-10', log: [] }
    ],
    fx: {
      locks: [['2026-11', 7.1432, '财务 · 赵敏', '11-01 09:12'], ['2026-10', 7.1186, '财务 · 赵敏', '10-01 09:05'], ['2026-09', 7.1120, '财务 · 赵敏', '09-01 09:20']],
      daily: [['11-11', 7.1395], ['11-12', 7.1421], ['11-13', 7.1460], ['11-14', 7.1452], ['11-17', 7.1488], ['11-18', 7.1503]],
      yzLast: '2025-01-02', yzRate: 7.1879,
      hist: [['11-12', 24800, 7.1350, 'PI20261021SGF 全款'], ['10-31', 13140, 7.1290, 'PI20261028ALT 订金'], ['10-20', 11280, 7.1210, 'PI20261015BKN 订金']],
      unsettled: 12090
    },
    approvals: [
      { id: 'AP-412', type: '订单变更', ref: 'BG-0013', who: '陈一凡', detail: 'PI20261028ALT 改中性包装＋英文说明书', status: '待审批', step: '第 1 层 · 业务主管', go: 'contract|PI20261028ALT|change' },
      { id: 'AP-411', type: '信用额度超限', ref: 'PI20261009MNO', who: '陈一凡', detail: '额度 USD 30,000，已有未收 USD 9,800，本单 USD 21,120', status: '待审批', step: '第 2 层 · 总经理', go: 'contract|PI20261009MNO' },
      { id: 'AP-409', type: '报价毛利低于门槛', ref: 'BJ2026111702', who: '周可', detail: '毛利 9.4%，门槛 12%', status: '待审批', step: '第 1 层 · 业务主管', go: 'quote' }
    ],
    ships: [
      { id: 'SH-2611-03', mode: '空运', route: '深圳 → 墨西哥城 MEX', etd: '11-24', items: [['PI20261028ALT', 'C91SP25SR-B1', 3000]], freight: 1860, ck: 'CK2026111702', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 0, 空运提单: 0, 原产地声明: 0 }, st: '待订舱' },
      { id: 'SH-2611-01', mode: '快递 DHL', route: '深圳 → 胡志明 SGN', etd: '11-05', items: [['PI20261021SGF', 'C91SPCW55-40', 4000]], freight: 620, ck: 'CK2026110402', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 1, 运单: 1, 'Form E 产地证': 1 }, st: '已签收' },
      { id: 'SH-2610-07', mode: '空运', route: '深圳 → 曼谷 BKK', etd: '10-30', items: [['PI20261015BKN', 'C91SP10LR-D1', 3000], ['PI20261015BKN', 'C91GPON-CP', 500]], freight: 980, ck: 'CK2026102902', docs: { 商业发票: 1, 装箱单: 1, 报关资料: 1, 空运提单: 1, 'RCEP 原产地证书': 1 }, st: '已到港' }
    ],
    after: [
      { id: 'AS-0021', pi: 'PI20261015BKN', cust: 'C-304', prod: 'C91SP10LR-D1', qty: 12, kind: '返修', reason: 'DDM 读数异常（温度偏高 8°C）', step: 2, steps: ['登记', '客户寄回', '检测', '维修或换新', '寄回客户'] },
      { id: 'AS-0019', pi: 'PI20260728ALT', cust: 'C-302', prod: 'C91SP25SR-B1', qty: 30, kind: '退货', reason: '客户交换机兼容性问题，改订 10G', step: 4, steps: ['登记', '退货证明', '进口报关', '入库检验', '退款或换货'] }
    ],
    rebates: [
      { cd: '5316 2026 1100 0412', pi: 'PI20261021SGF', inv: '进项专票 2 张', match: '一致', amt: 19940, st: '可申报' },
      { cd: '5316 2026 1000 0388', pi: 'PI20261015BKN', inv: '进项专票 3 张', match: '规格写法不一致', amt: 31230, st: '待更正' },
      { cd: '—', pi: 'PI20261028ALT', inv: '已到票', match: '—', amt: 0, st: '未报关' }
    ],
    wos: [
      { id: 'WO20261116007', xs: 'XS20261100071', item: '91QS100LR4-A2', qty: 200, done: 90, due: '11-22', st: '生产中' },
      { id: 'WO20261116008', xs: 'XS20261100071', item: '91SP10LR-D1', qty: 1500, done: 0, due: '11-25', st: '待领料' },
      { id: 'WO20261102015', xs: 'XS20261100064', item: '91SP25SR-B1', qty: 3000, done: 3000, due: '11-15', st: '已完工' },
      { id: 'WO20261113055', xs: 'XS20261100052', item: '91SP25SR-B1', qty: 2000, done: 0, due: '11-30', st: '欠料：25G VCSEL' }
    ],
    wws: [{ id: 'WW20261116001', xs: 'XS20261100071', sup: '外协厂甲（PCBA 贴片）', item: 'PCBA-QS100', qty: 220, sent: 220, back: 0, due: '11-23' }],
    stock: [['C91QS100LR4-A2', '100G QSFP28 LR4', '成品仓', 36, 0, 120], ['C91SP10LR-D1', '10G SFP+ LR', '成品仓', 820, 600, 2400], ['C91SP25SR-B1', '25G SFP28 SR', '成品仓', 3060, 3000, 900], ['C91SPCW55-40', '1.25G CWDM 40km', '成品仓', 1240, 0, 5200], ['C91GPON-CP', 'GPON OLT C+', '成品仓', 140, 0, 650]],
    bom: { code: 'C91QS100LR4-A2', inner: '91QS100LR4-A2', parts: [['PCBA-QS100', 'PCBA 100G LR4', 1, 186.0, '委外贴片'], ['TOSA-LR4', '发射器件 TOSA LR4', 1, 238.0, '采购'], ['ROSA-LR4', '接收器件 ROSA LR4', 1, 142.0, '采购'], ['SHELL-QS28', 'QSFP28 外壳', 1, 12.5, '采购'], ['PULL-QS28', '拉环', 1, 1.2, '采购'], ['HS-QS28', '散热片', 2, 3.4, '采购']] },
    batches: [['IMP-1117-02', '11-17 16:40', '订单变更', 'BG-0012 → XS20261100071 V002', '已汇入'], ['IMP-1109-01', '11-09 09:30', '订单', 'PI20261009MNO', '暂停：信用额度待审批'], ['IMP-1103-01', '11-03 10:12', '订单', 'PI20261103KEP → XS20261100071', '已汇入'], ['IMP-1028-03', '10-28 17:05', '客户', 'Altamira → N0051', '已汇入']]
  };
}
let DB = seed();

const NODES = {
  外销: ['报价', 'PI 确认', '易助下单', '生产', '质检', '订舱', '出库', '报关', '提单', '收款', '结汇', '退税'],
  内销: ['报价', '合同', '易助下单', '生产', '出库', '开票', '回款']
};
const YZN = { 外销: [2, 3, 4, 6], 内销: [2, 3, 4, 5] };   // 由易助读回的节点
const custOf = id => DB.customers.find(c => c.id === id) || {};
const prodOf = code => DB.products.find(p => p.code === code) || { name: code, inner: code };
const scOf = pi => DB.contracts.find(c => c.pi === pi);
const total = c => c.lines.reduce((a, l) => a + l[1] * l[2], 0);
const pendingAp = () => DB.approvals.filter(a => a.status === '待审批').length;
const arOpen = () => DB.ar.filter(r => r.amt - r.got > 0);
const overdueAmt = () => arOpen().filter(r => daysPast(r.due) > 0).reduce((a, r) => a + r.amt - r.got, 0);
const curLock = () => DB.fx.locks[0];

/* ================= 图标 ================= */
const IC = {
  req: '<path d="M9 11l2 2 4-4"/><rect x="4" y="4" width="16" height="16" rx="3"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  approvals: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  customers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18.5 14.8c1.6.9 2.6 2.7 3 5.2"/>',
  quote: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>',
  contracts: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  follow: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  samples: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7.5 15h9"/>',
  ship: '<path d="M2 16l20-6-7 11-3-5z"/><path d="M12 16l3-6"/>',
  after: '<path d="M14.5 5.5l4 4-9 9H5.5v-4z"/><path d="M12.5 7.5l4 4"/>',
  receipts: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
  ar: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  fx: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  rebate: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  profit: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  comm: '<path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/>',
  trace: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10M8 5h3a5 5 0 015 5v0M8 19h3a5 5 0 005-5"/>',
  prod: '<path d="M3 21V10l5 3V10l5 3V7l8 4v10z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
  yzlink: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  apprset: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  category: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/>',
  perm: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  country: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
  portal: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  check: '<path d="M5 12l5 5L20 7"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  reset: '<path d="M4 12a8 8 0 108-8 8 8 0 00-6.3 3"/><path d="M4 4v4h4"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  clip: '<path d="M20 11.5l-8.2 8.2a5 5 0 01-7-7L13 4.5a3.5 3.5 0 015 5l-8.2 8.2a2 2 0 01-2.8-2.8L14.5 7.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const ic = k => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ''}</svg>`;

const NAV = [
  ['确认', [['req', '需求确认']]],
  ['总览', [['dash', '工作台'], ['approvals', '审批中心']]],
  ['销售', [['customers', '客户'], ['quote', '报价'], ['contracts', '合同（PI）'], ['follow', '跟单看板'], ['samples', '样品与借出'], ['ship', '出运与单证'], ['after', '售后与返修']]],
  ['财务', [['receipts', '收款登记'], ['ar', '应收跟催'], ['fx', '汇率与结汇'], ['rebate', '出口退税'], ['profit', '单票利润'], ['comm', '业绩与提成']]],
  ['易助联动', [['trace', '订单追溯'], ['prod', '生产与库存'], ['yzlink', '对接状态']]],
  ['设置', [['apprset', '审批设置'], ['category', '业务分类'], ['perm', '权限'], ['country', '国家配置'], ['window', '单一窗口'], ['portal', '客户门户']]]
];
const TITLE = Object.fromEntries(NAV.flatMap(([g, it]) => it.map(([k, n]) => [k, [g, n]])));
TITLE.contract = ['销售', '合同明细'];

/* ================= 需求确认清单 ================= */
// [编号, 名称, 建议, 谁, 情境, 操作, 结果, 说明, 演示, 是否 v0.5 新增]
const REQ = [
  ['销售', '从询价到收款的外贸主线', [
    ['r-cust', '客户中心与公海私海', 'r1', '业务员', '新客户询价、日常跟进', '建档、记录跟进；一个画面看应收、逾期、已订未出', '客户资源归公司，业务离职一键移交', '比易助“客户查询中心”多了跟进与对话记录', 'customers|C-301', 0],
    ['r-quote', '结构化报价与版本', 'r1', '业务员', '客户询价时', '输入成本、汇率、运费、佣金，保存为报价单并保留每一版', '毛利低于门槛自动送审；报价内容不再只存在 Excel 附件里', '目前报价多以 Excel 附件挂在易助报价单上', 'quote', 1],
    ['r-pi', '以 PI 号管理合同', 'r1', '业务员', '客户确认报价后', '一键转成 PI 与合同，设好订金、尾款', 'PI 号与易助订单号（XS）互相对照，两边都查得到', '沿用贵司现有的 PI 编号习惯', 'contract|PI20261103KEP', 1],
    ['r-change', '订单变更与版本对照', 'r1', '业务、跟单', '客户改数量、交期、包装', '开变更单，系统列出改了哪里', '审批后自动同步成易助订单变更单', '订单变更是日常高频操作', 'contract|PI20261103KEP|change', 1],
    ['r-domestic', '内销订单', 'r1', '内销业务', '国内客户下单', '开内销合同，选发票类型', '与外销共用报价、跟单、收款', '同一套流程，只在单证与开票节点不同', 'contracts|内销', 0],
    ['r-sample', '样品与借出', 'r1', '业务员', '寄样给客户测试', '登记寄样，系统同步易助借出单并提醒归还', '测试通过可一键转成正式 PI', '样品验证是光模块成交的关键一步', 'samples', 1],
    ['r-follow', '跟单看板（含生产进度）', 'r1', '跟单', '每天追进度', '看板同时显示易助工单、委外贴片进度', '逾期自动标红，不靠电话追', '生产数据读自易助', 'follow', 0],
    ['r-trace', '订单追溯', 'r1', '业务、老板', '客户问“我的货到哪了”', '从 PI 一路查到工单、出库、发票、收款', '不用分别打开多个系统', '易助已有订单树状查询，这里加上外贸与收款段', 'trace', 1],
    ['r-ship', '出运与单证', 'r1', '单证员', '出货前', '生成商业发票、装箱单、报关资料，关联易助出库单', '资料只录一次，单证统一存档', '取代在出库单备注写 PI 号、用聊天软件传报关资料', 'ship', 0],
    ['r-comp', '国别合规与产地证', 'r2', '单证员', '出货前', '系统建议用 Form E 还是 RCEP，检查目的国文件', '缺文件时出货前就拦下来', '东南亚各国要求变化快', 'ship|SH-2611-01', 0],
    ['r-after', '售后与返修', 'r1', '售后、品质', '客户反映问题', '反查原 PI，登记返修或退货', '返修进度与原订单关联', '光模块常见 DDM、兼容性问题', 'after', 0],
    ['r-profit', '单票利润', 'r1', '老板、财务', '每张 PI 结束后', '看预估与实际利润', '差异拆成汇差、成本、运费、退税', '易助有订单利润表，这里补上汇差与运费', 'profit', 0],
    ['r-perf', '归属业务与业绩', 'r1', '老板、财务', '每月统计', '合同记录实际负责的业务，与录单人分开', '业绩、提成可以按人统计', '提成口径需贵司确认', 'comm', 1]
  ]],
  ['生产与库存', '生产留在易助，本系统只读', [
    ['r-prod', '生产进度读回', 'r1', '业务、跟单', '客户问交期时', '在合同页直接看工单与委外进度', '不用再去问生产部', '易助工单已带订单号，可以直接对上', 'prod', 0],
    ['r-stock', '库存与可齐套数量', 'r1', '业务员', '报价、接单时', '查成品可用量与可齐套数量', '接单前就知道能不能交', '读自易助，库存账以易助为准', 'prod', 0],
    ['r-bom', '客户品号与 BOM 查看', 'ro', '业务员', '报价时', '看客户品号对应的内部品号与材料组成', 'C91 开头的客户品号自动对应内部 91 品号', '只读，不能修改 BOM', 'prod', 1]
  ]],
  ['财务', '本系统管外贸收款，正式核销在易助', [
    ['r-recv', '原币收款登记与认领', 'r1', '财务', '每笔款到账', '按原币登记，认领到 PI 的对应期数', '付款人与买方不一致时提示', '外销收款以美元记录，不再全部折成人民币', 'receipts', 1],
    ['r-ar', '应收跟催与账龄', 'r1', '财务、业务', '每周', '按 30／60／90／180 天看逾期，记录跟催', '逾期自动提醒负责业务', '目前账龄分段较粗', 'ar', 1],
    ['r-fx', '汇率锁定与结汇', 'r1', '财务', '每月初、结汇时', '每月锁定一次记账汇率，结汇记录实际汇率与汇差', '汇率太久没更新会自动提醒', '易助每日汇率表需要人工维护', 'fx', 1],
    ['r-rebate', '出口退税资料', 'r2', '财务', '每月申报前', '专票与报关单配对，导出申报资料', '规格写法不一致提前发现', '需要财务团队确认申报方式', 'rebate', 0],
    ['r-yzar', '易助应收与核销读回', 'rm', '系统', '每 15 分钟', '读回易助销售发票与收款核销结果', '合同页直接看到收款进度', '应收账仍以易助为准', 'trace', 1]
  ]],
  ['系统与对接', '权限、审批与外部系统', [
    ['r-appr', '审批设置', 'rm', '管理员', '设定每种单据谁审批', '默认送审＋审核两段，可加到多层', '与易助现有的多级审批习惯一致', '审批人、金额门槛都可调', 'apprset', 1],
    ['r-cat', '业务分类整理', 'r1', '管理员', '上线前', '把易助“性质类型”的值拆成业务类型、用途、产品线、项目', '报表能按外销内销、样品量产分开统计', '需要贵司确认每个值的意思', 'category', 1],
    ['r-perm', '团队权限', 'rm', '管理员', '新人入职、调岗', '按角色设定看得到什么、能做什么', '新账号默认看不到任何客户；成本、底价按角色隐藏', '避免新账号看到全部客户资料', 'perm', 0],
    ['r-stat', '数据统计', 'r1', '老板、主管', '每天、每月', '看出运、毛利、应收、业绩', '可导出 Excel', '', 'dash', 0],
    ['r-yz', '易助订单汇入', 'rm', '系统', '合同确认后', '按易助官方模板汇入订单，PI 号写入客户单号', '两边可以互相追查', '方案的必要功能', 'yzlink', 0],
    ['r-wecom', '审批与企业微信通知', 'r1', '主管、全员', '有待审批或逾期时', '在审批中心或企业微信直接处理', '主管在手机上就能审批', '免装 App', 'approvals', 0],
    ['r-im', 'WhatsApp、Zalo、LINE 对话归档', 'r2', '业务员', '与海外客户沟通', '对话自动归到客户名下', '业务离职时沟通记录不会流失', '需在境外部署节点', 'customers|C-302', 0],
    ['r-country', '国家配置', 'r1', '管理员', '开拓新国家时', '设定语言、币种、日期格式、合规要求、单证模板', '加一个国家只改配置', '', 'country', 0],
    ['r-window', '国际贸易单一窗口', 'r2', '单证员', '报关、申领产地证', '先导出符合格式的资料', '少打一次字', '需要单证团队反馈', 'window', 0],
    ['r-portal', '客户与工厂门户', 'r2', '客户、外协厂', '查进度、下载单据', '用链接登录，只看自己的单', '减少来回问进度', '第一版稳定后再开放', 'portal', 0]
  ]]
];
const REC = { r1: '建议一期', r2: '建议二期', ro: '可选', rm: '必要' };
const CH = { yes: '要', later: '之后再说', no: '不要', talk: '待讨论' };
const ALL = REQ.flatMap(g => g[2]);
</script>
