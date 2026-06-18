const { pool } = require("./../../database/database.js");
const { getChallengeById } = require("./../../services/challengeCatalog");
const { getSessionUser } = require("./../../utils/session");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function getHandler(req, res) {
    const user = getSessionUser(req);

    if (!user) {
        return sendError(res, 401, "Unauthorized");
    }

    if (user.role === "docent") {
        return sendOk(res, { challenges: [] });
    }

    if (!user.teamId) {
        return sendOk(res, { challenges: [] });
    }

    try {
        const [groupRows] = await pool.execute(
            `
            SELECT class
            FROM groups
            WHERE id = ?
            LIMIT 1
            `,
            [user.teamId]
        );

        if (groupRows.length === 0 || !groupRows[0].class) {
            return sendOk(res, { challenges: [] });
        }

        const className = groupRows[0].class;
        const [challengeRows] = await pool.execute(
            `
            SELECT challenge_id
            FROM class_challenges
            WHERE class = ?
              AND is_open = 1
            ORDER BY challenge_id ASC
            `,
            [className]
        );

        const challenges = challengeRows
            .map((row) => getChallengeById(row.challenge_id))
            .filter(Boolean);

        return sendOk(res, { className, challenges });
    } catch (err) {
        logError("GET /api/challenges", err);
        return sendError(res, 500, "Server error");
    }
};
