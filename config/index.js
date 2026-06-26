const path = require("path");
const dotenv = require("dotenv");

const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

function readPositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    sessionSecret: process.env.SESSION_SECRET,
    apiBaseUrl: process.env.API_BASE_URL || "https://api.heijden.sd-lab.nl",
    sessionCookieDomain: process.env.SESSION_COOKIE_DOMAIN || ".heijden.sd-lab.nl",
    requestBodyLimitMb: readPositiveInt(process.env.REQUEST_BODY_LIMIT_MB, 350),
    messageUploadLimitMb: readPositiveInt(process.env.MESSAGE_UPLOAD_LIMIT_MB, 350),
    uploadsDir: path.join(PROJECT_ROOT, "uploads"),
    uploadsDossiersDir: path.join(PROJECT_ROOT, "uploads", "dossiers"),
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
