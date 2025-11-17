module.exports = function requireLogin(req, res, next) {
    // Laat preflight altijd door
    if (req.method === "OPTIONS") {
        return next();
    }

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    next();
};
