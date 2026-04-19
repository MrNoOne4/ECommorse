<?php
require_once "db.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

$conn->begin_transaction();

try {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['userId'], $data['cart'])) {
        throw new Exception("Invalid input");
    }

    $userId = $data['userId'];
    $cart = $data['cart'];

    if (empty($cart)) {
        throw new Exception("Cart is empty");
    }

    $receipt = "R-" . time();
    $total = 0;

    $orderStmt = $conn->prepare("
        INSERT INTO orders (receipt, userId, total)
        VALUES (?, ?, ?)
    ");

    $zero = 0;
    $orderStmt->bind_param("sid", $receipt, $userId, $zero);
    $orderStmt->execute();

    $orderId = $conn->insert_id;

    $itemStmt = $conn->prepare("
        INSERT INTO order_items
        (orderId, userId, productId, price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($cart as $item) {

        $productId = $item['productId'];
        $quantity = $item['quantity'] ?? $item['productQuantity'];
        $price = $item['productPrice'];

        $itemTotal = $price * $quantity;
        $total += $itemTotal;

        $itemStmt->bind_param(
            "iiidid",
            $orderId,
            $userId,
            $productId,
            $price,
            $quantity,
            $itemTotal
        );

        $itemStmt->execute();
    }

    $update = $conn->prepare("UPDATE orders SET total = ? WHERE orderId = ?");
    $update->bind_param("di", $total, $orderId);
    $update->execute();

    $clear = $conn->prepare("DELETE FROM cart WHERE userId = ?");
    $clear->bind_param("i", $userId);
    $clear->execute();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "orderId" => $orderId,
        "total" => $total
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);
    echo json_encode([
        "error" => "Checkout failed",
        "details" => $e->getMessage()
    ]);
}
?>