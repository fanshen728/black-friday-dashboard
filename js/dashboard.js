/**
 * AMS 销售看板 - 核心主控逻辑 (纯净版)
 * 职责：
 * 1. 顶部 AMS 总销售额超大数字翻牌器 ($)
 * 2. 实时时钟角标
 * 3. 四大店铺核心销售额与市场概况卡片
 * 4. 多市场销售额数据排行榜表格
 * 5. 视图切换调度 (四店联合对比 / 2x2 四分屏 / 单店下钻)
 */

class DashboardController {
  constructor() {
    this.currentData = null;
    this.activeStoreName = 'all';
  }

  init() {
    this.startClock();

    if (window.CyberGlobe) {
      new CyberGlobe('earthGlobeCanvas');
    }

    window.dashboardCharts.init();
    this.bindEvents();

    window.dataService.onData(data => this.handleDataUpdate(data));
    window.dataService.startPolling();
  }

  startClock() {
    const clockEl = document.getElementById('techClockText');
    const update = () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const str = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      if (clockEl) clockEl.innerText = str;
    };
    update();
    setInterval(update, 1000);
  }

  bindEvents() {
    // 视图切换 Tab 按钮
    const tabBtns = document.querySelectorAll('.view-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget;
        tabBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        const mode = target.dataset.mode;
        const storeName = target.dataset.store || 'aosom.eu';
        this.activeStoreName = mode === 'all' || mode === 'quad' ? 'all' : storeName;

        window.dashboardCharts.setViewMode(mode, storeName);
        if (this.currentData) {
          window.dashboardCharts.update(this.currentData);
          this.renderMarketTable(this.currentData);
        }
      });
    });

    // 四大店铺卡片点击快速聚焦
    const storeCards = document.querySelectorAll('.store-kpi-card');
    storeCards.forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.storeName;
        const targetTab = document.querySelector(`.view-tab-btn[data-store="${name}"]`);
        if (targetTab) {
          targetTab.click();
        }
      });
    });

    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreenToggleBtn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }
  }

  handleDataUpdate(data) {
    this.currentData = data;

    // 1. 顶部超大数字翻牌器
    this.renderAmsTotalCounter(data.amsTotalSales);

    // 2. 4个店铺的销售额卡片
    this.renderStoreCards(data);

    // 3. 多市场销售数据表
    this.renderMarketTable(data);

    // 4. ECharts 柱状图与占比图
    window.dashboardCharts.update(data);
  }

  /**
   * 渲染顶部 "AMS总销售额" 数字翻牌器 ($)
   */
  renderAmsTotalCounter(amount) {
    const container = document.getElementById('amsFlipCounter');
    if (!container) return;

    const formattedStr = (Number(amount) || 0).toLocaleString('en-US');
    const fullStr = `$ ${formattedStr}`;

    let html = '';
    for (let i = 0; i < fullStr.length; i++) {
      const char = fullStr[i];
      if (char === ' ') {
        html += '<span class="digit-separator-space"></span>';
      } else if (char === ',') {
        html += '<span class="digit-box digit-comma">,</span>';
      } else if (char === '$') {
        html += `<span class="digit-box digit-symbol">$</span>`;
      } else {
        html += `<span class="digit-box digit-number">${char}</span>`;
      }
    }

    container.innerHTML = html;
  }

  /**
   * 渲染4大店铺销售额与市场概况卡片
   */
  renderStoreCards(data) {
    data.stores.forEach(store => {
      const card = document.querySelector(`.store-kpi-card[data-store-name="${store.storeName}"]`);
      if (!card) return;

      const salesEl = card.querySelector('.store-sales-val');
      const shareEl = card.querySelector('.store-share-val');
      const marketsSummaryEl = card.querySelector('.store-markets-summary');

      const dot = card.querySelector('.brand-status-dot');
      if (dot && window.dashboardCharts) {
        const themeColor = window.dashboardCharts.getStoreColor(store.storeName, store.color);
        dot.style.backgroundColor = themeColor;
        dot.style.boxShadow = `0 0 6px ${themeColor}`;
      }

      if (salesEl) salesEl.innerText = `$ ${store.storeSales.toLocaleString()}`;

      const sharePct = ((store.storeSales / (data.amsTotalSales || 1)) * 100).toFixed(1);
      if (shareEl) shareEl.innerText = `${sharePct}%`;

      if (marketsSummaryEl) {
        // 显示包含多少个市场，以及前两三个市场预览
        const numMarkets = store.markets.length;
        const marketTags = store.markets.slice(0, 3).map(m => {
          const kVal = m.sales >= 1000 ? (m.sales / 1000).toFixed(0) + 'k' : m.sales;
          return `<span class="top-market-chip">${m.marketName} $${kVal}</span>`;
        }).join('');

        marketsSummaryEl.innerHTML = `
          <span class="store-market-count-badge">${numMarkets}个市场</span>
          <div class="store-top-markets-preview">${marketTags}</div>
        `;
      }
    });
  }

  /**
   * 渲染多市场销售排行榜表格 (纯美元，清晰对比)
   */
  renderMarketTable(data) {
    const tableBody = document.getElementById('marketTableBody');
    if (!tableBody) return;

    let marketList = [];

    if (this.activeStoreName !== 'all') {
      const s = data.stores.find(st => st.storeName === this.activeStoreName);
      if (s) {
        const sColor = window.dashboardCharts ? window.dashboardCharts.getStoreColor(s.storeName, s.color) : s.color;
        marketList = s.markets.map(m => ({
          storeName: s.storeName,
          storeColor: sColor,
          marketName: m.marketName,
          sales: m.sales
        }));
      }
    } else {
      data.stores.forEach(s => {
        const sColor = window.dashboardCharts ? window.dashboardCharts.getStoreColor(s.storeName, s.color) : s.color;
        s.markets.forEach(m => {
          marketList.push({
            storeName: s.storeName,
            storeColor: sColor,
            marketName: m.marketName,
            sales: m.sales
          });
        });
      });
    }

    // 按销售额倒序排列
    marketList.sort((a, b) => b.sales - a.sales);

    const maxSales = marketList[0] ? marketList[0].sales : 1;

    let html = '';
    marketList.slice(0, 10).forEach((item, index) => {
      const rank = index + 1;
      const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span class="rank-num">${rank}</span>`;
      const pct = Math.round((item.sales / maxSales) * 100);

      html += `
        <tr class="market-row">
          <td class="col-rank">${rankBadge}</td>
          <td class="col-store">
            <span class="store-dot" style="background:${item.storeColor};"></span>
            <span>${item.storeName}</span>
          </td>
          <td class="col-market-name">
            <span class="market-name-tag">${item.marketName}</span>
          </td>
          <td class="col-sales">
            <div class="val-bar-cell">
              <span class="usd-val">$ ${item.sales.toLocaleString()}</span>
              <div class="mini-bar-track">
                <div class="mini-bar-fill" style="width:${pct}%;"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardController();
  window.dashboard.init();
});
