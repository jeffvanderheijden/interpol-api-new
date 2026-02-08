const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(path.resolve(__dirname, ".."), "error-log.txt");

function serializeError(err) {
    if (!err) return "Unknown error";
    if (err.stack) return err.stack;
    if (err.message) return err.message;
    return String(err);
}

function logError(context, err) {
    const message = serializeError(err);
    const line = `[${new Date().toISOString()}] [${context}] ${message}\n`;

    try {
        fs.appendFileSync(LOG_PATH, line);
    } catch {
        // If file logging fails, still surface on stderr.
    }

    console.error(line.trim());
}

module.exports = { logError };
