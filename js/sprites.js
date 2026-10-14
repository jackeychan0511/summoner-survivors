/* ==========================================================================
   js/sprites.js - 뱀서(Vampire Survivors) 스타일 픽셀 도트 에셋 매니저
   - Kenney Roguelike / Tiny Dungeon & Town CC0 무료 도트 스프라이트 시트 로드
   - 오리지널 소환수 3종(이그니스, 볼트, 실피드) 픽셀 아트 스프라이트
   - 이음새 없는 잔디 / 던전 바닥 타일 패턴 생성
   ========================================================================== */

class SpriteManager {
  constructor() {
    this.isLoaded = false;
    this.usePixelArt = true; // 도트 그래픽 모드 기본 ON

    // 스프라이트 시트 이미지
    this.dungeonSheet = new Image();
    this.townSheet = new Image();

    // 캔버스 패턴 (반복 바닥 타일)
    this.grassPattern = null;
    this.stonePattern = null;

    // 소환수 3종 전용 픽셀 스프라이트 캔버스
    this.petSprites = {};

    this.init();
  }

  init() {
    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        this.createGroundPatterns();
        this.generatePetPixelSprites();
        this.isLoaded = true;
        console.log("🎮 [SpriteManager] 뱀서 스타일 도트 에셋 로드 완료!");
      }
    };

    this.dungeonSheet.onload = onLoad;
    this.townSheet.onload = onLoad;

    this.dungeonSheet.src = 'assets/dungeon_sheet.png';
    this.townSheet.src = 'assets/town_sheet.png';
  }

  // 1. 이음새 없는 잔디 및 석판 바닥 타일 패턴 생성
  createGroundPatterns() {
    // [1] 잔디 바닥 패턴 (32x32 타일)
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 32;
    grassCanvas.height = 32;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.imageSmoothingEnabled = false;

    // town_sheet의 16x16 잔디 타일 4개 배치
    // 타일 (0, 0): 기본 잔디, (16, 0): 꽃 핀 잔디
    gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 0, 0, 16, 16);
    gCtx.drawImage(this.townSheet, 16, 0, 16, 16, 16, 0, 16, 16);
    gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 0, 16, 16, 16);
    gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 16, 16, 16, 16);

    const tempCtx = document.createElement('canvas').getContext('2d');
    this.grassPattern = tempCtx.createPattern(grassCanvas, 'repeat');

    // [2] 던전 석판 바닥 패턴
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 32;
    stoneCanvas.height = 32;
    const sCtx = stoneCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = false;

    // dungeon_sheet의 석판 타일
    sCtx.drawImage(this.dungeonSheet, 0, 0, 16, 16, 0, 0, 16, 16);
    sCtx.drawImage(this.dungeonSheet, 16, 0, 16, 16, 16, 0, 16, 16);
    sCtx.drawImage(this.dungeonSheet, 0, 16, 16, 16, 0, 16, 16, 16);
    sCtx.drawImage(this.dungeonSheet, 16, 16, 16, 16, 16, 16, 16, 16);

    this.stonePattern = tempCtx.createPattern(stoneCanvas, 'repeat');
  }

  // 2. 소환수 3종(이그니스, 볼트, 실피드) 전용 16x16 레트로 픽셀 아트 생성
  generatePetPixelSprites() {
    this.petSprites.ignis = this.renderPixelGrid(16, 16, [
      "....####........",
      "...#ff99#.......",
      "..#ff9999#......",
      "..#ff99ffff#....",
      ".#fffffffff#....",
      ".#f0ffff0ff#....",
      ".#fffffffff#....",
      "..#fffffff#..##.",
      "...#fffff#..#ff#",
      "....#fff#..#fff#",
      "..###ff#####ff#.",
      ".#fffffffffff#..",
      ".#fffffffffff#..",
      "..#fffffffff#...",
      "...#ff###ff#....",
      "....##...##....."
    ], {
      '#': '#7c2d12',
      'f': '#ea580c',
      '9': '#f97316',
      '0': '#facc15'
    });

    this.petSprites.bolt = this.renderPixelGrid(16, 16, [
      "....##....##....",
      "...#bb#..#bb#...",
      "..#bbbb##bbbb#..",
      "..#bbbbbbbbbb#..",
      ".#bb0bbbbbb0bb#.",
      ".#bb0bbbbbb0bb#.",
      ".#bbbbbbbbbbbb#.",
      "..#bbffffffbb#..",
      "...#bffffffb#...",
      "....#ffffff#....",
      "...#bbffffbb#...",
      "..#bbbbbbbbbb#..",
      ".#bb########bb#.",
      ".#bb#......#bb#.",
      ".###........###.",
      "................"
    ], {
      '#': '#1e1b4b',
      'b': '#38bdf8',
      'f': '#e0f2fe',
      '0': '#facc15'
    });

    this.petSprites.sylph = this.renderPixelGrid(16, 16, [
      "......####......",
      ".....#gggg#.....",
      "....#gggggg#....",
      "...#gffffffg#...",
      "...#g0ffff0g#...",
      "...#gffffffg#...",
      "...#gggggggg#...",
      "..##gggggggg##..",
      ".#pp#gggggg#pp#.",
      "#pppp#gggg#pppp#",
      "#pppp######pppp#",
      ".#pp#......#pp#.",
      "..##........##..",
      "................",
      "................",
      "................"
    ], {
      '#': '#064e3b',
      'g': '#22c55e',
      'f': '#86efac',
      'p': '#f472b6',
      '0': '#0f172a'
    });
  }

  // 픽셀 문자열 맵을 캔버스 이미지로 변환
  renderPixelGrid(w, h, grid, palette) {
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');

    for (let r = 0; r < h; r++) {
      const row = grid[r] || "";
      for (let c = 0; c < w; c++) {
        const char = row[c];
        if (char && palette[char]) {
          ctx.fillStyle = palette[char];
          ctx.fillRect(c, r, 1, 1);
        }
      }
    }
    return cvs;
  }

  // =========================================================================
  // 3. 스프라이트 렌더링 헬퍼 함수들 (16x16 -> 화면 크기에 맞게 픽셀 확대 렌더링)
  // =========================================================================

  // [1] 바닥 타일 렌더링
  renderBackground(ctx, player, canvasW, canvasH) {
    if (!this.isLoaded || !this.usePixelArt || !this.grassPattern) return false;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 카메라 오프셋 적용된 무한 타일 패턴
    ctx.translate(-player.x % 32, -player.y % 32);
    ctx.fillStyle = this.grassPattern;
    ctx.fillRect(-32, -32, canvasW + 64, canvasH + 64);
    ctx.restore();

    return true;
  }

  // [2] 테이머 (소환사 마법사 도트)
  renderTamer(ctx, p, nameLabel) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // dungeon_sheet의 마법사 스프라이트 (Row 6, Col 0: X=0, Y=96, W=16, H=16)
    const scale = 2.4; // 16x16 -> 38x38
    ctx.drawImage(this.dungeonSheet, 0, 96, 16, 16, -19, -24, 38, 38);

    // 이름표
    ctx.restore();
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(nameLabel, p.x, p.y - 32);

    // 무적/보호막 오라
    if (p.isInvincible || (p.shieldBarrier && p.shieldBarrier > 0)) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 4, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    return true;
  }

  // [3] AI 동료 봇 렌더링
  renderAiBot(ctx, bot) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    ctx.save();
    ctx.translate(bot.x, bot.y);
    if (bot.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // 기사 스프라이트 (Row 7, Col 0: X=0, Y=112)
    ctx.drawImage(this.dungeonSheet, 0, 112, 16, 16, -18, -22, 36, 36);

    ctx.restore();
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(bot.name, bot.x, bot.y - 28);
    ctx.restore();

    return true;
  }

  // [4] 소환수 3종 (이그니스, 볼트, 실피드) 도트
  renderPet(ctx, pet, time) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    const cvs = this.petSprites[pet.config.id];
    if (!cvs) return false;

    const tier = pet.tier || 1;
    const scale = tier >= 3 ? 3.0 : (tier === 2 ? 2.4 : 1.9);
    const bob = Math.sin(time * 6) * 3;

    ctx.save();
    ctx.translate(pet.x, pet.y + bob);
    if (pet.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // 발광 아우라
    ctx.shadowBlur = tier >= 3 ? 20 : 10;
    ctx.shadowColor = pet.config.color || '#f59e0b';

    const w = 16 * scale;
    const h = 16 * scale;
    ctx.drawImage(cvs, -w / 2, -h / 2, w, h);

    ctx.restore();
    return true;
  }

  // [5] 몬스터 도트 렌더링
  renderEnemy(ctx, e, time) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    // 몬스터 종류별 스프라이트 시트 내 타일 좌표 (X, Y)
    const enemyTiles = {
      slime: { x: 0, y: 128 },              // 녹색 슬라임
      bat: { x: 0, y: 144 },                // 흡혈 박쥐
      skeleton: { x: 64, y: 144 },          // 해골 전사
      goblin_warrior: { x: 16, y: 128 },    // 외눈 고블린
      dark_orc: { x: 64, y: 128 },          // 흑암 오크
      undead_knight: { x: 16, y: 112 },     // 언데드 기사
      elite_minotaur: { x: 32, y: 128 },    // 미노타우로스 / 괴수
      elite_skeleton_lord: { x: 48, y: 144 },// 해골 군주
      golem_boss: { x: 32, y: 144 },        // 바위 골렘
      elite_fire_golem: { x: 32, y: 128 },  // 화염 골렘
      lich_boss: { x: 48, y: 128 },         // 사령 리치
      elite_shadow_reaper: { x: 48, y: 128 },// 그림자 사신
      abyss_hound: { x: 0, y: 144 },        // 심연 하운드
      final_dragon_baal: { x: 48, y: 144 }  // 마룡 바알
    };

    const tile = enemyTiles[e.type] || { x: 0, y: 128 };
    const def = GAME_DATA.monsters[e.type] || {};
    const isBoss = def.isBoss || def.isElite;
    const scale = isBoss ? (def.isBoss ? 4.2 : 3.0) : 2.0;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.imageSmoothingEnabled = false;

    // 피격 시 백색 플래시
    if (e.flash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }

    if (isBoss) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = e.color;
    }

    // 박쥐 날개짓 덜컹거림 효과
    const flap = e.type === 'bat' ? Math.sin(time * 18) * 2 : 0;
    const w = 16 * scale;
    const h = 16 * scale;
    ctx.drawImage(this.dungeonSheet, tile.x, tile.y, 16, 16, -w / 2, -h / 2 + flap, w, h);

    // 보스 / 준보스 HP 바
    if (isBoss) {
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2, 5);
      ctx.fillStyle = def.isBoss ? '#ef4444' : '#f59e0b';
      ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2 * hpPct, 5);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, 0, -e.radius - 16);
    }

    ctx.restore();
    return true;
  }

  // [6] 보물상자 도트 렌더링
  renderChest(ctx, c, time) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    const bob = Math.sin(time * 6) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 15;
    ctx.shadowColor = c.color;

    // dungeon_sheet의 황금 보물상자 (X=112, Y=96)
    ctx.drawImage(this.dungeonSheet, 112, 96, 16, 16, -18, -18, 36, 36);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText('🎁 전설 상자', 0, -22);

    ctx.restore();
    return true;
  }

  // [7] 경험치 보석 도트
  renderGem(ctx, g) {
    if (!this.isLoaded || !this.usePixelArt) return false;

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 8;
    ctx.shadowColor = g.color;

    // dungeon_sheet의 마법 크리스탈/물약 (X=80, Y=128)
    ctx.drawImage(this.dungeonSheet, 80, 128, 16, 16, -8, -8, 16, 16);

    ctx.restore();
    return true;
  }
}

// 싱글톤 인스턴스 생성
const spriteManager = new SpriteManager();
