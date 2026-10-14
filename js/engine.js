/* ==========================================================================
   js/engine.js - Core Game Engine & Tamer-Pet Mechanics
   주인공 컨트롤, 펫 추종 물리, 자동 스킬 발사, 펫 전직 및 레벨업 시스템
   ========================================================================== */

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;        // 전체 오디오 마스터 온/오프
    this.sfxEnabled = true;     // 효과음 온/오프
    this.bgmEnabled = false;    // BGM은 기본 무음(원할 때 ON)으로 설정하여 쾌적함 극대화
    this.bgmInterval = null;
    this.bgmStep = 0;

    // 🛡️ 효과음 스팸 방지 쿨타임 타이머 (피로도 방지)
    this.lastShoot = 0;
    this.lastHit = 0;
    this.lastSlash = 0;
    this.lastGem = 0;
    this.lastExplosion = 0;

    this.gemCombo = 0;
    this.lastGemComboTime = 0;
  }

  init() {
    if (!this.ctx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      } catch(e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.enabled && this.bgmEnabled && !this.bgmInterval) {
      this.startBgm();
    }
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBgm();
    } else {
      this.init();
      if (this.bgmEnabled) this.startBgm();
    }
    return this.enabled;
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.init();
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  // ⚔️ 검사 참격/베기 (부드러운 칼바람 스윙음)
  playSlash() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSlash < 110) return; // 최소 110ms 간격
    this.lastSlash = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

      gain.gain.setValueAtTime(0.055, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch(e) {}
  }

  // 🏹 원거리 발사/투사체 (귀가 편안한 미세 팝/퓩)
  playShoot() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastShoot < 90) return; // 난사 시에도 소리가 뭉개지지 않도록 90ms 쿨타임
    this.lastShoot = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(105, now + 0.04);

      gain.gain.setValueAtTime(0.032, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch(e) {}
  }

  // 💥 타격음 (귀에 자극적인 톱니파 제거 -> 묵직하고 은은한 아케이드 떱!)
  playHit() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHit < 80) return; // 다단 히트 시 귀 피로 방지
    this.lastHit = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // 순수한 사인파 저음 타격 (전자 버저음 0%)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.055);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch(e) {}
  }

  // ✨ 경험치 보석 획득 (청량하고 은은한 펜타토닉 실로폰 하프)
  playGem() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastGem < 65) return;
    this.lastGem = nowMs;

    // 연속 획득 시 도-레-미-솔-라 아름답게 상승
    if (nowMs - this.lastGemComboTime > 500) {
      this.gemCombo = 0;
    }
    this.lastGemComboTime = nowMs;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    const f = notes[this.gemCombo % notes.length];
    this.gemCombo++;

    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.042, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch(e) {}
  }

  // 🎺 레벨업 축하 팡파레 (부드러운 실로폰 4화음)
  playLevelUp() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.075);
        gain.gain.setValueAtTime(0.06, now + idx * 0.075);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.075 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.075);
        osc.stop(now + idx * 0.075 + 0.13);
      });
    } catch(e) {}
  }

  // 💣 폭발음 (저주파 로우패스 필터링 쿵!)
  playExplosion() {
    if (!this.sfxEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastExplosion < 130) return;
    this.lastExplosion = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(22, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch(e) {}
  }

  // 👑 궁극기 발동음 (부드러운 중저음 울림)
  playUltimate() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch(e) {}
  }

  // 🔘 UI 클릭음
  playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch(e) {}
  }

  // 🎵 로우패스 필터 적용 따뜻한 레트로 배경음악 (아주 은은한 볼륨 0.02)
  startBgm() {
    if (!this.enabled || !this.bgmEnabled || this.bgmInterval) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // 따뜻한 분위기의 멜로디
    const melody = [
      523.25, 523.25, 587.33, 659.25, 659.25, 587.33, 523.25, 493.88,
      440.00, 440.00, 523.25, 659.25, 587.33, 587.33, 523.25, 587.33,
      659.25, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25,
      587.33, 659.25, 587.33, 493.88, 523.25, 523.25, 0, 0
    ];
    const bass = [
      130.81, 130.81, 146.83, 164.81, 164.81, 146.83, 130.81, 123.47,
      110.00, 110.00, 130.81, 164.81, 146.83, 146.83, 130.81, 146.83,
      164.81, 164.81, 196.00, 220.00, 196.00, 164.81, 146.83, 130.81,
      146.83, 164.81, 146.83, 123.47, 130.81, 130.81, 130.81, 0
    ];

    const stepMs = 220;
    this.bgmInterval = setInterval(() => {
      if (!this.enabled || !this.bgmEnabled) {
        this.stopBgm();
        return;
      }
      const c = this.ensureContext();
      if (!c || c.state !== 'running') return;

      const step = this.bgmStep % melody.length;
      const mFreq = melody[step];
      const bFreq = bass[step];
      const now = c.currentTime;

      // 1. 리드 멜로디 (로우패스 필터로 부드럽게 감싼 칩튠)
      if (mFreq > 0) {
        try {
          const oscM = c.createOscillator();
          const gainM = c.createGain();
          const filterM = c.createBiquadFilter();
          filterM.type = 'lowpass';
          filterM.frequency.setValueAtTime(700, now);

          oscM.type = 'square';
          oscM.frequency.setValueAtTime(mFreq, now);
          gainM.gain.setValueAtTime(0.018, now);
          gainM.gain.linearRampToValueAtTime(0.001, now + 0.17);

          oscM.connect(gainM);
          gainM.connect(filterM);
          filterM.connect(c.destination);

          oscM.start(now);
          oscM.stop(now + 0.18);
        } catch(e) {}
      }

      // 2. 베이스라인
      if (bFreq > 0) {
        try {
          const oscB = c.createOscillator();
          const gainB = c.createGain();
          oscB.type = 'triangle';
          oscB.frequency.setValueAtTime(bFreq, now);
          gainB.gain.setValueAtTime(0.026, now);
          gainB.gain.linearRampToValueAtTime(0.001, now + 0.18);

          oscB.connect(gainB);
          gainB.connect(c.destination);

          oscB.start(now);
          oscB.stop(now + 0.19);
        } catch(e) {}
      }

      this.bgmStep++;
    }, stepMs);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new GameRenderer(canvas);
    this.audio = new RetroAudio();

    this.isPaused = false;
    this.gameTime = 0;
    this.killCount = 0;
    this.currentLvl = 1;
    this.currentExp = 0;
    this.neededExp = 10;

    // Entities
    this.player = null;
    this.pet = null;
    this.enemies = [];
    this.projectiles = [];
    this.lightningBolts = [];
    this.breathEffects = [];
    this.gems = [];
    this.damageNumbers = [];
    this.particles = [];
    this.shockwaves = [];        // 화려한 원형 충격파 링 목록
    this.slashEffects = [];      // ⚔️ 검사 근접 검기 참격 호 궤적 목록
    this.screenShakeIntensity = 0; // 화면 흔들림 강도
    this.screenShakeDuration = 0;  // 화면 흔들림 지속시간
    this.cinematicDimming = 0;     // 궁극기 발동 시 배경 순간 암전

    // Inputs
    this.keys = {};
    this.mouse = { isDown: false, x: 0, y: 0 };
    this.joystick = { active: false, vx: 0, vy: 0 };
    this.spawnTimer = 0;

    // Ultimate skill state
    this.ultimateTimer = 0;
    this.ultimateMaxCd = 12;
    this.ultimateDuration = 0;

    this.bindEvents();
  }

  // 📳 화면 흔들림 효과 (Screen Shake)
  shakeScreen(intensity = 8, duration = 0.25) {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
  }

  // 💫 퍼져나가는 원형 충격파 링 (Shockwave Ring)
  addShockwave(x, y, maxRadius = 80, color = '#facc15', duration = 0.35) {
    this.shockwaves.push({
      x, y,
      radius: 5,
      maxRadius,
      color,
      life: duration,
      maxLife: duration
    });
  }

  // ⛰️ 지형 통행 가능 여부 판정 (산지 mountain, 물 water 진입 차단)
  isPassable(x, y, radius = 14) {
    const worldW = (GAME_DATA.world && GAME_DATA.world.width) || 16000;
    const worldH = (GAME_DATA.world && GAME_DATA.world.height) || 16000;

    // 1. 월드 외곽 경계 체크 (자연 대양 외곽)
    if (x < radius + 60 || x > worldW - radius - 60 || y < radius + 60 || y > worldH - radius - 60) {
      return false;
    }

    if (!GAME_DATA.world || typeof GAME_DATA.world.getTileType !== 'function') {
      return true;
    }

    // 2. 캐릭터 중심 및 원형 경계점 8방위 샘플링
    const pts = [
      { x, y },
      { x: x + radius, y },
      { x: x - radius, y },
      { x, y: y + radius },
      { x, y: y - radius },
      { x: x + radius * 0.707, y: y + radius * 0.707 },
      { x: x - radius * 0.707, y: y + radius * 0.707 },
      { x: x + radius * 0.707, y: y - radius * 0.707 },
      { x: x - radius * 0.707, y: y - radius * 0.707 }
    ];

    for (let i = 0; i < pts.length; i++) {
      const tile = GAME_DATA.world.getTileType(pts[i].x, pts[i].y);
      // ⛰️ 산지 지형('mountain')과 🌊 물 지형('water')은 캐릭터 및 몹 모두 진입 불가!
      if (tile === 'mountain' || tile === 'water') {
        return false;
      }
    }
    return true;
  }

  // 👁️ 두 지점 사이 직선 통행 가능 여부(물이나 산맥 등 가로막힘 없음) 검사
  hasLineOfSight(x1, y1, x2, y2, stepSize = 32) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist <= stepSize) return true;
    const steps = Math.min(16, Math.max(2, Math.floor(dist / stepSize)));
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    for (let i = 1; i < steps; i++) {
      if (!this.isPassable(x1 + dx * i, y1 + dy * i, 12)) {
        return false;
      }
    }
    return true;
  }

  // 👑 3대 직업군 (소환사 / 검사 / 궁수) 및 9대 세부 특화 시작
  start(classOrPetId = 'summoner', subclassId = 'ignis', combatStyle = 'ranged') {
    this.audio.init();
    let heroClass = 'summoner';
    let subclass = subclassId;
    let subclassDef = null;

    if (GAME_DATA.classes && GAME_DATA.classes[classOrPetId]) {
      heroClass = classOrPetId;
      subclassDef = GAME_DATA.classes[heroClass].subclasses[subclassId] || Object.values(GAME_DATA.classes[heroClass].subclasses)[0];
      subclass = subclassDef.id;
    } else if (GAME_DATA.pets && GAME_DATA.pets[classOrPetId]) {
      heroClass = 'summoner';
      subclass = classOrPetId;
      subclassDef = (GAME_DATA.classes && GAME_DATA.classes.summoner.subclasses[subclass]) || GAME_DATA.pets[subclass];
    } else {
      heroClass = 'summoner';
      subclass = 'ignis';
      subclassDef = GAME_DATA.classes.summoner.subclasses.ignis;
    }

    const petConfig = GAME_DATA.pets[subclass] || subclassDef;
    const styleConfig = (petConfig.styles && petConfig.styles[combatStyle]) || subclassDef || petConfig;
    const worldW = (GAME_DATA.world && GAME_DATA.world.width) || 16000;
    const worldH = (GAME_DATA.world && GAME_DATA.world.height) || 16000;

    // 1. 플레이어 본체 초기화 (직업별 체력, 이속, 대미지 감소율 차별화)
    this.player = {
      heroClass: heroClass,
      subclass: subclass,
      subclassDef: subclassDef,
      x: worldW / 2,
      y: worldH / 2,
      hp: heroClass === 'warrior' ? 140 : 100,
      maxHp: heroClass === 'warrior' ? 140 : 100,
      speed: heroClass === 'archer' ? 3.6 : (heroClass === 'warrior' ? 3.1 : 3.2),
      facing: 1,
      isInvincible: false,
      shieldTimer: 0,
      dmgReduction: heroClass === 'warrior' ? 0.15 : 0,
      shieldBarrier: 0,
      shieldCooldown: 0,
      equipments: { weapon: null, armor: null, shield: null }
    };

    // 2. 소환수 및 전투 스피릿(Combat Arsenal) 초기화
    this.pet = {
      config: petConfig,
      combatStyle: combatStyle,
      styleConfig: styleConfig,
      x: worldW / 2 - 28,
      y: worldH / 2,
      vx: 0,
      vy: 0,
      facing: 1,
      level: 1,
      tier: 1,
      isEvolved: false,
      might: subclassDef.baseDamageMul || styleConfig.baseDamageMul || petConfig.baseDamageMul || 1.0,
      cooldownRed: subclassDef.baseCooldownRed || styleConfig.baseCooldownRed || petConfig.baseCooldownRed || 0,
      magnetRange: 75 + (styleConfig.baseMagnetBonus || petConfig.baseMagnetBonus || 0),
      skills: {},
      passives: {}
    };

    // 기본 스킬 장착
    const startSkill = subclassDef.startingSkill || styleConfig.startingSkill || petConfig.startingSkill || 'fireball';
    this.pet.skills[startSkill] = { level: 1, timer: 0 };

    this.gameTime = 0;
    this.killCount = 0;
    this.currentLvl = 1;
    this.currentExp = 0;
    this.neededExp = 10;
    this.enemies = [];
    this.chests = [];
    this.projectiles = [];
    this.lightningBolts = [];
    this.breathEffects = [];
    this.gems = [];
    this.damageNumbers = [];
    this.particles = [];
    this.shockwaves = [];
    this.screenShakeIntensity = 0;
    this.screenShakeDuration = 0;
    this.cinematicDimming = 0;
    this.peers = {};
    this.spawnedBosses = new Set();
    this.isPaused = false;
    this.timeScale = 1.0;
    this.autoPlay = false;
    this.aiTeammatesEnabled = true;

    // AI 동료 파티 초기화
    this.initAiTeammates();

    // 직업/특화별 고유 필살기 초기화
    const ult = subclassDef.ultimate || styleConfig.ultimate || petConfig.ultimate;
    this.ultimateMaxCd = ult ? ult.cooldown : 12;
    this.ultimateTimer = this.ultimateMaxCd;
    this.ultimateDuration = 0;

    this.updateHUD();
    this.updateUltimateUI();
  }

  // 💥 9종 궁극기 시네마틱 발동 및 화면 연출
  triggerUltimate() {
    if (!this.pet || !this.player || this.isPaused) return;
    if (this.ultimateTimer < this.ultimateMaxCd) return;

    const ult = (this.player.subclassDef && this.player.subclassDef.ultimate) ||
                (this.pet.styleConfig && this.pet.styleConfig.ultimate) ||
                this.pet.config.ultimate;
    if (!ult) return;

    this.ultimateTimer = 0;
    this.audio.playExplosion();

    // 📳 화려한 화면 흔들림 + 시네마틱 암전 + 충격파 링 방출
    this.shakeScreen(15, 0.45);
    this.cinematicDimming = 0.55;
    this.addShockwave(this.player.x, this.player.y, 240, this.player.subclassDef ? this.player.subclassDef.color : '#facc15', 0.45);

    // [1] 지옥불 대폭발 (소환사 이그니스)
    if (ult.id === 'hellfire_burst') {
      this.enemies.forEach(e => e.takeDamage(ult.damage || 150));
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 320;
        this.particles.push({
          x: this.player.x + Math.cos(a) * d,
          y: this.player.y + Math.sin(a) * d,
          color: '#ef4444',
          life: 0.55, maxLife: 0.55, size: 7
        });
      }
    }

    // [2] 전광석화 돌격 (소환사 볼트)
    else if (ult.id === 'thunder_dash') {
      this.ultimateDuration = ult.duration || 2.5;
      this.player.isInvincible = true;
      this.player.speed = 3.2 * (ult.speedMul || 2.2);
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 220) {
          e.takeDamage(ult.damage || 60);
        }
      });
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 80,
          y: this.player.y + (Math.random() - 0.5) * 80,
          color: '#38bdf8',
          life: 0.4, maxLife: 0.4, size: 6
        });
      }
    }

    // [3] 세계수의 만개 (소환사 실피드)
    else if (ult.id === 'divine_bloom' || ult.id === 'divine_barrier') {
      this.ultimateDuration = 3.0;
      this.player.isInvincible = true;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (ult.heal || 45));
      this.updateHpBar();
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 240) {
          const ang = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          e.x += Math.cos(ang) * 75;
          e.y += Math.sin(ang) * 75;
          e.takeDamage(ult.damage || 80);
        }
      });
    }

    // [4] 피의 폭주 (검사: 광전사)
    else if (ult.id === 'bloodlust') {
      this.ultimateDuration = 5.0;
      this.player.isInvincible = true;
      this.player.speed = 3.2 * 1.5;
      this.addShockwave(this.player.x, this.player.y, 260, '#dc2626', 0.5);
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 220) {
          e.takeDamage(ult.damage || 180);
        }
      });
      for (let i = 0; i < 35; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 200;
        this.particles.push({
          x: this.player.x + Math.cos(a) * d,
          y: this.player.y + Math.sin(a) * d,
          color: '#ef4444',
          life: 0.6, maxLife: 0.6, size: 8
        });
      }
    }

    // [5] 아이기스의 성역 (검사: 성기사)
    else if (ult.id === 'aegis_fortress') {
      this.ultimateDuration = 3.5;
      this.player.isInvincible = true;
      this.player.shieldBarrier = 3;
      this.addShockwave(this.player.x, this.player.y, 280, '#facc15', 0.6);
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 250) {
          const ang = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          e.x += Math.cos(ang) * 80;
          e.y += Math.sin(ang) * 80;
          e.takeDamage(ult.damage || 120);
        }
      });
    }

    // [6] 마검 폭풍 (검사: 마검사)
    else if (ult.id === 'elemental_storm') {
      this.addShockwave(this.player.x, this.player.y, 240, '#a855f7', 0.5);
      for (let i = 0; i < 16; i++) {
        const ang = (Math.PI * 2 / 16) * i;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y,
          Math.cos(ang) * 11, Math.sin(ang) * 11,
          ult.damage || 160, 5, 'rune_blade'
        ));
      }
    }

    // [7] 궤도 포격 저격 (궁수: 스나이퍼)
    else if (ult.id === 'orbital_snipe') {
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const ang = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      this.shakeScreen(18, 0.5);
      this.addShockwave(this.player.x, this.player.y, 180, '#06b6d4', 0.4);
      this.projectiles.push(new EngineProjectile(
        this.player.x, this.player.y,
        Math.cos(ang) * 24, Math.sin(ang) * 24,
        ult.damage || 220, 999, 'sniper_beam'
      ));
    }

    // [8] 천공의 화살비 (궁수: 윈드러너)
    else if (ult.id === 'arrow_rain_nova') {
      this.shakeScreen(12, 0.4);
      for (let i = 0; i < 36; i++) {
        setTimeout(() => {
          if (!this.player) return;
          const rx = this.player.x + (Math.random() - 0.5) * 600;
          const ry = this.player.y + (Math.random() - 0.5) * 600;
          this.addShockwave(rx, ry, 65, '#10b981', 0.25);
          this.enemies.forEach(e => {
            if (Math.hypot(e.x - rx, e.y - ry) < 65) {
              e.takeDamage(35);
            }
          });
        }, i * 25);
      }
    }

    // [9] 야수 대군단 쇄도 (궁수: 트래퍼)
    else if (ult.id === 'beast_stampede') {
      this.shakeScreen(12, 0.4);
      for (let i = 0; i < 8; i++) {
        const ang = (this.player.facing === 1 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.8;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y + (Math.random() - 0.5) * 100,
          Math.cos(ang) * 13, Math.sin(ang) * 13,
          ult.damage || 170, 4, 'wolf_stampede'
        ));
      }
    }

    this.updateUltimateUI();
  }

  shakeScreen(intensity, duration) {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
  }

  addShockwave(x, y, maxRadius, color = '#facc15', duration = 0.4) {
    this.shockwaves.push({
      x, y,
      maxRadius,
      radius: 0,
      color,
      age: 0,
      duration
    });
  }

  // ⚔️ 검사 근접 부채꼴 검기 참격 효과 추가
  addSlashEffect(x, y, angle, range = 85, color = '#ef4444', arcSpan = Math.PI * 0.88, width = 18, duration = 0.16) {
    if (this.audio) this.audio.playSlash();
    this.slashEffects.push({
      x, y, angle,
      range,
      color,
      arcSpan,
      width,
      age: 0,
      duration
    });
  }

  hasSkill(id) {
    return this.pet && !!this.pet.skills[id];
  }

  update(dt) {
    if (this.isPaused || !this.player || !this.pet) return;

    this.gameTime += dt;

    // 📳 화면 흔들림 및 시네마틱 효과 감쇠
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= dt;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeDuration = 0;
        this.screenShakeIntensity = 0;
      }
    }
    if (this.cinematicDimming > 0) {
      this.cinematicDimming -= dt * 1.5;
      if (this.cinematicDimming <= 0) this.cinematicDimming = 0;
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += dt;
      sw.radius = (sw.age / sw.duration) * sw.maxRadius;
      if (sw.age >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // ⚔️ 검사 근접 검기 호 효과 감쇠
    if (this.slashEffects) {
      for (let i = this.slashEffects.length - 1; i >= 0; i--) {
        const sl = this.slashEffects[i];
        sl.age += dt;
        if (sl.age >= sl.duration) {
          this.slashEffects.splice(i, 1);
        }
      }
    }

    // Ultimate timer update
    if (this.ultimateTimer < this.ultimateMaxCd) {
      this.ultimateTimer += dt;
      this.updateUltimateUI();
    }

    // Active Ultimate duration
    if (this.ultimateDuration > 0) {
      this.ultimateDuration -= dt;
      if (this.ultimateDuration <= 0) {
        this.ultimateDuration = 0;
        this.player.isInvincible = false;
        this.player.shieldTimer = 0;
        this.player.speed = 3.2; // reset speed
      }
    }

    // 1. Tamer Movement (Auto-Play OR Keyboard/Joystick)
    let dx = 0;
    let dy = 0;

    if (this.autoPlay) {
      const autoVec = this.computeAutoPlayVector();
      dx = autoVec.x;
      dy = autoVec.y;
      // Auto trigger ultimate when ready
      if (this.ultimateTimer >= this.ultimateMaxCd) {
        this.triggerUltimate();
      }
    } else if (this.joystick.active) {
      dx = this.joystick.vx;
      dy = this.joystick.vy;
    } else {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071; dy *= 0.7071;
      }
    }

    // 현재 지형에 따른 이동속도 계수 (독늪 감속 등)
    const curTerrain = (GAME_DATA.world && typeof GAME_DATA.world.getTileType === 'function')
      ? GAME_DATA.world.getTileType(this.player.x, this.player.y)
      : 'grass';
    let terrainSpeedMul = 1.0;
    if (curTerrain === 'swamp') terrainSpeedMul = 0.78; // 늪지대 발목 잡힘
    else if (curTerrain === 'forest') terrainSpeedMul = 0.92; // 숲 소폭 감속

    const stepX = dx * this.player.speed * terrainSpeedMul * 60 * dt;
    const stepY = dy * this.player.speed * terrainSpeedMul * 60 * dt;

    // ⛰️ 산지 및 🌊 물 지형 충돌 검사 & 벽면 슬라이딩(Wall Sliding)
    let movedX = false;
    let movedY = false;

    if (this.isPassable(this.player.x + stepX, this.player.y, 14)) {
      this.player.x += stepX;
      movedX = true;
    }
    if (this.isPassable(this.player.x, this.player.y + stepY, 14)) {
      this.player.y += stepY;
      movedY = true;
    }

    // 벽면에 직각으로 부딪혔을 때 비스듬히 미끄러지는 부드러운 슬라이딩 처리
    if (!movedX && Math.abs(stepX) > 0.01 && Math.abs(stepY) < 0.1) {
      const slideStep = Math.abs(stepX) * 0.75;
      if (this.isPassable(this.player.x, this.player.y + slideStep, 14)) {
        this.player.y += slideStep;
        movedY = true;
      } else if (this.isPassable(this.player.x, this.player.y - slideStep, 14)) {
        this.player.y -= slideStep;
        movedY = true;
      }
    } else if (!movedY && Math.abs(stepY) > 0.01 && Math.abs(stepX) < 0.1) {
      const slideStep = Math.abs(stepY) * 0.75;
      if (this.isPassable(this.player.x + slideStep, this.player.y, 14)) {
        this.player.x += slideStep;
        movedX = true;
      } else if (this.isPassable(this.player.x - slideStep, this.player.y, 14)) {
        this.player.x -= slideStep;
        movedX = true;
      }
    }

    // 🚨 오토플레이 끼임(Stuck) 정밀 감지 및 탈출(Detour) 기동
    if (this.autoPlay) {
      const movedDist = Math.hypot(
        this.player.x - (this.lastAutoX || this.player.x),
        this.player.y - (this.lastAutoY || this.player.y)
      );
      this.lastAutoX = this.player.x;
      this.lastAutoY = this.player.y;

      if (this.autoDetourTimer > 0) {
        this.autoDetourTimer -= dt;
      }

      // 이동 의도가 있으나 실제로 거의 전진하지 못하는 경우
      if ((dx !== 0 || dy !== 0) && movedDist < 0.35) {
        this.autoStuckTimer = (this.autoStuckTimer || 0) + dt;
        if (this.autoStuckTimer > 0.25) {
          // 전방이 막혀 있으므로 주변 8방향 중 완전히 뚫려 있는 안전한 육지 각도로 탈출 기동
          let bestEscapeAngle = Math.random() * Math.PI * 2;
          let maxPassableDist = 0;
          for (let a = 0; a < 8; a++) {
            const testAng = a * (Math.PI / 4);
            let freeSteps = 0;
            for (let step = 20; step <= 80; step += 20) {
              if (this.isPassable(this.player.x + Math.cos(testAng) * step, this.player.y + Math.sin(testAng) * step, 14)) {
                freeSteps++;
              } else {
                break;
              }
            }
            if (freeSteps > maxPassableDist) {
              maxPassableDist = freeSteps;
              bestEscapeAngle = testAng;
            }
          }

          this.autoDetourAngle = bestEscapeAngle;
          this.autoDetourTimer = 1.2; // 1.2초간 탈출 기동 지속
          this.autoStuckTimer = 0;

          // 보물상자를 먹으려다 막힌 경우 해당 상자를 15초간 무시(블랙리스트)하여 다른 곳으로 유도
          if (this.currentTargetChest) {
            if (!this.unreachableChests) this.unreachableChests = new Map();
            this.unreachableChests.set(this.currentTargetChest, this.gameTime + 15);
            this.currentTargetChest = null;
          }
        }
      } else {
        this.autoStuckTimer = Math.max(0, (this.autoStuckTimer || 0) - dt * 2);
      }
    }

    // World Boundary Clamping (16000 x 16000)
    const worldW = (GAME_DATA.world && GAME_DATA.world.width) || 16000;
    const worldH = (GAME_DATA.world && GAME_DATA.world.height) || 16000;
    this.player.x = Math.max(60, Math.min(worldW - 60, this.player.x));
    this.player.y = Math.max(60, Math.min(worldH - 60, this.player.y));

    if (dx > 0.05) this.player.facing = 1;
    if (dx < -0.05) this.player.facing = -1;

    // Update 2 Virtual AI Co-op Teammates
    if (this.aiTeammatesEnabled) {
      this.updateAiTeammates(dt);
    }

    // Passive Armor HP Regen
    if (this.player.hpRegen > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.hpRegen * dt);
      this.updateHpBar();
    }

    // Passive Shield Barrier Recharge
    if (this.player.shieldInterval > 0) {
      this.player.shieldCooldown += dt;
      if (this.player.shieldCooldown >= this.player.shieldInterval) {
        this.player.shieldCooldown = 0;
        this.player.shieldBarrier = Math.min(2, (this.player.shieldBarrier || 0) + 1);
      }
    }

    // Chest Collision Check (반경 55px로 넉넉하게 흡수하여 해안가나 바위 옆에서도 안전 획득)
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const c = this.chests[i];
      if (Math.hypot(c.x - this.player.x, c.y - this.player.y) < 55) {
        this.chests.splice(i, 1);
        this.audio.playGem();
        this.openEquipmentModal(c.tier);
        break;
      }
    }

    // 2. Pet Spring Follow Physics
    const targetPetX = this.player.x - this.player.facing * 35;
    const targetPetY = this.player.y - 15;
    const pDx = targetPetX - this.pet.x;
    const pDy = targetPetY - this.pet.y;

    this.pet.vx += pDx * 6 * dt;
    this.pet.vy += pDy * 6 * dt;
    this.pet.vx *= 0.85;
    this.pet.vy *= 0.85;
    this.pet.x += this.pet.vx;
    this.pet.y += this.pet.vy;

    if (this.pet.vx > 0.2) this.pet.facing = 1;
    if (this.pet.vx < -0.2) this.pet.facing = -1;

    // 3. Pet Auto Skill Casting
    this.updatePetSkills(dt);

    // 4. Wave Spawner
    this.updateWaveSpawner(dt);

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // Holy Cross Boomerang Return Physics
      if (p.kind === 'holy_cross' && p.life < 1.2) {
        const backAng = Math.atan2(this.player.y - p.y, this.player.x - p.x);
        p.vx = Math.cos(backAng) * 8.5;
        p.vy = Math.sin(backAng) * 8.5;
      }

      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + 8) {
          // 💣 덫 및 집속 지뢰 폭발
          if (p.kind === 'trap' || p.kind === 'trap_cluster') {
            this.audio.playExplosion();
            const rad = p.explodeRadius || (p.kind === 'trap_cluster' ? 120 : 95);
            this.shakeScreen(p.kind === 'trap_cluster' ? 10 : 6, 0.22);
            this.addShockwave(p.x, p.y, rad, p.kind === 'trap_cluster' ? '#ef4444' : '#f97316', 0.35);
            this.enemies.forEach(subE => {
              if (Math.hypot(subE.x - p.x, subE.y - p.y) < rad) {
                subE.takeDamage(p.damage);
              }
            });
            for (let k = 0; k < 14; k++) {
              this.particles.push({
                x: p.x + (Math.random() - 0.5) * 30,
                y: p.y + (Math.random() - 0.5) * 30,
                color: p.kind === 'trap_cluster' ? '#dc2626' : '#f59e0b',
                life: 0.35, maxLife: 0.35, size: 5
              });
            }
            p.pierce = 0;
            p.life = 0;
            break;
          }
          // Exploding fireball
          else if (p.kind === 'fireball') {
            this.audio.playExplosion();
            this.enemies.forEach(subE => {
              if (Math.hypot(subE.x - p.x, subE.y - p.y) < 55) {
                subE.takeDamage(p.damage);
              }
            });
            for (let k = 0; k < 6; k++) {
              this.particles.push({
                x: p.x, y: p.y,
                color: '#f97316',
                life: 0.3, maxLife: 0.3,
                size: 4
              });
            }
          } else if (p.kind === 'icicle') {
            // Icicle spear slows enemy by 40% for 2 sec
            e.slowTimer = 2.0;
            e.slowRate = 0.6;
            e.takeDamage(p.damage);
            for (let k = 0; k < 3; k++) {
              this.particles.push({
                x: p.x, y: p.y,
                color: '#38bdf8',
                life: 0.25, maxLife: 0.25,
                size: 3
              });
            }
          } else if (p.kind === 'shield_wave') {
            e.takeDamage(p.damage);
            const bang = Math.atan2(p.vy, p.vx);
            e.x += Math.cos(bang) * 25;
            e.y += Math.sin(bang) * 25;
            e.slowTimer = 1.0;
            e.slowRate = 0.4;
          } else if (p.kind === 'blade_arc' || p.kind === 'rune_blade') {
            e.takeDamage(p.damage);
            this.shakeScreen(2, 0.08);
            for (let k = 0; k < 3; k++) {
              this.particles.push({
                x: p.x, y: p.y,
                color: p.kind === 'rune_blade' ? '#c084fc' : '#fb7185',
                life: 0.2, maxLife: 0.2, size: 4
              });
            }
          } else if (p.kind === 'sniper_beam' || p.kind === 'god_laser') {
            e.takeDamage(p.damage);
            this.shakeScreen(3, 0.1);
            for (let k = 0; k < 4; k++) {
              this.particles.push({
                x: p.x, y: p.y,
                color: p.kind === 'god_laser' ? '#facc15' : '#06b6d4',
                life: 0.2, maxLife: 0.2, size: 4
              });
            }
          } else {
            e.takeDamage(p.damage);
          }
          p.pierce--;
          if (p.pierce <= 0) break;
        }
      }

      if (p.life <= 0 || p.pierce <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Fade Lightning Bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].life -= dt;
      if (this.lightningBolts[i].life <= 0) this.lightningBolts.splice(i, 1);
    }

    // 7. Update Dragon Breath
    for (let i = this.breathEffects.length - 1; i >= 0; i--) {
      const b = this.breathEffects[i];
      b.duration -= dt;
      // Damage enemies in cone
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - this.pet.x, e.y - this.pet.y);
        if (d < b.range) {
          const ang = Math.atan2(e.y - this.pet.y, e.x - this.pet.x);
          const diff = Math.abs(ang - b.angle);
          if (diff < 0.45 || Math.abs(diff - Math.PI * 2) < 0.45) {
            e.takeDamage(b.damage * dt * 3);
          }
        }
      });
      if (b.duration <= 0) this.breathEffects.splice(i, 1);
    }

    // 8. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player);
      if (e.hp <= 0) this.enemies.splice(i, 1);
    }

    // 9. Update Gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (!g.update(dt, this.player, this.pet.magnetRange, (gem) => this.collectGem(gem))) {
        this.gems.splice(i, 1);
      }
    }

    // 10. Update Damage numbers & Particles
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= 25 * dt;
      d.life -= dt;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    this.updateHUDTimer();
  }

  updatePetSkills(dt) {
    const pet = this.pet;

    for (const sId in pet.skills) {
      const s = pet.skills[sId];
      const def = GAME_DATA.skills[sId];
      if (!def) continue;

      s.timer += dt;
      const actualCd = Math.max(0.2, def.baseCooldown * (1 - pet.cooldownRed));

      if (s.timer >= actualCd) {
        s.timer = 0;
        this.firePetSkill(def, s.level);
      }
    }
  }

  firePetSkill(def, level) {
    const pet = this.pet;
    const dmg = Math.round(def.baseDamage * pet.might * (1 + (level - 1) * 0.2));

    // [1] 화염구 (Fireball)
    if (def.type === 'projectile_explode') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      const angle = target ? Math.atan2(target.y - pet.y, target.x - pet.x) : (pet.facing === 1 ? 0 : Math.PI);
      this.projectiles.push(new EngineProjectile(
        pet.x, pet.y,
        Math.cos(angle) * def.speed,
        Math.sin(angle) * def.speed,
        dmg, 1, 'fireball'
      ));
      this.audio.playShoot();
    }

    // [2] 연쇄 번개 (Chain Lightning)
    if (def.type === 'chain') {
      const enemies = this.getEnemiesInRange(pet.x, pet.y, def.range);
      if (enemies.length > 0) {
        let prev = { x: pet.x, y: pet.y };
        const hits = Math.min(enemies.length, def.chains || 3);
        for (let i = 0; i < hits; i++) {
          const target = enemies[i];
          target.takeDamage(dmg);
          this.lightningBolts.push({ x1: prev.x, y1: prev.y, x2: target.x, y2: target.y, life: 0.15 });
          prev = target;
        }
        this.audio.playShoot();
      }
    }

    // [3] 가시 덩굴 (Thorn Aura)
    if (def.type === 'aura') {
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - pet.x, e.y - pet.y) < def.radius + e.radius) {
          e.takeDamage(dmg);
        }
      });
    }

    // [4] 정령 위성 (Spirits)
    if (def.type === 'orbital') {
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - pet.x, e.y - pet.y) < 85) {
          e.takeDamage(dmg * 0.5);
        }
      });
    }

    // [5] 용의 숨결 (Dragon Breath) - 2차 전직
    if (def.type === 'cone_spray') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      const angle = target ? Math.atan2(target.y - pet.y, target.x - pet.x) : (pet.facing === 1 ? 0 : Math.PI);
      this.breathEffects.push({ angle, range: def.range, duration: def.duration, damage: dmg });
      this.audio.playExplosion();
    }

    // [6] 뇌전 폭풍 (Thunderstorm) - 2차 전직
    if (def.type === 'random_strike') {
      const targets = this.getRandomEnemies(def.count || 3);
      targets.forEach(tgt => {
        tgt.takeDamage(dmg);
        this.lightningBolts.push({ x1: tgt.x, y1: tgt.y - 300, x2: tgt.x, y2: tgt.y, life: 0.25 });
      });
      if (targets.length > 0) this.audio.playExplosion();
    }

    // [7] 세계수의 성역 (Sanctuary) - 2차 전직
    if (def.type === 'sanctuary_field') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.healAmount);
      this.updateHpBar();
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < def.radius) {
          e.takeDamage(dmg);
          const ang = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          e.x += Math.cos(ang) * 20;
          e.y += Math.sin(ang) * 20;
        }
      });
    }

    // [8] ☀️ 태양의 플레어 (Solar Flare) - 3차 전직 (아그니)
    if (def.type === 'screen_nova') {
      this.audio.playExplosion();
      this.enemies.forEach(e => e.takeDamage(dmg));
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 450,
          y: this.player.y + (Math.random() - 0.5) * 450,
          color: '#fbbf24',
          life: 0.5, maxLife: 0.5, size: 7
        });
      }
    }

    // [9] ⚡ 천벌의 뇌광 (Judgment Ray) - 3차 전직 (제우스)
    if (def.type === 'laser_sweep') {
      this.audio.playShoot();
      for (let i = 0; i < 4; i++) {
        const ang = this.gameTime * 3 + (i * Math.PI) / 2;
        const lx = pet.x + Math.cos(ang) * 190;
        const ly = pet.y + Math.sin(ang) * 190;
        this.lightningBolts.push({ x1: pet.x, y1: pet.y, x2: lx, y2: ly, life: 0.2 });
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - lx, e.y - ly) < 45) e.takeDamage(dmg);
        });
      }
    }

    // [10] 🌸 생명의 숨결 (Life Rebirth) - 3차 전직 (가이아)
    if (def.type === 'passive_aura') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (def.healAmount || 5));
      this.updateHpBar();
    }

    // [11] ☄️ 헬파이어 메테오 (Hellfire Meteor) - [합성 진화: 화염구+송곳니]
    if (def.type === 'falling_meteor') {
      const targets = this.getRandomEnemies(3);
      targets.forEach(tgt => {
        this.audio.playExplosion();
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - tgt.x, e.y - tgt.y) < def.radius) {
            e.takeDamage(dmg);
          }
        });
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x: tgt.x + (Math.random() - 0.5) * 40,
            y: tgt.y + (Math.random() - 0.5) * 40,
            color: '#ef4444',
            life: 0.5, maxLife: 0.5, size: 6
          });
        }
      });
    }

    // [12] ⚡ 뇌전망 테슬라 (Tesla Web) - [합성 진화: 연쇄번개+호각]
    if (def.type === 'chain_mega') {
      const enemies = this.getEnemiesInRange(pet.x, pet.y, def.range);
      if (enemies.length > 0) {
        let prev = { x: pet.x, y: pet.y };
        const hits = Math.min(enemies.length, def.chains || 10);
        for (let i = 0; i < hits; i++) {
          const target = enemies[i];
          target.takeDamage(dmg);
          this.lightningBolts.push({ x1: prev.x, y1: prev.y, x2: target.x, y2: target.y, life: 0.25 });
          prev = target;
        }
        this.audio.playShoot();
      }
    }

    // [13] 🥀 흡혈의 장미 (Vampiric Rose) - [합성 진화: 가시덩굴+수정]
    if (def.type === 'aura_leech') {
      let totalLeech = 0;
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - pet.x, e.y - pet.y) < def.radius + e.radius) {
          e.takeDamage(dmg);
          totalLeech += dmg * (def.leechPct || 0.1);
        }
      });
      if (totalLeech > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + totalLeech);
        this.updateHpBar();
      }
    }

    // [14] 🌌 초신성 오비탈 (Supernova) - [합성 진화: 정령위성+방울]
    if (def.type === 'orbital_mega') {
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - pet.x, e.y - pet.y) < 115) {
          e.takeDamage(dmg * 0.7);
        }
      });
    }

    // [15] 🧊 고드름 창 (Icicle Spear)
    if (def.type === 'ice_projectile') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      const angle = target ? Math.atan2(target.y - pet.y, target.x - pet.x) : (pet.facing === 1 ? 0 : Math.PI);
      this.projectiles.push(new EngineProjectile(
        pet.x, pet.y,
        Math.cos(angle) * (def.speed || 8),
        Math.sin(angle) * (def.speed || 8),
        dmg, def.pierce || 3, 'icicle'
      ));
      this.audio.playShoot();
    }

    // [16] 🌪️ 바람의 칼날 (Wind Blade)
    if (def.type === 'spiral_blade') {
      const count = def.count || 3;
      for (let i = 0; i < count; i++) {
        const ang = this.gameTime * 4 + (i * Math.PI * 2) / count;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y,
          Math.cos(ang) * 6.5, Math.sin(ang) * 6.5,
          dmg, 4, 'wind_blade'
        ));
      }
      this.audio.playShoot();
    }

    // [17] ✝️ 신성한 십자가 (Holy Cross)
    if (def.type === 'boomerang') {
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const ang = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      this.projectiles.push(new EngineProjectile(
        this.player.x, this.player.y,
        Math.cos(ang) * 7.5, Math.sin(ang) * 7.5,
        dmg, 6, 'holy_cross'
      ));
      this.audio.playShoot();
    }

    // [18] 💀 해골 소환수 (Dark Minion)
    if (def.type === 'summon_minion') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      if (target) {
        target.takeDamage(dmg);
        target.x += (Math.random() - 0.5) * 10;
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: target.x, y: target.y,
            color: '#64748b', life: 0.25, maxLife: 0.25, size: 4
          });
        }
      }
    }

    // [19] ❄️ 절대영도 블리자드 (Absolute Blizzard) - [합성 진화: 고드름창+고서]
    if (def.type === 'screen_blizzard') {
      this.enemies.forEach(e => {
        e.takeDamage(dmg * 0.4);
        e.slowTimer = 2.0;
        e.slowRate = 0.4; // 60% slow
      });
      // Falling snowflakes
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 600,
          y: this.player.y + (Math.random() - 0.5) * 450,
          color: '#38bdf8', life: 0.6, maxLife: 0.6, size: 5
        });
      }
    }

    // [20] 🌀 타이푼 볼텍스 (Typhoon Vortex) - [합성 진화: 바람칼날+방울]
    if (def.type === 'storm_vortex') {
      for (let k = 0; k < 2; k++) {
        const ang = this.gameTime * 2.5 + k * Math.PI;
        const vx = this.player.x + Math.cos(ang) * 140;
        const vy = this.player.y + Math.sin(ang) * 140;
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - vx, e.y - vy) < 110) {
            e.takeDamage(dmg * 0.5);
            // Pull enemies inward
            const pa = Math.atan2(vy - e.y, vx - e.x);
            e.x += Math.cos(pa) * 12;
            e.y += Math.sin(pa) * 12;
          }
        });
      }
    }

    // [21] ⚔️ 천상의 심판도끼 (Celestial Blade) - [합성 진화: 신성십자가+클로버]
    if (def.type === 'cross_axes') {
      this.audio.playExplosion();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + this.gameTime * 2;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y,
          Math.cos(ang) * 9.0, Math.sin(ang) * 9.0,
          dmg * 2, 8, 'golden_axe'
        ));
      }
    }

    // [22] 👑 사령의 지옥군주 (Abyss Necromancer) - [합성 진화: 해골소환수+송곳니]
    if (def.type === 'summon_giant') {
      this.audio.playExplosion();
      this.shakeScreen(8, 0.25);
      const faceAngle = (this.player.facing === 1) ? 0 : Math.PI;
      const range = 130;
      const arcSpan = Math.PI * 0.95;
      const arcHalf = arcSpan / 2;

      // 시각 연출: 거대 해골 군주의 암흑 대참격 호
      this.addSlashEffect(this.player.x, this.player.y, faceAngle, range, '#a855f7', arcSpan, 30, 0.24);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 40;
            e.y += Math.sin(enemyAngle) * 40;
            hitCount++;
            for (let k = 0; k < 3; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                color: '#c084fc', life: 0.3, maxLife: 0.3, size: 5
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // --- [소환수 근거리 특화 스킬: 진정한 초근접 발톱/검기 참격 & 넉백] ---
    // [23] 🔥 화염 발톱 (Fire Claw - 이그니스 1차 전방 부채꼴 발톱 베기)
    if (def.type === 'melee_slash') {
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 95;
      const arcSpan = Math.PI * 0.88;
      const arcHalf = arcSpan / 2;

      this.audio.playShoot();
      this.shakeScreen(3, 0.12);
      this.addSlashEffect(pet.x, pet.y, faceAngle, range, '#f97316', arcSpan, 20, 0.16);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 25;
            e.y += Math.sin(enemyAngle) * 25;
            hitCount++;
            for (let k = 0; k < 2; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 16,
                y: e.y + (Math.random() - 0.5) * 16,
                color: '#f97316', life: 0.25, maxLife: 0.25, size: 5
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [24] 🐲 용왕의 찢어발기기 (Dragon Claw - 이그니스 2차 바하무트 3연속 폭염 할퀴기)
    if (def.type === 'melee_slash_multi') {
      this.audio.playExplosion();
      this.shakeScreen(6, 0.2);
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 125;
      const arcSpan = Math.PI * 0.92;
      const arcHalf = arcSpan / 2;

      // 3중 거대 폭염 발톱 참격 연출
      this.addSlashEffect(pet.x, pet.y, faceAngle - 0.18, range, '#ef4444', arcSpan, 24, 0.2);
      this.addSlashEffect(pet.x, pet.y, faceAngle, range * 0.92, '#f97316', arcSpan, 20, 0.18);
      this.addSlashEffect(pet.x, pet.y, faceAngle + 0.18, range * 0.85, '#f59e0b', arcSpan, 18, 0.16);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 35;
            e.y += Math.sin(enemyAngle) * 35;
            hitCount++;
            for (let k = 0; k < 3; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                color: '#ef4444', life: 0.35, maxLife: 0.35, size: 6
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [25] 🌋 업화의 분화구 (Hellfire Eruption - 이그니스 3차 지면 마그마 대폭발)
    if (def.type === 'ground_eruption') {
      this.audio.playExplosion();
      this.shakeScreen(8, 0.25);
      const radius = def.radius || 160;

      // 360도 전방위 화염 참격 링 및 충격파
      this.addSlashEffect(pet.x, pet.y, 0, radius, '#f97316', Math.PI * 2, 26, 0.25);
      this.addShockwave(pet.x, pet.y, radius, '#ef4444', 0.4);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dist = Math.hypot(e.x - pet.x, e.y - pet.y);
        if (dist <= radius + (e.radius || 15)) {
          const ang = Math.atan2(e.y - pet.y, e.x - pet.x);
          e.takeDamage(dmg);
          e.x += Math.cos(ang) * 40;
          e.y += Math.sin(ang) * 40;
          hitCount++;
        }
      });
      if (hitCount > 0) this.audio.playHit();
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * radius;
        this.particles.push({
          x: pet.x + Math.cos(a) * d,
          y: pet.y + Math.sin(a) * d,
          color: '#f59e0b', life: 0.5, maxLife: 0.5, size: 7
        });
      }
    }

    // [26] 🌋 마그마 크러셔 (Magma Crusher - 이그니스 근접 합성 진화)
    if (def.type === 'crusher_slash') {
      this.audio.playExplosion();
      this.shakeScreen(10, 0.3);
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 140;
      const arcSpan = Math.PI * 0.98;
      const arcHalf = arcSpan / 2;

      this.addSlashEffect(pet.x, pet.y, faceAngle, range, '#dc2626', arcSpan, 32, 0.25);
      this.addShockwave(pet.x, pet.y, range, '#ef4444', 0.35);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 45;
            e.y += Math.sin(enemyAngle) * 45;
            hitCount++;
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: pet.x + Math.cos(faceAngle) * 70 + (Math.random() - 0.5) * 60,
          y: pet.y + Math.sin(faceAngle) * 70 + (Math.random() - 0.5) * 60,
          color: '#dc2626', life: 0.5, maxLife: 0.5, size: 8
        });
      }
    }

    // [27] ⚡ 질풍의 뇌인 (Thunder Slash - 테슬라 1차 쾌속 뇌격참)
    if (def.type === 'melee_slash_fast') {
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 90;
      const arcSpan = Math.PI * 0.85;
      const arcHalf = arcSpan / 2;

      this.audio.playShoot();
      this.shakeScreen(3, 0.12);
      this.addSlashEffect(pet.x, pet.y, faceAngle, range, '#38bdf8', arcSpan, 18, 0.14);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 25;
            e.y += Math.sin(enemyAngle) * 25;
            hitCount++;
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
      for (let i = 0; i < 4; i++) {
        this.lightningBolts.push({
          x1: pet.x, y1: pet.y,
          x2: pet.x + Math.cos(faceAngle) * 80 + (Math.random() - 0.5) * 30,
          y2: pet.y + Math.sin(faceAngle) * 80 + (Math.random() - 0.5) * 30,
          color: '#38bdf8', life: 0.15
        });
      }
    }

    // [28] ⚔️ 십자 뇌격참 (Lightning Cross - 테슬라 2차 X자 교차 뇌격참)
    if (def.type === 'cross_slash') {
      this.audio.playShoot();
      this.shakeScreen(5, 0.18);
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 130;
      const arcSpan = Math.PI * 0.75;

      // X자 2중 교차 참격 호
      this.addSlashEffect(pet.x, pet.y, faceAngle - 0.35, range, '#facc15', arcSpan, 22, 0.18);
      this.addSlashEffect(pet.x, pet.y, faceAngle + 0.35, range, '#38bdf8', arcSpan, 22, 0.18);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= (Math.PI * 0.85) / 2) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 35;
            e.y += Math.sin(enemyAngle) * 35;
            hitCount++;
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
      const cx = pet.x + Math.cos(faceAngle) * 60;
      const cy = pet.y + Math.sin(faceAngle) * 60;
      this.lightningBolts.push({ x1: cx - 45, y1: cy - 45, x2: cx + 45, y2: cy + 45, color: '#facc15', life: 0.2 });
      this.lightningBolts.push({ x1: cx - 45, y1: cy + 45, x2: cx + 45, y2: cy - 45, color: '#facc15', life: 0.2 });
    }

    // [29] 🔱 뇌신의 심판창 (Zeus Spear - 테슬라 3차 최종 벼락 강타)
    if (def.type === 'spear_slam') {
      this.audio.playExplosion();
      this.shakeScreen(8, 0.25);
      const radius = def.radius || 180;
      this.addShockwave(pet.x, pet.y, radius, '#facc15', 0.4);
      this.addSlashEffect(pet.x, pet.y, 0, radius, '#38bdf8', Math.PI * 2, 24, 0.22);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dist = Math.hypot(e.x - pet.x, e.y - pet.y);
        if (dist <= radius + (e.radius || 15)) {
          const ang = Math.atan2(e.y - pet.y, e.x - pet.x);
          e.takeDamage(dmg);
          e.x += Math.cos(ang) * 45;
          e.y += Math.sin(ang) * 45;
          hitCount++;
        }
      });
      if (hitCount > 0) this.audio.playHit();
      this.lightningBolts.push({ x1: pet.x, y1: pet.y - 350, x2: pet.x, y2: pet.y, color: '#fef08a', width: 6, life: 0.35 });
    }

    // [30] ⚡ 뇌화난무 (Thunder Frenzy - 테슬라 근접 합성 진화: 쾌속 난무 뇌격참)
    if (def.type === 'frenzy_slashes') {
      this.audio.playShoot();
      this.shakeScreen(4, 0.15);
      const faceAngle = pet.facing === 1 ? 0 : Math.PI;
      const range = def.range || 135;
      const arcSpan = Math.PI * 0.9;
      const arcHalf = arcSpan / 2;

      // 쾌속 번개 참격 호 2연속 번뜩임
      this.addSlashEffect(pet.x, pet.y, faceAngle + (Math.random() - 0.5) * 0.4, range, '#a855f7', arcSpan, 20, 0.14);
      this.addSlashEffect(pet.x, pet.y, faceAngle + (Math.random() - 0.5) * 0.4, range * 0.9, '#c084fc', arcSpan, 16, 0.12);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - pet.x;
        const dy = e.y - pet.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg * 0.4);
            e.x += Math.cos(enemyAngle) * 20;
            e.y += Math.sin(enemyAngle) * 20;
            hitCount++;
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
      for (let i = 0; i < 3; i++) {
        this.lightningBolts.push({
          x1: pet.x + (Math.random() - 0.5) * 30, y1: pet.y + (Math.random() - 0.5) * 30,
          x2: pet.x + Math.cos(faceAngle) * 110 + (Math.random() - 0.5) * 40,
          y2: pet.y + Math.sin(faceAngle) * 110 + (Math.random() - 0.5) * 40,
          color: '#a855f7', life: 0.12
        });
      }
    }

    // [31] 🍃 칼날 잎사귀 (Leaf Cutter - 전방 3발 투척)
    if (def.type === 'spread_projectile') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      const baseAng = target ? Math.atan2(target.y - pet.y, target.x - pet.x) : (pet.facing === 1 ? 0 : Math.PI);
      const spreadAngles = [-0.22, 0, 0.22];
      spreadAngles.forEach(offset => {
        const ang = baseAng + offset;
        this.projectiles.push(new EngineProjectile(
          pet.x, pet.y,
          Math.cos(ang) * (def.speed || 7.5),
          Math.sin(ang) * (def.speed || 7.5),
          dmg, 3, 'leaf_blade'
        ));
      });
      this.audio.playShoot();
    }

    // [32] 🍄 맹독 포자 폭탄 (Poison Spore)
    if (def.type === 'toxic_bomb') {
      const target = this.getNearestEnemy(pet.x, pet.y);
      if (target) {
        const ang = Math.atan2(target.y - pet.y, target.x - pet.x);
        this.projectiles.push(new EngineProjectile(
          pet.x, pet.y,
          Math.cos(ang) * 6.5, Math.sin(ang) * 6.5,
          dmg, 1, 'poison_spore'
        ));
      }
    }

    // [33] 🌸 천상의 꽃보라 (Celestial Tempest)
    if (def.type === 'tempest_storm') {
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - pet.x, e.y - pet.y) < (def.radius || 260)) {
          e.takeDamage(dmg * 0.35);
        }
      });
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * (def.radius || 260);
        this.particles.push({
          x: pet.x + Math.cos(a) * d,
          y: pet.y + Math.sin(a) * d,
          color: '#fb7185', life: 0.6, maxLife: 0.6, size: 5
        });
      }
    }

    // [34] 🍃 질풍의 꽃보라 (Floral Tempest - 합성 진화)
    if (def.type === 'spiral_petals') {
      this.audio.playShoot();
      const count = def.count || 8;
      for (let i = 0; i < count; i++) {
        const ang = (i * Math.PI * 2) / count + this.gameTime * 2;
        this.projectiles.push(new EngineProjectile(
          pet.x, pet.y,
          Math.cos(ang) * 7.5, Math.sin(ang) * 7.5,
          dmg, 5, 'flower_blade'
        ));
      }
    }

    // [35] ⚔️ 대검 쾌참 (Frenzy Slash - 검사 광전사 초근접 참격)
    if (def.type === 'melee_slash_arc') {
      this.audio.playShoot();
      this.shakeScreen(4, 0.14);
      const faceAngle = (this.player.facing === 1) ? 0 : Math.PI;
      const range = def.range || 85;
      const arcSpan = Math.PI * 0.88; // 약 160도
      const arcHalf = arcSpan / 2;

      // 시각 연출: 플레이어 앞 초승달 모양 붉은 검기 참격 호
      this.addSlashEffect(this.player.x, this.player.y, faceAngle, range, '#ef4444', arcSpan, 20, 0.16);

      // 초근접 부채꼴 판정 & 묵직한 넉백
      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 35;
            e.y += Math.sin(enemyAngle) * 35;
            hitCount++;
            for (let k = 0; k < 3; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 16,
                y: e.y + (Math.random() - 0.5) * 16,
                color: '#f87171', life: 0.25, maxLife: 0.25, size: 4
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [36] 🛡️ 방패 강타 (Shield Bash - 검사 성기사 초근접 강타 & 넉백/기절)
    if (def.type === 'shield_bash_melee') {
      this.audio.playExplosion();
      this.shakeScreen(6, 0.2);
      const faceAngle = (this.player.facing === 1) ? 0 : Math.PI;
      const range = def.range || 75;
      const arcSpan = Math.PI * 0.72; // 약 130도
      const arcHalf = arcSpan / 2;

      // 시각 연출: 황금빛 방패 충격 호
      this.addSlashEffect(this.player.x, this.player.y, faceAngle, range, '#fbbf24', arcSpan, 26, 0.2);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            // 초강력 넉백 & 잠시 밀쳐냄
            e.x += Math.cos(enemyAngle) * 50;
            e.y += Math.sin(enemyAngle) * 50;
            hitCount++;
            for (let k = 0; k < 4; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                color: '#fef08a', life: 0.3, maxLife: 0.3, size: 5
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [37] 🔮 마검 회전참 (Rune Spin Slash - 검사 마검사 360도 초근접 회전베기)
    if (def.type === 'rune_spin_slash') {
      this.audio.playShoot();
      this.shakeScreen(4, 0.16);
      const range = def.range || 85;

      // 시각 연출: 360도 신비로운 보랏빛 회전 룬 칼날 고리
      const spinAngle = this.gameTime * 6;
      this.addSlashEffect(this.player.x, this.player.y, spinAngle, range, '#c084fc', Math.PI * 2, 18, 0.18);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          e.takeDamage(dmg);
          e.x += Math.cos(enemyAngle) * 25;
          e.y += Math.sin(enemyAngle) * 25;
          hitCount++;
          for (let k = 0; k < 2; k++) {
            this.particles.push({
              x: e.x + (Math.random() - 0.5) * 16,
              y: e.y + (Math.random() - 0.5) * 16,
              color: '#e879f9', life: 0.2, maxLife: 0.2, size: 4
            });
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [38] 🎯 관통 저격 (Pierce Snipe - 궁수 스나이퍼)
    if (def.type === 'sniper_beam') {
      this.audio.playShoot();
      this.shakeScreen(6, 0.18);
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const ang = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      this.projectiles.push(new EngineProjectile(
        this.player.x, this.player.y,
        Math.cos(ang) * (def.speed || 20), Math.sin(ang) * (def.speed || 20),
        dmg, 999, 'sniper_beam'
      ));
    }

    // [39] 🌪️ 질풍 연사 (Rapid Gale - 궁수 윈드러너)
    if (def.type === 'rapid_arrow') {
      this.audio.playShoot();
      const count = def.count || 3;
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const baseAng = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.14;
        const ang = baseAng + spread;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y,
          Math.cos(ang) * (def.speed || 12), Math.sin(ang) * (def.speed || 12),
          dmg, 2, 'rapid_arrow'
        ));
      }
    }

    // [40] 💣 마법 폭발 덫 (Explosive Trap - 궁수 트래퍼)
    if (def.type === 'trap') {
      this.audio.playShoot();
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      let tx = this.player.x + (Math.random() - 0.5) * 80;
      let ty = this.player.y + (Math.random() - 0.5) * 80;
      if (target) {
        tx = target.x + (Math.random() - 0.5) * 40;
        ty = target.y + (Math.random() - 0.5) * 40;
      }
      const trapProj = new EngineProjectile(tx, ty, 0, 0, dmg, 1, 'trap');
      trapProj.life = 12.0;
      trapProj.explodeRadius = def.radius || 95;
      this.projectiles.push(trapProj);
    }

    // [41] 🩸 피의 대참격 (Blood Carnage - 검사 합성 진화: 초근접 난도질 대참격)
    if (def.type === 'melee_arc_mega') {
      this.audio.playExplosion();
      this.shakeScreen(12, 0.35);
      const faceAngle = (this.player.facing === 1) ? 0 : Math.PI;
      const range = def.range || 105;
      const arcSpan = Math.PI * 0.95; // 약 170도 대형 참격
      const arcHalf = arcSpan / 2;

      // 시각 연출: 이중 핏빛 초승달 대참격 궤적
      this.addSlashEffect(this.player.x, this.player.y, faceAngle - 0.15, range, '#dc2626', arcSpan, 28, 0.22);
      this.addSlashEffect(this.player.x, this.player.y, faceAngle + 0.15, range * 0.85, '#ef4444', arcSpan, 20, 0.22);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= arcHalf) {
            e.takeDamage(dmg);
            e.x += Math.cos(enemyAngle) * 45;
            e.y += Math.sin(enemyAngle) * 45;
            hitCount++;
            for (let k = 0; k < 5; k++) {
              this.particles.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                color: '#b91c1c', life: 0.35, maxLife: 0.35, size: 6
              });
            }
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [42] 🛡️ 천상의 성채방패 (Divine Bulwark - 검사 합성 진화: 360도 거대 방패벽 충격)
    if (def.type === 'shield_barrier_wave') {
      this.audio.playExplosion();
      this.shakeScreen(10, 0.3);
      const radius = def.radius || 95;

      // 시각 연출: 360도 황금빛 방패벽 호 및 충격파
      this.addSlashEffect(this.player.x, this.player.y, 0, radius, '#facc15', Math.PI * 2, 32, 0.25);
      this.addShockwave(this.player.x, this.player.y, radius, '#fbbf24', 0.3);

      this.enemies.forEach(e => {
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist <= radius + (e.radius || 15)) {
          const ang = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          e.takeDamage(dmg);
          e.x += Math.cos(ang) * 60;
          e.y += Math.sin(ang) * 60;
          for (let k = 0; k < 3; k++) {
            this.particles.push({
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y + (Math.random() - 0.5) * 20,
              color: '#fef08a', life: 0.3, maxLife: 0.3, size: 5
            });
          }
        }
      });
    }

    // [43] 🔮 무한 원소마검 (Infinite Runes - 검사 합성 진화: 3원소 고속 회전 칼날 폭풍)
    if (def.type === 'rune_storm') {
      this.audio.playShoot();
      this.shakeScreen(6, 0.2);
      const range = def.range || 95;

      // 시각 연출: 3원소 색상의 3중 회전 칼날 궤적
      const spin1 = this.gameTime * 7;
      const spin2 = spin1 + (Math.PI * 2) / 3;
      const spin3 = spin1 + (Math.PI * 4) / 3;
      this.addSlashEffect(this.player.x, this.player.y, spin1, range, '#38bdf8', Math.PI * 0.9, 22, 0.16);
      this.addSlashEffect(this.player.x, this.player.y, spin2, range, '#a855f7', Math.PI * 0.9, 22, 0.16);
      this.addSlashEffect(this.player.x, this.player.y, spin3, range, '#f43f5e', Math.PI * 0.9, 22, 0.16);

      let hitCount = 0;
      this.enemies.forEach(e => {
        const dx = e.x - this.player.x;
        const dy = e.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range + (e.radius || 15)) {
          const ang = Math.atan2(dy, dx);
          e.takeDamage(dmg);
          e.x += Math.cos(ang) * 30;
          e.y += Math.sin(ang) * 30;
          hitCount++;
          for (let k = 0; k < 2; k++) {
            this.particles.push({
              x: e.x + (Math.random() - 0.5) * 16,
              y: e.y + (Math.random() - 0.5) * 16,
              color: '#38bdf8', life: 0.2, maxLife: 0.2, size: 4
            });
          }
        }
      });
      if (hitCount > 0) this.audio.playHit();
    }

    // [44] 🎯 신살의 관통포 (God Slayer - 궁수 합성 진화)
    if (def.type === 'sniper_cannon') {
      this.audio.playExplosion();
      this.shakeScreen(14, 0.4);
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const ang = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      this.addShockwave(this.player.x, this.player.y, 110, '#facc15', 0.35);
      this.projectiles.push(new EngineProjectile(
        this.player.x, this.player.y,
        Math.cos(ang) * 26, Math.sin(ang) * 26,
        dmg, 999, 'god_laser'
      ));
    }

    // [45] 🌪️ 폭풍의 질풍궁 (Tempest Bow - 궁수 합성 진화)
    if (def.type === 'rapid_gatling') {
      this.audio.playShoot();
      const target = this.getNearestEnemy(this.player.x, this.player.y);
      const baseAng = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : (this.player.facing === 1 ? 0 : Math.PI);
      for (let i = 0; i < 6; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        const ang = baseAng + spread;
        this.projectiles.push(new EngineProjectile(
          this.player.x, this.player.y,
          Math.cos(ang) * 14, Math.sin(ang) * 14,
          dmg, 3, 'rapid_arrow'
        ));
      }
    }

    // [46] 💣 아마겟돈 지뢰진 (Armageddon Traps - 궁수 합성 진화)
    if (def.type === 'trap_cluster') {
      this.audio.playExplosion();
      this.shakeScreen(6, 0.2);
      const count = def.count || 5;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 120;
        const tx = this.player.x + Math.cos(ang) * dist;
        const ty = this.player.y + Math.sin(ang) * dist;
        const trapProj = new EngineProjectile(tx, ty, 0, 0, dmg, 1, 'trap_cluster');
        trapProj.life = 15.0;
        trapProj.explodeRadius = def.radius || 120;
        this.projectiles.push(trapProj);
      }
    }
  }

  updateWaveSpawner(dt) {
    // If connected as guest in multiplayer, monsters are synced from host
    if (typeof networkManager !== 'undefined' && networkManager.isConnected && !networkManager.isHost) {
      return;
    }

    // 60-Minute Overtime Warning (최종보스 심연의 마룡 바알을 처치해야 클리어!)
    if (this.gameTime >= 3600 && !this.overtimeNotified) {
      this.overtimeNotified = true;
      this.damageNumbers.push({
        x: this.player.x,
        y: this.player.y - 90,
        val: '☠️ 60분 도달! 심연의 마룡 바알을 격파해야 최종 승리합니다!',
        life: 5.0,
        color: '#ef4444'
      });
    }

    // 1. One-time Boss / Mini-Boss Spawn Check (각 보스당 정해진 시간에 딱 1마리만 소환)
    if (GAME_DATA.bossEvents) {
      GAME_DATA.bossEvents.forEach(b => {
        if (this.gameTime >= b.time && !this.spawnedBosses.has(b.time)) {
          this.spawnedBosses.add(b.time);

          let bx = 0, by = 0;
          let foundBoss = false;
          const spawnDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
          for (let attempt = 0; attempt < 12; attempt++) {
            const angle = (attempt * (Math.PI * 2 / 12));
            const testX = this.player.x + Math.cos(angle) * spawnDist;
            const testY = this.player.y + Math.sin(angle) * spawnDist;
            if (this.isPassable(testX, testY, 35)) {
              bx = testX;
              by = testY;
              foundBoss = true;
              break;
            }
          }
          if (!foundBoss) {
            bx = this.player.x + Math.cos(0) * spawnDist;
            by = this.player.y + Math.sin(0) * spawnDist;
          }

          const mDef = GAME_DATA.monsters[b.type];
          if (mDef) {
            this.enemies.push(new EngineEnemy(bx, by, b.type, mDef, this));
            this.audio.playExplosion();

            // Screen alert notification
            this.damageNumbers.push({
              x: this.player.x,
              y: this.player.y - 70,
              val: `⚠️ ${b.name} 출현!`,
              life: 3.5,
              color: '#ef4444'
            });
          }
        }
      });
    }

    // 2. Continuous Normal Monster Waves (일반 잡몹 지속 스폰)
    let currentWave = GAME_DATA.waves[0];
    for (let i = 0; i < GAME_DATA.waves.length; i++) {
      if (this.gameTime >= GAME_DATA.waves[i].time) {
        currentWave = GAME_DATA.waves[i];
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= currentWave.interval) {
      this.spawnTimer = 0;
      const baseDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 60;
      let sx = 0, sy = 0;
      let found = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const testX = this.player.x + Math.cos(angle) * (baseDist + Math.random() * 40);
        const testY = this.player.y + Math.sin(angle) * (baseDist + Math.random() * 40);
        if (this.isPassable(testX, testY, 20)) {
          sx = testX;
          sy = testY;
          found = true;
          break;
        }
      }

      if (found) {
        const mDef = GAME_DATA.monsters[currentWave.type] || GAME_DATA.monsters.slime;
        this.enemies.push(new EngineEnemy(sx, sy, currentWave.type, mDef, this));
      }
    }
  }

  collectGem(gem) {
    this.audio.playGem();
    const bonus = 1 + (this.pet.expBonus || 0);
    this.currentExp += Math.round(gem.value * bonus);
    if (this.currentExp >= this.neededExp) {
      this.levelUp();
    }
    this.updateExpBar();
  }

  levelUp() {
    this.currentExp -= this.neededExp;
    this.currentLvl++;
    this.pet.level++;
    this.neededExp = Math.floor(this.neededExp * 1.32 + 10);
    this.audio.playLevelUp();

    // 1. 2차 전직 검사 (Lv.15 - 선택한 전투 스타일에 따른 전직)
    const evo2 = (this.pet.styleConfig && this.pet.styleConfig.evolution2) || this.pet.config.evolution2;
    if (this.pet.tier === 1 && this.pet.level >= 15 && evo2) {
      this.showEvolutionModal(evo2);
      return;
    }

    // 2. 3차 최종 각성 검사 (Lv.35 - 선택한 전투 스타일에 따른 최종 각성)
    const evo3 = (this.pet.styleConfig && this.pet.styleConfig.evolution3) || this.pet.config.evolution3;
    if (this.pet.tier === 2 && this.pet.level >= 35 && evo3) {
      this.showEvolutionModal(evo3);
      return;
    }

    this.showLevelUpModal();
  }

  showEvolutionModal(evo) {
    this.isPaused = true;
    const modal = document.getElementById('evolution-modal');
    const isSummoner = (this.player.heroClass || 'summoner') === 'summoner';
    const heroName = isSummoner ? '펫' : (this.player.heroClass === 'warrior' ? '검사' : '궁수');
    const titleTag = evo.tier === 2 
      ? `🌟 ${heroName} 2차 전직 (각성) 🌟` 
      : `👑 ${heroName} 3차 최종 각성 (신화 강림) 👑`;
    document.getElementById('evo-modal-title').textContent = titleTag;
    document.getElementById('evo-name').textContent = evo.name;
    document.getElementById('evo-desc').textContent = evo.desc;
    document.getElementById('evo-icon').textContent = evo.icon;

    document.getElementById('btn-confirm-evo').onclick = () => {
      this.pet.tier = evo.tier;
      this.player.tier = evo.tier; // ⭐️ 플레이어 캐릭터 티어 동기화 (외형 2차/3차 진화)
      this.pet.isEvolved = true;
      this.pet.config.name = evo.name;
      this.pet.config.icon = evo.icon;
      this.pet.config.color = evo.color;

      if (evo.bonusDamageMul) this.pet.might += evo.bonusDamageMul;
      if (evo.bonusCooldownRed) this.pet.cooldownRed += evo.bonusCooldownRed;
      if (evo.bonusMagnetBonus) this.pet.magnetRange += evo.bonusMagnetBonus;

      // Unlock Evolution Skill
      if (evo.unlockSkill) {
        this.pet.skills[evo.unlockSkill] = { level: 1, timer: 0 };
      }

      modal.style.display = 'none';
      this.isPaused = false;
      this.updateHUD();
    };

    modal.style.display = 'flex';

    if (this.autoPlay) {
      setTimeout(() => {
        const btn = document.getElementById('btn-confirm-evo');
        if (btn) btn.click();
      }, 700);
    }
  }

  isSkillAllowedForClass(sId, heroClass) {
    // 🌐 모든 직업 공용 유틸/방어 스킬
    const commonSkills = ['magic_satellite', 'holy_cross', 'wind_blade'];
    if (commonSkills.includes(sId)) return true;

    // ⚔️ 검사 (Warrior) 스킬군: 초근접 대검, 방패 강타, 마검 회전참, 불꽃 베기, 뇌격참, 십자참 등
    const warriorSkills = [
      'frenzy_slash', 'shield_bash', 'rune_wave',
      'fire_slash', 'thunder_slash', 'lightning_cross'
    ];
    if (heroClass === 'warrior') {
      return warriorSkills.includes(sId);
    }

    // 🏹 궁수 (Archer) 스킬군: 관통 저격 빔, 질풍 연사, 폭발 덫, 잎사귀 표창, 독포자 폭탄, 고드름창 등
    const archerSkills = [
      'pierce_snipe', 'rapid_gale', 'explosive_trap',
      'leaf_cutter', 'poison_spore', 'icicle_spear'
    ];
    if (heroClass === 'archer') {
      return archerSkills.includes(sId);
    }

    // 🧙 소환사 (Summoner) 스킬군: 화염구, 연쇄번개, 가시덩굴, 고드름창, 해골소환, 소환수 발톱 등
    const summonerSkills = [
      'fireball', 'chain_lightning', 'thorn_aura', 'icicle_spear',
      'dark_minion', 'fire_slash', 'thunder_slash', 'leaf_cutter'
    ];
    if (heroClass === 'summoner') {
      return summonerSkills.includes(sId);
    }

    return true;
  }

  showLevelUpModal() {
    this.isPaused = true;
    const modal = document.getElementById('level-up-modal');
    const container = document.getElementById('upgrade-options');
    container.innerHTML = '';

    const pool = [];

    // [1] 합성 진화 검사 (Evolution Recipes)
    GAME_DATA.evolutionRecipes.forEach(recipe => {
      const baseSkill = this.pet.skills[recipe.baseSkill];
      const hasPassive = (this.pet.passives[recipe.reqPassive] || 0) >= 1;
      const alreadyEvolved = !!this.pet.skills[recipe.result];
      if (baseSkill && baseSkill.level >= 8 && hasPassive && !alreadyEvolved) {
        const evoDef = GAME_DATA.skills[recipe.result];
        pool.unshift({
          type: 'skill_evolve',
          id: recipe.result,
          baseId: recipe.baseSkill,
          data: evoDef
        });
      }
    });

    // [2] 직업별 적합 일반 스킬 목록 (Class-specific Skills Filtering)
    const heroClass = this.player ? (this.player.heroClass || 'summoner') : 'summoner';

    Object.keys(GAME_DATA.skills).forEach(sId => {
      const def = GAME_DATA.skills[sId];
      if (def.isEvolved || sId.includes('solar') || sId.includes('judgment') || sId.includes('rebirth')) return;

      const cur = this.pet.skills[sId];
      if (!cur) {
        // 신규 스킬 습득 시: 직업에 맞는 스킬만 선택지에 등장!
        if (this.isSkillAllowedForClass(sId, heroClass)) {
          pool.push({ type: 'skill_new', id: sId, data: def });
        }
      } else if (cur.level < (def.maxLevel || 8)) {
        // 이미 보유 중인 스킬은 정상적으로 레벨업 선택지에 등장
        pool.push({ type: 'skill_up', id: sId, data: def, lvl: cur.level + 1 });
      }
    });

    // [3] 패시브 아이템 목록 (전 직업 공용)
    Object.keys(GAME_DATA.passives).forEach(pId => {
      const curLvl = this.pet.passives[pId] || 0;
      if (curLvl < 5) {
        pool.push({ type: 'passive', id: pId, data: GAME_DATA.passives[pId], lvl: curLvl + 1 });
      }
    });

    // 합성 진화가 있으면 우선 포함하고, 나머지는 셔플
    let choices = [];
    const evolveChoice = pool.find(item => item.type === 'skill_evolve');
    if (evolveChoice) {
      choices.push(evolveChoice);
      const remaining = pool.filter(item => item !== evolveChoice).sort(() => 0.5 - Math.random());
      choices = choices.concat(remaining.slice(0, 2));
    } else {
      pool.sort(() => 0.5 - Math.random());
      choices = pool.slice(0, 3);
    }

    choices.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'card';
      let title = '';

      if (ch.type === 'skill_evolve') {
        card.style.borderColor = '#facc15';
        card.style.background = 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, #0f172a 80%)';
        title = `⭐ [합성 진화] ${ch.data.name}`;
      } else if (ch.type === 'skill_new') {
        title = `[신규 스킬] ${ch.data.name}`;
      } else if (ch.type === 'skill_up') {
        title = `[스킬 강화] ${ch.data.name} (Lv.${ch.lvl})`;
      } else {
        title = `[패시브] ${ch.data.name} (Lv.${ch.lvl})`;
      }

      card.innerHTML = `
        <div class="card-icon" style="${ch.type === 'skill_evolve' ? 'color:#facc15; border-color:#facc15;' : ''}">${ch.data.icon}</div>
        <div class="card-info">
          <h4>${title}</h4>
          <p>${ch.data.desc}</p>
        </div>
      `;

      card.onclick = () => {
        if (ch.type === 'skill_evolve') {
          delete this.pet.skills[ch.baseId]; // 기존 기본스킬 교체
          this.pet.skills[ch.id] = { level: 1, timer: 0 }; // 진화 스킬 장착
          this.audio.playExplosion();
        } else if (ch.type === 'skill_new') {
          this.pet.skills[ch.id] = { level: 1, timer: 0 };
        } else if (ch.type === 'skill_up') {
          this.pet.skills[ch.id].level++;
        } else {
          this.pet.passives[ch.id] = (this.pet.passives[ch.id] || 0) + 1;
          this.applyPassives();
        }

        modal.style.display = 'none';
        this.isPaused = false;
        this.updateHUD();
      };
      container.appendChild(card);
    });

    modal.style.display = 'flex';

    if (this.autoPlay) {
      setTimeout(() => {
        const firstCard = container.querySelector('.card');
        if (firstCard) firstCard.click();
      }, 700);
    }
  }

  applyPassives() {
    this.pet.might = this.pet.config.baseDamageMul || 1.0;
    this.pet.cooldownRed = this.pet.config.baseCooldownRed || 0;
    this.pet.magnetRange = 75 + (this.pet.config.baseMagnetBonus || 0);
    this.player.speed = 3.2;

    if (this.pet.passives['beast_fang']) this.pet.might += this.pet.passives['beast_fang'] * 0.15;
    if (this.pet.passives['speed_whistle']) this.pet.cooldownRed += this.pet.passives['speed_whistle'] * 0.10;
    if (this.pet.passives['friendship_bell']) this.player.speed += this.pet.passives['friendship_bell'] * (3.2 * 0.15);
    if (this.pet.passives['magnet_gem']) this.pet.magnetRange += this.pet.passives['magnet_gem'] * 50;
    if (this.pet.passives['four_leaf_clover']) this.pet.critRate = 0.05 + this.pet.passives['four_leaf_clover'] * 0.12;
    else this.pet.critRate = 0.05;
    if (this.pet.passives['sage_tome']) this.pet.expBonus = this.pet.passives['sage_tome'] * 0.20;
    else this.pet.expBonus = 0;

    // Reapply equipment bonuses on top of passives
    this.applyEquipments();
  }

  applyEquipments() {
    if (!this.player || !this.player.equipments) return;

    this.player.dmgReduction = 0;
    this.player.hpRegen = 0;
    this.player.shieldInterval = 0;

    const eq = this.player.equipments;

    // 1. Weapon
    if (eq.weapon) {
      if (eq.weapon.mightBonus) this.pet.might += eq.weapon.mightBonus;
      if (eq.weapon.cdrBonus) this.pet.cooldownRed += eq.weapon.cdrBonus;
    }

    // 2. Armor
    let maxHp = 100;
    if (eq.armor) {
      if (eq.armor.hpBonus) maxHp += eq.armor.hpBonus;
      if (eq.armor.moveBonus) this.player.speed += 3.2 * eq.armor.moveBonus;
      if (eq.armor.regenBonus) this.player.hpRegen = eq.armor.regenBonus;
    }
    this.player.maxHp = maxHp;
    this.updateHpBar();

    // 3. Shield
    if (eq.shield) {
      if (eq.shield.dmgRedBonus) this.player.dmgReduction = eq.shield.dmgRedBonus;
      if (eq.shield.shieldInterval) this.player.shieldInterval = eq.shield.shieldInterval;
    }

    this.updateEquipHud();
  }

  openEquipmentModal(tier = 1) {
    this.isPaused = true;
    const modal = document.getElementById('equipment-modal');
    const container = document.getElementById('equip-options');
    container.innerHTML = '';

    // Pick 3 random equipment candidates
    const allEquips = Object.values(GAME_DATA.equipments);
    const pool = allEquips.filter(e => e.tier <= tier).sort(() => 0.5 - Math.random()).slice(0, 3);

    pool.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.borderColor = item.color;
      card.style.background = `radial-gradient(circle, ${item.color}22 0%, #0f172a 80%)`;

      const slotNames = { weapon: '무기', armor: '갑옷', shield: '방패' };
      const curEquipped = this.player.equipments[item.slot];
      const curText = curEquipped ? `(현재: ${curEquipped.name})` : '(현재: 미착용)';

      card.innerHTML = `
        <div class="card-icon" style="color:${item.color}; border-color:${item.color};">${item.icon}</div>
        <div class="card-info">
          <div style="font-size:10px; color:${item.color}; font-weight:bold;">[${slotNames[item.slot]}] ${curText}</div>
          <h4>${item.name}</h4>
          <p>${item.desc}</p>
        </div>
      `;

      card.onclick = () => {
        this.equipItem(item);
        modal.style.display = 'none';
        this.isPaused = false;
        this.audio.playExplosion();
      };

      container.appendChild(card);
    });

    modal.style.display = 'flex';

    if (this.autoPlay) {
      setTimeout(() => {
        const firstCard = container.querySelector('.card');
        if (firstCard) firstCard.click();
      }, 700);
    }
  }

  equipItem(item) {
    this.player.equipments[item.slot] = item;
    this.applyPassives();
    this.updateEquipHud();
  }

  updateEquipHud() {
    const eq = this.player.equipments;
    const slotW = document.getElementById('slot-weapon');
    const slotA = document.getElementById('slot-armor');
    const slotS = document.getElementById('slot-shield');

    if (slotW) {
      if (eq.weapon) {
        slotW.innerHTML = `<span>${eq.weapon.icon}</span><span class="lvl" style="color:${eq.weapon.color};">${eq.weapon.name.slice(0, 4)}..</span>`;
        slotW.style.borderColor = eq.weapon.color;
      } else {
        slotW.innerHTML = `<span>🗡️</span><span class="lvl" style="color:#38bdf8;">무기</span>`;
      }
    }

    if (slotA) {
      if (eq.armor) {
        slotA.innerHTML = `<span>${eq.armor.icon}</span><span class="lvl" style="color:${eq.armor.color};">${eq.armor.name.slice(0, 4)}..</span>`;
        slotA.style.borderColor = eq.armor.color;
      } else {
        slotA.innerHTML = `<span>🥋</span><span class="lvl" style="color:#10b981;">갑옷</span>`;
      }
    }

    if (slotS) {
      if (eq.shield) {
        slotS.innerHTML = `<span>${eq.shield.icon}</span><span class="lvl" style="color:${eq.shield.color};">${eq.shield.name.slice(0, 4)}..</span>`;
        slotS.style.borderColor = eq.shield.color;
      } else {
        slotS.innerHTML = `<span>🛡️</span><span class="lvl" style="color:#f59e0b;">방패</span>`;
      }
    }
  }

  // =========================================================================
  // AI Co-op Teammates (Customizable Jobs: Swordsman, Archer, Summoner)
  // =========================================================================
  initAiTeammates() {
    this.aiTeammatesPool = [
      {
        id: 'bot_1',
        defaultName: '첫째 (AI)',
        name: '첫째 (AI)',
        x: this.player ? this.player.x + 90 : 2400,
        y: this.player ? this.player.y - 70 : 2400,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.1,
        angleOffset: 0.8,
        skillTimer: 0
      },
      {
        id: 'bot_2',
        defaultName: '둘째 (AI)',
        name: '둘째 (AI)',
        x: this.player ? this.player.x - 90 : 2400,
        y: this.player ? this.player.y + 80 : 2400,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.0,
        angleOffset: 2.8,
        skillTimer: 0
      },
      {
        id: 'bot_3',
        defaultName: '셋째 (AI)',
        name: '셋째 (AI)',
        x: this.player ? this.player.x + 110 : 2400,
        y: this.player ? this.player.y + 70 : 2400,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.2,
        angleOffset: 4.8,
        skillTimer: 0
      }
    ];

    // 사용자가 선택한 직업 설정 적용 (기본값: 동료1=광전사, 동료2=스나이퍼, 동료3=마검사)
    const savedJobs = (typeof window !== 'undefined' && window.aiTeammatesJobConfig) || ['berserker', 'sniper', 'magic_swordsman'];
    this.setAiBotJob(0, savedJobs[0] || 'berserker');
    this.setAiBotJob(1, savedJobs[1] || 'sniper');
    this.setAiBotJob(2, savedJobs[2] || 'magic_swordsman');

    const count = typeof window !== 'undefined' && window.aiTeammatesCount !== undefined ? window.aiTeammatesCount : 2;
    this.setAiTeammatesCount(count);
  }

  // 🤖 AI 동료 봇 직업 실시간 변경
  setAiBotJob(botIndex, presetKey) {
    if (!this.aiTeammatesPool || !this.aiTeammatesPool[botIndex]) return;
    const bot = this.aiTeammatesPool[botIndex];
    const presets = {
      berserker: { classId: 'warrior', subId: 'berserker', name: '광전사', icon: '⚔️', color: '#ef4444', isMelee: true },
      paladin: { classId: 'warrior', subId: 'paladin', name: '성기사', icon: '🛡️', color: '#facc15', isMelee: true },
      magic_swordsman: { classId: 'warrior', subId: 'magic_swordsman', name: '마검사', icon: '🔮', color: '#c084fc', isMelee: true },
      sniper: { classId: 'archer', subId: 'sniper', name: '스나이퍼', icon: '🎯', color: '#06b6d4', isMelee: false },
      windrunner: { classId: 'archer', subId: 'windrunner', name: '윈드러너', icon: '🌪️', color: '#10b981', isMelee: false },
      trapper: { classId: 'archer', subId: 'trapper', name: '트래퍼', icon: '🐾', color: '#f59e0b', isMelee: false },
      ignis: { classId: 'summoner', subId: 'ignis', name: '이그니스', icon: '🔥', color: '#f97316', isMelee: false, petId: 'ignis' },
      bolt: { classId: 'summoner', subId: 'bolt', name: '테슬라', icon: '⚡', color: '#38bdf8', isMelee: false, petId: 'bolt' },
      sylph: { classId: 'summoner', subId: 'sylph', name: '실피르', icon: '🍃', color: '#4ade80', isMelee: false, petId: 'sylph' }
    };
    const preset = presets[presetKey] || presets.berserker;

    bot.presetKey = presetKey;
    bot.heroClass = preset.classId;
    bot.subclassId = preset.subId;
    bot.subclass = preset.subId;
    bot.color = preset.color;
    bot.name = `${bot.defaultName} (${preset.icon} ${preset.name})`;
    bot.isMelee = preset.isMelee;

    if (preset.classId === 'summoner') {
      const petDef = (typeof GAME_DATA !== 'undefined' && GAME_DATA.pets && GAME_DATA.pets[preset.petId]) || null;
      bot.petConfig = petDef;
      bot.pet = {
        x: bot.x - bot.facing * 28,
        y: bot.y - 10,
        facing: bot.facing,
        tier: this.pet ? this.pet.tier : 1,
        config: petDef
      };
    } else {
      bot.petConfig = null;
      bot.pet = null;
    }

    if (this.peers && this.peers[bot.id]) {
      this.peers[bot.id].name = bot.name;
      this.peers[bot.id].player.heroClass = bot.heroClass;
      this.peers[bot.id].player.subclass = bot.subclassId;
      this.peers[bot.id].pet = bot.pet;
    }
  }

  setAiTeammatesCount(count) {
    if (!this.aiTeammatesPool) return;
    this.aiTeammates = this.aiTeammatesPool.slice(0, count);
    this.aiTeammatesEnabled = count > 0;

    // Clean up unselected peers
    if (this.peers) {
      ['bot_1', 'bot_2', 'bot_3'].forEach(id => {
        if (!this.aiTeammates.some(b => b.id === id)) {
          delete this.peers[id];
        }
      });
    }

    const btn = document.getElementById('btn-ai-team');
    if (btn) {
      btn.textContent = count > 0 ? `🤖 AI ${count + 1}인 파티: ON` : `🤖 AI 파티: OFF`;
      btn.style.background = count > 0 ? '#7c3aed' : '#1e293b';
    }
  }

  updateAiTeammates(dt) {
    if (!this.aiTeammates || !this.aiTeammatesEnabled || !this.player) return;

    this.aiTeammates.forEach((bot, idx) => {
      // 1. AI 이동 기동 (검사=근접 돌진 / 궁수·소환사=원거리 카이팅)
      const orbitSpeed = 0.5;
      const orbitDist = 120 + idx * 30;
      const curAng = this.gameTime * orbitSpeed + bot.angleOffset;
      let targetX = this.player.x + Math.cos(curAng) * orbitDist;
      let targetY = this.player.y + Math.sin(curAng) * orbitDist;

      // 가장 가까운 적 탐색
      const nearestEnemy = this.getNearestEnemy(bot.x, bot.y);
      const enemyDist = nearestEnemy ? Math.hypot(nearestEnemy.x - bot.x, nearestEnemy.y - bot.y) : 9999;

      if (bot.isMelee && nearestEnemy && enemyDist < 260) {
        // ⚔️ 검사 AI: 적에게 근접 돌진 (사거리 50~65px 안쪽으로 파고듦!)
        const approachAng = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
        targetX = nearestEnemy.x - Math.cos(approachAng) * 55;
        targetY = nearestEnemy.y - Math.sin(approachAng) * 55;
        bot.facing = nearestEnemy.x >= bot.x ? 1 : -1;
      } else if (!bot.isMelee && nearestEnemy && enemyDist < 130) {
        // 🏹 궁수/소환사 AI: 적이 너무 가까우면 뒤로 빠지는 카이팅
        const fleeAng = Math.atan2(bot.y - nearestEnemy.y, bot.x - nearestEnemy.x);
        targetX = bot.x + Math.cos(fleeAng) * 80;
        targetY = bot.y + Math.sin(fleeAng) * 80;
        bot.facing = nearestEnemy.x >= bot.x ? 1 : -1;
      }

      // 봇이 호수나 산맥에 가로막혀 플레이어와 시야/이동선이 끊겼거나 거리가 130px 이상 벌어졌을 때 안전 육지로 즉시 재집결
      const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
      const isPathOpen = this.hasLineOfSight(bot.x, bot.y, this.player.x, this.player.y, 35);
      if (distToPlayer > 350 || (!isPathOpen && distToPlayer > 130)) {
        for (let rad = 45; rad <= 120; rad += 25) {
          const angle = (idx * Math.PI * 0.6) + Math.random() * 0.4;
          const testX = this.player.x + Math.cos(angle) * rad;
          const testY = this.player.y + Math.sin(angle) * rad;
          if (this.isPassable(testX, testY, 14)) {
            bot.x = testX;
            bot.y = testY;
            break;
          }
        }
      }

      const stepX = (targetX - bot.x) * 0.08 * 60 * dt;
      const stepY = (targetY - bot.y) * 0.08 * 60 * dt;
      let botMovedX = false;
      let botMovedY = false;

      if (this.isPassable(bot.x + stepX, bot.y, 14)) {
        bot.x += stepX;
        botMovedX = true;
      }
      if (this.isPassable(bot.x, bot.y + stepY, 14)) {
        bot.y += stepY;
        botMovedY = true;
      }

      // 봇 벽면 슬라이딩
      if (!botMovedX && Math.abs(stepX) > 0.1 && Math.abs(stepY) < 0.1) {
        const slide = Math.abs(stepX) * 0.7;
        if (this.isPassable(bot.x, bot.y + slide, 14)) bot.y += slide;
        else if (this.isPassable(bot.x, bot.y - slide, 14)) bot.y -= slide;
      } else if (!botMovedY && Math.abs(stepY) > 0.1 && Math.abs(stepX) < 0.1) {
        const slide = Math.abs(stepY) * 0.7;
        if (this.isPassable(bot.x + slide, bot.y, 14)) bot.x += slide;
        else if (this.isPassable(bot.x - slide, bot.y, 14)) bot.x -= slide;
      }

      if (!bot.isMelee && Math.abs(stepX) > 0.1) {
        bot.facing = stepX > 0 ? 1 : -1;
      }

      // 소환사 봇이면 펫 따라오기
      if (bot.pet) {
        bot.pet.x += (bot.x - bot.facing * 28 - bot.pet.x) * 8 * dt;
        bot.pet.y += (bot.y - 10 - bot.pet.y) * 8 * dt;
        bot.pet.facing = bot.facing;
        bot.pet.tier = this.pet ? this.pet.tier : 1;
      }

      // 2. Bot Skill Auto-Cast (검사는 0.7초마다 초근접 베기, 궁수는 1.0초마다 사격)
      bot.skillTimer += dt;
      const skillCd = bot.isMelee ? 0.75 : 1.05;
      if (bot.skillTimer >= skillCd) {
        bot.skillTimer = 0;
        this.castBotSkill(bot);
      }

      // 3. Register to engine.peers for Renderer & Off-screen Indicators
      if (!this.peers) this.peers = {};
      this.peers[bot.id] = {
        name: bot.name,
        player: {
          x: bot.x,
          y: bot.y,
          hp: bot.hp,
          facing: bot.facing,
          heroClass: bot.heroClass,
          subclass: bot.subclassId,
          tier: this.pet ? this.pet.tier : 1
        },
        pet: bot.pet
      };
    });
  }

  castBotSkill(bot) {
    const faceAngle = bot.facing === 1 ? 0 : Math.PI;
    const might = (this.pet && this.pet.might) ? this.pet.might : 1.0;

    // --- [1] ⚔️ 검사 계열 AI 공격 (초근접 부채꼴 검기 & 넉백) ---
    // [1-1] 🩸 광전사 (버서커): 대검 쾌참
    if (bot.subclassId === 'berserker') {
      const range = 85;
      this.addSlashEffect(bot.x, bot.y, faceAngle, range, '#ef4444', Math.PI * 0.88, 20, 0.16);
      this.audio.playShoot();
      this.enemies.forEach(e => {
        const dx = e.x - bot.x;
        const dy = e.y - bot.y;
        if (Math.hypot(dx, dy) <= range + (e.radius || 15)) {
          let diff = Math.abs(Math.atan2(dy, dx) - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= (Math.PI * 0.88) / 2) {
            e.takeDamage(48 * might);
            e.x += Math.cos(faceAngle) * 35;
            e.y += Math.sin(faceAngle) * 35;
          }
        }
      });
    }

    // [1-2] 🛡️ 성기사 (팔라딘): 방패 강타
    else if (bot.subclassId === 'paladin') {
      const range = 75;
      this.addSlashEffect(bot.x, bot.y, faceAngle, range, '#fbbf24', Math.PI * 0.72, 26, 0.2);
      this.audio.playExplosion();
      this.enemies.forEach(e => {
        const dx = e.x - bot.x;
        const dy = e.y - bot.y;
        if (Math.hypot(dx, dy) <= range + (e.radius || 15)) {
          let diff = Math.abs(Math.atan2(dy, dx) - faceAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= (Math.PI * 0.72) / 2) {
            e.takeDamage(42 * might);
            e.x += Math.cos(faceAngle) * 50;
            e.y += Math.sin(faceAngle) * 50;
          }
        }
      });
    }

    // [1-3] 🔮 마검사: 마검 회전참
    else if (bot.subclassId === 'magic_swordsman') {
      const range = 85;
      this.addSlashEffect(bot.x, bot.y, this.gameTime * 6, range, '#c084fc', Math.PI * 2, 18, 0.18);
      this.audio.playShoot();
      this.enemies.forEach(e => {
        const dx = e.x - bot.x;
        const dy = e.y - bot.y;
        if (Math.hypot(dx, dy) <= range + (e.radius || 15)) {
          e.takeDamage(40 * might);
          const ang = Math.atan2(dy, dx);
          e.x += Math.cos(ang) * 25;
          e.y += Math.sin(ang) * 25;
        }
      });
    }

    // --- [2] 🏹 궁수 계열 AI 공격 (원거리 타겟팅 투사체) ---
    // [2-1] 🎯 스나이퍼: 관통 레이저 저격 빔
    else if (bot.subclassId === 'sniper') {
      const target = this.getNearestEnemy(bot.x, bot.y);
      const ang = target ? Math.atan2(target.y - bot.y, target.x - bot.x) : faceAngle;
      bot.facing = (target && target.x < bot.x) ? -1 : 1;
      this.projectiles.push(new EngineProjectile(
        bot.x, bot.y,
        Math.cos(ang) * 20, Math.sin(ang) * 20,
        45 * might, 999, 'sniper_beam'
      ));
      this.audio.playShoot();
    }

    // [2-2] 🌪️ 윈드러너: 3연발 고속 질풍 화살
    else if (bot.subclassId === 'windrunner') {
      const target = this.getNearestEnemy(bot.x, bot.y);
      const baseAng = target ? Math.atan2(target.y - bot.y, target.x - bot.x) : faceAngle;
      bot.facing = (target && target.x < bot.x) ? -1 : 1;
      for (let i = 0; i < 3; i++) {
        const ang = baseAng + (i - 1) * 0.14;
        this.projectiles.push(new EngineProjectile(
          bot.x, bot.y,
          Math.cos(ang) * 12, Math.sin(ang) * 12,
          15 * might, 2, 'rapid_arrow'
        ));
      }
      this.audio.playShoot();
    }

    // [2-3] 🐾 트래퍼: 마법 폭발 덫
    else if (bot.subclassId === 'trapper') {
      const target = this.getNearestEnemy(bot.x, bot.y);
      const tx = target ? target.x + (Math.random() - 0.5) * 30 : bot.x + Math.cos(faceAngle) * 70;
      const ty = target ? target.y + (Math.random() - 0.5) * 30 : bot.y;
      const trap = new EngineProjectile(tx, ty, 0, 0, 55 * might, 1, 'trap');
      trap.life = 10.0;
      trap.explodeRadius = 90;
      this.projectiles.push(trap);
      this.audio.playShoot();
    }

    // --- [3] 🧙 소환사 계열 AI 공격 (소환수 협공) ---
    // [3-1] 🔥 이그니스: 화염구 발사
    else if (bot.subclassId === 'ignis' || (bot.petConfig && bot.petConfig.element === 'fire')) {
      const px = bot.pet ? bot.pet.x : bot.x;
      const py = bot.pet ? bot.pet.y : bot.y;
      const target = this.getNearestEnemy(px, py);
      if (target) {
        const ang = Math.atan2(target.y - py, target.x - px);
        this.projectiles.push(new EngineProjectile(
          px, py,
          Math.cos(ang) * 8.0, Math.sin(ang) * 8.0,
          24 * might, 1, 'fireball'
        ));
        this.audio.playShoot();
      }
    }

    // [3-2] ⚡ 테슬라: 체인 라이트닝
    else if (bot.subclassId === 'bolt' || (bot.petConfig && bot.petConfig.element === 'lightning')) {
      const px = bot.pet ? bot.pet.x : bot.x;
      const py = bot.pet ? bot.pet.y : bot.y;
      const enemies = this.getEnemiesInRange(px, py, 220);
      if (enemies.length > 0) {
        let prev = { x: px, y: py };
        const hits = Math.min(enemies.length, 3);
        for (let i = 0; i < hits; i++) {
          const tgt = enemies[i];
          tgt.takeDamage(20 * might);
          this.lightningBolts.push({ x1: prev.x, y1: prev.y, x2: tgt.x, y2: tgt.y, life: 0.15 });
          prev = tgt;
        }
        this.audio.playShoot();
      }
    }

    // [3-3] 🍃 실피르: 가시 장판 & 잎사귀
    else if (bot.subclassId === 'sylph' || (bot.petConfig && bot.petConfig.element === 'nature')) {
      const px = bot.pet ? bot.pet.x : bot.x;
      const py = bot.pet ? bot.pet.y : bot.y;
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - px, e.y - py) < 85) {
          e.takeDamage(16 * might);
        }
      });
      const target = this.getNearestEnemy(px, py);
      if (target) {
        const ang = Math.atan2(target.y - py, target.x - px);
        this.projectiles.push(new EngineProjectile(
          px, py,
          Math.cos(ang) * 7.5, Math.sin(ang) * 7.5,
          18 * might, 3, 'leaf_blade'
        ));
      }
    }
  }

  // =========================================================================
  // Auto-Pilot Player System (내 캐릭터 자동 회피 / 사냥 / 방치 플레이)
  // =========================================================================
  computeAutoPlayVector() {
    let vx = 0;
    let vy = 0;

    // 1. 근접 적 회피 및 카이팅 (Repulsion from close enemies)
    this.enemies.forEach(e => {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < 170 && d > 0.001) {
        const force = (170 - d) / 170;
        vx -= ((e.x - this.player.x) / d) * force * 3.5;
        vy -= ((e.y - this.player.y) / d) * force * 3.5;
      }
    });

    // 2. 🌊/⛰️ 지형 장애물(물, 산맥) 능동 척력 필드 (Obstacle Repulsion Field)
    // 캐릭터가 물이나 산맥 42px 이내에 접근하면 반대 방향으로 부드럽게 밀어내어 가장자리 끼임 원천 차단
    const probeR = 42;
    const probeDirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 }, { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }
    ];
    for (let i = 0; i < probeDirs.length; i++) {
      const pd = probeDirs[i];
      if (!this.isPassable(this.player.x + pd.x * probeR, this.player.y + pd.y * probeR, 12)) {
        vx -= pd.x * 2.8;
        vy -= pd.y * 2.8;
      }
    }

    // Clean up expired unreachable chests
    if (!this.unreachableChests) this.unreachableChests = new Map();
    for (const [chest, expireTime] of this.unreachableChests.entries()) {
      if (this.gameTime > expireTime || !this.chests.includes(chest)) {
        this.unreachableChests.delete(chest);
      }
    }

    // 3. 목표물 탐색 (반드시 물/산맥을 건너지 않고 직접 걸어갈 수 있는 직선 시야 확보 대상만 타겟팅!)
    let target = null;
    let minD = Infinity;

    // [3-1] 보물상자 우선 (물 건너편에 있는 상자는 무시하여 갇힘 방지)
    if (this.chests && this.chests.length > 0) {
      for (let i = 0; i < this.chests.length; i++) {
        const c = this.chests[i];
        if (this.unreachableChests.has(c)) continue;
        const d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
        if (d < 1200 && d < minD && this.hasLineOfSight(this.player.x, this.player.y, c.x, c.y, 32)) {
          minD = d;
          target = c;
          this.currentTargetChest = c;
        }
      }
    }

    // [3-2] 경험치 보석 탐색 (호수 건너편 보석은 타겟팅하지 않고 내 육지 쪽 보석만 획득!)
    if (!target && this.gems.length > 0) {
      this.currentTargetChest = null;
      for (let i = 0; i < Math.min(this.gems.length, 50); i++) {
        const g = this.gems[i];
        const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (d < minD && this.hasLineOfSight(this.player.x, this.player.y, g.x, g.y, 28)) {
          minD = d;
          target = g;
        }
      }
    }

    // [3-3] 보석이나 상자가 시야 내에 없으면, 직선 이동 가능한 적 사냥으로 전진
    if (!target) {
      for (let i = 0; i < Math.min(this.enemies.length, 25); i++) {
        const e = this.enemies[i];
        const ed = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (ed > 160 && ed < 550 && this.hasLineOfSight(this.player.x, this.player.y, e.x, e.y, 32)) {
          vx += ((e.x - this.player.x) / ed) * 1.3;
          vy += ((e.y - this.player.y) / ed) * 1.3;
          break;
        }
      }
    }

    if (target) {
      const td = Math.hypot(target.x - this.player.x, target.y - this.player.y);
      if (td > 0.001) {
        vx += ((target.x - this.player.x) / td) * 1.8;
        vy += ((target.y - this.player.y) / td) * 1.8;
      }
    }

    // 4. 탈출(Detour) 우회 기동 절대 우선권 적용 (다른 힘 무시하고 탈출로로 전력 질주)
    if (this.autoDetourTimer > 0) {
      vx = Math.cos(this.autoDetourAngle) * 4.5;
      vy = Math.sin(this.autoDetourAngle) * 4.5;
    }

    // 5. 🧭 전방 지형 레이캐스트 장애물 감지 및 접선 우회 (Smart Obstacle Tangent Steering)
    const mag = Math.hypot(vx, vy);
    if (mag > 0.05) {
      let normVx = vx / mag;
      let normVy = vy / mag;
      const baseAng = Math.atan2(normVy, normVx);

      // 전방 35px 앞 지형 진입 가능 여부 레이캐스트 검사
      const probeDist = 35;
      const isAheadPassable = this.isPassable(
        this.player.x + Math.cos(baseAng) * probeDist,
        this.player.y + Math.sin(baseAng) * probeDist,
        14
      );

      if (!isAheadPassable) {
        // 전방에 산지나 물이 있으면 좌우 45°, 90°, 135° 방향 중 최적의 통과각 탐색
        const testOffsets = [
          Math.PI / 4, -Math.PI / 4,
          Math.PI / 2, -Math.PI / 2,
          Math.PI * 3 / 4, -Math.PI * 3 / 4,
          Math.PI
        ];
        let bestAng = null;
        for (let i = 0; i < testOffsets.length; i++) {
          const testA = baseAng + testOffsets[i];
          if (this.isPassable(
            this.player.x + Math.cos(testA) * probeDist,
            this.player.y + Math.sin(testA) * probeDist,
            14
          )) {
            bestAng = testA;
            break;
          }
        }
        if (bestAng !== null) {
          normVx = Math.cos(bestAng);
          normVy = Math.sin(bestAng);
        }
      }

      return { x: normVx, y: normVy };
    }
    return { x: 0, y: 0 };
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    const btn = document.getElementById('btn-auto-play');
    if (btn) {
      btn.textContent = this.autoPlay ? '⚡ 오토 플레이: ON' : '⚡ 오토 플레이: OFF';
      btn.style.background = this.autoPlay ? '#059669' : '#1e293b';
      btn.style.borderColor = this.autoPlay ? '#34d399' : '#475569';
    }
  }

  toggleAiTeammates() {
    this.aiTeammatesEnabled = !this.aiTeammatesEnabled;
    if (!this.aiTeammatesEnabled) {
      delete this.peers['bot_1'];
      delete this.peers['bot_2'];
    }
    const btn = document.getElementById('btn-ai-team');
    if (btn) {
      btn.textContent = this.aiTeammatesEnabled ? '🤖 AI 3인 파티: ON' : '🤖 AI 3인 파티: OFF';
      btn.style.background = this.aiTeammatesEnabled ? '#7c3aed' : '#1e293b';
      btn.style.borderColor = this.aiTeammatesEnabled ? '#a78bfa' : '#475569';
    }
  }

  toggleTimeScale() {
    const scales = [1.0, 2.0, 5.0, 10.0];
    const curIdx = scales.indexOf(this.timeScale || 1.0);
    const nextIdx = (curIdx + 1) % scales.length;
    this.timeScale = scales[nextIdx];

    const btn = document.getElementById('btn-speed');
    if (btn) {
      btn.textContent = `⏩ ${this.timeScale}x 배속`;
      btn.style.background = this.timeScale > 1 ? '#d97706' : '#1e293b';
      btn.style.borderColor = this.timeScale > 1 ? '#fbbf24' : '#475569';
    }
  }

  gameClear() {
    this.isPaused = true;
    this.audio.playExplosion();

    // Massive Victory fireworks
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 380;
      this.particles.push({
        x: this.player.x + Math.cos(a) * d,
        y: this.player.y + Math.sin(a) * d,
        color: ['#facc15', '#38bdf8', '#ef4444', '#4ade80', '#e879f9'][Math.floor(Math.random() * 5)],
        life: 2.5,
        maxLife: 2.5,
        size: 8
      });
    }

    const modal = document.getElementById('game-clear-modal');
    if (modal) {
      const m = Math.floor(this.gameTime / 60);
      const s = Math.floor(this.gameTime % 60);
      document.getElementById('clear-time').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      document.getElementById('clear-kills').textContent = this.killCount;
      document.getElementById('clear-lvl').textContent = `Lv.${this.currentLvl}`;
      document.getElementById('clear-pet').textContent = `${this.pet.config.name} (${this.pet.tier}차 각성)`;
      modal.style.display = 'flex';
    }
  }

  hasSkill(sId) {
    return !!(this.pet && this.pet.skills && this.pet.skills[sId]);
  }

  getNearestEnemy(x, y) {
    let nearest = null;
    let minDst = Infinity;
    this.enemies.forEach(e => {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDst) { minDst = d; nearest = e; }
    });
    return nearest;
  }

  getEnemiesInRange(x, y, range) {
    return this.enemies.filter(e => Math.hypot(e.x - x, e.y - y) <= range);
  }

  getRandomEnemies(count) {
    if (this.enemies.length === 0) return [];
    const shuffled = [...this.enemies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  updateHUD() {
    if (!this.player || !this.pet) return;
    const styleTag = this.pet.combatStyle === 'melee' ? ' [⚔️근거리]' : ' [🏹원거리]';
    document.getElementById('pet-badge').textContent = `${this.pet.config.icon} ${this.pet.config.name}${styleTag} (Lv.${this.pet.level})`;
    document.getElementById('lvl-display').textContent = this.currentLvl;
    this.updateHpBar();
    this.updateExpBar();
    this.updateWeaponHud();
  }

  updateHpBar() {
    const pct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    document.getElementById('hp-fill').style.width = pct + '%';
    document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
  }

  updateExpBar() {
    const pct = Math.min(100, (this.currentExp / this.neededExp) * 100);
    document.getElementById('exp-bar-fill').style.width = pct + '%';
    document.getElementById('exp-text').textContent = `EXP ${this.currentExp} / ${this.neededExp}`;
  }

  updateHUDTimer() {
    const m = Math.floor(this.gameTime / 60);
    const s = Math.floor(this.gameTime % 60);
    document.getElementById('time-display').textContent =
      `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateWeaponHud() {
    const container = document.getElementById('weapons-hud');
    container.innerHTML = '';

    for (const id in this.pet.skills) {
      const def = GAME_DATA.skills[id];
      const lvl = this.pet.skills[id].level;
      if (!def) continue;
      const el = document.createElement('div');
      el.className = 'weapon-badge';
      el.innerHTML = `<span>${def.icon}</span><span class="lvl">Lv.${lvl}</span>`;
      container.appendChild(el);
    }

    for (const id in this.pet.passives) {
      const def = GAME_DATA.passives[id];
      const lvl = this.pet.passives[id];
      if (!def) continue;
      const el = document.createElement('div');
      el.className = 'weapon-badge';
      el.style.borderColor = '#10b981';
      el.innerHTML = `<span>${def.icon}</span><span class="lvl" style="color:#10b981;">Lv.${lvl}</span>`;
      container.appendChild(el);
    }
  }

  updateUltimateUI() {
    const btn = document.getElementById('btn-ultimate');
    const cdFill = document.getElementById('ult-cd-overlay');
    const text = document.getElementById('ult-text');
    const icon = document.getElementById('ult-icon');
    if (!btn || !this.pet) return;

    const ult = this.pet.config.ultimate;
    if (ult) {
      if (icon) icon.textContent = ult.icon;
    }

    const pct = Math.min(1.0, this.ultimateTimer / this.ultimateMaxCd);
    if (pct >= 1.0) {
      btn.classList.add('ready');
      if (cdFill) cdFill.style.height = '0%';
      if (text) text.textContent = 'READY!';
    } else {
      btn.classList.remove('ready');
      const rem = Math.ceil(this.ultimateMaxCd - this.ultimateTimer);
      if (cdFill) cdFill.style.height = `${(1 - pct) * 100}%`;
      if (text) text.textContent = `${rem}s`;
    }
  }

  bindEvents() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this.audio.init();

      // Spacebar to trigger ultimate
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerUltimate();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', e => {
      this.audio.init();
      this.mouse.isDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousemove', e => {
      if (this.mouse.isDown) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }
    });
    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });
  }
}

class EngineProjectile {
  constructor(x, y, vx, vy, damage, pierce, kind) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.damage = damage; this.pierce = pierce; this.kind = kind;
    this.life = 1.8;
  }
  update(dt) {
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
    this.life -= dt;
  }
}

class EngineEnemy {
  constructor(x, y, type, def, engine) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.engine = engine;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.radius = def.radius;
    this.damage = def.damage;
    this.exp = def.exp;
    this.color = def.color;
    this.flash = 0;
    this.slowTimer = 0;
    this.slowRate = 1.0;
  }

  update(dt, player) {
    if (this.flash > 0) this.flash -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;

    // Follow Tamer with slow debuff considered
    const curSpeed = this.speed * (this.slowTimer > 0 ? (this.slowRate || 0.6) : 1.0);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.001) {
      const stepX = (dx / dist) * curSpeed * 60 * dt;
      const stepY = (dy / dist) * curSpeed * 60 * dt;

      // ⛰️ 산지 및 🌊 물 지형 몹 진입 차단 (X/Y 독립 슬라이딩)
      if (this.engine.isPassable(this.x + stepX, this.y, this.radius)) {
        this.x += stepX;
      }
      if (this.engine.isPassable(this.x, this.y + stepY, this.radius)) {
        this.y += stepY;
      }
    }

    if (dist < this.radius + 12) {
      // Invincibility check during Ultimate
      if (player.isInvincible) {
        // If Thunder Dash, damage enemy on hit!
        if (this.engine.pet.config.element === 'lightning') {
          this.takeDamage(45);
        }
        return;
      }

      // Shield barrier blocks hit completely
      if (player.shieldBarrier > 0) {
        player.shieldBarrier--;
        player.isInvincible = true;
        setTimeout(() => { player.isInvincible = false; }, 300);
        this.engine.audio.playExplosion();
        return;
      }

      const effectiveDmg = this.damage * (1 - (player.dmgReduction || 0));
      player.hp -= effectiveDmg * dt * 2.5;
      if (player.hp <= 0) {
        player.hp = 0;
        alert(`☠️ 테이머가 쓰러졌습니다!\n생존 시간: ${document.getElementById('time-display').textContent}\n처치 수: ${this.engine.killCount}`);
        openPetSelectModal();
      }
      this.engine.updateHpBar();
    }
  }

  takeDamage(amt) {
    // Critical Hit Check from four_leaf_clover passive
    const critRate = this.engine.pet ? (this.engine.pet.critRate || 0.05) : 0.05;
    const isCrit = Math.random() < critRate;
    const finalAmt = isCrit ? amt * 2 : amt;

    this.hp -= finalAmt;
    this.flash = 0.12;
    this.engine.audio.playHit();

    this.engine.damageNumbers.push({
      x: this.x + (Math.random() - 0.5) * 14,
      y: this.y - 12,
      val: isCrit ? `💥${Math.round(finalAmt)}` : finalAmt,
      life: isCrit ? 0.65 : 0.5,
      color: isCrit ? '#f97316' : '#facc15'
    });

    if (this.hp <= 0) {
      this.engine.killCount++;
      document.getElementById('kill-display').textContent = this.engine.killCount;
      let dropX = this.x;
      let dropY = this.y;
      if (!this.engine.isPassable(dropX, dropY, 14)) {
        const ang = Math.atan2(this.engine.player.y - dropY, this.engine.player.x - dropX);
        for (let d = 20; d <= 240; d += 20) {
          const tx = dropX + Math.cos(ang) * d;
          const ty = dropY + Math.sin(ang) * d;
          if (this.engine.isPassable(tx, ty, 14)) {
            dropX = tx;
            dropY = ty;
            break;
          }
        }
      }

      this.engine.gems.push(new EngineGem(dropX, dropY, this.exp));

      // Drop Equipment Chest from Elite or Boss
      const def = GAME_DATA.monsters[this.type];
      if (def && (def.isElite || def.isBoss)) {
        const tier = def.isBoss ? 3 : (this.type.includes('reaper') || this.type.includes('fire_golem') ? 2 : 1);
        this.engine.chests.push(new EngineChest(dropX, dropY, tier));
      }

      // Check Final Boss Defeat -> VICTORY GAME CLEAR!
      if (this.type === 'final_dragon_baal') {
        this.engine.gameClear();
        return;
      }

      for (let i = 0; i < 4; i++) {
        this.engine.particles.push({
          x: this.x, y: this.y,
          color: this.color,
          life: 0.25, maxLife: 0.25,
          size: 3
        });
      }
    }
  }
}

class EngineChest {
  constructor(x, y, tier = 1) {
    this.x = x;
    this.y = y;
    this.tier = tier;
    this.radius = 18;
    this.color = tier === 3 ? '#facc15' : (tier === 2 ? '#38bdf8' : '#e2e8f0');
  }
}

class EngineGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = value >= 50 ? 8 : (value >= 5 ? 6 : 4);
    this.color = value >= 50 ? '#facc15' : (value >= 5 ? '#ef4444' : '#38bdf8');
  }

  update(dt, player, magnetRange, onCollect) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < magnetRange) {
      const speed = (magnetRange - dist + 160) * 3;
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;

      if (dist < 18) {
        onCollect(this);
        return false;
      }
    }
    return true;
  }
}
