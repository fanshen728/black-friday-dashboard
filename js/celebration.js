/**
 * AMS 销售看板 - 突破特效 3D WebGL (Three.js) 豪华电影级引擎
 * 
 * 核心技术与剧情式时间轴：
 * 1. 【Three.js 核心三维空间架构】：
 *    - WebGLRenderer 硬件加速，ACESFilmic 色调映射与 AdditiveBlending 高光辉光
 *    - PerspectiveCamera 电影级运镜推拉 (Dolly In / Orbit Drift)
 * 2. 【阶段 1 (0.0s ~ 1.4s)】：数字由 0 快速机动滚入加进来，粒子流从 3D 纵深空间凝聚入位，伴随科技升调音效
 * 3. 【阶段 2 (1.4s ~ 2.5s)】：整组数字在 3D 空间进行 360 度立体翻转与镜头推进特写，伴随呼啸气浪声
 * 4. 【阶段 3 (2.5s)】：定格震击，向外炸裂真 3D 黄金冲击波环，正上方浮现 "AMS 2026 总销量突破 xxx！"
 * 5. 【阶段 4 (2.6s)】：正下方显现标志性 "Aosom 2026" 钻石/霓虹质感大字 (对齐参考图 1 与图 2)
 * 6. 【阶段 5 (2.5s+)】：真 3D 空间全方位立体烟花雨 (前后左右立体炸裂) + 派对彩灯摇曳 + 金箔星屑漫天飞舞
 * 7. 多档位主题支持：5,000 (喜庆紫粉金霓虹) / 10,000 (璀璨钻石黑金) / 实时战报
 * 
 * 设计原则：KISS, SOLID, DRY, 离线运行, 60FPS+ 硬件加速, 完美释放显存
 */

class MilestoneCelebrationEngine {
  constructor() {
    this.overlay = null;
    this.canvas = null;
    this.isActive = false;

    // Three.js 核心对象
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animFrameId = null;

    // 屏幕尺寸与比例
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 3D 场景对象组
    this.galaxyPoints = null;
    this.digitGroup = null;
    this.shockwaveMesh = null;
    this.fireworkGroup = null;
    this.confettiGroup = null;
    this.particleTexture = null;

    // 粒子与物理数据
    this.digitParticleData = [];
    this.fireworkRockets = [];
    this.fireworkSparks = [];
    this.confettiData = [];

    // 剧情状态机
    this.startTime = 0;
    this.currentTime = 0;
    this.currentTier = '5k';
    this.currentMilestone = null;
    this.autoCloseTimer = null;
    this.hasRevealedTitle = false;

    // 滚动数字状态
    this.rollTargetValue = 5000;
    this.rollCurrentValue = 0;

    // 里程碑触发历史
    this.celebratedMilestones = new Set();
    this.lastProcessedOrders = 0;
    this.lastProcessedSales = 0;

    // 音频合成器
    this.audioCtx = null;

    this.initDOM();
    this.bindEvents();
  }

  /**
   * 初始化 DOM 结构
   */
  initDOM() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        this.initDOM();
        this.bindEvents();
      });
      return;
    }

    let overlay = document.getElementById('milestoneCelebrationOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'milestoneCelebrationOverlay';
      overlay.innerHTML = `
        <canvas id="milestoneCelebrationCanvas"></canvas>
        
        <!-- 节日派对彩灯串 (对齐参考图 1 右上角彩灯) -->
        <div class="celebration-fairy-lights">
          <svg class="fairy-wire-svg" viewBox="0 0 1200 45" preserveAspectRatio="none">
            <path d="M0,8 Q150,38 300,8 T600,8 T900,8 T1200,8" />
          </svg>
          <div class="fairy-bulb bulb-blue"></div>
          <div class="fairy-bulb bulb-pink"></div>
          <div class="fairy-bulb bulb-gold"></div>
          <div class="fairy-bulb bulb-cyan"></div>
          <div class="fairy-bulb bulb-blue"></div>
          <div class="fairy-bulb bulb-gold"></div>
          <div class="fairy-bulb bulb-pink"></div>
          <div class="fairy-bulb bulb-cyan"></div>
        </div>

        <!-- 顶部战报横幅 (阶段 3 震撼浮现) -->
        <div class="celebration-top-banner">
          <div class="celebration-badge-pill">
            <span class="sparkle-icon">✦</span>
            <span id="celebrationBadgeText">AMS 2026 GLOBAL MILESTONE</span>
            <span class="sparkle-icon">✦</span>
          </div>
          <h2 class="celebration-main-title" id="celebrationMainTitle">AMS 2026 总销量突破 5,000！</h2>
          <p class="celebration-subtitle" id="celebrationSubtitle">全球电商黑五作战中心实时战报播报</p>
        </div>

        <!-- 中部粒子数字与 Aosom 2026 字标 (对齐参考图核心构图) -->
        <div class="celebration-center-focus">
          <!-- 3D 数字由 Three.js WebGL 渲染，此处为下方标志性大字标 -->
          <div class="celebration-brand-caption" id="celebrationBrandCaption">Aosom 2026</div>
        </div>

        <!-- 底部数据明细卡片与操作栏 -->
        <div class="celebration-bottom-group">
          <!-- 档位一键切换胶囊条 (5,000 / 10,000 / 实时战报) -->
          <div class="milestone-tier-switcher">
            <button type="button" class="tier-tab-btn tier-gold active" data-tier="5k">
              <span>🎯</span> 5,000 销量特效
            </button>
            <button type="button" class="tier-tab-btn tier-diamond" data-tier="10k">
              <span>💎</span> 10,000 销量特效
            </button>
            <button type="button" class="tier-tab-btn" data-tier="live">
              <span>⚡</span> 实时最新战报
            </button>
          </div>

          <!-- 战报指标板 -->
          <div class="celebration-metrics-board">
            <div class="celebration-metric-item">
              <span class="c-label" id="cLabelRev">全站总营收 (USD)</span>
              <span class="c-val highlight-gold" id="cValRev">$0</span>
            </div>
            <div class="celebration-metric-item">
              <span class="c-label" id="cLabelOrders">全站订单总量</span>
              <span class="c-val highlight-cyan" id="cValOrders">0</span>
            </div>
            <div class="celebration-metric-item">
              <span class="c-label" id="cLabelConv">全店综合转化率</span>
              <span class="c-val" id="cValConv">0.00%</span>
            </div>
            <div class="celebration-metric-item">
              <span class="c-label" id="cLabelTopStore">领跑最高店铺</span>
              <span class="c-val" id="cValTopStore">-</span>
            </div>
          </div>

          <div class="celebration-actions-row">
            <div class="celebration-hint-text">
              <span>按 <kbd>ESC</kbd> 或点击空白处关闭战报</span>
            </div>
            <div class="celebration-btn-group">
              <button type="button" class="celebration-btn celebration-btn-replay" id="celebrationReplayBtn">
                ↻ 重播特效
              </button>
              <button type="button" class="celebration-btn celebration-btn-close" id="celebrationCloseBtn">
                ✕ 关闭战报
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    this.overlay = overlay;
    this.canvas = document.getElementById('milestoneCelebrationCanvas');
  }

  /**
   * 绑定事件监听
   */
  bindEvents() {
    window.addEventListener('resize', () => {
      this.onResize();
    });

    if (!this.overlay) return;

    // 点击空白处关闭
    this.overlay.addEventListener('click', (e) => {
      if (
        e.target.closest('.celebration-bottom-group') ||
        e.target.closest('.celebration-metrics-board') ||
        e.target.closest('.celebration-btn-group') ||
        e.target.closest('.milestone-tier-switcher') ||
        e.target.closest('.celebration-top-banner')
      ) {
        return;
      }
      this.close();
    });

    // 关闭按钮
    document.getElementById('celebrationCloseBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    // 重播按钮
    document.getElementById('celebrationReplayBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.launchTier(this.currentTier);
    });

    // 档位快速切换 (5,000 / 10,000 / 实时)
    const tierTabs = this.overlay.querySelectorAll('.tier-tab-btn');
    tierTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tier = btn.dataset.tier;
        this.launchTier(tier);
      });
    });

    // ESC 键退出
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
      }
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    if (this.camera && this.renderer) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  }

  /**
   * 生成发光圆形精灵纹理 (实现加色光晕与柔和边缘)
   */
  getOrCreateParticleTexture() {
    if (this.particleTexture) return this.particleTexture;

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.22, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.78, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    this.particleTexture = new THREE.CanvasTexture(canvas);
    return this.particleTexture;
  }

  /**
   * 初始化 Three.js WebGL 场景与渲染器
   */
  initThreeScene() {
    if (this.renderer) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. 场景
    this.scene = new THREE.Scene();

    // 2. 摄像机 (透视视角)
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 3000);
    this.camera.position.set(0, 0, 720);

    // 3. WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;

    // 4. 环境光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xfbbf24, 2.5, 900);
    goldPoint.position.set(0, 0, 300);
    this.scene.add(goldPoint);

    // 5. 3D 倾斜星系粒子旋涡
    this.buildGalaxyMesh();

    // 6. 数字粒子组
    this.digitGroup = new THREE.Group();
    this.scene.add(this.digitGroup);

    // 7. 3D 冲击波环网格
    this.buildShockwaveMesh();

    // 8. 烟花与碎片组
    this.fireworkGroup = new THREE.Group();
    this.scene.add(this.fireworkGroup);

    this.confettiGroup = new THREE.Group();
    this.scene.add(this.confettiGroup);
  }

  /**
   * 构建 3D 倾斜星系粒子旋涡 (完全复刻参考图)
   */
  buildGalaxyMesh() {
    const count = 4800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const galaxyData = [];
    const colorV = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const majorRadius = 320 + Math.random() * 280;
      const minorRadius = 45 + Math.pow(Math.random(), 1.4) * 150;
      const baseAngle = Math.random() * Math.PI * 2;
      const tubeAngle = Math.random() * Math.PI * 2;
      const spinSpeed = (0.2 + Math.random() * 0.35) * (Math.random() < 0.1 ? -1 : 1);
      const tubeSpeed = (0.35 + Math.random() * 0.55);

      // 色彩配比：外缘魅紫、玫瑰粉红、核心金黄、青白耀斑
      const rnd = Math.random();
      if (rnd < 0.38) {
        colorV.setRGB(0.66, 0.33, 0.97); // #a855f7
      } else if (rnd < 0.68) {
        colorV.setRGB(0.93, 0.28, 0.60); // #ec4899
      } else if (rnd < 0.88) {
        colorV.setRGB(0.98, 0.75, 0.14); // #fbbf24
      } else {
        colorV.setRGB(0.99, 0.94, 0.54); // #fef08a
      }

      colors[i * 3 + 0] = colorV.r;
      colors[i * 3 + 1] = colorV.g;
      colors[i * 3 + 2] = colorV.b;

      galaxyData.push({
        majorRadius,
        minorRadius,
        baseAngle,
        tubeAngle,
        spinSpeed,
        tubeSpeed
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.2,
      map: this.getOrCreateParticleTexture(),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    this.galaxyPoints = new THREE.Points(geometry, material);
    // 3D 绕 X 轴倾斜 32 度，并向后偏移对齐
    this.galaxyPoints.rotation.x = 0.54;
    this.galaxyPoints.position.set(0, -25, -60);
    this.galaxyData = galaxyData;

    this.scene.add(this.galaxyPoints);
  }

  /**
   * 构建 3D 黄金/冰晶冲击波环
   */
  buildShockwaveMesh() {
    const ringGeo = new THREE.RingGeometry(10, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveMesh.position.set(0, -30, 10);
    this.scene.add(this.shockwaveMesh);
  }

  /**
   * 将文字/数字栅格化为真 3D 空间发光粒子点阵
   */
  buildDigitParticles(text, tier = '5k') {
    // 清空现存数字粒子组
    while (this.digitGroup.children.length > 0) {
      const obj = this.digitGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
      this.digitGroup.remove(obj);
    }
    this.digitParticleData = [];

    const w = 920;
    const h = 260;
    let fontSize = 130;
    if (text.length >= 6) fontSize = 110;
    if (text.length > 8) fontSize = 90;
    if (text.length > 12) fontSize = 72;
    const fontY = h / 2;

    // 采样 3D 纯粒子点阵 (纯粒子特效，清爽通透，不暴光)
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = w;
    offCanvas.height = h;

    offCtx.fillStyle = '#000000';
    offCtx.fillRect(0, 0, w, h);
    offCtx.font = `900 ${fontSize}px "Impact", "Arial Black", -apple-system, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(text, w / 2, fontY);

    const imgData = offCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    // 纯粒子采样步长：密度适中，既饱满连贯又具有清晰点阵星芒感
    const step = text.length >= 6 ? 2.8 : 2.5;

    const pointsList = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
        if (data[idx] > 110) {
          // 目标 3D 坐标 (tx, ty, tz)
          const tx = (x - w / 2) * 1.05;
          const ty = -(y - h / 2) * 1.05 + 40; // 居中偏上，与下方 Aosom 2026 留出优雅空间
          const tz = (Math.random() - 0.5) * 16;

          // 初始凝聚位置：从三维星系深空各角度飞入
          const angle = Math.random() * Math.PI * 2;
          const dist = 400 + Math.random() * 600;
          const sx = tx + Math.cos(angle) * dist;
          const sy = ty + Math.sin(angle) * dist;
          const sz = (Math.random() - 0.5) * 550;

          pointsList.push({
            x: sx,
            y: sy,
            z: sz,
            tx,
            ty,
            tz,
            vx: 0,
            vy: 0,
            vz: 0,
            jitterOffset: Math.random() * Math.PI * 2,
            isDispersing: false
          });
        }
      }
    }

    const count = pointsList.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorV = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = pointsList[i].x;
      positions[i * 3 + 1] = pointsList[i].y;
      positions[i * 3 + 2] = pointsList[i].z;

      // 纯粒子高明度、璀璨亮眼金光/冰钻色系（明显、耀眼、纯粒子星光感）
      if (tier === '10k') {
        const r = Math.random();
        if (r < 0.40) colorV.setHex(0x38bdf8); // 明净电光冰蓝
        else if (r < 0.75) colorV.setHex(0x7dd3fc); // 澄澈亮天蓝
        else if (r < 0.93) colorV.setHex(0xffffff); // 纯净高光钻石白
        else colorV.setHex(0xbae6fd); // 水晶辉光
      } else {
        const r = Math.random();
        if (r < 0.40) colorV.setHex(0xfde047); // 明艳耀眼灿金 (高明度核心)
        else if (r < 0.70) colorV.setHex(0xfef08a); // 晨曦光芒金白 (极大提升亮度)
        else if (r < 0.88) colorV.setHex(0xffffff); // 纯真星芒白金闪烁 (璀璨剔透)
        else colorV.setHex(0xfbbf24); // 纯正暖金光晕
      }

      colors[i * 3 + 0] = colorV.r;
      colors[i * 3 + 1] = colorV.g;
      colors[i * 3 + 2] = colorV.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: tier === '10k' ? 5.2 : 5.8, // 饱满显眼的粒子直径，璀璨夺目
      map: this.getOrCreateParticleTexture(),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const digitMesh = new THREE.Points(geometry, material);
    this.digitGroup.add(digitMesh);
    this.digitParticleData = pointsList;
    this.digitMesh = digitMesh;
  }

  /**
   * 初始化 3D 彩色金箔雪花 (飘落彩纸)
   */
  buildConfetti() {
    while (this.confettiGroup.children.length > 0) {
      const obj = this.confettiGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.confettiGroup.remove(obj);
    }
    this.confettiData = [];

    const count = 90;
    const geo = new THREE.PlaneGeometry(8, 5);
    const colors = [0xf43f5e, 0x38bdf8, 0xfbbf24, 0xa855f7, 0xffffff, 0x2dd4bf];

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(geo, mat);

      const x = (Math.random() - 0.5) * this.width * 0.9;
      const y = 350 + Math.random() * 300;
      const z = (Math.random() - 0.5) * 300;

      mesh.position.set(x, y, z);
      this.confettiGroup.add(mesh);

      this.confettiData.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(1.5 + Math.random() * 2.2),
        rotX: (Math.random() - 0.5) * 0.08,
        rotY: (Math.random() - 0.5) * 0.08,
        rotZ: (Math.random() - 0.5) * 0.08
      });
    }
  }

  /**
   * 启动指定档位突破特效 (5,000 / 10,000 / 实时最新)
   */
  launchTier(tier = '5k') {
    this.currentTier = tier;
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const data = window.dataService ? window.dataService.getData() : null;

    let targetNum = 5000;
    let targetAmountStr = '5,000';
    let titleText = isEn ? 'AMS 2026 TOTAL ORDERS SURPASSED 5,000!' : 'AMS 2026 总销量突破 5,000！';
    let subtitleText = isEn ? 'Aosom 2026 Global Ops Milestone Record' : '全球电商黑五作战中心实时战报播报';

    if (tier === '10k') {
      targetNum = 10000;
      targetAmountStr = '10,000';
      titleText = isEn ? 'AMS 2026 TOTAL ORDERS SURPASSED 10,000!' : 'AMS 2026 总销量突破 10,000！';
    } else if (tier === 'live') {
      if (data && data.amsTotalSales) {
        targetNum = Math.round(data.amsTotalSales);
        targetAmountStr = '$' + targetNum.toLocaleString('en-US');
        titleText = isEn ? `AMS 2026 REVENUE CRACKED ${targetAmountStr} USD!` : `AMS 2026 全店铺总销售额突破 ${targetAmountStr} 美元！`;
      } else {
        targetNum = 26500;
        targetAmountStr = '26,500';
        titleText = isEn ? 'AMS 2026 TOTAL ORDERS SURPASSED 26,500!' : 'AMS 2026 总销量突破 26,500！';
      }
    }

    this.launch({
      tier,
      targetNum,
      amount: targetAmountStr,
      title: titleText,
      subtitle: subtitleText,
      stats: data
    });
  }

  /**
   * 核心启动大招
   */
  launch(config = {}) {
    this.initThreeScene();

    this.currentMilestone = config;
    this.currentTier = config.tier || '5k';
    this.isActive = true;
    this.startTime = performance.now();
    this.hasRevealedTitle = false;

    // 解析目标数值
    const rawAmount = String(config.amount || '5,000');
    const cleanNum = parseInt(rawAmount.replace(/[^0-9]/g, ''), 10) || 5000;
    this.rollTargetValue = cleanNum;
    this.rollCurrentValue = 0;

    // 样式重置
    this.overlay.className = '';
    this.overlay.classList.add('active');
    this.overlay.classList.add(`theme-${this.currentTier}`);

    // 档位按钮激活态
    const tabs = this.overlay.querySelectorAll('.tier-tab-btn');
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tier === this.currentTier);
    });

    // 文本更新
    const mainTitleEl = document.getElementById('celebrationMainTitle');
    const subtitleEl = document.getElementById('celebrationSubtitle');
    const badgeTextEl = document.getElementById('celebrationBadgeText');
    const brandCaptionEl = document.getElementById('celebrationBrandCaption');

    if (mainTitleEl) mainTitleEl.innerText = config.title;
    if (subtitleEl) subtitleEl.innerText = config.subtitle;
    if (badgeTextEl) {
      badgeTextEl.innerText = this.currentTier === '10k' ? '✦ AMS 2026 DIAMOND MILESTONE ✦' : '✦ AMS 2026 REAL-TIME BREAKTHROUGH ✦';
    }
    if (brandCaptionEl) {
      brandCaptionEl.innerText = 'Aosom 2026';
    }

    // 回显看板数据指标
    const stats = config.stats || (window.dataService ? window.dataService.getData() : null);
    if (stats) {
      const cValRev = document.getElementById('cValRev');
      const cValOrders = document.getElementById('cValOrders');
      const cValConv = document.getElementById('cValConv');
      const cValTopStore = document.getElementById('cValTopStore');

      const rev = stats.amsTotalSales || 0;
      const orders = stats.amsTotalOrders || 0;
      const conv = stats.amsConversionRate || stats.amsConversion || 5.32;

      if (cValRev) cValRev.innerText = '$' + rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (cValOrders) cValOrders.innerText = orders.toLocaleString('en-US');
      if (cValConv) cValConv.innerText = (typeof conv === 'number' ? conv : 5.32).toFixed(2) + '%';
      if (cValTopStore) {
        const lead = stats.leadingStore || (stats.stores && stats.stores[0]);
        if (lead) {
          const sSales = lead.sales || lead.storeSales || lead.totalSales || 0;
          cValTopStore.innerText = `${lead.storeName} ($${sSales.toLocaleString('en-US', { maximumFractionDigits: 0 })})`;
        } else {
          cValTopStore.innerText = 'HOMCOM Store ($1,376,124)';
        }
      }
    }

    // 重构 3D 数字粒子点阵
    this.buildDigitParticles(rawAmount, this.currentTier);
    this.buildConfetti();
    this.fireworkRockets = [];
    this.fireworkSparks = [];

    // 重置 3D 摄像机与冲击波
    this.camera.position.set(0, 0, 720);
    this.digitGroup.rotation.set(0, 0, 0);
    this.digitGroup.scale.set(1, 1, 1);
    if (this.shockwaveMesh) {
      this.shockwaveMesh.scale.set(0.1, 0.1, 1);
      this.shockwaveMesh.material.opacity = 0;
    }

    this.playCelebrationSound();

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderLoop();

    // 12秒自动防打扰退出
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
    this.autoCloseTimer = setTimeout(() => {
      if (this.isActive) this.close();
    }, 12000);
  }

  /**
   * 触发阶段 3：旋转结束 -> 冲击波爆发 -> 震撼浮现标题
   */
  triggerGrandReveal() {
    if (this.hasRevealedTitle) return;
    this.hasRevealedTitle = true;

    this.overlay.classList.add('stage-revealed');

    // 3D 冲击波环激活
    if (this.shockwaveMesh) {
      this.shockwaveMesh.scale.set(0.1, 0.1, 1);
      this.shockwaveMesh.material.opacity = 1;
      this.shockwaveMesh.material.color.setHex(this.currentTier === '10k' ? 0x38bdf8 : 0xfbbf24);
    }

    this.playExplosionSound();
    this.playFanfareChord();
    this.scheduleContinuousFireworks();
  }

  /**
   * 优雅退出
   */
  close() {
    if (!this.isActive) return;

    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }

    // 纯数字粒子向全 3D 空间爆散
    this.digitParticleData.forEach(p => {
      p.isDispersing = true;
      const angle = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = 6 + Math.random() * 10;
      p.vx = Math.cos(angle) * Math.cos(phi) * speed;
      p.vy = Math.sin(phi) * speed;
      p.vz = Math.sin(angle) * Math.cos(phi) * speed;
    });

    this.overlay.classList.remove('active');
    this.overlay.classList.remove('stage-revealed');

    setTimeout(() => {
      this.isActive = false;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.renderer) {
        this.renderer.clear();
      }
    }, 450);
  }

  /**
   * 3D 真立体空间烟花发射
   */
  scheduleContinuousFireworks() {
    // 立即多方位立体打出 4 枚高空礼炮
    this.launchFirework(-280, 160, -80);
    this.launchFirework(280, 160, -80);
    this.launchFirework(-140, 220, 40);
    this.launchFirework(140, 220, 40);

    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }
      const tx = (Math.random() - 0.5) * 650;
      const ty = 100 + Math.random() * 220;
      const tz = (Math.random() - 0.5) * 350;
      this.launchFirework(tx, ty, tz);
    }, 550);
  }

  launchFirework(targetX, targetY, targetZ) {
    const startX = targetX + (Math.random() - 0.5) * 120;
    const startY = -400;
    const startZ = targetZ + (Math.random() - 0.5) * 120;

    let palette;
    if (this.currentTier === '10k') {
      palette = [0xffffff, 0xbae6fd, 0x38bdf8, 0xfbbf24];
    } else {
      palette = [0xfbbf24, 0xf59e0b, 0xec4899, 0xf43f5e, 0xa855f7];
    }

    this.fireworkRockets.push({
      x: startX,
      y: startY,
      z: startZ,
      targetX,
      targetY,
      targetZ,
      speed: 15 + Math.random() * 4,
      palette
    });

    this.playRocketSound();
  }

  explodeFirework(x, y, z, palette) {
    const sparkCount = 85 + Math.floor(Math.random() * 45);
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 3 + Math.random() * 7.5;

      const colorHex = palette[Math.floor(Math.random() * palette.length)];

      this.fireworkSparks.push({
        x,
        y,
        z,
        vx: speed * Math.sin(phi) * Math.cos(theta),
        vy: speed * Math.sin(phi) * Math.sin(theta),
        vz: speed * Math.cos(phi),
        gravity: 0.06,
        friction: 0.965,
        alpha: 1,
        decay: 0.013 + Math.random() * 0.016,
        colorHex
      });
    }

    this.playExplosionSound();
  }

  /**
   * 原生 Web Audio API 音频合成
   */
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playCelebrationSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 + i * 90, now + i * 0.12);
        gain.gain.setValueAtTime(0.04, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.1);
      }
    } catch (e) {}
  }

  playFanfareChord() {
    try {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.8);
      });
    } catch (e) {}
  }

  playRocketSound() {
    try {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.32);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playExplosionSound() {
    try {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.42);
    } catch (e) {}
  }

  /**
   * Three.js 核心 60FPS 渲染大循环
   */
  renderLoop() {
    if (!this.isActive || !this.renderer) return;

    this.currentTime = (performance.now() - this.startTime) / 1000;
    const t = this.currentTime;

    // 阶段 3 自动触发器：2.5秒定格并震撼揭晓
    if (t >= 2.5 && !this.hasRevealedTitle) {
      this.triggerGrandReveal();
    }

    // 1. 更新 3D 星系粒子旋涡
    this.update3DGalaxy(t);

    // 2. 更新 3D 数字粒子 (滚入 + 3D 旋转翻转 + 镜头推拉)
    this.updateStagedDigitParticles(t);

    // 3. 更新 3D 冲击波环
    this.updateShockwave();

    // 4. 更新 3D 空间立体烟花
    this.updateFireworks();

    // 5. 更新 3D 飘落金箔
    this.updateConfetti();

    // 6. 执行 WebGL 渲染
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  /**
   * 更新 3D 星系粒子旋涡
   */
  update3DGalaxy(t) {
    if (!this.galaxyPoints || !this.galaxyData) return;

    const positions = this.galaxyPoints.geometry.attributes.position.array;
    const count = this.galaxyData.length;

    for (let i = 0; i < count; i++) {
      const p = this.galaxyData[i];
      const angle = p.baseAngle + p.spinSpeed * t * 0.7;
      const tubeAngle = p.tubeAngle + p.tubeSpeed * t;

      const R = p.majorRadius;
      const r = p.minorRadius * (1 + 0.12 * Math.sin(t * 1.8 + i * 0.1));

      // 环面 3D 参数方程
      positions[i * 3 + 0] = (R + r * Math.cos(tubeAngle)) * Math.cos(angle);
      positions[i * 3 + 1] = (R + r * Math.cos(tubeAngle)) * Math.sin(angle);
      positions[i * 3 + 2] = r * Math.sin(tubeAngle);
    }

    this.galaxyPoints.geometry.attributes.position.needsUpdate = !0;
    this.galaxyPoints.rotation.z += 0.0015;
  }

  /**
   * 更新 3D 剧情数字点阵与电影级摄像机推拉
   */
  updateStagedDigitParticles(t) {
    if (!this.digitMesh || !this.digitParticleData.length) return;

    const positions = this.digitMesh.geometry.attributes.position.array;
    const count = this.digitParticleData.length;

    let spinAngleY = 0;
    let spinAngleX = 0;
    let scaleVal = 1.0;

    if (t < 1.4) {
      // 【阶段 1】：数字从 0 滚入加进来 (0.0s - 1.4s)
      const progress = Math.min(1, t / 1.3);
      scaleVal = 0.82 + progress * 0.18;
      // 摄像机镜头缓缓推近
      this.camera.position.z = 740 - progress * 40;
    } else if (t >= 1.4 && t < 2.5) {
      // 【阶段 2】：整个数字在 3D 空间翻转 360 度 (1.4s - 2.5s)
      const spinProgress = (t - 1.4) / 1.1; // 0 -> 1

      // 围绕 Y 轴完成 360 度 (2*PI) 旋转翻转
      spinAngleY = Math.sin(spinProgress * Math.PI / 2) * Math.PI * 2;
      spinAngleX = Math.sin(spinProgress * Math.PI) * 0.35;

      // 摄像机特写推近到 Z=620，震撼感拉满！
      this.camera.position.z = 700 - Math.sin(spinProgress * Math.PI) * 90;
      scaleVal = 1.0 + Math.sin(spinProgress * Math.PI) * 0.18;
    } else {
      // 【阶段 3 & 4】：定格与微幅呼吸悬浮
      spinAngleY = 0;
      spinAngleX = 0;
      scaleVal = 1.0;
      this.camera.position.z = 710;
    }

    // 应用 3D 群组空间旋转
    this.digitGroup.rotation.y = spinAngleY;
    this.digitGroup.rotation.x = spinAngleX;
    this.digitGroup.scale.set(scaleVal, scaleVal, scaleVal);

    for (let i = 0; i < count; i++) {
      const p = this.digitParticleData[i];

      if (!p.isDispersing) {
        // 弹簧阻尼飞入
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dz = p.tz - p.z;

        p.vx += dx * 0.088;
        p.vy += dy * 0.088;
        p.vz += dz * 0.088;

        p.vx *= 0.81;
        p.vy *= 0.81;
        p.vz *= 0.81;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // 微幅呼吸
        const jitterX = Math.sin(t * 3.5 + p.jitterOffset) * 1.5;
        const jitterY = Math.cos(t * 2.8 + p.jitterOffset) * 1.5;

        positions[i * 3 + 0] = p.x + jitterX;
        positions[i * 3 + 1] = p.y + jitterY;
        positions[i * 3 + 2] = p.z;
      } else {
        // 爆散
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.06; // 3D 重力下坠
        p.vx *= 0.98;
        p.vz *= 0.98;

        positions[i * 3 + 0] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      }
    }

    this.digitMesh.geometry.attributes.position.needsUpdate = !0;
  }

  /**
   * 更新 3D 冲击波环
   */
  updateShockwave() {
    if (!this.shockwaveMesh || this.shockwaveMesh.material.opacity <= 0.01) return;

    this.shockwaveMesh.scale.x += 18;
    this.shockwaveMesh.scale.y += 18;
    this.shockwaveMesh.material.opacity *= 0.93;

    if (this.shockwaveMesh.material.opacity < 0.02) {
      this.shockwaveMesh.material.opacity = 0;
    }
  }

  /**
   * 更新 3D 空间立体烟花
   */
  updateFireworks() {
    // 1. 更新发射火箭
    for (let i = this.fireworkRockets.length - 1; i >= 0; i--) {
      const r = this.fireworkRockets[i];
      const dx = r.targetX - r.x;
      const dy = r.targetY - r.y;
      const dz = r.targetZ - r.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < r.speed || r.y >= r.targetY) {
        this.explodeFirework(r.targetX, r.targetY, r.targetZ, r.palette);
        this.fireworkRockets.splice(i, 1);
        continue;
      }

      r.x += (dx / dist) * r.speed;
      r.y += (dy / dist) * r.speed;
      r.z += (dz / dist) * r.speed;
    }

    // 2. 更新爆裂火花
    while (this.fireworkGroup.children.length > 0) {
      const obj = this.fireworkGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.fireworkGroup.remove(obj);
    }

    const liveSparks = [];
    for (let i = 0; i < this.fireworkSparks.length; i++) {
      const s = this.fireworkSparks[i];
      s.vx *= s.friction;
      s.vy *= s.friction;
      s.vz *= s.friction;
      s.vy -= s.gravity; // 3D 重力下落

      s.x += s.vx;
      s.y += s.vy;
      s.z += s.vz;
      s.alpha -= s.decay;

      if (s.alpha > 0.02) {
        liveSparks.push(s);
      }
    }
    this.fireworkSparks = liveSparks;

    if (liveSparks.length > 0) {
      const count = liveSparks.length;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const colorV = new THREE.Color();

      for (let i = 0; i < count; i++) {
        const s = liveSparks[i];
        positions[i * 3 + 0] = s.x;
        positions[i * 3 + 1] = s.y;
        positions[i * 3 + 2] = s.z;

        colorV.setHex(s.colorHex);
        colors[i * 3 + 0] = colorV.r * s.alpha;
        colors[i * 3 + 1] = colorV.g * s.alpha;
        colors[i * 3 + 2] = colorV.b * s.alpha;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 3.8,
        map: this.getOrCreateParticleTexture(),
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });

      const sparkPoints = new THREE.Points(geo, mat);
      this.fireworkGroup.add(sparkPoints);
    }
  }

  /**
   * 更新 3D 金箔雪花
   */
  updateConfetti() {
    if (this.currentTime < 1.4) return;

    for (let i = 0; i < this.confettiData.length; i++) {
      const c = this.confettiData[i];
      const m = c.mesh;

      m.position.y += c.vy;
      m.position.x += c.vx + Math.sin(this.currentTime * 2 + i) * 0.8;
      m.rotation.x += c.rotX;
      m.rotation.y += c.rotY;
      m.rotation.z += c.rotZ;

      if (m.position.y < -380) {
        m.position.y = 350 + Math.random() * 80;
        m.position.x = (Math.random() - 0.5) * this.width * 0.9;
      }
    }
  }

  /**
   * 自动数据阈值监听
   */
  checkMilestones(data) {
    if (!data) return;
    const orders = data.amsTotalOrders || 0;

    if (orders >= 5000 && !this.celebratedMilestones.has('tier_5k')) {
      this.celebratedMilestones.add('tier_5k');
      if (this.lastProcessedOrders > 0) {
        this.launchTier('5k');
      }
    }

    if (orders >= 10000 && !this.celebratedMilestones.has('tier_10k')) {
      this.celebratedMilestones.add('tier_10k');
      if (this.lastProcessedOrders > 0) {
        this.launchTier('10k');
      }
    }

    this.lastProcessedOrders = orders;
  }
}

// 全局单例实例化
window.celebrationEngine = new MilestoneCelebrationEngine();

/**
 * 快捷全局 API
 */
window.celebrateMilestone = function(options) {
  if (window.celebrationEngine) {
    window.celebrationEngine.launch(options);
  }
};

window.closeMilestoneCelebration = function() {
  if (window.celebrationEngine) {
    window.celebrationEngine.close();
  }
};

/**
 * 演示触发器 (支持 '5k' / '10k' / 'live' 或自定义金额)
 */
window.triggerMilestoneFx = function(tierOrAmount = '5k') {
  if (!window.celebrationEngine) return;

  if (tierOrAmount === '5k' || tierOrAmount === '10k' || tierOrAmount === 'live') {
    window.celebrationEngine.launchTier(tierOrAmount);
  } else {
    const num = parseInt(String(tierOrAmount).replace(/[^0-9]/g, ''), 10) || 5000;
    const assignedTier = num >= 10000 ? '10k' : '5k';
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    const cleanAmount = String(tierOrAmount);

    window.celebrationEngine.launch({
      tier: assignedTier,
      amount: cleanAmount,
      title: isEn ? `AMS 2026 TOTAL SALES SURPASSED ${cleanAmount}!` : `AMS 2026 总销量突破 ${cleanAmount}！`,
      subtitle: isEn ? 'Aosom 2026 Global Ops Milestone Record' : '全球电商黑五作战中心实时战报播报',
      stats: window.dataService ? window.dataService.getData() : null
    });
  }
};
