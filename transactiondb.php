<?php
require_once "db.php";

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

session_start();

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

        $limit  = 10;
        $page   = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;

       
        $stmt = $db->prepare("
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
            JOIN products p ON oi.productId = p.productId
            WHERE oi.refundStatus IN ('Pending', 'Delivered', 'Refund Decline')
            ORDER BY o.createdAt DESC
            LIMIT ? OFFSET ?
        ");

        if (!$stmt) {
            jsonResponse(["error" => "Query preparation failed"], 500);
        }

        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();

        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        jsonResponse($data);
        break;

    default:
        jsonResponse(["error" => "Method not allowed"], 405);
        break;
}

$db->close();
?>