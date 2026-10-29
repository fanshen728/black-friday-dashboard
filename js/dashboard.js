/**
 * AMS 销售看板 - 核心主控逻辑 (新版排版控制器)
 * 职责：
 * 1. 实时时间刷新与在线监控
 * 2. 顶部核心数据区 (全店铺营收、全店铺订单量、全店铺客单价、全店铺转化率)
 * 3. 中部动量区统计 (总营收、最高收入店铺、最近一小时预估)
 * 4. 4大店铺独立卡片区 (订单量、营收总额、市场数量与列表、品牌/泛欧标记)
 * 5. 业务线切换驱动 (全站 / 品牌站 / 泛欧站) 联动图表与详细报表表格
 */

class DashboardController {
  constructor() {
    this.currentData = null;
    this.activeBusinessLine = 'all'; // 'all' | 'brand' | 'pan_eu'
  }

  init() {
    this.startClock();

    if (window.dashboardCharts) {
      window.dashboardCharts.init();
    }

    this.bindEvents();

    if (window.dataService) {
      window.dataService.onData(data => this.handleDataUpdate(data));
      window.dataService.startPolling();
    }
  }

  startClock() {
    const clockEl = document.getElementById('liveClockText');
    const update = () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      if (clockEl) clockEl.innerText = `Updated ${timeStr}`;
    };
    update();
    setInterval(update, 1000);
  }

  bindEvents() {
    // 业务线 Tab 切换 (全站 / 品牌站 / 泛欧站)
    const bizTabs = document.querySelectorAll('.biz-tab-btn');
    bizTabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const target = e.currentTarget;
        bizTabs.forEach(t => t.classList.remove('active'));
        target.classList.add('active');

        this.activeBusinessLine = target.dataset.line || 'all';
        if (this.currentData) {
          if (window.dashboardCharts) {
            window.dashboardCharts.update(this.currentData, this.activeBusinessLine);
          }
          this.renderIntelligenceTable(this.currentData, this.activeBusinessLine);
        }
      });
    });
  }

  handleDataUpdate(data) {
    if (!data) return;
    this.currentData = data;

    // 1. 顶部全局营收与订单分析指标
    this.renderGlobalPerformance(data);

    // 2. 中部主图统计指标
    this.renderLiveMomentumMetrics(data);

    // 3. 4 大店铺横向卡片
    this.renderStorefrontCards(data);

    // 4. ECharts 图表更新
    if (window.dashboardCharts) {
      window.dashboardCharts.update(data, this.activeBusinessLine);
    }

    // 5. 底部业务线与市场情报表格
    this.renderIntelligenceTable(data, this.activeBusinessLine);
  }

  /**
   * 1. 顶部全局营收指标区
   */
  renderGlobalPerformance(data) {
    // 全店铺总营收 (USD)
    const totalRevEl = document.getElementById('globalTotalRevenue');
    if (totalRevEl) {
      const num = Number(data.amsTotalSales || 0);
      const intPart = Math.floor(num).toLocaleString('en-US');
      const decPart = (num % 1).toFixed(2).substring(1);
      totalRevEl.innerHTML = `<span class="currency-symbol">$</span>${intPart}<span class="decimal-part">${decPart}</span> <span class="usd-badge">USD</span>`;
    }

    // 全店铺订单总量
    const totalOrdersEl = document.getElementById('globalTotalOrders');
    if (totalOrdersEl) {
      totalOrdersEl.innerText = Number(data.amsTotalOrders || 0).toLocaleString('en-US');
    }

    // 全店铺平均客单价 (AOV = 总金额 / 总订单数)
    const aovEl = document.getElementById('globalAov');
    if (aovEl) {
      aovEl.innerText = `$${Number(data.amsAov || 0).toFixed(2)}`;
    }

    // 全店铺转化率 (订单数 / 访问流量)
    const convEl = document.getElementById('globalConversionRate');
    if (convEl) {
      convEl.innerText = `${Number(data.amsConversion || 0).toFixed(2)}%`;
    }
  }

  /**
   * 2. 中部图表顶部辅助指标
   */
  renderLiveMomentumMetrics(data) {
    // 累积总营收
    const accumRevEl = document.getElementById('accumulatedRevenueVal');
    if (accumRevEl) {
      accumRevEl.innerText = `$${Math.round(data.amsTotalSales || 0).toLocaleString('en-US')}`;
    }

    // 最高收入店铺
    const leadingStoreNameEl = document.getElementById('leadingStoreName');
    const leadingStoreRevEl = document.getElementById('leadingStoreRevenue');
    if (leadingStoreNameEl && data.leadingStore) {
      leadingStoreNameEl.innerText = data.leadingStore.storeName;
    }
    if (leadingStoreRevEl && data.leadingStore) {
      leadingStoreRevEl.innerText = `$${Math.round(data.leadingStore.sales).toLocaleString('en-US')} USD`;
    }

    // 最近一小时预估营收
    const runRateEl = document.getElementById('hourlyRunRateVal');
    if (runRateEl) {
      runRateEl.innerText = `$${Number(data.hourlyRunRate || 0).toLocaleString('en-US')} / hr`;
    }
  }

  /**
   * 3. 四大店铺营收卡片 (Orders by storefront)
   */
  renderStorefrontCards(data) {
    data.stores.forEach(store => {
      const card = document.querySelector(`.storefront-card[data-store-id="${store.storeId}"]`);
      if (!card) return;

      // 订单数量
      const ordersEl = card.querySelector('.card-orders-num');
      if (ordersEl) {
        ordersEl.innerText = store.storeOrders.toLocaleString('en-US');
      }

      // 营收 (USD)
      const revEl = card.querySelector('.card-revenue-num');
      if (revEl) {
        revEl.innerText = `$${store.storeSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
      }

      // 市场数量与市场标签预览
      const marketsCountEl = card.querySelector('.card-markets-count');
      if (marketsCountEl) {
        marketsCountEl.innerText = `${store.marketCount} ${store.marketCount === 1 ? 'market' : 'markets'}`;
      }

      const marketListEl = card.querySelector('.card-markets-chips');
      if (marketListEl) {
        const preview = store.markets.map(m => m.marketName).join(' · ');
        marketListEl.innerText = preview;
      }
    });
  }

  /**
   * 4. 业务线与市场情报表格 (按业务线筛选)
   */
  renderIntelligenceTable(data, businessLine = 'all') {
    const tableBody = document.getElementById('intelligenceTableBody');
    if (!tableBody) return;

    // 收集展示行（可展示各店铺，或展开到各店铺的市场明细）
    let rows = [];

    let filteredStores = data.stores;
    if (businessLine === 'brand') {
      filteredStores = data.stores.filter(s => s.type === 'brand');
    } else if (businessLine === 'pan_eu') {
      filteredStores = data.stores.filter(s => s.type === 'pan_eu');
    }

    filteredStores.forEach(store => {
      // 店铺汇总行
      rows.push({
        isStoreSummary: true,
        storeName: store.storeName,
        category: store.category,
        type: store.type,
        sales: store.storeSales,
        sharePercent: store.sharePercent,
        orders: store.storeOrders,
        aov: store.storeAov,
        conversion: store.storeConversion,
        marketCount: store.marketCount
      });

      // 各国家/市场明细行
      store.markets.forEach(m => {
        rows.push({
          isStoreSummary: false,
          storeName: store.storeName,
          marketName: m.marketName,
          sales: m.sales,
          sharePercent: m.sharePercent,
          orders: m.orders,
          aov: m.aov,
          conversion: m.conversion
        });
      });
    });

    let html = '';
    rows.forEach(item => {
      if (item.isStoreSummary) {
        // 店铺一级汇总行
        const typeBadgeClass = item.type === 'brand' ? 'badge-brand' : 'badge-paneu';
        html += `
          <tr class="table-row-store-summary">
            <td class="col-name">
              <div class="store-badge-cell">
                <span class="type-tag ${typeBadgeClass}">${item.category}</span>
                <span class="store-title-text">${item.storeName}</span>
                <span class="market-sub-count">(${item.marketCount} markets)</span>
              </div>
            </td>
            <td class="col-sales">
              <span class="sales-val-main">$${item.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
            <td class="col-share">
              <div class="share-cell">
                <span class="share-pct">${item.sharePercent}%</span>
                <div class="share-bar-track">
                  <div class="share-bar-fill" style="width:${item.sharePercent}%;"></div>
                </div>
              </div>
            </td>
            <td class="col-orders">
              <span class="orders-val">${item.orders.toLocaleString('en-US')}</span>
            </td>
            <td class="col-aov">
              <span class="aov-val">$${item.aov.toFixed(2)}</span>
            </td>
            <td class="col-conv">
              <span class="conv-val">${item.conversion.toFixed(2)}%</span>
            </td>
          </tr>
        `;
      } else {
        // 市场二级明细行
        html += `
          <tr class="table-row-market-detail">
            <td class="col-name indent-cell">
              <span class="market-country-flag">${item.marketName}</span>
              <span class="market-detail-name">${item.storeName} - ${item.marketName} 市场</span>
            </td>
            <td class="col-sales">
              <span class="sales-val-sub">$${item.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
            <td class="col-share">
              <div class="share-cell">
                <span class="share-pct-sub">${item.sharePercent}%</span>
                <div class="share-bar-track sub-track">
                  <div class="share-bar-fill sub-fill" style="width:${Math.min(100, item.sharePercent * 2)}%;"></div>
                </div>
              </div>
            </td>
            <td class="col-orders">
              <span class="orders-val-sub">${item.orders.toLocaleString('en-US')}</span>
            </td>
            <td class="col-aov">
              <span class="aov-val-sub">$${item.aov.toFixed(2)}</span>
            </td>
            <td class="col-conv">
              <span class="conv-val-sub">${item.conversion.toFixed(2)}%</span>
            </td>
          </tr>
        `;
      }
    });

    tableBody.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardController();
  window.dashboard.init();
});
