/* ==========================================================================
   js/network.js - 4-Player Co-op Multiplay via WebRTC (PeerJS)
   아빠와 아이들 최대 4인을 위한 초저지연 P2P 멀티플레이어 동기화 엔진
   ========================================================================== */

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = []; // For host: list of connected guest conns
    this.hostConn = null;   // For guest: connection to the host
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = '';
    this.localPlayerName = '플레이어';
    this.guestNames = {};  // peerId -> custom name
    this.syncTimer = null;
    this.PREFIX = 'tamer-surv-v2-';
    this.maxGuests = 3;    // Total 4 players (1 host + 3 guests)
  }

  // 1. Host creates a room (e.g. Code: 7777)
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
      this.peer = new Peer(peerId);
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
      }
      this.startHostSync();
    });

    this.peer.on('connection', (conn) => {
      if (this.connections.length >= this.maxGuests) {
        conn.close(); // Max 4 players total (1 host + 3 guests)
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
      if (infoEl) infoEl.textContent = "방 생성 오류 (이미 존재하는 방 코드이거나 네트워크 오류입니다)";
    });
  }

  // 2. Guest joins a room
  joinRoom() {
    const input = document.getElementById('join-room-code');
    const code = (input.value || '').trim();
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
      this.peer = new Peer(myPeerId);
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
        if (infoEl) infoEl.innerHTML = `✅ 연결 성공! 대기실에 참가했습니다.`;

        // Send custom nickname to host
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

  // 3. Host triggers synchronized game start
  startMultiGame() {
    if (!this.isHost) return;

    // Broadcast start game to all guests
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'start_game' });
      }
    });

    // Close lobby modal and open pet select
    document.getElementById('multi-modal').style.display = 'none';
    if (typeof openPetSelectModal === 'function') {
      openPetSelectModal();
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

    // Toggle start game button visibility for Host
    const btnStart = document.getElementById('btn-lobby-start');
    if (btnStart) {
      if (this.isHost) {
        btnStart.style.display = 'block';
        btnStart.textContent = `🚀 게임 시작 (${list.length}/4명 준비 완료)`;
      } else {
        btnStart.style.display = 'none';
      }
    }

    // Show waiting notice for Guests
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

  // Host sends 몬스터, 젬, 다른 플레이어 상태 to guests (20 FPS)
  startHostSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (!this.isHost || this.connections.length === 0 || !engine) return;

      // Pack monsters (simplified: x, y, hp, type)
      const monsters = engine.enemies.map(e => ({
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: e.hp,
        type: e.type
      }));

      // Pack gems
      const gems = engine.gems.map(g => ({
        x: Math.round(g.x),
        y: Math.round(g.y),
        value: g.value,
        color: g.color
      }));

      const payload = {
        type: 'world_sync',
        gameTime: engine.gameTime,
        monsters,
        gems,
        hostPlayer: {
          x: Math.round(engine.player.x),
          y: Math.round(engine.player.y),
          hp: engine.player.hp,
          facing: engine.player.facing
        },
        hostPet: {
          x: Math.round(engine.pet.x),
          y: Math.round(engine.pet.y),
          tier: engine.pet.tier,
          config: {
            element: engine.pet.config.element,
            color: engine.pet.config.color,
            name: engine.pet.config.name
          }
        },
        peers: engine.peers
      };

      this.connections.forEach(conn => {
        if (conn.open) conn.send(payload);
      });
    }, 50); // 20 times per second
  }

  // Guest sends position and pet to host (20 FPS)
  startGuestSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (this.isHost || !this.hostConn || !this.hostConn.open || !engine) return;

      this.hostConn.send({
        type: 'guest_update',
        name: this.localPlayerName,
        player: {
          x: Math.round(engine.player.x),
          y: Math.round(engine.player.y),
          hp: engine.player.hp,
          facing: engine.player.facing
        },
        pet: {
          x: Math.round(engine.pet.x),
          y: Math.round(engine.pet.y),
          tier: engine.pet.tier,
          config: {
            element: engine.pet.config.element,
            color: engine.pet.config.color,
            name: engine.pet.config.name
          }
        }
      });
    }, 50);
  }

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
  }

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
      // Sync Host as a peer
      if (!engine.peers) engine.peers = {};
      engine.peers['host'] = {
        name: '👑 아빠 (호스트)',
        player: data.hostPlayer,
        pet: data.hostPet
      };

      // Merge other peers
      if (data.peers) {
        for (const pid in data.peers) {
          if (pid !== this.peer.id) {
            engine.peers[pid] = data.peers[pid];
          }
        }
      }

      // Guest receives monsters from Host
      engine.enemies = data.monsters.map(m => {
        const mDef = GAME_DATA.monsters[m.type] || GAME_DATA.monsters.slime;
        const enemy = new EngineEnemy(m.x, m.y, m.type, mDef, engine);
        enemy.hp = m.hp;
        return enemy;
      });

      // Guest receives gems from Host
      engine.gems = data.gems.map(g => {
        return new EngineGem(g.x, g.y, g.value, g.color);
      });

      engine.gameTime = data.gameTime;
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
