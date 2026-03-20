const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(path.resolve(__dirname, ".."), "ldap-debug-node.log");

function nodeLog(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;

    try {
        fs.appendFileSync(LOG_PATH, line);
    } catch {
        // Logging should never interrupt the request flow.
    }

    process.stdout.write(line);
}

module.exports = { nodeLog, LOG_PATH };
