const challengeCatalog = [
    {
        id: 1,
        title: "Creative Coding",
        component: "Creacod1",
        route: "/creative-coding",
        description: "Creative coding challenge",
        timeLimit: 600,
        minimumPoints: 150,
    },
    {
        id: 3,
        title: "HTML/CSS",
        component: "HtmlCssTrainer",
        route: "/html-css",
        description: "HTML/CSS challenge",
        timeLimit: 0,
        minimumPoints: 100,
    },
    {
        id: 2,
        title: "JavaScript",
        component: "JavascriptTrainer",
        route: "/javascript",
        description: "JavaScript challenge",
        timeLimit: 900,
        minimumPoints: 200,
    },
    {
        id: 4,
        title: "Kijk op de wijk",
        component: "KijkOpDeWijk",
        route: "/kijk-op-de-wijk",
        description: "Kijk op de wijk challenge",
        timeLimit: 0,
        minimumPoints: 100,
    },
];

const catalogById = new Map(
    challengeCatalog.map((challenge) => [challenge.id, challenge])
);

function getChallengeCatalog() {
    return challengeCatalog.map((challenge) => ({ ...challenge }));
}

function getChallengeById(id) {
    const challenge = catalogById.get(Number(id));
    return challenge ? { ...challenge } : null;
}

function hasChallengeId(id) {
    return catalogById.has(Number(id));
}

function mergeCatalogWithDatabaseRows(rows = []) {
    const knownIds = new Set(challengeCatalog.map((challenge) => challenge.id));
    const extraChallenges = rows
        .filter((row) => !knownIds.has(Number(row.id)))
        .map((row) => ({
            id: Number(row.id),
            title: row.name,
            component: null,
            route: null,
        }));

    return [...getChallengeCatalog(), ...extraChallenges];
}

function enrichChallenge(challenge = {}) {
    const challengeId = Number(challenge.challenge_id ?? challenge.id);
    const definition = catalogById.get(challengeId);

    return {
        ...challenge,
        id: definition?.id ?? challenge.id ?? challengeId,
        challenge_id: challengeId,
        title: definition?.title ?? challenge.title ?? challenge.name ?? null,
        component: definition?.component ?? null,
        route: definition?.route ?? null,
    };
}

async function ensureChallengeCatalog(executor) {
    for (const challenge of challengeCatalog) {
        await executor.execute(
            `
            INSERT INTO challenges (
                id,
                name,
                description,
                time_limit,
                minimum_points,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = COALESCE(challenges.description, VALUES(description)),
                time_limit = VALUES(time_limit),
                minimum_points = VALUES(minimum_points)
            `,
            [
                challenge.id,
                challenge.title,
                challenge.description,
                challenge.timeLimit,
                challenge.minimumPoints,
            ]
        );
    }
}

module.exports = {
    ensureChallengeCatalog,
    enrichChallenge,
    getChallengeById,
    getChallengeCatalog,
    hasChallengeId,
    mergeCatalogWithDatabaseRows,
};
