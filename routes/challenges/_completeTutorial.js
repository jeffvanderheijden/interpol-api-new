const { pool } = require("./../../database/database.js");
const { completeTutorial, ensureScoringTables } = require("./../../services/scoring");
const { getSessionUser } = require("./../../utils/session");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function completeTutorialHandler(req, res) {
    const user = getSessionUser(req);

    if (!user) {
        return sendError(res, 401, "Unauthorized");
    }

    if (user.role !== "student") {
        return sendOk(res, { points: 0 });
    }

    try {
        await ensureScoringTables(pool);
        const result = await completeTutorial(pool, user.username);
        return sendOk(res, result);
    } catch (err) {
        logError("POST /api/challenges/tutorial/complete", err);
        return sendError(res, 500, "Server error");
    }
};
