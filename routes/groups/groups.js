const express = require("express");
const router = express.Router();

// =========================
// Endpoints for groups
// =========================

// POST
const postHandler = require("./_post.js");
router.post("/", postHandler);

// GET 

module.exports = router;