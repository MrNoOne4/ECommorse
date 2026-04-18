<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection Failed"]));
}

$sql = "SELECT * FROM products WHERE 1=1";
$params = [];
$types = "";

$search   = $_GET['search']   ?? '';
$category = $_GET['category'] ?? '';

if (!empty($search)) {
    $sql .= " AND name LIKE ?";
    $params[] = "%" . $search . "%";
    $types   .= "s";
}

if (!empty($category) && $category !== 'all') {
    $sql .= " AND category = ?";
    $params[] = $category;
    $types   .= "s";
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

$conn->close();
?>