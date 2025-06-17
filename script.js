class MobiLambGame {
    constructor() {
        this.gameState = {
            currentScreen: 'menu',
            gameCode: '',
            currentPlayer: 1,
            players: {
                1: { position: null, isFirstMove: true },
                2: { position: null, isFirstMove: true }
            },
            board: [],
            gameStarted: false,
            gameOver: false,
            winner: null
        };

        this.terrainValues = {
            PLAYER1_START: 'start1',
            PLAYER2_START: 'start2',
            VALUE_1: 1,
            VALUE_2: 2,
            VALUE_3: 3,
            VALUE_4: 4
        };

        this.initializeEventListeners();
        this.generateGameCode();
    }

    initializeEventListeners() {
        // Menu buttons
        document.getElementById('create-game-btn').addEventListener('click', () => this.showCreateScreen());
        document.getElementById('join-game-btn').addEventListener('click', () => this.showJoinScreen());

        // Create screen buttons
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMenuScreen());
        document.getElementById('copy-code-btn').addEventListener('click', () => this.copyGameCode());

        // Join screen buttons
        document.getElementById('join-btn').addEventListener('click', () => this.joinGame());
        document.getElementById('back-to-menu2-btn').addEventListener('click', () => this.showMenuScreen());

        // Game controls
        document.getElementById('leave-game-btn').addEventListener('click', () => this.leaveGame());

        // Game over buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('back-to-menu3-btn').addEventListener('click', () => this.showMenuScreen());
    }

    generateGameCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'LAMB-';
        for (let i = 0; i < 4; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.gameState.gameCode = code;
        document.getElementById('game-code').textContent = code;
    }

    copyGameCode() {
        navigator.clipboard.writeText(this.gameState.gameCode).then(() => {
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.gameState.currentScreen = screenId;
    }

    showMenuScreen() {
        this.showScreen('menu-screen');
        this.resetGame();
    }

    showCreateScreen() {
        this.showScreen('create-screen');
        this.generateGameCode();
    }

    showJoinScreen() {
        this.showScreen('join-screen');
        document.getElementById('join-code').value = '';
    }

    joinGame() {
        const code = document.getElementById('join-code').value.toUpperCase();
        if (code.length === 9 && code.startsWith('LAMB-')) {
            this.gameState.gameCode = code;
            this.startGame();
        } else {
            alert('Código inválido! Use o formato LAMB-XXXX');
        }
    }

    startGame() {
        this.showScreen('game-screen');
        this.initializeBoard();
        this.gameState.gameStarted = true;
        this.updateUI();
    }

    initializeBoard() {
        // Create terrain distribution
        const terrains = [
            this.terrainValues.PLAYER1_START,
            this.terrainValues.PLAYER2_START,
            ...Array(4).fill(this.terrainValues.VALUE_1),
            ...Array(4).fill(this.terrainValues.VALUE_2),
            ...Array(4).fill(this.terrainValues.VALUE_3),
            ...Array(2).fill(this.terrainValues.VALUE_4)
        ];

        // Shuffle terrains
        for (let i = terrains.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [terrains[i], terrains[j]] = [terrains[j], terrains[i]];
        }

        // Initialize board
        this.gameState.board = terrains.map((value, index) => ({
            id: index,
            value: value,
            disabled: false,
            row: Math.floor(index / 4),
            col: index % 4
        }));

        // Set initial positions
        const player1Start = this.gameState.board.find(t => t.value === this.terrainValues.PLAYER1_START);
        const player2Start = this.gameState.board.find(t => t.value === this.terrainValues.PLAYER2_START);

        this.gameState.players[1].position = player1Start.id;
        this.gameState.players[2].position = player2Start.id;

        // Randomly decide who starts
        this.gameState.currentPlayer = Math.random() < 0.5 ? 1 : 2;

        this.renderBoard();
    }

    renderBoard() {
        const boardContainer = document.getElementById('game-board');
        boardContainer.innerHTML = '';

        this.gameState.board.forEach(terrain => {
            const terrainElement = document.createElement('div');
            terrainElement.className = 'terrain';
            terrainElement.id = `terrain-${terrain.id}`;

            // Add value classes
            if (terrain.value === this.terrainValues.PLAYER1_START) {
                terrainElement.classList.add('player1-start');
                terrainElement.textContent = '🟩';
            } else if (terrain.value === this.terrainValues.PLAYER2_START) {
                terrainElement.classList.add('player2-start');
                terrainElement.textContent = '🟧';
            } else {
                terrainElement.classList.add(`value-${terrain.value}`);
                terrainElement.textContent = terrain.value;
            }

            if (terrain.disabled) {
                terrainElement.classList.add('disabled');
            }

            // Add click listener
            terrainElement.addEventListener('click', () => this.handleTerrainClick(terrain.id));

            boardContainer.appendChild(terrainElement);
        });

        // Add sheep
        this.renderSheep();
    }

    renderSheep() {
        // Remove existing sheep
        document.querySelectorAll('.sheep').forEach(sheep => sheep.remove());

        // Add current sheep positions
        Object.entries(this.gameState.players).forEach(([playerId, player]) => {
            if (player.position !== null) {
                const terrainElement = document.getElementById(`terrain-${player.position}`);
                const sheepElement = document.createElement('div');
                sheepElement.className = `sheep ${playerId === '1' ? 'white' : 'black'}`;
                terrainElement.appendChild(sheepElement);
            }
        });
    }

    handleTerrainClick(terrainId) {
        if (this.gameState.gameOver) return;

        const terrain = this.gameState.board[terrainId];
        if (terrain.disabled) return;

        const currentPlayerData = this.gameState.players[this.gameState.currentPlayer];
        const possibleMoves = this.getPossibleMoves(currentPlayerData.position, this.gameState.currentPlayer);

        if (possibleMoves.includes(terrainId)) {
            this.makeMove(terrainId);
        }
    }

    getPossibleMoves(fromPosition, playerId) {
        if (fromPosition === null) return [];

        const player = this.gameState.players[playerId];
        const fromTerrain = this.gameState.board[fromPosition];

        let maxMoves;
        if (player.isFirstMove) {
            maxMoves = 4;
        } else {
            maxMoves = typeof fromTerrain.value === 'number' ? fromTerrain.value : 0;
        }

        if (maxMoves === 0) return [];

        const possibleMoves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],  // Up-left, Up, Up-right
            [0, -1], [0, 1],   // Left, Right
            [1, -1], [1, 0], [1, 1]    // Down-left, Down, Down-right
        ];

        for (let moves = 1; moves <= maxMoves; moves++) {
            for (const [dRow, dCol] of directions) {
                const targetPosition = this.getPositionWithWrapping(fromPosition, dRow * moves, dCol * moves);

                if (targetPosition !== null && this.isValidMove(targetPosition, playerId)) {
                    possibleMoves.push(targetPosition);
                }
            }
        }

        return possibleMoves;
    }

    getPositionWithWrapping(fromPosition, dRow, dCol) {
        const fromRow = Math.floor(fromPosition / 4);
        const fromCol = fromPosition % 4;

        let targetRow = (fromRow + dRow) % 4;
        let targetCol = (fromCol + dCol) % 4;

        // Handle negative wrapping
        if (targetRow < 0) targetRow += 4;
        if (targetCol < 0) targetCol += 4;

        return targetRow * 4 + targetCol;
    }

    isValidMove(targetPosition, playerId) {
        const targetTerrain = this.gameState.board[targetPosition];

        // Can't move to disabled terrain
        if (targetTerrain.disabled) return false;

        // Can't move to position occupied by other player
        const otherPlayerId = playerId === 1 ? 2 : 1;
        if (this.gameState.players[otherPlayerId].position === targetPosition) return false;

        return true;
    }

    makeMove(targetPosition) {
        const currentPlayer = this.gameState.currentPlayer;
        const currentPlayerData = this.gameState.players[currentPlayer];

        // Disable the previous position
        if (currentPlayerData.position !== null) {
            this.gameState.board[currentPlayerData.position].disabled = true;
        }

        // Move player to new position
        currentPlayerData.position = targetPosition;
        currentPlayerData.isFirstMove = false;

        // Clear possible move highlights
        this.clearPossibleMoves();

        // Re-render board
        this.renderBoard();

        // Check if game is over
        if (this.checkGameOver()) {
            this.endGame();
            return;
        }

        // Switch turn
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.updateUI();
        this.highlightPossibleMoves();
    }

    checkGameOver() {
        const nextPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        const nextPlayerData = this.gameState.players[nextPlayer];
        const possibleMoves = this.getPossibleMoves(nextPlayerData.position, nextPlayer);

        if (possibleMoves.length === 0) {
            this.gameState.winner = this.gameState.currentPlayer;
            return true;
        }

        return false;
    }

    endGame() {
        this.gameState.gameOver = true;
        this.clearPossibleMoves();

        setTimeout(() => {
            document.getElementById('winner-text').textContent = `Jogador ${this.gameState.winner} Venceu!`;
            document.getElementById('game-over-reason').textContent = 'O oponente não pode mais se mover';
            this.showScreen('game-over-screen');
        }, 1000);
    }

    highlightPossibleMoves() {
        this.clearPossibleMoves();

        if (this.gameState.gameOver) return;

        const currentPlayerData = this.gameState.players[this.gameState.currentPlayer];
        const possibleMoves = this.getPossibleMoves(currentPlayerData.position, this.gameState.currentPlayer);

        possibleMoves.forEach(position => {
            const terrainElement = document.getElementById(`terrain-${position}`);
            if (terrainElement) {
                terrainElement.classList.add('possible');
            }
        });
    }

    clearPossibleMoves() {
        document.querySelectorAll('.terrain.possible').forEach(terrain => {
            terrain.classList.remove('possible');
        });
    }

    updateUI() {
        const currentTurnElement = document.getElementById('current-turn');
        const movesCountElement = document.getElementById('moves-count');

        currentTurnElement.textContent = `Vez do Jogador ${this.gameState.currentPlayer}`;

        const currentPlayerData = this.gameState.players[this.gameState.currentPlayer];
        if (currentPlayerData.position !== null) {
            const currentTerrain = this.gameState.board[currentPlayerData.position];
            let availableMoves;

            if (currentPlayerData.isFirstMove) {
                availableMoves = 4;
            } else {
                availableMoves = typeof currentTerrain.value === 'number' ? currentTerrain.value : 0;
            }

            movesCountElement.textContent = `Movimentos: ${availableMoves}`;
        }

        // Update player indicators
        document.querySelectorAll('.player').forEach(player => {
            player.classList.remove('active');
        });
        document.querySelector(`.player${this.gameState.currentPlayer}`).classList.add('active');
    }

    leaveGame() {
        if (confirm('Tem certeza que deseja sair do jogo?')) {
            this.showMenuScreen();
        }
    }

    newGame() {
        this.resetGame();
        this.showCreateScreen();
    }

    resetGame() {
        this.gameState = {
            currentScreen: 'menu',
            gameCode: '',
            currentPlayer: 1,
            players: {
                1: { position: null, isFirstMove: true },
                2: { position: null, isFirstMove: true }
            },
            board: [],
            gameStarted: false,
            gameOver: false,
            winner: null
        };
        this.clearPossibleMoves();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MobiLambGame();

    // Auto-highlight possible moves when game starts
    const originalStartGame = game.startGame.bind(game);
    game.startGame = function () {
        originalStartGame();
        setTimeout(() => {
            this.highlightPossibleMoves();
        }, 500);
    };

    // Add some visual feedback for the active player
    const originalUpdateUI = game.updateUI.bind(game);
    game.updateUI = function () {
        originalUpdateUI();

        // Add glow effect to current player's sheep
        document.querySelectorAll('.sheep').forEach(sheep => {
            sheep.style.filter = 'none';
        });

        const currentPlayerPosition = this.gameState.players[this.gameState.currentPlayer].position;
        if (currentPlayerPosition !== null) {
            const currentSheep = document.querySelector(`#terrain-${currentPlayerPosition} .sheep`);
            if (currentSheep) {
                currentSheep.style.filter = 'drop-shadow(0 0 10px gold)';
            }
        }
    };
});