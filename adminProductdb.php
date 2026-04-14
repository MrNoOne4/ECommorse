<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection Failed"]));
}

switch ($_SERVER['REQUEST_METHOD']) {

    case 'GET':
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

        $stmt = $conn->prepare($sql);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];

        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        echo json_encode($products);

        $stmt->close(); 
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode(["action" => "create", "data" => $data]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode(["action" => "update", "data" => $data]);
        break;

    case 'DELETE':
          $id = $_GET['id'] ?? null;
         if (!empty($id)) {
            $stmt = $conn->prepare("DELETE FROM products WHERE productId = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["message" => "Product with ID $id deleted"]);

         } else {
            $conn->query("DELETE FROM products");
            echo json_encode(["message" => "All products deleted"]);
         }
        
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}


$conn->close();
?>