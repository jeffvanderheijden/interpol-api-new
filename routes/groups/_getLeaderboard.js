const { pool } = require("./../../database/database.js");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function getLeaderboardHandler(req, res) {
    try {
        const [groupRows] = await pool.execute(`
            SELECT
                g.id,
                g.name,
                g.class,
                g.image_url,
                g.created_at,
                COALESCE((
                    SELECT COUNT(*)
                    FROM group_members gm
                    WHERE gm.group_id = g.id
                ), 0) AS member_count,
                COALESCE((
                    SELECT SUM(COALESCE(gc.points, 0) - COALESCE(gc.point_deduction, 0))
                    FROM group_challenges gc
                    WHERE gc.group_id = g.id
                ), 0) AS total_points
            FROM groups g
            ORDER BY total_points DESC, g.id DESC
        `);

        const groups = groupRows.map((group, index) => ({
            id: group.id,
            name: group.name,
            class: group.class,
            image_url: group.image_url,
            created_at: group.created_at,
            member_count: Number(group.member_count) || 0,
            total_points: Number(group.total_points) || 0,
            rank: index + 1,
        }));

        return sendOk(res, { groups });
    } catch (err) {
        logError("GET /api/groups/leaderboard", err);
        return sendError(res, 500, "Server error");
    }
};
