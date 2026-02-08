function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function requireFields(body, fields) {
    const missing = [];
    for (const f of fields) {
        if (!isNonEmptyString(body?.[f])) missing.push(f);
    }
    return missing;
}

module.exports = { isNonEmptyString, requireFields };
