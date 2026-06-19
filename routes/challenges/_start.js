const { pool } = require("./../../database/database.js");
const { ensureChallengeCatalog, hasChallengeId } = require("./../../services/challengeCatalog");
const { ensureScoringTables, startChallenge } = require("./../../services/scoring");
const { getSessionUser } = require("./../../utils/session");
const { sendOk, sendError } = require("./../../utils/response");
const { parseIdParam } = require("./../../utils/parse");
const { logError } = require("./../../utils/log");

module.exports = async function startHandler(req, res) {
    const user = getSessionUser(req);
    const challengeId = parseIdParam(req, "id");

    if (!user) {
        return sendError(res, 401, "Unauthorized");
    }

    if (user.role !== "student") {
        return sendOk(res);
    }

    if (!challengeId || !hasChallengeId(challengeId)) {
        return sendError(res, 400, "Invalid challenge id");
    }

    try {
        await ensureChallengeCatalog(pool);
        await ensureScoringTables(pool);
        await startChallenge(pool, user.username, challengeId);
        return sendOk(res);
    } catch (err) {
        logError("POST /api/challenges/:id/start", err);
        return sendError(res, 500, "Server error");
    }
};
