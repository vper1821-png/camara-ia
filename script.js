// Elementos DOM
const video = document.getElementById('video-source');
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
let currentMode = 'webcam'; // 'webcam' o 'hikvision'

window.addEventListener('load', async () => {
    await setupWebcam();
    await loadModels();
    startDetectionLoop();
    setupEventListeners();
});

async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    } catch (err) {
        console.error('Error cámara:', err);
        alert('No se pudo acceder a la cámara web.');
    }
}

async function loadModels() {
    console.log('Cargando COCO-SSD...');
    cocoModel = await cocoSsd.load();
    console.log('COCO-SSD listo');
    // Cargar face-api (modelos desde CDN)
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log('Face-api listo');
}

function startDetectionLoop() {
    setInterval(async () => {
        if (!cocoModel || !video.videoWidth) return;
        const predictions = await cocoModel.detect(video);
        processDetections(predictions);
        drawBoxes(predictions);
    }, 500);
}

function processDetections(predictions) {
    let people = 0, weapons = 0;
    const weaponClasses = ['knife', 'scissors', 'baseball bat'];
    predictions.forEach(pred => {
        if (pred.class === 'person') people++;
        if (weaponClasses.includes(pred.class)) weapons++;
    });
    peopleCountSpan.innerText = people;
    weaponAlertSpan.innerText = weapons;
    if (weapons > 0) logEvent('weapon', `Arma detectada`);
}

function drawBoxes(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    predictions.forEach(pred => {
        const [x, y, w, h] = pred.bbox;
        ctx.strokeStyle = pred.class === 'person' ? 'lime' : 'red';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'white';
        ctx.fillText(`${pred.class} (${Math.round(pred.score*100)}%)`, x, y-5);
    });
}

async function logEvent(type, desc) {
    const payload = { event_type: type, description: desc };
    await fetch('api/log_event.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()} - ${type}: ${desc}`;
    eventLogUl.prepend(li);
}

function setupEventListeners() {
    document.getElementById('btn-webcam').onclick = () => { currentMode = 'webcam'; setupWebcam(); };
    document.getElementById('btn-hikvision').onclick = () => { currentMode = 'hikvision'; alert('Modo Hikvision - necesitas configurar la cámara'); };
    btnCapturePlate.onclick = () => alert('Función de patente pendiente');
    btnSaveFace.onclick = () => alert('Guardar rostro pendiente');
    btnSaveDanger.onclick = () => alert('Guardar rostro peligroso pendiente');
    btnSnapshotHik.onclick = async () => {
        const res = await fetch('api/get_hikvision_snapshot.php');
        const data = await res.json();
        console.log(data);
    };
}