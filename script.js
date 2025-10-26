// Constantes físicas y parámetros
const PLANCK_LENGTH = 1.616e-35; // metros
const IMMIRZI = 0.2375;
const TWO_PI = Math.PI * 2;

// Variables globales
let canvasQuantum, ctxQuantum;
let canvasSemi, ctxSemi;
let nodes = [];
let edges = [];
let isPlaying = false;
let animationSpeed = 1;
let quantumDensity = 15;
let time = 0;
let animationId = null;
let hbarEffective = 1.0;
let currentMode = 'quantum'; // quantum or semiclassical

// Clase Nodo (con valency para intertwiners)
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 5;
        this.quantum = Math.random() * 2 + 0.5;
        this.valency = 0; // Número de conexiones
    }

    update(width, height) {
        this.x += this.vx * animationSpeed * hbarEffective;
        this.y += this.vy * animationSpeed * hbarEffective;

        if (this.x < 20 || this.x > width - 20) {
            this.vx *= -0.9;
            this.x = Math.max(20, Math.min(this.x, width - 20));
        }
        if (this.y < 20 || this.y > height - 20) {
            this.vy *= -0.9;
            this.y = Math.max(20, Math.min(this.y, height - 20));
        }

        this.vx += (Math.random() - 0.5) * 0.05 * hbarEffective;
        this.vy += (Math.random() - 0.5) * 0.05 * hbarEffective;

        this.vx *= 0.99;
        this.vy *= 0.99;

        this.quantum = Math.abs(Math.sin(time * 0.02 * hbarEffective + this.x * 0.01)) * 2 + 0.5;
    }

    draw(ctx) {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
        gradient.addColorStop(0, `rgba(0, 212, 255, ${this.quantum})`);
        gradient.addColorStop(0.5, `rgba(0, 150, 255, ${this.quantum * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, TWO_PI);
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
        ctx.fill();

        // Mostrar valency
        ctx.font = '8px monospace';
        ctx.fillStyle = '#ff00aa';
        ctx.fillText(this.valency, this.x + 10, this.y);
    }
}

// Clase Edge
class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.spin = this.randomSpin();
        this.phase = Math.random() * TWO_PI;
        node1.valency++;
        node2.valency++;
    }

    randomSpin() {
        const spins = [0.5, 1, 1.5, 2, 2.5];
        return spins[Math.floor(Math.random() * spins.length)];
    }

    getArea() {
        return 8 * Math.PI * IMMIRZI * Math.sqrt(this.spin * (this.spin + 1)) * PLANCK_LENGTH ** 2;
    }

    update() {
        this.phase += 0.02 * animationSpeed * hbarEffective;
        if (Math.random() < 0.005 * hbarEffective) {
            this.spin = this.randomSpin();
        }
    }

    draw(ctx) {
        const dx = this.node2.x - this.node1.x;
        const dy = this.node2.y - this.node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const hue = (this.spin / 2.5) * 120 + 180;
        const brightness = Math.abs(Math.sin(this.phase)) * 0.5 + 0.5;
        const alpha = brightness * 0.8;

        const lineWidth = this.spin * 2;

        const gradient = ctx.createLinearGradient(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        ctx.shadowBlur = 15 * hbarEffective;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;

        ctx.beginPath();
        ctx.moveTo(this.node1.x, this.node1.y);
        ctx.lineTo(this.node2.x, this.node2.y);
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (distance < 200 && Math.random() < 0.3) {
            const midX = (this.node1.x + this.node2.x) / 2;
            const midY = (this.node1.y + this.node2.y) / 2;

            ctx.font = '10px monospace';
            ctx.fillStyle = '#00ffaa';
            ctx.textAlign = 'center';
            ctx.fillText(`j=${this.spin}`, midX, midY - 5);
        }
    }
}

// Inicialización
function init() {
    canvasQuantum = document.getElementById('spinNetwork');
    ctxQuantum = canvasQuantum.getContext('2d');

    canvasSemi = document.getElementById('semiclassical');
    ctxSemi = canvasSemi.getContext('2d');

    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    createNetwork();
    setupControls();

    ctxQuantum.fillStyle = 'rgba(0, 0, 0, 1)';
    ctxQuantum.fillRect(0, 0, canvasQuantum.width, canvasQuantum.height);

    ctxSemi.fillStyle = 'rgba(0, 0, 0, 1)';
    ctxSemi.fillRect(0, 0, canvasSemi.width, canvasSemi.height);

    drawQuantum();
    drawSemiclassical();

    updateMetrics();

    animate();
    setupMouseInteraction();
}

function resizeCanvases() {
    canvasQuantum.width = canvasQuantum.parentElement.clientWidth - 32; // Ajuste padding
    canvasQuantum.height = 400;

    canvasSemi.width = canvasSemi.parentElement.clientWidth - 32;
    canvasSemi.height = 400;

    if (nodes.length > 0) {
        drawQuantum();
        drawSemiclassical();
    }
}

function createNetwork() {
    nodes = [];
    edges = [];

    const width = canvasQuantum.width;
    const height = canvasQuantum.height;

    for (let i = 0; i < quantumDensity; i++) {
        const x = Math.random() * (width - 40) + 20;
        const y = Math.random() * (height - 40) + 20;
        nodes.push(new Node(x, y));
    }

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200 || (Math.random() < 0.15 && edges.length < quantumDensity * 2)) {
                edges.push(new Edge(nodes[i], nodes[j]));
            }
        }
    }

    nodes.forEach((node, i) => {
        if (node.valency === 0 && i < nodes.length - 1) {
            edges.push(new Edge(node, nodes[i + 1]));
        }
    });
}

function animate() {
    if (isPlaying) {
        time++;
        edges.forEach(edge => edge.update());
        nodes.forEach(node => node.update(canvasQuantum.width, canvasQuantum.height));
        updateMetrics();
    }

    if (currentMode === 'quantum' || isPlaying) {
        ctxQuantum.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctxQuantum.fillRect(0, 0, canvasQuantum.width, canvasQuantum.height);
        drawQuantum();
    }

    if (currentMode === 'semiclassical' || isPlaying) {
        ctxSemi.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctxSemi.fillRect(0, 0, canvasSemi.width, canvasSemi.height);
        drawSemiclassical();
    }

    animationId = requestAnimationFrame(animate);
}

function drawQuantum() {
    edges.forEach(edge => edge.draw(ctxQuantum));
    nodes.forEach(node => node.draw(ctxQuantum));
}

function drawSemiclassical() {
    let totalArea = 0;
    edges.forEach(edge => totalArea += edge.getArea());

    const radius = Math.sqrt(totalArea / (4 * Math.PI));

    const centerX = canvasSemi.width / 2;
    const centerY = canvasSemi.height / 2;

    const gradient = ctxSemi.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 100, 100, 1)');
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0.5)');

    ctxSemi.fillStyle = gradient;
    ctxSemi.beginPath();
    ctxSemi.arc(centerX, centerY, radius, 0, TWO_PI);
    ctxSemi.fill();

    // Fluctuaciones semiclásicas
    for (let i = 0; i < 50 * hbarEffective; i++) {
        const angle = Math.random() * TWO_PI;
        const dist = radius + (Math.random() - 0.5) * 10 * hbarEffective;
        const px = centerX + Math.cos(angle) * dist;
        const py = centerY + Math.sin(angle) * dist;

        ctxSemi.fillStyle = `rgba(255, 200, 200, ${0.3 * hbarEffective})`;
        ctxSemi.beginPath();
        ctxSemi.arc(px, py, 2, 0, TWO_PI);
        ctxSemi.fill();
    }

    // Malla emergente (más fina con mayor densidad)
    ctxSemi.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctxSemi.lineWidth = 1;
    const gridSize = 20 / Math.sqrt(quantumDensity);
    for (let x = 0; x < canvasSemi.width; x += gridSize) {
        ctxSemi.beginPath();
        ctxSemi.moveTo(x, 0);
        ctxSemi.lineTo(x, canvasSemi.height);
        ctxSemi.stroke();
    }
    for (let y = 0; y < canvasSemi.height; y += gridSize) {
        ctxSemi.beginPath();
        ctxSemi.moveTo(0, y);
        ctxSemi.lineTo(canvasSemi.width, y);
        ctxSemi.stroke();
    }
}

function updateMetrics() {
    let totalArea = 0;
    edges.forEach(edge => totalArea += edge.getArea());

    const volume = Math.pow(totalArea, 1.5) * 0.1 * PLANCK_LENGTH ** 3;
    const discreteness = (1 / quantumDensity) * hbarEffective * 100;

    document.getElementById('quantumArea').textContent = totalArea.toExponential(2);
    document.getElementById('quantumVolume').textContent = volume.toExponential(2);
    document.getElementById('discreteness').textContent = discreteness.toFixed(1) + '%';

    const curvature = 1 / Math.sqrt(totalArea || 1);
    const emergence = Math.min(100, (quantumDensity / 100) * (1 / hbarEffective) * 50);
    document.getElementById('curvature').textContent = curvature.toExponential(2);
    document.getElementById('emergence').textContent = emergence.toFixed(0) + '%';
    document.getElementById('problem').textContent = emergence > 80 ? 'Emergiendo' : 'Incompleto';
    document.getElementById('problem').style.color = emergence > 80 ? '#00ff88' : '#ff6b6b';

    // Actualizar marker de régimen
    const regimePos = ((quantumDensity - 5) / 95 + (1 - hbarEffective)) / 2 * 100;
    document.getElementById('regimeMarker').style.left = `${regimePos}%`;
}

function setupControls() {
    const playPauseBtn = document.getElementById('playPause');
    const resetBtn = document.getElementById('reset');
    const modeToggleBtn = document.getElementById('modeToggle');
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const densitySlider = document.getElementById('quantumDensity');
    const densityValue = document.getElementById('densityValue');
    const hbarSlider = document.getElementById('hbar');
    const hbarValue = document.getElementById('hbarValue');

    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Iniciar';
        playPauseBtn.style.background = isPlaying 
            ? 'linear-gradient(135deg, #ff6b6b 0%, #ff4444 100%)' 
            : 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)';
    });

    resetBtn.addEventListener('click', () => {
        time = 0;
        createNetwork();
    });

    modeToggleBtn.addEventListener('click', () => {
        currentMode = currentMode === 'quantum' ? 'semiclassical' : 'quantum';
        modeToggleBtn.textContent = `Modo: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;
    });

    speedSlider.addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
        speedValue.textContent = animationSpeed.toFixed(1) + 'x';
    });

    densitySlider.addEventListener('input', (e) => {
        quantumDensity = parseInt(e.target.value);
        densityValue.textContent = quantumDensity;
        createNetwork();
    });

    hbarSlider.addEventListener('input', (e) => {
        hbarEffective = parseFloat(e.target.value);
        hbarValue.textContent = hbarEffective.toFixed(2);
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function setupMouseInteraction() {
    [canvasQuantum, canvasSemi].forEach(canvas => {
        canvas.addEventListener('mousemove', (e) => {
            if (!isPlaying) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            nodes.forEach(node => {
                const dx = mouseX - node.x;
                const dy = mouseY - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    const force = (150 - distance) / 150 * 0.5 * hbarEffective;
                    node.vx += (dx / distance) * force * 0.1;
                    node.vy += (dy / distance) * force * 0.1;
                }
            });
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            nodes.forEach(node => {
                const dx = node.x - mouseX;
                const dy = node.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    const force = (100 - distance) / 100 * 5 * hbarEffective;
                    node.vx += (dx / distance) * force;
                    node.vy += (dy / distance) * force;
                }
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', init);