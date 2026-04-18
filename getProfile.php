<?php
require_once "db.php";

header("Content-Type: application/json");

$dbInstance = new Database();
$conn = $dbInstance->getConnection();

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "No JSON received", "raw" => $raw]);
    exit;
}

$userId = $data['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing userId"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT backgroundFirst, backgroundSecond, textColor
    FROM customProfile
    WHERE userId = ?
");

$stmt->bind_param("i", $userId);
$stmt->execute();

$result = $stmt->get_result()->fetch_assoc();

echo json_encode($result ?: []);
?>