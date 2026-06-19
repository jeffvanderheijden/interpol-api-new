const { pool } = require("./../../database/database.js");
const {
    ensureChallengeCatalog,
    getChallengeById,
} = require("./../../services/challengeCatalog");
const { ensureScoringTables } = require("./../../services/scoring");
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
        await ensureChallengeCatalog(pool);
        await ensureScoringTables(pool);

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

        const [scoreRows] = await pool.execute(
            `
            SELECT
                challenge_id,
                started_at,
                completed_at,
                duration_seconds,
                points
            FROM student_challenge_scores
            WHERE student_number = ?
            `,
            [user.username]
        );

        const scoresByChallengeId = scoreRows.reduce((acc, row) => {
            acc[Number(row.challenge_id)] = row;
            return acc;
        }, {});

        const challenges = challengeRows
            .map((row) => {
                const challenge = getChallengeById(row.challenge_id);
                if (!challenge) {
                    return null;
                }

                const score = scoresByChallengeId[Number(row.challenge_id)];
                return {
                    ...challenge,
                    started_at: score?.started_at ?? null,
                    completed_at: score?.completed_at ?? null,
                    duration_seconds: score?.duration_seconds ?? null,
                    earned_points: score?.points ?? null,
                    completed: !!score?.completed_at,
                };
            })
            .filter(Boolean);

        return sendOk(res, { className, challenges });
    } catch (err) {
        logError("GET /api/challenges", err);
        return sendError(res, 500, "Server error");
    }
};
