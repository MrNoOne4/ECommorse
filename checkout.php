<?php
error_reporting(0);
ini_set('display_errors', 0);

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

function generateReferenceCode() {
    $code = "#";
    for ($i = 0; $i < 11; $i++) {
        $code .= random_int(0, 9);
    }
    return $code;
}

$conn->autocommit(false);

try {

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "POST") {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['cart'])) {
        throw new Exception("Invalid input");
    }

    $userId = $_SESSION["user"]["id"] ?? $_SESSION["user"]["ID"] ?? $_SESSION["user"]["userId"];

    if (!$userId) {
        throw new Exception("Invalid session user");
    }

    $cart = $data['cart'];

    if (empty($cart)) {
        throw new Exception("Cart is empty");
    }

    $receipt = "R-" . time();
    $total = 0;

    $orderStmt = $conn->prepare("INSERT INTO orders (receipt, userId, total) VALUES (?, ?, ?)");
    if (!$orderStmt) throw new Exception($conn->error);

    $zero = 0;
    $orderStmt->bind_param("sid", $receipt, $userId, $zero);
    $orderStmt->execute();

    $orderId = $conn->insert_id;

    $itemStmt = $conn->prepare("
        INSERT INTO order_items
        (orderId, userId, productId, referenceCode, price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$itemStmt) throw new Exception($conn->error);

    foreach ($cart as $item) {

        $productId = $item['productId'];
        $quantity = $item['quantity'] ?? $item['productQuantity'];

        $pstmt = $conn->prepare("SELECT price FROM products WHERE productId = ?");
        if (!$pstmt) throw new Exception($conn->error);

        $pstmt->bind_param("i", $productId);
        $pstmt->execute();

        $res = $pstmt->get_result()->fetch_assoc();

        if (!$res) {
            throw new Exception("Product not found: " . $productId);
        }

        $price = $res['price'];
        $itemTotal = $price * $quantity;
        $total += $itemTotal;

        $refCode = generateReferenceCode();

        $itemStmt->bind_param(
            "iiisdid",
            $orderId,
            $userId,
            $productId,
            $refCode,
            $price,
            $quantity,
            $itemTotal
        );

        if (!$itemStmt->execute()) {
            throw new Exception($itemStmt->error);
        }
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
}

elseif ($method === "GET") {

    $userId = $_SESSION["user"]["id"] ?? $_SESSION["user"]["ID"] ?? $_SESSION["user"]["userId"];

    if (!$userId) {
        throw new Exception("Invalid session user");
    }

    $stmt = $conn->prepare("
        SELECT 
            oi.userId,
            oi.productId,
            p.name AS productName,
            oi.quantity,
            oi.price,
            oi.orderItemId,
            p.category,
            oi.refundRequest,
            oi.referenceCode,
            oi.refundStatus,
            oi.total,
            oi.createdAt,
            p.img
        FROM order_items oi
        JOIN products p ON oi.productId = p.productId
        WHERE oi.userId = ?
    ");

    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $result = $stmt->get_result();
    $rows = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode($rows);
}

$conn->commit();

} catch (Exception $e) {

$conn->rollback();

http_response_code(500);

echo json_encode([
    "error" => "Checkout failed",
    "details" => $e->getMessage()
]);

}

$conn->close();
?>