<?php
session_start();
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Invalid request method"]);
    exit;
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode(["error" => "Email and password are required"]);
    exit;
}

$sql = "SELECT passwordHash FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {

    if (password_verify($password, $row['passwordHash'])) {

        $_SESSION["user"] = [
            "email" => $email
        ];

        echo json_encode([
            "success" => true,
            "message" => "Login successful"
        ]);

    } else {
        echo json_encode(["error" => "Invalid password"]);
    }

} else {
    echo json_encode(["error" => "User not found"]);
}

$conn->close();
?>