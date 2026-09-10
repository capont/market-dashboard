// verify_contract.js —— 校验 api/quote.js 输出是否符合前端 index.html 期望的契约
// 用法：node verify_contract.js
import { handler } from './api/quote.js';

// 构造一个最小 res 收集 json
function run(){
  return new Promise((resolve, reject)=>{
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
  let pass = 0, fail = 0;
  const ok = (name, cond)=>{ if(cond){ pass++; /*console.log('  ✓',name);*/ } else { fail++; console.log('  ✗ FAIL:',name); } };

  console.log('\\n[1] 调用 handler ...');
  const body = await run();
  ok('返回 ts (number)', typeof body.ts === 'number');
  ok('返回 source 枚举', ['demo','live','interpolated','1min'].includes(body.source) || body.source===undefined);

  console.log('[2] 行情 data（7 品种）...');
  const syms = ['XAU','XAG','WTI','BRENT','VIX','TNX','DXY'];
  for(const s of syms){
    const d = body.data[s];
    ok(`data.${s} 存在`, !!d);
    if(!d) continue;
    for(const f of ['name','symbol','unit','digits','current','open','prev','high','low','close','series','source','pivot']){
      ok(`  ${s}.${f}`, d[f]!==undefined && d[f]!==null);
    }
    ok(`  ${s}.series 是数组且>1`, Array.isArray(d.series) && d.series.length>1);
    ok(`  ${s}.series 时间升序`, d.series.every((p,i)=>i===0||p[0]>=d.series[i-1][0]));
    ok(`  ${s}.source 枚举`, ['1min','interpolated','demo'].includes(d.source));
    // pivot
    for(const pf of ['p','r1','r2','r3','s1','s2','s3']){
      ok(`  ${s}.pivot.${pf} 是数字`, typeof d.pivot?.[pf] === 'number');
    }
  }

  console.log('[3] 驱动因素 drivers ...');
  ok('drivers.items 是数组且长度5', Array.isArray(body.drivers?.items) && body.drivers.items.length===5);
  body.drivers?.items.forEach((it,i)=>{
    for(const f of ['key','name','score','bias','note','level']){
      ok(`  drv[${i}].${f}`, it[f]!==undefined);
    }
    ok(`  drv[${i}].score 0-100`, it.score>=0 && it.score<=100);
    ok(`  drv[${i}].bias 合法`, ['偏多','偏空','中性','偏多强','偏空强'].includes(it.bias));
  });
  ok('金银比 ratio 数字', typeof body.drivers?.ratio === 'number');
  ok('金油比 goldOilWTI 数字', typeof body.drivers?.goldOilWTI === 'number');

  console.log('[4] 概览 overview ...');
  ok('overview 是数组长度10', Array.isArray(body.overview) && body.overview.length===10);

  console.log('[5] 财经日历 calendar ...');
  ok('calendar 是数组长度5', Array.isArray(body.calendar) && body.calendar.length===5);
  body.calendar?.forEach((e,i)=>{
    for(const f of ['id','name','time','forecast','status','importance']){
      ok(`  cal[${i}].${f}`, e[f]!==undefined);
    }
    ok(`  cal[${i}].status pending/published`, ['pending','published'].includes(e.status));
  });

  console.log('[6] 要闻 news ...');
  ok('news 是数组>=4', Array.isArray(body.news) && body.news.length>=4);
  body.news?.forEach((n,i)=>{
    for(const f of ['cat','tag','title','source','mins']){
      ok(`  news[${i}].${f}`, n[f]!==undefined);
    }
  });

  console.log('[7] 排行榜 rankings ...');
  ok('rankings.movers 数组长度7', Array.isArray(body.rankings?.movers) && body.rankings.movers.length===7);
  ok('rankings.amplitude 数组长度7', Array.isArray(body.rankings?.amplitude) && body.rankings.amplitude.length===7);

  console.log(`\\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
  process.exit(fail?1:0);
})();
