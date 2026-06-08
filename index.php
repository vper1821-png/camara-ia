<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Seguridad IA - camara-ia</title>
    <link rel="stylesheet" href="style.css">
    <!-- TensorFlow.js y YOLO-TFJS -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js"></script>
    <script src="script.js" defer></script>
</head>
<body>
    <div class="container">
        <h1>🔒 Módulo de Seguridad IA - camara-ia</h1>
        <div class="source-selector">
            <button id="btn-webcam" class="active">🌐 Webcam local</button>
            <button id="btn-hikvision">📷 Cámara Hikvision</button>
        </div>
        <div class="video-wrapper">
            <video id="video-source" autoplay playsinline muted></video>
            <canvas id="overlay"></canvas>
        </div>
        <div class="stats">
            <p>👥 Personas: <span id="people-count">0</span></p>
            <p>🔫 Armas: <span id="weapon-alert">0</span></p>
            <p>🚗 Patente: <span id="plate-text">---</span></p>
            <p>😀 Rostro: <span id="face-status">---</span></p>
        </div>
        <div class="controls">
            <button id="btn-capture-plate">📸 Capturar patente</button>
            <button id="btn-save-face" disabled>💾 Guardar rostro confiable</button>
            <button id="btn-save-danger" disabled>⚠️ Guardar rostro peligroso</button>
            <button id="btn-snapshot-hik">🖼️ Snapshot Hikvision</button>
        </div>
        <div class="log">
            <h3>📋 Eventos</h3>
            <ul id="event-log"></ul>
        </div>
    </div>
</body>
</html>