import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
    },
    image: {
      type: String,
    },
    // Profile fields
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    preferences: {
      dailyReminderTime: {
        type: String, // Format: "HH:mm"
        default: '09:00',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light',
      },
    },
    stats: {
      totalRituals: {
        type: Number,
        default: 0,
      },
      completedToday: {
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
    },
    // Used in the Stripe webhook to identify the user in Stripe and later create Customer Portal or prefill user credit card details
    customerId: {
      type: String,
      validate(value: string) {
        return value.includes('cus_');
      },
    },
    // Used in the Stripe webhook. should match a plan in config.js file.
    priceId: {
      type: String,
      validate(value: string) {
        return value.includes('price_');
      },
    },
    // Used to determine if the user has access to the product—it's turn on/off by the Stripe webhook
    hasAccess: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default (mongoose.models.User || mongoose.model('User', userSchema)) as mongoose.Model<any>;
