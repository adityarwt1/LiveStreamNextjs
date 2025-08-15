import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isStreamer: {
      type: Boolean,
      default: false,
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalStreams: {
      type: Number,
      default: 0,
    },
    totalViewTime: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: String,
        enum: ["verified", "partner", "moderator", "early_supporter"],
      },
    ],
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      chatColor: {
        type: String,
        default: "#000000",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for follower count
UserSchema.virtual("followerCount").get(function () {
  return this.followers.length
})

// Virtual for following count
UserSchema.virtual("followingCount").get(function () {
  return this.following.length
})

// Index for better query performance
UserSchema.index({ username: 1 })
UserSchema.index({ email: 1 })
UserSchema.index({ isStreamer: 1 })

export default mongoose.models.User || mongoose.model("User", UserSchema)
