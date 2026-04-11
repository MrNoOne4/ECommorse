<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "M@thew11!", "ECommorse");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$sql = "SELECT * FROM products WHERE 1=1";

$category = $_GET['category'] ?? 'all';
$search = $_GET['search'] ?? '';

if (!empty($search)) {
    $search = $conn->real_escape_string($search);
    $sql .= " AND name LIKE '%$search%'";
}


if ($category !== "all" && !empty($category)) {
    $category = $conn->real_escape_string($category);
    $sql .= " AND category = '$category'";
}

$result = $conn->query($sql);

$products = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

echo json_encode($products);

$conn->close();
?>