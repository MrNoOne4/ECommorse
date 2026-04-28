<?php
require_once "db.php";
session_start();

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate"); 
header("Pragma: no-cache"); 
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Invalid request method"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode(["error" => "Email and password are required"]);
    exit;
}

$dbInstance = new Database();
$db = $dbInstance->getConnection();

$sql  = "SELECT id, email, passwordHash, role FROM users WHERE email = ?";
$stmt = $db->prepare($sql);

if (!$stmt) {
    echo json_encode(["error" => "Database error"]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row['passwordHash'])) {

        session_regenerate_id(true);

        $_SESSION["user"] = [
            "ID"    => $row["id"],
            "email" => $row["email"],
            "role"  => $row["role"]
        ];

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "role"    => strtolower(trim($row['role']))
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
?>