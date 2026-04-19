<?php
require_once "db.php";
header("Content-Type: application/json");

$dbInstance = new Database();
$db = $dbInstance->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

function getProductStock($db, $productId) {
    $stmt = $db->prepare("SELECT stock FROM products WHERE productId = ?");
    if (!$stmt) return false;

    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        return (int)$row['stock'];
    }
    return null;
}

switch ($method) {

    case "GET":
        $id = $_GET['id'] ?? null;

        if (!empty($id)) {
            $stmt = $db->prepare("
                SELECT 
                    c.productId,
                    c.quantity,
                    p.name AS productName,
                    p.img AS productImg,
                    p.price AS productPrice
                FROM cart c
                JOIN products p ON c.productId = p.productId
                WHERE c.userId = ?
            ");

            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            $cart = [];
            while ($row = $result->fetch_assoc()) {
                $row['productQuantity'] = $row['quantity'];
                $cart[] = $row;
            }

            echo json_encode($cart);
        }
        break;

    case "POST":
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = $data['userId'];
        $productId = $data['productId'];

        $stock = getProductStock($db, $productId);

        if ($stock === false) {
            http_response_code(500);
            echo json_encode(["error" => "Database error"]);
            exit;
        }

        if ($stock <= 0) {
            echo json_encode(["error" => "Out of stock"]);
            exit;
        }

        $check = $db->prepare("
            SELECT quantity FROM cart 
            WHERE userId = ? AND productId = ?
        ");

        $check->bind_param("ii", $userId, $productId);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            $stmt = $db->prepare("
                UPDATE cart 
                SET quantity = quantity + 1 
                WHERE userId = ? AND productId = ?
            ");
        } else {
            $stmt = $db->prepare("
                INSERT INTO cart (userId, productId, quantity)
                VALUES (?, ?, 1)
            ");
        }

        if ($result->num_rows > 0) {
            $stmt->bind_param("ii", $userId, $productId);
        } else {
            $stmt->bind_param("ii", $userId, $productId);
        }

        if ($stmt->execute()) {

            $updateStock = $db->prepare("
                UPDATE products 
                SET stock = stock - 1 
                WHERE productId = ?
            ");
            $updateStock->bind_param("i", $productId);
            $updateStock->execute();

            echo json_encode(["success" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Database error"]);
        }
        break;

    case "DELETE":
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = $data['userId'];
        $productId = $data['productId'];
        $quantity = $data['quantity'];

        $stmt = $db->prepare("
            DELETE FROM cart 
            WHERE userId = ? AND productId = ?
        ");

        $stmt->bind_param("ii", $userId, $productId);
        $stmt->execute();

        $updateStock = $db->prepare("
                UPDATE products 
                SET stock = stock + ? 
                WHERE productId = ?
        ");

            $updateStock->bind_param("ii", $quantity, $productId);
            $updateStock->execute();

        echo json_encode(["success" => true]);
        break;

        case "PUT":

        $data = json_decode(file_get_contents("php://input"), true);
        $action = $_GET['action'] ?? null;
        $userId = $data['userId'];
        $productId = $data['productId'];

        $getCart = $db->prepare("
            SELECT quantity FROM cart 
            WHERE userId = ? AND productId = ?
        ");

        $getCart->bind_param("ii", $userId, $productId);
        $getCart->execute();
        $result = $getCart->get_result();

        if (!$row = $result->fetch_assoc()) {
            echo json_encode(["error" => "Cart item not found"]);
            exit;
        }

        $currentQty = (int)$row['quantity'];

        if ($action === "increase") {
            $stock = getProductStock($db, $productId);
            if ($stock <= 0) {
                echo json_encode(["error" => "Out of stock"]);
                exit;
            }

            $newQty = $currentQty + 1;
            $stockChange = -1;

        } elseif ($action === "decrease") {
            $newQty = $currentQty - 1;
            $stockChange = +1;

            if ($newQty < 0) {
                echo json_encode(["error" => "Quantity cannot go below 0"]);
                exit;
            }

        } else {
            echo json_encode(["error" => "Invalid action"]);
            exit;
        }

        if ($newQty <= 0) {
            $stmt = $db->prepare("
                DELETE FROM cart 
                WHERE userId = ? AND productId = ?
            ");
            $stmt->bind_param("ii", $userId, $productId);
        } else {
            $stmt = $db->prepare("
                UPDATE cart 
                SET quantity = ? 
                WHERE userId = ? AND productId = ?
            ");
            $stmt->bind_param("iii", $newQty, $userId, $productId);
        }

        if ($stmt->execute()) {

            $updateStock = $db->prepare("
                UPDATE products 
                SET stock = stock + ? 
                WHERE productId = ?
            ");

            $updateStock->bind_param("ii", $stockChange, $productId);
            $updateStock->execute();

            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Update failed"]);
        }

    break;
}
?>