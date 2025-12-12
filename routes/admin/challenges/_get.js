const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        // 1) Alle challenges (DB heeft 'name', frontend verwacht 'title')
        const [challengeRows] = await pool.execute(`
            SELECT 
                id,
                name AS title
            FROM challenges
            ORDER BY id ASC
        `);

        // 2) Alle klassen (uit groups; anders heb je geen "klassenlijst")
        const [classRows] = await pool.execute(`
            SELECT DISTINCT class
            FROM groups
            WHERE class IS NOT NULL AND class <> ''
            ORDER BY class ASC
        `);

        const classes = classRows.map(r => ({ class: r.class }));

        // 3) Per klas: welke challenges staan open?
        //    Verwacht tabel: class_challenges(class, challenge_id, is_open)
        const [ccRows] = await pool.execute(`
            SELECT class, challenge_id, is_open
            FROM class_challenges
        `);

        // Build lookup: perClass[challengeId][class] = boolean
        const perClassByChallenge = {};
        for (const row of ccRows) {
            if (!perClassByChallenge[row.challenge_id]) perClassByChallenge[row.challenge_id] = {};
            perClassByChallenge[row.challenge_id][row.class] = row.is_open === 1;
        }

        // 4) Final shape voor frontend
        const challenges = challengeRows.map(ch => {
            const perClass = {};
            for (const c of classes) {
                perClass[c.class] = !!(perClassByChallenge[ch.id]?.[c.class]);
            }
            return {
                id: ch.id,
                title: ch.title,
                perClass
            };
        });

        return res.json({
            success: true,
            classes,
            challenges
        });
    } catch (err) {
        console.error("❌ Admin GET /challenges error:", err);
        return res.status(500).json({
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
};
