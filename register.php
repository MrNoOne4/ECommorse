<?php
session_start();
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0");

$data = json_decode(file_get_contents("php://input"), true);

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Invalid request method"]));
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    die(json_encode(["error" => "Email and password are required"]));
}

if (strlen($password) < 6) {
    die(json_encode(["error" => "Password too weak"]));
}

$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$res = $check->get_result();

if ($res->num_rows > 0) {
    echo json_encode(["error" => "Email already exists"]);
    exit;
}

$hashPassword = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO users (email, passwordHash, role) VALUES (?, ?, 'user')";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $email, $hashPassword);

if ($stmt->execute()) {

    session_regenerate_id(true);

    $_SESSION["user"] = [
        "email" => $email,
        "role" => "user"
    ];

    echo json_encode([
        "success" => true,
        "message" => "User registered successfully"
    ]);
} else {
    echo json_encode(["error" => "Registration failed"]);
}


?>