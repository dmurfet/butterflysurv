// Particle system for Butterfly Survivors

class Particle {
    constructor(x, y, type = 'default') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 2;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.pulsePhase = Math.random() * Math.PI * 2;

        // Type-specific properties
        if (type === 'xp') {
            this.size = 4;
            this.color = '#00FF41';
            this.targetPlayer = true;
            this.speed = 0;
        } else if (type === 'hit') {
            this.size = 3;
            this.color = '#FFD700';
            this.targetPlayer = false;
        } else if (type === 'death') {
            this.size = 5;
            this.color = '#FF0040';
            this.vy -= 1;
        } else {
            this.size = 3;
            this.color = '#FFD700';
        }
    }

    update(playerX, playerY) {
        this.pulsePhase += 0.15;

        if (this.type === 'xp' && this.targetPlayer) {
            // XP orbs move toward player
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) { // Pickup range
                this.speed = Math.min(this.speed + 0.5, 8);
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            }
        } else {
            // Regular particles
            this.vy += 0.1; // gravity
            this.life -= 0.02;
        }

        this.x += this.vx;
        this.y += this.vy;

        return this.life > 0;
    }

    render(ctx) {
        ctx.save();

        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;

        // Glow effect
        ctx.globalAlpha = this.life * 0.4;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Main particle
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Bright core for XP
        if (this.type === 'xp') {
            ctx.fillStyle = 'white';
            ctx.globalAlpha = this.life * 0.8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, targetX, targetY, damage = 10) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.size = 4;
        this.speed = 8;
        this.life = 1.0;
        this.trail = [];

        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;

        this.color = '#FFD700';
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
        // Store trail (reduced from 8 to 4 for performance)
        this.trail.push({ x: this.x, y: this.y, life: 1.0 });
        if (this.trail.length > 4) {
            this.trail.shift();
        }

        // Update trail life
        this.trail.forEach(t => t.life -= 0.15);

        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.01;
        this.pulsePhase += 0.2;
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();

        // Render trail
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = t.life * 0.5;
            ctx.fillStyle = this.color;
            const size = this.size * (i / this.trail.length);
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Render projectile with pulsing glow
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.projectiles = [];
    }

    emit(x, y, count = 10, type = 'default') {
        if (type === 'xp') {
            const xpCount = this.particles.filter(p => p.type === 'xp').length;
            count = Math.min(count, 40 - xpCount);
            if (count <= 0) return;
        }
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    shootProjectile(x, y, targetX, targetY, damage = 10) {
        this.projectiles.push(new Projectile(x, y, targetX, targetY, damage));
    }

    update(playerX = 0, playerY = 0) {
        this.particles = this.particles.filter(p => p.update(playerX, playerY));
        this.projectiles = this.projectiles.filter(p => p.update());
    }

    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
        this.projectiles.forEach(p => p.render(ctx));
    }

    clear() {
        this.particles = [];
        this.projectiles = [];
    }
}
