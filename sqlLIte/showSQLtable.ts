import sqlite3 from "sqlite3";

// Connect to the database
const path = require("path");
const dbPath = path.join(__dirname, "..", "token_prices.db");
const db = new sqlite3.Database(dbPath);
// Specify the table name
const tableName = "token_prices"; // Replace 'your_table_name' with the actual table name

// Retrieve and print the contents of the table
const query = `SELECT * FROM ${tableName}`;
db.all(query, [], (err, rows) => {
  if (err) {
    console.error("Error executing query:", err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log("No rows found in the table.");
  } else {
    rows.forEach((row) => {
      console.log(row);
    });
  }

  // Close the database connection
  db.close();
});
