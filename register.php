<?php
header("Content-Type: application/json");
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

$hashPassword = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO users (email, passwordHash) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $email, $hashPassword);

if ($stmt->execute()) {
    echo json_encode(["success" => "User registered"]);
} else {
    echo json_encode(["error" => "Registration failed"]);
}
?>