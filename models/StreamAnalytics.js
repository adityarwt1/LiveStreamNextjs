import mongoose from "mongoose"

const StreamAnalyticsSchema = new mongoose.Schema(
  {
    streamId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    viewerCount: {
      type: Number,
      required: true,
      min: 0,
    },
    chatMessages: {
      type: Number,
      default: 0,
      min: 0,
    },
    newFollowers: {
      type: Number,
      default: 0,
      min: 0,
    },
    donations: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    averageViewTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViewers: {
      type: Number,
      default: 0,
      min: 0,
    },
    streamQuality: {
      type: String,
      enum: ["720p", "1080p", "480p"],
      default: "720p",
    },
    streamHealth: {
      bitrate: Number,
      fps: Number,
      droppedFrames: Number,
      networkStability: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
        default: "good",
      },
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient analytics queries
StreamAnalyticsSchema.index({ streamId: 1, date: -1 })
StreamAnalyticsSchema.index({ date: -1 })

export default mongoose.models.StreamAnalytics || mongoose.model("StreamAnalytics", StreamAnalyticsSchema)
