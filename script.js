/* MobiLamb — whiteboard edition.
 * Game RULES are unchanged from the original; only the screen flow and rendering
 * were reformulated (rough.js hand-drawn board, inline vector icons). */

const PALETTE = {
    ink: '#2b2b2b', paper: '#fdfdfb',
    blue: '#2f6fb0', purple: '#7a52c7', pink: '#d6418a', red: '#d6402f',
    green: '#3f9e54', orange: '#e0832e'
};
const VALUE_COLOR = { 1: PALETTE.blue, 2: PALETTE.purple, 3: PALETTE.pink, 4: PALETTE.red };

// Button variant -> { box, color }
const BTN_VARIANTS = {
    'btn-primary': { box: { fill: PALETTE.green, stroke: PALETTE.ink, strokeWidth: 3 }, color: PALETTE.paper },
    'btn-blue':    { box: { fill: PALETTE.paper, stroke: PALETTE.blue, strokeWidth: 3 }, color: PALETTE.blue },
    'btn-orange':  { box: { fill: PALETTE.paper, stroke: PALETTE.orange, strokeWidth: 3 }, color: PALETTE.orange },
    'btn-red':     { box: { fill: PALETTE.paper, stroke: PALETTE.red, strokeWidth: 3 }, color: PALETTE.red },
    'btn-ghost':   { box: { fill: PALETTE.paper, stroke: PALETTE.ink, strokeWidth: 2.6 }, color: PALETTE.ink }
};

function decorateButton(btn) {
    const variant = Object.keys(BTN_VARIANTS).find(v => btn.classList.contains(v)) || 'btn-ghost';
    const cfg = BTN_VARIANTS[variant];
    const iconName = btn.dataset.icon;
    if (iconName && !btn.querySelector('.sk-icon')) {
        // clean filled FA glyph in the variant colour
        btn.insertBefore(Sketch.icon(iconName, { fill: cfg.color }), btn.firstChild);
    }
    const ctrl = Sketch.box(btn, Object.assign({ fillStyle: 'solid', roughness: 1.7, seedKey: btn.id || iconName || 'btn' }, cfg.box));
    if (!btn._skHover) {
        btn._skHover = true;
        btn.addEventListener('mouseenter', () => ctrl.update({ seed: Sketch.seedFrom((btn.id || 'b') + Math.floor(performance.now())) }));
    }
}

// Fill standalone <svg.sk-icon[data-icon]> placeholders with hand-drawn paths.
function fillIcons(root) {
    (root || document).querySelectorAll('svg.sk-icon[data-icon]').forEach(ph => {
        if (ph.dataset.done) return;
        const name = ph.dataset.icon;
        const color = getComputedStyle(ph).color || PALETTE.ink;
        const ic = Sketch.icon(name, { fill: color });
        ic.setAttribute('class', ph.getAttribute('class'));
        ic.dataset.done = '1';
        ph.replaceWith(ic);
    });
}

class MobiLambGame {
    constructor() {
        this.terrainValues = { PLAYER1_START: 'start1', PLAYER2_START: 'start2', VALUE_1: 1, VALUE_2: 2, VALUE_3: 3, VALUE_4: 4 };
        this.resetState();
        this.decorateUI();
        this.initializeEventListeners();
    }

    resetState() {
        this.gameState = {
            currentScreen: 'menu',
            currentPlayer: 1,
            players: { 1: { position: null, isFirstMove: true }, 2: { position: null, isFirstMove: true } },
            board: [],
            gameStarted: false,
            gameOver: false,
            winner: null
        };
    }

    // ---- one-time UI rendering ----
    decorateUI() {
        document.querySelectorAll('.btn').forEach(decorateButton);
        fillIcons();
        // logo sheep (white, hand-drawn)
        const logo = document.getElementById('logo-sheep');
        if (logo) {
            const s = Sketch.icon('sheep', { sketch: true, fill: PALETTE.paper, stroke: PALETTE.ink, strokeWidth: 16, roughness: 1.3 });
            s.setAttribute('class', logo.getAttribute('class'));
            logo.replaceWith(s);
        }
        // scoreboard sheep tokens + persistent rings
        document.querySelectorAll('.psheep[data-sheep]').forEach(el => {
            el.appendChild(Sketch.sheepToken(el.dataset.sheep, PALETTE));
        });
        Sketch.ring(document.getElementById('player1'), { stroke: PALETTE.green, strokeWidth: 3 });
        Sketch.ring(document.getElementById('player2'), { stroke: PALETTE.orange, strokeWidth: 3 });
        // tutorial mini board
        this.renderMiniBoard();
    }

    initializeEventListeners() {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
        on('play-btn', () => this.startGame());
        on('tutorial-btn', () => this.showScreen('tutorial-screen'));
        on('credits-btn', () => this.showScreen('credits-screen'));
        on('tutorial-play-btn', () => this.startGame());
        on('credits-back-btn', () => this.showMenu());
        on('restart-btn', () => this.askRestart());
        on('leave-btn', () => this.askLeave());
        on('new-game-btn', () => this.startGame());
        on('menu-btn', () => this.showMenu());

        // confirm overlay: click on backdrop cancels; Escape cancels
        const confirmScreen = document.getElementById('confirm-screen');
        if (confirmScreen) confirmScreen.addEventListener('click', e => { if (e.target === confirmScreen) this.closeConfirm(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.gameState.currentScreen === 'confirm-screen') this.closeConfirm();
        });
    }

    // ---- navigation ----
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'behind'));
        document.getElementById(id).classList.add('active');
        if (id === 'game-over-screen' || id === 'confirm-screen') document.getElementById('game-screen').classList.add('behind');
        this.gameState.currentScreen = id;
    }

    showMenu() {
        this.showScreen('menu-screen');
        this.resetState();
    }

    // ---- game lifecycle ----
    startGame() {
        this.resetState();
        this.gameState.gameStarted = true;
        this.showScreen('game-screen');
        this.initializeBoard();
        this.renderBoard();
        this.updateUI();
    }

    initializeBoard() {
        const terrains = [
            this.terrainValues.PLAYER1_START, this.terrainValues.PLAYER2_START,
            ...Array(4).fill(this.terrainValues.VALUE_1),
            ...Array(4).fill(this.terrainValues.VALUE_2),
            ...Array(4).fill(this.terrainValues.VALUE_3),
            ...Array(2).fill(this.terrainValues.VALUE_4)
        ];
        for (let i = terrains.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [terrains[i], terrains[j]] = [terrains[j], terrains[i]];
        }
        this.gameState.board = terrains.map((value, index) => ({
            id: index, value, disabled: false, row: Math.floor(index / 4), col: index % 4
        }));
        this.gameState.players[1].position = this.gameState.board.find(t => t.value === this.terrainValues.PLAYER1_START).id;
        this.gameState.players[2].position = this.gameState.board.find(t => t.value === this.terrainValues.PLAYER2_START).id;
        this.gameState.currentPlayer = Math.random() < 0.5 ? 1 : 2;
    }

    // ---- rendering ----
    renderBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        const gs = this.gameState;

        gs.board.forEach(terrain => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.id = terrain.id;
            board.appendChild(tile);

            if (terrain.disabled) {
                tile.classList.add('disabled');
                Sketch.box(tile, { fill: '#cfd3cb', fillStyle: 'cross-hatch', stroke: '#9aa093', strokeWidth: 1.6, hachureGap: 6, roughness: 2, seedKey: 'd' + terrain.id });
            } else if (terrain.value === 'start1' || terrain.value === 'start2') {
                Sketch.box(tile, { fill: '#eef0ea', fillStyle: 'solid', stroke: PALETTE.ink, strokeWidth: 2.4, roughness: 1.7, seedKey: 's' + terrain.id });
            } else {
                Sketch.box(tile, { fill: VALUE_COLOR[terrain.value], fillStyle: 'solid', stroke: PALETTE.ink, strokeWidth: 2.6, roughness: 1.7, seedKey: 't' + terrain.id });
                const num = document.createElement('span');
                num.className = 'num';
                num.textContent = terrain.value;
                tile.appendChild(num);
            }
            tile.addEventListener('click', () => this.handleTerrainClick(terrain.id));
        });

        // sheep tokens
        Object.entries(gs.players).forEach(([pid, p]) => {
            if (p.position === null) return;
            const tile = board.querySelector('.tile[data-id="' + p.position + '"]');
            const num = tile.querySelector('.num');
            if (num) num.style.display = 'none';
            tile.appendChild(Sketch.sheepToken(pid === '1' ? 'dolly' : 'shaun', PALETTE));
        });

        if (gs.gameOver) return;

        // highlights: ring on current sheep + possible move outlines
        const cur = gs.currentPlayer;
        const curPos = gs.players[cur].position;
        const curTile = board.querySelector('.tile[data-id="' + curPos + '"]');
        if (curTile) curTile.classList.add('current');

        this.getPossibleMoves(curPos, cur).forEach(pos => {
            const t = board.querySelector('.tile[data-id="' + pos + '"]');
            if (!t) return;
            t.classList.add('possible');
            const hl = document.createElement('div');
            hl.className = 'move-hl';
            t.appendChild(hl);
            Sketch.box(hl, { fill: undefined, stroke: PALETTE.green, strokeWidth: 3.5, roughness: 2.2, pad: 3, seedKey: 'h' + pos });
        });
    }

    renderMiniBoard() {
        const el = document.getElementById('tutorial-board');
        if (!el) return;
        // fixed sample layout: s1 + values + s2
        const sample = ['start1', 1, 2, 3, 4, 1, 2, 'start2', 3, 1, 2, 4, 1, 3, 2, 1];
        sample.forEach((v, i) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            el.appendChild(tile);
            if (v === 'start1' || v === 'start2') {
                Sketch.box(tile, { fill: '#eef0ea', fillStyle: 'solid', stroke: PALETTE.ink, strokeWidth: 2, roughness: 1.7, seedKey: 'ms' + i });
                tile.appendChild(Sketch.sheepToken(v === 'start1' ? 'dolly' : 'shaun', PALETTE));
            } else {
                Sketch.box(tile, { fill: VALUE_COLOR[v], fillStyle: 'solid', stroke: PALETTE.ink, strokeWidth: 2, roughness: 1.7, seedKey: 'm' + i });
                const num = document.createElement('span');
                num.className = 'num';
                num.textContent = v;
                tile.appendChild(num);
            }
        });
    }

    updateUI() {
        const cur = this.gameState.currentPlayer;
        const name = cur === 1 ? 'Dolly' : 'Shaun';
        const turnEl = document.getElementById('current-turn');
        turnEl.textContent = 'Vez de ' + name;
        turnEl.style.color = cur === 1 ? PALETTE.green : PALETTE.orange;

        const pdata = this.gameState.players[cur];
        let moves = '';
        if (pdata.position !== null) {
            if (pdata.isFirstMove) moves = 'até 4 casas';
            else {
                const t = this.gameState.board[pdata.position];
                moves = 'mova exatamente ' + (typeof t.value === 'number' ? t.value : 0);
            }
        }
        document.getElementById('moves-count').textContent = moves;
        document.getElementById('player1').classList.toggle('dim', cur !== 1);
        document.getElementById('player2').classList.toggle('dim', cur !== 2);
    }

    // ---- interaction ----
    handleTerrainClick(terrainId) {
        if (this.gameState.gameOver) return;
        if (this.gameState.board[terrainId].disabled) return;
        const cur = this.gameState.players[this.gameState.currentPlayer];
        if (this.getPossibleMoves(cur.position, this.gameState.currentPlayer).includes(terrainId)) {
            this.makeMove(terrainId);
        }
    }

    makeMove(targetPosition) {
        const cur = this.gameState.currentPlayer;
        const pdata = this.gameState.players[cur];
        if (pdata.position !== null) this.gameState.board[pdata.position].disabled = true;
        pdata.position = targetPosition;
        pdata.isFirstMove = false;

        if (this.checkGameOver()) {
            this.gameState.gameOver = true;
            this.renderBoard();
            this.endGame();
            return;
        }
        this.gameState.currentPlayer = cur === 1 ? 2 : 1;
        this.renderBoard();
        this.updateUI();
    }

    // ---- rules (unchanged behaviour) ----
    getPossibleMoves(fromPosition, playerId) {
        if (fromPosition === null) return [];
        const player = this.gameState.players[playerId];
        const fromTerrain = this.gameState.board[fromPosition];
        const requiredMoves = player.isFirstMove ? null : (typeof fromTerrain.value === 'number' ? fromTerrain.value : 0);
        if (requiredMoves === 0) return [];

        const reachable = new Set();
        const directions = [[-1, 0], [0, -1], [0, 1], [1, 0]];
        const steps = player.isFirstMove ? 4 : requiredMoves;
        const exact = !player.isFirstMove;

        const queue = [{ position: fromPosition, movesLeft: steps }];
        const visited = new Set();
        while (queue.length > 0) {
            const { position, movesLeft } = queue.shift();
            if (movesLeft === 0) continue;
            const r = Math.floor(position / 4), c = position % 4;
            for (const [dr, dc] of directions) {
                const np = ((r + dr + 4) % 4) * 4 + ((c + dc + 4) % 4);
                if (np === fromPosition) continue;
                if (!this.isValidMove(np, playerId)) continue;
                if (!exact || movesLeft === 1) reachable.add(np);
                if (movesLeft > 1) {
                    const key = np + '-' + (movesLeft - 1);
                    if (!visited.has(key)) { visited.add(key); queue.push({ position: np, movesLeft: movesLeft - 1 }); }
                }
            }
        }
        return Array.from(reachable);
    }

    isValidMove(targetPosition, playerId) {
        if (this.gameState.board[targetPosition].disabled) return false;
        const other = playerId === 1 ? 2 : 1;
        if (this.gameState.players[other].position === targetPosition) return false;
        return true;
    }

    checkGameOver() {
        const next = this.gameState.currentPlayer === 1 ? 2 : 1;
        if (this.getPossibleMoves(this.gameState.players[next].position, next).length === 0) {
            this.gameState.winner = this.gameState.currentPlayer;
            return true;
        }
        return false;
    }

    endGame() {
        const winnerName = this.gameState.winner === 1 ? 'Dolly' : 'Shaun';
        const trophy = document.getElementById('winner-trophy');
        document.getElementById('winner-text').textContent = winnerName + ' venceu!';
        document.getElementById('winner-text').style.color = this.gameState.winner === 1 ? PALETTE.green : PALETTE.orange;
        document.getElementById('game-over-reason').textContent = 'O oponente não pode mais se mover.';
        setTimeout(() => this.showScreen('game-over-screen'), 900);
    }

    // ---- confirmation overlay (sketch style, replaces native confirm) ----
    askConfirm(opts) {
        const host = document.getElementById('confirm-icon-host');
        host.innerHTML = '';
        host.appendChild(Sketch.icon(opts.icon, { fill: opts.color }));
        document.getElementById('confirm-title').textContent = opts.title;
        document.getElementById('confirm-text').textContent = opts.text;

        const actions = document.getElementById('confirm-actions');
        actions.innerHTML = '';
        const yes = document.createElement('button');
        yes.className = 'btn ' + opts.confirmVariant;
        yes.id = 'confirm-yes';
        yes.innerHTML = '<span>' + opts.confirmLabel + '</span>';
        const no = document.createElement('button');
        no.className = 'btn btn-ghost';
        no.id = 'confirm-no';
        no.innerHTML = '<span>Cancelar</span>';
        actions.appendChild(yes);
        actions.appendChild(no);
        decorateButton(yes);
        decorateButton(no);
        yes.addEventListener('click', () => { this.closeConfirm(); opts.onConfirm(); });
        no.addEventListener('click', () => this.closeConfirm());

        this.showScreen('confirm-screen');
    }

    closeConfirm() {
        this.showScreen('game-screen');
    }

    askRestart() {
        this.askConfirm({
            icon: 'arrows-rotate', color: PALETTE.blue,
            title: 'Reiniciar partida?',
            text: 'O tabuleiro será embaralhado e a partida recomeça do zero.',
            confirmLabel: 'Reiniciar', confirmVariant: 'btn-blue',
            onConfirm: () => this.startGame()
        });
    }

    askLeave() {
        this.askConfirm({
            icon: 'right-from-bracket', color: PALETTE.red,
            title: 'Sair do jogo?',
            text: 'Você volta ao menu inicial e a partida atual é perdida.',
            confirmLabel: 'Sair', confirmVariant: 'btn-red',
            onConfirm: () => this.showMenu()
        });
    }
}

/* ---- PWA ---- */
class PWAManager {
    constructor() { this.installPrompt = null; this.init(); }
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('sw.js');
                reg.addEventListener('updatefound', () => this.showUpdateToast());
            } catch (e) { /* offline / unsupported */ }
        }
        window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.installPrompt = e; this.showInstallButton(); });
        window.addEventListener('appinstalled', () => this.hideInstallButton());
    }
    showInstallButton() {
        if (document.getElementById('install-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'install-btn';
        btn.className = 'btn btn-block btn-ghost';
        btn.dataset.icon = 'mobile-screen-button';
        btn.innerHTML = '<span>Instalar app</span>';
        btn.onclick = () => this.installPWA();
        const menu = document.querySelector('.menu-buttons');
        if (menu) { menu.appendChild(btn); decorateButton(btn); }
    }
    hideInstallButton() { const b = document.getElementById('install-btn'); if (b) b.remove(); }
    async installPWA() {
        if (!this.installPrompt) return;
        this.installPrompt.prompt();
        await this.installPrompt.userChoice;
        this.installPrompt = null;
    }
    showUpdateToast() {
        if (document.querySelector('.update-toast')) return;
        const t = document.createElement('div');
        t.className = 'update-toast';
        t.innerHTML = '<span>Nova versão disponível</span><button>Atualizar</button>';
        t.querySelector('button').onclick = () => location.reload();
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 6000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PWAManager();
    window.mobilamb = new MobiLambGame();
});
