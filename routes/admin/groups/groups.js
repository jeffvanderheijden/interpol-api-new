const express = require("express");
const router = express.Router();

const getHandler = require("./_get.js");
const postHandler = require("./_post.js");
const putHandler = require("./_put.js");
const deleteHandler = require("./_delete.js");

const memberRouter = require("./members"); 

router.get("/", getHandler);
router.post("/", postHandler);
router.put("/:id", putHandler);
router.delete("/:id", deleteHandler);

router.use("/:id/members", memberRouter);

module.exports = router;
