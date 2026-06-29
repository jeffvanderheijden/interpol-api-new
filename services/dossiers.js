const { pool } = require("../database/database");

const DEFAULT_DOSSIERS = [
    "Abdeslam Hakil",
    "Amy Marks",
    "Arthur Steijlen",
    "Brian Hokke",
    "Emily Kornaat",
    "Floris van Dijk",
    "Henk Bijlsma",
    "Hilda Uitvlught",
    "Jeff van der Heijden",
    "Judith Pouwelse",
    "Maarten Tacoma",
    "Melvin Loos",
    "Meredith Wongsosetro",
    "Michael Fernandes",
    "Oskar Maan",
    "Ron Segaar",
    "Ruben Baas",
    "Saskia Heijnsdijk",
    "Soraya Goldewijk",
    "Ward Klomp",
    "Wouter Visser",
    "Yorik Geurts",
].map((name) => ({
    name,
    is_suspect: ![
        "Brian Hokke",
        "Hilda Uitvlught",
        "Jeff van der Heijden",
    ].includes(name),
}));

async function ensureDossiersTable(executor = pool) {
    const [existingTables] = await executor.execute(
        `SHOW TABLES LIKE 'dossiers'`
    );

    const tableExists = existingTables.length > 0;

    await executor.execute(`
        CREATE TABLE IF NOT EXISTS dossiers (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(120) NOT NULL,
            description text DEFAULT NULL,
            image_url varchar(255) DEFAULT NULL,
            video_url varchar(255) DEFAULT NULL,
            is_suspect tinyint(1) NOT NULL DEFAULT 1,
            is_eliminated tinyint(1) NOT NULL DEFAULT 0,
            sort_order int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT current_timestamp(),
            updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY uniq_dossiers_name (name),
            KEY idx_dossiers_sort (sort_order, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci
    `);

    const [videoUrlColumns] = await executor.execute(
        `SHOW COLUMNS FROM dossiers LIKE 'video_url'`
    );

    if (videoUrlColumns.length === 0) {
        await executor.execute(
            `ALTER TABLE dossiers ADD COLUMN video_url varchar(255) DEFAULT NULL AFTER image_url`
        );
    }

    if (tableExists) {
        return;
    }

    for (const dossier of DEFAULT_DOSSIERS) {
        await executor.execute(
            `
            INSERT INTO dossiers (name, is_suspect, is_eliminated, sort_order)
            VALUES (?, ?, 0, 0)
            ON DUPLICATE KEY UPDATE name = name
            `,
            [dossier.name, dossier.is_suspect ? 1 : 0]
        );
    }
}

module.exports = { ensureDossiersTable };
