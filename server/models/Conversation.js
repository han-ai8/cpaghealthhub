import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming case managers are also in User model
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    user: { type: Number, default: 0 },
    caseManager: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
conversationSchema.index({ userId: 1, caseManagerId: 1 }, { unique: true });
conversationSchema.index({ lastMessageTime: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;