<?php

class Database {
    private $host = "localhost";
    private $user = "root";
    private $pass = "M@thew11!";
    private $dbname = "ECommorse";
    private $connection;

    public function __construct() {
        $this->connection = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->dbname
        );

        if ($this->connection->connect_error) {
            http_response_code(500);
            echo json_encode(["error" => "Database connection failed"]);
            exit;
        }
    }

    public function getConnection() {
        return $this->connection;
    }
}
?>