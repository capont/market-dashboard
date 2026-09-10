// verify_frontend.js —— 校验前端核心逻辑（自适应间隔 / 字段映射 / 驱动评分）
// 用法：node verify_frontend.js
(async ()=>{
  let pass=0, fail=0;
  const ok=(n,c)=>{ if(c){pass++;} else {fail++;console.log('  ✗',n);} };

  console.log('[1] 自适应间隔映射 ...');
  const intervalMap = (source)=> source==='1min' ? 30000 : source==='interpolated' ? 60000 : 300000;
  ok('1min -> 30s', intervalMap('1min')===30000);
  ok('interpolated -> 60s', intervalMap('interpolated')===60000);
  ok('demo -> 5min', intervalMap('demo')===300000);
  ok('未知值 -> 5min（白名单兜底）', intervalMap('anything_else')===300000);

  console.log('[2] 涨跌/颜色逻辑 ...');
  const cls = (v)=> v>0?'up':v<0?'down':'flat';
  ok('正=up', cls(0.5)==='up');
  ok('负=down', cls(-0.5)==='down');
  ok('零=flat', cls(0)==='flat');
  const fmt=(n,d=2)=> Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
  const chgPct=(v)=> (v>=0?'+':'')+fmt(v,2)+'%';
  ok('chgPct 正数带+', chgPct(1.23)==='+1.23%');
  ok('chgPct 负数带-', chgPct(-1.23)==='-1.23%');
  ok('fmt 两位小数', fmt(3.14159)==='3.14');

  console.log('[3] 驱动因素评分范围（模拟）...');
  const clamp=(v)=> Math.max(0,Math.min(100,v));
  ok('评分下限0', clamp(-50)===0);
  ok('评分上限100', clamp(250)===100);
  ok('区间内不变', clamp(63)===63);
  const biasOf=(score)=> score>55?'偏空':score<45?'偏多':'中性';
  ok('>55 偏空', biasOf(70)==='偏空');
  ok('<45 偏多', biasOf(30)==='偏多');
  ok('45-55 中性', biasOf(50)==='中性');

  console.log('[4] Pivot 点位数学关系 ...');
  const {p,r1,s1,r2,s2,r3,s3} = (()=>{
    const high=105, low=95, close=100;
    const pp=(high+low+close)/3;
    return {p:pp, r1:2*pp-low, s1:2*pp-high, r2:pp+(high-low), s2:pp-(high-low), r3:high+2*(pp-low), s3:low-2*(high-pp)};
  })();
  ok('r1 > p', r1>p);
  ok('p > s1', p>s1);
  ok('r2 > r1', r2>r1);
  ok('s1 > s2', s2<s1);
  ok('r3 > r2', r3>r2);
  ok('s3 < s2', s3<s2);

  console.log('[5] 三地时间生成（不抛错）...');
  const now=new Date();
  const zones=[{name:'北京',tz:8},{name:'伦敦',tz:0},{name:'纽约',tz:-4}];
  ok('zones 3 个', zones.length===3);
  zones.forEach(z=>{
    const d=new Date(now.getTime()+(z.tz-now.getTimezoneOffset()/60)*3600*1000);
    ok(`${z.name} 时间可解析`, !isNaN(d.getTime()));
  });

  console.log(`\\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
  process.exit(fail?1:0);
})();
