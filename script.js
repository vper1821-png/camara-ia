// Elementos DOM
const videoImg = document.getElementById('video-source');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const peopleCountSpan = document.getElementById('people-count');
const weaponAlertSpan = document.getElementById('weapon-alert');
const plateTextSpan = document.getElementById('plate-text');
const faceStatusSpan = document.getElementById('face-status');
const eventLogUl = document.getElementById('event-log');
const btnCapturePlate = document.getElementById('btn-capture-plate');
const btnRefresh = document.getElementById('btn-refresh');
const btnMjpeg = document.getElementById('btn-mjpeg');

// Configuración de la cámara del celular
const CELULAR_URL = 'http://192.168.1.21:8080/video'; // ✅ URL que funciona

let cocoModel = null;
let detectionInterval = null;
let lastWeaponLogged = false;

// Inicialización
window.addEventListener('load', async () => {
    // Mostrar mensaje de carga
    faceStatusSpan.innerText = 'Cargando modelo IA...';
    await loadModel();
    await startMjpegStream();
    startDetectionLoop();
    setupEventListeners();
});

// Cargar modelo COCO-SSD
async function loadModel() {
    try {
        console.log('Cargando COCO-SSD...');
        cocoModel = await cocoSsd.load();
        console.log('COCO-SSD listo');
        faceStatusSpan.innerText = 'Modelo listo';
    } catch (err) {
        console.error('Error cargando modelo:', err);
        faceStatusSpan.innerText = 'Error cargando modelo';
    }
}

// Iniciar stream MJPEG desde el celular
async function startMjpegStream() {
    videoImg.src = CELULAR_URL;
    videoImg.crossOrigin = 'Anonymous'; // Intentar evitar CORS si es posible
    
    // Esperar a que la imagen cargue para ajustar canvas
    videoImg.onload = () => {
        canvas.width = videoImg.naturalWidth;
        canvas.height = videoImg.naturalHeight;
        console.log(`Stream MJPEG cargado: ${canvas.width}x${canvas.height}`);
        faceStatusSpan.innerText = 'Stream activo';
    };
    videoImg.onerror = () => {
        console.error('Error al cargar el stream MJPEG');
        faceStatusSpan.innerText = 'Error: No se pudo cargar el stream';
        alert('No se pudo cargar el stream del celular. Verifica que la URL sea accesible desde el pod.');
    };
}

// Bucle de detección (cada 1 segundo)
function startDetectionLoop() {
    if (detectionInterval) clearInterval(detectionInterval);
    detectionInterval = setInterval(async () => {
        if (!cocoModel || !videoImg.complete || videoImg.naturalWidth === 0) return;
        
        try {
            // Realizar detección en la imagen actual
            const predictions = await cocoModel.detect(videoImg);
            processDetections(predictions);
            drawDetections(predictions);
        } catch (err) {
            console.error('Error en detección:', err);
        }
    }, 1000); // 1 segundo
}

// Procesar detecciones (personas y armas)
function processDetections(predictions) {
    let people = 0;
    let weapons = 0;
    const weaponClasses = ['knife', 'scissors', 'baseball bat', 'scissors'];
    
    predictions.forEach(pred => {
        if (pred.class === 'person') people++;
        if (weaponClasses.includes(pred.class.toLowerCase())) weapons++;
    });
    
    // Actualizar UI
    peopleCountSpan.innerText = people;
    weaponAlertSpan.innerText = weapons;
    
    // Registrar evento de arma (solo una vez cada 10 seg)
    if (weapons > 0 && !lastWeaponLogged) {
        logEvent('weapon', `⚠️ ARMA detectada (${weapons} objeto(s))`);
        lastWeaponLogged = true;
        setTimeout(() => { lastWeaponLogged = false; }, 10000);
    }
    
    // Registrar conteo de personas si cambia significativamente
    if (window.lastPersonCount !== people) {
        if (people > 0) {
            logEvent('person_count', `👥 Personas detectadas: ${people}`);
        }
        window.lastPersonCount = people;
    }
}

// Dibujar bounding boxes en el canvas
function drawDetections(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach(pred => {
        const [x, y, w, h] = pred.bbox;
        let color = 'cyan';
        if (pred.class === 'person') color = 'lime';
        const weaponClasses = ['knife', 'scissors', 'baseball bat'];
        if (weaponClasses.includes(pred.class.toLowerCase())) color = 'red';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.fillText(`${pred.class} (${Math.round(pred.score*100)}%)`, x, y-5);
    });
}

// Capturar patente (simulado por ahora)
async function capturePlate() {
    plateTextSpan.innerText = 'Leyendo...';
    // Aquí se puede implementar Tesseract.js más adelante
    setTimeout(() => {
        const mockPlate = 'ABC123';
        plateTextSpan.innerText = mockPlate;
        logEvent('plate', `Patente simulada: ${mockPlate}`);
    }, 1500);
}

// Registrar evento en el servidor y en la UI
async function logEvent(type, description) {
    try {
        // Intentar guardar en backend PHP (si está configurado)
        const payload = { event_type: type, description: description, image_path: '' };
        await fetch('api/log_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.log('Backend no disponible, solo log local'));
    } catch (err) {
        // Si falla, solo mostrar en UI
    }
    
    // Mostrar en la UI siempre
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()} - ${type}: ${description}`;
    eventLogUl.prepend(li);
    if (eventLogUl.children.length > 20) {
        eventLogUl.removeChild(eventLogUl.lastChild);
    }
}

// Configurar eventos de botones
function setupEventListeners() {
    btnMjpeg.addEventListener('click', () => {
        // Reiniciar el stream (recargar la imagen)
        videoImg.src = CELULAR_URL;
        logEvent('system', 'Stream MJPEG reiniciado manualmente');
    });
    
    btnCapturePlate.addEventListener('click', capturePlate);
    
    btnRefresh.addEventListener('click', () => {
        // Limpiar canvas y reiniciar contadores visuales
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        peopleCountSpan.innerText = '0';
        weaponAlertSpan.innerText = '0';
        plateTextSpan.innerText = '---';
        faceStatusSpan.innerText = 'Reiniciado';
        logEvent('system', 'Sistema reiniciado por usuario');
        setTimeout(() => {
            faceStatusSpan.innerText = 'Stream activo';
        }, 2000);
    });
}

// (Opcional) Guardar rostro - placeholder
document.getElementById('btn-save-face').addEventListener('click', () => {
    alert('Función de guardar rostro disponible en próxima versión');
});
