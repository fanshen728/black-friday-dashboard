/**
 * AMS 销售看板 - 纯净版数据服务层
 * 遵循极简原则 (KISS/YAGNI)：
 * 1. 所有金额均统一为美元 ($)
 * 2. 支持各店铺动态多市场 (有的店铺10个市场，有的店铺只有1个市场)
 * 3. 极简清晰的数据结构：店铺名称、店铺销售额、包含的市场及市场销售额
 * 4. 10秒后台静默轮询更新 (自动脉冲波动)
 */

class DataService {
  constructor() {
    this.pollInterval = 10; // 秒
    this.timer = null;
    this.subscribers = [];

    // 默认后端接口配置
    this.apiEndpoint = '/api/ams/sales';

    // 初始化 Mock 数据状态 (各店铺差异化多市场，纯美元)
    this.initData();
  }

  initData() {
    this.stores = [
      {
        storeName: 'aosom.eu',
        color: '#00f0ff',
        category: '欧洲旗舰独立站',
        markets: [
          { marketName: 'DE', sales: 215400 },
          { marketName: 'UK', sales: 168200 },
          { marketName: 'FR', sales: 124500 },
          { marketName: 'ES', sales: 95800 },
          { marketName: 'IT', sales: 81200 },
          { marketName: 'PT', sales: 52400 },
          { marketName: 'IE', sales: 38900 },
          { marketName: 'NL', sales: 34100 },
          { marketName: 'PL', sales: 26800 },
          { marketName: 'BE', sales: 19800 }
        ]
      },
      {
        storeName: 'homcom.fr',
        color: '#00e5ff',
        category: '法国家居生活独立站',
        markets: [
          // 专属法国单一市场 (按用户需求：有的店铺可能只有1个市场)
          { marketName: 'FR', sales: 412850 }
        ]
      },
      {
        storeName: 'homcomstore',
        color: '#7000ff',
        category: '全球品牌站',
        markets: [
          // 跨区域三大市场
          { marketName: 'US', sales: 218600 },
          { marketName: 'CA', sales: 104200 },
          { marketName: 'UK', sales: 63500 }
        ]
      },
      {
        storeName: 'outsunny.fr',
        color: '#00ff88',
        category: '法国户外露营独立站',
        markets: [
          // 两个市场
          { marketName: 'FR', sales: 198400 },
          { marketName: 'BE', sales: 58900 }
        ]
      }
    ];

    this.recalculateSales();
  }

  /**
   * 汇总计算各店铺销售额与 AMS 总销售额
   */
  recalculateSales() {
    let amsTotal = 0;
    this.stores.forEach(store => {
      let storeTotal = 0;
      store.markets.forEach(m => {
        storeTotal += m.sales;
      });
      store.storeSales = storeTotal;
      amsTotal += storeTotal;
    });
    this.amsTotalSales = amsTotal;
  }

  /**
   * 模拟10秒周期的销量自然增长 (纯美元)
   */
  simulateSurge() {
    this.stores.forEach(store => {
      store.markets.forEach(m => {
        // 每个市场每次增量 100 ~ 1,800 美元
        const increment = Math.floor(100 + Math.random() * 1500);
        m.sales += increment;
      });
    });
    this.recalculateSales();
  }

  /**
   * 核心数据拉取
   */
  async fetchData() {
    let data = null;

    // 尝试请求真实后端接口
    if (this.apiEndpoint) {
      try {
        const resp = await fetch(this.apiEndpoint, { method: 'GET', cache: 'no-cache' });
        if (resp.ok) {
          const res = await resp.json();
          if (res && res.data) {
            data = this.normalizeData(res.data);
          }
        }
      } catch (e) {
        // 接口未就绪时静默采用 Mock
      }
    }

    if (!data) {
      this.simulateSurge();
      data = {
        amsTotalSales: this.amsTotalSales,
        stores: this.stores,
        timestamp: new Date().toISOString()
      };
    }

    this.notify(data);
    return data;
  }

  /**
   * 规范化后端返回的数据结构
   * 确保无论后端返回 1 个市场还是 10 个市场，均可完美兼容解析
   */
  normalizeData(payload) {
    const rawStores = payload.stores || [];
    const stores = rawStores.map((s, idx) => {
      const defaultColors = ['#00f0ff', '#00e5ff', '#7000ff', '#00ff88'];
      const markets = (s.markets || []).map(m => ({
        marketName: m.marketName || m.name || m.code || 'Global',
        sales: Number(m.sales || m.marketSales || 0)
      }));
      let total = Number(s.storeSales || s.sales || 0);
      if (!total && markets.length) {
        total = markets.reduce((acc, cur) => acc + cur.sales, 0);
      }
      return {
        storeName: s.storeName || s.name || `Store ${idx + 1}`,
        color: s.color || defaultColors[idx % defaultColors.length],
        storeSales: total,
        markets: markets
      };
    });

    let totalAms = Number(payload.amsTotalSales || payload.totalSales || 0);
    if (!totalAms && stores.length) {
      totalAms = stores.reduce((acc, cur) => acc + cur.storeSales, 0);
    }

    return {
      amsTotalSales: totalAms,
      stores: stores,
      timestamp: payload.timestamp || new Date().toISOString()
    };
  }

  /**
   * 启动10秒后台静默轮询
   */
  startPolling() {
    this.stopPolling();
    this.fetchData();
    this.timer = setInterval(() => {
      this.fetchData();
    }, this.pollInterval * 1000);
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onData(cb) {
    this.subscribers.push(cb);
  }

  notify(data) {
    this.subscribers.forEach(cb => {
      try { cb(data); } catch (err) { console.error(err); }
    });
  }
}

window.dataService = new DataService();
