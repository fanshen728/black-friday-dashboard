/**
 * AMS 销售看板 - ECharts 可视化图表引擎 (新版排版)
 * 职责：
 * 1. 中部主图表：单店铺营收纵向大柱状图 (Single Store Revenue Bar Chart)
 *    - 深度复刻参考图：4根立体发光大柱体，顶部清晰浮动胶囊数值牌 (如 $1,376,123)
 * 2. 底部图表：业务线店铺/市场横向对比条形图 (Global Storefront Ranking Horizontal Bar)
 * 3. 完美兼容 4 套主题：商务科技蓝、黑五尊贵黑金、极简现代板岩、赛博朋克霓虹
 */

const THEME_CONFIGS = {
  'business-blue': {
    name: '商务科技蓝',
    storeColors: {
      'HOMCOM Store': '#2563eb',   // 宝蓝
      'Outsunny FR': '#8b5cf6',    // 亮紫
      'HOMCOM FR': '#06b6d4',      // 青绿
      'AOSOM EU': '#f59e0b'        // 琥珀金
    },
    tooltipBg: 'rgba(12, 26, 62, 0.95)',
    tooltipBorder: '#3b82f6',
    tooltipTitle: '#60a5fa',
    splitLine: 'rgba(255, 255, 255, 0.08)',
    axisLine: '#1e3a8a',
    axisLabel: '#94a3b8',
    barLabelBg: 'rgba(30, 58, 138, 0.7)',
    barLabelBorder: 'rgba(96, 165, 250, 0.4)'
  },
  'black-gold': {
    name: '黑五尊贵黑金',
    storeColors: {
      'HOMCOM Store': '#fbbf24',   // 香槟金
      'Outsunny FR': '#f43f5e',    // 黑五玫瑰金红
      'HOMCOM FR': '#10b981',      // 翡翠绿
      'AOSOM EU': '#d97706'        // 曜石暗金
    },
    tooltipBg: 'rgba(22, 22, 28, 0.95)',
    tooltipBorder: '#f59e0b',
    tooltipTitle: '#fbbf24',
    splitLine: 'rgba(245, 158, 11, 0.1)',
    axisLine: '#78350f',
    axisLabel: '#a3a3a3',
    barLabelBg: 'rgba(45, 35, 18, 0.8)',
    barLabelBorder: 'rgba(245, 158, 11, 0.5)'
  },
  'minimal-slate': {
    name: '极简现代板岩',
    storeColors: {
      'HOMCOM Store': '#38bdf8',   // 天青
      'Outsunny FR': '#818cf8',    // 冷紫
      'HOMCOM FR': '#34d399',      // 薄荷绿
      'AOSOM EU': '#fb923c'        // 暖橙
    },
    tooltipBg: 'rgba(17, 24, 39, 0.95)',
    tooltipBorder: 'rgba(255, 255, 255, 0.15)',
    tooltipTitle: '#38bdf8',
    splitLine: 'rgba(255, 255, 255, 0.06)',
    axisLine: '#334155',
    axisLabel: '#94a3b8',
    barLabelBg: 'rgba(31, 41, 55, 0.8)',
    barLabelBorder: 'rgba(255, 255, 255, 0.15)'
  },
  'cyberpunk': {
    name: '赛博朋克霓虹',
    storeColors: {
      'HOMCOM Store': '#00f0ff',   // 霓虹青
      'Outsunny FR': '#7000ff',    // 赛博紫
      'HOMCOM FR': '#00ff88',      // 电光绿
      'AOSOM EU': '#ffb703'        // 炽金色
    },
    tooltipBg: 'rgba(6, 17, 43, 0.92)',
    tooltipBorder: '#00f0ff',
    tooltipTitle: '#00f0ff',
    splitLine: 'rgba(255, 255, 255, 0.1)',
    axisLine: '#16365f',
    axisLabel: '#8da6cb',
    barLabelBg: 'rgba(6, 24, 60, 0.85)',
    barLabelBorder: 'rgba(0, 240, 255, 0.5)'
  }
};

class DashboardCharts {
  constructor() {
    this.singleStoreChart = null;
    this.horizontalRankChart = null;
    this.lastData = null;
    this.activeBusinessLine = 'all'; // 'all' | 'brand' | 'pan_eu'
    this.theme = window.ACTIVE_THEME || document.documentElement.dataset.theme || 'business-blue';
  }

  getThemeConfig() {
    const cur = window.ACTIVE_THEME || document.documentElement.dataset.theme || this.theme;
    return THEME_CONFIGS[cur] || THEME_CONFIGS['business-blue'];
  }

  getStoreColor(storeName) {
    const cfg = this.getThemeConfig();
    return (cfg.storeColors && cfg.storeColors[storeName]) || '#3b82f6';
  }

  setTheme(themeName) {
    if (THEME_CONFIGS[themeName]) {
      this.theme = themeName;
      window.ACTIVE_THEME = themeName;
      document.documentElement.dataset.theme = themeName;
      if (this.lastData) {
        this.update(this.lastData, this.activeBusinessLine);
      }
    }
  }

  init() {
    const dom1 = document.getElementById('singleStoreBarChart');
    if (dom1) this.singleStoreChart = echarts.init(dom1);

    const dom2 = document.getElementById('horizontalRankChart');
    if (dom2) this.horizontalRankChart = echarts.init(dom2);

    window.addEventListener('resize', () => this.resizeAll());
  }

  resizeAll() {
    if (this.singleStoreChart) this.singleStoreChart.resize();
    if (this.horizontalRankChart) this.horizontalRankChart.resize();
  }

  update(data, activeBusinessLine = 'all') {
    if (!data || !data.stores) return;
    this.lastData = data;
    this.activeBusinessLine = activeBusinessLine;

    this.renderSingleStoreBarChart(data);
    this.renderHorizontalRankChart(data, activeBusinessLine);
  }

  /**
   * 1. 中部主图表：单店铺营收柱状图 (参考图中间大图)
   */
  renderSingleStoreBarChart(data) {
    if (!this.singleStoreChart) return;
    const cfg = this.getThemeConfig();

    // 4 个店铺名称与销售额
    const xNames = data.stores.map(s => s.storeName);
    const seriesData = data.stores.map(store => {
      const sColor = this.getStoreColor(store.storeName);
      return {
        value: store.storeSales,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: sColor },
            { offset: 1, color: echarts.color.modifyAlpha(sColor, 0.35) }
          ]),
          borderRadius: [6, 6, 0, 0],
          shadowColor: echarts.color.modifyAlpha(sColor, 0.4),
          shadowBlur: 10
        }
      };
    });

    const maxSales = Math.max(...data.stores.map(s => s.storeSales));
    const yMax = Math.ceil((maxSales * 1.25) / 100000) * 100000;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255, 255, 255, 0.04)' } },
        backgroundColor: cfg.tooltipBg,
        borderColor: cfg.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: params => {
          const item = params[0];
          const st = data.stores.find(s => s.storeName === item.name);
          if (!st) return '';
          return `
            <div style="font-weight:bold;margin-bottom:6px;color:${cfg.tooltipTitle};border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:4px;">
              ${st.category ? `[${st.category}] ` : ''}${st.storeName}
            </div>
            <div style="margin:4px 0;">总营收: <b style="color:#ffffff;">$ ${Number(st.storeSales).toLocaleString()}</b></div>
            <div style="margin:4px 0;">总订单: <b style="color:#93c5fd;">${st.storeOrders.toLocaleString()} 笔</b></div>
            <div style="margin:4px 0;">市场数: <b>${st.marketCount} 个国家市场</b></div>
            <div style="margin:4px 0;">平均客单价: <b>$ ${st.storeAov.toFixed(2)}</b></div>
            <div style="margin:4px 0;">平均转化率: <b>${st.storeConversion.toFixed(2)}%</b></div>
          `;
        }
      },
      grid: { top: 40, left: 60, right: 30, bottom: 35 },
      xAxis: {
        type: 'category',
        data: xNames,
        axisLine: { lineStyle: { color: cfg.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          color: cfg.axisLabel,
          fontSize: 12,
          fontWeight: 600,
          margin: 12
        }
      },
      yAxis: {
        type: 'value',
        max: yMax,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: cfg.splitLine, type: 'dashed' } },
        axisLabel: {
          color: cfg.axisLabel,
          fontSize: 11,
          formatter: v => {
            if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
            if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
            return `$${v}`;
          }
        }
      },
      series: [
        {
          name: '单店营收',
          type: 'bar',
          barWidth: 54,
          data: seriesData,
          label: {
            show: true,
            position: 'top',
            distance: 8,
            formatter: params => `$${Math.round(params.value).toLocaleString()}`,
            backgroundColor: cfg.barLabelBg,
            borderColor: cfg.barLabelBorder,
            borderWidth: 1,
            borderRadius: 4,
            padding: [4, 8],
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'DIN Alternate, SF Pro Display, monospace'
          }
        }
      ]
    };

    this.singleStoreChart.setOption(option, true);
  }

  /**
   * 2. 底部横向柱图：业务线/店铺营收对比 (参考图下方条形图)
   */
  renderHorizontalRankChart(data, activeBusinessLine = 'all') {
    if (!this.horizontalRankChart) return;
    const cfg = this.getThemeConfig();

    // 根据业务线 Tab 进行过滤
    let filteredStores = data.stores;
    if (activeBusinessLine === 'brand') {
      filteredStores = data.stores.filter(s => s.type === 'brand');
    } else if (activeBusinessLine === 'pan_eu') {
      filteredStores = data.stores.filter(s => s.type === 'pan_eu');
    }

    // 排序：从大到小
    const sorted = [...filteredStores].sort((a, b) => a.storeSales - b.storeSales);
    const yNames = sorted.map(s => s.storeName);
    const seriesValues = sorted.map(s => s.storeSales);
    const seriesData = sorted.map(s => {
      const sColor = this.getStoreColor(s.storeName);
      return {
        value: s.storeSales,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: sColor },
            { offset: 1, color: echarts.color.modifyAlpha(sColor, 0.4) }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      };
    });

    const maxVal = Math.max(...seriesValues, 100000);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: cfg.tooltipBg,
        borderColor: cfg.tooltipBorder,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: params => {
          const item = params[0];
          return `<b>${item.name}</b><br/>总营收: <b style="color:#fbbf24;">$ ${Number(item.value).toLocaleString()}</b>`;
        }
      },
      grid: { top: 15, left: 110, right: 90, bottom: 20 },
      xAxis: {
        type: 'value',
        show: false
      },
      yAxis: {
        type: 'category',
        data: yNames,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: cfg.axisLabel,
          fontSize: 12,
          fontWeight: 600
        }
      },
      series: [
        {
          type: 'bar',
          barWidth: 16,
          data: seriesData,
          label: {
            show: true,
            position: 'right',
            distance: 8,
            color: '#f8fafc',
            fontWeight: 'bold',
            fontSize: 12,
            fontFamily: 'DIN Alternate, monospace',
            formatter: params => `$${Math.round(params.value).toLocaleString()}`
          }
        }
      ]
    };

    this.horizontalRankChart.setOption(option, true);
  }
}

window.dashboardCharts = new DashboardCharts();
