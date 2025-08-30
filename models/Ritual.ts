import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

// RITUAL SCHEMA
const ritualSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ['health', 'mindfulness', 'productivity', 'creativity', 'relationships', 'learning', 'other'],
      default: 'other',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    targetTime: {
      type: String, // Format: "HH:mm"
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: 1,
      max: 480, // 8 hours max
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    completions: [
      {
        date: {
          type: Date,
          required: true,
        },
        notes: {
          type: String,
          maxlength: 300,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
    stats: {
      totalCompletions: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastCompleted: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for efficient queries
ritualSchema.index({ userId: 1 });
ritualSchema.index({ userId: 1, isActive: 1 });

// add plugin that converts mongoose to json
ritualSchema.plugin(toJSON);

export default (mongoose.models.Ritual || mongoose.model('Ritual', ritualSchema)) as mongoose.Model<any>;
