    // Constants & Game States
    let BOARD_SIZE = 15;
    let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    let currentPlayer = 1; // 1 = Black (Player), 2 = White (AI / Player 2)
    let history = []; // Stack of coordinates [{r, c, player}]
    let isGameOver = false;
    let gameMode = 'pve'; // 'pve' = Player vs AI, 'pvp' = Local Multi
    let difficulty = 'medium'; // 'easy', 'medium', 'hard'
    let isThinking = false;
    let startTime = Date.now();

    // 落子音效：优先使用平台合成器 window.__sfx（真实木质碰撞声），按下棋列做立体声定位、按黑白子区分音色
    let audioCtx = null;
    function playStoneSound(col, player) {
      if (!document.getElementById('sound-checkbox').checked) return;
      const pan = (typeof col === 'number' && BOARD_SIZE > 1) ? ((col / (BOARD_SIZE - 1)) - 0.5) * 0.5 : 0;
      const bright = player === 2 ? 1.06 : 0.94;
      const pitch = player === 2 ? 1.03 : 0.97;
      if (window.__sfx && window.__sfx.place) {
        window.__sfx.place({ pan: pan, bright: bright, pitch: pitch });
        return;
      }
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(2200, t);
        o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        o.connect(g).connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.07);
      } catch (e) { /* ignore */ }
    }

    // Initialize 15x15 board UI grid lines & trigger intersections
    function initializeBoardUI() {
      canvas = document.getElementById('fireworks-canvas');
      ctx = canvas ? canvas.getContext('2d') : null;
      const gridEl = document.getElementById('goban-grid-el');
      gridEl.innerHTML = '';
      gridEl.style.setProperty('--cells', String(BOARD_SIZE - 1));
      for (let i = 0; i < (BOARD_SIZE - 1) * (BOARD_SIZE - 1); i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridEl.appendChild(cell);
      }

      // 星位（按路数动态生成）
      const wrapper = document.getElementById('goban-grid-wrapper');
      wrapper.querySelectorAll('.star-point').forEach((el) => el.remove());
      let starCoords = [];
      if (BOARD_SIZE === 19) {
        for (const rr of [3, 9, 15]) for (const cc of [3, 9, 15]) starCoords.push([cc, rr]);
      } else if (BOARD_SIZE === 13) {
        starCoords = [[3,3],[9,3],[3,9],[9,9],[6,6]];
      } else {
        starCoords = [[3,3],[11,3],[3,11],[11,11],[7,7]];
      }
      const winSvg = document.getElementById('win-line-svg');
      for (const [cc, rr] of starCoords) {
        const sp = document.createElement('div');
        sp.className = 'star-point';
        sp.style.left = `${(cc * 100) / (BOARD_SIZE - 1)}%`;
        sp.style.top = `${(rr * 100) / (BOARD_SIZE - 1)}%`;
        wrapper.insertBefore(sp, winSvg);
      }

      const intersectionsContainer = document.getElementById('intersections-container-el');
      intersectionsContainer.innerHTML = '';
      intersectionsContainer.style.setProperty('--hit', `${(100 / (BOARD_SIZE - 1)) * 0.95}%`);
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const inter = document.createElement('div');
          inter.className = 'intersection';
          inter.style.left = `${(c * 100) / (BOARD_SIZE - 1)}%`;
          inter.style.top = `${(r * 100) / (BOARD_SIZE - 1)}%`;
          inter.dataset.row = r;
          inter.dataset.col = c;
          inter.id = `cell-${r}-${c}`;
          inter.addEventListener('click', () => handleCellClick(r, c));
          intersectionsContainer.appendChild(inter);
        }
      }

      // Configure resize for fireworks canvas size match
      resizeFireworksCanvas();
      if (!window.__gzResizeBound) { window.addEventListener('resize', resizeFireworksCanvas); window.__gzResizeBound = true; }
    }

    // Handle interactive cell click by Player
    function handleCellClick(r, c) {
      if (isGameOver || isThinking || board[r][c] !== 0) return;

      placeStone(r, c, currentPlayer);

      // Check win condition
      const winResult = checkWin(r, c, board);
      if (winResult) {
        endGame(currentPlayer, winResult);
        return;
      }

      // Check draw condition
      if (history.length === BOARD_SIZE * BOARD_SIZE) {
        endGame(0, null);
        return;
      }

      // Switch turn
      if (gameMode === 'pve') {
        // AI Turn
        currentPlayer = 2;
        updateTurnDisplay();
        triggerAI();
      } else {
        // Local PVP Switch
        currentPlayer = 3 - currentPlayer; // alternate 1 -> 2 -> 1
        updateTurnDisplay();
      }
    }

    // Put stone element inside trigger layer cell
    function placeStone(r, c, player) {
      board[r][c] = player;
      history.push({ r, c, player });

      const cell = document.getElementById(`cell-${r}-${c}`);
      cell.classList.add('occupied');

      const stone = document.createElement('div');
      stone.className = `stone ${player === 1 ? 'black' : 'white'} dropping`;
      
      // Clean last-placed glow on previous stone
      document.querySelectorAll('.stone.last-placed').forEach(s => s.classList.remove('last-placed'));
      stone.classList.add('last-placed');

      cell.appendChild(stone);

      // Play synthesized stone collision sound
      playStoneSound(c, player);

      // Log movement to UI list
      logMove(player, r, c);

      // Enable undo button
      document.getElementById('undo-btn').disabled = false;
    }

    // Remove stone from board (for Undo)
    function removeStone(r, c) {
      board[r][c] = 0;
      const cell = document.getElementById(`cell-${r}-${c}`);
      cell.classList.remove('occupied');
      cell.innerHTML = '';
    }

    // AI Move trigger
    function triggerAI() {
      isThinking = true;
      document.getElementById('ai-loader').classList.add('active');
      
      // Add deliberate latency to simulate AI planning
      const delay = Math.max(500, 600 + Math.random() * 300);

      setTimeout(() => {
        if (isGameOver) return; // safeguard if reset clicked during thinking
        
        const move = getBestAIMove();
        placeStone(move.r, move.c, 2);

        const winResult = checkWin(move.r, move.c, board);
        if (winResult) {
          endGame(2, winResult);
          isThinking = false;
          document.getElementById('ai-loader').classList.remove('active');
          return;
        }

        if (history.length === BOARD_SIZE * BOARD_SIZE) {
          endGame(0, null);
          isThinking = false;
          document.getElementById('ai-loader').classList.remove('active');
          return;
        }

        // Return turn to Player 1
        currentPlayer = 1;
        isThinking = false;
        document.getElementById('ai-loader').classList.remove('active');
        updateTurnDisplay();
      }, delay);
    }

    // AI Brain Logic (Heuristic Score Mapping Engine)
    function getBestAIMove() {
      // If board is completely empty, place in center for best start strategy
      if (history.length === 0) {
        return { r: 7, c: 7 };
      }
      if (history.length === 1 && board[7][7] === 1) {
        // Player took center, grab adjacent cell
        const adjacents = [{r:6,c:6}, {r:6,c:7}, {r:6,c:8}, {r:7,c:6}, {r:7,c:8}, {r:8,c:6}, {r:8,c:7}, {r:8,c:8}];
        return adjacents[Math.floor(Math.random() * adjacents.length)];
      }

      let bestScore = -Infinity;
      let candidates = [];

      // Difficulty level parameters
      let offenseWeight = 1.0;
      let defenseWeight = 0.95; // default to block player slightly less than AI self-win

      if (difficulty === 'easy') {
        offenseWeight = 0.6;
        defenseWeight = 0.55;
      } else if (difficulty === 'hard') {
        offenseWeight = 1.0;
        defenseWeight = 1.25; // prioritize heavy defense blocking player combos
      }

      // Pre-scan player's immediate win threats to force emergency blocks
      let emergencyDefend = null;
      let immediateWin = null;

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === 0) {
            // Check if placing AI stone here results in an immediate 5-in-a-row win
            board[r][c] = 2;
            if (checkWin(r, c, board)) {
              immediateWin = { r, c };
            }
            // Check if placing Player stone here results in player immediate 5-in-a-row win
            board[r][c] = 1;
            if (checkWin(r, c, board)) {
              emergencyDefend = { r, c };
            }
            board[r][c] = 0; // reset
            if (immediateWin) break;
          }
        }
        if (immediateWin) break;
      }

      // If we can win instantly, do it!
      if (immediateWin) {
        return immediateWin;
      }
      // If we must block an immediate player win, do it!
      if (emergencyDefend) {
        return emergencyDefend;
      }

      // Score evaluation table
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] !== 0) continue;

          // Compute tactical weight based on proximity to center (center focus)
          const midPt = (BOARD_SIZE - 1) / 2;
          const centerDist = Math.abs(r - midPt) + Math.abs(c - midPt);
          const positionalBonus = Math.max(0, (BOARD_SIZE - 1) - centerDist) * 0.15;

          const aiScore = scorePosition(r, c, 2);  // Offensive score
          const playerScore = scorePosition(r, c, 1); // Defensive score

          let totalScore = (aiScore * offenseWeight) + (playerScore * defenseWeight) + positionalBonus;

          // Easy difficulty adds small chaotic noise to introduce human-like slipups
          if (difficulty === 'easy') {
            totalScore += Math.random() * 15;
          }

          if (totalScore > bestScore) {
            bestScore = totalScore;
            candidates = [{ r, c }];
          } else if (totalScore === bestScore) {
            candidates.push({ r, c });
          }
        }
      }

      // Pick randomly among cells tied with the maximum evaluation score
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Heuristic assessment for cell (r, c) for a given player role
    function scorePosition(r, c, playerRole) {
      let score = 0;
      const opponent = 3 - playerRole;
      const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1]   // diagonal down-left
      ];

      // Scan 5-stone window segments intersecting (r, c) in all directions
      for (let [dr, dc] of directions) {
        // A stone combination window contains 5 coordinates.
        // The cell (r, c) could be at index 0, 1, 2, 3, or 4 inside this window.
        for (let offset = -4; offset <= 0; offset++) {
          let hasOpponent = false;
          let selfCount = 0;
          let emptyCount = 0;

          for (let i = 0; i < 5; i++) {
            const step = offset + i;
            const nr = r + step * dr;
            const nc = c + step * dc;

            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const val = board[nr][nc];
              if (val === opponent) {
                hasOpponent = true;
                break; // Opponent blocks this window from forming a five-in-a-row
              } else if (val === playerRole) {
                selfCount++;
              } else {
                emptyCount++;
              }
            } else {
              hasOpponent = true; // out of boundary acts as blocked
              break;
            }
          }

          if (!hasOpponent) {
            // Note: Since we are evaluating placing a stone at (r, c), selfCount represents
            // current stones. Placing at (r, c) increases it by 1.
            const virtualStones = selfCount + 1;
            
            // Pattern Scoring Matrix
            switch (virtualStones) {
              case 5:
                score += 80000;
                break;
              case 4:
                // If it's a Live 4 (both ends empty), assign higher weight
                score += 4500;
                break;
              case 3:
                // Potential Live 3 setup
                score += 800;
                break;
              case 2:
                score += 80;
                break;
              case 1:
                score += 5;
                break;
            }
          }
        }
      }

      return score;
    }

    // Win condition checking routine
    function checkWin(r, c, gridState) {
      const player = gridState[r][c];
      if (player === 0) return null;

      const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1]   // diagonal down-left
      ];

      for (let [dr, dc] of directions) {
        let winningStones = [{ r, c }];

        // Check positive direction
        let step = 1;
        while (true) {
          const nr = r + step * dr;
          const nc = c + step * dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && gridState[nr][nc] === player) {
            winningStones.push({ r: nr, c: nc });
            step++;
          } else {
            break;
          }
        }

        // Check negative direction
        step = 1;
        while (true) {
          const nr = r - step * dr;
          const nc = c - step * dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && gridState[nr][nc] === player) {
            winningStones.push({ r: nr, c: nc });
            step++;
          } else {
            break;
          }
        }

        if (winningStones.length >= 5) {
          return winningStones; // Return coordinates of the winning line
        }
      }
      return null;
    }

    // Undo action (悔棋)
    function undo() {
      if (history.length === 0 || isGameOver || isThinking) return;

      if (gameMode === 'pve') {
        // Rollback 2 moves: AI's move and Player's move
        if (history.length >= 2) {
          const lastAI = history.pop();
          removeStone(lastAI.r, lastAI.c);
          
          const lastPlayer = history.pop();
          removeStone(lastPlayer.r, lastPlayer.c);

          logSystemMessage("撤销了上一手对局");
        }
      } else {
        // PVP Mode rolls back 1 move at a time
        const lastMove = history.pop();
        removeStone(lastMove.r, lastMove.c);
        currentPlayer = lastMove.player;
        updateTurnDisplay();
        logSystemMessage(`撤销了位于 (${lastMove.r + 1}, ${lastMove.c + 1}) 的落子`);
      }

      // Re-highlight the new last placed stone if exists
      document.querySelectorAll('.stone.last-placed').forEach(s => s.classList.remove('last-placed'));
      if (history.length > 0) {
        const prevMove = history[history.length - 1];
        const cell = document.getElementById(`cell-${prevMove.r}-${prevMove.c}`);
        const stone = cell.querySelector('.stone');
        if (stone) stone.classList.add('last-placed');
      }

      if (history.length === 0) {
        document.getElementById('undo-btn').disabled = true;
      }
    }

    // Log messages to sidebar scroll panel
    function logMove(player, r, c) {
      const logEl = document.getElementById('history-log');
      const timeOffset = Math.floor((Date.now() - startTime) / 1000);
      const minutes = String(Math.floor(timeOffset / 60)).padStart(2, '0');
      const seconds = String(timeOffset % 60).padStart(2, '0');

      const li = document.createElement('li');
      li.className = 'history-item';
      
      const roleStr = player === 1 ? '黑子 (玩家)' : (gameMode === 'pve' ? '白子 (AI)' : '白子 (玩家2)');
      const coordsStr = `${r + 1}行, ${c + 1}列`;
      
      li.innerHTML = `<span>${roleStr} 落子于 ${coordsStr}</span><span>${minutes}:${seconds}</span>`;
      logEl.appendChild(li);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function logSystemMessage(msg) {
      const logEl = document.getElementById('history-log');
      const timeOffset = Math.floor((Date.now() - startTime) / 1000);
      const minutes = String(Math.floor(timeOffset / 60)).padStart(2, '0');
      const seconds = String(timeOffset % 60).padStart(2, '0');

      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML = `<span style="color:var(--text-muted);font-style:italic;">${msg}</span><span>${minutes}:${seconds}</span>`;
      logEl.appendChild(li);
      logEl.scrollTop = logEl.scrollHeight;
    }

    // Refresh UI indicators representing whose turn it is
    function updateTurnDisplay() {
      const valEl = document.getElementById('status-value-el');
      const titleEl = document.getElementById('status-title-label');
      
      if (isGameOver) {
        titleEl.textContent = "游戏状态";
        valEl.innerHTML = `<span style="color:var(--accent);">对局结束</span>`;
        return;
      }

      titleEl.textContent = "当前回合";
      if (currentPlayer === 1) {
        valEl.innerHTML = `<span class="status-stone black"></span> 黑子 (玩家)`;
      } else {
        const text = gameMode === 'pve' ? '白子 (AI)' : '白子 (玩家2)';
        valEl.innerHTML = `<span class="status-stone white"></span> ${text}`;
      }
    }

    // Set configuration options
    function setMode(mode) {
      if (history.length > 0 && !confirm("切换对局模式将重开一局，是否确认？")) {
        return;
      }
      gameMode = mode;
      document.getElementById('mode-pve').classList.toggle('active', mode === 'pve');
      document.getElementById('mode-pvp').classList.toggle('active', mode === 'pvp');
      
      // Hide AI difficulty settings if local multi is chosen
      document.getElementById('difficulty-wrapper').style.display = mode === 'pve' ? 'block' : 'none';
      
      resetGame();
    }

    function setDifficulty(diff) {
      difficulty = diff;
      document.getElementById('diff-easy').classList.toggle('active', diff === 'easy');
      document.getElementById('diff-medium').classList.toggle('active', diff === 'medium');
      document.getElementById('diff-hard').classList.toggle('active', diff === 'hard');
      logSystemMessage(`难度变更为: ${diff === 'easy' ? '入门' : (diff === 'medium' ? '精英' : '宗师')}`);
    }

    // Highlight winning stones & draw connect line
    // 切换棋盘路数（13 / 15 / 19）
    function setBoardSize(n) {
      if (n !== 13 && n !== 15 && n !== 19) return;
      if (n === BOARD_SIZE) return;
      BOARD_SIZE = n;
      document.querySelectorAll('#size-13, #size-15, #size-19').forEach((b) => b.classList.remove('active'));
      const active = document.getElementById('size-' + n);
      if (active) active.classList.add('active');
      initializeBoardUI();
      resetGame();
    }

    function drawWinEffects(winningStones) {
      // 1. Add glow animation to stones
      winningStones.forEach(pos => {
        const cell = document.getElementById(`cell-${pos.r}-${pos.c}`);
        const stone = cell.querySelector('.stone');
        if (stone) stone.classList.add('winning');
      });

      // 2. Draw line from start stone to end stone using SVG percentages
      winningStones.sort((a, b) => a.r === b.r ? a.c - b.c : a.r - b.r);
      const first = winningStones[0];
      const last = winningStones[winningStones.length - 1];

      const pctX1 = (first.c * 100) / (BOARD_SIZE - 1);
      const pctY1 = (first.r * 100) / (BOARD_SIZE - 1);
      const pctX2 = (last.c * 100) / (BOARD_SIZE - 1);
      const pctY2 = (last.r * 100) / (BOARD_SIZE - 1);

      const lineEl = document.getElementById('win-line');
      lineEl.setAttribute('x1', `${pctX1}%`);
      lineEl.setAttribute('y1', `${pctY1}%`);
      lineEl.setAttribute('x2', `${pctX2}%`);
      lineEl.setAttribute('y2', `${pctY2}%`);
      
      lineEl.style.display = 'block';

      // 3. Kick off fireworks loop
      initFireworks();
    }

    // Launch end-game modal dialog
    function endGame(winner, winningStones) {
      isGameOver = true;
      updateTurnDisplay();

      const modal = document.getElementById('endgame-modal');
      const icon = document.getElementById('modal-icon-el');
      const title = document.getElementById('modal-title-el');
      const text = document.getElementById('modal-text-el');

      if (winner === 1) {
        drawWinEffects(winningStones);
        icon.textContent = '🏆';
        title.textContent = '黑子胜利';
        text.textContent = gameMode === 'pve' ? '妙手连珠！你成功击败了 AI。' : '黑棋技高一筹，成功获胜！';
      } else if (winner === 2) {
        drawWinEffects(winningStones);
        icon.textContent = '🤖';
        title.textContent = gameMode === 'pve' ? 'AI 获得胜利' : '白子胜利';
        text.textContent = gameMode === 'pve' ? '棋差一招！AI 识破了你的防线。' : '白棋计谋过人，最终胜出！';
      } else {
        icon.textContent = '🤝';
        title.textContent = '和棋';
        text.textContent = '棋逢对手，不分胜负。';
      }

      // Display Modal with slight delay so player appreciates the connect line and fireworks first
      setTimeout(() => {
        modal.classList.add('active');
      }, 1600);
    }

    // Reset game handler
    function resetGame() {
      // Clear game board state
      board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
      history = [];
      isGameOver = false;
      isThinking = false;
      currentPlayer = 1;
      startTime = Date.now();

      // Reset indicators
      updateTurnDisplay();
      document.getElementById('ai-loader').classList.remove('active');
      document.getElementById('undo-btn').disabled = true;
      document.getElementById('endgame-modal').classList.remove('active');

      // Reset SVG connections
      document.getElementById('win-line').style.display = 'none';

      // Clean HTML stones
      document.querySelectorAll('.intersection').forEach(el => {
        el.classList.remove('occupied');
        el.innerHTML = '';
      });

      // Clear logs
      document.getElementById('history-log').innerHTML = '<li class="history-item"><span>对局重新开始</span><span>00:00</span></li>';

      // Kill active fireworks animation loop
      stopFireworks();
    }

    function closeModalAndRestart() {
      document.getElementById('endgame-modal').classList.remove('active');
      resetGame();
    }

    // ==========================================
    // CANVAS PARTICLE FIREWORKS IMPLEMENTATION
    // ==========================================
    let canvas = null;
    let ctx = null;
    let particles = [];
    let fireworksAnimId = null;

    function resizeFireworksCanvas() {
      const goban = document.getElementById('goban-board');
      if (!canvas || !goban) return;
      canvas.width = goban.clientWidth;
      canvas.height = goban.clientHeight;
    }

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.5; // push up slightly
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.gravity = 0.08;
        this.drag = 0.985;
      }

      update() {
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.random() * 2 + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    const FIREWORK_COLORS = [
      '#d29034', '#ffdd8f', '#ff5722', '#ffeb3b', 
      '#4caf50', '#00bcd4', '#2196f3', '#e91e63'
    ];

    function createFirework(x, y) {
      const count = 40 + Math.floor(Math.random() * 20);
      const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
      }
    }

    function fireworksLoop() {
      // Create random automatic firework explosions
      if (Math.random() < 0.04 && particles.length < 250) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6); // keep them in top 60%
        createFirework(x, y);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw();
        }
      }

      fireworksAnimId = requestAnimationFrame(fireworksLoop);
    }

    function initFireworks() {
      // Trigger initial batch of bursts from the center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      createFirework(centerX - 100, centerY - 100);
      createFirework(centerX + 100, centerY - 100);
      createFirework(centerX, centerY - 50);

      fireworksAnimId = requestAnimationFrame(fireworksLoop);
    }

    function stopFireworks() {
      if (fireworksAnimId) {
        cancelAnimationFrame(fireworksAnimId);
        fireworksAnimId = null;
      }
      particles = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Startup script
    initializeBoardUI();
  
