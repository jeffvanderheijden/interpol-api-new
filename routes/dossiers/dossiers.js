const express = require("express");

const getHandler = require("./_get");

const router = express.Router();

router.get("/", getHandler);

module.exports = router;
