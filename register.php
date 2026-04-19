<?php
session_start();
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");

$data = json_decode(file_get_contents("php://input"), true);

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed"]));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(["error" => "Invalid request method"]));
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(["error" => "Invalid email format"]));
}

if (strlen($password) < 6) {
    http_response_code(400);
    die(json_encode(["error" => "Password too weak"]));
}

$hashPassword = password_hash($password, PASSWORD_DEFAULT);

$conn->begin_transaction();

try {
    // Insert user
    $stmt = $conn->prepare(
        "INSERT INTO users (email, passwordHash, role) VALUES (?, ?, 'user')"
    );
    $stmt->bind_param("ss", $email, $hashPassword);

    if (!$stmt->execute()) {
        throw new Exception("User insert failed");
    }

    $userId = $conn->insert_id;

    // Insert profile
    $stmtt = $conn->prepare(
        "INSERT INTO customProfile (userId, backgroundFirst, backgroundSecond, textColor)
         VALUES (?, ?, ?, ?)"
    );

    $bg1 = "#333333";
    $bg2 = "#212121";
    $text = "#FFFFFF";

    $stmtt->bind_param("isss", $userId, $bg1, $bg2, $text);

    if (!$stmtt->execute()) {
        throw new Exception("Profile creation failed");
    }

    $conn->commit();

    session_regenerate_id(true);
    $_SESSION["user"] = [
        "ID" => $userId,
        "email" => $email,
        "role" => "user"
    ];

    echo json_encode([
        "success" => true,
        "message" => "User registered successfully"
    ]);

} catch (Exception $e) {
    $conn->rollback();

    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>