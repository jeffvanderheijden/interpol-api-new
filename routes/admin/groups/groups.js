const express = require("express");
const router = express.Router();

const getHandler = require("./_get.js");
const postHandler = require("./_post.js");
const putHandler = require("./_put.js");
const deleteHandler = require("./_delete.js");

router.get("/", getHandler);
router.post("/", postHandler);
router.put("/:id", putHandler);
router.delete("/:id", deleteHandler);

module.exports = router;