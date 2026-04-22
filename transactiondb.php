<?php
require_once "db.php";

session_start();

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if (!isset($_SESSION["user"]) || $_SESSION["user"]["role"] !== "admin") {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$dbInstance = new Database();
$db = $dbInstance->getConnection();

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

case "GET":

    $limit = 10;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $limit;

    $query = "
        SELECT 
            o.createdAt AS date,
            p.name AS productName,
            oi.referenceCode,
            oi.productId,
            oi.quantity,
            oi.price,
            oi.total AS totalSales
        FROM order_items oi
        JOIN orders o ON oi.orderId = o.orderId
        JOIN products p ON oi.productId = p.productId AND (oi.refundStatus = 'Pending' OR oi.refundStatus = 'Delivered' OR oi.refundStatus = 'Refund Decline') 
        ORDER BY o.createdAt DESC
        LIMIT $limit OFFSET $offset
    ";

    $result = $db->query($query);

    if (!$result) {
        jsonResponse(["error" => "Query failed"], 500);
    }

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    jsonResponse($data);

    break;
}

$db->close();