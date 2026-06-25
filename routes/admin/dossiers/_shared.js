function parseBooleanFlag(value, fallback) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "boolean") return value ? 1 : 0;

    const normalized = String(value).trim().toLowerCase();

    if (["1", "true", "yes", "ja", "on"].includes(normalized)) return 1;
    if (["0", "false", "no", "nee", "off"].includes(normalized)) return 0;

    return fallback;
}

module.exports = { parseBooleanFlag };
