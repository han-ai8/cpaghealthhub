// models/Article.js
import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['Health', 'Technology', 'Lifestyle', 'News', 'Other'],
    default: 'Other'
  },
  author: {
    type: String,
    required: true
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Article = mongoose.model('Article', articleSchema);

export default Article;