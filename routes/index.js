const requireLogin = require("../middleware/authRequired");
const requireTeacher = require("../middleware/teacherRequired");
const health = require("./health");
const authRoutes = require("./auth");
const challenges = require("./challenges/challenges");
const groups = require("./groups/groups");
const getLeaderboardHandler = require("./groups/_getLeaderboard");
const messages = require("./messages/messages");
const dossiers = require("./dossiers/dossiers");
const adminGroups = require("./admin/groups/groups");
const adminChallenges = require("./admin/challenges/challenges");
const adminMessages = require("./admin/messages/messages");
const adminDossiers = require("./admin/dossiers/dossiers");

function registerRoutes(app) {
    app.use("/health", health);
    app.use("/api", authRoutes);
    app.get("/api/leaderboard", getLeaderboardHandler);

    app.use("/api/challenges", requireLogin, challenges);
    app.use("/api/groups", requireLogin, groups);
    app.use("/api/messages", requireLogin, messages);
    app.use("/api/dossiers", requireLogin, dossiers);

    app.use("/api/admin/groups", requireLogin, requireTeacher, adminGroups);
    app.use(
        "/api/admin/challenges",
        requireLogin,
        requireTeacher,
        adminChallenges
    );
    app.use(
        "/api/admin/messages",
        requireLogin,
        requireTeacher,
        adminMessages
    );
    app.use(
        "/api/admin/dossiers",
        requireLogin,
        requireTeacher,
        adminDossiers
    );
}

module.exports = { registerRoutes };
