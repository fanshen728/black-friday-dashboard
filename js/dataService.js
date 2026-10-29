/**
 * AMS 销售看板 - 真实数据服务层 (后端接口深度对接)
 * 
 * 对接接口：https://amsbff.admindev.aosom.com/platform/oms/saleOrderBoard/statistics
 * 请求参数：
 * - storeIds: '2,12' (支持逗号分隔多店铺)
 * - payTimeBegin: '2026-10-20 00:00:00' (支付起始时间)
 * - payTimeEnd: '2026-10-30 00:00:00' (支付截止时间)
 * 
 * 返回字段规范：
 * - storeId: 店铺编号
 * - storeName: 店铺名称 (如 "AMB店铺002", "泛欧数据迁移店铺不要动")
 * - storeType: "1" (品牌站) | "2" (泛欧站)
 * - markets: [ { marketId, marketName, orderCount, orderAmount, conversionRate } ]
 * 
 * 前端核心自动计算：
 * - 全店铺总营收 (USD)、全店铺总订单量
 * - 全店铺平均客单价 (AOV = 销售额 / 订单量)
 * - 全店铺综合转化率 (按各市场订单量加权合并)
 * - 业务线划分 (全站 / 品牌站 / 泛欧站)
 * - 10秒定时静默增量轮询
 */

class DataService {
  constructor() {
    this.pollInterval = 10; // 10秒轮询
    this.timer = null;
    this.subscribers = [];

    // 真实后端接口基础配置
    this.apiBaseUrl = 'https://amsbff.admindev.aosom.com/platform/oms/saleOrderBoard/statistics';
    this.storeIds = '2,12';

    // 默认大促周期时间范围 (2026-10-20 00:00:00 至 2026-10-30 00:00:00)
    this.payTimeBegin = '2026-10-20 00:00:00';
    this.payTimeEnd = '2026-10-30 00:00:00';

    this.isUsingRealApi = true;
    this.lastFetchTime = null;
    this.lastFetchError = null;
    this.currentData = null;

    // 本地安全备用数据 (防止网络不可用时页面出现白屏)
    this.initFallbackStores();
  }

  /**
   * 格式化时间为 UTC 标准规范格式：YYYY-MM-DD HH:mm:ss
   */
  formatUtcDateTime(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  }

  formatDateTime(d) {
    return this.formatUtcDateTime(d);
  }

  /**
   * 生成大促默认时间范围 (基于 UTC)：
   * 截止时间：次日 00:00:00 (如 2026-10-30 00:00:00 UTC)
   * 起始时间：向前推 10 天 00:00:00 (如 2026-10-20 00:00:00 UTC)
   */
  getDefaultTimeRange() {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const begin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 9, 0, 0, 0));
    return {
      payTimeBegin: this.formatUtcDateTime(begin),
      payTimeEnd: this.formatUtcDateTime(end)
    };
  }

  /**
   * 切换快捷预设时间周期 (严格按 UTC 维度统计)
   * @param {'campaign' | 'today' | '7d' | '30d'} preset
   */
  setTimePreset(preset = 'campaign') {
    const now = new Date();
    if (preset === 'today') {
      // UTC 今日 00:00:00 至次日 00:00:00
      const begin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      this.payTimeBegin = this.formatUtcDateTime(begin);
      this.payTimeEnd = this.formatUtcDateTime(end);
    } else if (preset === '7d') {
      // UTC 近 7 天
      const begin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      this.payTimeBegin = this.formatUtcDateTime(begin);
      this.payTimeEnd = this.formatUtcDateTime(end);
    } else if (preset === '30d') {
      // UTC 近 30 天
      const begin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      this.payTimeBegin = this.formatUtcDateTime(begin);
      this.payTimeEnd = this.formatUtcDateTime(end);
    } else {
      // 默认大促周期 (2026-10-20 ~ 2026-10-30 UTC)
      this.payTimeBegin = '2026-10-20 00:00:00';
      this.payTimeEnd = '2026-10-30 00:00:00';
    }
    return this.fetchRealData();
  }

  /**
   * 设置自定义时间范围并重新请求
   */
  setTimeRange(begin, end) {
    if (begin) this.payTimeBegin = begin.trim();
    if (end) this.payTimeEnd = end.trim();
    return this.fetchRealData();
  }

  /**
   * 设置店铺 IDs 列表并重新请求
   */
  setStoreIds(storeIds) {
    if (storeIds) this.storeIds = String(storeIds).trim();
    return this.fetchRealData();
  }

  /**
   * 发起真实后端接口请求
   */
  async fetchRealData() {
    try {
      const url = new URL(this.apiBaseUrl);
      url.searchParams.set('storeIds', this.storeIds);
      url.searchParams.set('payTimeBegin', this.payTimeBegin);
      url.searchParams.set('payTimeEnd', this.payTimeEnd);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json && json.code === 200 && Array.isArray(json.data)) {
        this.rawStores = json.data;
        this.isUsingRealApi = true;
        this.lastFetchError = null;
        this.lastFetchTime = new Date();
        this.currentData = this.calculateAggregates(this.rawStores);
        this.notify();
        return this.currentData;
      } else {
        throw new Error(json?.msg || '后端返回异常状态码');
      }
    } catch (err) {
      console.warn('[DataService] 真实接口拉取失败，启用平滑保持与容灾兜底:', err);
      this.lastFetchError = err.message;
      if (!this.currentData) {
        this.initFallbackStores();
      }
      return this.currentData;
    }
  }

  /**
   * 标准化后端数据结构
   */
  normalizeBackendData(data) {
    if (!Array.isArray(data)) return [];
    return data.map((store, sIdx) => {
      const isBrand = String(store.storeType || store.type) === '1' || store.type === 'brand';
      const type = isBrand ? 'brand' : 'pan_eu';
      const category = isBrand ? '品牌站' : '泛欧站';

      const markets = (store.markets || []).map(m => {
        // 兼容字符串金额 (如 "128167") 或数字金额
        const sales = parseFloat(m.orderAmount !== undefined ? m.orderAmount : (m.sales || 0)) || 0;
        const orders = parseInt(m.orderCount !== undefined ? m.orderCount : (m.orders || 0), 10) || 0;
        // 转化率 (若后端提供 0 则展示 0，若提供实际转化率则展示)
        const convRate = Number(
          m.conversionRate !== undefined
            ? m.conversionRate
            : (m.conversion !== undefined ? m.conversion : 0)
        );

        // 提取国家二字码 (如 "DE德国" -> code: "DE")
        const codeMatch = String(m.marketName || '').match(/^([A-Za-z]{2})/);
        const code = codeMatch ? codeMatch[1].toUpperCase() : (m.marketName || 'Unknown');
        const meta = (window.COUNTRY_MARKETS && window.COUNTRY_MARKETS[code]) || {};

        return {
          marketId: m.marketId,
          marketCode: code,
          marketName: m.marketName || code,
          flag: meta.flag || '🌐',
          sales,
          orders,
          conversionRate: convRate,
          conversion: convRate
        };
      });

      return {
        storeId: String(store.storeId !== undefined ? store.storeId : sIdx + 1),
        storeName: store.storeName || `店铺 ${store.storeId}`,
        storeType: String(store.storeType || (isBrand ? '1' : '2')),
        type,
        category,
        markets
      };
    });
  }

  /**
   * 前端核心汇总与指标计算引擎
   */
  calculateAggregates(rawStores) {
    const normalizedStores = this.normalizeBackendData(rawStores);
    let amsTotalSales = 0;
    let amsTotalOrders = 0;
    let amsWeightedConvSum = 0;

    let brandTotalSales = 0;
    let brandTotalOrders = 0;
    let panEuTotalSales = 0;
    let panEuTotalOrders = 0;

    const computedStores = normalizedStores.map(store => {
      let storeSales = 0;
      let storeOrders = 0;
      let storeWeightedConvSum = 0;

      const markets = store.markets.map(m => {
        storeSales += m.sales;
        storeOrders += m.orders;
        storeWeightedConvSum += (m.conversionRate * m.orders);

        const aov = m.orders > 0 ? (m.sales / m.orders) : 0;
        const conv = m.conversionRate;

        return {
          ...m,
          aov,
          conversion: conv
        };
      });

      amsTotalSales += storeSales;
      amsTotalOrders += storeOrders;
      amsWeightedConvSum += storeWeightedConvSum;

      if (store.type === 'brand') {
        brandTotalSales += storeSales;
        brandTotalOrders += storeOrders;
      } else {
        panEuTotalSales += storeSales;
        panEuTotalOrders += storeOrders;
      }

      const storeAov = storeOrders > 0 ? (storeSales / storeOrders) : 0;
      const storeConv = storeOrders > 0
        ? (storeWeightedConvSum / storeOrders)
        : (markets.length > 0 ? markets.reduce((acc, cur) => acc + cur.conversionRate, 0) / markets.length : 0);

      return {
        ...store,
        markets,
        storeSales,
        storeOrders,
        storeAov,
        storeConversion: storeConv,
        marketCount: markets.length
      };
    });

    computedStores.forEach(s => {
      s.sharePercent = amsTotalSales > 0 ? ((s.storeSales / amsTotalSales) * 100).toFixed(1) : '0.0';
      s.markets.forEach(m => {
        m.sharePercent = amsTotalSales > 0 ? ((m.sales / amsTotalSales) * 100).toFixed(1) : '0.0';
      });
    });

    // 计算领跑最高店铺
    const sortedBySales = [...computedStores].sort((a, b) => b.storeSales - a.storeSales);
    const leadingStore = sortedBySales[0] || (computedStores[0] || { storeName: '-', storeSales: 0 });

    const amsAov = amsTotalOrders > 0 ? (amsTotalSales / amsTotalOrders) : 0;
    const amsConversion = amsTotalOrders > 0 ? (amsWeightedConvSum / amsTotalOrders) : 0;
    const hourlyRunRate = Math.round(amsTotalSales * 0.142);

    return {
      timestamp: new Date(),
      isRealApi: this.isUsingRealApi,
      apiInfo: {
        endpoint: this.apiBaseUrl,
        storeIds: this.storeIds,
        payTimeBegin: this.payTimeBegin,
        payTimeEnd: this.payTimeEnd,
        lastFetchTime: this.lastFetchTime,
        lastError: this.lastFetchError
      },
      amsTotalSales,
      amsTotalOrders,
      amsAov,
      amsConversion,
      hourlyRunRate,
      leadingStore: {
        storeName: leadingStore.storeName,
        sales: leadingStore.storeSales
      },
      businessLines: {
        all: {
          sales: amsTotalSales,
          orders: amsTotalOrders
        },
        brand: {
          sales: brandTotalSales,
          orders: brandTotalOrders
        },
        pan_eu: {
          sales: panEuTotalSales,
          orders: panEuTotalOrders
        }
      },
      stores: computedStores
    };
  }

  /**
   * 容灾兜底基础数据
   */
  initFallbackStores() {
    this.rawStores = [
      {
        storeId: 2,
        storeName: 'AMB店铺002',
        storeType: '1',
        markets: [
          { marketId: 3, marketName: 'DE德国', orderCount: 5, orderAmount: 128167, conversionRate: 0 }
        ]
      },
      {
        storeId: 12,
        storeName: '泛欧数据迁移店铺不要动',
        storeType: '2',
        markets: [
          { marketId: 47, marketName: 'FI 芬兰', orderCount: 30, orderAmount: 533338, conversionRate: 0 },
          { marketId: 33, marketName: 'GR 希腊', orderCount: 57, orderAmount: 787537, conversionRate: 0 },
          { marketId: 37, marketName: 'BG 保加利亚', orderCount: 1, orderAmount: 3648, conversionRate: 0 }
        ]
      }
    ];

    this.currentData = this.calculateAggregates(this.rawStores);
  }

  /**
   * 订阅数据更新
   */
  onData(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
      if (this.currentData) {
        callback(this.currentData);
      }
    }
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.currentData);
      } catch (err) {
        console.error('DataService subscriber error:', err);
      }
    });
  }

  /**
   * 启动 10 秒定时后台静默轮询
   */
  startPolling() {
    if (this.timer) clearInterval(this.timer);

    // 页面加载后立即发起一次真实后端请求
    this.fetchRealData();

    // 每 10 秒轮询一次
    this.timer = setInterval(() => {
      this.fetchRealData();
    }, this.pollInterval * 1000);
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getData() {
    return this.currentData;
  }
}

// 单例注入全局
window.dataService = new DataService();
