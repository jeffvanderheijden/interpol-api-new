const { pool } = require("./../../database/database.js");
const { ensureChallengeCatalog } = require("./../../services/challengeCatalog");
const { ensureScoringTables } = require("./../../services/scoring");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function getLeaderboardHandler(req, res) {
    try {
        await ensureChallengeCatalog(pool);
        await ensureScoringTables(pool);

        const [groupRows] = await pool.execute(`
            SELECT
                g.id,
                g.name,
                g.class,
                g.image_url,
                g.manual_points,
                g.manual_points_note,
                g.created_at,
                COALESCE((
                    SELECT COUNT(*)
                    FROM group_members gm
                    WHERE gm.group_id = g.id
                ), 0) AS member_count,
                COALESCE((
                    SELECT SUM(stp.points)
                    FROM group_members gm
                    JOIN student_tutorial_progress stp
                      ON stp.student_number = gm.student_number
                    WHERE gm.group_id = g.id
                ), 0) AS tutorial_points,
                COALESCE((
                    SELECT SUM(scs.points)
                    FROM group_members gm
                    JOIN student_challenge_scores scs
                      ON scs.student_number = gm.student_number
                    WHERE gm.group_id = g.id
                ), 0) AS challenge_points,
                COALESCE((
                    SELECT SUM(COALESCE(gc.point_deduction, 0))
                    FROM group_challenges gc
                    WHERE gc.group_id = g.id
                ), 0) AS total_point_deduction
            FROM groups g
            ORDER BY (tutorial_points + challenge_points + COALESCE(g.manual_points, 0) - total_point_deduction) DESC, g.id DESC
        `);

        const groups = groupRows.map((group, index) => ({
            id: group.id,
            name: group.name,
            class: group.class,
            image_url: group.image_url,
            created_at: group.created_at,
            member_count: Number(group.member_count) || 0,
            tutorial_points: Number(group.tutorial_points) || 0,
            challenge_points: Number(group.challenge_points) || 0,
            manual_points: Number(group.manual_points) || 0,
            manual_points_note: group.manual_points_note || "",
            total_point_deduction: Number(group.total_point_deduction) || 0,
            total_points:
                (Number(group.tutorial_points) || 0) +
                (Number(group.challenge_points) || 0) -
                (Number(group.total_point_deduction) || 0) +
                (Number(group.manual_points) || 0),
            rank: index + 1,
        }));

        return sendOk(res, { groups });
    } catch (err) {
        logError("GET /api/groups/leaderboard", err);
        return sendError(res, 500, "Server error");
    }
};
