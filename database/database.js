const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "interpol_dashboard.db");
const db = new Database(dbPath);

// optioneel: foreign keys aan
db.pragma("foreign_keys = ON");

module.exports = db;
