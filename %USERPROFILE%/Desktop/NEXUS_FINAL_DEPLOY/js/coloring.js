// ============================================
// Kids Digital Hub - Interactive Coloring Book
// ============================================

// Canvas setup
let coloringCanvas, drawingCanvas;
let coloringCtx, drawingCtx;
let isDrawing = false;
let currentColor = '#FF6B6B';
let currentTool = 'brush';
let brushSize = 'medium';
let currentTemplate = 'elephant';

// Color palette
const colors = [
    { name: 'Red', hex: '#FF6B6B' },
    { name: 'Pink', hex: '#FF6B9D' },
    { name: 'Purple', hex: '#A8E6CF' },
    { name: 'Blue', hex: '#4ECDC4' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Green', hex: '#98FB98' },
    { name: 'Yellow', hex: '#FFE66D' },
    { name: 'Orange', hex: '#FF8B94' },
    { name: 'Brown', hex: '#D4A574' },
    { name: 'Gray', hex: '#95A5A6' },
    { name: 'Black', hex: '#2D3436' },
    { name: 'White', hex: '#FFFFFF' }
];

// Templates
const templates = [
    { id: 'elephant', emoji: '🐘', name: 'Elephant' },
    { id: 'giraffe', emoji: '🦒', name: 'Giraffe' },
    { id: 'lion', emoji: '🦁', name: 'Lion' },
    { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
    { id: 'bird', emoji: '🐦', name: 'Bird' },
    { id: 'butterfly', emoji: '🦋', name: 'Butterfly' }
];

// Brush sizes
const brushSizes = {
    small: 5,
    medium: 10,
    large: 20
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    renderColorPalette();
    renderTemplates();
    initTools();
    initBrushSizes();
    initButtons();
    showTutorial();
});

// Initialize canvas
function initCanvas() {
    coloringCanvas = document.getElementById('coloringCanvas');
    drawingCanvas = document.getElementById('drawingCanvas');

    if (!coloringCanvas || !drawingCanvas) return;

    coloringCtx = coloringCanvas.getContext('2d');
    drawingCtx = drawingCanvas.getContext('2d');

    // Set canvas size
    const canvasWidth = 800;
    const canvasHeight = 600;

    coloringCanvas.width = canvasWidth;
    coloringCanvas.height = canvasHeight;
    drawingCanvas.width = canvasWidth;
    drawingCanvas.height = canvasHeight;

    // Load initial template
    loadTemplate(currentTemplate);

    // Add event listeners
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    drawingCanvas.addEventListener('touchstart', handleTouch);
    drawingCanvas.addEventListener('touchmove', handleTouch);
    drawingCanvas.addEventListener('touchend', stopDrawing);
}

// Render color palette
function renderColorPalette() {
    const palette = document.getElementById('colorPalette');
    if (!palette) return;

    palette.innerHTML = colors.map((color, index) => `
    <button 
      class="color-btn ${index === 0 ? 'active' : ''}" 
      style="background-color: ${color.hex}"
      data-color="${color.hex}"
      data-name="${color.name}"
      onclick="selectColor('${color.hex}', '${color.name}')"
      title="${color.name}"
    ></button>
  `).join('');
}

// Render templates
function renderTemplates() {
    const container = document.getElementById('templatesList');
    if (!container) return;

    container.innerHTML = templates.map((template, index) => `
    <button 
      class="template-btn ${index === 0 ? 'active' : ''}"
      onclick="changeTemplate('${template.id}')"
      title="${template.name}"
    >
      ${template.emoji}
    </button>
  `).join('');
}

// Initialize tools
function initTools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;

            // Update cursor
            if (currentTool === 'eraser') {
                drawingCanvas.style.cursor = 'not-allowed';
            } else if (currentTool === 'fill') {
                drawingCanvas.style.cursor = 'cell';
            } else {
                drawingCanvas.style.cursor = 'crosshair';
            }
        });
    });
}

// Initialize brush sizes
function initBrushSizes() {
    document.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            brushSize = btn.dataset.size;
        });
    });
}

// Initialize buttons
function initButtons() {
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');

    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveDrawing);
    }
}

// Select color
function selectColor(hex, name) {
    currentColor = hex;

    // Update active state
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === hex) {
            btn.classList.add('active');
        }
    });

    // Update color preview
    const preview = document.getElementById('currentColorPreview');
    const nameEl = document.getElementById('currentColorName');
    if (preview) preview.style.backgroundColor = hex;
    if (nameEl) nameEl.textContent = name;
}

// Change template
function changeTemplate(templateId) {
    currentTemplate = templateId;

    // Update active state
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Clear and load new template
    clearCanvas();
    loadTemplate(templateId);
}

// Load template
function loadTemplate(templateId) {
    // Clear background canvas
    coloringCtx.fillStyle = 'white';
    coloringCtx.fillRect(0, 0, coloringCanvas.width, coloringCanvas.height);

    // Draw template outline
    coloringCtx.strokeStyle = '#2D3436';
    coloringCtx.lineWidth = 3;
    coloringCtx.lineCap = 'round';
    coloringCtx.lineJoin = 'round';

    // Draw different animals based on template
    switch (templateId) {
        case 'elephant':
            drawElephant(coloringCtx);
            break;
        case 'giraffe':
            drawGiraffe(coloringCtx);
            break;
        case 'lion':
            drawLion(coloringCtx);
            break;
        case 'rabbit':
            drawRabbit(coloringCtx);
            break;
        case 'bird':
            drawBird(coloringCtx);
            break;
        case 'butterfly':
            drawButterfly(coloringCtx);
            break;
    }
}

// Drawing functions for templates
function drawElephant(ctx) {
    ctx.beginPath();
    // Body
    ctx.ellipse(400, 350, 150, 120, 0, 0, Math.PI * 2);
    // Head
    ctx.moveTo(300, 250);
    ctx.ellipse(300, 250, 80, 90, 0, 0, Math.PI * 2);
    // Trunk
    ctx.moveTo(250, 280);
    ctx.quadraticCurveTo(200, 350, 220, 420);
    ctx.quadraticCurveTo(230, 430, 240, 420);
    ctx.quadraticCurveTo(220, 350, 270, 280);
    // Ears
    ctx.moveTo(240, 220);
    ctx.ellipse(200, 240, 40, 60, -0.3, 0, Math.PI * 2);
    ctx.moveTo(360, 220);
    ctx.ellipse(400, 240, 40, 60, 0.3, 0, Math.PI * 2);
    // Eye
    ctx.moveTo(285, 230);
    ctx.arc(285, 230, 8, 0, Math.PI * 2);
    // Legs
    ctx.moveTo(320, 450);
    ctx.lineTo(320, 520);
    ctx.moveTo(380, 450);
    ctx.lineTo(380, 520);
    ctx.moveTo(440, 450);
    ctx.lineTo(440, 520);
    ctx.moveTo(500, 450);
    ctx.lineTo(500, 520);
    ctx.stroke();
}

function drawGiraffe(ctx) {
    ctx.beginPath();
    // Body
    ctx.ellipse(400, 400, 100, 80, 0, 0, Math.PI * 2);
    // Neck
    ctx.moveTo(350, 350);
    ctx.lineTo(320, 200);
    ctx.lineTo(360, 200);
    ctx.lineTo(390, 350);
    // Head
    ctx.moveTo(340, 200);
    ctx.ellipse(340, 180, 30, 35, 0, 0, Math.PI * 2);
    // Ears
    ctx.moveTo(325, 160);
    ctx.lineTo(315, 145);
    ctx.lineTo(325, 150);
    ctx.moveTo(355, 160);
    ctx.lineTo(365, 145);
    ctx.lineTo(355, 150);
    // Eyes
    ctx.moveTo(330, 175);
    ctx.arc(330, 175, 5, 0, Math.PI * 2);
    ctx.moveTo(350, 175);
    ctx.arc(350, 175, 5, 0, Math.PI * 2);
    // Legs
    ctx.moveTo(340, 470);
    ctx.lineTo(340, 550);
    ctx.moveTo(380, 470);
    ctx.lineTo(380, 550);
    ctx.moveTo(420, 470);
    ctx.lineTo(420, 550);
    ctx.moveTo(460, 470);
    ctx.lineTo(460, 550);
    // Spots
    for (let i = 0; i < 8; i++) {
        const x = 350 + Math.random() * 100;
        const y = 350 + Math.random() * 80;
        ctx.moveTo(x + 15, y);
        ctx.arc(x, y, 15, 0, Math.PI * 2);
    }
    ctx.stroke();
}

function drawLion(ctx) {
    ctx.beginPath();
    // Mane
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = 400 + Math.cos(angle) * 100;
        const y = 280 + Math.sin(angle) * 100;
        ctx.moveTo(400, 280);
        ctx.lineTo(x, y);
    }
    // Head
    ctx.moveTo(470, 280);
    ctx.arc(400, 280, 70, 0, Math.PI * 2);
    // Eyes
    ctx.moveTo(385, 270);
    ctx.arc(380, 270, 8, 0, Math.PI * 2);
    ctx.moveTo(425, 270);
    ctx.arc(420, 270, 8, 0, Math.PI * 2);
    // Nose
    ctx.moveTo(400, 300);
    ctx.lineTo(390, 310);
    ctx.lineTo(410, 310);
    ctx.closePath();
    // Mouth
    ctx.moveTo(390, 315);
    ctx.quadraticCurveTo(400, 325, 410, 315);
    // Body
    ctx.moveTo(470, 350);
    ctx.ellipse(400, 420, 120, 90, 0, 0, Math.PI * 2);
    // Legs
    ctx.moveTo(330, 490);
    ctx.lineTo(330, 560);
    ctx.moveTo(380, 490);
    ctx.lineTo(380, 560);
    ctx.moveTo(420, 490);
    ctx.lineTo(420, 560);
    ctx.moveTo(470, 490);
    ctx.lineTo(470, 560);
    ctx.stroke();
}

function drawRabbit(ctx) {
    ctx.beginPath();
    // Body
    ctx.ellipse(400, 400, 100, 120, 0, 0, Math.PI * 2);
    // Head
    ctx.moveTo(450, 280);
    ctx.arc(400, 280, 60, 0, Math.PI * 2);
    // Ears
    ctx.moveTo(380, 220);
    ctx.ellipse(370, 180, 20, 50, -0.2, 0, Math.PI * 2);
    ctx.moveTo(420, 220);
    ctx.ellipse(430, 180, 20, 50, 0.2, 0, Math.PI * 2);
    // Eyes
    ctx.moveTo(385, 275);
    ctx.arc(380, 275, 8, 0, Math.PI * 2);
    ctx.moveTo(425, 275);
    ctx.arc(420, 275, 8, 0, Math.PI * 2);
    // Nose
    ctx.moveTo(400, 295);
    ctx.arc(400, 295, 5, 0, Math.PI * 2);
    // Mouth
    ctx.moveTo(400, 300);
    ctx.lineTo(400, 310);
    ctx.moveTo(390, 310);
    ctx.quadraticCurveTo(400, 315, 410, 310);
    // Legs
    ctx.moveTo(350, 500);
    ctx.lineTo(350, 550);
    ctx.moveTo(450, 500);
    ctx.lineTo(450, 550);
    // Tail
    ctx.moveTo(480, 420);
    ctx.arc(500, 420, 25, 0, Math.PI * 2);
    ctx.stroke();
}

function drawBird(ctx) {
    ctx.beginPath();
    // Body
    ctx.ellipse(400, 350, 80, 100, 0, 0, Math.PI * 2);
    // Head
    ctx.moveTo(450, 250);
    ctx.arc(400, 250, 50, 0, Math.PI * 2);
    // Beak
    ctx.moveTo(450, 250);
    ctx.lineTo(500, 240);
    ctx.lineTo(500, 260);
    ctx.closePath();
    // Eye
    ctx.moveTo(420, 245);
    ctx.arc(415, 245, 8, 0, Math.PI * 2);
    // Wing
    ctx.moveTo(400, 320);
    ctx.quadraticCurveTo(350, 300, 300, 350);
    ctx.quadraticCurveTo(320, 380, 380, 380);
    // Tail
    ctx.moveTo(400, 440);
    ctx.lineTo(380, 500);
    ctx.moveTo(400, 440);
    ctx.lineTo(400, 510);
    ctx.moveTo(400, 440);
    ctx.lineTo(420, 500);
    // Legs
    ctx.moveTo(380, 450);
    ctx.lineTo(370, 490);
    ctx.moveTo(420, 450);
    ctx.lineTo(430, 490);
    ctx.stroke();
}

function drawButterfly(ctx) {
    ctx.beginPath();
    // Body
    ctx.moveTo(400, 250);
    ctx.lineTo(400, 450);
    // Head
    ctx.moveTo(410, 240);
    ctx.arc(400, 240, 15, 0, Math.PI * 2);
    // Antennae
    ctx.moveTo(395, 230);
    ctx.quadraticCurveTo(380, 210, 375, 200);
    ctx.moveTo(405, 230);
    ctx.quadraticCurveTo(420, 210, 425, 200);
    // Upper wings
    ctx.moveTo(400, 280);
    ctx.bezierCurveTo(300, 250, 280, 320, 350, 350);
    ctx.moveTo(400, 280);
    ctx.bezierCurveTo(500, 250, 520, 320, 450, 350);
    // Lower wings
    ctx.moveTo(400, 380);
    ctx.bezierCurveTo(310, 380, 300, 450, 360, 470);
    ctx.moveTo(400, 380);
    ctx.bezierCurveTo(490, 380, 500, 450, 440, 470);
    // Wing patterns
    for (let i = 0; i < 4; i++) {
        ctx.moveTo(330 + i * 20, 300 + i * 10);
        ctx.arc(325 + i * 20, 300 + i * 10, 10, 0, Math.PI * 2);
        ctx.moveTo(470 - i * 20, 300 + i * 10);
        ctx.arc(475 - i * 20, 300 + i * 10, 10, 0, Math.PI * 2);
    }
    ctx.stroke();
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'fill') {
        // Fill tool - just color the area (simplified)
        drawingCtx.fillStyle = currentColor;
        drawingCtx.beginPath();
        drawingCtx.arc(x, y, 50, 0, Math.PI * 2);
        drawingCtx.fill();
        isDrawing = false;
    } else {
        draw(e);
    }
}

// Draw
function draw(e) {
    if (!isDrawing && currentTool !== 'fill') return;

    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    drawingCtx.lineWidth = brushSizes[brushSize];

    if (currentTool === 'eraser') {
        drawingCtx.globalCompositeOperation = 'destination-out';
    } else {
        drawingCtx.globalCompositeOperation = 'source-over';
        drawingCtx.strokeStyle = currentColor;
        drawingCtx.fillStyle = currentColor;
    }

    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
    drawingCtx.beginPath();
    drawingCtx.moveTo(x, y);
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
    drawingCtx.beginPath();
}

// Handle touch events
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
}

// Clear canvas
function clearCanvas() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// Save drawing
function saveDrawing() {
    // Create a temporary canvas to combine both layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = coloringCanvas.width;
    tempCanvas.height = coloringCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw background (template)
    tempCtx.drawImage(coloringCanvas, 0, 0);
    // Draw user's coloring
    tempCtx.drawImage(drawingCanvas, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = `coloring-${currentTemplate}-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();

    // Show success message
    showSuccessMessage('🎨 Your masterpiece has been saved!');
}

// Show tutorial
function showTutorial() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close tutorial
function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Show success message
function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 20px 30px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: var(--font-heading);
    font-size: 1.2rem;
    animation: slideInRight 0.3s ease;
    border-left: 5px solid #4ECDC4;
  `;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}
