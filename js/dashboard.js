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
    if (window.i18n) {
      window.i18n.init();
      window.i18n.onLanguageChange(() => {
        if (this.currentData) {
          this.handleDataUpdate(this.currentData);
        }
      });
    }

    this.startClock();

    if (window.CyberGlobe) {
      new CyberGlobe('earthGlobeCanvas');
    }

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
    const techClockEl = document.getElementById('techClockText');
    const liveClockEl = document.getElementById('liveClockText');
    const update = () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      if (techClockEl) {
        techClockEl.innerText = `${dateStr} ${timeStr}`;
      }
      if (liveClockEl) {
        const prefix = window.i18n ? window.i18n.t('updatedPrefix', 'Updated') : 'Updated';
        liveClockEl.innerText = `${prefix} ${timeStr}`;
      }
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
    // 时间周期预设切换 (黑五大促 / 今日 / 近7天 / 近30天)
    const presetPills = document.querySelectorAll('.preset-pill');
    presetPills.forEach(pill => {
      pill.addEventListener('click', e => {
        const target = e.currentTarget;
        presetPills.forEach(p => p.classList.remove('active'));
        target.classList.add('active');
        const preset = target.dataset.preset;
        if (window.dataService) {
          window.dataService.setTimePreset(preset);
        }
      });
    });

    // 里程碑突破 3D 烟花粒子特效演示按钮
    const demoBtn = document.getElementById('milestoneDemoBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        if (window.triggerMilestoneFx) {
          window.triggerMilestoneFx();
        }
      });
    }
  }

  handleDataUpdate(data) {
    if (!data) return;
    this.currentData = data;

    // 0. 更新接口连接状态与时间显示
    this.renderApiStatusAndTime(data);

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

    // 6. 里程碑门槛检测 (自动触发突破烟花粒子大招)
    if (window.celebrationEngine) {
      window.celebrationEngine.checkMilestones(data);
    }
  }

  renderApiStatusAndTime(data) {
    const timeRangeEl = document.getElementById('currentTimeRangeText');
    if (timeRangeEl && data.apiInfo) {
      const bDate = data.apiInfo.payTimeBegin ? data.apiInfo.payTimeBegin.split(' ')[0] : '2026-10-20';
      const eDate = data.apiInfo.payTimeEnd ? data.apiInfo.payTimeEnd.split(' ')[0] : '2026-10-30';
      timeRangeEl.innerText = `${bDate} ~ ${eDate}`;
    }

    const badgeEl = document.getElementById('apiStatusBadge');
    const textEl = document.getElementById('apiStatusText');
    if (badgeEl && textEl) {
      if (data.isRealApi) {
        badgeEl.classList.remove('error');
        textEl.innerText = 'BFF 实时连接';
      } else {
        badgeEl.classList.add('error');
        textEl.innerText = '离线兜底中';
      }
    }
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

    // 全店铺订单附注：采用真实店铺与市场汇聚统计 (剔除原型 mock 占位符)
    const ordersSubNoteEl = document.querySelector('.orders-sub-note');
    if (ordersSubNoteEl && data.stores) {
      const storeCount = data.stores.length;
      let totalMarkets = 0;
      data.stores.forEach(s => totalMarkets += (s.marketCount || (s.markets ? s.markets.length : 0)));
      const isEn = window.i18n && window.i18n.currentLang === 'en';
      ordersSubNoteEl.innerText = isEn
        ? `● Active: ${storeCount} Stores · ${totalMarkets} Markets Total`
        : `● 实时汇聚：${storeCount} 个店铺 · ${totalMarkets} 个国家市场`;
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
    const container = document.querySelector('.storefronts-grid') || document.querySelector('.storefronts-carousel-grid');
    if (!container || !data.stores) return;
    const t = k => (window.i18n ? window.i18n.t(k) : k);

    let html = '';
    data.stores.forEach((store, idx) => {
      const idxStr = String(idx + 1).padStart(2, '0');
      const isBrand = store.type === 'brand';
      const typeBadgeClass = isBrand ? '' : 'paneu';
      const typeBadgeText = isBrand ? t('tagBrand') : t('tagPanEu');
      const marketSuffix = store.marketCount === 1 ? t('marketSuffixSingle') : t('marketsSuffix');
      const marketChips = store.markets.map(m => m.marketName).join(' · ');

      html += `
        <div class="storefront-card" data-store-id="${store.storeId}">
          <div class="storefront-card-top">
            <div class="store-id-name-wrap">
              <span class="store-idx">${idxStr}</span>
              <span class="store-name-bold" title="${store.storeName}">${store.storeName}</span>
              <span class="store-type-badge ${typeBadgeClass}">${typeBadgeText}</span>
            </div>
            <span class="store-status-online">${t('onlineStatus')}</span>
          </div>
          <div class="store-card-middle">
            <div>
              <span class="card-orders-num">${store.storeOrders.toLocaleString('en-US')}</span>
              <span class="orders-unit-label" data-i18n="ordersUnit">${t('ordersUnit')}</span>
            </div>
            <div class="card-revenue-box">
              <span class="revenue-tiny-label" data-i18n="revenueUnit">${t('revenueUnit')}</span>
              <span class="card-revenue-num">$${store.storeSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
          </div>
          <div class="storefront-card-bottom">
            <span class="card-markets-chips" title="${marketChips}">${marketChips || '-'}</span>
            <span class="card-markets-count">${store.marketCount} ${marketSuffix}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  /**
   * 4. 业务线与市场情报表格 (按业务线筛选)
   */
  renderIntelligenceTable(data, businessLine = 'all') {
    const tableBody = document.getElementById('intelligenceTableBody');
    if (!tableBody) return;
    const t = k => (window.i18n ? window.i18n.t(k) : k);

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
        category: store.type === 'brand' ? t('tagBrand') : t('tagPanEu'),
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
                <span class="market-sub-count">(${item.marketCount} ${t('marketsSuffix')})</span>
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
              <span class="market-detail-name">${item.storeName} - ${item.marketName} ${t('marketText')}</span>
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
