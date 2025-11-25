const express = require("express");
const router = express.Router({ mergeParams: true });

const postMember = require("./_post.js");
const putMember = require("./_put.js");
const deleteMember = require("./_delete.js");

// ADD MEMBER
router.post("/", postMember);

// UPDATE MEMBER
router.put("/:mid", putMember);

// DELETE MEMBER
router.delete("/:mid", deleteMember);

module.exports = router;
