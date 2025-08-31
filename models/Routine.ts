import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

// TASK SCHEMA (embedded in Routine)
const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    targetSeconds: {
      type: Number,
      required: true,
      min: 1,
      max: 86400, // 24 hours max
    },
  },
  { _id: false }
);

// SESSION RECORD SCHEMA (embedded in Routine)
const sessionRecordSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    routineId: {
      type: String,
      required: true,
    },
    dateISO: {
      type: String,
      required: true,
    },
    startISO: {
      type: String,
      required: true,
    },
    endISO: {
      type: String,
      required: true,
    },
    targetSeconds: {
      type: Number,
      required: true,
    },
    actualSeconds: {
      type: Number,
      required: true,
    },
    deltaSeconds: {
      type: Number,
      required: true,
    },
    tasksCompleted: {
      type: Number,
      required: true,
    },
    tasksTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// ROUTINE SCHEMA
const routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    tasks: [taskSchema],
    sessions: [sessionRecordSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for efficient queries
routineSchema.index({ userId: 1 });
routineSchema.index({ userId: 1, isActive: 1 });
routineSchema.index({ userId: 1, id: 1 });

// add plugin that converts mongoose to json
routineSchema.plugin(toJSON);

export default (mongoose.models.Routine || mongoose.model('Routine', routineSchema)) as mongoose.Model<any>;
