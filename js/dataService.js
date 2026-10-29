/**
 * AMS 销售看板 - 数据服务层 (新版排版驱动)
 * 职责：
 * 1. 管理4大店铺及其各个市场的销售额 (sales)、订单数量 (orders)、流量 (traffic)
 * 2. 标记店铺属性：品牌站 (brand) 或 泛欧站 (pan_eu)
 * 3. 前端自动汇总计算：
 *    - 各店铺销售总额、总订单量、客单价 (AOV = 销售额 / 订单量)、转化率 (Conversion = 订单量 / 流量)
 *    - AMS 全站总销售额 (TOTAL GROSS REVENUE)
 *    - 全店铺订单总量 (TOTAL ORDERS PROCESSED)
 *    - 全店铺客单价 (AOV) 与 全店铺转化率 (CONVERSION RATE)
 *    - 业务线汇总 (全站 / 品牌站 / 泛欧站)
 * 4. 10秒后台静默轮询更新 (自动微脉冲波动)
 */

class DataService {
  constructor() {
    this.pollInterval = 10; // 10秒轮询
    this.timer = null;
    this.subscribers = [];
    this.apiEndpoint = '/api/ams/sales';
    this.currentData = null;

    this.initMockStores();
  }

  /**
   * 初始化4大店铺初始数据
   * 包含：品牌站 (brand) 3家 + 泛欧站 (pan_eu) 1家
   */
  initMockStores() {
    this.rawStores = [
      {
        storeId: 'homcomstore',
        storeName: 'HOMCOM Store',
        type: 'brand', // 品牌站
        category: '品牌站',
        icon: '🏠',
        colorKey: 'homcomstore',
        markets: [
          { marketName: 'US', sales: 684200.50, orders: 4410, traffic: 82000 },
          { marketName: 'UK', sales: 412300.20, orders: 2680, traffic: 51000 },
          { marketName: 'CA', sales: 279622.95, orders: 1780, traffic: 34000 }
        ]
      },
      {
        storeId: 'outsunny_fr',
        storeName: 'Outsunny FR',
        type: 'brand', // 品牌站
        category: '品牌站',
        icon: '⛺',
        colorKey: 'outsunny.fr',
        markets: [
          { marketName: 'FR', sales: 648900.40, orders: 4450, traffic: 83000 },
          { marketName: 'BE', sales: 181704.00, orders: 1232, traffic: 23000 }
        ]
      },
      {
        storeId: 'homcom_fr',
        storeName: 'HOMCOM FR',
        type: 'brand', // 品牌站
        category: '品牌站',
        icon: '🛋️',
        colorKey: 'homcom.fr',
        markets: [
          { marketName: 'FR', sales: 751949.00, orders: 4396, traffic: 82300 }
        ]
      },
      {
        storeId: 'aosom_eu',
        storeName: 'AOSOM EU',
        type: 'pan_eu', // 泛欧站
        category: '泛欧站',
        icon: '🇪🇺',
        colorKey: 'aosom.eu',
        markets: [
          { marketName: 'DE', sales: 325400.00, orders: 1920, traffic: 36000 },
          { marketName: 'UK', sales: 248600.00, orders: 1460, traffic: 27000 },
          { marketName: 'FR', sales: 186300.00, orders: 1100, traffic: 21000 },
          { marketName: 'ES', sales: 142100.00, orders: 840, traffic: 16000 },
          { marketName: 'IT', sales: 118400.00, orders: 700, traffic: 13000 },
          { marketName: 'PT', sales: 76500.00, orders: 450, traffic: 8500 },
          { marketName: 'IE', sales: 56800.00, orders: 335, traffic: 6300 },
          { marketName: 'NL', sales: 49200.00, orders: 290, traffic: 5500 },
          { marketName: 'PL', sales: 38700.00, orders: 228, traffic: 4300 },
          { marketName: 'BE', sales: 28314.00, orders: 167, traffic: 3200 }
        ]
      }
    ];

    this.currentData = this.calculateAggregates(this.rawStores);
  }

  /**
   * 前端核心计算引擎 (按照用户要求：总销售额和店铺总额由前端自动计算)
   */
  calculateAggregates(rawStores) {
    let amsTotalSales = 0;
    let amsTotalOrders = 0;
    let amsTotalTraffic = 0;

    let brandTotalSales = 0;
    let brandTotalOrders = 0;
    let panEuTotalSales = 0;
    let panEuTotalOrders = 0;

    const computedStores = rawStores.map(store => {
      let storeSales = 0;
      let storeOrders = 0;
      let storeTraffic = 0;

      const markets = store.markets.map(m => {
        storeSales += m.sales;
        storeOrders += m.orders;
        storeTraffic += (m.traffic || m.orders * 18);

        const aov = m.orders > 0 ? (m.sales / m.orders) : 0;
        const conv = m.traffic > 0 ? ((m.orders / m.traffic) * 100) : 5.0;

        return {
          ...m,
          aov,
          conversion: conv
        };
      });

      amsTotalSales += storeSales;
      amsTotalOrders += storeOrders;
      amsTotalTraffic += storeTraffic;

      if (store.type === 'brand') {
        brandTotalSales += storeSales;
        brandTotalOrders += storeOrders;
      } else {
        panEuTotalSales += storeSales;
        panEuTotalOrders += storeOrders;
      }

      const storeAov = storeOrders > 0 ? (storeSales / storeOrders) : 0;
      const storeConv = storeTraffic > 0 ? ((storeOrders / storeTraffic) * 100) : 5.2;

      return {
        ...store,
        markets,
        storeSales,
        storeOrders,
        storeTraffic,
        storeAov,
        storeConversion: storeConv,
        marketCount: markets.length
      };
    });

    // 计算各店铺/市场的占比
    computedStores.forEach(s => {
      s.sharePercent = amsTotalSales > 0 ? ((s.storeSales / amsTotalSales) * 100).toFixed(1) : '0.0';
      s.markets.forEach(m => {
        m.sharePercent = amsTotalSales > 0 ? ((m.sales / amsTotalSales) * 100).toFixed(1) : '0.0';
      });
    });

    // 计算最高营收店铺 (Leading Store)
    const sortedBySales = [...computedStores].sort((a, b) => b.storeSales - a.storeSales);
    const leadingStore = sortedBySales[0] || computedStores[0];

    // 全站平均客单价与转化率
    const amsAov = amsTotalOrders > 0 ? (amsTotalSales / amsTotalOrders) : 0;
    const amsConversion = amsTotalTraffic > 0 ? ((amsTotalOrders / amsTotalTraffic) * 100) : 5.34;
    // 每小时估算流水 (Combined Run-Rate)
    const hourlyRunRate = Math.round(amsTotalSales * 0.142);

    return {
      timestamp: new Date(),
      amsTotalSales,
      amsTotalOrders,
      amsTotalTraffic,
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
   * 10秒脉冲模拟波动 (模拟双11/黑五实时下单增量)
   */
  pulseMockData() {
    this.rawStores.forEach(store => {
      store.markets.forEach(m => {
        // 随机产生 1~4 单新订单
        const newOrders = Math.floor(Math.random() * 4) + 1;
        // 平均客单价在 80~180 美元波动
        const incrementalSales = newOrders * (90 + Math.random() * 85);

        m.orders += newOrders;
        m.sales = Math.round((m.sales + incrementalSales) * 100) / 100;
        m.traffic += newOrders * (15 + Math.floor(Math.random() * 10));
      });
    });

    this.currentData = this.calculateAggregates(this.rawStores);
    this.notify();
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
   * 启动10秒后台轮询
   */
  startPolling() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      // 如果未来后端接口准备好了，可以在此发起 fetch(this.apiEndpoint)
      // 当前使用符合新协议的 Mock 引擎
      this.pulseMockData();
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
