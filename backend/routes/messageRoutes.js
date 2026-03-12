const express = require("express");
const {
  allMessages,
  sendMessage,
  clearMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/edit").put(protect, editMessage);
router.route("/react").put(protect, reactToMessage);
router.route("/delete/:messageId").delete(protect, deleteMessage);

router
  .route("/:chatId")
  .get(protect, allMessages)
  .delete(protect, clearMessages);

module.exports = router;
