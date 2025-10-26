import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // NEW: Track who liked
  comments: [{ 
    body: { type: String, required: true }, 
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    reply: {
      body: String,
      author: String,
      createdAt: Date
    }
  }],
  saves: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    savedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
export default Post;