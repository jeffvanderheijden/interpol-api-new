const challengeCatalog = [
    {
        id: 1,
        title: "Creative Coding",
        component: "Creacod1",
        route: "/creative-coding",
    },
    {
        id: 3,
        title: "HTML/CSS",
        component: "HtmlCssTrainer",
        route: "/html-css",
    },
    {
        id: 2,
        title: "JavaScript",
        component: "JavascriptTrainer",
        route: "/javascript",
    },
    {
        id: 4,
        title: "Kijk op de wijk",
        component: "KijkOpDeWijk",
        route: "/kijk-op-de-wijk",
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

module.exports = {
    enrichChallenge,
    getChallengeById,
    getChallengeCatalog,
    hasChallengeId,
    mergeCatalogWithDatabaseRows,
};
