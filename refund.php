<?php
require_once "db.php";

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$dbInstance = new Database();
$conn = $dbInstance->getConnection();

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case "GET":

    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);

        $stmt = $conn->prepare("
            SELECT c.*, u.email, p.name AS productName
            FROM cancellations c
            JOIN Users u ON c.userId = u.id
            JOIN products p ON c.productId = p.productId
            WHERE c.cancellationId = ?
        ");

        $stmt->bind_param("i", $id);
        $stmt->execute();

        $result = $stmt->get_result();
        $data = $result->fetch_assoc();

        echo json_encode($data);
        exit;
    }

        // $result = $conn->query("
        //     SELECT 
        //         c.cancellationId AS id,
        //         oi.referenceCode,
        //         p.name AS product,
        //         u.email AS user,
        //         c.reason,
        //         c.createdAt AS date,
        //         oi.refundStatus AS action
        //     FROM cancellations c
        //     JOIN order_items oi ON c.orderItemId = oi.orderItemId
        //     JOIN Users u ON oi.userId = u.id
        //     JOIN products p ON oi.productId = p.productId AND oi.refundStatus = 'Pending'
        //     ORDER BY c.createdAt DESC
        // ");


        $result = $conn->query("
            SELECT 
                c.cancellationId,
                c.orderItemId,
                oi.referenceCode,
                p.name AS product,
                u.email AS user,
                c.reason,
                c.createdAt AS date,
                oi.refundStatus AS status
            FROM cancellations c
            JOIN order_items oi ON c.orderItemId = oi.orderItemId
            JOIN Users u ON oi.userId = u.id
            JOIN products p ON oi.productId = p.productId AND oi.refundStatus = 'Pending'
            ORDER BY c.createdAt DESC
        ");

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode($rows);
    break;

    case "POST":

        $data = json_decode(file_get_contents("php://input"), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON"
            ]);
            exit;
        }

        $refund = $data['refundInfo'] ?? $data;

        if (!$refund) {
            echo json_encode([
                "success" => false,
                "message" => "No refund data received"
            ]);
            exit;
        }

        $orderItemId   = $refund['orderItemId'] ?? null;
        $userId  = $refund['userId'] ?? null;
        $productId = $refund['productId'] ?? null;
        $referenceCode = $refund['referenceCode'] ?? null;
        $reason = $refund['reason'] ?? null;

        if (
            !$orderItemId ||
            !$userId ||
            !$productId ||
            !$referenceCode ||
            !$reason
        ) {
            echo json_encode([
                "success" => false,
                "message" => "Missing required fields"
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            INSERT INTO cancellations 
            (orderItemId, userId, productId, referenceCode, reason) 
            VALUES (?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Prepare failed: " . $conn->error
            ]);
            exit;
        }

        $stmt->bind_param(
            "iiiss",
            $orderItemId,
            $userId,
            $productId,
            $referenceCode,
            $reason
        );

        if (!$stmt->execute()) {
            echo json_encode([
                "success" => false,
                "message" => "Insert failed: " . $stmt->error
            ]);
            exit;
        }

        $update = $conn->prepare("
            UPDATE order_items 
            SET refundRequest = 1, refundStatus = 'Pending'
            WHERE orderItemId = ?
        ");

        if (!$update) {
            echo json_encode([
                "success" => false,
                "message" => "Update prepare failed: " . $conn->error
            ]);
            exit;
        }

        $update->bind_param("i", $orderItemId);

        if (!$update->execute()) {
            echo json_encode([
                "success" => false,
                "message" => "Update failed: " . $update->error
            ]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "Refund request submitted"
        ]);

        break;

        case "PATCH":

            $data = json_decode(file_get_contents("php://input"), true);

            $id = $data['id'] ?? null;
            $status = $data['status'] ?? null;

            if (!$id || !$status) {
                echo json_encode([
                    "success" => false,
                    "message" => "Missing data"
                ]);
                exit;
            }

        // get orderItemId from cancellation
        $stmt = $conn->prepare("SELECT orderItemId FROM cancellations WHERE cancellationId = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if (!$row) {
            echo json_encode([
                "success" => false,
                "message" => "Cancellation not found"
            ]);
            exit;
        }

    $orderItemId = $row['orderItemId'];

    // update order_items status
    $update = $conn->prepare("
        UPDATE order_items 
        SET refundStatus = ?
        WHERE orderItemId = ?
    ");

    $update->bind_param("si", $status, $orderItemId);

    if (!$update->execute()) {
        echo json_encode([
            "success" => false,
            "message" => "Update failed"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Status updated"
    ]);

    break;
    
    default:
        echo json_encode([
            "success" => false,
            "message" => "Invalid request method"
        ]);
        break;
}
?>