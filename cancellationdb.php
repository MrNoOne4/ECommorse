<?php
require_once "db.php";

header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "GET") {

    if (isset($_GET['id'])) {

        $id = intval($_GET['id']);

        $stmt = $conn->prepare("
            SELECT 
                c.cancellationId,
                c.orderItemId,
                c.userId,
                c.productId,
                c.referenceCode,
                c.reason,
                c.createdAt,
                u.email,
                p.img,
                p.price,
                p.category,
                p.name AS productName,
                oi.quantity
            FROM cancellations c
            JOIN Users u ON c.userId = u.id
            JOIN products p ON c.productId = p.productId
            JOIN order_items oi ON c.orderItemId = oi.orderItemId
            WHERE c.cancellationId = ?
        ");

        $stmt->bind_param("i", $id);
        $stmt->execute();

        $result = $stmt->get_result();
        $data = $result->fetch_assoc();

        echo json_encode($data ?: []);
        exit;
    }

    $result = $conn->query("
        SELECT 
            c.cancellationId,
            c.orderItemId,
            c.userId,
            c.productId,
            c.referenceCode,
            c.reason,
            c.createdAt,
            u.email,
            p.name AS productName
        FROM cancellations c
        JOIN Users u ON c.userId = u.id
        JOIN products p ON c.productId = p.productId
        ORDER BY c.createdAt DESC
    ");

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode($rows);
    exit;
}
?>