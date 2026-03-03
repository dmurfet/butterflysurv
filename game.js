// Main game loop for Butterfly Survivors

const gameState = {
    canvas: null,
    ctx: null,
    player: null,
    enemies: [],
    particles: null,
    waveSpawner: null,
    demoEffects: null,
    enhancedParticles: [],
    isPaused: false,
    isGameOver: false,
    gameStarted: false,
    startTime: 0,
    gameTime: 0,
    keys: {},
    lastTime: 0,
    deltaTime: 0,
    animFrameId: null,
    highScore: parseInt(localStorage.getItem('bsHighScore') || '0', 10),
    highScoreBroken: false,
    speedBoostEnd: 0
};

// Initialize game
function init() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    gameState.demoEffects = new DemoEffects(gameState.canvas);

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
        togglePause();
        restartGame();
    });

    // Audio controls
    document.getElementById('muteBtn').addEventListener('click', () => {
        AudioManager.toggleMute();
        document.getElementById('muteBtn').textContent = AudioManager.isMuted() ? '🔇' : '🔊';
    });
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        AudioManager.setVolume(e.target.value / 100);
    });

    // Preload enemy images
    preloadEnemyImages(() => {
        console.log('Enemy images loaded');
    });

    // Start render loop (will show start screen)
    renderStartScreen();
}

function startGame() {
    // Hide all screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('upgradeScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');

    // Initialize game objects
    const canvasWidth = gameState.canvas.width;
    const canvasHeight = gameState.canvas.height;

    gameState.player = new Player(canvasWidth / 2, canvasHeight / 2);
    gameState.enemies = [];
    gameState.particles = new ParticleSystem();
    gameState.waveSpawner = new WaveSpawner(canvasWidth, canvasHeight);

    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.gameStarted = true;
    gameState.highScoreBroken = false;
    gameState.speedBoostEnd = 0;
    gameState.startTime = performance.now();
    gameState.lastTime = performance.now();

    // Initialize audio and start music
    AudioManager.init();
    AudioManager.play('gameStart');
    AudioManager.startMusic();

    // Sync UI with saved audio state
    document.getElementById('muteBtn').textContent = AudioManager.isMuted() ? '🔇' : '🔊';
    document.getElementById('volumeSlider').value = Math.round(AudioManager.volume * 100);

    // Cancel any existing game loop before starting a new one
    if (gameState.animFrameId) {
        cancelAnimationFrame(gameState.animFrameId);
    }

    // Start game loop
    gameState.animFrameId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    // Hide game over screen
    document.getElementById('gameOverScreen').classList.add('hidden');

    // Reset and start
    startGame();
}

function togglePause() {
    // Don't allow pause during upgrade screen
    if (!document.getElementById('upgradeScreen').classList.contains('hidden')) {
        return;
    }

    gameState.isPaused = !gameState.isPaused;
    AudioManager.play(gameState.isPaused ? 'pause' : 'resume');

    const pauseMenu = document.getElementById('pauseMenu');
    if (gameState.isPaused) {
        pauseMenu.classList.remove('hidden');
    } else {
        pauseMenu.classList.add('hidden');
    }
}

function handleKeyDown(e) {
    // Mute toggle
    if (e.key === 'm' || e.key === 'M') {
        AudioManager.toggleMute();
        document.getElementById('muteBtn').textContent = AudioManager.isMuted() ? '🔇' : '🔊';
        return;
    }

    // Handle pause
    if (e.key === 'Escape') {
        if (gameState.gameStarted && !gameState.isGameOver) {
            togglePause();
        }
        e.preventDefault();
        return;
    }

    gameState.keys[e.key] = true;

    // Prevent arrow keys from scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    gameState.keys[e.key] = false;
}

// Main game loop
function gameLoop(currentTime) {
    if (!gameState.gameStarted) return;

    gameState.deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;

    // Always update effects (even when paused for visual continuity)
    gameState.demoEffects.update();

    if (!gameState.isPaused && !gameState.isGameOver) {
        // Update game time
        gameState.gameTime = currentTime - gameState.startTime;

        // Check high score
        checkHighScore(currentTime);

        // Update speed boost
        if (gameState.speedBoostEnd > 0 && currentTime >= gameState.speedBoostEnd) {
            gameState.player.speed -= 1.5;
            gameState.speedBoostEnd = 0;
        }

        // Update game objects
        updateGame(currentTime);

        // Check collisions
        checkCollisions();

        // Collect XP
        collectXP();

        // Update enhanced particles
        gameState.enhancedParticles = gameState.enhancedParticles.filter(p => p.update());
    }

    // Render
    render();

    // Continue loop
    gameState.animFrameId = requestAnimationFrame(gameLoop);
}

function updateGame(currentTime) {
    const canvasWidth = gameState.canvas.width;
    const canvasHeight = gameState.canvas.height;

    // Update player
    gameState.player.update(gameState.keys, canvasWidth, canvasHeight);

    // Add trail particles when player is moving (reduced spawn rate)
    if (gameState.player.vx !== 0 || gameState.player.vy !== 0) {
        if (Math.random() < 0.1) { // Reduced from 0.3 to 0.1
            gameState.enhancedParticles.push(new EnhancedParticle(
                gameState.player.x + (Math.random() - 0.5) * 10,
                gameState.player.y + (Math.random() - 0.5) * 10,
                'trail'
            ));
        }
    }

    // Player attacks
    gameState.player.attackEnemies(gameState.enemies, gameState.particles, currentTime);

    // Update enemies
    gameState.enemies.forEach(enemy => {
        enemy.update(gameState.player.x, gameState.player.y);
    });

    // Update particles
    gameState.particles.update(gameState.player.x, gameState.player.y);

    // Update weapons (like WingBlade)
    gameState.player.weapons.forEach(weapon => {
        if (weapon instanceof WingBlade) {
            weapon.attack(gameState.player, gameState.enemies, gameState.particles, currentTime);
        }
    });

    // Spawn waves
    gameState.waveSpawner.update(currentTime, gameState.enemies);

    // Remove dead enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        if (enemy.dead) {
            AudioManager.play('enemyDeath');

            // Drop XP
            gameState.particles.emit(enemy.x, enemy.y, 3, 'xp');
            gameState.particles.emit(enemy.x, enemy.y, 5, 'death');

            // Enhanced explosion particles (reduced from 10 to 4)
            for (let i = 0; i < 4; i++) {
                gameState.enhancedParticles.push(new EnhancedParticle(enemy.x, enemy.y, 'explosion'));
            }

            gameState.player.kills++;
            return false;
        }
        return true;
    });
}

function checkCollisions() {
    // Projectile vs Enemy collisions
    gameState.particles.projectiles.forEach(projectile => {
        gameState.enemies.forEach(enemy => {
            if (enemy.dead) return;

            const dx = projectile.x - enemy.x;
            const dy = projectile.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.getCollisionRadius() + projectile.size) {
                // Hit!
                AudioManager.play('enemyHit');
                const died = enemy.takeDamage(projectile.damage);
                projectile.life = 0; // Destroy projectile

                // Hit effect
                gameState.particles.emit(enemy.x, enemy.y, 3, 'hit');

                // Enhanced sparkle effect on hit (reduced from 5 to 2)
                for (let i = 0; i < 2; i++) {
                    gameState.enhancedParticles.push(new EnhancedParticle(enemy.x, enemy.y, 'sparkle'));
                }
            }
        });
    });

    // Enemy vs Player collisions
    gameState.enemies.forEach(enemy => {
        if (enemy.dead) return;

        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < gameState.player.getCollisionRadius() + enemy.getCollisionRadius()) {
            // Player hit!
            AudioManager.play('playerDamage');
            const died = gameState.player.takeDamage(enemy.damage);

            if (died) {
                gameOver();
            } else {
                // Screen shake on damage
                gameState.demoEffects.applyScreenShake(8);
            }
        }
    });
}

function collectXP() {
    // Check XP particle collection
    let xpCollected = 0;

    gameState.particles.particles = gameState.particles.particles.filter(p => {
        if (p.type === 'xp') {
            const dx = gameState.player.x - p.x;
            const dy = gameState.player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                xpCollected += 15; // Increased from 5 to 15
                return false;
            }
        }
        return true;
    });

    if (xpCollected > 0) {
        AudioManager.play('xpCollect');
        const leveledUp = gameState.player.gainXP(xpCollected, gameState.particles);

        if (leveledUp) {
            AudioManager.play('levelUp');
            showUpgradeScreen();
        }
    }
}

function showUpgradeScreen() {
    gameState.isPaused = true;

    const upgradeScreen = document.getElementById('upgradeScreen');
    const upgradeChoices = document.getElementById('upgradeChoices');

    upgradeChoices.innerHTML = '';

    const choices = getRandomUpgrades(3);

    choices.forEach(upgrade => {
        const div = document.createElement('div');
        div.className = 'upgrade-choice';
        div.innerHTML = `
            <div class="upgrade-choice-title">${upgrade.icon} ${upgrade.name}</div>
            <div class="upgrade-choice-desc">${upgrade.description}</div>
        `;
        div.onclick = () => selectUpgrade(upgrade);
        upgradeChoices.appendChild(div);
    });

    upgradeScreen.classList.remove('hidden');
}

function selectUpgrade(upgrade) {
    AudioManager.play('upgradeSelect');

    // Apply upgrade
    upgrade.apply(gameState.player);

    // Hide upgrade screen
    document.getElementById('upgradeScreen').classList.add('hidden');

    // Resume game
    gameState.isPaused = false;
}

function checkHighScore(currentTime) {
    if (gameState.highScoreBroken) return;
    if (gameState.highScore <= 0) return;

    const timeMs = gameState.gameTime;

    // Just beat the high score
    if (timeMs >= gameState.highScore) {
        gameState.highScoreBroken = true;
        AudioManager.play('newHighScore');

        // Speed boost for 10 seconds
        gameState.player.speed += 1.5;
        gameState.speedBoostEnd = currentTime + 10000;

        // Burst of bullets in all directions
        const player = gameState.player;
        const burstCount = 16;
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const dist = 200;
            const targetX = player.x + Math.cos(angle) * dist;
            const targetY = player.y + Math.sin(angle) * dist;
            gameState.particles.shootProjectile(player.x, player.y, targetX, targetY, player.weapons[0].damage);
        }

        // Big particle celebration
        for (let i = 0; i < 15; i++) {
            gameState.enhancedParticles.push(new EnhancedParticle(player.x, player.y, 'explosion'));
        }

        gameState.demoEffects.applyScreenShake(12);
    }
}

function gameOver() {
    gameState.isGameOver = true;
    AudioManager.play('gameOver');
    AudioManager.stopMusic();

    // Update high score
    const timeMs = Math.floor(gameState.gameTime);
    const isNewBest = timeMs > gameState.highScore;
    if (isNewBest) {
        gameState.highScore = timeMs;
        localStorage.setItem('bsHighScore', timeMs);
    }

    // Show game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    document.getElementById('finalTime').textContent = formatTime(gameState.gameTime);
    document.getElementById('finalKills').textContent = gameState.player.kills;
    document.getElementById('finalLevel').textContent = gameState.player.level;
    document.getElementById('finalHighScore').textContent = isNewBest ? 'NEW BEST!' : formatTime(gameState.highScore);

    gameOverScreen.classList.remove('hidden');
}

function render() {
    const ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);

    // Layer 1: Clean gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, gameState.canvas.height);
    gradient.addColorStop(0, '#0a0014');
    gradient.addColorStop(0.5, '#1a0033');
    gradient.addColorStop(1, '#0a0014');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);

    if (!gameState.gameStarted) return;

    // Apply screen shake
    const shake = gameState.demoEffects.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Layer 4: Game objects with shake
    gameState.enemies.forEach(enemy => enemy.render(ctx));
    gameState.particles.render(ctx);

    // Enhanced particles
    gameState.enhancedParticles.forEach(p => p.render(ctx));

    gameState.player.render(ctx);

    ctx.restore();

    // Layer 5: Screen effects (no shake)
    gameState.demoEffects.renderScanlines(ctx);
    gameState.demoEffects.renderVignette(ctx);

    // Update UI
    updateUI();
}

function updateUI() {
    if (!gameState.player) return;

    // Health
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    document.getElementById('healthBar').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = `${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`;

    // XP
    const xpThreshold = gameState.player.getXPThreshold();
    const xpPercent = (gameState.player.xp / xpThreshold) * 100;
    document.getElementById('xpBar').style.width = xpPercent + '%';
    document.getElementById('xpText').textContent = `${gameState.player.xp}/${xpThreshold}`;

    // Level
    document.getElementById('levelText').textContent = gameState.player.level;

    // Time
    const timeEl = document.getElementById('timeText');
    timeEl.textContent = formatTime(gameState.gameTime);

    // High score indicator
    const hsEl = document.getElementById('highScoreText');
    if (gameState.highScore > 0) {
        hsEl.textContent = formatTime(gameState.highScore);
        const diff = gameState.highScore - gameState.gameTime;

        if (gameState.highScoreBroken) {
            timeEl.className = 'high-score-broken';
            hsEl.className = 'high-score-broken';
        } else if (diff <= 10000 && diff > 0) {
            // Within 10 seconds of high score — pulse
            timeEl.className = 'high-score-approaching';
            hsEl.className = '';
        } else {
            timeEl.className = '';
            hsEl.className = '';
        }
    } else {
        hsEl.textContent = '--:--';
    }

    // Kills
    document.getElementById('killsText').textContent = gameState.player.kills;
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function renderStartScreen() {
    const ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, gameState.canvas.height);
    gradient.addColorStop(0, '#0a0014');
    gradient.addColorStop(0.5, '#1a0033');
    gradient.addColorStop(1, '#0a0014');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
}

// Initialize when page loads
window.addEventListener('load', init);
