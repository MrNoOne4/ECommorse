<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection Failed"]));
}

$sql = "SELECT * FROM products WHERE 1=1";
$params = [];
$types = "";

// Get inputs
$search = $_GET['search'] ?? '';
$price = $_GET['price'] ?? '';

// Build query safely
if (!empty($search)) {
    $sql .= " AND name LIKE ?";
    $params[] = "%$search%";
    $types .= "s";
}

if (!empty($price)) {
    $sql .= " AND price = ?";
    $params[] = $price;
    $types .= "d"; // or "i" depending on your column type
}

// Prepare statement
$stmt = $conn->prepare($sql);

// Bind if there are parameters
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

// Execute
$stmt->execute();
$result = $stmt->get_result();

// Fetch results
$products = [];

while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

echo json_encode($products);

$conn->close();
?>