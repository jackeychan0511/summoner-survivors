/* ==========================================================================
   js/network.js - 4-Player Co-op Multiplay via WebRTC (PeerJS)
   가족 4인 협동 초저지연 P2P 멀티플레이어 정식 동기화 엔진
   (STUN/TURN 중계 지원, 양방향 타격 RPC, 팀 경험치 공유, 소생/부활 시스템)
   ========================================================================== */

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = []; // 호스트용: 연결된 게스트 커넥션 목록
    this.hostConn = null;   // 게스트용: 호스트와의 커넥션
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = '';
    this.localPlayerName = '플레이어';
    this.guestNames = {};  // peerId -> custom name
    this.syncTimer = null;
    this.PREFIX = 'tamer-surv-v3-';
    this.maxGuests = 3;    // 최대 4인 (호스트 1 + 게스트 3)

    // 통신사 방화벽(Symmetric NAT) 및 LTE/5G 모바일 간 P2P 직결을 위한 고가용성 STUN/TURN 서버 풀
    this.peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 8
      }
    };
  }

  // 1. 호스트: 4자리 코드로 방 생성
  hostRoom(customCode) {
    const nameInput = document.getElementById('multi-nickname');
    if (nameInput && nameInput.value.trim()) {
      this.localPlayerName = nameInput.value.trim();
    } else {
      this.localPlayerName = '아빠 (방장)';
    }

    const code = customCode || Math.floor(1000 + Math.random() * 9000).toString();
    this.roomCode = code;
    this.isHost = true;

    const infoEl = document.getElementById('net-room-info');
    if (infoEl) infoEl.textContent = `방 생성 중... (코드: ${code})`;

    const peerId = `${this.PREFIX}${code}-host`;
    if (this.peer) this.peer.destroy();

    try {
      this.peer = new Peer(peerId, this.peerConfig);
    } catch (e) {
      console.warn("PeerJS init failed:", e);
      if (infoEl) infoEl.textContent = "PeerJS 연결 실패 (인터넷 상태를 확인해주세요)";
      return;
    }

    this.peer.on('open', (id) => {
      this.isConnected = true;
      this.updateLobbyUI();
      this.updateStatusBadge(`👑 호스트 (코드: ${code} / 1명)`);
      if (engine) {
        engine.peers = {};
        engine.aiTeammatesEnabled = false; // 멀티플레이 시 가상 봇 비활성화
      }
      this.startHostSync();
      if (infoEl) infoEl.textContent = `✅ 방 생성 완료! 방 코드 [${code}]를 가족에게 알려주세요.`;
    });

    this.peer.on('connection', (conn) => {
      if (this.connections.length >= this.maxGuests) {
        conn.close(); // 최대 4인 초과 시 접속 거부
        return;
      }

      this.connections.push(conn);

      conn.on('open', () => {
        const guestIndex = this.connections.indexOf(conn) + 1;
        const defaultGuestName = guestIndex === 1 ? '첫째' : (guestIndex === 2 ? '둘째' : '셋째');
        this.guestNames[conn.peer] = defaultGuestName;

        this.updateStatusBadge(`👑 호스트 (코드: ${this.roomCode} / ${this.connections.length + 1}명)`);
        this.updateLobbyUI();

        conn.send({
          type: 'welcome',
          assignedName: defaultGuestName,
          roomCode: this.roomCode,
          players: this.getPlayerList()
        });

        this.broadcastLobbyUpdate();
      });

      conn.on('data', (data) => {
        this.handleGuestData(conn.peer, data);
      });

      conn.on('close', () => {
        this.connections = this.connections.filter(c => c !== conn);
        delete this.guestNames[conn.peer];
        if (engine && engine.peers) delete engine.peers[conn.peer];
        this.updateStatusBadge(`👑 호스트 (코드: ${this.roomCode} / ${this.connections.length + 1}명)`);
        this.updateLobbyUI();
        this.broadcastLobbyUpdate();
      });
    });

    this.peer.on('error', (err) => {
      console.error("Peer host error:", err);
      if (infoEl) {
        if (err.type === 'unavailable-id') {
          infoEl.textContent = "이미 사용 중인 방 번호입니다. 다른 번호로 다시 시도합니다.";
          setTimeout(() => this.hostRoom(), 500);
        } else {
          infoEl.textContent = `방 생성 오류: ${err.message || '네트워크 상태를 확인하세요'}`;
        }
      }
    });
  }

  // 2. 게스트: 4자리 코드로 방 참가
  joinRoom(customCode) {
    const input = document.getElementById('join-room-code');
    const code = (customCode || (input ? input.value : '') || '').trim();
    if (!code || code.length < 4) {
      alert("올바른 4자리 방 코드를 입력해주세요!");
      return;
    }

    const nameInput = document.getElementById('multi-nickname');
    if (nameInput && nameInput.value.trim()) {
      this.localPlayerName = nameInput.value.trim();
    } else {
      this.localPlayerName = '게스트';
    }

    this.roomCode = code;
    this.isHost = false;
    const infoEl = document.getElementById('net-room-info');
    if (infoEl) infoEl.textContent = `방 [${code}]에 참가 요청 중...`;

    const myPeerId = `${this.PREFIX}${code}-g-${Math.floor(Math.random() * 100000)}`;
    if (this.peer) this.peer.destroy();

    try {
      this.peer = new Peer(myPeerId, this.peerConfig);
    } catch (e) {
      if (infoEl) infoEl.textContent = "PeerJS 접속 오류";
      return;
    }

    this.peer.on('open', () => {
      const hostPeerId = `${this.PREFIX}${code}-host`;
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConn = conn;

      conn.on('open', () => {
        this.isConnected = true;
        if (engine) engine.aiTeammatesEnabled = false; // 멀티플레이 시 봇 끄기
        if (infoEl) infoEl.innerHTML = `✅ 연결 성공! 대기실에 참가했습니다.`;

        // 내 닉네임 호스트에 전송
        conn.send({
          type: 'set_name',
          name: this.localPlayerName
        });

        this.startGuestSync();
      });

      conn.on('data', (data) => {
        this.handleHostData(data);
      });

      conn.on('close', () => {
        this.isConnected = false;
        this.updateStatusBadge(`⚠️ 호스트 연결 끊김`);
        alert("호스트와의 연결이 끊어졌습니다.");
      });
    });

    this.peer.on('error', (err) => {
      console.error("Peer guest error:", err);
      if (infoEl) infoEl.textContent = "방 접속 실패! 방 코드가 맞는지 확인해주세요.";
    });
  }

  // 3. 호스트: 게임 시작 트리거
  startMultiGame() {
    if (!this.isHost) return;

    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'start_game' });
      }
    });

    document.getElementById('multi-modal').style.display = 'none';
    if (typeof openPetSelectModal === 'function') {
      openPetSelectModal();
    }
  }

  // 📋 초대 링크 복사 (스마트폰 카톡/문자 공유)
  copyInviteLink() {
    if (!this.roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert(`📋 초대 링크가 복사되었습니다!\n스마트폰 카카오톡이나 문자로 전송하세요:\n${url}`);
      }).catch(() => {
        prompt("아래 초대 링크를 복사해주세요:", url);
      });
    } else {
      prompt("아래 초대 링크를 복사해주세요:", url);
    }
  }

  getPlayerList() {
    const list = [{ name: this.localPlayerName, isHost: true }];
    this.connections.forEach(conn => {
      list.push({
        name: this.guestNames[conn.peer] || '참가자',
        isHost: false
      });
    });
    return list;
  }

  broadcastLobbyUpdate() {
    const list = this.getPlayerList();
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send({
          type: 'lobby_update',
          players: list
        });
      }
    });
  }

  updateLobbyUI(playerList) {
    const list = playerList || this.getPlayerList();
    const slotContainer = document.getElementById('lobby-slots');
    if (!slotContainer) return;

    slotContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const p = list[i];
      const slot = document.createElement('div');
      slot.className = 'lobby-slot';
      if (p) {
        slot.style.borderColor = p.isHost ? '#facc15' : '#38bdf8';
        slot.style.background = p.isHost ? 'rgba(250, 204, 21, 0.12)' : 'rgba(56, 189, 248, 0.12)';
        slot.innerHTML = `
          <div style="font-size:22px;">${p.isHost ? '👑' : '🧙'}</div>
          <div style="font-weight:bold; color:#fff; font-size:13px;">${p.name}</div>
          <div style="font-size:10px; color:${p.isHost ? '#facc15' : '#38bdf8'}; font-weight:bold;">${p.isHost ? '[방장]' : '[준비완료]'}</div>
        `;
      } else {
        slot.style.borderColor = '#334155';
        slot.style.background = '#0f172a';
        slot.innerHTML = `
          <div style="font-size:20px; opacity:0.35;">⏳</div>
          <div style="font-weight:normal; color:#64748b; font-size:12px;">${i + 1}P 빈 슬롯</div>
          <div style="font-size:10px; color:#475569;">접속 대기 중...</div>
        `;
      }
      slotContainer.appendChild(slot);
    }

    const btnStart = document.getElementById('btn-lobby-start');
    if (btnStart) {
      if (this.isHost) {
        btnStart.style.display = 'block';
        btnStart.textContent = `🚀 게임 시작 (${list.length}/4명 준비 완료)`;
      } else {
        btnStart.style.display = 'none';
      }
    }

    const guestNotice = document.getElementById('lobby-guest-notice');
    if (guestNotice) {
      guestNotice.style.display = this.isHost ? 'none' : 'block';
    }

    const roomCodeDisplay = document.getElementById('lobby-room-code-val');
    if (roomCodeDisplay && this.roomCode) {
      roomCodeDisplay.textContent = this.roomCode;
    }

    const lobbyView = document.getElementById('multi-lobby-waiting');
    const createView = document.getElementById('multi-lobby-selection');
    if (lobbyView && createView) {
      createView.style.display = 'none';
      lobbyView.style.display = 'block';
    }
  }

  // 4. 호스트 동기화 루프 (초당 25회: 몬스터, 젬, 팀 경험치, 파티원 위치)
  startHostSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (!this.isHost || this.connections.length === 0 || !engine || !engine.player) return;

      // 몬스터 정보 패킹 (고유 ID 포함)
      const monsters = engine.enemies.map(e => ({
        id: e.id,
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: Math.round(e.hp),
        maxHp: Math.round(e.maxHp),
        type: e.type,
        flash: e.flash > 0,
        slow: e.slowTimer > 0
      }));

      // 경험치 보석 패킹
      const gems = engine.gems.map(g => ({
        id: g.id,
        x: Math.round(g.x),
        y: Math.round(g.y),
        val: g.value,
        col: g.color
      }));

      // 보물상자 패킹
      const chests = (engine.chests || []).map(c => ({
        x: Math.round(c.x),
        y: Math.round(c.y),
        tier: c.tier
      }));

      const payload = {
        type: 'world_sync',
        gameTime: engine.gameTime,
        monsters,
        gems,
        chests,
        kills: engine.killCount,
        teamExp: engine.currentExp,
        teamLvl: engine.currentLvl,
        neededExp: engine.neededExp,
        hostName: this.localPlayerName,
        hostPlayer: {
          x: Math.round(engine.player.x),
          y: Math.round(engine.player.y),
          hp: Math.round(engine.player.hp),
          maxHp: engine.player.maxHp,
          facing: engine.player.facing,
          heroClass: engine.player.heroClass || 'summoner',
          subclass: engine.player.subclass || 'ignis',
          tier: engine.player.tier || 1,
          isDowned: !!engine.player.isDowned,
          isInvincible: !!engine.player.isInvincible
        },
        hostPet: engine.pet ? {
          x: Math.round(engine.pet.x),
          y: Math.round(engine.pet.y),
          tier: engine.pet.tier || 1,
          config: {
            element: (engine.pet.config && engine.pet.config.element) || 'fire',
            color: (engine.pet.config && engine.pet.config.color) || '#ef4444',
            name: (engine.pet.config && engine.pet.config.name) || '펫'
          }
        } : null,
        peers: engine.peers
      };

      this.connections.forEach(conn => {
        if (conn.open) conn.send(payload);
      });
    }, 40); // 25 FPS (40ms)
  }

  // 5. 게스트 동기화 루프 (초당 25회: 자신의 좌표, 체력, 기절여부 전송)
  startGuestSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (this.isHost || !this.hostConn || !this.hostConn.open || !engine || !engine.player) return;

      this.hostConn.send({
        type: 'guest_update',
        name: this.localPlayerName,
        player: {
          x: Math.round(engine.player.x),
          y: Math.round(engine.player.y),
          hp: Math.round(engine.player.hp),
          maxHp: engine.player.maxHp,
          facing: engine.player.facing,
          heroClass: engine.player.heroClass || 'summoner',
          subclass: engine.player.subclass || 'ignis',
          tier: engine.player.tier || 1,
          isDowned: !!engine.player.isDowned,
          isInvincible: !!engine.player.isInvincible
        },
        pet: engine.pet ? {
          x: Math.round(engine.pet.x),
          y: Math.round(engine.pet.y),
          tier: engine.pet.tier || 1,
          config: {
            element: (engine.pet.config && engine.pet.config.element) || 'fire',
            color: (engine.pet.config && engine.pet.config.color) || '#ef4444',
            name: (engine.pet.config && engine.pet.config.name) || '펫'
          }
        } : null
      });
    }, 40);
  }

  // 게스트가 몬스터를 타격했을 때 호스트에 데미지 RPC 전송
  sendEnemyDamage(enemyId, damage) {
    if (!this.isHost && this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'enemy_damage',
        enemyId,
        damage
      });
    }
  }

  // 게스트가 보석을 습득했을 때 호스트에 전송 (팀 경험치 동기화)
  sendCollectGem(gemId, value) {
    if (!this.isHost && this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'collect_gem',
        gemId,
        value
      });
    }
  }

  // 호스트가 게스트로부터 받은 패킷 처리
  handleGuestData(peerId, data) {
    if (data.type === 'set_name') {
      if (data.name && data.name.trim()) {
        this.guestNames[peerId] = data.name.trim();
        this.updateLobbyUI();
        this.broadcastLobbyUpdate();
      }
      return;
    }

    if (!engine) return;

    if (data.type === 'guest_update') {
      if (!engine.peers) engine.peers = {};
      engine.peers[peerId] = {
        name: data.name || this.guestNames[peerId] || '참가자',
        player: data.player,
        pet: data.pet
      };
    }

    // ⚔️ 양방향 타격 RPC: 게스트가 입힌 대미지를 호스트 몬스터 체력에 실제 적용
    else if (data.type === 'enemy_damage') {
      const enemy = engine.enemies.find(e => e.id === data.enemyId);
      if (enemy) {
        enemy.takeDamage(data.damage, true); // true = 게스트 대미지 처리 플래그
      }
    }

    // 💎 보석 습득 RPC: 게스트가 젬을 먹었을 때 호스트가 젬을 소멸시키고 팀 경험치 반영
    else if (data.type === 'collect_gem') {
      const gIdx = engine.gems.findIndex(g => g.id === data.gemId);
      if (gIdx !== -1) {
        const gem = engine.gems[gIdx];
        engine.gems.splice(gIdx, 1);
        engine.collectGem(gem, true);
      }
    }
  }

  // 게스트가 호스트로부터 받은 패킷 처리 (세계 상태 및 팀 스탯 반영)
  handleHostData(data) {
    if (data.type === 'lobby_update') {
      this.updateLobbyUI(data.players);
      return;
    }

    if (data.type === 'start_game') {
      const multiModal = document.getElementById('multi-modal');
      if (multiModal) multiModal.style.display = 'none';
      if (typeof openPetSelectModal === 'function') {
        openPetSelectModal();
      }
      return;
    }

    if (!engine) return;

    if (data.type === 'welcome') {
      if (data.players) this.updateLobbyUI(data.players);
      this.localPlayerName = data.assignedName;
      const roleLabel = document.getElementById('player-role-label');
      if (roleLabel) roleLabel.textContent = `🧙 ${data.assignedName}`;
      this.updateStatusBadge(`🎮 ${data.assignedName} (방: ${data.roomCode})`);
      return;
    }

    if (data.type === 'world_sync') {
      // 1. 호스트 정보 피어로 등록
      if (!engine.peers) engine.peers = {};
      engine.peers['host'] = {
        name: data.hostName || '👑 아빠 (방장)',
        player: data.hostPlayer,
        pet: data.hostPet
      };

      // 2. 다른 게스트 피어들 병합
      if (data.peers) {
        for (const pid in data.peers) {
          if (pid !== this.peer.id) {
            engine.peers[pid] = data.peers[pid];
          }
        }
      }

      // 3. 몬스터 목록 부드러운 조정 (Reconciliation) - 애니메이션 끊김 방지
      const currentMap = new Map();
      engine.enemies.forEach(e => currentMap.set(e.id, e));
      const reconciled = [];

      data.monsters.forEach(m => {
        let existing = currentMap.get(m.id);
        if (existing) {
          existing.x = existing.x * 0.4 + m.x * 0.6;
          existing.y = existing.y * 0.4 + m.y * 0.6;
          existing.hp = m.hp;
          existing.maxHp = m.maxHp;
          if (m.flash) existing.flash = 0.12;
          if (m.slow) existing.slowTimer = 1.0;
          reconciled.push(existing);
        } else {
          const mDef = GAME_DATA.monsters[m.type] || GAME_DATA.monsters.slime;
          const newEnemy = new EngineEnemy(m.x, m.y, m.type, mDef, engine);
          newEnemy.id = m.id;
          newEnemy.hp = m.hp;
          newEnemy.maxHp = m.maxHp;
          reconciled.push(newEnemy);
        }
      });
      engine.enemies = reconciled;

      // 4. 경험치 젬 목록 부드러운 조정
      const gemMap = new Map();
      engine.gems.forEach(g => gemMap.set(g.id, g));
      const reconciledGems = [];

      data.gems.forEach(g => {
        let existing = gemMap.get(g.id);
        if (existing) {
          existing.x = g.x;
          existing.y = g.y;
          reconciledGems.push(existing);
        } else {
          const newG = new EngineGem(g.x, g.y, g.val, g.col);
          newG.id = g.id;
          reconciledGems.push(newG);
        }
      });
      engine.gems = reconciledGems;

      // 5. 보물상자 목록
      if (data.chests) {
        engine.chests = data.chests.map(c => new EngineChest(c.x, c.y, c.tier));
      }

      // 6. 킬 카운트 및 생존 시간
      engine.killCount = data.kills;
      const killEl = document.getElementById('kill-display');
      if (killEl) killEl.textContent = data.kills;
      engine.gameTime = data.gameTime;

      // 7. 팀 공유 경험치 및 레벨업 동기화
      if (data.teamLvl > engine.currentLvl) {
        const lvlDiff = data.teamLvl - engine.currentLvl;
        engine.currentLvl = data.teamLvl;
        engine.neededExp = data.neededExp;
        engine.currentExp = data.teamExp;
        engine.updateExpBar();
        for (let k = 0; k < lvlDiff; k++) {
          engine.levelUp(true); // 실시간 비정지 레벨업
        }
      } else {
        engine.currentExp = data.teamExp;
        engine.neededExp = data.neededExp;
        engine.updateExpBar();
      }
    }
  }

  updateStatusBadge(text) {
    const badge = document.getElementById('net-badge');
    const label = document.getElementById('net-status-text');
    if (badge && label) {
      badge.style.display = 'inline-flex';
      label.textContent = text;
    }
  }
}

// Global instance
const networkManager = new NetworkManager();
