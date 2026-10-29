/**
 * AMS 黑五销售看板 - 国家与多市场货币元数据配置
 * 参考需求：支持欧洲及全球多市场货币（EUR, DKK, HUF, CZK, SEK, GBP, USD, CAD 等）
 */

const COUNTRY_MARKETS = {
  DE: { code: 'DE', name: '德国', enName: 'Germany', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇩🇪', color: '#ffcc00' },
  FR: { code: 'FR', name: '法国', enName: 'France', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇫🇷', color: '#0055a5' },
  UK: { code: 'UK', name: '英国', enName: 'United Kingdom', currency: 'GBP', symbol: '£', rateToEur: 1.17, flag: '🇬🇧', color: '#cf142b' },
  ES: { code: 'ES', name: '西班牙', enName: 'Spain', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇪🇸', color: '#c60b1e' },
  IT: { code: 'IT', name: '意大利', enName: 'Italy', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇮🇹', color: '#009246' },
  US: { code: 'US', name: '美国', enName: 'United States', currency: 'USD', symbol: '$', rateToEur: 0.92, flag: '🇺🇸', color: '#3c3b6e' },
  CA: { code: 'CA', name: '加拿大', enName: 'Canada', currency: 'CAD', symbol: 'C$', rateToEur: 0.68, flag: '🇨🇦', color: '#ff0000' },
  BE: { code: 'BE', name: '比利时', enName: 'Belgium', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇧🇪', color: '#fdba12' },
  NL: { code: 'NL', name: '荷兰', enName: 'Netherlands', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇳🇱', color: '#ae1c28' },
  PL: { code: 'PL', name: '波兰', enName: 'Poland', currency: 'PLN', symbol: 'zł', rateToEur: 0.23, flag: '🇵🇱', color: '#dc143c' },
  PT: { code: 'PT', name: '葡萄牙', enName: 'Portugal', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇵🇹', color: '#006600' },
  IE: { code: 'IE', name: '爱尔兰', enName: 'Ireland', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇮🇪', color: '#169b62' },
  AT: { code: 'AT', name: '奥地利', enName: 'Austria', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇦🇹', color: '#ed2939' },
  DK: { code: 'DK', name: '丹麦', enName: 'Denmark', currency: 'DKK', symbol: 'kr', rateToEur: 0.134, flag: '🇩🇰', color: '#c60c30' },
  SE: { code: 'SE', name: '瑞典', enName: 'Sweden', currency: 'SEK', symbol: 'kr', rateToEur: 0.088, flag: '🇸🇪', color: '#006aa7' },
  CZ: { code: 'CZ', name: '捷克', enName: 'Czechia', currency: 'CZK', symbol: 'Kč', rateToEur: 0.040, flag: '🇨🇿', color: '#11457e' },
  HU: { code: 'HU', name: '匈牙利', enName: 'Hungary', currency: 'HUF', symbol: 'Ft', rateToEur: 0.0025, flag: '🇭🇺', color: '#436f4d' },
  RO: { code: 'RO', name: '罗马尼亚', enName: 'Romania', currency: 'RON', symbol: 'lei', rateToEur: 0.20, flag: '🇷🇴', color: '#002b7f' },
  FI: { code: 'FI', name: '芬兰', enName: 'Finland', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇫🇮', color: '#003580' },
  GR: { code: 'GR', name: '希腊', enName: 'Greece', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇬🇷', color: '#0d5eaf' },
  SK: { code: 'SK', name: '斯洛伐克', enName: 'Slovakia', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇸🇰', color: '#0b4ea2' },
  HR: { code: 'HR', name: '克罗地亚', enName: 'Croatia', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇭🇷', color: '#ff0000' },
  SI: { code: 'SI', name: '斯洛文尼亚', enName: 'Slovenia', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇸🇮', color: '#005da4' },
  BG: { code: 'BG', name: '保加利亚', enName: 'Bulgaria', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇧🇬', color: '#00966e' },
  LT: { code: 'LT', name: '立陶宛', enName: 'Lithuania', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇱🇹', color: '#fdb913' },
  LV: { code: 'LV', name: '拉脱维亚', enName: 'Latvia', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇱🇻', color: '#9e3039' },
  EE: { code: 'EE', name: '爱沙尼亚', enName: 'Estonia', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇪🇪', color: '#0072ce' },
  LU: { code: 'LU', name: '卢森堡', enName: 'Luxembourg', currency: 'EUR', symbol: '€', rateToEur: 1.0, flag: '🇱🇺', color: '#00a1de' }
};

/**
 * 4个核心店铺定义与品牌特性配置
 */
const STORE_DEFINITIONS = [
  {
    id: 'aosom_eu',
    key: 'aosom.eu',
    name: 'Aosom Europe',
    domain: 'aosom.eu',
    category: '全品类欧洲旗舰独立站',
    color: '#00f0ff',
    badge: '旗舰',
    markets: ['DE', 'UK', 'FR', 'ES', 'IT', 'PT', 'IE', 'NL', 'PL', 'BE', 'AT', 'RO', 'SE', 'CZ'],
    baseShare: 0.42
  },
  {
    id: 'homcom_fr',
    key: 'homcom.fr',
    name: 'HomCom France',
    domain: 'homcom.fr',
    category: '法国品质家居生活独立站',
    color: '#00e5ff',
    badge: '法国家居',
    markets: ['FR', 'BE', 'LU', 'IT', 'ES'],
    baseShare: 0.23
  },
  {
    id: 'homcomstore',
    key: 'homcomstore',
    name: 'HomCom Store',
    domain: 'homcomstore',
    category: 'HOMCOM 品牌全球站',
    color: '#7000ff',
    badge: '全球品牌',
    markets: ['US', 'CA', 'UK', 'DE', 'ES', 'IT', 'DK', 'SE', 'NL'],
    baseShare: 0.21
  },
  {
    id: 'outsunny_fr',
    key: 'outsunny.fr',
    name: 'Outsunny France',
    domain: 'outsunny.fr',
    category: '法国户外花园与露营独立站',
    color: '#00ff88',
    badge: '法国户外',
    markets: ['FR', 'BE', 'ES', 'IT', 'PT', 'AT'],
    baseShare: 0.14
  }
];

// SVG 精美矢量国旗库 (确保在所有操作系统和浏览器下 100% 清晰渲染)
const SVG_FLAGS = {
  DE: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#ffce00" d="M0 320h640v160H0z"/><path d="M0 0h640v160H0z"/><path fill="#d00" d="M0 160h640v160H0z"/></svg>`,
  FR: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#002654" d="M0 0h213.3v480H0z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>`,
  UK: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z"/><path fill="#C8102E" d="m0 0 260 190h-45L0 35V0zm640 0L380 190h45l215-155V0zM0 480l260-190h-45L0 445v35zm640 0L380 290h45l215 155v35z"/><path fill="#FFF" d="M250 0h140v480H250zM0 170h640v140H0z"/><path fill="#C8102E" d="M275 0h90v480h-90zM0 195h640v90H0z"/></svg>`,
  ES: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#c60b1e" d="M0 0h640v480H0z"/><path fill="#ffc400" d="M0 120h640v240H0z"/></svg>`,
  IT: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#009246" d="M0 0h213.3v480H0z"/><path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/></svg>`,
  US: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 276.9h640M0 350.8h640M0 424.6h640"/><path fill="#192f5d" d="M0 0h260v260H0z"/></svg>`,
  CA: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#f00" d="M0 0h640v480H0z"/><path fill="#fff" d="M160 0h320v480H160z"/><path fill="#f00" d="m320 80 18 48 42-12-14 42 44 14-36 28 20 44-48-10-26 36-26-36-48 10 20-44-36-28 44-14-14-42 42 12z"/></svg>`,
  BE: `<svg class="svg-flag" viewBox="0 0 640 480"><path d="M0 0h213.3v480H0z"/><path fill="#ffd90c" d="M213.3 0h213.4v480H213.3z"/><path fill="#f31830" d="M426.7 0H640v480H426.7z"/></svg>`,
  NL: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#21468b" d="M0 0h640v480H0z"/><path fill="#fff" d="M0 0h640v320H0z"/><path fill="#ae1c28" d="M0 0h640v160H0z"/></svg>`,
  PL: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#dc143c" d="M0 240h640v240H0z"/><path fill="#fff" d="M0 0h640v240H0z"/></svg>`,
  PT: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#ff0000" d="M256 0h384v480H256z"/><path fill="#006600" d="M0 0h256v480H0z"/></svg>`,
  IE: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#169b62" d="M0 0h213.3v480H0z"/><path fill="#ff883e" d="M426.7 0H640v480H426.7z"/></svg>`,
  AT: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#ed2939" d="M0 0h640v480H0z"/><path fill="#fff" d="M0 160h640v160H0z"/></svg>`,
  SE: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#006aa7" d="M0 0h640v480H0z"/><path fill="#fecc00" d="M0 192h640v96H0z"/><path fill="#fecc00" d="M192 0h96v480h-96z"/></svg>`,
  CZ: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#d7141a" d="M0 240h640v240H0z"/><path fill="#fff" d="M0 0h640v240H0z"/><path fill="#11457e" d="m0 0 360 240L0 480z"/></svg>`,
  DK: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#c60c30" d="M0 0h640v480H0z"/><path fill="#fff" d="M176 0h64v480h-64z"/><path fill="#fff" d="M0 208h640v64H0z"/></svg>`,
  HU: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#388d5e" d="M0 320h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#ce2939" d="M0 0h640v160H0z"/></svg>`,
  RO: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/><path fill="#fcd116" d="M213.3 0h213.4v480H213.3z"/><path fill="#002b7f" d="M0 0h213.3v480H0z"/></svg>`,
  LU: `<svg class="svg-flag" viewBox="0 0 640 480"><path fill="#00a1de" d="M0 320h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#ed2939" d="M0 0h640v160H0z"/></svg>`
};

function getFlagHtml(code) {
  if (SVG_FLAGS[code]) return SVG_FLAGS[code];
  const m = getMarketInfo(code);
  return `<span class="flag-fallback" style="background:${m.color}">${code}</span>`;
}

// 辅助工具函数
function getMarketInfo(code) {
  return COUNTRY_MARKETS[code] || {
    code: code,
    name: code,
    enName: code,
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    flag: '🌐',
    color: '#38bdf8'
  };
}

function formatCurrency(amount, currency = 'EUR', decimals = 0) {
  const symbolMap = { EUR: '€', USD: '$', GBP: '£', CAD: 'C$', DKK: 'kr', HUF: 'Ft', CZK: 'Kč', SEK: 'kr', PLN: 'zł', RON: 'lei' };
  const symbol = symbolMap[currency] || '€';
  const val = Number(amount) || 0;
  return `${symbol} ${val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatNumber(num) {
  return (Number(num) || 0).toLocaleString('en-US');
}

window.COUNTRY_MARKETS = COUNTRY_MARKETS;
window.STORE_DEFINITIONS = STORE_DEFINITIONS;
window.getMarketInfo = getMarketInfo;
window.getFlagHtml = getFlagHtml;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;

