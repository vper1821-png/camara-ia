// script.js - Versión con soporte MJPEG y cámara de prueba

// Elementos DOM
const videoContainer = document.getElementById('video-source');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const peopleCountSpan = document.getElementById('people-count');
const weaponAlertSpan = document.getElementById('weapon-alert');
const plateTextSpan = document.getElementById('plate-text');
const faceStatusSpan = document.getElementById('face-status');
const eventLogUl = document.getElementById('event-log');
const btnSaveFace = document.getElementById('btn-save-face');
const btnSaveDanger = document.getElementById('btn-save-danger');
const btnCapturePlate = document.getElementById('btn-capture-plate');
const btnSnapshotHik = document.getElementById('btn-snapshot-hik');

let cocoModel = null;
let faceMatcher = null;
let currentMode = 'webcam'; // 'webcam' o 'mjpeg'
let detectionInterval = null;

// URL de cámara MJPEG de prueba (Universidad de Heidelberg)
const TEST_MJPEG_URL = 'http://192.168.1.21:8080/video.mjpg';


// Inicialización
window.addEventListener('load', async () => {
    await setupWebcam();
    await loadModels();
    startDetectionLoop();
    setupEventListeners();
});

// Cámara web local
async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoContainer.srcObject = stream;
        await new Promise((resolve) => (videoContainer.onloadedmetadata = resolve));
        canvas.width = videoContainer.videoWidth;
        canvas.height = videoContainer.videoHeight;
        currentMode = 'webcam';
    } catch (err) {
        console.error('Error al acceder a la cámara web:', err);
        alert('No se pudo acceder a la cámara web. Usando modo MJPEG de prueba.');
        switchToMjpeg();
    }
}

// Cambiar a fuente MJPEG (reemplaza el elemento <video> por <img>)
function switchToMjpeg() {
    // Detener streams previos si existen
    if (videoContainer.srcObject) {
        videoContainer.srcObject.getTracks().forEach(track => track.stop());
    }
    // Crear elemento img
    const img = document.createElement('img');
    img.id = 'video-source';
    img.className = videoContainer.className;
    img.src = TEST_MJPEG_URL;
    img.alt = 'MJPEG Stream';
    img.style.width = '100%';
    img.style.height = 'auto';
    // Reemplazar
    videoContainer.parentNode.replaceChild(img, videoContainer);
    // Actualizar referencia global
    window.videoSource = img;
    // Ajustar canvas al tamaño de la imagen (cuando cargue)
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
    };
    currentMode = 'mjpeg';
    console.log('Modo MJPEG activado con URL:', TEST_MJPEG_URL);
}

// Cargar modelos COCO-SSD y face-api
async function loadModels() {
    console.log('Cargando COCO-SSD...');
    cocoModel = await cocoSsd.load();
    console.log('COCO-SSD listo');
    
    // Face-api (modelos desde CDN)
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log('Face-api listo');
}

// Bucle de detección (cada 1 segundo para no saturar)
function startDetectionLoop() {
    if (detectionInterval) clearInterval(detectionInterval);
    detectionInterval = setInterval(async () => {
        if (!cocoModel) return;
        
        let sourceElement = document.getElementById('video-source');
        if (!sourceElement) return;
        
        // Si es imagen MJPEG, usarla; si es video, usar el video
        let inputElement = sourceElement;
        if (sourceElement.tagName === 'IMG') {
            // Para MJPEG, necesitamos dibujar la imagen en un canvas para que face-api la procese
            // Pero COCO-SSD también acepta imágenes. Lo haremos con un canvas temporal.
            if (!sourceElement.complete || sourceElement.naturalWidth === 0) return;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = sourceElement.naturalWidth;
            tempCanvas.height = sourceElement.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(sourceElement, 0, 0);
            inputElement = tempCanvas;
        }
        
        // Detección COCO-SSD
        const predictions = await cocoModel.detect(inputElement);
        processDetections(predictions);
        drawBoxes(predictions, inputElement);
        
        // Detección facial (solo si tenemos un elemento válido)
        if (inputElement && inputElement.width > 0) {
            const detections = await faceapi.detectAllFaces(inputElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            processFaces(detections);
        }
    }, 1000);
}

// Procesar detecciones COCO (personas, armas)
function processDetections(predictions) {
    let people = 0, weapons = 0;
    const weaponClasses = ['knife', 'scissors', 'baseball bat'];
    predictions.forEach(pred => {
        if (pred.class === 'person') people++;
        if (weaponClasses.includes(pred.class)) weapons++;
    });
    peopleCountSpan.innerText = people;
    weaponAlertSpan.innerText = weapons;
    if (weapons > 0 && !window.lastWeaponLogged) {
        logEvent('weapon', `Arma detectada (${weapons} objeto(s))`);
        window.lastWeaponLogged = true;
        setTimeout(() => { window.lastWeaponLogged = false; }, 10000);
    }
}

// Dibujar bounding boxes
function drawBoxes(predictions, sourceElement) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!sourceElement) return;
    // Ajustar canvas al tamaño de la fuente
    canvas.width = sourceElement.width || sourceElement.naturalWidth;
    canvas.height = sourceElement.height || sourceElement.naturalHeight;
    
    predictions.forEach(pred => {
        const [x, y, w, h] = pred.bbox;
        let color = pred.class === 'person' ? 'lime' : 'red';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.fillText(`${pred.class} (${Math.round(pred.score*100)}%)`, x, y-5);
    });
}

// Procesar rostros (placeholder, puedes ampliar después)
function processFaces(detections) {
    if (detections && detections.length > 0) {
        faceStatusSpan.innerText = `${detections.length} rostro(s) detectado(s)`;
    } else {
        faceStatusSpan.innerText = 'Ninguno';
    }
}

// Registrar eventos en el servidor
async function logEvent(type, description) {
    try {
        await fetch('api/log_event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: type, description: description })
        });
        const li = document.createElement('li');
        li.textContent = `${new Date().toLocaleTimeString()} - ${type}: ${description}`;
        eventLogUl.prepend(li);
        if (eventLogUl.children.length > 20) eventLogUl.removeChild(eventLogUl.lastChild);
    } catch (err) {
        console.error('Error log:', err);
    }
}

// Configurar botones
function setupEventListeners() {
    document.getElementById('btn-webcam').onclick = async () => {
        await setupWebcam();
        currentMode = 'webcam';
    };
    document.getElementById('btn-hikvision').onclick = () => {
        switchToMjpeg();
        currentMode = 'mjpeg';
    };
    btnCapturePlate.onclick = () => {
        alert('Captura de patente aún no implementada con MJPEG');
    };
    btnSaveFace.onclick = () => {
        alert('Guardado de rostro aún no implementado');
    };
    btnSaveDanger.onclick = () => {
        alert('Guardado de rostro peligroso aún no implementado');
    };
    btnSnapshotHik.onclick = () => {
        alert('Snapshot manual: ' + TEST_MJPEG_URL);
    };
}
