<?php
session_start();

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$dbInstance = new Database();
$db = $dbInstance->getConnection();

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $email = $_SESSION["user"]["email"];
        $stmt = $db->prepare("SELECT email, role FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["error" => "User not found"]);
            exit;
        }
        $user = $result->fetch_assoc();
        echo json_encode(["user" => $user]);
        break;

}

?>