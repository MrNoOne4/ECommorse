<?php
require_once "db.php";

header("Content-Type: application/json");

$dbInstance = new Database();
$conn = $dbInstance->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

case "GET":

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;

    $countStmt = $conn->prepare("
        SELECT COUNT(*) as total
        FROM order_items oi
        JOIN Users u ON u.id = oi.userId
        JOIN orders o ON oi.orderId = o.orderId
        JOIN products p ON p.productId = oi.productId
        WHERE oi.refundStatus IN ('Refund Decline', 'Refund Accepted')
    ");

    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $totalRows = $countResult->fetch_assoc()['total'];

    $totalPages = ceil($totalRows / $limit);

    $stmt = $conn->prepare("
        SELECT 
            o.createdAt AS date,
            p.name AS productName,
            oi.referenceCode,
            oi.productId,
            oi.quantity,
            oi.price,
            oi.refundStatus,
            u.email,
            oi.total AS totalSales
        FROM order_items oi
        JOIN Users u ON u.id = oi.userId
        JOIN orders o ON oi.orderId = o.orderId
        JOIN products p ON p.productId = oi.productId
        WHERE oi.refundStatus IN ('Refund Decline', 'Refund Accepted')
        ORDER BY o.createdAt DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();

    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $data,
        "pagination" => [
            "currentPage" => $page,
            "totalPages" => $totalPages,
            "totalRows" => $totalRows
        ]
    ]);

    break;
}
?>