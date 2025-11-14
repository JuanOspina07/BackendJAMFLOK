const mysql = require("mysql2/promise");
const { HOST, DATABASE, USER, PASSWORD } = require("../config/env");

const pool = mysql.createPool({
  host: HOST,
  database: DATABASE,
  user: USER,
  password: PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;