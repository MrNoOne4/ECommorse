<?php
require_once "db.php";

header("Content-Type: application/json");



$dbInstance = new Database();
$conn = $dbInstance->getConnection();


$method = $_SERVER['REQUEST_METHOD'];


    switch ($method) {
    case "GET":
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
        break;

case "PATCH":
    $data = json_decode(file_get_contents("php://input"), true);

    $cancellationId = intval($data['cancellationId'] ?? 0);
    $orderItemId = intval($data['orderItemId'] ?? 0);
    $status  = trim($data['status'] ?? '');

    if (!$cancellationId || !$orderItemId || !$status) {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
    }

    $conn->begin_transaction();

    try {

        $check = $conn->prepare("
            SELECT cancellationId 
            FROM cancellations 
            WHERE cancellationId = ?
        ");
        $check->bind_param("i", $cancellationId);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows === 0) {
            throw new Exception("Cancellation not found");
        }

        if ($status === "Accepted") {

            $stmt = $conn->prepare("
                UPDATE order_items 
                SET refundStatus = 'Refund Accepted' 
                WHERE orderItemId = ?
            ");
            $stmt->bind_param("i", $orderItemId);

            if (!$stmt->execute()) {
                throw new Exception("Update failed: " . $stmt->error);
            }

            $updateStock = $conn->prepare("
                UPDATE products p
                JOIN order_items oi ON p.productId = oi.productId
                SET p.stock = p.stock + oi.quantity
                WHERE oi.orderItemId = ?
            ");
            $updateStock->bind_param("i", $orderItemId);

            if (!$updateStock->execute()) {
                throw new Exception("Stock update failed: " . $updateStock->error);
            }

            $delete = $conn->prepare("
                DELETE FROM cancellations 
                WHERE cancellationId = ?
            ");
            $delete->bind_param("i", $cancellationId);
            $delete->execute();

            $conn->commit();

            echo json_encode([
                "success" => true,
                "message" => "Refund accepted and stock restored"
            ]);

        } else if ($status === "Decline") {

            $stmt = $conn->prepare("
                UPDATE order_items 
                SET refundStatus = 'Refund Decline' 
                WHERE orderItemId = ?
            ");
            
            $stmt->bind_param("i", $orderItemId);

            if (!$stmt->execute()) {
                throw new Exception("Update failed: " . $stmt->error);
            }

            $delete = $conn->prepare("
                DELETE FROM cancellations 
                WHERE cancellationId = ?
            ");
            $delete->bind_param("i", $cancellationId);
            $delete->execute();

            $conn->commit();

            echo json_encode([
                "success" => true,
                "message" => "Refund declined"
            ]);
        }

    } catch (Exception $e) {
        $conn->rollback();

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }

    break;
    }
?>