module.exports = function requireTeacher(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Niet ingelogd" });
    }

    if (req.session.user.role !== "docent") {
        return res.status(403).json({ error: "Geen toegang (alleen docenten)" });
    }

    next();
};