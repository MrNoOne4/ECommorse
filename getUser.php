<?php
require_once "db.php";

header("Content-Type: application/json");

$dbInstance = new Database();
$db = $dbInstance->getConnection();

$email = trim($_POST['email'] ?? '');
if (empty($email)) {
    exit(json_encode(["error" => "Email is required"]));
}

$sql = "SELECT id, email FROM Users WHERE email = ?";
$stmt = $db->prepare($sql);

if (!$stmt) {
    exit(json_encode(["error" => $db->error]));
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "found" => true,
        "user" => [
            "id" => $row["id"],
            "email" => $row["email"]
        ]
    ]);
} else {
    echo json_encode([
        "found" => false
    ]);
}

$stmt->close();
$db->close();
?>