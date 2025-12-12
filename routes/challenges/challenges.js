const express = require("express");
const router = express.Router();

const getHandler = require("./_get.js");

router.get("/:id", getHandler);

module.exports = router;