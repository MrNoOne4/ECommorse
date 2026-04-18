<?php
require_once "db.php";
header("Content-Type: application/json");
$dbInstance = new Database();
$db = $dbInstance->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case "GET":
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("SELECT *FROM cartPage cpJOIN Users u ON cp.userId = u.idWHERE cp.userId = ?");

        $stmt->execute([$id]);


        exit;
}



?>