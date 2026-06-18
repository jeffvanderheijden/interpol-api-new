const { pool } = require("./../../database/database.js");
const { sendOk, sendError } = require("./../../utils/response");
const { parseIdParam } = require("./../../utils/parse");
const { logError } = require("./../../utils/log");
const {
    enrichChallenge,
    getChallengeCatalog,
} = require("./../../services/challengeCatalog");
const { getSessionUser } = require("./../../utils/session");

module.exports = async function getHandler(req, res) {
    const groupId = parseIdParam(req, "id");
    let user = null;

    // Geen groupId → fout
    if (!groupId) {
        return sendError(res, 400, "Invalid team id");
    }

    // Security: studenten mogen ALLEEN hun eigen team-dashboard bekijken
    try {
        user = getSessionUser(req);

        if (!user) {
            return sendError(res, 401, "Unauthorized");
        }

        // STUDENT → check of route teamId gelijk is aan session teamId
        if (user.role === "student") {
            const sessionTeamId = Number(user.teamId);

            if (sessionTeamId !== groupId) {
                return sendError(res, 403, "Forbidden");
            }
        }

        // DOCENT → volledige toegang (geen restricties)
    } catch (authErr) {
        logError("Auth error", authErr);
        return sendError(res, 500, "Server error");
    }

    // ---------------------------
    // 3. Team info ophalen
    // ---------------------------
    try {
        const [teamRows] = await pool.execute(
            `
            SELECT 
                id,
                name,
                class,
                image_url,
                created_at
            FROM groups
            WHERE id = ?
            `,
            [groupId]
        );

        if (teamRows.length === 0) {
            return sendError(res, 404, "Team not found");
        }

        const team = teamRows[0];

        // ---------------------------
        // 4. Teamleden ophalen
        // ---------------------------
        const [members] = await pool.execute(
            `
            SELECT 
                name,
                student_number
            FROM group_members
            WHERE group_id = ?
            ORDER BY name ASC
            `,
            [groupId]
        );

        // ---------------------------
        // 5. Openstaande challenges voor de klas ophalen
        // ---------------------------
        const [classChallengeRows] = team.class
            ? await pool.execute(
                `
                SELECT challenge_id
                FROM class_challenges
                WHERE class = ?
                  AND is_open = 1
                ORDER BY challenge_id ASC
                `,
                [team.class]
            )
            : [[]];

        const openChallengeIds = new Set(
            classChallengeRows.map((row) => Number(row.challenge_id))
        );

        // ---------------------------
        // 6. Teamvoortgang ophalen
        // ---------------------------
        const [challengeRows] = await pool.execute(
            `
            SELECT 
                challenge_id,
                completed,
                points,
                point_deduction
            FROM group_challenges
            WHERE group_id = ?
            ORDER BY challenge_id ASC
            `,
            [groupId]
        );

        const progressByChallengeId = challengeRows.reduce((acc, challenge) => {
            acc[Number(challenge.challenge_id)] = challenge;
            return acc;
        }, {});

        const catalogChallenges = getChallengeCatalog();
        const visibleCatalogChallenges =
            user.role === "student"
                ? catalogChallenges.filter((challenge) =>
                      openChallengeIds.has(challenge.id)
                  )
                : catalogChallenges;
        const visibleChallengeIds = new Set(
            visibleCatalogChallenges.map((challenge) => challenge.id)
        );

        const challenges = visibleCatalogChallenges.map((challenge) =>
            enrichChallenge({
                challenge_id: challenge.id,
                completed:
                    progressByChallengeId[challenge.id]?.completed ?? 0,
                points: progressByChallengeId[challenge.id]?.points ?? null,
                point_deduction:
                    progressByChallengeId[challenge.id]?.point_deduction ?? 0,
                is_open: openChallengeIds.has(challenge.id),
            })
        );

        if (user.role !== "student") {
            for (const row of challengeRows) {
                const challengeId = Number(row.challenge_id);

                if (visibleChallengeIds.has(challengeId)) {
                    continue;
                }

                challenges.push(
                    enrichChallenge({
                        ...row,
                        id: challengeId,
                        is_open: openChallengeIds.has(challengeId),
                    })
                );
            }
        }

        return sendOk(res, { team, members, challenges });

    } catch (err) {
        logError("GET /api/groups/:id", err);
        return sendError(res, 500, "Server error");
    }
};
