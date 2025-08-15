import mongoose from "mongoose"

const ChatMessageSchema = new mongoose.Schema(
  {
    streamId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: "Anonymous",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageType: {
      type: String,
      enum: ["chat", "system", "donation", "follow"],
      default: "chat",
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      sparse: true,
    },
    badges: [
      {
        type: String,
        enum: ["moderator", "subscriber", "vip", "verified"],
      },
    ],
    emotes: [
      {
        name: String,
        url: String,
        positions: [Number],
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for efficient chat queries
ChatMessageSchema.index({ streamId: 1, createdAt: -1 })
ChatMessageSchema.index({ username: 1 })

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema)
