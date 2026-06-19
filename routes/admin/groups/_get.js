const { pool } = require("./../../../database/database.js");
const { ensureChallengeCatalog } = require("./../../../services/challengeCatalog");
const { ensureScoringTables } = require("./../../../services/scoring");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function getHandler(req, res) {
    try {
        await ensureChallengeCatalog(pool);
        await ensureScoringTables(pool);

        //
        // 1. Haal alle basisgegevens op + bereken punten in dezelfde query
        //
        const [groupRows] = await pool.execute(`
            SELECT 
                g.id,
                g.name,
                g.class,
                g.image_url,
                g.created_at,

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
                    SELECT SUM(COALESCE(point_deduction,0))
                    FROM group_challenges gc
                    WHERE gc.group_id = g.id
                ), 0) AS total_point_deduction

            FROM groups g
            ORDER BY (tutorial_points + challenge_points - total_point_deduction) DESC, g.id DESC
        `);

        //
        // 2. Haal ALLE members op (nu inclusief id!)
        //
        const [memberRows] = await pool.execute(`
            SELECT 
                id,
                group_id,
                name,
                student_number
            FROM group_members
            ORDER BY name ASC
        `);

        //
        // 3. Lookup tables
        //
        const membersByGroup = memberRows.reduce((acc, m) => {
            if (!acc[m.group_id]) acc[m.group_id] = [];
            acc[m.group_id].push({
                id: m.id,
                name: m.name,
                student_number: m.student_number
            });
            return acc;
        }, {});

        //
        // 4. Build final groups array
        //
        const groups = groupRows.map((g) => {
            const members = membersByGroup[g.id] || [];
            return {
                id: g.id,
                name: g.name,
                class: g.class,
                image_url: g.image_url,
                created_at: g.created_at,
                memberCount: members.length,
                tutorial_points: Number(g.tutorial_points) || 0,
                challenge_points: Number(g.challenge_points) || 0,
                total_point_deduction: Number(g.total_point_deduction) || 0,
                total_points:
                    (Number(g.tutorial_points) || 0) +
                    (Number(g.challenge_points) || 0) -
                    (Number(g.total_point_deduction) || 0),
                members
            };
        });

        //
        // 5. Send response
        //
        return sendOk(res, { groups });

    } catch (err) {
        logError("Admin GET /groups", err);
        return sendError(res, 500, "Server error");
    }
};
