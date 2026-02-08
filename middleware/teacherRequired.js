module.exports = function requireTeacher(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (req.session.user.role !== "docent") {
        return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
};
