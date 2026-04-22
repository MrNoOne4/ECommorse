<?php
require_once "db.php";

session_start();

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if (!isset($_SESSION["user"]) || $_SESSION["user"]["role"] !== "admin") {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$dbInstance = new Database();
$db = $dbInstance->getConnection();

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $id = $_GET['id'] ?? null;

        if (!empty($id)) {
            $stmt = $db->prepare("SELECT * FROM products WHERE productId = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $result = $stmt->get_result();
            $product = $result->fetch_assoc();

            $stmt->close();

            if ($product) {
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Product not found"]);
            }
            exit;
        }

        $sql = "SELECT * FROM products WHERE 1=1";
        $params = [];
        $types = "";

        $price = $_GET['price'] ?? '';
        $search = $_GET['search'] ?? '';

        if (!empty($search)) {
            $sql .= " AND name LIKE ?";
            $params[] = "%" . $search . "%";
            $types .= "s";
        }

        if (!empty($price) && in_array($price, ['Low', 'Medium', 'High'])) {
            if ($price === 'Low') {
                $sql .= " AND price < ?";
                $params[] = 100;
                $types .= "i";
            } elseif ($price === 'Medium') {
                $sql .= " AND price BETWEEN ? AND ?";
                $params[] = 100;
                $params[] = 500;
                $types .= "ii";
            } elseif ($price === 'High') {
                $sql .= " AND price > ?";
                $params[] = 500;
                $types .= "i";
            }
        }

        $stmt = $db->prepare($sql);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        $stmt->close();
        echo json_encode($products);
        exit;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        $name = trim($data['name'] ?? '');
        $price = (float)($data['price'] ?? 0);
        $category = (string)($data['category'] ?? '');
        $stock = (int)($data['stock'] ?? 0);
        $img = trim($data['img'] ?? '');
        $description = trim($data['description'] ?? '');

        $stmt = $db->prepare("
            INSERT INTO products (name, price, category, stock, img, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param("sdssss", $name, $price, $category, $stock, $img, $description);

        if (!$stmt->execute()) {
            jsonResponse(["error" => "Insert failed", "details" => $stmt->error], 500);
        }

        jsonResponse(["message" => "Product added successfully", "productId" => $stmt->insert_id], 201);

    case 'PATCH':
        $id = $_GET['id'] ?? null;

        if (empty($id)) {
            jsonResponse(["error" => "Missing product ID"], 400);
        }

        $stmt = $db->prepare("SELECT * FROM products WHERE productId = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        $current = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$current) {
            jsonResponse(["error" => "Product not found"], 404);
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $name = $data['name'] ?? $current['name'];
        $price = (float)($data['price'] ?? $current['price']);
        $category = (string)($data['category'] ?? $current['category']);
        $stock = (int)($data['stock']  ?? $current['stock']);
        $img = $data['img'] ?? $current['img'];
        $description = $data['description'] ?? $current['description'];
        $id = (int) $id;
        $stmt = $db->prepare("
            UPDATE products
            SET name = ?, price = ?, category = ?, stock = ?, img = ?, description = ?
            WHERE productId = ?
        ");

        $stmt->bind_param("sdssssi", $name, $price, $category, $stock, $img, $description, $id);
        $stmt->execute();

        jsonResponse(["message" => "Product updated successfully"]);

        case 'DELETE':
            $id = $_GET['id'] ?? null;

            if ($id !== null && is_numeric($id)) {
                $id = (int)$id;

                $stmt = $db->prepare("DELETE FROM products WHERE productId = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();

                if ($stmt->affected_rows === 0) {
                    jsonResponse(["error" => "Product not found"], 404);
                }

                $stmt->close();
                jsonResponse(["message" => "Product deleted", "id" => $id]);
            }

            $db->query("DELETE FROM products");
            jsonResponse(["message" => "All products deleted"]);

            default:    
        jsonResponse(["error" => "Method not allowed"], 405);
}

$db->close();