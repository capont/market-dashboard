# 贵金属·原油行情·资讯聚合监控台

> 单文件前端（`index.html`）+ Vercel Node Function（`api/quote.js`）
> 覆盖原前端全部模块：**行情卡 / 快速概览 / 驱动因素 / 技术点位 / 财经日历 / 要闻 / 强弱榜+波幅**
> 全部数据基于"实时（含延迟）"，前端永不为空。

## 一、架构

```
请求 → /api/quote (Vercel Node Function, 60s 缓存)
            │
            ├─ TwelveData   time_series (1min, 300 根)   ← 首选
            ├─ AlphaVantage FX_INTRADAY / TIME_SERIES     ← 备源
            ├─ metal.live   实时 spot                      ← 报价降级
            └─ 插值 / demo                                   ← 兜底（UI 永不为空）
            │
            ▼
      统一契约 { data, drivers, overview, calendar, news, rankings, source }
            │
            ▼
      index.html（暗色监控台，单文件零依赖）
```

### 数据源对照（金银两油 VIX 10Y DXY，全覆盖）

| 优先级 | 源 | 免费额度 | 环境变量 |
|---|---|---|---|
| 1 | TwelveData | 800 次/天 | `TWELVEDATA_KEY` |
| 2 | AlphaVantage | 25 次/天 | `ALPHAVANTAGE_KEY` |
| 3 | metal.live | 无需 key（现货） | — |
| 4 | 本地插值 / demo | 无限 | — |

> 一个 TwelveData key 即可覆盖全部 7 个品种（金银两油 VIX 10Y DXY 都有）。
>  TradingView 隐藏接口（灰接口、无授权、ToS 风险）。

## 二、本地开发

```bash
cd market-dashboard

# 1. 校验（无需 key，走 demo 链路，验证契约 + 自适应逻辑）
npm run verify
# → verify_contract.js  + verify_frontend.js  全绿

# 2. 测试数据源（有 key 走真实 1min，无 key 走 demo）
export TWELVEDATA_KEY=xxx
export ALPHAVANTAGE_KEY=xxx
npm run test

# 3. 本地起前端（任选其一）
npx serve .
python3 -m http.server 8000
# 浏览器开 http://localhost:8000
# 注：fetch('/api/quote') 需同源，本地可临时改 index.html 里 API 指向完整 URL 或同时跑：
#   vercel dev
```

## 三、部署到 Vercel

```bash
# 1. 安装 Vercel CLI 并登录
npm i -g vercel && vercel login

# 2. 链接项目（首次）
vercel link

# 3. 配置环境变量（Settings → Environment Variables 也行）
vercel env add TWELVEDATA_KEY
vercel env add ALPHAVANTAGE_KEY

# 4. 部署
vercel deploy --prod
# 产出 https://xxx.vercel.app → 即完整监控台
```

- **无需数据库**：每次请求现场抓取 + 60s `s-maxage` 缓存，出站调用极少
- **Hobby 免费层够用**：Cron/定时可加 `vercel.json` 的 `crons`（注意 Hobby 仅 1 条、UTC 时区）
- **自适应刷新**：前端按 `source` 自动变速
  - `1min`（真实逐分钟）→ **30s**
  - `interpolated`（插值降级）→ **60s**
  - `demo`（兜底无网）→ **5min 探测**
- **失焦暂停**：`document.hidden` 时清定时器，恢复可见立即拉取一次
- **数据永不为空**：即便全部源失败，也返回 demo 序列 + 驱动研判，UI 始终有内容

## 四、模块说明（对应原前端截图）

| 模块 | 数据来源 | 说明 |
|---|---|---|
| 顶部三卡（金银 Brent） | `data.XAU/XAG/BRENT` + canvas 分时 | 含开高低昨收、迷你分时图 |
| 快速概览（10 项 + 金银比/金油比） | `overview` | 金银、两油、DXY、TNX、VIX、金银比、金油比 |
| 市场驱动因素（5 因子） | `drivers.items` | 利率预期/油债传导/去美元化/地缘/原油供需，规则评分 |
| 关键技术点位（Pivot R1-R3/S1-S3） | `data.*.pivot` | 基于当日 high/low/close 计算 |
| 财经日历 | `calendar` | 初请/PPI/成屋销售/EIA/褐皮书，自动判定待公布/已公布 |
| 影响行情的要闻 | `news` | 基于实时数据的规则生成，支持分类筛选 |
| 强弱榜 + 波幅榜 | `rankings` | 当日涨跌幅、当日波幅排序 |

## 五、小改原则

本版在保留你原前端**全部功能与暗色监控风格**前提下做了排版重设计（单页 Grid、卡片化、三地时间、自适应）。
如需调整，建议只改以下几处：

- **加品种**：`api/quote.js` 的 `META` 加一项 + `index.html` 加一张 `.qcard`
- **改驱动权重**：`api/quote.js` 的 `drivers()` 里各评分公式
- **加新闻源**：`api/quote.js` 的 `news()`（建议接 NewsAPI / 财联社 webhook，存 NEWS_API_KEY）
- **改主题色**：`index.html` 的 `:root` CSS 变量
- **改刷新节奏**：`index.html` 的 `startTimer()` / `fetchAll()` 自适应逻辑

## 六、合规提示

- TwelveData / AlphaVantage 为授权数据源，使用前请阅读其 ToS（免费档多为个人/非商用）
- 显示端标注"实时数据（含延迟）"，符合数据商要求
- 本看板仅供研究，非投资建议
