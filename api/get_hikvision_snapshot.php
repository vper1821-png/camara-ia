<?php
header('Content-Type: application/json');
// Configuración desde variables de entorno en K8s, por ahora mock
echo json_encode(['success' => false, 'error' => 'No configurado aún']);