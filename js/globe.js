/**
 * AMS 黑五销售看板 - 3D 科技地球仪组件
 * 还原图一左上角视觉元素：
 * 旋转的深蓝发光地球 + 大气层光晕 + 浮动环绕的各国国旗与航线光点
 */

class CyberGlobe {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rotation = 0;
    this.tilt = 0.28; // 地轴倾斜角度
    this.radius = 62;
    this.centerX = 0;
    this.centerY = 0;

    // 核心出海国家市场光标点 (含经纬度)
    this.markers = [
      { code: 'DE', flag: '🇩🇪', lat: 51.16, lon: 10.45 },
      { code: 'FR', flag: '🇫🇷', lat: 46.22, lon: 2.21 },
      { code: 'UK', flag: '🇬🇧', lat: 55.37, lon: -3.43 },
      { code: 'ES', flag: '🇪🇸', lat: 40.46, lon: -3.74 },
      { code: 'IT', flag: '🇮🇹', lat: 41.87, lon: 12.56 },
      { code: 'US', flag: '🇺🇸', lat: 37.09, lon: -95.71 },
      { code: 'CA', flag: '🇨🇦', lat: 56.13, lon: -106.34 },
      { code: 'BE', flag: '🇧🇪', lat: 50.50, lon: 4.46 },
      { code: 'NL', flag: '🇳🇱', lat: 52.13, lon: 5.29 },
      { code: 'PL', flag: '🇵🇱', lat: 51.91, lon: 19.14 },
      { code: 'PT', flag: '🇵🇹', lat: 39.39, lon: -8.22 },
      { code: 'IE', flag: '🇮🇪', lat: 53.14, lon: -7.69 },
      { code: 'RO', flag: '🇷🇴', lat: 45.94, lon: 24.96 }
    ];

    // 生成球面网格粒子 (经纬度粒子群)
    this.particles = [];
    for (let lat = -80; lat <= 80; lat += 14) {
      const rAtLat = Math.cos((lat * Math.PI) / 180);
      const step = Math.max(12, Math.round(18 / Math.max(0.15, rAtLat)));
      for (let lon = -180; lon < 180; lon += step) {
        this.particles.push({ lat, lon });
      }
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 56;
    const h = rect.height || 56;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.width, this.height) * 0.40;
  }

  /**
   * 3D 球坐标投影转换公式
   */
  project(lat, lon) {
    const phi = (lat * Math.PI) / 180;
    const theta = ((lon + this.rotation) * Math.PI) / 180;

    // 旋转坐标计算
    let x = this.radius * Math.cos(phi) * Math.sin(theta);
    let y = -this.radius * Math.sin(phi);
    let z = this.radius * Math.cos(phi) * Math.cos(theta);

    // 绕 X 轴倾斜 (地轴倾角)
    const cosT = Math.cos(this.tilt);
    const sinT = Math.sin(this.tilt);
    const y2 = y * cosT - z * sinT;
    const z2 = y * sinT + z * cosT;

    return {
      x: this.centerX + x,
      y: this.centerY + y2,
      z: z2,
      visible: z2 > -10
    };
  }

  animate() {
    this.rotation = (this.rotation + 0.5) % 360;
    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 绘制外部大气层光晕 (Cyan & Deep Blue Glow)
    const halo = ctx.createRadialGradient(
      this.centerX, this.centerY, this.radius * 0.7,
      this.centerX, this.centerY, this.radius * 1.35
    );
    halo.addColorStop(0, 'rgba(0, 160, 255, 0.25)');
    halo.addColorStop(0.65, 'rgba(0, 240, 255, 0.12)');
    halo.addColorStop(1, 'rgba(0, 10, 40, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2. 绘制地球实体渐变底色
    const sphereGrad = ctx.createRadialGradient(
      this.centerX - this.radius * 0.35, this.centerY - this.radius * 0.35, this.radius * 0.1,
      this.centerX, this.centerY, this.radius
    );
    sphereGrad.addColorStop(0, '#0f3875');
    sphereGrad.addColorStop(0.4, '#092147');
    sphereGrad.addColorStop(0.85, '#041128');
    sphereGrad.addColorStop(1, '#020713');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 边缘发光边框
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. 绘制背面粒子 (半透明暗色)
    this.particles.forEach(p => {
      const pos = this.project(p.lat, p.lon);
      if (!pos.visible) {
        ctx.fillStyle = 'rgba(0, 140, 220, 0.15)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. 绘制正面经纬网格粒子 (亮青色)
    this.particles.forEach(p => {
      const pos = this.project(p.lat, p.lon);
      if (pos.visible) {
        const alpha = Math.max(0.1, pos.z / this.radius);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. 绘制国家市场浮动国旗与光标点
    const sortedMarkers = this.markers
      .map(m => ({ ...m, pos: this.project(m.lat, m.lon) }))
      .sort((a, b) => a.pos.z - b.pos.z);

    sortedMarkers.forEach(m => {
      const pos = m.pos;
      if (!pos.visible) return;

      const alpha = Math.max(0.25, (pos.z + 10) / (this.radius + 10));
      const scale = 0.75 + (pos.z / this.radius) * 0.35;

      // 脉冲发光核心点
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(scale, scale);

      // 发光外圈
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.4})`;
      ctx.fill();

      // 中心亮白光点
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.fill();

      // 国旗浮动展示 (Emoji 或 代码微标签)
      ctx.font = '12px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(m.flag, 0, -5);

      ctx.restore();
    });
  }
}

window.CyberGlobe = CyberGlobe;
