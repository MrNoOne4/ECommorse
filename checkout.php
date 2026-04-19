<?php
require_once "db.php";
session_start();

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$dbInstance = new Database();
$db = $dbInstance->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

$userId      = $_SESSION["user"]["ID"];
$name        = trim($data['name']        ?? '');
$email       = trim($data['email']       ?? '');
$city        = trim($data['city']        ?? '');
$municipality = trim($data['municipality'] ?? '');
$phone       = trim($data['phone']       ?? '');
$payment     = trim($data['paymentMethod'] ?? '');

// Basic validation
if (!$name || !$email || !$phone || !$payment) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required delivery details"]);
    exit;
}

// Fetch the user's cart with product details
$stmt = $db->prepare("
    SELECT c.productId, c.quantity, p.price, p.stock, p.name AS productName
    FROM cart c
    JOIN products p ON c.productId = p.productId
    WHERE c.userId = ?
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$cartItems = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

if (empty($cartItems)) {
    http_response_code(400);
    echo json_encode(["error" => "Cart is empty"]);
    exit;
}

// Check stock availability before doing anything
foreach ($cartItems as $item) {
    if ($item['quantity'] > $item['stock']) {
        http_response_code(409);
        echo json_encode([
            "error" => "Insufficient stock for: " . $item['productName'],
            "available" => $item['stock'],
            "requested" => $item['quantity']
        ]);
        exit;
    }
}

// Calculate total (subtotal + ₱50 shipping)
$subtotal = 0;
foreach ($cartItems as $item) {
    $subtotal += $item['price'] * $item['quantity'];
}
$total = $subtotal + 50;

// Begin transaction — all steps must succeed or all roll back
$db->begin_transaction();

try {
    // 1. Create the order record
    $stmt = $db->prepare("
        INSERT INTO orders (userId, total, name, email, city, municipality, phone, paymentMethod)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("idssssss", $userId, $total, $name, $email, $city, $municipality, $phone, $payment);
    $stmt->execute();
    $orderId = $db->insert_id;
    $stmt->close();

    // 2. Insert each cart item into order_items and reduce stock
    $itemStmt = $db->prepare("
        INSERT INTO order_items (orderId, productId, quantity, price)
        VALUES (?, ?, ?, ?)
    ");
    $stockStmt = $db->prepare("
        UPDATE products SET stock = stock - ? WHERE productId = ?
    ");

    foreach ($cartItems as $item) {
        $itemStmt->bind_param("iiid", $orderId, $item['productId'], $item['quantity'], $item['price']);
        $itemStmt->execute();

        $stockStmt->bind_param("ii", $item['quantity'], $item['productId']);
        $stockStmt->execute();
    }

    $itemStmt->close();
    $stockStmt->close();

    // 3. Clear the user's cart
    $clearStmt = $db->prepare("DELETE FROM cart WHERE userId = ?");
    $clearStmt->bind_param("i", $userId);
    $clearStmt->execute();
    $clearStmt->close();

    $db->commit();

    echo json_encode([
        "success" => true,
        "message" => "Order placed successfully",
        "orderId" => $orderId,
        "total"   => $total
    ]);

} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode([
        "error"   => "Checkout failed",
        "details" => $e->getMessage()
    ]);
}

$db->close();
?>