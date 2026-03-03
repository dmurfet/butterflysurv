// Enemy system for Butterfly Survivors

const ENEMY_TYPES = {
    ascii_A: {
        health: 20,
        speed: 1.0,
        damage: 5,
        xp: 10,
        size: 24,
        image: 'assets/enemies/ascii_A.png'
    },
    ascii_at: {
        health: 25,
        speed: 0.8,
        damage: 8,
        xp: 15,
        size: 24,
        image: 'assets/enemies/ascii_at.png'
    },
    ascii_hash: {
        health: 30,
        speed: 1.2,
        damage: 10,
        xp: 20,
        size: 24,
        image: 'assets/enemies/ascii_hash.png'
    },
    ascii_dollar: {
        health: 35,
        speed: 0.7,
        damage: 7,
        xp: 25,
        size: 24,
        image: 'assets/enemies/ascii_dollar.png'
    },
    ascii_percent: {
        health: 40,
        speed: 1.1,
        damage: 12,
        xp: 30,
        size: 24,
        image: 'assets/enemies/ascii_percent.png'
    }
};

// Preload enemy images
const enemyImages = {};
function preloadEnemyImages(callback) {
    const types = Object.keys(ENEMY_TYPES);
    let loaded = 0;

    types.forEach(type => {
        const img = new Image();
        img.onload = () => {
            loaded++;
            if (loaded === types.length) {
                callback();
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load enemy image: ${ENEMY_TYPES[type].image}`);
            loaded++;
            if (loaded === types.length) {
                callback();
            }
        };
        img.src = ENEMY_TYPES[type].image;
        enemyImages[type] = img;
    });
}

class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        const stats = ENEMY_TYPES[type];
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.xpValue = stats.xp;
        this.size = stats.size;
        this.image = enemyImages[type];

        this.dead = false;
        this.flashTimer = 0;

        // Animation
        this.animationTime = Math.random() * Math.PI * 2; // Random start phase
        this.rotationSpeed = 0.02 + Math.random() * 0.02;
        this.rotation = 0;
    }

    update(playerX, playerY) {
        if (this.dead) return;

        this.animationTime += 0.1;
        this.rotation += this.rotationSpeed;

        // Move toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        // Decrease flash timer
        if (this.flashTimer > 0) {
            this.flashTimer--;
        }
    }

    takeDamage(amount) {
        if (this.dead) return false;

        this.health -= amount;
        this.flashTimer = 5; // Flash white for 5 frames

        if (this.health <= 0) {
            this.dead = true;
            return true; // Enemy died
        }

        return false;
    }

    render(ctx) {
        if (this.dead) return;

        ctx.save();

        // Move to enemy position
        ctx.translate(this.x, this.y);

        // Pulsing scale animation
        const pulse = Math.sin(this.animationTime) * 0.1 + 1;

        // Rotation
        ctx.rotate(this.rotation);

        // Flash white when hit
        if (this.flashTimer > 0) {
            ctx.filter = 'brightness(2)';
        }

        // Glow effect based on health
        const glowIntensity = (this.maxHealth - this.health) / this.maxHealth;
        if (glowIntensity > 0) {
            ctx.shadowBlur = 15 + glowIntensity * 10;
            ctx.shadowColor = '#FF0040';
        }

        // Draw enemy image or fallback
        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                -this.size / 2 * pulse,
                -this.size / 2 * pulse,
                this.size * pulse,
                this.size * pulse
            );
        } else {
            // Fallback: draw colored circle with animation
            ctx.fillStyle = '#FF0040';
            ctx.beginPath();
            ctx.arc(0, 0, (this.size / 2) * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar (drawn separately to avoid rotation)
        if (this.health < this.maxHealth) {
            ctx.save();
            const barWidth = this.size;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size / 2 - 8;

            // Background
            ctx.fillStyle = 'rgba(255, 0, 64, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#FF0040';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.restore();
        }
    }

    getCollisionRadius() {
        return this.size / 2;
    }
}

// Wave spawner
class WaveSpawner {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.waveNumber = 1;
        this.spawnInterval = 3000; // ms (increased from 2000 for slower start)
        this.lastSpawn = 0;
        this.enemyTypes = Object.keys(ENEMY_TYPES);
    }

    update(currentTime, enemies) {
        if (currentTime - this.lastSpawn >= this.spawnInterval) {
            this.spawnWave(enemies);
            this.lastSpawn = currentTime;
            this.waveNumber++;

            // Increase difficulty (slower ramp)
            this.spawnInterval = Math.max(800, this.spawnInterval - 30);
        }
    }

    spawnWave(enemies) {
        const count = 2 + Math.floor(this.waveNumber / 3); // Reduced from 3 + floor(wave/2)

        for (let i = 0; i < count; i++) {
            const type = this.getRandomEnemyType();
            const pos = this.getRandomSpawnPosition();
            enemies.push(new Enemy(type, pos.x, pos.y));
        }
    }

    getRandomEnemyType() {
        // Later waves can spawn harder enemies
        const maxIndex = Math.min(this.enemyTypes.length, Math.floor(this.waveNumber / 3) + 1);
        const index = Math.floor(Math.random() * maxIndex);
        return this.enemyTypes[index];
    }

    getRandomSpawnPosition() {
        // Spawn outside screen edges
        const margin = 50;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
            case 0: // Top
                return { x: Math.random() * this.canvasWidth, y: -margin };
            case 1: // Right
                return { x: this.canvasWidth + margin, y: Math.random() * this.canvasHeight };
            case 2: // Bottom
                return { x: Math.random() * this.canvasWidth, y: this.canvasHeight + margin };
            case 3: // Left
                return { x: -margin, y: Math.random() * this.canvasHeight };
        }
    }
}
