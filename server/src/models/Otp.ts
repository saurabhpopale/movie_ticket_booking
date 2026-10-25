import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: 'signup' | 'login' | 'forgot_password';
  userData?: {
    name?: string;
    password?: string;
    role?: 'user' | 'admin';
  };
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['signup', 'login', 'forgot_password'],
      required: true,
    },
    userData: {
      name: String,
      password: String,
      role: {
        type: String,
        enum: ['user', 'admin'],
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expires: '10m' },
    },
  },
  {
    timestamps: false,
  }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
