<?php
require_once "db.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['userId'];
$cart = $data['cart'];

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "DB connection failed"]));
}

$conn->begin_transaction();

try {

    // $receipt = "R" . time();
    // $total = 0;

    // $stmt = $conn->prepare("
    //     INSERT INTO orders (receipt, userId, total)
    //     VALUES (?, ?, ?)
    // ");

    // $zero = 0;
    // $stmt->bind_param("sid", $receipt, $userId, $zero);
    // $stmt->execute();

    // $orderId = $conn->insert_id;

    $itemStmt = $conn->prepare("
        INSERT INTO order_items 
        (userId, productId, price, quantity, total)
        VALUES (?, ?, ?, ?, ?)
    ");

    foreach ($cart as $item) {
        $productId = $item['productId'];
        $quantity = $item['quantity'];
        $price = $item['productPrice'];

        $itemTotal = $price * $quantity;
        $total += $itemTotal;

        $itemStmt->bind_param(
            "iiddi",
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