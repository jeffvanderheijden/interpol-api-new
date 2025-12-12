const express = require("express");
const router = express.Router();

const getHandler = require("./_get.js");
const putHandler = require("./_put.js");

router.get("/", getHandler);
router.put("/:id", putHandler);

module.exports = router;
