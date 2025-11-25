const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
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

                -- totale punten direct berekend
                COALESCE((
                    SELECT SUM(COALESCE(points,0) - COALESCE(point_deduction,0))
                    FROM group_challenges gc
                    WHERE gc.group_id = g.id
                ), 0) AS total_points

            FROM groups g
            ORDER BY total_points DESC, g.id DESC
        `);

        //
        // 2. Haal ALLE members op
        //
        const [memberRows] = await pool.execute(`
            SELECT 
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
                total_points: g.total_points,
                members
            };
        });

        //
        // 5. Send response
        //
        return res.json({
            success: true,
            groups
        });

    } catch (err) {
        console.error("❌ Admin GET /groups error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
            details: err.message
        });
    }
};
