import mongoose from "mongoose"

const StreamSchema = new mongoose.Schema(
  {
    streamId: {
      type: String,
      required: true,
      unique: true,
      default: () => `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    streamerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    category: {
      type: String,
      required: true,
      enum: ["Gaming", "Music", "Art", "Talk Shows", "Education", "Sports", "Technology", "Other"],
      default: "Other",
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualStartTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    streamKey: {
      type: String,
      required: true,
      unique: true,
    },
    quality: {
      type: String,
      enum: ["720p", "1080p", "480p"],
      default: "720p",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for stream duration
StreamSchema.virtual("duration").get(function () {
  if (this.endTime) {
    return Math.floor((this.endTime - this.actualStartTime) / 1000)
  }
  return Math.floor((Date.now() - this.actualStartTime) / 1000)
})

// Index for better query performance

export default mongoose.models.Stream || mongoose.model("Stream", StreamSchema)
