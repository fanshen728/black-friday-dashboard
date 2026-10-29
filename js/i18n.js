/**
 * AMS 销售看板 - 国际化 (i18n) 语言管理模块
 * 支持中文 (zh) 与英文 (en) 实时无缝切换
 * 遵循 KISS / YAGNI / DRY 原则，零外部依赖，极简高效
 */

const I18N_TRANSLATIONS = {
  zh: {
    // 顶部 Header
    subBadge: 'AMS COMMERCE OPS',
    mainTitle: 'ams销量看板',
    updatedPrefix: '数据已更新',
    fullscreen: '全屏',
    milestoneFxBtn: '🎉 突破特效',
    themePillBlue: '🏢 商务科技蓝',
    themePillGold: '🏆 黑五黑金',
    themePillSlate: '⚡ 极简现代灰',
    themePillCyber: '🌌 赛博朋克',

    // Section 1: 全局业绩 (GLOBAL PERFORMANCE)
    globalPerfLabel: '全局业绩监控',
    globalPerfTitle: '实时销售与订单综合分析',
    totalGrossRevenue: '全店铺总营收 (USD)',
    totalOrdersProcessed: '全店铺订单总量',
    ordersCompletedNote: '全站店铺合计 ↗ 21.4%',
    aovLabel: '全店平均客单价 (AOV)',
    convLabel: '全店综合转化率',

    // Section 2: 实时势能 (LIVE MOMENTUM)
    liveMomentumLabel: '实时势能',
    liveMomentumTitle: '实时营收增速分析 (累积美元)',
    accumulatedRevenue: '全站累计总营收',
    leadingStore: '领跑最高店铺',
    combinedRunRate: '最近一小时综合营收',
    singleStoreRevenue: '单店营收',

    // Section 3: 店铺概览 (NETWORK OVERVIEW)
    networkOverviewLabel: '业务网络概览',
    networkOverviewTitle: '各店铺实时运营看板',
    ordersUnit: '笔订单',
    revenueUnit: '营收总额',
    onlineStatus: '● 运行中',
    tagBrand: '品牌站',
    tagPanEu: '泛欧站',
    marketsSuffix: '个市场',
    marketSuffixSingle: '个市场',

    // Section 4: 市场深度洞察 (MARKET INTELLIGENCE)
    marketIntelLabel: '市场深度洞察',
    marketIntelTitle: '国家与市场明细分析 (业务线营收情况)',
    tabAll: '全站 (All Stores)',
    tabBrand: '品牌站 (Brand Stores)',
    tabPanEu: '泛欧站 (AOSOM EU)',
    revenueUsdTag: '营收统计单位 (USD)',

    // 表格表头
    colCountryMarket: '店铺 / 国家市场',
    colLiveRevenue: '实时营收 (USD)',
    colRevenueShare: '市场份额：营收占比',
    colTotalOrders: '总订单数',
    colAov: '平均客单价 (AOV)',
    colConversion: '转化率',
    tableNote: '所有数据已统一折算为美元 (USD) 汇率实时结算',

    // 动态文字与图表
    chartSeriesRevenue: '单店营收',
    chartTooltipRevenue: '总营收',
    chartTooltipOrders: '总订单',
    chartTooltipMarkets: '所辖市场',
    chartTooltipAov: '平均客单价',
    chartTooltipConv: '平均转化率',
    marketText: '市场',
    ordersCountText: '笔'
  },
  en: {
    // Header
    subBadge: 'AMS COMMERCE OPS',
    mainTitle: 'AMS Sales Dashboard',
    updatedPrefix: 'Updated',
    fullscreen: 'Fullscreen',
    milestoneFxBtn: '🎉 Milestone FX',
    themePillBlue: '🏢 Business Blue',
    themePillGold: '🏆 Black & Gold',
    themePillSlate: '⚡ Minimal Slate',
    themePillCyber: '🌌 Cyberpunk',

    // Section 1: Global Performance
    globalPerfLabel: 'GLOBAL PERFORMANCE',
    globalPerfTitle: 'Live sales & order analytics',
    totalGrossRevenue: 'TOTAL GROSS REVENUE (USD)',
    totalOrdersProcessed: 'TOTAL ORDERS PROCESSED',
    ordersCompletedNote: 'Completed across all stores ↗ 21.4%',
    aovLabel: 'AVERAGE ORDER VALUE (AOV)',
    convLabel: 'CONVERSION RATE',

    // Section 2: Live Momentum
    liveMomentumLabel: 'LIVE MOMENTUM',
    liveMomentumTitle: 'Real-Time Revenue Growth Velocity (Accumulated USD)',
    accumulatedRevenue: 'ACCUMULATED REVENUE',
    leadingStore: 'LEADING STORE',
    combinedRunRate: 'COMBINED RUN-RATE',
    singleStoreRevenue: 'Store Revenue',

    // Section 3: Network Overview
    networkOverviewLabel: 'NETWORK OVERVIEW',
    networkOverviewTitle: 'Orders by storefront',
    ordersUnit: 'Orders',
    revenueUnit: 'REVENUE',
    onlineStatus: '● ONLINE',
    tagBrand: 'Brand',
    tagPanEu: 'Pan-EU',
    marketsSuffix: 'markets',
    marketSuffixSingle: 'market',

    // Section 4: Market Intelligence
    marketIntelLabel: 'MARKET INTELLIGENCE',
    marketIntelTitle: 'Country & Market Intelligence Breakdown',
    tabAll: 'All Stores Aggregated',
    tabBrand: 'Brand Stores',
    tabPanEu: 'AOSOM EU',
    revenueUsdTag: 'Revenue (USD)',

    // Table Headers
    colCountryMarket: 'COUNTRY / MARKET',
    colLiveRevenue: 'LIVE REVENUE (USD)',
    colRevenueShare: 'REVENUE SHARE',
    colTotalOrders: 'TOTAL ORDERS',
    colAov: 'AOV (USD)',
    colConversion: 'CONVERSION',
    tableNote: 'All displayed values converted using live institutional FX rates',

    // Dynamic text & charts
    chartSeriesRevenue: 'Store Revenue',
    chartTooltipRevenue: 'Total Revenue',
    chartTooltipOrders: 'Total Orders',
    chartTooltipMarkets: 'Markets',
    chartTooltipAov: 'Avg Order Value',
    chartTooltipConv: 'Avg Conversion',
    marketText: 'Market',
    ordersCountText: 'orders'
  }
};

class I18nManager {
  constructor() {
    // 默认中文（优先读取本地缓存，若无缓存默认设为 'zh' 解决用户“看不太懂全英”痛点）
    const saved = localStorage.getItem('ams_lang');
    this.currentLang = (saved === 'en' || saved === 'zh') ? saved : 'zh';
    this.listeners = [];
  }

  getLang() {
    return this.currentLang;
  }

  t(key, fallback = '') {
    const dict = I18N_TRANSLATIONS[this.currentLang] || I18N_TRANSLATIONS['zh'];
    return dict[key] !== undefined ? dict[key] : fallback;
  }

  setLanguage(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('ams_lang', lang);

    // 1. 更新所有具有 data-i18n 属性的 DOM 节点
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = this.t(key);
        if (text) {
          el.innerText = text;
        }
      }
    });

    // 2. 更新切换按钮的激活状态
    document.querySelectorAll('.lang-pill-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 3. 通知所有注册的监听器 (如 charts, dashboard)
    this.listeners.forEach(fn => fn(this.currentLang));
  }

  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  init() {
    // 绑定语言切换按钮点击事件
    document.querySelectorAll('.lang-pill-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const targetLang = e.currentTarget.getAttribute('data-lang');
        if (targetLang && targetLang !== this.currentLang) {
          this.setLanguage(targetLang);
        }
      });
    });

    // 初次应用语言设置
    this.setLanguage(this.currentLang);
  }
}

window.i18n = new I18nManager();
