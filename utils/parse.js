function parseIdParam(req, name = "id") {
    const value = Number(req.params[name]);
    return Number.isFinite(value) && value > 0 ? value : null;
}

function parsePublishAt(value, { allowNull = false } = {}) {
    const v = String(value || "").trim();
    if (!v) return allowNull ? null : undefined;

    let normalized = v.replace("T", " ");
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
        normalized = `${normalized}:00`;
    }
    return normalized;
}

module.exports = { parseIdParam, parsePublishAt };
