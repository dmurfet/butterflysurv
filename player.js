// Player class for Butterfly Survivors

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 2; // Reduced from 3 to 2
        this.xp = 0;
        this.level = 1;
        this.kills = 0;
        this.size = 32;

        // XP thresholds for leveling up (reduced for faster progression)
        this.xpThresholds = [50, 120, 220, 350, 500, 680, 900, 1150, 1450, 1800];

        // Weapons
        this.weapons = [new PollenShot()];

        // Load butterfly image
        this.image = new Image();
        this.image.src = 'assets/butterfly.png';

        // Movement
        this.vx = 0;
        this.vy = 0;

        // Invulnerability frames after taking damage
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 60; // frames

        // Pickup range
        this.pickupRange = 100;

        // Animation
        this.animationTime = 0;
        this.rotation = 0;
        this.scale = 1;
    }

    update(keys, canvasWidth, canvasHeight) {
        this.animationTime += 0.1;
        // Movement
        this.vx = 0;
        this.vy = 0;

        if (keys['w'] || keys['ArrowUp']) this.vy -= 1;
        if (keys['s'] || keys['ArrowDown']) this.vy += 1;
        if (keys['a'] || keys['ArrowLeft']) this.vx -= 1;
        if (keys['d'] || keys['ArrowRight']) this.vx += 1;

        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707;
            this.vy *= 0.707;
        }

        // Apply movement
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Keep within bounds
        const halfSize = this.size / 2;
        this.x = Math.max(halfSize, Math.min(canvasWidth - halfSize, this.x));
        this.y = Math.max(halfSize, Math.min(canvasHeight - halfSize, this.y));

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    attackEnemies(enemies, particles, currentTime) {
        this.weapons.forEach(weapon => {
            weapon.attack(this, enemies, particles, currentTime);
        });
    }

    takeDamage(amount) {
        if (this.invulnerable) return false;

        this.health -= amount;
        this.invulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;

        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }

        return false;
    }

    gainXP(amount, particles) {
        this.xp += amount;

        // Check for level up
        const threshold = this.getXPThreshold();
        if (this.xp >= threshold) {
            this.levelUp(particles);
            return true; // Leveled up
        }

        return false;
    }

    levelUp(particles) {
        this.level++;
        this.xp = 0; // Reset XP for next level

        // Particle effect
        particles.emit(this.x, this.y, 20, 'hit');
    }

    getXPThreshold() {
        if (this.level - 1 < this.xpThresholds.length) {
            return this.xpThresholds[this.level - 1];
        }
        // For levels beyond predefined thresholds
        return this.xpThresholds[this.xpThresholds.length - 1] + (this.level - this.xpThresholds.length) * 500;
    }

    collectXP(particles) {
        // Collect nearby XP particles
        particles.particles = particles.particles.filter(p => {
            if (p.type === 'xp') {
                const dx = this.x - p.x;
                const dy = this.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 20) {
                    // Collected!
                    return false;
                }
            }
            return true;
        });
    }

    render(ctx) {
        ctx.save();

        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Move to player position
        ctx.translate(this.x, this.y);

        // Rotation based on movement direction
        if (this.vx !== 0 || this.vy !== 0) {
            const targetRotation = Math.atan2(this.vy, this.vx);
            this.rotation = targetRotation + Math.PI / 2; // Adjust for sprite orientation
        }
        ctx.rotate(this.rotation);

        // Bobbing animation (floating effect)
        const bob = Math.sin(this.animationTime) * 2;

        // Wing flapping (scale oscillation)
        const flap = Math.sin(this.animationTime * 2) * 0.1 + 1;
        const scaleX = this.scale * flap;
        const scaleY = this.scale * (2 - flap); // Inverse for wing effect

        // Draw butterfly image or fallback
        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                -this.size / 2,
                -this.size / 2 + bob,
                this.size * scaleX,
                this.size * scaleY
            );

            // Add glow effect
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700';
            ctx.drawImage(
                this.image,
                -this.size / 2,
                -this.size / 2 + bob,
                this.size * scaleX,
                this.size * scaleY
            );
        } else {
            // Fallback: draw colored circle with animation
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, bob, this.size / 2 * flap, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Render WingBlade if player has it
        this.weapons.forEach(weapon => {
            if (weapon instanceof WingBlade) {
                weapon.render(ctx, this);
            }
        });
    }

    getCollisionRadius() {
        return this.size / 2;
    }

    addWeapon(weapon) {
        this.weapons.push(weapon);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        this.health += amount;
    }

    increaseSpeed(amount) {
        this.speed += amount;
    }

    increasePickupRange(amount) {
        this.pickupRange += amount;
    }
}
