// test_sources.js —— 有 key 时测真实源可用性，无 key 时跑 demo 链路
// 用法：TD_KEY=xxx AV_KEY=xxx node test_sources.js
import { handler } from './api/quote.js';

function run(){
  return new Promise((resolve)=>{
    const headers = {};
    const res = {
      headers,
      setHeader(k,v){ headers[k]=v; },
      getHeader(k){ return headers[k]; },
      status(code){ this.statusCode = code; return this; },
      statusCode: 200,
      json(body){ resolve(body); },
    };
    handler({ method:'GET', url:'/?t='+Date.now() }, res);
  });
}

(async ()=>{
  const TD = process.env.TWELVEDATA_KEY, AV = process.env.ALPHAVANTAGE_KEY;
  console.log('环境变量：');
  console.log('  TWELVEDATA_KEY:', TD ? '已设置 ('+TD.slice(0,4)+'…)' : '未设置 → 走 AlphaVantage/插值/demo');
  console.log('  ALPHAVANTAGE_KEY:', AV ? '已设置 ('+AV.slice(0,4)+'…)' : '未设置 → 走 metal.live/插值/demo');
  console.log('');

  const t0 = Date.now();
  const body = await run();
  const ms = Date.now()-t0;

  console.log(`耗时 ${ms}ms · 数据源模式: ${body.source}\n`);

  const syms = ['XAU','XAG','WTI','BRENT','VIX','TNX','DXY'];
  console.log('品种'.padEnd(8)+'现价'.padStart(12)+'涨跌幅'.padStart(10)+'点数'.padStart(8)+'来源');
  syms.forEach(s=>{
    const d = body.data[s];
    console.log(
      s.padEnd(8)+
      String(d.current).padStart(12)+
      (d.change>=0?'+':'')+d.change.toFixed(2)+'%'.padStart(9)+
      String(d.series.length).padStart(8)+
      '  '+d.source
    );
  });

  console.log('\n驱动因素：');
  body.drivers.items.forEach(it=>{
    console.log(`  ${it.name.padEnd(18)} ${String(it.score).padStart(4)}  ${it.bias}`);
  });

  console.log('\n要闻条数:', body.news.length, '· 日历条数:', body.calendar.length);
  console.log('\n建议：');
  if(body.source==='demo'){
    console.log('  • 当前为 demo 模式（无外网或无 key）。部署到 Vercel 并配置 TWELVEDATA_KEY 即切换 live。');
    console.log('  • 前端自适应会自动 30s(1min)/60s(插值)/5min(demo)，无需改代码。');
  } else {
    console.log('  • 实时源已连通，前端将以 30s 间隔刷新。');
  }
})();
