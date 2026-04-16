<?php
require_once "db.php";
session_start();
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0");

$data = json_decode(file_get_contents("php://input"), true);

$dbInstance = new Database();
$db = $dbInstance->getConnection();



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

$sql = "SELECT email, passwordHash, role FROM users WHERE email = ?";
$stmt = $db->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {

    if (password_verify($password, $row['passwordHash'])) {

        $_SESSION[$row['role']] = [
            "email" => $row['email'],
            "role" => $row['role']
        ];

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "role" => $row['role']
        ]);
        exit;

    } else {
        echo json_encode(["error" => "Invalid password"]);
        exit;
    }

} else {
    echo json_encode(["error" => "User not found"]);
    exit;
}