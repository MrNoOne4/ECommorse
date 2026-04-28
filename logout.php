<?php
session_start();
session_destroy();
header("Cache-Control: no-store, no-cache, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0");

header('Content-Type: application/json');

echo json_encode([
    "success" => true
]);

exit;