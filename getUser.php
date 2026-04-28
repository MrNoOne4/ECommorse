<?php
require_once "db.php";

header("Content-Type: application/json");

$dbInstance = new Database();
$db = $dbInstance->getConnection();

$email = trim($_GET['email'] ?? '');

if (empty($email)) {
    exit(json_encode(["error" => "Email is required"]));
}

$sql = "SELECT id, email FROM Users WHERE email = ?";
$stmt = $db->prepare($sql);

if (!$stmt) {
    exit(json_encode(["error" => "Database error"])); // FIX: don't expose $db->error to client
}

$stmt->bind_param("s", $email);

$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["found" => true, "account" => ["id" => $row["id"], "email" => $row["email"]]]);
} else {
    echo json_encode(["found" => false]);
}

$stmt->close();
$db->close();
?>