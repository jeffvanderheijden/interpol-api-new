const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        // ----------------------------------------------------
        // 1. Haal alle basisgegevens van groepen op
        // ----------------------------------------------------
        const [groupRows] = await pool.execute(`
            SELECT 
                id,
                name,
                class,
                image_url,
                created_at
            FROM groups
            ORDER BY id DESC
        `);

        // ----------------------------------------------------
        // 2. Haal ALLE members op (sneller dan per groep query)
        // ----------------------------------------------------
        const [memberRows] = await pool.execute(`
            SELECT 
                group_id,
                name,
                student_number
            FROM group_members
            ORDER BY name ASC
        `);

        // ----------------------------------------------------
        // 3. Haal alle punten per groep op
        // ----------------------------------------------------
        const [pointRows] = await pool.execute(`
            SELECT 
                group_id,
                COALESCE(SUM(COALESCE(points, 0) - COALESCE(point_deduction, 0)), 0) AS total_points
            FROM group_challenges
            GROUP BY group_id
        `);

        // ----------------------------------------------------
        // 4. Maak snelle lookup tabellen
        // ----------------------------------------------------
        const membersByGroup = memberRows.reduce((acc, m) => {
            if (!acc[m.group_id]) acc[m.group_id] = [];
            acc[m.group_id].push({
                name: m.name,
                student_number: m.student_number
            });
            return acc;
        }, {});

        const pointsByGroup = pointRows.reduce((acc, p) => {
            acc[p.group_id] = p.total_points || 0;
            return acc;
        }, {});

        // ----------------------------------------------------
        // 5. Bouw uiteindelijke groups array
        // ----------------------------------------------------
        const groups = groupRows.map((g) => {
            const members = membersByGroup[g.id] || [];

            return {
                id: g.id,
                name: g.name,
                class: g.class,
                image_url: g.image_url,
                created_at: g.created_at,
                memberCount: members.length,
                total_points: pointsByGroup[g.id] ?? 0,
                members
            };
        });

        // ----------------------------------------------------
        // 6. Stuur response terug
        // ----------------------------------------------------
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
