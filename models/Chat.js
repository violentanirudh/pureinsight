const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  chats: {
    type: Object,
    default: {}, // Chats stored as an object with timestamps as keys
  },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
