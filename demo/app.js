/* ===== WARBOT WEB DEMO - JavaScript ===== */

// ===== TAB SWITCHING =====
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// ===== START/STOP BUTTON =====
function initStartButton() {
    const btn = document.getElementById('btn-start');
    let isRunning = false;

    btn.addEventListener('click', () => {
        isRunning = !isRunning;
        if (isRunning) {
            btn.textContent = 'DURDUR';
            btn.classList.remove('off');
            btn.classList.add('on');
            document.getElementById('status-bar').textContent = '🟢 Bot Çalışıyor - NPC Kesiliyor...';
        } else {
            btn.textContent = 'BAŞLAT';
            btn.classList.remove('on');
            btn.classList.add('off');
            document.getElementById('status-bar').textContent = '⏸️ Bot Durduruldu';
        }
    });
}

// ===== CONFIG TOGGLE =====
function initConfigToggle() {
    const btn = document.getElementById('config-toggle');
    let config = 1;

    btn.addEventListener('click', () => {
        config = config === 1 ? 2 : 1;
        btn.textContent = `Config ${config}`;
        btn.style.background = config === 1
            ? 'linear-gradient(135deg, #64c8ff, #3d8bff)'
            : 'linear-gradient(135deg, #ffc864, #ff9f43)';
    });
}

// ===== SLIDER VALUES =====
function initSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const valueDisplay = slider.parentElement.querySelector('.value');
        if (valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = `%${slider.value}`;
            });
        }
    });
}

// ===== RADAR ANIMATION =====
class RadarDemo {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Map size
        this.mapW = 21000;
        this.mapH = 13500;

        // Hero position
        this.heroX = 10500;
        this.heroY = 6750;
        this.heroTargetX = 10500;
        this.heroTargetY = 6750;

        // Trail
        this.trail = [];
        this.maxTrail = 30;

        // Objects
        this.objects = [];
        this.generateObjects();

        // Target
        this.lockedTarget = null;
        this.destination = null;

        // Animation
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 200;
    }

    generateObjects() {
        // NPCs
        for (let i = 0; i < 8; i++) {
            this.objects.push({
                type: 'NPC',
                x: 2000 + Math.random() * 17000,
                y: 2000 + Math.random() * 9500,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                hp: Math.random() * 0.7 + 0.3,
                shield: Math.random(),
                name: ['Hydro', 'Jenta', 'Mali', 'Plarion', 'Bangoliour'][Math.floor(Math.random() * 5)]
            });
        }

        // Boxes
        for (let i = 0; i < 6; i++) {
            this.objects.push({
                type: 'BONUS',
                x: 1000 + Math.random() * 19000,
                y: 1000 + Math.random() * 11500
            });
        }

        // Portals
        const portals = [
            { x: 1500, y: 6750 },
            { x: 19500, y: 6750 },
            { x: 10500, y: 1500 },
            { x: 10500, y: 12000 }
        ];
        portals.forEach(p => {
            this.objects.push({ type: 'PORTAL', x: p.x, y: p.y });
        });

        // Enemies
        this.objects.push({
            type: 'ENEMY',
            x: 15000 + Math.random() * 3000,
            y: 3000 + Math.random() * 3000,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20
        });

        // Allies
        this.objects.push({
            type: 'ALLY',
            x: 5000 + Math.random() * 3000,
            y: 8000 + Math.random() * 2000
        });

        // Base
        this.objects.push({ type: 'BASE', x: 1000, y: 12000 });
    }

    update() {
        // Move hero towards target
        const dx = this.heroTargetX - this.heroX;
        const dy = this.heroTargetY - this.heroY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 50) {
            this.heroX += dx * 0.02;
            this.heroY += dy * 0.02;

            // Update trail
            this.trail.push({ x: this.heroX, y: this.heroY });
            if (this.trail.length > this.maxTrail) {
                this.trail.shift();
            }
        } else {
            // Pick new target
            this.pickNewTarget();
        }

        // Move NPCs
        this.objects.forEach(obj => {
            if (obj.type === 'NPC' || obj.type === 'ENEMY') {
                obj.x += obj.vx || 0;
                obj.y += obj.vy || 0;

                // Bounce
                if (obj.x < 500 || obj.x > 20500) obj.vx = -(obj.vx || 0);
                if (obj.y < 500 || obj.y > 13000) obj.vy = -(obj.vy || 0);
            }
        });

        // Find closest NPC for target HUD
        let closest = null;
        let closestDist = Infinity;
        this.objects.forEach(obj => {
            if (obj.type === 'NPC') {
                const d = Math.sqrt(Math.pow(obj.x - this.heroX, 2) + Math.pow(obj.y - this.heroY, 2));
                if (d < closestDist && d < 3000) {
                    closest = obj;
                    closestDist = d;
                }
            }
        });
        this.lockedTarget = closest;
    }

    pickNewTarget() {
        // Go to closest NPC or random position
        const npcs = this.objects.filter(o => o.type === 'NPC');
        if (npcs.length > 0 && Math.random() > 0.3) {
            const npc = npcs[Math.floor(Math.random() * npcs.length)];
            this.heroTargetX = npc.x;
            this.heroTargetY = npc.y;
            this.destination = { x: npc.x, y: npc.y };
        } else {
            this.heroTargetX = 2000 + Math.random() * 17000;
            this.heroTargetY = 2000 + Math.random() * 9500;
            this.destination = { x: this.heroTargetX, y: this.heroTargetY };
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const scaleX = w / this.mapW;
        const scaleY = h / this.mapH;

        // Background
        ctx.fillStyle = '#14151a';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#2a2d38';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(w * i / 4, 0);
            ctx.lineTo(w * i / 4, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, h * i / 4);
            ctx.lineTo(w, h * i / 4);
            ctx.stroke();
        }

        // Trail
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = 50 + (i * 200 / this.trail.length);
                ctx.strokeStyle = `rgba(255, 200, 0, ${Math.min(255, alpha) / 255})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x * scaleX, h - this.trail[i - 1].y * scaleY);
                ctx.lineTo(this.trail[i].x * scaleX, h - this.trail[i].y * scaleY);
                ctx.stroke();
            }
        }

        // Destination line
        if (this.destination) {
            const hx = this.heroX * scaleX;
            const hy = h - this.heroY * scaleY;
            const dx = this.destination.x * scaleX;
            const dy = h - this.destination.y * scaleY;

            ctx.strokeStyle = 'rgba(150, 150, 150, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(dx, dy);
            ctx.stroke();

            // Cross at destination
            ctx.strokeStyle = '#aaa';
            ctx.beginPath();
            ctx.moveTo(dx - 4, dy);
            ctx.lineTo(dx + 4, dy);
            ctx.moveTo(dx, dy - 4);
            ctx.lineTo(dx, dy + 4);
            ctx.stroke();
        }

        // Objects
        this.objects.forEach(obj => {
            const rx = obj.x * scaleX;
            const ry = h - obj.y * scaleY;

            ctx.beginPath();

            switch (obj.type) {
                case 'NPC':
                    ctx.fillStyle = '#ff3d3d';
                    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'ENEMY':
                    ctx.fillStyle = '#b44dff';
                    ctx.fillRect(rx - 3, ry - 3, 7, 7);
                    break;

                case 'ALLY':
                    ctx.fillStyle = '#3d8bff';
                    ctx.fillRect(rx - 2, ry - 2, 5, 5);
                    break;

                case 'BONUS':
                    ctx.fillStyle = '#ffd700';
                    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'PORTAL':
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1.5;
                    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
                    ctx.stroke();
                    break;

                case 'BASE':
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(rx - 4, ry - 4, 8, 8);
                    break;
            }
        });

        // Hero
        const hx = this.heroX * scaleX;
        const hy = h - this.heroY * scaleY;

        // Range circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hx, hy, 2000 * scaleX, 0, Math.PI * 2);
        ctx.stroke();

        // Hero dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Map info
        ctx.fillStyle = '#555';
        ctx.font = '9px Consolas';
        ctx.fillText(`Map: ${this.mapW}x${this.mapH}`, w - 85, 12);

        // Target HUD
        if (this.lockedTarget) {
            this.renderTargetHUD(ctx, w, h);
        }
    }

    renderTargetHUD(ctx, w, h) {
        const t = this.lockedTarget;
        const hudX = 8;
        const hudY = h - 40;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(hudX, hudY, 170, 35);

        // Name
        ctx.fillStyle = '#ff3d3d';
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillText(t.name, hudX + 5, hudY + 12);

        // HP Bar
        const barX = hudX + 70;
        const barW = 80;

        ctx.fillStyle = '#3c1414';
        ctx.fillRect(barX, hudY + 3, barW, 10);
        ctx.fillStyle = t.hp > 0.5 ? '#00c853' : (t.hp > 0.25 ? '#ff9f43' : '#ff3d3d');
        ctx.fillRect(barX, hudY + 3, barW * t.hp, 10);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Segoe UI';
        ctx.fillText(`${Math.floor(t.hp * 100)}%`, barX + barW / 2 - 10, hudY + 11);

        // Shield Bar
        ctx.fillStyle = '#141e3c';
        ctx.fillRect(barX, hudY + 16, barW, 10);
        ctx.fillStyle = '#3d8bff';
        ctx.fillRect(barX, hudY + 16, barW * t.shield, 10);

        ctx.fillText(`${Math.floor(t.shield * 100)}%`, barX + barW / 2 - 10, hudY + 24);
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// ===== HP/SHIELD BAR ANIMATION =====
function animateBars() {
    const hpBar = document.getElementById('hp-bar');
    const shieldBar = document.getElementById('shield-bar');
    const hpValue = document.getElementById('hp-value');
    const shieldValue = document.getElementById('shield-value');

    let hp = 85;
    let shield = 72;
    const maxHp = 245000;
    const maxShield = 180000;

    setInterval(() => {
        // Fluctuate values slightly
        hp = Math.max(30, Math.min(100, hp + (Math.random() - 0.5) * 3));
        shield = Math.max(20, Math.min(100, shield + (Math.random() - 0.5) * 4));

        hpBar.style.width = `${hp}%`;
        shieldBar.style.width = `${shield}%`;

        // Update color based on HP
        hpBar.classList.remove('low', 'medium');
        if (hp < 25) hpBar.classList.add('low');
        else if (hp < 50) hpBar.classList.add('medium');

        const currentHp = Math.floor(maxHp * hp / 100);
        const currentShield = Math.floor(maxShield * shield / 100);

        hpValue.textContent = `${currentHp.toLocaleString('tr-TR')} / ${maxHp.toLocaleString('tr-TR')}`;
        shieldValue.textContent = `${currentShield.toLocaleString('tr-TR')} / ${maxShield.toLocaleString('tr-TR')}`;
    }, 1000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initStartButton();
    initConfigToggle();
    initSliders();
    animateBars();

    // Start radar
    new RadarDemo('radar-canvas');
});
