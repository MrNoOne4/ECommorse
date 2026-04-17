<?php
session_start();
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0");

echo json_encode([
    "loggedIn" => isset($_SESSION["user"]),
    "user" => $_SESSION["user"] ?? null
])

?>