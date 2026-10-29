/**
 * AMS 销售看板 - 多主题纯净柱状图可视化引擎
 * 遵循 SOLID 原则 (OCP, SRP)：
 * 1. 严格统一为美元 ($)，左上角标注 Unit: $，右上角标注 ● Actual
 * 2. 柱体顶部清晰标注具体数值 (如 215,400, 168,200)
 * 3. 动态自适应店铺市场数量 (支持 1 个市场至 10+ 个市场无缝自适应展示)
 * 4. 原生多主题支持：商务科技蓝 (business-blue)、黑五尊贵黑金 (black-gold)、极简现代板岩 (minimal-slate)、赛博朋克 (cyberpunk)
 */

const THEME_CONFIGS = {
  'business-blue': {
    name: '商务科技蓝',
    storeColors: {
      'aosom.eu': '#2563eb',       // 经典商务皇室蓝
      'homcom.fr': '#0284c7',      // 湖蓝
      'homcomstore': '#6366f1',    // 靛青蓝
      'outsunny.fr': '#059669'     // 翡翠青绿
    },
    singleBarGradient: [
      { offset: 0, color: '#3b82f6' },
      { offset: 0.6, color: '#2563eb' },
      { offset: 1, color: '#1d4ed8' }
    ],
    singleBarShadow: 'rgba(37, 99, 235, 0.4)',
    tooltipBg: 'rgba(12, 26, 62, 0.95)',
    tooltipBorder: '#3b82f6',
    tooltipTitle: '#60a5fa',
    valColor: '#93c5fd',
    labelColor: '#ffffff',
    splitLine: 'rgba(255, 255, 255, 0.08)',
    axisLine: '#1e3a8a',
    axisLabel: '#94a3b8'
  },
  'black-gold': {
    name: '黑五尊贵黑金',
    storeColors: {
      'aosom.eu': '#f59e0b',       // 琥珀金
      'homcom.fr': '#fbbf24',      // 香槟金
      'homcomstore': '#f43f5e',    // 黑五狂欢玫瑰红
      'outsunny.fr': '#10b981'     // 祖母绿
    },
    singleBarGradient: [
      { offset: 0, color: '#fbbf24' },
      { offset: 0.6, color: '#d97706' },
      { offset: 1, color: '#92400e' }
    ],
    singleBarShadow: 'rgba(245, 158, 11, 0.5)',
    tooltipBg: 'rgba(22, 22, 28, 0.95)',
    tooltipBorder: '#f59e0b',
    tooltipTitle: '#fbbf24',
    valColor: '#fef08a',
    labelColor: '#fffbeb',
    splitLine: 'rgba(245, 158, 11, 0.12)',
    axisLine: '#78350f',
    axisLabel: '#a3a3a3'
  },
  'minimal-slate': {
    name: '极简现代板岩',
    storeColors: {
      'aosom.eu': '#38bdf8',       // 天青
      'homcom.fr': '#818cf8',      // 冷紫
      'homcomstore': '#34d399',    // 薄荷绿
      'outsunny.fr': '#fb923c'     // 暖橙
    },
    singleBarGradient: [
      { offset: 0, color: '#38bdf8' },
      { offset: 0.6, color: '#0284c7' },
      { offset: 1, color: '#0369a1' }
    ],
    singleBarShadow: 'rgba(56, 189, 248, 0.3)',
    tooltipBg: 'rgba(17, 24, 39, 0.95)',
    tooltipBorder: 'rgba(255, 255, 255, 0.15)',
    tooltipTitle: '#38bdf8',
    valColor: '#34d399',
    labelColor: '#f8fafc',
    splitLine: 'rgba(255, 255, 255, 0.06)',
    axisLine: '#334155',
    axisLabel: '#94a3b8'
  },
  'cyberpunk': {
    name: '赛博朋克霓虹',
    storeColors: {
      'aosom.eu': '#00f0ff',       // 霓虹青
      'homcom.fr': '#00e5ff',      // 电光蓝
      'homcomstore': '#7000ff',    // 赛博紫
      'outsunny.fr': '#00ff88'     // 荧光绿
    },
    singleBarGradient: [
      { offset: 0, color: '#00f0ff' },
      { offset: 0.6, color: '#0099ff' },
      { offset: 1, color: '#0055ff' }
    ],
    singleBarShadow: 'rgba(0, 240, 255, 0.55)',
    tooltipBg: 'rgba(6, 17, 43, 0.92)',
    tooltipBorder: '#00f0ff',
    tooltipTitle: '#00f0ff',
    valColor: '#00ffb4',
    labelColor: '#bef2ff',
    splitLine: 'rgba(255, 255, 255, 0.1)',
    axisLine: '#16365f',
    axisLabel: '#8da6cb'
  }
};

class DashboardCharts {
  constructor() {
    this.mainChart = null;
    this.shareChart = null;
    this.quadCharts = {};
    this.currentViewMode = 'all'; // 'all' | 'quad' | 'store'
    this.currentStoreName = 'aosom.eu';
    this.lastData = null;
    this.theme = window.ACTIVE_THEME || document.documentElement.dataset.theme || 'business-blue';
  }

  getThemeConfig() {
    const cur = window.ACTIVE_THEME || document.documentElement.dataset.theme || this.theme;
    return THEME_CONFIGS[cur] || THEME_CONFIGS['business-blue'];
  }

  getStoreColor(storeName, fallbackColor) {
    const cfg = this.getThemeConfig();
    return (cfg.storeColors && cfg.storeColors[storeName]) || fallbackColor;
  }

  setTheme(themeName) {
    if (THEME_CONFIGS[themeName]) {
      this.theme = themeName;
      window.ACTIVE_THEME = themeName;
      document.documentElement.dataset.theme = themeName;
      if (this.lastData) {
        this.update(this.lastData);
      }
    }
  }

  init() {
    this.initMainChart();
    this.initShareChart();
    this.initQuadCharts();

    window.addEventListener('resize', () => this.resizeAll());
  }

  resizeAll() {
    if (this.mainChart) this.mainChart.resize();
    if (this.shareChart) this.shareChart.resize();
    Object.values(this.quadCharts).forEach(c => c && c.resize());
  }

  initMainChart() {
    const dom = document.getElementById('mainBarChart');
    if (dom) this.mainChart = echarts.init(dom);
  }

  initShareChart() {
    const dom = document.getElementById('storeShareChart');
    if (dom) this.shareChart = echarts.init(dom);
  }

  initQuadCharts() {
    const ids = ['quad_aosom_eu', 'quad_homcom_fr', 'quad_homcomstore', 'quad_outsunny_fr'];
    const names = ['aosom.eu', 'homcom.fr', 'homcomstore', 'outsunny.fr'];
    ids.forEach((id, idx) => {
      const dom = document.getElementById(id);
      if (dom) {
        this.quadCharts[names[idx]] = echarts.init(dom);
      }
    });
  }

  update(data) {
    if (!data || !data.stores) return;
    this.lastData = data;

    if (this.currentViewMode === 'all') {
      this.renderAllStoresComparison(data);
    } else if (this.currentViewMode === 'quad') {
      this.renderQuadView(data);
    } else if (this.currentViewMode === 'store') {
      this.renderSingleStoreFocus(data, this.currentStoreName);
    }

    this.renderShareChart(data);
  }

  /**
   * 视图一：【四店多市场并列对比柱状图】
   */
  renderAllStoresComparison(data) {
    if (!this.mainChart) return;
    const cfg = this.getThemeConfig();

    // 收集所有去重市场名称
    const allMarketSet = new Set();
    data.stores.forEach(s => {
      s.markets.forEach(m => allMarketSet.add(m.marketName));
    });
    const xLabels = Array.from(allMarketSet);

    const series = data.stores.map(store => {
      const sColor = this.getStoreColor(store.storeName, store.color);
      const seriesData = xLabels.map(mName => {
        const found = store.markets.find(m => m.marketName === mName);
        return found ? found.sales : 0;
      });

      return {
        name: store.storeName,
        type: 'bar',
        barWidth: 12,
        barGap: '20%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: sColor },
            { offset: 1, color: echarts.color.modifyAlpha(sColor, 0.15) }
          ]),
          borderRadius: [4, 4, 0, 0],
          shadowColor: echarts.color.modifyAlpha(sColor, 0.35),
          shadowBlur: 6
        },
        data: seriesData
      };
    });

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        backgroundColor: cfg.tooltipBg,
        borderColor: cfg.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: params => {
          if (!params || !params.length) return '';
          let res = `<div style="font-weight:bold;margin-bottom:6px;color:${cfg.tooltipTitle};border-bottom:1px solid ${echarts.color.modifyAlpha(cfg.tooltipBorder, 0.3)};padding-bottom:4px;">${params[0].name} 市场销售对比</div>`;
          params.forEach(item => {
            if (item.value > 0) {
              const dotColor = item.color.colorStops ? item.color.colorStops[0].color : item.color;
              res += `<div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0;">
                <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:6px;"></span>${item.seriesName}</span>
                <span style="font-weight:bold;color:${cfg.valColor};">$ ${Number(item.value).toLocaleString()}</span>
              </div>`;
            }
          });
          return res;
        }
      },
      legend: {
        top: 8,
        right: 15,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: cfg.axisLabel, fontSize: 12 }
      },
      grid: { top: 50, left: 65, right: 25, bottom: 35 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: cfg.axisLine } },
        axisTick: { show: false },
        axisLabel: { color: cfg.axisLabel, fontSize: 12, interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Unit: $',
        nameTextStyle: { color: cfg.axisLabel, padding: [0, 0, 0, -30], fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: cfg.splitLine, type: 'dashed' } },
        axisLabel: {
          color: cfg.axisLabel,
          fontSize: 11,
          formatter: v => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
        }
      },
      series: series
    };

    this.mainChart.setOption(option, true);
  }

  /**
   * 视图二：【单店多市场聚焦柱状图】
   */
  renderSingleStoreFocus(data, storeName) {
    if (!this.mainChart) return;
    const cfg = this.getThemeConfig();
    const store = data.stores.find(s => s.storeName === storeName) || data.stores[0];
    if (!store) return;

    const sColor = this.getStoreColor(store.storeName, store.color);
    const markets = [...store.markets].sort((a, b) => b.sales - a.sales);
    const xData = markets.map(m => m.marketName);
    const yData = markets.map(m => m.sales);

    const dynamicBarWidth = markets.length === 1 ? 58 : markets.length <= 3 ? 42 : 26;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        backgroundColor: cfg.tooltipBg,
        borderColor: cfg.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: params => {
          const item = params[0];
          return `
            <div style="font-weight:bold;margin-bottom:6px;color:${cfg.tooltipTitle};">${store.storeName} - ${item.name} 市场</div>
            <div>销售额: <span style="color:${cfg.valColor};font-weight:bold;">$ ${Number(item.value).toLocaleString()}</span></div>
          `;
        }
      },
      legend: {
        top: 6,
        right: 15,
        data: ['Actual'],
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: cfg.tooltipTitle, fontSize: 13 }
      },
      grid: { top: 50, left: 65, right: 25, bottom: 35 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: cfg.axisLine, width: 1.5 } },
        axisTick: { show: false },
        axisLabel: { color: cfg.axisLabel, fontSize: 13, interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Unit: $',
        nameTextStyle: { color: cfg.axisLabel, padding: [0, 0, 0, -30], fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: cfg.splitLine, type: 'solid' } },
        axisLabel: {
          color: cfg.axisLabel,
          fontSize: 11,
          formatter: v => v.toLocaleString()
        }
      },
      series: [
        {
          name: 'Actual',
          type: 'bar',
          barWidth: dynamicBarWidth,
          data: yData,
          label: {
            show: true,
            position: 'top',
            distance: 6,
            color: cfg.labelColor,
            fontSize: 12,
            fontWeight: 'bold',
            formatter: params => Number(params.value).toLocaleString()
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, cfg.singleBarGradient),
            borderRadius: [4, 4, 0, 0],
            shadowColor: cfg.singleBarShadow,
            shadowBlur: 8
          }
        }
      ]
    };

    this.mainChart.setOption(option, true);
  }

  /**
   * 视图三：【2x2 四分屏独立矩阵】
   */
  renderQuadView(data) {
    const cfg = this.getThemeConfig();
    data.stores.forEach(store => {
      const chart = this.quadCharts[store.storeName];
      if (!chart) return;

      const sColor = this.getStoreColor(store.storeName, store.color);
      const markets = [...store.markets].sort((a, b) => b.sales - a.sales);
      const xData = markets.map(m => m.marketName);
      const yData = markets.map(m => m.sales);

      const barW = markets.length === 1 ? 36 : markets.length <= 3 ? 24 : 14;

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: cfg.tooltipBg,
          borderColor: sColor,
          borderWidth: 1,
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: params => {
            const item = params[0];
            return `<b>${item.name}</b>: $ ${Number(item.value).toLocaleString()}`;
          }
        },
        grid: { top: 35, left: 55, right: 15, bottom: 25 },
        xAxis: {
          type: 'category',
          data: xData,
          axisLine: { lineStyle: { color: cfg.axisLine } },
          axisTick: { show: false },
          axisLabel: { color: cfg.axisLabel, fontSize: 11, interval: 0 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: cfg.splitLine } },
          axisLabel: {
            color: cfg.axisLabel,
            fontSize: 10,
            formatter: v => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
          }
        },
        series: [
          {
            name: store.storeName,
            type: 'bar',
            barWidth: barW,
            data: yData,
            label: {
              show: markets.length <= 4,
              position: 'top',
              color: cfg.labelColor,
              fontSize: 10,
              formatter: p => (p.value >= 1000 ? Math.round(p.value / 1000) + 'k' : p.value)
            },
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: sColor },
                { offset: 1, color: echarts.color.modifyAlpha(sColor, 0.2) }
              ]),
              borderRadius: [3, 3, 0, 0]
            }
          }
        ]
      };

      chart.setOption(option, true);
    });
  }

  /**
   * 渲染四店铺销售占比环形图
   */
  renderShareChart(data) {
    if (!this.shareChart) return;
    const cfg = this.getThemeConfig();

    const pieData = data.stores.map(store => {
      const sColor = this.getStoreColor(store.storeName, store.color);
      return {
        name: store.storeName,
        value: store.storeSales,
        itemStyle: {
          color: sColor,
          shadowBlur: 6,
          shadowColor: echarts.color.modifyAlpha(sColor, 0.4)
        }
      };
    });

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: cfg.tooltipBg,
        borderColor: cfg.tooltipBorder,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: params => {
          return `<b>${params.name}</b><br/>销售额: $ ${Number(params.value).toLocaleString()}<br/>占比: ${params.percent}%`;
        }
      },
      legend: {
        orient: 'vertical',
        right: 5,
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: cfg.axisLabel, fontSize: 11 }
      },
      series: [
        {
          name: '店铺占比',
          type: 'pie',
          radius: ['52%', '76%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              formatter: '{d}%',
              fontSize: 14,
              fontWeight: 'bold',
              color: cfg.valColor
            }
          },
          data: pieData
        }
      ]
    };

    this.shareChart.setOption(option, true);
  }

  setViewMode(mode, storeName = null) {
    this.currentViewMode = mode;
    if (storeName) this.currentStoreName = storeName;

    const mainContainer = document.getElementById('mainBarChartContainer');
    const quadContainer = document.getElementById('quadViewContainer');

    if (mode === 'quad') {
      if (mainContainer) mainContainer.style.display = 'none';
      if (quadContainer) quadContainer.style.display = 'grid';
    } else {
      if (mainContainer) mainContainer.style.display = 'block';
      if (quadContainer) quadContainer.style.display = 'none';
    }

    this.resizeAll();
  }
}

window.THEME_CONFIGS = THEME_CONFIGS;
window.dashboardCharts = new DashboardCharts();
