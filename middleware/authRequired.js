module.exports = function teacherRequired(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.session.user.role !== "docent") {
        return res.status(403).json({ error: "Forbidden (docent role required)" });
    }

    next();
};
