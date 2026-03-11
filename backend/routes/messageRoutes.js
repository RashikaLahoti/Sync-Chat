const express = require("express");
const {
  allMessages,
  sendMessage,
  clearMessages,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages).delete(protect, clearMessages);
router.route("/").post(protect, sendMessage);

module.exports = router;
