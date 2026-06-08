<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Camara IA - Módulo de Seguridad</title>
    <link rel="stylesheet" href="style.css">
    <!-- TensorFlow.js y COCO-SSD -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"></script>
    <script src="script.js" defer></script>
</head>
<body>
    <div class="container">
        <h1>🔒 Módulo de Seguridad con IA</h1>
        <div class="source-selector">
            <button id="btn-mjpeg" class="active">📱 Cámara Celular (MJPEG)</button>
        </div>
        <div class="video-wrapper">
            <img id="video-source" class="video-img" alt="Stream MJPEG" />
            <canvas id="overlay"></canvas>
        </div>
        <div class="stats">
            <p>👥 Personas detectadas: <span id="people-count">0</span></p>
            <p>🔫 Armas detectadas: <span id="weapon-alert">0</span></p>
            <p>🚗 Última patente: <span id="plate-text">---</span></p>
            <p>😀 Estado: <span id="face-status">---</span></p>
        </div>
        <div class="controls">
            <button id="btn-capture-plate">📸 Capturar patente</button>
            <button id="btn-save-face" disabled>💾 Guardar rostro (próximamente)</button>
            <button id="btn-refresh">🔄 Reiniciar detección</button>
        </div>
        <div class="log">
            <h3>📋 Eventos recientes</h3>
            <ul id="event-log"></ul>
        </div>
    </div>
</body>
</html>
