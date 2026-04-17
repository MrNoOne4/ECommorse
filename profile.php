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

    // ========================
    // GET PROFILE
    // ========================
    case "GET":

        $stmt = $db->prepare("
            SELECT Users.email, backgroundFirst, backgroundSecond, textColor
            FROM Users
            LEFT JOIN customProfile ON Users.ID = customProfile.userId
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

    // ========================
    // DELETE ACCOUNT
    // ========================
    case "DELETE":

        $db->begin_transaction();

        try {
            // ONLY delete user (cascade handles customProfile)
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

    // ========================
    // UPDATE (PATCH)
    // ========================
    case "PATCH":

        $action = $_GET["action"] ?? "";
        $data = json_decode(file_get_contents("php://input"), true);

        // -------- UPDATE EMAIL --------
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

        // -------- UPDATE COLORS --------
        if ($action === "updateColor") {

            $backgroundFirst = trim($data["backgroundFirst"] ?? "");
            $backgroundSecond = trim($data["backgroundSecond"] ?? "");
            $color = trim($data["color"] ?? "");

            // Ensure row exists (important!)
            $db->query("
                INSERT INTO customProfile (userId)
                VALUES ($id)
                ON DUPLICATE KEY UPDATE userId = userId
            ");

            $stmt = $db->prepare("
                UPDATE customProfile
                SET backgroundFirst = ?, backgroundSecond = ?, textColor = ?
                WHERE userId = ?
            ");

            $stmt->bind_param("sssi", $backgroundFirst, $backgroundSecond, $color, $id);

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