const { pool } = require("./../../database/database.js");
const { sendOk, sendError } = require("./../../utils/response");
const { parseIdParam } = require("./../../utils/parse");
const { logError } = require("./../../utils/log");
const {
    ensureChallengeCatalog,
    enrichChallenge,
    getChallengeCatalog,
} = require("./../../services/challengeCatalog");
const { ensureScoringTables } = require("./../../services/scoring");
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
        await ensureChallengeCatalog(pool);
        await ensureScoringTables(pool);

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

        const memberCount = members.length;

        const [tutorialRows] = await pool.execute(
            `
            SELECT COALESCE(SUM(stp.points), 0) AS tutorial_points
            FROM group_members gm
            JOIN student_tutorial_progress stp
              ON stp.student_number = gm.student_number
            WHERE gm.group_id = ?
            `,
            [groupId]
        );

        const tutorialPoints = Number(tutorialRows[0]?.tutorial_points) || 0;

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

        const [studentScoreRows] = await pool.execute(
            `
            SELECT
                sc.challenge_id,
                COUNT(sc.completed_at) AS completed_members,
                COALESCE(SUM(sc.points), 0) AS earned_points
            FROM group_members gm
            JOIN student_challenge_scores sc
              ON sc.student_number = gm.student_number
            WHERE gm.group_id = ?
            GROUP BY sc.challenge_id
            `,
            [groupId]
        );

        const studentScoresByChallengeId = studentScoreRows.reduce((acc, row) => {
            acc[Number(row.challenge_id)] = {
                completedMembers: Number(row.completed_members) || 0,
                earnedPoints: Number(row.earned_points) || 0,
            };
            return acc;
        }, {});

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
                    memberCount > 0 &&
                    (studentScoresByChallengeId[challenge.id]?.completedMembers || 0) >= memberCount
                        ? 1
                        : 0,
                completed_members:
                    studentScoresByChallengeId[challenge.id]?.completedMembers ?? 0,
                member_count: memberCount,
                points:
                    studentScoresByChallengeId[challenge.id]?.earnedPoints ?? 0,
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

        return sendOk(res, {
            team,
            members,
            tutorial_points: tutorialPoints,
            challenges,
        });

    } catch (err) {
        logError("GET /api/groups/:id", err);
        return sendError(res, 500, "Server error");
    }
};
