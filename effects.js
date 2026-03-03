// Demo-style visual effects for Butterfly Survivors

class DemoEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.time = 0;
        this.shake = { x: 0, y: 0, intensity: 0 };

        // Starfield
        this.stars = [];
        this.initStarfield();

        // Plasma effect
        this.plasmaData = [];
        this.initPlasma();
    }

    initStarfield() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 3,
                speed: 0.2 + Math.random() * 0.5
            });
        }
    }

    initPlasma() {
        // Precompute plasma lookup table for performance
        const size = 256;
        for (let i = 0; i < size; i++) {
            this.plasmaData[i] = [];
            for (let j = 0; j < size; j++) {
                const value =
                    Math.sin(i / 16.0) +
                    Math.sin(j / 8.0) +
                    Math.sin((i + j) / 16.0) +
                    Math.sin(Math.sqrt(i * i + j * j) / 8.0);
                this.plasmaData[i][j] = value;
            }
        }
    }

    update() {
        this.time += 0.016; // ~60fps

        // Update shake
        if (this.shake.intensity > 0) {
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.intensity *= 0.9;
            if (this.shake.intensity < 0.1) {
                this.shake.intensity = 0;
                this.shake.x = 0;
                this.shake.y = 0;
            }
        }

        // Update starfield
        this.stars.forEach(star => {
            star.y += star.speed * (1 + star.z);
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }

    renderPlasmaBackground(ctx) {
        const imageData = ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;

        const time = this.time * 50;

        for (let y = 0; y < this.canvas.height; y += 2) {
            for (let x = 0; x < this.canvas.width; x += 2) {
                // Sample plasma with time offset
                const px = (x + time) % 256;
                const py = y % 256;
                const value = this.plasmaData[Math.floor(px)][Math.floor(py)];

                // Map to colors (purple/blue/pink palette)
                const color = Math.floor((value + 4) * 32);
                const r = Math.max(0, Math.min(255, 80 + Math.sin(color * 0.02) * 60));
                const g = Math.max(0, Math.min(255, 20 + Math.sin(color * 0.03) * 40));
                const b = Math.max(0, Math.min(255, 100 + Math.sin(color * 0.05) * 80));

                // Write 2x2 blocks for performance
                for (let dy = 0; dy < 2 && y + dy < this.canvas.height; dy++) {
                    for (let dx = 0; dx < 2 && x + dx < this.canvas.width; dx++) {
                        const idx = ((y + dy) * this.canvas.width + (x + dx)) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                        data[idx + 3] = 100; // Semi-transparent
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    renderStarfield(ctx) {
        ctx.save();
        this.stars.forEach(star => {
            const size = 1 + star.z;
            const brightness = 0.3 + star.z * 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fillRect(star.x, star.y, size, size);

            // Add glow for larger stars
            if (star.z > 2) {
                ctx.fillStyle = `rgba(0, 255, 255, ${brightness * 0.3})`;
                ctx.fillRect(star.x - 1, star.y - 1, size + 2, size + 2);
            }
        });
        ctx.restore();
    }

    renderScanlines(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#000';

        for (let y = 0; y < this.canvas.height; y += 2) {
            ctx.fillRect(0, y, this.canvas.width, 1);
        }

        ctx.restore();
    }

    renderVignette(ctx) {
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    applyScreenShake(intensity = 10) {
        this.shake.intensity = intensity;
    }

    getShakeOffset() {
        return { x: this.shake.x, y: this.shake.y };
    }
}

// Sprite animation system
class AnimatedSprite {
    constructor(imageSrc, frameWidth, frameHeight, frameCount, fps = 10) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.currentFrame = 0;
        this.fps = fps;
        this.frameTimer = 0;
        this.frameDelay = 1000 / fps;
    }

    update(deltaTime) {
        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }

    draw(ctx, x, y, width, height) {
        if (!this.image.complete) return;

        const frameX = this.currentFrame * this.frameWidth;

        ctx.drawImage(
            this.image,
            frameX, 0,
            this.frameWidth, this.frameHeight,
            x - width / 2, y - height / 2,
            width, height
        );
    }
}

// Enhanced particle effects
class EnhancedParticle {
    constructor(x, y, type = 'sparkle') {
        this.x = x;
        this.y = y;
        this.type = type;

        if (type === 'sparkle') {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.life = 1.0;
            this.size = 2 + Math.random() * 3;
            this.color = ['#FFD700', '#FF69B4', '#00FFFF', '#FF00FF'][Math.floor(Math.random() * 4)];
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        } else if (type === 'trail') {
            this.vx = 0;
            this.vy = 0;
            this.life = 0.5;
            this.size = 3;
            this.color = '#FFD700';
        } else if (type === 'explosion') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1.0;
            this.size = 3 + Math.random() * 5;
            this.color = ['#FF0040', '#FF00FF', '#FFD700'][Math.floor(Math.random() * 3)];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= 0.02;
        this.rotation += this.rotationSpeed;

        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw as a diamond/star shape
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2);
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
