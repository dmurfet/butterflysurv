// Weapon system for Butterfly Survivors

class Weapon {
    constructor(name, attackSpeed, damage) {
        this.name = name;
        this.attackSpeed = attackSpeed; // milliseconds between attacks
        this.damage = damage;
        this.lastAttack = 0;
        this.projectileCount = 1;
    }

    canAttack(currentTime) {
        return currentTime - this.lastAttack >= this.attackSpeed;
    }

    attack(player, enemies, particles, currentTime) {
        if (!this.canAttack(currentTime)) return;

        const nearestEnemies = this.findNearestEnemies(player, enemies, this.projectileCount);
        nearestEnemies.forEach(enemy => {
            this.shootAt(player.x, player.y, enemy.x, enemy.y, particles);
        });

        this.lastAttack = currentTime;
        if (this.sfxName) AudioManager.play(this.sfxName);
    }

    findNearestEnemies(player, enemies, count) {
        // Sort enemies by distance and return closest ones
        const sorted = enemies.slice().sort((a, b) => {
            const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        });

        return sorted.slice(0, count);
    }

    shootAt(x, y, targetX, targetY, particles) {
        particles.shootProjectile(x, y, targetX, targetY, this.damage);
    }
}

class PollenShot extends Weapon {
    constructor() {
        super('Pollen Shot', 800, 15); // Faster attack (800ms) and more damage (15)
        this.sfxName = 'pollenShot';
    }
}

class SparkleBurst extends Weapon {
    constructor() {
        super('Sparkle Burst', 1500, 15);
        this.projectileCount = 3;
        this.sfxName = 'sparkleBurst';
    }
}

class WingBlade extends Weapon {
    constructor() {
        super('Wing Blade', 800, 8);
        this.angle = 0;
        this.radius = 50;
        this.bladeCount = 1; // Number of rotating blades
    }

    attack(player, enemies, particles, currentTime) {
        // Rotating blade doesn't use projectiles, handled differently
        this.angle += 0.1;

        // Play whoosh sound once per full rotation
        if (!this._lastSoundAngle || this.angle - this._lastSoundAngle >= Math.PI * 2) {
            AudioManager.play('wingBlade');
            this._lastSoundAngle = this.angle;
        }

        // Check collision with enemies for each blade
        for (let i = 0; i < this.bladeCount; i++) {
            const offsetAngle = this.angle + (i * Math.PI * 2 / this.bladeCount);
            const bladeX = player.x + Math.cos(offsetAngle) * this.radius;
            const bladeY = player.y + Math.sin(offsetAngle) * this.radius;

            enemies.forEach(enemy => {
                const dist = Math.sqrt((enemy.x - bladeX) ** 2 + (enemy.y - bladeY) ** 2);
                if (dist < 15) {
                    enemy.takeDamage(this.damage * 0.05); // Continuous damage
                }
            });
        }
    }

    addBlade() {
        this.bladeCount++;
    }

    render(ctx, player) {
        // Draw all rotating blades
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';

        for (let i = 0; i < this.bladeCount; i++) {
            const offsetAngle = this.angle + (i * Math.PI * 2 / this.bladeCount);
            const x = player.x + Math.cos(offsetAngle) * this.radius;
            const y = player.y + Math.sin(offsetAngle) * this.radius;

            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
