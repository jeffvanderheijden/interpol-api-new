const express = require("express");
const router = express.Router();

const getHandler = require("./_get");

router.get("/", getHandler);

module.exports = router;
