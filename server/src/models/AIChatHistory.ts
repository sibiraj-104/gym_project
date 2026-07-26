import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IAIChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IAIChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AIChatMessageSchema = new Schema<IAIChatMessage>({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AIChatHistorySchema = new Schema<IAIChatHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    messages: [AIChatMessageSchema],
  },
  {
    timestamps: true,
  },
);

export const AIChatHistory = mongoose.model<IAIChatHistory>(
  'AIChatHistory',
  AIChatHistorySchema,
);
