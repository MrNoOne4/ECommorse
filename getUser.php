<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$email = trim($_POST['email'] ?? '');
if (empty($email)) {
    die(json_encode(["error" => "Email is required"]));
}

$sql = "SELECT passwordHash FROM Users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "found" => true,
        "account" => $row
    ]);
} else {
    echo json_encode([
        "found" => false
    ]);
}

$stmt->close();
$conn->close();
?>