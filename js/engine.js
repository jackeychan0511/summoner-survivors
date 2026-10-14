/* ==========================================================================
   js/engine.js - Core Game Engine & Tamer-Pet Mechanics
   주인공 컨트롤, 펫 추종 물리, 자동 스킬 발사, 펫 전직 및 레벨업 시스템
   ========================================================================== */

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      } catch(e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playShoot() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch(e) {}
  }
  playHit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch(e) {}
  }
  playGem() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freqs = [659, 784, 987, 1318];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch(e) {}
  }
  playLevelUp() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.14);
      });
    } catch(e) {}
  }
  playExplosion() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch(e) {}
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

  // 👑 3대 직업군 (소환사 / 검사 / 궁수) 및 9대 세부 특화 시작
  start(classOrPetId = 'summoner', subclassId = 'ignis', combatStyle = 'ranged') {
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

    this.player.x += dx * this.player.speed * 60 * dt;
    this.player.y += dy * this.player.speed * 60 * dt;

    // World Boundary Clamping (16000 x 16000)
    const worldW = (GAME_DATA.world && GAME_DATA.world.width) || 16000;
    const worldH = (GAME_DATA.world && GAME_DATA.world.height) || 16000;
    this.player.x = Math.max(50, Math.min(worldW - 50, this.player.x));
    this.player.y = Math.max(50, Math.min(worldH - 50, this.player.y));

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

    // Chest Collision Check (Equipment Drops from Mini-Bosses)
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const c = this.chests[i];
      if (Math.hypot(c.x - this.player.x, c.y - this.player.y) < 36) {
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

          const angle = Math.random() * Math.PI * 2;
          const spawnDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
          const bx = this.player.x + Math.cos(angle) * spawnDist;
          const by = this.player.y + Math.sin(angle) * spawnDist;

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
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(this.canvas.width, this.canvas.height) / 2 + 60;
      const sx = this.player.x + Math.cos(angle) * spawnDist;
      const sy = this.player.y + Math.sin(angle) * spawnDist;

      const mDef = GAME_DATA.monsters[currentWave.type] || GAME_DATA.monsters.slime;
      this.enemies.push(new EngineEnemy(sx, sy, currentWave.type, mDef, this));
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

    // [2] 일반 스킬 목록
    Object.keys(GAME_DATA.skills).forEach(sId => {
      const def = GAME_DATA.skills[sId];
      if (def.isEvolved || sId.includes('solar') || sId.includes('judgment') || sId.includes('rebirth')) return;

      const cur = this.pet.skills[sId];
      if (!cur) {
        pool.push({ type: 'skill_new', id: sId, data: def });
      } else if (cur.level < (def.maxLevel || 8)) {
        pool.push({ type: 'skill_up', id: sId, data: def, lvl: cur.level + 1 });
      }
    });

    // [3] 패시브 아이템 목록
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
  // AI Co-op Teammates (Up to 4-Player Simulation with 3 Children Bots)
  // =========================================================================
  initAiTeammates() {
    this.aiTeammatesPool = [
      {
        id: 'bot_1',
        name: '첫째 (AI)',
        x: this.player.x + 90,
        y: this.player.y - 70,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.1,
        angleOffset: 0.8,
        petConfig: GAME_DATA.pets.bolt,
        pet: {
          x: this.player.x + 65,
          y: this.player.y - 70,
          facing: 1,
          tier: 1,
          config: GAME_DATA.pets.bolt
        },
        skillTimer: 0
      },
      {
        id: 'bot_2',
        name: '둘째 (AI)',
        x: this.player.x - 90,
        y: this.player.y + 80,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.0,
        angleOffset: 2.8,
        petConfig: GAME_DATA.pets.sylph,
        pet: {
          x: this.player.x - 115,
          y: this.player.y + 80,
          facing: 1,
          tier: 1,
          config: GAME_DATA.pets.sylph
        },
        skillTimer: 0
      },
      {
        id: 'bot_3',
        name: '셋째 (AI)',
        x: this.player.x + 110,
        y: this.player.y + 70,
        facing: 1,
        hp: 100,
        maxHp: 100,
        speed: 3.2,
        angleOffset: 4.8,
        petConfig: GAME_DATA.pets.ignis,
        pet: {
          x: this.player.x + 135,
          y: this.player.y + 70,
          facing: 1,
          tier: 1,
          config: GAME_DATA.pets.ignis
        },
        skillTimer: 0
      }
    ];

    const count = typeof window !== 'undefined' && window.aiTeammatesCount !== undefined ? window.aiTeammatesCount : 2;
    this.setAiTeammatesCount(count);
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
    if (!this.aiTeammates || !this.aiTeammatesEnabled) return;

    this.aiTeammates.forEach((bot, idx) => {
      // 1. Teammate Movement (Orbit around main player with kiting)
      const orbitSpeed = 0.6;
      const orbitDist = 130 + idx * 25;
      const curAng = this.gameTime * orbitSpeed + bot.angleOffset;
      const desiredX = this.player.x + Math.cos(curAng) * orbitDist;
      const desiredY = this.player.y + Math.sin(curAng) * orbitDist;

      // Enemy avoidance / Kiting
      let avoidX = 0;
      let avoidY = 0;
      this.enemies.forEach(e => {
        const d = Math.hypot(e.x - bot.x, e.y - bot.y);
        if (d < 110 && d > 0.001) {
          avoidX -= (e.x - bot.x) / d;
          avoidY -= (e.y - bot.y) / d;
        }
      });

      const moveX = (desiredX - bot.x) * 0.05 + avoidX * 2.2;
      const moveY = (desiredY - bot.y) * 0.05 + avoidY * 2.2;

      bot.x += moveX * 60 * dt;
      bot.y += moveY * 60 * dt;
      if (moveX > 0.1) bot.facing = 1;
      if (moveX < -0.1) bot.facing = -1;

      // Pet spring follow for AI bot
      bot.pet.x += (bot.x - bot.facing * 28 - bot.pet.x) * 8 * dt;
      bot.pet.y += (bot.y - 10 - bot.pet.y) * 8 * dt;
      bot.pet.facing = bot.facing;

      // Level / Tier scaling based on player level
      bot.pet.tier = this.pet.tier;

      // 2. Bot Skill Auto-Cast
      bot.skillTimer += dt;
      if (bot.skillTimer >= 1.4) {
        bot.skillTimer = 0;
        this.castBotSkill(bot);
      }

      // 3. Register to engine.peers for Renderer & Off-screen Indicators
      if (!this.peers) this.peers = {};
      this.peers[bot.id] = {
        name: bot.name,
        player: { x: bot.x, y: bot.y, hp: bot.hp, facing: bot.facing },
        pet: bot.pet
      };
    });
  }

  castBotSkill(bot) {
    // Bot 1 (Bolt): Chain Lightning
    if (bot.petConfig.element === 'lightning') {
      const enemies = this.getEnemiesInRange(bot.pet.x, bot.pet.y, 220);
      if (enemies.length > 0) {
        let prev = { x: bot.pet.x, y: bot.pet.y };
        const hits = Math.min(enemies.length, 3);
        for (let i = 0; i < hits; i++) {
          const tgt = enemies[i];
          tgt.takeDamage(18 * this.pet.might);
          this.lightningBolts.push({ x1: prev.x, y1: prev.y, x2: tgt.x, y2: tgt.y, life: 0.15 });
          prev = tgt;
        }
      }
    }

    // Bot 2 (Sylph): Thorn Aura Burst
    if (bot.petConfig.element === 'nature') {
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - bot.pet.x, e.y - bot.pet.y) < 85) {
          e.takeDamage(14 * this.pet.might);
        }
      });
    }

    // Bot 3 (Ignis): Fireball Blast
    if (bot.petConfig.element === 'fire') {
      const target = this.getNearestEnemy(bot.pet.x, bot.pet.y);
      if (target) {
        const ang = Math.atan2(target.y - bot.pet.y, target.x - bot.pet.x);
        this.projectiles.push(new EngineProjectile(
          bot.pet.x, bot.pet.y,
          Math.cos(ang) * 7.5, Math.sin(ang) * 7.5,
          20 * this.pet.might, 1, 'fireball'
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

    // 1. Repulsion from close enemies (Evade / Kiting)
    this.enemies.forEach(e => {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < 170 && d > 0.001) {
        const force = (170 - d) / 170;
        vx -= ((e.x - this.player.x) / d) * force * 3.5;
        vy -= ((e.y - this.player.y) / d) * force * 3.5;
      }
    });

    // 2. Attraction towards closest Chest or Exp Gem
    let target = null;
    let minD = Infinity;

    if (this.chests && this.chests.length > 0) {
      target = this.chests[0]; // Priority on treasure chest
    } else if (this.gems.length > 0) {
      for (let i = 0; i < Math.min(this.gems.length, 25); i++) {
        const g = this.gems[i];
        const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (d < minD) { minD = d; target = g; }
      }
    }

    if (target) {
      const td = Math.hypot(target.x - this.player.x, target.y - this.player.y);
      if (td > 0.001) {
        vx += ((target.x - this.player.x) / td) * 1.4;
        vy += ((target.y - this.player.y) / td) * 1.4;
      }
    }

    // Normalize
    const mag = Math.hypot(vx, vy);
    if (mag > 0.1) {
      return { x: vx / mag, y: vy / mag };
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
      this.x += (dx / dist) * curSpeed * 60 * dt;
      this.y += (dy / dist) * curSpeed * 60 * dt;
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
      this.engine.gems.push(new EngineGem(this.x, this.y, this.exp));

      // Drop Equipment Chest from Elite or Boss
      const def = GAME_DATA.monsters[this.type];
      if (def && (def.isElite || def.isBoss)) {
        const tier = def.isBoss ? 3 : (this.type.includes('reaper') || this.type.includes('fire_golem') ? 2 : 1);
        this.engine.chests.push(new EngineChest(this.x, this.y, tier));
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
