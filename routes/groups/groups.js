const express = require("express");
const router = express.Router();

const getHandler = require("./_get.js");
const getLeaderboardHandler = require("./_getLeaderboard.js");
const postHandler = require("./_post.js");

router.get("/leaderboard", getLeaderboardHandler);
router.get("/:id", getHandler);
router.post("/", postHandler);

module.exports = router;
