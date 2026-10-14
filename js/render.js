/* ==========================================================================
   js/render.js - Procedural Canvas Graphics Renderer
   토큰 소모가 없는 기하학/네온/파티클 절차적 렌더러
   - 1차 / 2차 / 3차 최종 각성 펫 외형
   - 합성 진화 스킬 시각 효과
   - 화면 테두리 동료/보스 나침반 화살표 (Off-screen Indicator)
   - 우측 상단 콤팩트 레이더 미니맵 (Radar Mini-map)
   - 4800x4800 대형 월드 경계벽 및 랜드마크 마법진
   ========================================================================== */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(engine) {
    const ctx = this.ctx;
    const player = engine.player;
    const pet = engine.pet;
    if (!player || !pet) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 📳 화면 흔들림 오프셋 계산
    let shakeX = 0;
    let shakeY = 0;
    if (engine.screenShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * 2 * engine.screenShakeIntensity;
      shakeY = (Math.random() - 0.5) * 2 * engine.screenShakeIntensity;
    }

    const cx = this.canvas.width / 2 - player.x + shakeX;
    const cy = this.canvas.height / 2 - player.y + shakeY;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Ancient Ruins 4800x4800 Map Background & Landmarks
    this.renderBackground(player);

    // 2. Multi-player Peers (Co-op Tamer Tether & Pet)
    if (engine.peers) {
      for (const peerId in engine.peers) {
        const peer = engine.peers[peerId];
        if (peer.player) {
          const isPeerSummoner = (peer.player.heroClass || 'summoner') === 'summoner';
          if (isPeerSummoner && peer.pet) {
            this.renderTether(peer.player, peer.pet, engine.gameTime);
          }
          this.renderTamer(peer.player, peer.name || '동료', '#a855f7');
          if (isPeerSummoner && peer.pet) {
            this.renderPet(peer.pet, engine.gameTime);
          }
        }
      }
    }

    // 3. Local Tamer and Pet Mana Bond (소환사만 해당)
    if (player.heroClass === 'summoner' && pet) {
      this.renderTether(player, pet, engine.gameTime);
    }

    // 4. Golden Equipment Chests (Dropped by Mini-bosses)
    if (engine.chests) {
      engine.chests.forEach(c => this.renderChest(c, engine.gameTime));
    }

    // 5. Exp Gems
    engine.gems.forEach(g => this.renderGem(g));

    // 6. Sanctuary, Auras & AoE Fields
    this.renderAoEFields(engine);

    // 7. Orbitals (Magic Satellite & Supernova)
    this.renderOrbitals(engine);

    // 8. Enemies
    engine.enemies.forEach(e => this.renderEnemy(e, engine.gameTime));

    // 9. Projectiles & Bolts
    engine.projectiles.forEach(p => this.renderProjectile(p));
    engine.lightningBolts.forEach(b => this.renderLightning(b));

    // 9-1. 💥 충격파 링 (Shockwave Rings)
    if (engine.shockwaves && engine.shockwaves.length > 0) {
      this.renderShockwaves(engine.shockwaves);
    }

    // 9-2. ⚔️ 검사 초근접 검기 참격 호 (Slash Arc Effects)
    if (engine.slashEffects && engine.slashEffects.length > 0) {
      this.renderSlashEffects(engine.slashEffects);
    }

    // 10. Local Tamer (Player)
    const myName = (typeof networkManager !== 'undefined' && networkManager.isHost) ? '👑 아빠 (호스트)' : ((player.subclassDef && player.subclassDef.name) || '🧙 테이머');
    this.renderTamer(player, myName, '#818cf8');

    // 11. Local Hero Pet (소환사만 해당)
    if (player.heroClass === 'summoner' && pet) {
      this.renderPet(pet, engine.gameTime);
    }

    // 12. Floating Damage Numbers
    engine.damageNumbers.forEach(d => {
      ctx.save();
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = d.color || '#facc15';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(Math.round(d.val), d.x, d.y);
      ctx.fillText(Math.round(d.val), d.x, d.y);
      ctx.restore();
    });

    // 13. Particles
    engine.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore(); // Restore camera translation

    // 🎬 시네마틱 디밍 (궁극기 발동 시 배경 순간 암전)
    if (engine.cinematicDimming > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.65, engine.cinematicDimming)})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    // =========================================================================
    // SCREEN UI OVERLAYS: Off-screen Indicators & Radar Mini-map
    // =========================================================================
    // 14. Off-screen Indicators (Arrows pointing to Family Peers & Bosses)
    this.renderOffscreenIndicators(engine);

    // 15. Radar Mini-map (Top Right)
    this.renderMiniRadar(engine);
  }

  // =========================================================================
  // 🗺️ 32비트 드래곤퀘스트 스타일 초대형 월드맵 렌더러
  // =========================================================================
  getDqTileType(gx, gy, x, y, worldW, worldH) {
    // 1. 외곽 대양 바다 (Ocean Boundary)
    if (x < 480 || x > worldW - 480 || y < 480 || y > worldH - 480) {
      return 'water';
    }
    // 해안가 황금빛 모래사장 (Coast Sandy Beaches)
    if (x < 672 || x > worldW - 672 || y < 672 || y > worldH - 672) {
      return 'sand';
    }

    // 2. 주요 거점 및 바이옴 지역
    // [중앙] 라다톰 왕성 (8000, 8000)
    const dCenter = Math.hypot(x - 8000, y - 8000);
    if (dCenter < 340) return 'sand'; // 왕성 안마당 광장
    // 사방으로 시원하게 뻗은 로마식 왕도 포장도로
    if ((Math.abs(x - 8000) < 54 && Math.abs(y - 8000) < 3200) ||
        (Math.abs(y - 8000) < 54 && Math.abs(x - 8000) < 3200)) {
      return 'sand';
    }

    // [북서쪽] 암흑 지하 묘지 & 독 늪지대 (3500, 3500)
    const dNW = Math.hypot(x - 3500, y - 3500);
    if (dNW < 1900) {
      const nNW = Math.sin(gx * 0.38 + gy * 0.32);
      if (dNW < 650 || nNW > -0.2) return 'swamp';
      return nNW > -0.6 ? 'sand' : 'grass';
    }

    // [북동쪽] 험준한 바위산맥 & 고대 번개 신전 (12500, 3500)
    const dNE = Math.hypot(x - 12500, y - 3500);
    if (dNE < 2100) {
      const nNE = Math.sin(gx * 0.35 - gy * 0.28);
      if (dNE < 750 || nNE > 0.0) return 'mountain';
      return nNE > -0.5 ? 'sand' : 'grass';
    }

    // [남서쪽] 신성 세계수의 대수림 (3500, 12500)
    const dSW = Math.hypot(x - 3500, y - 12500);
    if (dSW < 2100) {
      const nSW = Math.cos(gx * 0.32 + gy * 0.36);
      if (dSW < 800 || nSW > -0.3) return 'forest';
      return 'grass';
    }

    // [남동쪽] 용왕의 화산 제단 (12500, 12500)
    const dSE = Math.hypot(x - 12500, y - 12500);
    if (dSE < 1900) {
      const nSE = Math.sin(gx * 0.29 + gy * 0.41);
      if (dSE < 650 || nSE > 0.1) return 'sand';
      if (nSE > -0.3) return 'mountain';
      return 'grass';
    }

    // 3. 필드 자연 지형 (절차적 노이즈: 숲, 호수, 바위 언덕, 오솔길)
    const noise = Math.sin(gx * 0.18 + gy * 0.22) * 1.4 + Math.cos(gx * 0.27 - gy * 0.16) * 1.1;
    if (noise > 1.55) return 'forest';      // 울창한 상록수 숲
    if (noise < -1.88) return 'water';     // 맑고 푸른 호수
    if (noise < -1.52) return 'mountain';  // 암벽 릿지 언덕
    if (noise > 1.18 && noise < 1.34) return 'sand'; // 여행자의 오솔길

    return 'grass'; // 정통 드래곤퀘스트 푸른 초원
  }

  renderBackground(player) {
    const ctx = this.ctx;
    const worldW = (GAME_DATA.world && GAME_DATA.world.width) || 16000;
    const worldH = (GAME_DATA.world && GAME_DATA.world.height) || 16000;
    const tileSize = 48; // 32비트 드래곤퀘스트 타일 규격 (48x48)

    const startX = Math.floor((player.x - this.canvas.width / 2) / tileSize) * tileSize;
    const endX = startX + this.canvas.width + tileSize * 2;
    const startY = Math.floor((player.y - this.canvas.height / 2) / tileSize) * tileSize;
    const endY = startY + this.canvas.height + tileSize * 2;

    const tiles = (typeof spriteManager !== 'undefined' && spriteManager.usePixelArt) ? spriteManager.dqWorldTiles : null;

    if (tiles && tiles.grass) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // 뷰포트 내 화면 타일만 고속 렌더링 (Culling)
      for (let x = startX; x < endX; x += tileSize) {
        for (let y = startY; y < endY; y += tileSize) {
          // 월드 밖: 깊고 푸른 바다
          if (x < 0 || x >= worldW || y < 0 || y >= worldH) {
            ctx.drawImage(tiles.water, x, y, tileSize, tileSize);
            continue;
          }

          const gx = Math.floor(x / tileSize);
          const gy = Math.floor(y / tileSize);
          const tileType = this.getDqTileType(gx, gy, x, y, worldW, worldH);
          const sprite = tiles[tileType] || tiles.grass;

          ctx.drawImage(sprite, x, y, tileSize, tileSize);
        }
      }
      ctx.restore();
    } else {
      // 폴백 렌더러
      ctx.fillStyle = '#3e8f26';
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }

    // 월드 경계 고대 황금 결계선 (World Boundary Barrier)
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#facc15';
    ctx.strokeRect(0, 0, worldW, worldH);

    // 내측 점선 경고 결계
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.strokeRect(16, 16, worldW - 32, worldH - 32);
    ctx.restore();

    // 🏰 드래곤퀘스트 5대 랜드마크 32비트 고화질 렌더링
    if (GAME_DATA.world && GAME_DATA.world.landmarks) {
      const halfW = this.canvas.width / 2 + 250;
      const halfH = this.canvas.height / 2 + 250;

      GAME_DATA.world.landmarks.forEach(lm => {
        // 화면 뷰포트 컬링: 화면 근처에 있을 때만 렌더링
        if (Math.abs(lm.x - player.x) > halfW || Math.abs(lm.y - player.y) > halfH) {
          return;
        }

        ctx.save();

        // 1. 신비한 랜드마크 마법진 바닥 후광
        ctx.strokeStyle = lm.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = lm.color;
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `${lm.color}15`;
        ctx.fill();

        // 내부 보조 회전 마법진
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // 2. 32비트 실물 랜드마크 스프라이트 렌더링
        const lmSprite = tiles && lm.spriteKey && tiles[lm.spriteKey];
        if (lmSprite) {
          const sz = 160;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(lmSprite, lm.x - sz / 2, lm.y - sz / 2 - 12, sz, sz);
        }

        // 3. 랜드마크 명칭 명판
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(lm.name, lm.x, lm.y + lm.radius * 0.42 + 20);

        ctx.restore();
      });
    }
  }

  // =========================================================================
  // 14. Off-screen Indicator (Pointing to Family Peers and Bosses)
  // =========================================================================
  renderOffscreenIndicators(engine) {
    const ctx = this.ctx;
    const player = engine.player;
    const pad = 42; // padding from screen edge
    const w = this.canvas.width;
    const h = this.canvas.height;
    const halfW = w / 2;
    const halfH = h / 2;

    const targets = [];

    // [1] Family Peers
    if (engine.peers) {
      for (const pid in engine.peers) {
        const peer = engine.peers[pid];
        if (peer.player) {
          targets.push({
            x: peer.player.x,
            y: peer.player.y,
            name: peer.name || '동료',
            color: '#a855f7',
            type: 'peer'
          });
        }
      }
    }

    // [2] Bosses & Mini-bosses
    engine.enemies.forEach(e => {
      const def = GAME_DATA.monsters[e.type];
      if (def && (def.isBoss || def.isElite)) {
        targets.push({
          x: e.x,
          y: e.y,
          name: def.name.replace(/ \(.*\)/, ''),
          color: def.isBoss ? '#ef4444' : '#f59e0b',
          type: def.isBoss ? 'boss' : 'elite'
        });
      }
    });

    targets.forEach(tgt => {
      const dx = tgt.x - player.x;
      const dy = tgt.y - player.y;

      // Check if target is inside current screen viewport
      if (Math.abs(dx) < halfW - 30 && Math.abs(dy) < halfH - 30) {
        return; // Already visible on screen!
      }

      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Clamp point to screen borders
      let ix = halfW + Math.cos(angle) * (halfW - pad);
      let iy = halfH + Math.sin(angle) * (halfH - pad);

      ix = Math.max(pad, Math.min(w - pad, ix));
      iy = Math.max(pad + 48, Math.min(h - pad, iy));

      ctx.save();
      ctx.translate(ix, iy);

      // Draw Arrow pointing to target
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = tgt.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = tgt.color;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Distance in meters (100px ~= 10m)
      const distM = Math.round(dist / 10);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(`${tgt.name} (${distM}m)`, 0, 18);

      ctx.restore();
    });
  }

  // =========================================================================
  // 15. Radar Mini-map (Compact Semi-transparent Circle in Top Right)
  // =========================================================================
  renderMiniRadar(engine) {
    const ctx = this.ctx;
    const player = engine.player;
    const radarRadius = 55;
    const margin = 16;
    const rx = this.canvas.width - radarRadius - margin;
    const ry = radarRadius + margin + 48; // below top bar

    const radarRange = 2400; // Expanded radar range for 16000x16000 world
    const scale = radarRadius / radarRange;

    ctx.save();

    // Radar Base Circle
    ctx.beginPath();
    ctx.arc(rx, ry, radarRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Radar Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx - radarRadius, ry); ctx.lineTo(rx + radarRadius, ry);
    ctx.moveTo(rx, ry - radarRadius); ctx.lineTo(rx, ry + radarRadius);
    ctx.stroke();

    // Clip to radar circle
    ctx.clip();

    // 1. World Landmarks Dots
    if (GAME_DATA.world && GAME_DATA.world.landmarks) {
      GAME_DATA.world.landmarks.forEach(lm => {
        const ax = rx + (lm.x - player.x) * scale;
        const ay = ry + (lm.y - player.y) * scale;
        ctx.fillStyle = lm.color;
        ctx.beginPath();
        ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 2. Chests (Golden Squares)
    if (engine.chests) {
      engine.chests.forEach(c => {
        const cx = rx + (c.x - player.x) * scale;
        const cy = ry + (c.y - player.y) * scale;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
      });
    }

    // 3. Enemies on radar (Red/Orange dots)
    engine.enemies.forEach(e => {
      const ex = rx + (e.x - player.x) * scale;
      const ey = ry + (e.y - player.y) * scale;
      const def = GAME_DATA.monsters[e.type];
      if (def && (def.isBoss || def.isElite)) {
        ctx.fillStyle = def.isBoss ? '#ef4444' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(ex - 1, ey - 1, 2, 2);
      }
    });

    // 4. Family Peers (Green/Purple dots)
    if (engine.peers) {
      for (const pid in engine.peers) {
        const p = engine.peers[pid].player;
        if (p) {
          const px = rx + (p.x - player.x) * scale;
          const py = ry + (p.y - player.y) * scale;
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 5. Local Player (Center Blue Dot)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // Golden Equipment Chest
  renderChest(c, time) {
    if (typeof spriteManager !== 'undefined' && spriteManager.renderChest(this.ctx, c, time)) {
      return;
    }
    const ctx = this.ctx;
    const bob = Math.sin(time * 6) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + bob);

    ctx.shadowBlur = 16;
    ctx.shadowColor = c.color;

    // Chest Body
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.fillRect(-12, -9, 24, 18);
    ctx.strokeRect(-12, -9, 24, 18);

    // Golden Lock / Gem
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Floating text above
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = c.color;
    ctx.textAlign = 'center';
    ctx.fillText('🎁 보물상자', 0, -15);

    ctx.restore();
  }

  // Tamer and Pet Mana Bond
  renderTether(player, pet, time) {
    const ctx = this.ctx;
    ctx.save();
    const color = pet.config ? pet.config.color : '#38bdf8';
    ctx.strokeStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -time * 20;

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(pet.x, pet.y);
    ctx.stroke();
    ctx.restore();
  }

  renderTamer(p, nameLabel = '🧙 테이머', robeAccent = '#818cf8') {
    if (typeof spriteManager !== 'undefined' && spriteManager.renderTamer(this.ctx, p, nameLabel)) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.facing === -1) ctx.scale(-1, 1);

    // Name Label above head
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(nameLabel, 0, -32);
    ctx.restore();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const heroClass = p.heroClass || 'summoner';

    // [1] ⚔️ 검사 (Warrior)
    if (heroClass === 'warrior') {
      // Plate Armor Body
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-9, -10);
      ctx.lineTo(9, -10);
      ctx.lineTo(7, 12);
      ctx.lineTo(-7, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shoulder Pauldrons
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-13, -11, 5, 6);
      ctx.fillRect(8, -11, 5, 6);

      // Head & Knight Helmet
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -13, 7, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -13, 8, 2);

      // Red Plume
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(4, -25);
      ctx.lineTo(-4, -25);
      ctx.closePath();
      ctx.fill();

      // Greatsword in hand
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.fillRect(9, -24, 4, 32);
      ctx.strokeRect(9, -24, 4, 32);
      // Crossguard & pommel
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(6, -8, 10, 3);
      ctx.fillRect(9.5, 9, 3, 4);

    // [2] 🏹 궁수 (Archer)
    } else if (heroClass === 'archer') {
      // Ranger Tunic & Cape
      ctx.fillStyle = '#166534';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-9, 12);
      ctx.lineTo(9, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leather quiver strap
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(7, 6);
      ctx.stroke();

      // Head & Archer Hood
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(-8, -11);
      ctx.lineTo(8, -11);
      ctx.lineTo(0, -23);
      ctx.closePath();
      ctx.fill();

      // Feather on cap
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(9, -25);
      ctx.lineTo(6, -17);
      ctx.closePath();
      ctx.fill();

      // Curved Recurve Bow
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(12, -4, 15, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12 + Math.cos(-Math.PI * 0.45) * 15, -4 + Math.sin(-Math.PI * 0.45) * 15);
      ctx.lineTo(12 + Math.cos(Math.PI * 0.45) * 15, -4 + Math.sin(Math.PI * 0.45) * 15);
      ctx.stroke();

    // [3] 🧙 소환사 (Summoner)
    } else {
      // Tamer Robe
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = robeAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-10, 12);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head & Tamer Hat
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.fill();

      // Wizard/Tamer Cone Hat
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(10, -14);
      ctx.lineTo(0, -26);
      ctx.closePath();
      ctx.fill();

      // Staff
      ctx.fillStyle = '#92400e';
      ctx.fillRect(8, -18, 3, 28);
      ctx.shadowBlur = 8;
      ctx.shadowColor = robeAccent;
      ctx.fillStyle = robeAccent;
      ctx.beginPath();
      ctx.arc(9.5, -20, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Divine Shield Bubble (If Invincible / Ultimate / Shield barrier active)
    if (p.isInvincible || (p.shieldBarrier && p.shieldBarrier > 0)) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -6, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  renderPet(pet, time) {
    if (typeof spriteManager !== 'undefined' && spriteManager.renderPet(this.ctx, pet, time)) {
      return;
    }
    const ctx = this.ctx;
    const cfg = pet.config || {};
    const tier = pet.tier || 1;
    const isTier2 = tier === 2;
    const isTier3 = tier >= 3;
    const scale = isTier3 ? 1.65 : (isTier2 ? 1.3 : 1.0);
    const bob = Math.sin(time * 5) * 3;

    ctx.save();
    ctx.translate(pet.x, pet.y + bob);
    if (pet.facing === -1) ctx.scale(-scale, scale);
    else ctx.scale(scale, scale);

    // Pet Glow Aura
    ctx.shadowBlur = isTier3 ? 28 : (isTier2 ? 18 : 10);
    ctx.shadowColor = cfg.color || '#38bdf8';

    // Tier 3 Awakening Celestial Back Aura
    if (isTier3) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = time * 30;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Ignis (화염)
    if (cfg.element === 'fire') {
      ctx.fillStyle = isTier3 ? '#f59e0b' : (isTier2 ? '#dc2626' : '#f97316');
      ctx.strokeStyle = isTier3 ? '#fef08a' : '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const wingFlap = Math.sin(time * 12) * 5;
      ctx.fillStyle = isTier3 ? '#ef4444' : '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(-15, -15 + wingFlap);
      ctx.lineTo(0, -8);
      ctx.fill();

      if (isTier3) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(-20, -22 + wingFlap * 1.2);
        ctx.lineTo(-2, -12);
        ctx.fill();
      }

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-2, -14, 3, 5);
      if (isTier2 || isTier3) {
        ctx.fillRect(-6, -16, 4, 8);
        ctx.fillRect(2, -16, 4, 8);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -3, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(5, -2, 1.5, 1.5);

    // 2. Bolt (뇌전)
    } else if (cfg.element === 'lightning') {
      ctx.fillStyle = isTier3 ? '#4338ca' : (isTier2 ? '#6366f1' : '#38bdf8');
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(4, -6); ctx.lineTo(8, isTier3 ? -18 : -14); ctx.lineTo(1, -7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, -6); ctx.lineTo(-8, isTier3 ? -18 : -14); ctx.lineTo(-1, -7); ctx.fill();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = isTier3 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-20, -6);
      ctx.lineTo(-18, -12);
      if (isTier3) {
        ctx.lineTo(-24, -16);
      }
      ctx.stroke();

    // 3. Sylph (자연)
    } else {
      ctx.fillStyle = isTier3 ? '#047857' : (isTier2 ? '#15803d' : '#22c55e');
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;

      const squish = Math.sin(time * 4) * 2;
      ctx.beginPath();
      ctx.ellipse(0, 2, 12, 10 - squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isTier3 ? '#f43f5e' : '#86efac';
      ctx.beginPath();
      ctx.arc(0, -9, isTier3 ? 7 : (isTier2 ? 5 : 3.5), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(5, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderEnemy(e, time) {
    if (typeof spriteManager !== 'undefined' && spriteManager.renderEnemy(this.ctx, e, time)) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);

    if (e.flash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, e.radius + 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = e.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const def = GAME_DATA.monsters[e.type] || {};
    const isBossOrElite = def.isBoss || def.isElite;

    if (isBossOrElite) {
      ctx.shadowBlur = def.isBoss ? 26 : 16;
      ctx.shadowColor = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boss / Elite Horns
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-e.radius * 0.6, -e.radius * 1.3, 7, e.radius * 0.7);
      ctx.fillRect(e.radius * 0.6 - 7, -e.radius * 1.3, 7, e.radius * 0.7);

      // Boss / Elite HP Bar
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-e.radius, -e.radius - 14, e.radius * 2, 6);
      ctx.fillStyle = def.isBoss ? '#ef4444' : '#f59e0b';
      ctx.fillRect(-e.radius, -e.radius - 14, e.radius * 2 * hpPct, 6);

      // Boss Name Tag
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, 0, -e.radius - 18);
    } else if (e.type === 'bat') {
      const flap = Math.sin(time * 16) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-12, -4 + flap, 6, 4);
      ctx.fillRect(6, -4 + flap, 6, 4);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Angry eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, -3, 3, 3);
    ctx.fillRect(2, -3, 3, 3);

    ctx.restore();
  }

  renderProjectile(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    const angle = Math.atan2(p.vy, p.vx);

    // [1] Fireball (화염구)
    if (p.kind === 'fireball') {
      ctx.rotate(angle);
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#f97316';
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-3, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    // [2] Meteor (헬파이어 메테오)
    } else if (p.kind === 'meteor') {
      ctx.rotate(angle);
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-5, 0, 8, 0, Math.PI * 2);
      ctx.fill();

    // [3] Icicle Spear (고드름 창)
    } else if (p.kind === 'icicle') {
      ctx.rotate(angle);
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);     // 날카로운 끝
      ctx.lineTo(-4, -5);
      ctx.lineTo(-12, 0);    // 뒤쪽
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 내부 크리스탈 코어
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-2, -2.5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-2, 2.5);
      ctx.closePath();
      ctx.fill();

    // [4] Wind Blade (바람의 칼날 - 회전형 풍인)
    } else if (p.kind === 'wind_blade') {
      const rot = (Date.now() / 60) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#2dd4bf';
      ctx.fillStyle = '#2dd4bf';
      ctx.strokeStyle = '#99f6e4';
      ctx.lineWidth = 2;

      // 3날 바람 칼날 (풍마수리검)
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, 8, 14, 0);
        ctx.quadraticCurveTo(8, -2, 0, 0);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

    // [5] Holy Cross (신성한 십자가 - 회전형 부메랑)
    } else if (p.kind === 'holy_cross') {
      const rot = (Date.now() / 90) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#fbbf24';

      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;

      // 황금 십자가 형태
      const w = 6, l = 20;
      ctx.fillRect(-w / 2, -l / 2, w, l);
      ctx.strokeRect(-w / 2, -l / 2, w, l);
      ctx.fillRect(-l / 2, -w / 2, l, w);
      ctx.strokeRect(-l / 2, -w / 2, l, w);

      // 중앙 백색 성광 코어
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    // [6] Celestial Blade (천상의 심판도끼 - 거대 황금 양날도끼)
    } else if (p.kind === 'golden_axe') {
      const rot = (Date.now() / 70) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.shadowBlur = 22;
      ctx.shadowColor = '#f59e0b';

      // 도끼 자루
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-3, -16, 6, 32);

      // 황금 양날 도끼날
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;

      // 우측 날
      ctx.beginPath();
      ctx.moveTo(2, -12);
      ctx.quadraticCurveTo(18, -14, 16, 0);
      ctx.quadraticCurveTo(18, 14, 2, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 좌측 날
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      ctx.quadraticCurveTo(-18, -14, -16, 0);
      ctx.quadraticCurveTo(-18, 14, -2, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 코어 룬 보석
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    // [7] Dark Slash (사령의 지옥참격 - 거대 암흑 초승달 검기)
    } else if (p.kind === 'dark_slash') {
      ctx.rotate(angle);
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#a855f7';

      ctx.fillStyle = '#7e22ce';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;

      // 거대 초승달 파동
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI * 0.45, Math.PI * 0.45, false);
      ctx.quadraticCurveTo(10, 0, 0, -24 * Math.sin(Math.PI * 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 암흑 불꽃 코어
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(6, 0, 6, 0, Math.PI * 2);
      ctx.fill();

    // [8] Leaf Blade (칼날 잎사귀 - 초록빛 관통 잎사귀 표창)
    } else if (p.kind === 'leaf_blade') {
      ctx.rotate(angle);
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22c55e';

      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.5;

      // 날카로운 나뭇잎 형태
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.quadraticCurveTo(3, -6, -11, 0);
      ctx.quadraticCurveTo(3, 6, 13, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 잎맥 선
      ctx.strokeStyle = '#f0fdf4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

    // [9] Flower Blade (질풍의 꽃보라 - 분홍빛 벚꽃 칼날)
    } else if (p.kind === 'flower_blade') {
      const rot = (Date.now() / 80) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#fb7185';

      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 1.5;

      // 4잎 벚꽃 회전 수리검 형태
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(9, -7, 14, 0);
        ctx.quadraticCurveTo(9, 7, 0, 0);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

    // [10] Poison Spore (맹독 포자 폭탄)
    } else if (p.kind === 'poison_spore') {
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#c084fc';

      // 보라빛 독 포자 구체
      ctx.fillStyle = '#9333ea';
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 독 기포 돌기들
      ctx.fillStyle = '#22c55e';
      [-4, 4].forEach(ox => {
        ctx.beginPath();
        ctx.arc(ox, -3, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    // [11] Nature Beam (세계수의 저격화살 - 거대 녹색 관통 광선)
    } else if (p.kind === 'nature_beam') {
      ctx.rotate(angle);
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#4ade80';

      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 3;

      // 거대 화살촉
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-8, -12);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 후방 에너지 빔 라인
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-28, 0);
      ctx.stroke();

    // [12] Blade Arc (쾌검 참격 - 네온 검기 호)
    } else if (p.kind === 'blade_arc') {
      ctx.rotate(angle);
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f43f5e';
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#ffe4e6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, -Math.PI * 0.4, Math.PI * 0.4, false);
      ctx.quadraticCurveTo(8, 0, 0, -22 * Math.sin(Math.PI * 0.4));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    // [13] Shield Wave (방패 강타 파동 - 황금 방패 파동)
    } else if (p.kind === 'shield_wave') {
      ctx.rotate(angle);
      ctx.shadowBlur = 22;
      ctx.shadowColor = '#facc15';
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, -18);
      ctx.lineTo(20, 0);
      ctx.lineTo(12, 18);
      ctx.lineTo(0, 14);
      ctx.lineTo(0, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -8, 4, 16);
      ctx.fillRect(2, -2, 16, 4);

    // [14] Rune Blade (마검 룬파동)
    } else if (p.kind === 'rune_blade') {
      const rot = (Date.now() / 70) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#9333ea';
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    // [15] Sniper Beam & God Laser (관통 레이저 화살 / 신살의 관통포)
    } else if (p.kind === 'sniper_beam' || p.kind === 'god_laser') {
      ctx.rotate(angle);
      const isGod = p.kind === 'god_laser';
      ctx.shadowBlur = isGod ? 30 : 20;
      ctx.shadowColor = isGod ? '#facc15' : '#06b6d4';
      ctx.strokeStyle = isGod ? '#fbbf24' : '#06b6d4';
      ctx.lineWidth = isGod ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(-60, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isGod ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(20, isGod ? -8 : -5);
      ctx.lineTo(20, isGod ? 8 : 5);
      ctx.closePath();
      ctx.fill();

    // [16] Rapid Arrow (질풍 화살)
    } else if (p.kind === 'rapid_arrow') {
      ctx.rotate(angle);
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#10b981';
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-14, 0);
      ctx.stroke();

    // [17] Explosive Trap & Cluster (마법 폭발 덫 & 아마겟돈 지뢰)
    } else if (p.kind === 'trap' || p.kind === 'trap_cluster') {
      const isCluster = p.kind === 'trap_cluster';
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
      ctx.shadowBlur = isCluster ? 22 : 14;
      ctx.shadowColor = isCluster ? '#ef4444' : '#f97316';
      ctx.strokeStyle = isCluster ? '#dc2626' : '#ea580c';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, (isCluster ? 16 : 12) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isCluster ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, isCluster ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

    // [18] Wolf Stampede (야수 쇄도)
    } else if (p.kind === 'wolf_stampede') {
      ctx.rotate(angle);
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#10b981';
      ctx.fillStyle = '#059669';
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(8, -4, 4, 3);
    }

    ctx.restore();
  }

  // 💥 도넛형 충격파 링 렌더러 (Shockwaves Renderer)
  renderShockwaves(shockwaves) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < shockwaves.length; i++) {
      const sw = shockwaves[i];
      const alpha = Math.max(0, 1 - sw.age / sw.duration);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color || '#facc15';
      ctx.lineWidth = Math.max(1.5, 4.5 * alpha);
      ctx.shadowBlur = 18 * alpha;
      ctx.shadowColor = sw.color || '#facc15';
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ⚔️ 검사 초근접 검기 참격 호 렌더러 (Slash Arc Effects Renderer)
  renderSlashEffects(slashEffects) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < slashEffects.length; i++) {
      const sl = slashEffects[i];
      const progress = sl.age / sl.duration; // 0 -> 1
      const alpha = Math.max(0, 1 - progress);
      const curRange = sl.range * (0.88 + progress * 0.22); // 살짝 호가 퍼져나가는 타격감
      const arcHalf = sl.arcSpan / 2;

      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.angle);

      // 1. 반투명 내부 참격 부채꼴 면적 (묵직한 볼륨감)
      if (sl.arcSpan < Math.PI * 1.9) {
        ctx.fillStyle = sl.color;
        ctx.globalAlpha = alpha * 0.28;
        ctx.beginPath();
        ctx.arc(0, 0, curRange, -arcHalf, arcHalf, false);
        ctx.arc(0, 0, Math.max(0, curRange - sl.width * 1.1), arcHalf, -arcHalf, true);
        ctx.closePath();
        ctx.fill();
      }

      // 2. 외곽 네온 칼날 파동 호 (선명하고 두툼한 검기)
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 20 * alpha;
      ctx.shadowColor = sl.color;
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = Math.max(2, sl.width * (1 - progress * 0.35));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, curRange, -arcHalf, arcHalf, false);
      ctx.stroke();

      // 3. 중앙 백색 섬광 칼날 궤적 (날카로운 절단선)
      ctx.shadowBlur = 8 * alpha;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, sl.width * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, curRange, -arcHalf * 0.85, arcHalf * 0.85, false);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  renderLightning(bolt) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = bolt.color || '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.shadowColor = bolt.color || '#facc15';
    ctx.lineWidth = bolt.width || 2.5;

    ctx.beginPath();
    ctx.moveTo(bolt.x1, bolt.y1);
    const midX = (bolt.x1 + bolt.x2) / 2 + (Math.random() - 0.5) * 20;
    const midY = (bolt.y1 + bolt.y2) / 2 + (Math.random() - 0.5) * 20;
    ctx.lineTo(midX, midY);
    ctx.lineTo(bolt.x2, bolt.y2);
    ctx.stroke();

    ctx.restore();
  }

  renderAoEFields(engine) {
    const ctx = this.ctx;
    const pet = engine.pet;
    const player = engine.player;

    if (engine.hasSkill('thorn_aura')) {
      const radius = 75;
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -engine.gameTime * 30;
      ctx.beginPath();
      ctx.arc(pet.x, pet.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (engine.hasSkill('vampiric_rose')) {
      const radius = 110;
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#e11d48';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -engine.gameTime * 45;
      ctx.beginPath();
      ctx.arc(pet.x, pet.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      const petalCount = 6;
      for (let i = 0; i < petalCount; i++) {
        const ang = engine.gameTime * 3 + (i * Math.PI * 2) / petalCount;
        const px = pet.x + Math.cos(ang) * radius;
        const py = pet.y + Math.sin(ang) * radius;
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Absolute Blizzard (절대영도 블리자드 빙결 마법진 오라)
    if (engine.hasSkill('absolute_blizzard')) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = engine.gameTime * 20;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 220, 0, Math.PI * 2);
      ctx.stroke();

      // 빙결 눈꽃 룬 6개
      for (let i = 0; i < 6; i++) {
        const ang = -engine.gameTime * 1.5 + (i * Math.PI * 2) / 6;
        const fx = player.x + Math.cos(ang) * 220;
        const fy = player.y + Math.sin(ang) * 220;
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Typhoon Vortex (타이푼 볼텍스 회전 소용돌이)
    if (engine.hasSkill('typhoon_vortex')) {
      ctx.save();
      for (let k = 0; k < 2; k++) {
        const ang = engine.gameTime * 2.5 + k * Math.PI;
        const vx = player.x + Math.cos(ang) * 140;
        const vy = player.y + Math.sin(ang) * 140;

        ctx.strokeStyle = '#2dd4bf';
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#2dd4bf';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -engine.gameTime * 50;

        ctx.beginPath();
        ctx.arc(vx, vy, 55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
        ctx.beginPath();
        ctx.arc(vx, vy, 55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (engine.hasSkill('sanctuary') || engine.hasSkill('gaia_blessing')) {
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    engine.breathEffects.forEach(b => {
      ctx.save();
      ctx.translate(pet.x, pet.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, b.range, -0.4, 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  renderOrbitals(engine) {
    const ctx = this.ctx;
    const pet = engine.pet;

    if (engine.hasSkill('supernova_orbital')) {
      const count = 4;
      const rot = engine.gameTime * 7;
      const dist = 95;

      for (let i = 0; i < count; i++) {
        const a = rot + (i * Math.PI * 2) / count;
        const ox = pet.x + Math.cos(a) * dist;
        const oy = pet.y + Math.sin(a) * dist;

        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#e879f9';
        ctx.fillStyle = '#f0abfc';
        ctx.beginPath();
        ctx.arc(ox, oy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    if (engine.hasSkill('magic_satellite')) {
      const count = 2;
      const rot = engine.gameTime * 4;
      const dist = 80;

      for (let i = 0; i < count; i++) {
        const a = rot + (i * Math.PI * 2) / count;
        const ox = pet.x + Math.cos(a) * dist;
        const oy = pet.y + Math.sin(a) * dist;

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#c084fc';
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(ox, oy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  renderGem(g) {
    if (typeof spriteManager !== 'undefined' && spriteManager.renderGem(this.ctx, g)) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = g.color;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - g.radius * 1.3);
    ctx.lineTo(g.x + g.radius, g.y);
    ctx.lineTo(g.x, g.y + g.radius * 1.3);
    ctx.lineTo(g.x - g.radius, g.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
