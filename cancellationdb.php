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

        $cancelationId = intval($data['cancelationId'] ?? 0);
        $productId  = intval($data['productId'] ?? 0);
        $referenceCode = trim($data['referenceCode'] ?? '');
        $status = trim($data['status'] ?? '');

        if (!$cancelationId || !$productId || !$referenceCode || !$status) {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        $conn->begin_transaction();

        try {

            $check = $conn->prepare("
                SELECT c.cancellationId
                FROM cancellations c
                WHERE c.cancellationId = ?
            ");
            $check->bind_param("i", $cancelationId);
            $check->execute();
            $result = $check->get_result();

            if ($result->num_rows === 0) {
                throw new Exception("Cancellation not found");
            }

            if ($status === "Accepted") {

                $stmt = $conn->prepare("
                    UPDATE order_items 
                    SET refundStatus = 'Refund Accepted' 
                    WHERE referenceCode = ? AND productId = ?
                ");
                $stmt->bind_param("si", $referenceCode, $productId);

                if (!$stmt->execute() || $stmt->affected_rows === 0) {
                    throw new Exception("Order item not found or not updated");
                }

                $updateStock = $conn->prepare("
                    UPDATE products p
                    JOIN cancellations c ON p.productId = c.productId
                    JOIN order_items oi ON c.orderItemId = oi.orderItemId
                    SET p.stock = p.stock + oi.quantity
                    WHERE c.cancellationId = ?
                ");
                $updateStock->bind_param("i", $cancelationId);

                if (!$updateStock->execute() || $updateStock->affected_rows === 0) {
                    throw new Exception("Stock update failed (product may not exist)");
                }

                $delete = $conn->prepare("DELETE FROM cancellations WHERE cancellationId = ?");
                $delete->bind_param("i", $cancelationId);
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
                    WHERE referenceCode = ? AND productId = ?
                ");
                $stmt->bind_param("si", $referenceCode, $productId);

                if (!$stmt->execute() || $stmt->affected_rows === 0) {
                    throw new Exception("Order item not found or not updated");
                }

                $delete = $conn->prepare("DELETE FROM cancellations WHERE cancellationId = ?");
                $delete->bind_param("i", $cancelationId);
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