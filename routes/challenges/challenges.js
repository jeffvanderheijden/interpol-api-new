const express = require("express");
const router = express.Router();

const completeChallengeHandler = require("./_complete.js");
const completeTutorialHandler = require("./_completeTutorial.js");
const getHandler = require("./_get.js");
const startHandler = require("./_start.js");

router.get("/", getHandler);
router.post("/tutorial/complete", completeTutorialHandler);
router.post("/:id/start", startHandler);
router.post("/:id/complete", completeChallengeHandler);

module.exports = router;
