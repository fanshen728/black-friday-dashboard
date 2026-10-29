/**
 * AMS 销售看板 - 纯净柱状图可视化管理模块 (参考图一)
 * 特色：
 * 1. 严格统一为美元 ($)，左上角标注 Unit: $，右上角标注 ● Actual
 * 2. 霓虹青蓝发光柱体，柱体顶部清晰标注具体数值 (如 215,400, 168,200)
 * 3. 动态自适应店铺市场数量 (支持 1 个市场至 10+ 个市场无缝自适应展示)
 */

class DashboardCharts {
  constructor() {
    this.mainChart = null;
    this.shareChart = null;
    this.quadCharts = {};
    this.currentViewMode = 'all'; // 'all' | 'quad' | 'store'
    this.currentStoreName = 'aosom.eu';
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

    // 动态收集所有店铺涉及到的全部去重市场
    const allMarketSet = new Set();
    data.stores.forEach(s => {
      s.markets.forEach(m => allMarketSet.add(m.marketName));
    });
    const xLabels = Array.from(allMarketSet);

    const series = data.stores.map(store => {
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
            { offset: 0, color: store.color },
            { offset: 1, color: echarts.color.modifyAlpha(store.color, 0.15) }
          ]),
          borderRadius: [4, 4, 0, 0],
          shadowColor: echarts.color.modifyAlpha(store.color, 0.4),
          shadowBlur: 8
        },
        data: seriesData
      };
    });

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 240, 255, 0.08)' } },
        backgroundColor: 'rgba(6, 17, 43, 0.92)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: params => {
          if (!params || !params.length) return '';
          let res = `<div style="font-weight:bold;margin-bottom:6px;color:#00f0ff;border-bottom:1px solid rgba(0,240,255,0.25);padding-bottom:4px;">${params[0].name} 市场销售对比</div>`;
          params.forEach(item => {
            if (item.value > 0) {
              res += `<div style="display:flex;justify-content:space-between;gap:16px;margin:3px 0;">
                <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color.colorStops ? item.color.colorStops[0].color : item.color};margin-right:6px;"></span>${item.seriesName}</span>
                <span style="font-weight:bold;color:#bef2ff;">$ ${Number(item.value).toLocaleString()}</span>
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
        textStyle: { color: '#9bb4d6', fontSize: 12 }
      },
      grid: { top: 50, left: 65, right: 25, bottom: 35 },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: '#1a335a' } },
        axisTick: { show: false },
        axisLabel: { color: '#8da6cb', fontSize: 12, interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Unit: $',
        nameTextStyle: { color: '#6889b5', padding: [0, 0, 0, -30], fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)', type: 'dashed' } },
        axisLabel: {
          color: '#6889b5',
          fontSize: 11,
          formatter: v => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
        }
      },
      series: series
    };

    this.mainChart.setOption(option, true);
  }

  /**
   * 视图二：【单店多市场下钻柱状图】(深度还原图一核心样式)
   * 无论该店铺有 1 个市场还是 10 个市场，均可完美自适应呈现
   */
  renderSingleStoreFocus(data, storeName) {
    if (!this.mainChart) return;
    const store = data.stores.find(s => s.storeName === storeName) || data.stores[0];
    if (!store) return;

    // 按销售额从大到小排序
    const markets = [...store.markets].sort((a, b) => b.sales - a.sales);
    const xData = markets.map(m => m.marketName);
    const yData = markets.map(m => m.sales);

    // 动态柱宽：如果只有 1 个或 2 个市场，适当加宽柱体保证美观
    const dynamicBarWidth = markets.length === 1 ? 58 : markets.length <= 3 ? 42 : 26;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 240, 255, 0.08)' } },
        backgroundColor: 'rgba(6, 17, 43, 0.92)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: params => {
          const item = params[0];
          return `
            <div style="font-weight:bold;margin-bottom:6px;color:#00f0ff;">${store.storeName} - ${item.name} 市场</div>
            <div>销售额: <span style="color:#00ffb4;font-weight:bold;">$ ${Number(item.value).toLocaleString()}</span></div>
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
        textStyle: { color: '#00d2ff', fontSize: 13 }
      },
      grid: { top: 50, left: 65, right: 25, bottom: 35 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#16365f', width: 1.5 } },
        axisTick: { show: false },
        axisLabel: { color: '#8da6cb', fontSize: 13, interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: 'Unit: $',
        nameTextStyle: { color: '#7a9ec9', padding: [0, 0, 0, -30], fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.12)', type: 'solid' } },
        axisLabel: {
          color: '#7a9ec9',
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
            color: '#bef2ff',
            fontSize: 12,
            fontWeight: 'bold',
            formatter: params => Number(params.value).toLocaleString()
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#00f0ff' },
              { offset: 0.6, color: '#0099ff' },
              { offset: 1, color: '#0055ff' }
            ]),
            borderRadius: [4, 4, 0, 0],
            shadowColor: 'rgba(0, 240, 255, 0.55)',
            shadowBlur: 10
          }
        }
      ]
    };

    this.mainChart.setOption(option, true);
  }

  /**
   * 视图三：【2x2 四分屏独立矩阵】
   * 4张独立柱状图同时展示 4 个店铺的详细多市场销售情况
   */
  renderQuadView(data) {
    data.stores.forEach(store => {
      const chart = this.quadCharts[store.storeName];
      if (!chart) return;

      const markets = [...store.markets].sort((a, b) => b.sales - a.sales);
      const xData = markets.map(m => m.marketName);
      const yData = markets.map(m => m.sales);

      const barW = markets.length === 1 ? 36 : markets.length <= 3 ? 24 : 14;

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(6, 17, 43, 0.92)',
          borderColor: store.color,
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
          axisLine: { lineStyle: { color: '#16365f' } },
          axisTick: { show: false },
          axisLabel: { color: '#8da6cb', fontSize: 11, interval: 0 }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
          axisLabel: {
            color: '#6889b5',
            fontSize: 10,
            formatter: v => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
          }
        },
        series: [
          {
            name: '销售额',
            type: 'bar',
            barWidth: barW,
            data: yData,
            label: {
              show: true,
              position: 'top',
              color: '#bef2ff',
              fontSize: 10,
              formatter: params => Number(params.value).toLocaleString()
            },
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: store.color },
                { offset: 1, color: echarts.color.modifyAlpha(store.color, 0.15) }
              ]),
              borderRadius: [3, 3, 0, 0],
              shadowColor: echarts.color.modifyAlpha(store.color, 0.4),
              shadowBlur: 6
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

    const pieData = data.stores.map(store => ({
      name: store.storeName,
      value: store.storeSales,
      itemStyle: {
        color: store.color,
        shadowBlur: 8,
        shadowColor: echarts.color.modifyAlpha(store.color, 0.5)
      }
    }));

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(6, 17, 43, 0.92)',
        borderColor: '#00f0ff',
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
        textStyle: { color: '#9bb4d6', fontSize: 11 }
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
              color: '#bef2ff'
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

window.dashboardCharts = new DashboardCharts();
