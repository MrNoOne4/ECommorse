<?php
require_once "db.php";

header("Content-Type: application/json");

$dbInstance = new Database();
$conn = $dbInstance->getConnection();

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

$sql .= " ORDER BY productId DESC";

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
$conn->close();
?>