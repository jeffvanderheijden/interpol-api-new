const requireLogin = require("../middleware/authRequired");
const requireTeacher = require("../middleware/teacherRequired");
const health = require("./health");
const authRoutes = require("./auth");
const challenges = require("./challenges/challenges");
const groups = require("./groups/groups");
const messages = require("./messages/messages");
const adminGroups = require("./admin/groups/groups");
const adminChallenges = require("./admin/challenges/challenges");
const adminMessages = require("./admin/messages/messages");

function registerRoutes(app) {
    app.use("/health", health);
    app.use("/api", authRoutes);

    app.use("/api/challenges", requireLogin, challenges);
    app.use("/api/groups", requireLogin, groups);
    app.use("/api/messages", requireLogin, messages);

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
}

module.exports = { registerRoutes };
