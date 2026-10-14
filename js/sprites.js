/* ==========================================================================
   js/sprites.js - 2~3등신 인간형 영웅 & 멋진 신수 & 드래곤퀘스트 몬스터 픽셀 아트 매니저
   - 2.5~3등신 인간형 소환사(테이머) 및 AI 3인 파티 영웅(기사, 궁수, 성기사)
   - 소환수 3종(이그니스, 볼트, 실피드) 1차/2차/3차 최종 각성 웅장한 신수 스프라이트
   - 드래곤퀘스트 대표 몬스터 10종(슬라임, 드라키, 리자드맨, 스톤골렘, 그레이트드래곤 등)
   - 레트로 무한 잔디 및 던전 타일 패턴 생성
   ========================================================================== */

class SpriteManager {
  constructor() {
    this.isLoaded = false;
    this.usePixelArt = true; // 도트 그래픽 모드 기본 ON

    // 스프라이트 시트 이미지 (타일용)
    this.dungeonSheet = new Image();
    this.townSheet = new Image();

    // 캔버스 패턴 (반복 바닥 타일)
    this.grassPattern = null;
    this.stonePattern = null;

    // 생성된 고화질 커스텀 픽셀 아트 캔버스들
    this.petSprites = {};    // { ignis_t1, ignis_t2, ignis_t3, bolt_t1, ... }
    this.humanSprites = {};  // { tamer_f0, tamer_f1, knight, ranger, paladin }
    this.heroSprites = {};   // { warrior_berserker_t1~t3, archer_sniper_t1~t3, ... }
    this.dqMonsters = {};    // { slime, dracky_f0, dracky_f1, lizardman, ... }

    this.init();
  }

  init() {
    // 1. 순수 캔버스 기반 픽셀 아트 즉전 즉시 생성 (외부 네트워크 지연 없음)
    this.generateAllCustomSprites();

    // 2. 바닥 타일용 스프라이트 시트 로드
    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        this.createGroundPatterns();
      }
    };

    this.dungeonSheet.onload = onLoad;
    this.townSheet.onload = onLoad;
    this.dungeonSheet.src = 'assets/dungeon_sheet.png';
    this.townSheet.src = 'assets/town_sheet.png';

    this.isLoaded = true;
    console.log("👑 [SpriteManager] 2~3등신 영웅 9종, 신수, 드퀘 몬스터 도트 로드 완료!");
  }

  // =========================================================================
  // 1. 도트 그래픽 생성 엔진 (Pixel Canvas Generator)
  // =========================================================================
  createPixelCanvas(w, h) {
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { cvs, ctx };
  }

  // 픽셀 문자열 맵을 캔버스 이미지로 변환
  renderPixelGrid(w, h, grid, palette) {
    const { cvs, ctx } = this.createPixelCanvas(w, h);
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

  // 🌟 32비트 고화질(HD) 픽셀 스프라이트 렌더러
  // - 32~40px 고해상도 그리드
  // - 5단계 입체 셰이딩 (Shadow -> Midtone -> Highlight -> Rim Light)
  // - 32비트 특수효과 (네온 림라이트, 각성 오라, 무기 발광 블룸)
  render32BitSprite(w, h, grid, palette, fx = {}) {
    const { cvs, ctx } = this.createPixelCanvas(w, h);

    // 1. 32비트 배경 아우라/후광 (Aura Glow)
    if (fx.auraColor) {
      ctx.save();
      const grad = ctx.createRadialGradient(w / 2, h / 2 + 2, 4, w / 2, h / 2, w / 2);
      grad.addColorStop(0, fx.auraColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 2. 픽셀 그리드 렌더링
    for (let r = 0; r < h; r++) {
      const row = grid[r] || "";
      for (let c = 0; c < w; c++) {
        const char = row[c];
        if (char && palette[char] && palette[char] !== 'transparent') {
          ctx.fillStyle = palette[char];
          ctx.fillRect(c, r, 1, 1);
        }
      }
    }

    // 3. 32비트 광택 하이라이트 & 림라이트 (Highlights)
    if (fx.highlights && fx.highlights.length > 0) {
      ctx.save();
      fx.highlights.forEach(hl => {
        ctx.fillStyle = hl.c || '#ffffff';
        ctx.fillRect(hl.x, hl.y, hl.w || 1, hl.h || 1);
      });
      ctx.restore();
    }

    // 4. 32비트 무기 발광 블룸 (Weapon Bloom & Sparks)
    if (fx.weaponGlow) {
      ctx.save();
      ctx.shadowColor = fx.weaponGlow.color || '#facc15';
      ctx.shadowBlur = fx.weaponGlow.blur || 6;
      ctx.fillStyle = fx.weaponGlow.color || '#facc15';
      if (fx.weaponGlow.pixels) {
        fx.weaponGlow.pixels.forEach(p => {
          ctx.fillRect(p[0], p[1], p[2] || 1, p[3] || 1);
        });
      }
      ctx.restore();
    }

    return cvs;
  }

  generateAllCustomSprites() {
    this.generateHumanSprites();
    this.generateHeroClassSprites();
    this.generateMajesticPetSprites();
    this.generateDqMonsterSprites();
  }

  // =========================================================================
  // 2. 🧙 2.5~3등신 인간형 소환사 & 파티원 영웅들 (Human Proportions)
  // =========================================================================
  generateHumanSprites() {
    // [1] 소환사 (Tamer) - 2.5등신 마법사 (24x32 픽셀)
    // 모자/헤어, 살구빛 얼굴, 푸른빛 소환사 로브, 황금 벨트, 빛나는 마도 지팡이
    const tamerPalette = {
      '.': 'transparent',
      'H': '#1e1b4b', // 모자 짙은 남색
      'h': '#312e81', // 모자 하이라이트
      'G': '#f59e0b', // 골드 띠/장식
      'F': '#fed7aa', // 살구빛 얼굴 피부톤
      'f': '#fbcfe8', // 홍조
      'B': '#78350f', // 갈색 머리카락
      'E': '#0f172a', // 눈동자
      'W': '#ffffff', // 눈 흰자위
      'R': '#1d4ed8', // 소환사 로브 파란색
      'r': '#3b82f6', // 로브 밝은 파랑
      'S': '#92400e', // 지팡이 나무 자루
      'C': '#38bdf8', // 마력 수정구 (하늘색 발광)
      'c': '#e0f2fe', // 수정구 광택
      'K': '#451a03', // 부츠
      'b': '#1e293b'  // 그림자
    };

    // Frame 0: 기본 자세
    this.humanSprites.tamer_f0 = this.renderPixelGrid(24, 32, [
      ".........HH.............",
      "........HHHH............",
      ".......HhhhhH...........",
      "......HhhhhhhH..........",
      ".....HhhhhhhhhH.........",
      "....HhhhhhhhhhhH........",
      "...HGGGGGGGGGGGGH.......",
      "..HHHHHHHHHHHHHHHH......",
      ".....BBBBBBBBBB.........",
      "....BFFFFFFFFFFB........",
      "....BFWEE..EEWFB........",
      "....BFFFFFFFFFB.........",
      "....BFf..__..fFB........",
      ".....BFFFFFFFB..........",
      "......HRRRRRH...cc......",
      ".....HHRRRRRHH.cCcc.....",
      "....HHRRRRRRRH.CCCC.....",
      "...SHHRRGGGRRHH.cC......",
      "...SHHRRRRRRRHH.S.......",
      "...SHHRRRRRRRHH.S.......",
      "...S..RRRRRRR...S.......",
      "...S..RRRRRRR...S.......",
      "......RRRRRRR...S.......",
      "......RRRRRRR...S.......",
      "......RRR.RRR...S.......",
      "......RRR.RRR...S.......",
      "......KKK.KKK...S.......",
      "......KKK.KKK...S.......",
      ".....KKKK.KKKK..........",
      "........................",
      "........................",
      "........................"
    ], tamerPalette);

    // Frame 1: 보행/호흡 모션 (발 바운스)
    this.humanSprites.tamer_f1 = this.renderPixelGrid(24, 32, [
      ".........HH.............",
      "........HHHH............",
      ".......HhhhhH...........",
      "......HhhhhhhH..........",
      ".....HhhhhhhhhH.........",
      "....HhhhhhhhhhhH........",
      "...HGGGGGGGGGGGGH.......",
      "..HHHHHHHHHHHHHHHH......",
      ".....BBBBBBBBBB.........",
      "....BFFFFFFFFFFB........",
      "....BFWEE..EEWFB........",
      "....BFFFFFFFFFB.........",
      "....BFf..__..fFB........",
      ".....BFFFFFFFB..........",
      "......HRRRRRH...cc......",
      ".....HHRRRRRHH.cCcc.....",
      "....HHRRRRRRRH.CCCC.....",
      "...SHHRRGGGRRHH.cC......",
      "...SHHRRRRRRRHH.S.......",
      "...SHHRRRRRRRHH.S.......",
      "...S..RRRRRRR...S.......",
      "...S..RRRRRRR...S.......",
      "......RRRRRRR...S.......",
      ".....RRRR.RRRR..S.......",
      ".....RRR...RRR..S.......",
      ".....KKK...KKK..S.......",
      "....KKKK....KKK.S.......",
      "....KKK......KKKS.......",
      "........................",
      "........................",
      "........................",
      "........................"
    ], tamerPalette);

    // [2] 철갑 기사 (Knight - 2P/AI 첫째) - 2.5등신
    const knightPalette = {
      '.': 'transparent',
      'P': '#ef4444', // 투구 붉은 깃털
      'M': '#94a3b8', // 투구/갑옷 메탈 실버
      'm': '#e2e8f0', // 하이라이트 실버
      'D': '#475569', // 다크 스틸
      'V': '#0f172a', // 바이저 안광 틈
      'G': '#f59e0b', // 골드 장식
      'B': '#1e3a8a', // 망토 파란색
      'b': '#3b82f6', // 방패 문양
      'S': '#f8fafc', // 검신 (강철)
      'W': '#ffffff', // 방패 백색 문장
      'K': '#334155'  // 강철 부츠
    };
    this.humanSprites.knight = this.renderPixelGrid(24, 32, [
      ".........PP.............",
      "........PPPP............",
      ".......PPPPP............",
      ".......MMMMM............",
      "......MmmmmmMD..........",
      ".....MDDDDDDDMD.........",
      ".....MDVVVVVDMD.........",
      ".....MDDDDDDDMD.........",
      "......MMMMMMMD..........",
      "......GMMMMMGD..........",
      ".....BMMmmmmmMB.........",
      "....B.MMmmmmmMD.S.......",
      "...bW.MMmmmmmMD.S.......",
      "...bW.MMGGGGGMD.S.......",
      "...bW.MMDDDDDMD.S.......",
      "....b.MMDDDDDMD.S.......",
      "......MMDDDDDMD.G.......",
      "......MMDDDDDMD.D.......",
      "......MMDDDDDMD.........",
      "......MM...MMD..........",
      "......MM...MMD..........",
      "......KK...KKD..........",
      ".....KKK...KKKD.........",
      ".....KKK...KKKD.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], knightPalette);

    // [3] 궁수 (Ranger - 3P/AI 둘째) - 2.5등신
    const rangerPalette = {
      '.': 'transparent',
      'H': '#15803d', // 녹색 모자
      'h': '#22c55e', // 밝은 녹색
      'P': '#fde047', // 깃털 노란색
      'F': '#fed7aa', // 피부톤
      'B': '#92400e', // 갈색 머리
      'E': '#0f172a', // 눈
      'T': '#78350f', // 가죽 조끼
      'W': '#d97706', // 활 나무
      'S': '#ffffff', // 활줄
      'K': '#451a03'  // 가죽 부츠
    };
    this.humanSprites.ranger = this.renderPixelGrid(24, 32, [
      "..........PP............",
      "........HHHH............",
      ".......HhhhhH...........",
      "......HhhhhhhH..........",
      ".....HHHHHHHHHH.........",
      ".....BBBBBBBBBB.........",
      "....BFFFFFFFFFFB........",
      "....BFE..__..EFB........",
      "....BFFFFFFFFFFB........",
      ".....BFFFFFFFFB.........",
      ".....W.TTTTTT.H.........",
      "....W.TTTTTTTT.H........",
      "...W..TTTTTTTT..H.......",
      "...W..TTGGGGTT..H.......",
      "...S..TTTTTTTT..........",
      "...S..TTTTTTTT..........",
      "...W..TTTTTTTT..........",
      "...W..TT....TT..........",
      "....W.TT....TT..........",
      "......KK....KK..........",
      ".....KKK....KKK.........",
      ".....KKK....KKK.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], rangerPalette);

    // [4] 성기사 (Paladin - 4P/AI 셋째)
    const paladinPalette = {
      '.': 'transparent',
      'W': '#ffffff', // 백은 갑옷
      'w': '#f1f5f9', // 광택
      'G': '#facc15', // 황금 십자가/트림
      'D': '#64748b', // 그림자
      'B': '#3b82f6', // 바이저 안광
      'K': '#475569'  // 부츠
    };
    this.humanSprites.paladin = this.renderPixelGrid(24, 32, [
      ".......WW..WW...........",
      "......WWWWWWWW..........",
      "......WwwwwwwW..........",
      ".....WWDDDDDDWW.........",
      ".....WDBBBBBBBD.........",
      ".....WWDDDDDDWW.........",
      "......WWWWWWWW..........",
      "......GGGGGGGG..........",
      ".....WWWWWWWWWW.........",
      "....G.WWWWWWWW.G........",
      "...GWG.WWGGWW.GWG.......",
      "...GWG.WWGGWW.GWG.......",
      "...GGG.GGGGGG.GGG.......",
      "...GWG.WWGGWW.GWG.......",
      "....G..WWWWWW..G........",
      ".......WWWWWW...........",
      ".......WWWWWW...........",
      ".......WW..WW...........",
      ".......WW..WW...........",
      ".......KK..KK...........",
      "......KKK..KKK..........",
      "......KKK..KKK..........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], paladinPalette);
  }

  // =========================================================================
  // 2-1. ⚔️ 검사 & 🏹 궁수 6대 세부 특화 x 3단계 전직 픽셀 스프라이트 (18종)
  // 소환수가 없는 대신 본체 캐릭터가 전직할 때마다 외형이 웅장하게 진화!
  // =========================================================================
  // =========================================================================
  // 2-1. ⚔️ 검사 & 🏹 궁수 6대 세부 특화 x 3단계 전직 32비트 고화질(HD) 스프라이트 (18종)
  // 32비트 콘솔 RPG (PS1/세가새턴/네오지오) 수준의 32~36px 고해상도 + 5단계 입체 셰이딩 + 네온 발광
  // =========================================================================
// =========================================================================
  // 🌟 진정한 32비트 HD 고화질 캐릭터 아트 생성기 (PS1 / 던파 / 택틱스 오우거급)
  // 64x80 고해상도 정밀 드로잉 + 5단계 그라데이션 명암 + 섬세한 이목구비 & 무기 디테일
  // =========================================================================
  generateHeroClassSprites() {
    this.heroSprites = {};

    // 헬퍼: 32비트 고해상도 캔버스 생성기
    const createHdCanvas = (w, h, drawFn) => {
      const cvs = document.createElement('canvas');
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      drawFn(ctx, w, h);
      return cvs;
    };

    // =======================================================================
    // [1] 검사: 광전사 3단계 (Warrior - Berserker)
    // =======================================================================

    // 1차: 견습 광전사 (가죽 흉갑, 붉은 헤드밴드, 야성미 넘치는 장발, 양손 대검)
    this.heroSprites.warrior_berserker_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 28, cy = 40;

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 양손 대검 (등 뒤에서 비스듬히 세워짐)
      ctx.save();
      ctx.translate(46, 38);
      ctx.rotate(0.2);
      // 칼날 그림자 & 본체
      ctx.fillStyle = '#475569';
      ctx.fillRect(-5, -28, 10, 52);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-4, -28, 4, 50);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-2, -28, 2, 50); // 하이라이트
      // 혈조(피홈)
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-1, -22, 2, 38);
      // 코등이(가드)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-9, 22, 18, 5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-7, 23, 14, 2);
      // 손잡이 & 폼멜
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, 27, 4, 12);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 40, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // 다리 & 가죽 부츠
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx - 9, 56, 7, 16);
      ctx.fillRect(cx + 2, 56, 7, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 10, 62, 8, 11);
      ctx.fillRect(cx + 2, 62, 8, 11);
      ctx.fillStyle = '#d97706'; // 부츠 버클
      ctx.fillRect(cx - 10, 66, 8, 2);
      ctx.fillRect(cx + 2, 66, 8, 2);

      // 상체: 거친 가죽 조끼 & 흉근
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(cx - 11, 36);
      ctx.lineTo(cx + 11, 36);
      ctx.lineTo(cx + 9, 58);
      ctx.lineTo(cx - 9, 58);
      ctx.closePath();
      ctx.fill();
      // 가죽 명암 셰이딩
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 7, 38, 14, 18);
      // 흉터 X자 스티치
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 42); ctx.lineTo(cx + 4, 50);
      ctx.moveTo(cx + 4, 42); ctx.lineTo(cx - 4, 50);
      ctx.stroke();

      // 강철 숄더가드 (어깨 갑옷)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 15, 34, 6, 8);
      ctx.fillRect(cx + 9, 34, 6, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 14, 35, 4, 3);
      ctx.fillRect(cx + 10, 35, 4, 3);

      // 팔 & 가죽 건틀릿
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx - 14, 42, 5, 10);
      ctx.fillRect(cx + 9, 42, 5, 10);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 15, 48, 6, 7);
      ctx.fillRect(cx + 9, 48, 6, 7);

      // 머리 & 얼굴 (미려한 2.5등신 인체 비례)
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(cx, 24, 10, 0, Math.PI * 2);
      ctx.fill();
      // 목선
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - 3, 31, 6, 6);

      // 눈매 & 눈썹 (강렬한 눈빛)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - 6, 21, 4, 2);
      ctx.fillRect(cx + 2, 21, 4, 2);
      ctx.fillStyle = '#dc2626'; // 붉은 안광
      ctx.fillRect(cx - 5, 23, 3, 3);
      ctx.fillRect(cx + 2, 23, 3, 3);
      ctx.fillStyle = '#ffffff'; // 눈동자 하이라이트
      ctx.fillRect(cx - 4, 23, 1, 1);
      ctx.fillRect(cx + 3, 23, 1, 1);

      // 야생 사자갈기 머리카락
      ctx.fillStyle = '#291404';
      ctx.beginPath();
      ctx.arc(cx, 19, 13, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
      ctx.fillRect(cx - 14, 18, 5, 14);
      ctx.fillRect(cx + 9, 18, 5, 14);
      // 머리결 하이라이트
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 8, 11, 16, 3);

      // 붉은 헤드밴드 & 휘날리는 끈
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 12, 17, 24, 4);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(cx - 12, 17, 24, 1.5);
      // 휘날리는 밴드 끝
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(cx - 12, 19);
      ctx.lineTo(cx - 20, 24);
      ctx.lineTo(cx - 14, 27);
      ctx.closePath();
      ctx.fill();
    });

    // 2차: 블러드 버서커 (흑철 풀플레이트, 혈흔 룬 각인, 펄럭이는 진홍빛 망토, 거대한 핏빛 참마도)
    this.heroSprites.warrior_berserker_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 28;

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 펄럭이는 진홍 망토 (배경 레이어)
      const capeGrad = ctx.createLinearGradient(cx - 16, 28, cx - 24, 68);
      capeGrad.addColorStop(0, '#7f1d1d');
      capeGrad.addColorStop(0.5, '#b91c1c');
      capeGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = capeGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 12, 32);
      ctx.lineTo(cx - 24, 68);
      ctx.lineTo(cx - 14, 66);
      ctx.lineTo(cx - 8, 70);
      ctx.lineTo(cx + 6, 50);
      ctx.closePath();
      ctx.fill();

      // 거대 핏빛 참마도 (혈검)
      ctx.save();
      ctx.translate(47, 36);
      ctx.rotate(0.18);
      // 검신 아우라 블룸
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-7, -32, 14, 58);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5, -30, 10, 54);
      ctx.fillStyle = '#ff6b81';
      ctx.fillRect(-2, -30, 4, 52); // 중앙 발광 혈선
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -30, 2, 52);
      ctx.shadowBlur = 0;
      // 가드(해골 문양 가드)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-10, 24, 20, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, 28, 4, 14);
      ctx.restore();

      // 다리 & 흑철 그리브
      ctx.fillStyle = '#090d16';
      ctx.fillRect(cx - 10, 54, 8, 18);
      ctx.fillRect(cx + 2, 54, 8, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 9, 56, 3, 14);
      ctx.fillRect(cx + 3, 56, 3, 14);

      // 상체: 흑철 흉갑 & 붉은 룬 각인
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(cx - 13, 32); ctx.lineTo(cx + 13, 32);
      ctx.lineTo(cx + 10, 56); ctx.lineTo(cx - 10, 56);
      ctx.closePath();
      ctx.fill();
      // 흑철 하이라이트
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 10, 34, 4, 18);
      // 붉은 혈흔 룬
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 36); ctx.lineTo(cx, 50);
      ctx.moveTo(cx - 5, 42); ctx.lineTo(cx + 5, 42);
      ctx.stroke();

      // 가시 달린 스파이크 숄더가드
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 18, 30, 8, 10);
      ctx.fillRect(cx + 10, 30, 8, 10);
      ctx.fillStyle = '#dc2626'; // 숄더 스파이크
      ctx.beginPath();
      ctx.moveTo(cx - 18, 30); ctx.lineTo(cx - 22, 24); ctx.lineTo(cx - 14, 30);
      ctx.moveTo(cx + 18, 30); ctx.lineTo(cx + 22, 24); ctx.lineTo(cx + 14, 30);
      ctx.fill();

      // 흑철 바이저 투구 & 붉은 안광
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(cx, 22, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 8, 16, 16, 4);
      // 바이저 틈새에서 타오르는 붉은 안광
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(cx - 7, 21, 14, 3.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5, 22, 4, 1.5);
      ctx.fillRect(cx + 1, 22, 4, 1.5);
      ctx.shadowBlur = 0;
    });

    // 3차: 👑 광룡의 헬블레이더 (악마의 진홍 뿔 투구, 칠흑 드래곤 마갑, 전신 화염 아우라, 헬블레이드)
    this.heroSprites.warrior_berserker_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 32;

      // 전신 핏빛 화염 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      aura.addColorStop(0.7, 'rgba(185, 28, 28, 0.15)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, w, h);

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, 80, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 악마의 날개형 찢어진 망토
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(cx - 16, 32);
      ctx.lineTo(cx - 30, 52); ctx.lineTo(cx - 24, 56);
      ctx.lineTo(cx - 32, 74); ctx.lineTo(cx - 18, 70);
      ctx.lineTo(cx - 12, 76); ctx.lineTo(cx + 8, 48);
      ctx.closePath();
      ctx.fill();

      // 초거대 헬블레이드 (칼날 전체 화염 이펙트)
      ctx.save();
      ctx.translate(52, 38);
      ctx.rotate(0.2);
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-8, -38, 16, 68);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -36, 12, 64);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-3, -36, 6, 62);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -36, 2, 62);
      ctx.shadowBlur = 0;
      // 황금 악마 문양 코등이
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, 28, 24, 7);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-3, 34, 6, 16);
      ctx.restore();

      // 드래곤 비늘 그리브 & 발톱 부츠
      ctx.fillStyle = '#030712';
      ctx.fillRect(cx - 12, 58, 9, 20);
      ctx.fillRect(cx + 3, 58, 9, 20);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(cx - 11, 62, 3, 14);
      ctx.fillRect(cx + 4, 62, 3, 14);

      // 드래곤 본 흉갑
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.moveTo(cx - 15, 34); ctx.lineTo(cx + 15, 34);
      ctx.lineTo(cx + 11, 60); ctx.lineTo(cx - 11, 60);
      ctx.closePath();
      ctx.fill();
      // 용의 갈비뼈 골격 양각
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 12, 40); ctx.lineTo(cx, 44); ctx.lineTo(cx + 12, 40);
      ctx.moveTo(cx - 10, 47); ctx.lineTo(cx, 51); ctx.lineTo(cx + 10, 47);
      ctx.stroke();

      // 거대 악마 뿔 투구
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.arc(cx, 22, 13, 0, Math.PI * 2);
      ctx.fill();
      // 진홍빛 거대 악마 뿔
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(cx - 10, 18);
      ctx.quadraticCurveTo(cx - 24, 10, cx - 22, -2);
      ctx.quadraticCurveTo(cx - 14, 6, cx - 6, 14);
      ctx.moveTo(cx + 10, 18);
      ctx.quadraticCurveTo(cx + 24, 10, cx + 22, -2);
      ctx.quadraticCurveTo(cx + 14, 6, cx + 6, 14);
      ctx.fill();
      // 안광
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(cx - 9, 21, 18, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 7, 22, 5, 2);
      ctx.fillRect(cx + 2, 22, 5, 2);
      ctx.shadowBlur = 0;
    });

    // =======================================================================
    // [2] 검사: 성기사 3단계 (Warrior - Paladin)
    // =======================================================================

    // 1차: 견습 수호기사 (백은 경갑, 푸른 튜닉, 강철 롱소드, 스몰 버클러)
    this.heroSprites.warrior_paladin_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();

      // 왼손: 강철 버클러 (원형 방패)
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(14, 46, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(14, 46, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f59e0b'; // 금빛 십자가 엠블럼
      ctx.fillRect(13, 40, 2, 12); ctx.fillRect(8, 45, 12, 2);

      // 오른손: 강철 롱소드
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(46, 20, 4, 38);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(47, 20, 2, 36);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(41, 56, 14, 4);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(47, 60, 2, 8);

      // 다리 & 백은 경갑
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 9, 56, 7, 16); ctx.fillRect(cx + 2, 56, 7, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 8, 58, 5, 12); ctx.fillRect(cx + 3, 58, 5, 12);

      // 상체: 백은 흉갑 & 푸른 서코트
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(cx - 10, 36, 20, 22);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 7, 36, 14, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 5, 38, 4, 12);
      ctx.fillStyle = '#d97706'; // 골드 벨트
      ctx.fillRect(cx - 10, 54, 20, 4);

      // 머리 & 투구 (기사 헬름)
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath(); ctx.arc(cx, 24, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(cx, 20, 11, Math.PI, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 10, 20, 20, 3);
      // 푸른 눈동자
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cx - 5, 24, 3, 3); ctx.fillRect(cx + 2, 24, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, 24, 1, 1); ctx.fillRect(cx + 3, 24, 1, 1);
      // 투구 깃털 장식
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(cx, 10); ctx.lineTo(cx - 4, 3); ctx.lineTo(cx + 3, 5); ctx.closePath(); ctx.fill();
    });

    // 2차: 홀리 팔라딘 (백은 풀플레이트, 푸른 깃털 투구, 황금 십자가 카이트 실드, 백은 나이트소드)
    this.heroSprites.warrior_paladin_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI*2); ctx.fill();

      // 왼손: 대형 카이트 실드 (눈물방울형 방패)
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(8, 32); ctx.lineTo(24, 32);
      ctx.lineTo(22, 54); ctx.lineTo(16, 68); ctx.lineTo(10, 54);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.stroke();
      // 방패 황금 십자가
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 36, 4, 24); ctx.fillRect(9, 44, 14, 4);

      // 오른손: 백은 나이트소드 (미세 성광)
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(48, 16, 4, 42);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(42, 56, 16, 4);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(49, 60, 2, 8);

      // 백은 다리 풀플레이트
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 10, 54, 8, 18); ctx.fillRect(cx + 2, 54, 8, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 8, 56, 4, 14); ctx.fillRect(cx + 4, 56, 4, 14);

      // 백은 풀플레이트 흉갑
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cx - 12, 32); ctx.lineTo(cx + 12, 32);
      ctx.lineTo(cx + 10, 56); ctx.lineTo(cx - 10, 56);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 8, 34, 6, 18);
      // 황금 십자가 문양
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 1, 36, 3, 14); ctx.fillRect(cx - 6, 40, 13, 3);

      // 백은 나이트 투구 & 푸른 플룸 깃털
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(cx, 22, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 8, 16, 5, 5);
      // T자형 바이저 & 푸른 안광
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, 21, 16, 3.5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 6, 22, 4, 1.5); ctx.fillRect(cx + 2, 22, 4, 1.5);
      // 푸른 깃털
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(cx, 11); ctx.quadraticCurveTo(cx - 12, 0, cx - 18, -4);
      ctx.quadraticCurveTo(cx - 6, 4, cx, 11); ctx.fill();
    });

    // 3차: 👑 디바인 가디언 (황금 날개 투구, 순백&황금 디바인 아머, 천사 날개 망토, 엑스칼리버 & 대형 십자성 타워실드)
    this.heroSprites.warrior_paladin_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 36;
      // 신성 성광 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      aura.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(cx, 80, 22, 7, 0, 0, Math.PI*2); ctx.fill();

      // 천사 날개 형상 순백 망토
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 16, 32); ctx.lineTo(cx - 32, 60); ctx.lineTo(cx - 24, 76);
      ctx.lineTo(cx + 8, 50); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.stroke();

      // 거대 신성 타워실드 (왼손)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(6, 28, 20, 48);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.strokeRect(6, 28, 20, 48);
      // 태양의 십자가
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(16, 48, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, 32, 4, 38); ctx.fillRect(8, 46, 16, 4);

      // 눈부신 황금빛 엑스칼리버 (오른손)
      ctx.save();
      ctx.translate(56, 36);
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -36, 6, 62);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1, -36, 2, 62);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-10, 26, 20, 6);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.arc(0, 38, 4, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // 순백&황금 다리 갑주
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 11, 56, 9, 20); ctx.fillRect(cx + 3, 56, 9, 20);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 10, 60, 3, 14); ctx.fillRect(cx + 4, 60, 3, 14);

      // 디바인 아머 흉갑
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 14, 32); ctx.lineTo(cx + 14, 32);
      ctx.lineTo(cx + 11, 58); ctx.lineTo(cx - 11, 58);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#38bdf8'; // 중심 보석 마나코어
      ctx.beginPath(); ctx.arc(cx, 44, 4.5, 0, Math.PI*2); ctx.fill();

      // 황금 날개 투구
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, 22, 12, 0, Math.PI*2); ctx.fill();
      // 황금 날개
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - 8, 20); ctx.lineTo(cx - 24, 6); ctx.lineTo(cx - 12, 14);
      ctx.moveTo(cx + 8, 20); ctx.lineTo(cx + 24, 6); ctx.lineTo(cx + 12, 14);
      ctx.fill();
      // 신성 바이저 안광
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 8, 20, 16, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 6, 21, 5, 2); ctx.fillRect(cx + 1, 21, 5, 2);
      ctx.shadowBlur = 0;
    });

    // =======================================================================
    // [3] 검사: 마검사 3단계 (Warrior - Magic Knight)
    // =======================================================================

    // 1차: 견습 마검사 (네이비 가죽 코트, 룬 단검)
    this.heroSprites.warrior_magic_knight_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();

      // 오른손: 룬 단검 (보랏빛 광채)
      ctx.fillStyle = '#7c3aed'; ctx.fillRect(46, 32, 4, 24);
      ctx.fillStyle = '#c084fc'; ctx.fillRect(47, 32, 2, 22);
      ctx.fillStyle = '#facc15'; ctx.fillRect(42, 54, 12, 3);
      ctx.fillStyle = '#1e1b4b'; ctx.fillRect(47, 57, 2, 6);

      // 다리 & 가죽 바지
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 9, 56, 7, 16); ctx.fillRect(cx + 2, 56, 7, 16);

      // 상체: 네이비 마도 가죽 롱코트
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(cx - 12, 36, 24, 24);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(cx - 8, 38, 16, 16);
      ctx.fillStyle = '#a855f7'; // 룬 벨트
      ctx.fillRect(cx - 10, 54, 20, 3);

      // 머리 & 흑발
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 24, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(cx, 20, 12, Math.PI*0.8, Math.PI*2.2); ctx.fill();
      // 보랏빛 눈동자
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(cx - 5, 24, 3, 3); ctx.fillRect(cx + 2, 24, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 4, 24, 1, 1); ctx.fillRect(cx + 3, 24, 1, 1);
    });

    // 2차: 룬 블레이더 (마도 룬 플레이트, 보랏빛 룬 블레이드 네온 발광, 부유 룬 오브)
    this.heroSprites.warrior_magic_knight_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI*2); ctx.fill();

      // 부유하는 마나 오브 (왼쪽 어깨 위)
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(12, 28, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(11, 27, 2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      // 오른손: 룬 블레이드 (보라 네온 발광)
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#581c87'; ctx.fillRect(48, 16, 5, 42);
      ctx.fillStyle = '#c084fc'; ctx.fillRect(49, 16, 3, 40);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(50, 16, 1, 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#facc15'; ctx.fillRect(43, 56, 15, 4);
      ctx.fillStyle = '#1e1b4b'; ctx.fillRect(49, 60, 3, 8);

      // 마도 룬 플레이트 갑옷
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(cx - 10, 54, 8, 18); ctx.fillRect(cx + 2, 54, 8, 18);
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.moveTo(cx - 12, 34); ctx.lineTo(cx + 12, 34);
      ctx.lineTo(cx + 10, 56); ctx.lineTo(cx - 10, 56);
      ctx.closePath(); ctx.fill();
      // 발광 룬 문자
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 36); ctx.lineTo(cx - 4, 44); ctx.lineTo(cx + 4, 48); ctx.lineTo(cx, 54);
      ctx.stroke();

      // 바이저 투구 & 보랏빛 안광
      ctx.fillStyle = '#1e1b4b'; ctx.beginPath(); ctx.arc(cx, 22, 11, 0, Math.PI*2); ctx.fill();
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#c084fc'; ctx.fillRect(cx - 7, 21, 14, 3.5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 5, 22, 4, 1.5); ctx.fillRect(cx + 1, 22, 4, 1.5);
      ctx.shadowBlur = 0;
    });

    // 3차: 👑 차원참의 스펠마스터 (공허의 차원 갑주, 시공간 왜곡 차원참 대검, 3개의 부유 환검)
    this.heroSprites.warrior_magic_knight_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 36;
      // 차원 균열 시공간 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      aura.addColorStop(0.7, 'rgba(34, 211, 238, 0.25)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, 80, 22, 7, 0, 0, Math.PI*2); ctx.fill();

      // 3개의 부유하는 에테르 환검 (좌/우/상단)
      const drawFloatSword = (x, y, rot) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(rot);
        ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#a855f7'; ctx.fillRect(-2, -14, 4, 28);
        ctx.fillStyle = '#67e8f9'; ctx.fillRect(-1, -14, 2, 26);
        ctx.restore();
      };
      drawFloatSword(14, 26, -0.4);
      drawFloatSword(20, 14, 0.1);
      drawFloatSword(58, 22, 0.5);

      // 오른손: 차원참 소드 (시공간 네온 균열)
      ctx.save();
      ctx.translate(56, 38); ctx.rotate(0.18);
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#030712'; ctx.fillRect(-5, -38, 10, 68);
      ctx.fillStyle = '#a855f7'; ctx.fillRect(-3, -36, 6, 64);
      ctx.fillStyle = '#22d3ee'; ctx.fillRect(-1, -36, 2, 64);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#facc15'; ctx.fillRect(-9, 28, 18, 6);
      ctx.restore();

      // 공허의 차원 갑주
      ctx.fillStyle = '#050510';
      ctx.fillRect(cx - 11, 56, 9, 20); ctx.fillRect(cx + 3, 56, 9, 20);
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(cx - 14, 34); ctx.lineTo(cx + 14, 34);
      ctx.lineTo(cx + 11, 58); ctx.lineTo(cx - 11, 58);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.stroke();

      // 공허 투구 & 사이언 네온 안광
      ctx.fillStyle = '#050510'; ctx.beginPath(); ctx.arc(cx, 22, 12, 0, Math.PI*2); ctx.fill();
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#22d3ee'; ctx.fillRect(cx - 8, 21, 16, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 6, 22, 5, 2); ctx.fillRect(cx + 1, 22, 5, 2);
      ctx.shadowBlur = 0;
    });

    // =======================================================================
    // [4] 궁수: 스나이퍼 3단계 (Archer - Sniper)
    // =======================================================================

    // 1차: 견습 저격수 (숲의 가죽 튜닉, 사냥꾼 모자, 정밀 도르래 롱보우)
    this.heroSprites.archer_sniper_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();

      // 왼손: 정밀 우든 롱보우
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(14, 44, 22, -Math.PI*0.4, Math.PI*0.4); ctx.stroke();
      // 활시위
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(14 + Math.cos(-Math.PI*0.4)*22, 44 + Math.sin(-Math.PI*0.4)*22);
      ctx.lineTo(14 + Math.cos(Math.PI*0.4)*22, 44 + Math.sin(Math.PI*0.4)*22);
      ctx.stroke();

      // 다리 & 가죽 바지
      ctx.fillStyle = '#14532d'; ctx.fillRect(cx - 8, 56, 6, 16); ctx.fillRect(cx + 2, 56, 6, 16);

      // 상체: 헌터 가죽 튜닉
      ctx.fillStyle = '#166534'; ctx.fillRect(cx - 10, 36, 20, 22);
      ctx.fillStyle = '#854d0e'; ctx.fillRect(cx - 9, 52, 18, 4); // 벨트

      // 얼굴 & 머리
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 24, 10, 0, Math.PI*2); ctx.fill();
      // 푸른 눈
      ctx.fillStyle = '#0284c7'; ctx.fillRect(cx - 5, 24, 3, 3); ctx.fillRect(cx + 2, 24, 3, 3);
      // 사냥꾼 모자 & 깃털
      ctx.fillStyle = '#14532d';
      ctx.beginPath(); ctx.moveTo(cx - 14, 20); ctx.lineTo(cx + 14, 20); ctx.lineTo(cx, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#22c55e'; // 깃털
      ctx.beginPath(); ctx.moveTo(cx + 8, 14); ctx.lineTo(cx + 18, 4); ctx.lineTo(cx + 12, 16); ctx.fill();
    });

    // 2차: 호크아이 스나이퍼 (매의 눈 철제 가면, 카모 망토, 레이저 조준경 헤비 크로스보우)
    this.heroSprites.archer_sniper_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI*2); ctx.fill();

      // 헤비 크로스보우 (헤비 쇠뇌)
      ctx.fillStyle = '#334155'; ctx.fillRect(10, 38, 28, 7);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(8, 30, 4, 24);
      // 레이저 스코프 조준선 (붉은 레이저)
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 4;
      ctx.strokeStyle = '#ff0033'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(38, 41); ctx.lineTo(60, 41); ctx.stroke();
      ctx.shadowBlur = 0;

      // 카모 슈트 & 가죽 부츠
      ctx.fillStyle = '#0f172a'; ctx.fillRect(cx - 9, 54, 7, 18); ctx.fillRect(cx + 2, 54, 7, 18);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(cx - 11, 34, 22, 22);

      // 매의 눈 철제 가면
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(cx, 22, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath(); ctx.moveTo(cx - 8, 18); ctx.lineTo(cx, 26); ctx.lineTo(cx + 8, 18); ctx.closePath(); ctx.fill();
      // 매의 안광
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(cx - 6, 21, 4, 2); ctx.fillRect(cx + 2, 21, 4, 2);
      ctx.shadowBlur = 0;
    });

    // 3차: 👑 멸절의 갓스나이퍼 (천상의 샤프슈터 아머, 천체 관측 고글, 신살의 거대 컴파운드 보우)
    this.heroSprites.archer_sniper_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 34;
      // 천상 에테르 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, 80, 20, 7, 0, 0, Math.PI*2); ctx.fill();

      // 거대 신살의 컴파운드 보우 (도르래 + 에테르 화살 발광)
      ctx.save();
      ctx.translate(14, 44);
      ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 28, -Math.PI*0.42, Math.PI*0.42); ctx.stroke();
      // 도르래 캠
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(Math.cos(-Math.PI*0.42)*28, Math.sin(-Math.PI*0.42)*28, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(Math.cos(Math.PI*0.42)*28, Math.sin(Math.PI*0.42)*28, 4, 0, Math.PI*2); ctx.fill();
      // 빛의 에테르 화살
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -2, 34, 4);
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.moveTo(32, -5); ctx.lineTo(40, 0); ctx.lineTo(32, 5); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 천상 슈트
      ctx.fillStyle = '#0c4a6e'; ctx.fillRect(cx - 10, 56, 8, 20); ctx.fillRect(cx + 2, 56, 8, 20);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(cx - 12, 34, 24, 24);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(cx - 12, 34, 24, 24);

      // 천체 관측 고글 & 황금 깃털
      ctx.fillStyle = '#0c4a6e'; ctx.beginPath(); ctx.arc(cx, 22, 12, 0, Math.PI*2); ctx.fill();
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(cx - 4, 22, 4, 0, Math.PI*2); ctx.arc(cx + 4, 22, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // =======================================================================
    // [5] 궁수: 윈드러너 3단계 (Archer - Windrunner)
    // =======================================================================

    // 1차: 견습 쾌속궁수 (에메랄드 그린 판초, 단궁)
    this.heroSprites.archer_windrunner_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();

      // 왼손: 날렵한 단궁
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(16, 44, 16, -Math.PI*0.4, Math.PI*0.4); ctx.stroke();

      // 에메랄드 판초 망토
      ctx.fillStyle = '#064e3b'; ctx.fillRect(cx - 8, 56, 6, 16); ctx.fillRect(cx + 2, 56, 6, 16);
      ctx.fillStyle = '#047857';
      ctx.beginPath(); ctx.moveTo(cx - 14, 34); ctx.lineTo(cx + 14, 34); ctx.lineTo(cx + 10, 56); ctx.lineTo(cx - 10, 56); ctx.closePath(); ctx.fill();

      // 포니테일 & 녹색 머리띠
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 24, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#10b981'; ctx.fillRect(cx - 10, 18, 20, 3);
      // 에메랄드 눈동자
      ctx.fillStyle = '#10b981'; ctx.fillRect(cx - 5, 24, 3, 3); ctx.fillRect(cx + 2, 24, 3, 3);
    });

    // 2차: 질풍의 윈드러너 (롱 에메랄드 스카프 휘날림, 풍령의 날개 활)
    this.heroSprites.archer_windrunner_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI*2); ctx.fill();

      // 휘날리는 긴 에메랄드 스카프
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(cx - 10, 32);
      ctx.quadraticCurveTo(cx - 24, 38, cx - 28, 56);
      ctx.quadraticCurveTo(cx - 18, 48, cx - 6, 36);
      ctx.fill();

      // 풍령의 날개 활 (녹색 바람 파티클)
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 8;
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(14, 44, 22, -Math.PI*0.4, Math.PI*0.4); ctx.stroke();
      ctx.shadowBlur = 0;

      // 질풍 슈트
      ctx.fillStyle = '#064e3b'; ctx.fillRect(cx - 9, 54, 7, 18); ctx.fillRect(cx + 2, 54, 7, 18);
      ctx.fillStyle = '#047857'; ctx.fillRect(cx - 11, 34, 22, 22);

      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 22, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4ade80'; ctx.fillRect(cx - 5, 22, 3, 3); ctx.fillRect(cx + 2, 22, 3, 3);
    });

    // 3차: 👑 환영폭풍의 템페스트 (바람의 날개 망토, 바람의 정령관, 폭풍의 쌍곡궁 소용돌이)
    this.heroSprites.archer_windrunner_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 36;
      // 질풍의 소용돌이 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, 80, 22, 7, 0, 0, Math.PI*2); ctx.fill();

      // 바람의 날개 망토
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(cx - 14, 32); ctx.lineTo(cx - 30, 54); ctx.lineTo(cx - 20, 72);
      ctx.lineTo(cx + 10, 48); ctx.closePath(); ctx.fill();

      // 폭풍의 쌍곡궁 (그린 번개 소용돌이)
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 12;
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(14, 44, 28, -Math.PI*0.4, Math.PI*0.4); ctx.stroke();
      ctx.shadowBlur = 0;

      // 템페스트 슈트
      ctx.fillStyle = '#064e3b'; ctx.fillRect(cx - 10, 56, 8, 20); ctx.fillRect(cx + 2, 56, 8, 20);
      ctx.fillStyle = '#047857'; ctx.fillRect(cx - 12, 34, 24, 24);

      // 바람의 정령관 (에메랄드 티아라)
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 22, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.moveTo(cx - 10, 16); ctx.lineTo(cx, 8); ctx.lineTo(cx + 10, 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 5, 22, 3, 3); ctx.fillRect(cx + 2, 22, 3, 3);
    });

    // =======================================================================
    // [6] 궁수: 트래퍼 3단계 (Archer - Trapper)
    // =======================================================================

    // 1차: 견습 덫사냥꾼 (가죽 방호 자켓, 탄띠, 핸드 쇠뇌)
    this.heroSprites.archer_trapper_t1 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();

      // 핸드 쇠뇌
      ctx.fillStyle = '#78350f'; ctx.fillRect(14, 40, 18, 5);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(12, 34, 3, 17);

      // 가죽 방호 자켓 & 사선 탄띠
      ctx.fillStyle = '#1c1917'; ctx.fillRect(cx - 8, 56, 6, 16); ctx.fillRect(cx + 2, 56, 6, 16);
      ctx.fillStyle = '#78350f'; ctx.fillRect(cx - 10, 36, 20, 22);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 10, 36); ctx.lineTo(cx + 10, 56); ctx.stroke();

      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 24, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d97706'; ctx.fillRect(cx - 10, 16, 20, 4); // 가죽 헤드기어
    });

    // 2차: 마공 트랩마스터 (스팀펑크 황동 고글 렌즈 반사, 화약 탄띠 & 대형 폭발 쇠뇌)
    this.heroSprites.archer_trapper_t2 = createHdCanvas(64, 80, (ctx, w, h) => {
      const cx = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, 74, 18, 6, 0, 0, Math.PI*2); ctx.fill();

      // 대형 폭발 쇠뇌
      ctx.fillStyle = '#451a03'; ctx.fillRect(10, 38, 24, 8);
      ctx.fillStyle = '#d97706'; ctx.fillRect(8, 28, 4, 28);

      ctx.fillStyle = '#09090b'; ctx.fillRect(cx - 9, 54, 7, 18); ctx.fillRect(cx + 2, 54, 7, 18);
      ctx.fillStyle = '#451a03'; ctx.fillRect(cx - 11, 34, 22, 22);

      // 스팀펑크 황동 고글 (푸른 렌즈 반사광)
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(cx, 22, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d97706'; ctx.fillRect(cx - 9, 19, 18, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(cx - 4, 22, 3.5, 0, Math.PI*2); ctx.arc(cx + 4, 22, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5, 20, 1.5, 1.5); ctx.fillRect(cx + 3, 20, 1.5, 1.5);
    });

    // 3차: 👑 공성파괴의 아틸러리 (기계식 티타늄 외골격 아머, 어깨 미사일 포드 & 대구경 마도 거포)
    this.heroSprites.archer_trapper_t3 = createHdCanvas(72, 88, (ctx, w, h) => {
      const cx = 34;
      // 화염/폭발 기계 아우라
      const aura = ctx.createRadialGradient(cx, 44, 10, cx, 44, 36);
      aura.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, 80, 22, 7, 0, 0, Math.PI*2); ctx.fill();

      // 어깨 장착 다연장 미사일 포드
      ctx.fillStyle = '#27272a'; ctx.fillRect(cx - 24, 24, 12, 16);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(cx - 20, 28, 2, 0, Math.PI*2); ctx.arc(cx - 16, 28, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 20, 34, 2, 0, Math.PI*2); ctx.arc(cx - 16, 34, 2, 0, Math.PI*2); ctx.fill();

      // 대구경 마도 거포 (핸드 캐논 - 총구 화염 발광)
      ctx.fillStyle = '#18181b'; ctx.fillRect(8, 38, 36, 14);
      ctx.fillStyle = '#f97316'; ctx.fillRect(6, 36, 6, 18);
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(6, 45, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      // 티타늄 외골격 아머
      ctx.fillStyle = '#18181b'; ctx.fillRect(cx - 11, 56, 9, 20); ctx.fillRect(cx + 3, 56, 9, 20);
      ctx.fillStyle = '#27272a'; ctx.fillRect(cx - 13, 34, 26, 24);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, 34, 26, 24);

      // 바이저 헬름
      ctx.fillStyle = '#18181b'; ctx.beginPath(); ctx.arc(cx, 22, 12, 0, Math.PI*2); ctx.fill();
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#f97316'; ctx.fillRect(cx - 8, 21, 16, 4);
      ctx.shadowBlur = 0;
    });
  }

  // =========================================================================
  // 3. 🔥👑 소환수 3종 (이그니스, 볼트, 실피드) - 웅장하고 멋진 1~3차 신수
  // =========================================================================
  generateMajesticPetSprites() {
    // -----------------------------------------------------------------------
    // [1] 이그니스 (Ignis) - 화룡 / 불사조-바하무트 신수 계열
    // -----------------------------------------------------------------------
    const ignisPalette = {
      '.': 'transparent',
      'H': '#facc15', // 황금 뿔 / 왕관
      'h': '#fef08a', // 빛나는 뿔 끝
      'R': '#dc2626', // 용의 붉은 비늘
      'r': '#ef4444', // 밝은 적색 비늘
      'D': '#991b1b', // 흑적색 그림자
      'O': '#f97316', // 주황색 화염 갈기
      'Y': '#fde047', // 노란 배 비늘
      'E': '#ffffff', // 번쩍이는 용의 안광
      'e': '#0f172a', // 동공
      'W': '#ea580c', // 날개 피막
      'w': '#fb923c', // 밝은 날개
      'F': '#ffedd5'  // 화염 코어
    };

    // 1차 (아기 화룡 - 24x24): 날렵하고 앙증맞지만 날카로운 뿔과 불꽃 날개
    this.petSprites.ignis_t1 = this.renderPixelGrid(24, 24, [
      "..........h.............",
      ".........HH.............",
      "....WW..HRRRH...........",
      "...WWWWHREeRRH..........",
      "...WWWWWRRRRRR..........",
      "....WWWRRYYYRD..........",
      ".....WWRYYYYRD..........",
      "......WRYYYYRDD.........",
      "....RRRRRRRRRDDD........",
      "...RRRRRRRRRRRDDD.......",
      "..WWRRRRRRRRRR.DDD......",
      ".WWW.RRRRRRRRR..DDD.....",
      "wwW..RRR...RRR...ODD....",
      "wW...RRR...RRR....OOD...",
      ".....RRR...RRR.....OO...",
      ".....RRR...RRR......F...",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], ignisPalette);

    // 2차 (홍련의 샐러맨더 화룡 - 32x32): 거대한 뿔, 강력한 날개, 화염 갈기
    this.petSprites.ignis_t2 = this.renderPixelGrid(32, 32, [
      "............hh..................",
      "...........HHHH.................",
      ".....WW...HHRRRH....WW..........",
      "....WWWW.HHRRRRRH..WWWW.........",
      "...WWWWWHRREeRRRRHWWWWWW........",
      "..WWWWWWRRRRRRRRRWWWWWWW........",
      "..WWWWWWRRRYYYYRRWWWWWWW........",
      "...WWW.WRRYYYYYRRW.WWWW.........",
      "....W..WRRYYYYYRRW..WW..........",
      ".......WRRYYYYYRRW..............",
      ".....RRRRRRRRRRRRRRRR...........",
      "...RRRRRRRRRRRRRRRRRRRR.........",
      "..RRRRRRRRRRRRRRRRRRRRRR........",
      "..RRRRRRRRRRRRRRRRRRRRRR........",
      "..WWRRRRRYYYYYYYYRRRR.DDD.......",
      ".WWWRRRRRYYYYYYYYRRRR..DDD......",
      ".WWW.RRRRRRRRRRRRRRRR...DDD.....",
      "wWW..RRRRRRRRRRRRRRRR....ODD....",
      "ww...RRRR....RRRR.........OOD...",
      ".....RRRR....RRRR..........OO...",
      ".....RRRR....RRRR...........F...",
      ".....RRRR....RRRR...............",
      ".....DDRR....DDRR...............",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................"
    ], ignisPalette);

    // 3차 최종 각성 (진 홍련의 파괴신 바하무트 - 40x40): 4장 날개, 황금 왕관 뿔, 거대한 화염 신수
    this.petSprites.ignis_t3 = this.renderPixelGrid(40, 40, [
      "...............hhhhh....................",
      "..............HHHHHHH...................",
      ".....WWWW....HHHHHHHHH....WWWW..........",
      "....WWWWWW..HHRRRRRRRRH..WWWWWW.........",
      "...WWWWWWWWHHRRREeRRRRRHWWWWWWWW........",
      "..WWWWWWWWWHRRRRRRRRRRRRWWWWWWWWW.......",
      "..WWWWWWWWWHRRRYYYYYYRRRWWWWWWWWW.......",
      "...WWWWWW.WHRRYYYYYYYRRHW.WWWWWW........",
      "....WWWW..WHRRYYYYYYYRRHW..WWWW.........",
      ".....WW...WHRRYYYYYYYRRHW...WW..........",
      "..........WHRRYYYYYYYRRHW...............",
      "........RRRRRRRRRRRRRRRRRRRR............",
      ".......RRRRRRRRRRRRRRRRRRRRRR...........",
      "......RRRRRRRRRRRRRRRRRRRRRRRR..........",
      ".....RRRRRRRRRRRRRRRRRRRRRRRRRR.........",
      "....WWRRRRRRRYYYYYYYYYYRRRRRR.DDD.......",
      "...WWWRRRRRRRYYYYYYYYYYRRRRRR..DDD......",
      "..WWWW.RRRRRRRRRRRRRRRRRRRRRR...DDD.....",
      "..WWW..RRRRRRRRRRRRRRRRRRRRRR....ODD....",
      ".wWW...RRRRRRRRRRRRRRRRRRRRRR.....OOD...",
      ".ww....RRRRRR......RRRRRR..........OO...",
      ".......RRRRRR......RRRRRR...........F...",
      ".......RRRRRR......RRRRRR...............",
      ".......RRRRRR......RRRRRR...............",
      ".......DDRRRR......DDRRRR...............",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................"
    ], ignisPalette);

    // 호환성 보장 (기본)
    this.petSprites.ignis = this.petSprites.ignis_t1;

    // -----------------------------------------------------------------------
    // [2] 볼트 (Bolt) - 청백색 뇌제 / 전격 늑대-기린 뇌수
    // -----------------------------------------------------------------------
    const boltPalette = {
      '.': 'transparent',
      'L': '#facc15', // 번개 황금 뿔
      'l': '#fef08a', // 번개 스파크
      'B': '#0284c7', // 뇌수 블루
      'b': '#38bdf8', // 네온 스카이블루
      'D': '#0f172a', // 다크 네이비
      'W': '#ffffff', // 백색 털 갈기
      'w': '#e0f2fe', // 밝은 백색
      'E': '#fef08a', // 번개빛 안광
      'e': '#0369a1'  // 동공
    };

    // 1차 (어린 뇌수 - 24x24)
    this.petSprites.bolt_t1 = this.renderPixelGrid(24, 24, [
      ".........ll.............",
      "........LLLL............",
      ".......LLbbLL...........",
      "......LbbbbbbL..........",
      ".....LbbEebbEEb.........",
      ".....bbbbbbbbbb.........",
      ".....bbWwwwwWbb.........",
      ".....bWWwwwwWWb.........",
      "......bbWwwWbb..........",
      "....bbbbbbbbbbbb........",
      "...bbbbbbbbbbbbbb.......",
      "..llbbbbbbbbbb.bbb......",
      "..l.bbbbbbbbbb..bbb.....",
      "....bbb....bbb...llb....",
      "....bbb....bbb....ll....",
      "....DDD....DDD.....l....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], boltPalette);

    // 2차 (뇌신 펜리르 - 32x32)
    this.petSprites.bolt_t2 = this.renderPixelGrid(32, 32, [
      "...........llll.................",
      "..........LLLLLL................",
      ".........LLbbbbLL...............",
      "........LLbbbbbbLL..............",
      ".......LbbbEebbEEbL.............",
      ".......bbbbbbbbbbbb.............",
      "......lbbWWwwwwWWbbl............",
      ".....llbbWWwwwwWWbbll...........",
      ".....ll.bbWwwwwWbb.ll...........",
      "........bbbbbbbbbb..............",
      ".....bbbbbbbbbbbbbbbb...........",
      "...bbbbbbbbbbbbbbbbbbbb.........",
      "..llbbbbbbbbbbbbbbbbbbbb........",
      "..llbbbbbbbbbbbbbbbb.bbb........",
      "...lbbbbWWwwwwWWbbbb..bbb.......",
      "....bbbbWWwwwwWWbbbb...bbb......",
      "....bbbbbbbbbbbbbbbb....llb.....",
      "....bbbb........bbbb.....ll.....",
      "....bbbb........bbbb......l.....",
      "....DDDD........DDDD............",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................"
    ], boltPalette);

    // 3차 최종 각성 (창공의 뇌제 제우스 - 40x40): 뇌신 링, 거대 뇌각
    this.petSprites.bolt_t3 = this.renderPixelGrid(40, 40, [
      ".............llllll.....................",
      "............LLLLLLLL....................",
      "...........LLbbbbbbLL...................",
      "..........LLbbbbbbbbLL..................",
      ".........LbbbbEebbEEbbL.................",
      "........LbbbbbbbbbbbbbbL................",
      ".......llbbbWWwwwwWWbbbll...............",
      "......lllbbbWWwwwwWWbbblll..............",
      "......lll.bbWwwwwwwWbb.lll..............",
      "..........bbbbbbbbbbbb..................",
      "......bbbbbbbbbbbbbbbbbbbb..............",
      "....bbbbbbbbbbbbbbbbbbbbbbbb............",
      "...llbbbbbbbbbbbbbbbbbbbbbbbb...........",
      "...llbbbbbbbbbbbbbbbbbbbb.bbbb..........",
      "....lbbbbbWWwwwwwwWWbbbbb..bbbb.........",
      ".....bbbbbWWwwwwwwWWbbbbb...bbbb........",
      ".....bbbbbbbbbbbbbbbbbbbb....lllb.......",
      ".....bbbbbb........bbbbbb.....lll.......",
      ".....bbbbbb........bbbbbb......ll.......",
      ".....DDDDDD........DDDDDD.......l.......",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................"
    ], boltPalette);

    this.petSprites.bolt = this.petSprites.bolt_t1;

    // -----------------------------------------------------------------------
    // [3] 실피드 (Sylph) - 숲과 세계수의 신비로운 요정 성수
    // -----------------------------------------------------------------------
    const sylphPalette = {
      '.': 'transparent',
      'P': '#f472b6', // 벚꽃 핑크
      'p': '#fbcfe8', // 연분홍 벚꽃
      'G': '#16a34a', // 에메랄드 그린
      'g': '#4ade80', // 밝은 연두빛
      'W': '#ffffff', // 백색 날개
      'w': '#f0fdf4', // 맑은 빛
      'E': '#064e3b', // 맑은 에메랄드 눈
      'Y': '#facc15'  // 황금 관 / 크리스탈
    };

    // 1차 (숲의 수호 정령 - 24x24)
    this.petSprites.sylph_t1 = this.renderPixelGrid(24, 24, [
      ".........YY.............",
      "........YYYY............",
      "....WW.YGggGY..WW.......",
      "...WWWWGgggggGWWWW......",
      "...WWWWGgEggEGWWWW......",
      "....WWWGGggggGGWWW......",
      ".....WWGGppppGGWW.......",
      "......WGGppppGGW........",
      ".....GGGGggggGGGG.......",
      "....GGGGGGGGGGGGGG......",
      "...WWGGGGGGGGGG.GG......",
      "..WWW.GGGGGGGGG..GG.....",
      "..W...GGG...GGG...PP....",
      "......GGG...GGG....PP...",
      "......GGG...GGG.....P...",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], sylphPalette);

    // 2차 (숲의 성수 카벙클/그리폰 - 32x32)
    this.petSprites.sylph_t2 = this.renderPixelGrid(32, 32, [
      "...........YYYY.................",
      "..........YYYYYY................",
      "....WWWW.YYGggGYY.WWWW..........",
      "...WWWWWWYGgggggGYWWWWWW........",
      "...WWWWWWGgEggEGgGWWWWWW........",
      "....WWWWGGGgggggGGGWWWW.........",
      ".....WWWGGGppppppGGGWWW.........",
      "......WWGGGppppppGGGW...........",
      "......W.GGGGggggGGGG.W..........",
      ".....GGGGGGGGGGGGGGGG...........",
      "...GGGGGGGGGGGGGGGGGGGG.........",
      "..WWGGGGGGGGGGGGGGGG.GGG........",
      ".WWW.GGGGGGGGGGGGGGG..GGG.......",
      ".W...GGGGGGGGGGGGGGG...PPP......",
      ".....GGGG.......GGGG....PPP.....",
      ".....GGGG.......GGGG.....PP.....",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................"
    ], sylphPalette);

    // 3차 최종 각성 (이그드라실 세라프 - 40x40): 6장의 성스러운 빛의 날개, 황금 헤일로 후광
    this.petSprites.sylph_t3 = this.renderPixelGrid(40, 40, [
      ".............YYYYYY.....................",
      "............YYYYYYYY....................",
      "...WWWWW...YYYGggGYYY...WWWWW...........",
      "..WWWWWWW.YYGggggggGYY.WWWWWWW..........",
      ".WWWWWWWWWYGgEggEEggGYWWWWWWWWW.........",
      ".WWWWWWWWWWGGggggggGGWWWWWWWWWW.........",
      "..WWWWWWW.GGGppppppGGG.WWWWWWW..........",
      "...WWWWW..GGGppppppGGG..WWWWW...........",
      "....WWW...GGGGggggGGGG...WWW............",
      ".....W...GGGGGGGGGGGGGG...W.............",
      "......GGGGGGGGGGGGGGGGGGGG..............",
      "....GGGGGGGGGGGGGGGGGGGGGGGG............",
      "...WWGGGGGGGGGGGGGGGGGGGG.GGGG..........",
      "..WWW.GGGGGGGGGGGGGGGGGGG..GGGG.........",
      "..W...GGGGGGGGGGGGGGGGGGG...PPPP........",
      "......GGGGGG........GGGGGG...PPPP.......",
      "......GGGGGG........GGGGGG....PP........",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................",
      "........................................"
    ], sylphPalette);

    this.petSprites.sylph = this.petSprites.sylph_t1;
  }

  // =========================================================================
  // 4. 👾 드래곤퀘스트 (Dragon Quest) 정통 몬스터 10종
  // =========================================================================
  generateDqMonsterSprites() {
    // -----------------------------------------------------------------------
    // [1] 물방울 슬라임 (Slime) - 24x24
    // 완벽한 드퀘 물방울 실루엣 + 땡그란 커다란 눈 + 활짝 웃는 입
    // -----------------------------------------------------------------------
    const slimePalette = {
      '.': 'transparent',
      'B': '#0284c7', // 슬라임 진한 블루 외곽
      'b': '#38bdf8', // 하늘색 슬라임 바디
      'H': '#e0f2fe', // 반사광 하이라이트
      'W': '#ffffff', // 눈 흰자
      'E': '#0f172a', // 까만 눈동자
      'M': '#dc2626'  // 활짝 웃는 입
    };
    this.dqMonsters.slime = this.renderPixelGrid(24, 24, [
      "...........B............",
      "..........BbB...........",
      ".........BbbbB..........",
      "........BbbbbbB.........",
      ".......BbbHbbbbB........",
      "......BbbHHHbbbbB.......",
      ".....BbbbHHbbbbbbB......",
      "....BbbbbbbbbbbbbbB.....",
      "...BbbbbbbbbbbbbbbbB....",
      "...BbbWWbbbbbbWWbbbB....",
      "..BbbWEEWbbbbWEEWbbbB...",
      "..BbbWEEWbbbbWEEWbbbB...",
      "..BbbbWWbbbbbbWWbbbbB...",
      "..BbbbbbbbbbbbbbbbbbB...",
      "..BbbbbbbMMMMbbbbbbbB...",
      "..BbbbbbMMMMMMbbbbbbB...",
      "...BbbbbbbbbbbbbbbbB....",
      "....BBbbbbbbbbbbbBB.....",
      "......BBBBBBBBBBB.......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], slimePalette);

    // -----------------------------------------------------------------------
    // [2] 드라키 박쥐 (Dracky) - 28x24
    // 보라빛 통통한 몸 + 뾰족 귀 + 큰 땡그란 눈 + 앙증맞은 흰 송곳니 2개
    // -----------------------------------------------------------------------
    const drackyPalette = {
      '.': 'transparent',
      'P': '#7c3aed', // 보라색 외곽
      'p': '#a855f7', // 연보라 바디
      'B': '#f472b6', // 분홍 귀 안쪽 / 배
      'W': '#ffffff', // 눈 흰자 / 송곳니
      'E': '#0f172a', // 눈동자
      'K': '#1e1b4b'  // 박쥐 날개 흑색
    };
    // 날개 올림 (Frame 0)
    this.dqMonsters.dracky_f0 = this.renderPixelGrid(28, 24, [
      "...PP..............PP...",
      "..PBP..............PBP..",
      ".PBBBP............PBBBP.",
      ".PBBBP...pppppp...PBBBP.",
      "..PPP...pppppppp...PPP..",
      "..KK...pppppppppp...KK..",
      ".KKKK.ppWWppppWWpp.KKKK.",
      "KKKKK.pWEEWppWEEWp.KKKKK",
      ".KKKK.pWEEWppWEEWp.KKKK.",
      "..KKK.ppWWppppWWpp.KKK..",
      ".......pppWppWppp.......",
      ".......pppWWppWWpp......",
      "........ppBBBBpp........",
      ".......pppBBBBppp.......",
      "........pppppppp........",
      ".........pppppp.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], drackyPalette);

    // 날개 내림 (Frame 1)
    this.dqMonsters.dracky_f1 = this.renderPixelGrid(28, 24, [
      "...PP..............PP...",
      "..PBP..............PBP..",
      ".PBBBP............PBBBP.",
      ".PBBBP...pppppp...PBBBP.",
      "..PPP...pppppppp...PPP..",
      ".......pppppppppp.......",
      "......ppWWppppWWpp......",
      "......pWEEWppWEEWp......",
      "..KK..pWEEWppWEEWp..KK..",
      ".KKKK.ppWWppppWWpp.KKKK.",
      "KKKKK..pppWppWppp..KKKKK",
      ".KKKK..ppWWppWWpp..KKKK.",
      "..KKK...ppBBBBpp...KKK..",
      ".......pppBBBBppp.......",
      "........pppppppp........",
      ".........pppppp.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], drackyPalette);
    this.dqMonsters.bat = this.dqMonsters.dracky_f0;

    // -----------------------------------------------------------------------
    // [3] 리자드맨 (Lizardman) - 28x30
    // 녹색 비늘 도마뱀 전사 + 붉은 볏 + 시미터 검 + 원형 방패 + 흔들리는 꼬리
    // -----------------------------------------------------------------------
    const lizardPalette = {
      '.': 'transparent',
      'R': '#ef4444', // 머리/등 붉은 볏
      'G': '#15803d', // 녹색 외곽
      'g': '#22c55e', // 밝은 녹색 비늘
      'Y': '#facc15', // 노란 뱀 눈 / 배 비늘
      'E': '#0f172a', // 세로 슬릿 동공
      'S': '#f1f5f9', // 검날 (은색)
      's': '#94a3b8', // 칼자루
      'W': '#78350f', // 나무 방패
      'w': '#f59e0b'  // 방패 황금 테두리
    };
    this.dqMonsters.lizardman = this.renderPixelGrid(28, 30, [
      "............RR..........",
      "...........RRRR.........",
      "..........RRGGGG........",
      ".........RGGggggGG......",
      "........RGGggEYgGG......",
      ".......RGGggggggggGG....",
      ".......GGGGGGGGGGGGG....",
      ".......GGgYYggggGG......",
      "........GgYYYYggG.......",
      "...wWWw.GGgggggGG...S...",
      "..wWWWWwGGGGGGGGG..SS...",
      "..wWWWWwGgggggggG..SS...",
      "..wWWWWwGggYYgggG..SS...",
      "...wWWw.GggYYgggG..SS...",
      "........GggYYgggG..SS...",
      "........GGGGGGGGG..SS...",
      ".........GG...GG...SS...",
      ".........GG...GG...ss...",
      "........GGG...GGG.......",
      ".......GGG.....GGG......",
      "....GGGG................",
      "...GGG..................",
      "..GG....................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], lizardPalette);
    this.dqMonsters.goblin_warrior = this.dqMonsters.lizardman;

    // -----------------------------------------------------------------------
    // [4] 해골 검사 (Skeleton) - 24x28
    // 두개골, 투구, 푸른 안광, 뼈대, 녹슨 검
    // -----------------------------------------------------------------------
    const skelPalette = {
      '.': 'transparent',
      'H': '#94a3b8', // 투구
      'W': '#f8fafc', // 흰 뼈
      'D': '#cbd5e1', // 뼈 그림자
      'B': '#38bdf8', // 눈구멍 속 푸른 안광
      'E': '#0f172a', // 안와
      'S': '#64748b'  // 녹슨 검
    };
    this.dqMonsters.skeleton = this.renderPixelGrid(24, 28, [
      ".........HHHH...........",
      "........HHHHHH..........",
      ".......HHHHHHHH.........",
      "......WWWWWWWWWW........",
      "......WWEEWWEEWW........",
      "......WWEBWWEBEW........",
      "......WWEEWWEEWW........",
      ".......WWDDDDWW.........",
      "........WWWWWW..........",
      ".........W..W...........",
      ".......WWWWWWWW.........",
      "......WW.WWWW.WW...S....",
      ".....WW..WWWW..WW.SS....",
      ".....W...WWWW...W.SS....",
      ".........W..W.....SS....",
      ".........WWWW.....SS....",
      "........WW..WW....SS....",
      "........WW..WW....S.....",
      "........WW..WW..........",
      "........WW..WW..........",
      ".......WWW..WWW.........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], skelPalette);

    // -----------------------------------------------------------------------
    // [5] 오크 헌터 (Orc) - 28x28
    // 초록 피부 돼지코 오크 + 어금니 + 삼지창
    // -----------------------------------------------------------------------
    const orcPalette = {
      '.': 'transparent',
      'G': '#166534', // 오크 피부 짙은 녹색
      'g': '#22c55e', // 밝은 녹색
      'P': '#f472b6', // 돼지코 핑크
      'p': '#be185d', // 콧구멍
      'W': '#ffffff', // 솟아난 어금니 / 눈 흰자
      'E': '#0f172a', // 눈동자
      'L': '#78350f', // 가죽 벨트
      'S': '#94a3b8', // 3지창 창날
      's': '#451a03'  // 삼지창 나무 자루
    };
    this.dqMonsters.dark_orc = this.renderPixelGrid(28, 28, [
      "........GGGGGGGG........",
      ".......GGggggggGG.......",
      "......GGgWEEggWEEGG..S.S",
      "......GGgWEEggWEEGG..SSS",
      "......GGgPPggPPggGG...S.",
      "......GGgPppPppPgGG...s.",
      "......GGgWWggWWggGG...s.",
      ".......GGGGGGGGGG.....s.",
      "......GGGGGGGGGGGG....s.",
      ".....GGGGLLLLLLGGGG...s.",
      "....GGGGGGLLLLGGGGGG..s.",
      "...GGGGGGGGLLGGGGGGGG.s.",
      "...GG.GGGGGGGGGGGG.GG.s.",
      "......GGGGGGGGGGGG....s.",
      ".......GGGG..GGGG.....s.",
      ".......GGGG..GGGG.......",
      "......GGGG....GGGG......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], orcPalette);

    // -----------------------------------------------------------------------
    // [6] 움직이는 갑옷 (Lethal Armor) - 28x32
    // 텅 빈 중세 풀플레이트 + 붉은 안광 슬릿 + 대검
    // -----------------------------------------------------------------------
    const armorPalette = {
      '.': 'transparent',
      'M': '#1e293b', // 암청색 중갑
      'm': '#3b82f6', // 하이라이트
      'D': '#0f172a', // 음영
      'R': '#ef4444', // 바이저 붉은 안광
      'S': '#f1f5f9', // 양손 대검
      's': '#94a3b8'
    };
    this.dqMonsters.undead_knight = this.renderPixelGrid(28, 32, [
      ".........MMMM...........",
      "........MMmmmmM.........",
      ".......MMmmDDmmM........",
      "......MMMDDDDDDMM.......",
      "......MMMRRRRRRMM.......",
      "......MMMDDDDDDMM.......",
      ".......MMMMMMMM.........",
      "......MMMMMMMMMM...S....",
      ".....MMMMmmmmMMMM.SSS...",
      "....MM.MMmmmmMM.MM.S....",
      "...MM..MMmmmmMM..MMS....",
      "...M...MMDDDDMM...MS....",
      ".......MMDDDDMM....S....",
      ".......MMDDDDMM....S....",
      "........MM..MM.....S....",
      "........MM..MM.....S....",
      "........MM..MM.....S....",
      ".......MMM..MMM....s....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ], armorPalette);

    // -----------------------------------------------------------------------
    // [7] 기간테스 외눈 거인 (Gigantes - 9분 준보스) - 34x38
    // 거대한 단안(외눈) + 뿔 + 가시 달린 거대 곤봉
    // -----------------------------------------------------------------------
    const gigantesPalette = {
      '.': 'transparent',
      'H': '#facc15', // 머리 뿔
      'B': '#0284c7', // 푸른 거인 피부
      'b': '#38bdf8', // 밝은 블루
      'W': '#ffffff', // 거대 외눈 흰자
      'E': '#dc2626', // 충혈된 붉은 눈동자
      'e': '#0f172a', // 동공
      'L': '#d97706', // 호피 가죽 바지
      'l': '#78350f', // 호피 무늬
      'C': '#78350f', // 거대 가시 곤봉
      'c': '#f8fafc'  // 곤봉 가시 스파이크
    };
    this.dqMonsters.elite_minotaur = this.renderPixelGrid(34, 38, [
      "............HH....................",
      "...........HHHH...................",
      "..........BBBBBB..................",
      ".........BBbbbbBB.................",
      "........BBbWWWWbBB................",
      "........BBbWEEWbBB................",
      "........BBbWeeWbBB................",
      "........BBbWWWWbBB................",
      ".........BBBBBBBB......c..........",
      ".......BBBBBBBBBBBB...CCC.........",
      "......BBBBBBBBBBBBBB.CCCCC........",
      ".....BB.BBBBBBBBBB.B.CCCCCc.......",
      "....BB..BBBBBBBBBB..BCCCCC........",
      "....B...BBLLLLLLBB...CCCCC........",
      "........BBLLLLLLBB....CCC.........",
      "........BBLLlLlLBB.....C..........",
      ".........BBLLLLBB......C..........",
      ".........BB....BB......C..........",
      ".........BB....BB......C..........",
      "........BBB....BBB................",
      ".......BBBB....BBBB...............",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      ".................................."
    ], gigantesPalette);

    // -----------------------------------------------------------------------
    // [8] 스톤 골렘 (Stone Golem - 20분 대형 보스) - 36x38
    // 황토/벽돌 텍스처 사각 바위 거인 + 노란 빛나는 눈
    // -----------------------------------------------------------------------
    const golemPalette = {
      '.': 'transparent',
      'B': '#78350f', // 벽돌 짙은 갈색
      'b': '#b45309', // 황토벽돌 바위
      'O': '#d97706', // 밝은 벽돌
      'Y': '#facc15'  // 노란 안광 눈
    };
    this.dqMonsters.golem_boss = this.renderPixelGrid(36, 38, [
      "..........BBBBBBBBBBBB..........",
      ".........BbbbOBbbbbOBbB.........",
      ".........BOOOOBBOOOOBbB.........",
      ".........BbbYYbbbbYYbbB.........",
      ".........BbbYYbbbbYYbbB.........",
      ".........BbbbOBbbbbOBbB.........",
      ".........BBBBBBBBBBBBBB.........",
      "....BBBB.BbbbOBbbbbOBbB.BBBB....",
      "...BbbbB.BOOOOBBOOOOBbB.BbbbB...",
      "...BOOOB.BbbbOBbbbbOBbB.BOOOB...",
      "...BOOOB.BbbbOBbbbbOBbB.BOOOB...",
      "...BOOOB.BOOOOBBOOOOBbB.BOOOB...",
      "...BBBBB.BBBBBBBBBBBBBB.BBBBB...",
      ".........BbbbOBbbbbOBbB.........",
      ".........BOOOOBBOOOOBbB.........",
      ".........BbbbOBbbbbOBbB.........",
      ".........BBBBBBBBBBBBBB.........",
      "..........BBBB....BBBB..........",
      "..........BbbB....BbbB..........",
      "..........BbbB....BbbB..........",
      "..........BBBB....BBBB..........",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................"
    ], golemPalette);
    this.dqMonsters.elite_fire_golem = this.dqMonsters.golem_boss;

    // -----------------------------------------------------------------------
    // [9] 대마도사 하곤 (Archmage - 35분 대형 보스) - 34x38
    // 보라빛 사교도 예복 + 해골 지팡이 + 마왕의 위엄
    // -----------------------------------------------------------------------
    const archmagePalette = {
      '.': 'transparent',
      'H': '#dc2626', // 사교도 두건 뿔
      'P': '#581c87', // 진보라 로브
      'p': '#7c3aed', // 연보라 로브
      'G': '#facc15', // 황금 장식
      'E': '#ef4444', // 붉은 안광
      'S': '#f8fafc', // 해골 지팡이
      's': '#451a03'  // 지팡이 나무
    };
    this.dqMonsters.lich_boss = this.renderPixelGrid(34, 38, [
      "...........H....H.................",
      "..........HHH..HHH................",
      "..........PPPPPPPP................",
      ".........PPppppppPP...............",
      ".........PPgEEggEEPP..............",
      ".........PPgEEggEEPP..............",
      "..........PPGGGGPP................",
      "........GGPPPPPPPPGG...SSS........",
      ".......GG.PPppppPP.GG.SSSSS.......",
      "......GG..PPppppPP..GG.SSS........",
      "......G...PPGGGGPP...G..s.........",
      "..........PPppppPP......s.........",
      ".........PPPppppPPP.....s.........",
      "........PPPPppppPPPP....s.........",
      ".......PPPPPppppPPPPP...s.........",
      ".......PPPPPPPPPPPPPP...s.........",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      "..................................",
      ".................................."
    ], archmagePalette);
    this.dqMonsters.elite_shadow_reaper = this.dqMonsters.lich_boss;
    this.dqMonsters.elite_skeleton_lord = this.dqMonsters.skeleton;
    this.dqMonsters.abyss_hound = this.dqMonsters.dark_orc;

    // -----------------------------------------------------------------------
    // [10] 그레이트 드래곤 (Great Dragon - 55분 최종 보스) - 48x44
    // 드래곤퀘스트 정통 녹색 배불뚝이 드래곤 + 황금 뿔 + 거대한 날개 + 화염
    // -----------------------------------------------------------------------
    const dragonPalette = {
      '.': 'transparent',
      'H': '#facc15', // 황금 뿔
      'h': '#fef08a',
      'G': '#14532d', // 비늘 짙은 녹색
      'g': '#16a34a', // 녹색 비늘
      'Y': '#fde047', // 황금 배 비늘
      'E': '#fef08a', // 노란 용의 눈
      'e': '#0f172a',
      'W': '#0f766e', // 가죽 날개
      'w': '#14b8a6',
      'F': '#ef4444'  // 입에서 뿜는 불씨
    };
    this.dqMonsters.final_dragon_baal = this.renderPixelGrid(48, 44, [
      "....................hhhh........................",
      "...................HHHHHH.......................",
      "......WWWW........HHGggggGHH........WWWW........",
      ".....WWWWWW......HHGggggggGHH......WWWWWW.......",
      "....WWWWWWWW....HHGgEeGggEeGgHH...WWWWWWWW......",
      "...WWWWWWWWWW...HHGggggggggggHH..WWWWWWWWWW.....",
      "..WWWWWWWWWWWW...HHGggggggggGHH.WWWWWWWWWWWW....",
      "..WWWWWW.WWWWW....HGgYYYYYYgGH..WWWWW.WWWWWW....",
      "...WWW....WWWW....HGYYYYYYYYGH..WWWW....WWW.....",
      "....W......WWW...FGGYYYYYYYYGG..WWW......W......",
      "............W...FFGGYYYYYYYYGG...W..............",
      "...............GGGGGGGGGGGGGGGG.................",
      "..............GGGGGGGGGGGGGGGGGG................",
      ".............GGGGGGGGGGGGGGGGGGGG...............",
      "............GGGGGGYYYYYYYYYYGGGGGG..............",
      "...........GGGGGGGYYYYYYYYYYGGGGGGG.............",
      "..........GGGGGGGGYYYYYYYYYYGGGGGGGG............",
      ".........GGGGGGGGGGGGGGGGGGGGGGGGGGGG...........",
      "........GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..........",
      "........GGGGGGGG......GGGGGGGG...GGGG...........",
      "........GGGGGGGG......GGGGGGGG...GGGG...........",
      "........GGGGGGGG......GGGGGGGG....GGG...........",
      "........DDGGGGDD......DDGGGGDD.....GG...........",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................",
      "................................................"
    ], dragonPalette);
  }

  // 1. 이음새 없는 잔디 및 석판 바닥 타일 패턴 생성
  createGroundPatterns() {
    try {
      const grassCanvas = document.createElement('canvas');
      grassCanvas.width = 32;
      grassCanvas.height = 32;
      const gCtx = grassCanvas.getContext('2d');
      gCtx.imageSmoothingEnabled = false;

      gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 0, 0, 16, 16);
      gCtx.drawImage(this.townSheet, 16, 0, 16, 16, 16, 0, 16, 16);
      gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 0, 16, 16, 16);
      gCtx.drawImage(this.townSheet, 0, 0, 16, 16, 16, 16, 16, 16);

      const tempCtx = document.createElement('canvas').getContext('2d');
      this.grassPattern = tempCtx.createPattern(grassCanvas, 'repeat');
    } catch (e) {
      console.warn("Pattern creation fallback", e);
    }
  }

  // =========================================================================
  // 5. 인게임 렌더링 헬퍼 (Canvas 2D Render Interceptors)
  // =========================================================================

  // [1] 바닥 타일 렌더링
  renderBackground(ctx, player, canvasW, canvasH) {
    if (!this.usePixelArt || !this.grassPattern) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-player.x % 32, -player.y % 32);
    ctx.fillStyle = this.grassPattern;
    ctx.fillRect(-32, -32, canvasW + 64, canvasH + 64);
    ctx.restore();
    return true;
  }

  // [2] 🧙 영웅 캐릭터 (검사, 궁수, 소환사 2.5~3등신 도트 및 전직 단계별 외형)
  renderTamer(ctx, p, nameLabel) {
    if (!this.usePixelArt) return false;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // 타원형 캐릭터 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const heroClass = p.heroClass || 'summoner';
    const subclass = p.subclass || (heroClass === 'warrior' ? 'berserker' : (heroClass === 'archer' ? 'sniper' : 'ignis'));
    const tier = p.tier || (p.subclassDef && p.subclassDef.tier) || 1;

    let sprite = null;
    if (heroClass === 'warrior' || heroClass === 'archer') {
      const spriteKey = `${heroClass}_${subclass}_t${tier}`;
      sprite = this.heroSprites[spriteKey] || this.heroSprites[`${heroClass}_${subclass}_t1`];
      if (!sprite) {
        sprite = (heroClass === 'warrior') ? this.humanSprites.knight : this.humanSprites.ranger;
      }
    } else {
      // 소환사는 걷기/숨쉬기 2프레임
      const isMoving = Math.abs(p.vx || 0) > 0.1 || Math.abs(p.vy || 0) > 0.1;
      const frameIndex = isMoving ? Math.floor(Date.now() / 150) % 2 : Math.floor(Date.now() / 400) % 2;
      sprite = frameIndex === 1 ? this.humanSprites.tamer_f1 : this.humanSprites.tamer_f0;
    }

    if (sprite) {
      const tierScale = tier >= 3 ? 1.25 : (tier === 2 ? 1.12 : 1.0);
      const dw = 36 * tierScale;
      const dh = 48 * tierScale;

      // 3차 각성 시 전신 발광 아우라
      if (tier >= 3) {
        ctx.save();
        ctx.shadowBlur = 24;
        ctx.shadowColor = (heroClass === 'warrior') ? '#ef4444' : ((heroClass === 'archer') ? '#10b981' : '#facc15');
        ctx.drawImage(sprite, -dw / 2, -dh + 16, dw, dh);
        ctx.restore();
      } else if (tier === 2) {
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = (heroClass === 'warrior') ? '#f97316' : ((heroClass === 'archer') ? '#38bdf8' : '#818cf8');
        ctx.drawImage(sprite, -dw / 2, -dh + 16, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(sprite, -dw / 2, -dh + 16, dw, dh);
      }
    }

    // 소환사만 마도 지팡이 보석 빛 반짝임 오라
    if (heroClass === 'summoner') {
      const pulse = Math.sin(Date.now() / 200) * 4;
      ctx.save();
      ctx.shadowBlur = 12 + pulse;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(10, -18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 플레이어 닉네임 라벨
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(nameLabel, p.x, p.y - (tier >= 3 ? 42 : 36));

    // 무적 / 보호막 결계 구체
    if (p.isInvincible || (p.shieldBarrier && p.shieldBarrier > 0)) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    return true;
  }

  // [3] AI 동료 봇 (2.5등신 기사, 궁수, 성기사)
  renderAiBot(ctx, bot) {
    if (!this.usePixelArt) return false;

    ctx.save();
    ctx.translate(bot.x, bot.y);
    if (bot.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 봇 역할에 따른 스프라이트 분기
    let sprite = this.humanSprites.knight;
    if (bot.name && bot.name.includes('궁수')) sprite = this.humanSprites.ranger;
    if (bot.name && bot.name.includes('성기사')) sprite = this.humanSprites.paladin;

    if (sprite) {
      ctx.drawImage(sprite, -18, -32, 36, 48);
    }

    ctx.restore();

    // 이름표
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(bot.name, bot.x, bot.y - 34);
    ctx.restore();

    return true;
  }

  // [4] 🐾 소환수 3종 (이그니스, 볼트, 실피드) - 1~3차 각성별 웅장한 도트 & 오라
  renderPet(ctx, pet, time) {
    if (!this.usePixelArt) return false;

    const petId = (pet.config && pet.config.id) || 'ignis';
    const tier = pet.tier || 1;
    const spriteKey = `${petId}_t${tier}`;
    const sprite = this.petSprites[spriteKey] || this.petSprites[petId];

    if (!sprite) return false;

    // 공중 부유 호흡 애니메이션
    const bob = Math.sin(time * 5.5) * 4;
    const tierScale = tier >= 3 ? 1.7 : (tier === 2 ? 1.35 : 1.05);

    ctx.save();
    ctx.translate(pet.x, pet.y + bob);
    if (pet.facing === -1) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    // [Tier 3 각성] 등 뒤에 회전하는 신성한 마법진 휠
    if (tier >= 3) {
      ctx.save();
      ctx.rotate(time * 1.5);
      ctx.strokeStyle = pet.config.color || '#facc15';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 26 * tierScale, 0, Math.PI * 2);
      ctx.stroke();

      // 마법진 룬 스파이크
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = pet.config.color || '#facc15';
        ctx.fillRect(-2, -30 * tierScale, 4, 7);
      }
      ctx.restore();
    }

    // 신수 고유 발광 아우라
    ctx.shadowBlur = tier >= 3 ? 28 : (tier === 2 ? 18 : 12);
    ctx.shadowColor = pet.config.color || '#f59e0b';

    const w = sprite.width * tierScale * 1.35;
    const h = sprite.height * tierScale * 1.35;
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);

    ctx.restore();
    return true;
  }

  // [5] 👾 드래곤퀘스트 몬스터 렌더링
  renderEnemy(ctx, e, time) {
    if (!this.usePixelArt) return false;

    let sprite = this.dqMonsters[e.type];

    // 박쥐 날개 퍼덕임 애니메이션 분기
    if (e.type === 'bat') {
      const flap = Math.floor(time * 8) % 2;
      sprite = flap === 1 ? this.dqMonsters.dracky_f1 : this.dqMonsters.dracky_f0;
    }

    if (!sprite) {
      sprite = this.dqMonsters.slime; // 기본 폴백
    }

    const def = GAME_DATA.monsters[e.type] || {};
    const isBoss = def.isBoss || def.isElite;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.imageSmoothingEnabled = false;

    // 피격 플래시
    if (e.flash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }

    // 슬라임 특유의 젤리 젤라틴 통통 튀는 바운스 애니메이션!
    let squishX = 1.0;
    let squishY = 1.0;
    if (e.type === 'slime') {
      const sq = Math.sin(time * 8 + e.x) * 0.15;
      squishX = 1.0 + sq;
      squishY = 1.0 - sq;
      ctx.scale(squishX, squishY);
    }

    // 그레이트 드래곤 날개짓 바운스
    if (e.type === 'final_dragon_baal') {
      const wingBob = Math.sin(time * 6) * 3;
      ctx.translate(0, wingBob);
    }

    if (isBoss) {
      ctx.shadowBlur = def.isBoss ? 28 : 16;
      ctx.shadowColor = e.color || '#ef4444';
    }

    // 스프라이트 크기 렌더링
    const scale = isBoss ? (def.isBoss ? 2.2 : 1.6) : 1.35;
    const w = sprite.width * scale;
    const h = sprite.height * scale;

    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);

    // 보스 / 준보스 HP 게이지
    if (isBoss) {
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-e.radius, -e.radius - 14, e.radius * 2, 6);
      ctx.fillStyle = def.isBoss ? '#ef4444' : '#f59e0b';
      ctx.fillRect(-e.radius, -e.radius - 14, e.radius * 2 * hpPct, 6);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, 0, -e.radius - 18);
    }

    ctx.restore();
    return true;
  }

  // [6] 보물상자
  renderChest(ctx, c, time) {
    if (!this.usePixelArt) return false;
    const bob = Math.sin(time * 6) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 15;
    ctx.shadowColor = c.color;

    ctx.drawImage(this.dungeonSheet, 112, 96, 16, 16, -18, -18, 36, 36);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText('🎁 전설 상자', 0, -22);
    ctx.restore();
    return true;
  }

  // [7] 경험치 보석
  renderGem(ctx, g) {
    if (!this.usePixelArt) return false;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 8;
    ctx.shadowColor = g.color;

    ctx.drawImage(this.dungeonSheet, 80, 128, 16, 16, -8, -8, 16, 16);
    ctx.restore();
    return true;
  }
}

// 싱글톤 인스턴스 생성
const spriteManager = new SpriteManager();
