// Constantes físicas y parámetros
const PLANCK_LENGTH = 1.616e-35; // metros
const IMMIRZI = 0.2375;
const TWO_PI = Math.PI * 2;

// Variables globales
let canvas, ctx;
let nodes = [];
let edges = [];
let isPlaying = false;
let animationSpeed = 1;
let nodeCount = 15;
let time = 0;
let animationId = null;

// Clase Nodo (vértice del spin network)
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = 5;
        this.quantum = Math.random() * 2 + 0.5;
    }

    update(width, height) {
        // Movimiento browniano cuántico
        this.x += this.vx * animationSpeed;
        this.y += this.vy * animationSpeed;

        // Rebote en los bordes
        if (this.x < 20 || this.x > width - 20) {
            this.vx *= -0.9;
            this.x = Math.max(20, Math.min(this.x, width - 20));
        }
        if (this.y < 20 || this.y > height - 20) {
            this.vy *= -0.9;
            this.y = Math.max(20, Math.min(this.y, height - 20));
        }

        // Pequeña perturbación aleatoria
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;

        // Fricción
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Oscilación cuántica
        this.quantum = Math.abs(Math.sin(time * 0.02 + this.x * 0.01) * 2) + 0.5;
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
    }
}

// Clase Edge (enlace con spin)
class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.spin = this.randomSpin();
        this.phase = Math.random() * TWO_PI;
    }

    randomSpin() {
        // Números cuánticos de spin: 1/2, 1, 3/2, 2, 5/2
        const spins = [0.5, 1, 1.5, 2, 2.5];
        return spins[Math.floor(Math.random() * spins.length)];
    }

    getArea() {
        // Fórmula: A = 8πγℓ²ₚ √(j(j+1))
        return 8 * Math.PI * IMMIRZI * Math.sqrt(this.spin * (this.spin + 1));
    }

    update() {
        this.phase += 0.02 * animationSpeed;
        // Fluctuación cuántica ocasional
        if (Math.random() < 0.005) {
            this.spin = this.randomSpin();
        }
    }

    draw(ctx) {
        const dx = this.node2.x - this.node1.x;
        const dy = this.node2.y - this.node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Color basado en el spin
        const hue = (this.spin / 2.5) * 120 + 180; // De cian a violeta
        const brightness = Math.abs(Math.sin(this.phase)) * 0.5 + 0.5;
        const alpha = brightness * 0.8;

        // Grosor basado en el spin
        const lineWidth = this.spin * 2;

        // Gradiente a lo largo del enlace
        const gradient = ctx.createLinearGradient(
            this.node1.x, this.node1.y,
            this.node2.x, this.node2.y
        );
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // Efecto de "flujo cuántico"
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;

        ctx.beginPath();
        ctx.moveTo(this.node1.x, this.node1.y);
        ctx.lineTo(this.node2.x, this.node2.y);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Etiqueta de spin (opcional, solo para algunos enlaces)
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
    console.log('Iniciando aplicación...');
    
    canvas = document.getElementById('spinNetwork');
    if (!canvas) {
        console.error('Canvas no encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    console.log('Canvas inicializado:', canvas.width, 'x', canvas.height);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    createNetwork();
    setupControls();
    
    // Dibujar el estado inicial inmediatamente
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    edges.forEach(edge => edge.draw(ctx));
    nodes.forEach(node => node.draw(ctx));
    updateMetrics();
    
    // Iniciar loop de animación
    animate();
    
    console.log('Aplicación iniciada correctamente');
    console.log('Pulsa el botón "Iniciar" para comenzar la simulación');
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log('Canvas redimensionado:', canvas.width, 'x', canvas.height);
    
    // Redibujar después de redimensionar
    if (nodes.length > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        edges.forEach(edge => edge.draw(ctx));
        nodes.forEach(node => node.draw(ctx));
    }
}

function createNetwork() {
    nodes = [];
    edges = [];

    const width = canvas.width;
    const height = canvas.height;

    console.log('Creando red con', nodeCount, 'nodos en canvas de', width, 'x', height);

    // Crear nodos
    for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * (width - 40) + 20;
        const y = Math.random() * (height - 40) + 20;
        nodes.push(new Node(x, y));
    }

    // Crear enlaces entre nodos cercanos
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Conectar si están suficientemente cerca o aleatoriamente
            if (distance < 200 || (Math.random() < 0.15 && edges.length < nodeCount * 2)) {
                edges.push(new Edge(nodes[i], nodes[j]));
            }
        }
    }

    // Asegurar que cada nodo tenga al menos una conexión
    nodes.forEach((node, i) => {
        const hasConnection = edges.some(edge => 
            edge.node1 === node || edge.node2 === node
        );
        
        if (!hasConnection && i < nodes.length - 1) {
            edges.push(new Edge(node, nodes[i + 1]));
        }
    });

    console.log('Red creada:', nodes.length, 'nodos,', edges.length, 'enlaces');
}

function animate() {
    // Limpiar canvas con efecto de desvanecimiento
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
        time++;

        // Actualizar y dibujar enlaces
        edges.forEach(edge => {
            edge.update();
            edge.draw(ctx);
        });

        // Actualizar y dibujar nodos
        nodes.forEach(node => {
            node.update(canvas.width, canvas.height);
            node.draw(ctx);
        });

        // Actualizar métricas cuánticas
        updateMetrics();
    } else {
        // Dibujar estado estático cuando está en pausa
        edges.forEach(edge => {
            edge.draw(ctx);
        });

        nodes.forEach(node => {
            node.draw(ctx);
        });

        updateMetrics();
    }

    animationId = requestAnimationFrame(animate);
}

function updateMetrics() {
    // Calcular área cuántica total
    let totalArea = 0;
    edges.forEach(edge => {
        totalArea += edge.getArea();
    });

    // Calcular volumen (simplificado)
    const volume = Math.pow(totalArea, 1.5) * 0.1;

    // Calcular energía (proporcional al área y actividad)
    const energy = totalArea * (1 + Math.sin(time * 0.05) * 0.2);

    // Actualizar display
    document.getElementById('quantumArea').textContent = totalArea.toFixed(2);
    document.getElementById('quantumVolume').textContent = volume.toFixed(2);
    document.getElementById('energy').textContent = energy.toFixed(2);
}

function setupControls() {
    const playPauseBtn = document.getElementById('playPause');
    const resetBtn = document.getElementById('reset');
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const nodesSlider = document.getElementById('nodes');
    const nodesValue = document.getElementById('nodesValue');

    console.log('Configurando controles...');
    console.log('Botones encontrados:', {
        playPause: !!playPauseBtn,
        reset: !!resetBtn,
        speed: !!speedSlider,
        nodes: !!nodesSlider
    });

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            console.log('Estado de reproducción:', isPlaying);
            playPauseBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Iniciar';
            playPauseBtn.style.background = isPlaying 
                ? 'linear-gradient(135deg, #ff6b6b 0%, #ff4444 100%)' 
                : 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            console.log('Reiniciando red...');
            time = 0;
            createNetwork();
        });
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            animationSpeed = parseFloat(e.target.value);
            speedValue.textContent = animationSpeed.toFixed(1) + 'x';
            console.log('Velocidad:', animationSpeed);
        });
    }

    if (nodesSlider) {
        nodesSlider.addEventListener('input', (e) => {
            nodeCount = parseInt(e.target.value);
            nodesValue.textContent = nodeCount;
            console.log('Nodos:', nodeCount);
            createNetwork();
        });
    }

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            console.log('Cambiando a tab:', tabId);

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    console.log('Controles configurados correctamente');
}

// Interacción con el mouse
function setupMouseInteraction() {
    if (!canvas) return;

    canvas.addEventListener('mousemove', (e) => {
        if (!isPlaying) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Los nodos son atraídos/repelidos por el cursor
        nodes.forEach(node => {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                const force = (150 - distance) / 150 * 0.5;
                node.vx += (dx / distance) * force * 0.1;
                node.vy += (dy / distance) * force * 0.1;
            }
        });
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        console.log('Click en canvas:', mouseX, mouseY);

        // Crear una pequeña "explosión cuántica"
        nodes.forEach(node => {
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                const force = (100 - distance) / 100 * 5;
                node.vx += (dx / distance) * force;
                node.vy += (dy / distance) * force;
            }
        });
    });
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, iniciando...');
    init();
    setupMouseInteraction();
});
