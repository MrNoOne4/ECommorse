<?php
require_once "db.php";
session_start();

header("Content-Type: application/json");

$dbInstance = new Database();
$db = $dbInstance->getConnection();

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_SESSION["user"]["ID"];

switch ($method) {

    case "GET":

        $stmt = $db->prepare("
            SELECT 
                Users.email,
                customProfile.backgroundFirst,
                customProfile.backgroundSecond,
                customProfile.textColor
            FROM Users
            LEFT JOIN customProfile 
                ON Users.ID = customProfile.userId
            WHERE Users.ID = ?
        ");

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if (!$row) {
            echo json_encode([
                "user" => [
                    "email" => $_SESSION["user"]["email"],
                    "backgroundFirst" => "#333333",
                    "backgroundSecond" => "#212121",
                    "textColor" => "#ffffff"
                ]
            ]);
            exit;
        }

        echo json_encode(["user" => $row]);
        exit;


    case "DELETE":

        $db->begin_transaction();

        try {
            $stmt = $db->prepare("DELETE FROM customProfile WHERE userId = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $stmt = $db->prepare("DELETE FROM Users WHERE ID = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            if ($stmt->affected_rows === 0) {
                throw new Exception("User not found");
            }

            $db->commit();

            session_destroy();

            echo json_encode([
                "success" => true,
                "message" => "Account deleted"
            ]);

        } catch (Exception $e) {
            $db->rollback();
            http_response_code(500);
            echo json_encode([
                "error" => "Delete failed",
                "details" => $e->getMessage()
            ]);
        }

        exit;


    case "PATCH":

        $action = $_GET["action"] ?? "";
        $data = json_decode(file_get_contents("php://input"), true);

        if ($action === "updateEmail") {

            $email = trim($data["email"] ?? "");

            if (!$email) {
                http_response_code(400);
                echo json_encode(["error" => "Missing email"]);
                exit;
            }

            $check = $db->prepare("SELECT ID FROM Users WHERE email = ? AND ID != ?");
            $check->bind_param("si", $email, $id);
            $check->execute();
            $res = $check->get_result();

            if ($res->num_rows > 0) {
                http_response_code(409);
                echo json_encode(["error" => "Email already in use"]);
                exit;
            }

            $stmt = $db->prepare("UPDATE Users SET email = ? WHERE ID = ?");
            $stmt->bind_param("si", $email, $id);

            if ($stmt->execute()) {
                $_SESSION["user"]["email"] = $email;
                echo json_encode(["success" => true]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Update failed"]);
            }
            exit;
        }

        if ($action === "updateColor") {

            $backgroundFirst = trim($data["backgroundFirst"] ?? "");
            $backgroundSecond = trim($data["backgroundSecond"] ?? "");
            $color = trim($data["color"] ?? "");

            $stmt = $db->prepare("
                INSERT INTO customProfile (userId, backgroundFirst, backgroundSecond, textColor)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    backgroundFirst = VALUES(backgroundFirst),
                    backgroundSecond = VALUES(backgroundSecond),
                    textColor = VALUES(textColor)
            ");

            $stmt->bind_param("isss", $id, $backgroundFirst, $backgroundSecond, $color);

            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Update failed"]);
            }
            exit;
        }

        http_response_code(400);
        echo json_encode(["error" => "Invalid action"]);
        exit;
}