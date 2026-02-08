const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");

const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    sessionSecret: process.env.SESSION_SECRET,
    apiBaseUrl: process.env.API_BASE_URL || "https://api.heijden.sd-lab.nl",
    sessionCookieDomain: process.env.SESSION_COOKIE_DOMAIN || ".heijden.sd-lab.nl",
    uploadsDir: path.join(PROJECT_ROOT, "uploads"),
    uploadsMessagesDir: path.join(PROJECT_ROOT, "uploads", "messages"),
    uploadsGroupsDir: path.join(PROJECT_ROOT, "uploads", "groups"),
    corsAllowedOrigins: [
        "http://localhost:5173",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://dashboard.heijden.sd-lab.nl",
        "https://api.heijden.sd-lab.nl",
    ],
};

module.exports = { config };
