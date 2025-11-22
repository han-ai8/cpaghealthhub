import express from 'express';
import Announcement from '../models/Announcement.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import CommunityPost from '../models/CommunityPost.js';
import Appointment from '../models/appointment.js';
import { isAuthenticated, isAdminRole, isUserRole, isContentModerator } from '../middleware/auth.js';

// ✅ IMPORT THE NEW UPLOAD SERVICE
import { upload, getImagePath, deleteImage } from '../services/uploadService.js';

const router = express.Router();

// === ANNOUNCEMENTS ===
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(1);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/announcements', isAuthenticated, isAdminRole, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // ✅ USE HELPER FUNCTION
    const image = getImagePath(req.file);
    
    console.log('📝 Creating announcement with image:', image);
    
    const announcement = new Announcement({ title, content, image });
    await announcement.save();

    // Send notifications to all users
    const notificationService = req.app.get('notificationService');
    const allUsers = await User.find({ role: 'user' }).select('_id');
    const userIds = allUsers.map(u => u._id);
    
    await notificationService.notifyNewAnnouncement(announcement, userIds);

    console.log('✅ Announcement created successfully');
    res.json(announcement);
  } catch (err) {
    console.error('❌ Create announcement error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/announcements/:id', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    // ✅ DELETE IMAGE USING HELPER
    if (announcement && announcement.image) {
      await deleteImage(announcement.image);
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === POSTS ===
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(5);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST route for updating posts (compatible with file uploads)
router.post('/posts/:id', isAuthenticated, isAdminRole, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    
    const post = await Post.findById(req.params.id);
    if (!post || post.author !== 'CPAG') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    post.content = content;
    
    // ✅ HANDLE IMAGE UPDATE
    if (req.file) {
      // Delete old image
      if (post.image) {
        await deleteImage(post.image);
      }
      
      // Set new image
      post.image = getImagePath(req.file);
      console.log('📸 Updated post image:', post.image);
    }
    
    await post.save();
    console.log('✅ Post updated successfully');
    res.json(post);
  } catch (err) {
    console.error('❌ Update post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/all', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const adminPosts = posts.filter(p => p.author === 'CPAG' && p.status === 'approved');
    const pendingPosts = posts.filter(p => p.status === 'pending');
    res.json({ adminPosts, pendingPosts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', isAuthenticated, isAdminRole, upload.single('image'), async (req, res) => {
  try {
    const { content, status } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    
    const postStatus = status === 'approved' ? 'approved' : 'pending';
    
    // ✅ USE HELPER FUNCTION
    const image = getImagePath(req.file);
    
    console.log('📝 Creating post with image:', image);
    
    const post = new Post({ 
      content, 
      image, 
      status: postStatus, 
      author: 'CPAG' 
    });
    
    await post.save();
    console.log('✅ Post created successfully');

    // Send notifications if approved
    if (postStatus === 'approved') {
      const notificationService = req.app.get('notificationService');
      const allUsers = await User.find({ role: 'user' }).select('_id');
      const userIds = allUsers.map(u => u._id);
      
      await notificationService.notifyNewPost(post, userIds);
    }

    res.json(post);
  } catch (err) {
    console.error('❌ Create post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/community', isAuthenticated, isUserRole, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    
    // ✅ USE HELPER FUNCTION
    const image = getImagePath(req.file);
    
    const post = new Post({ 
      content, 
      image, 
      status: 'pending', 
      author: req.user.name || 'Anonymous User' 
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id', isAuthenticated, isAdminRole, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    
    const post = await Post.findById(req.params.id);
    if (!post || post.author !== 'CPAG') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    post.content = content;
    
    // ✅ HANDLE IMAGE UPDATE
    if (req.file) {
      // Delete old image
      if (post.image) {
        await deleteImage(post.image);
      }
      
      post.image = getImagePath(req.file);
    }
    
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('❌ Update post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.author !== 'CPAG') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // ✅ DELETE IMAGE
    if (post.image) {
      await deleteImage(post.image);
    }
    
    await Post.findByIdAndDelete(req.params.id);
    console.log('✅ Post deleted successfully');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('❌ Delete post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id/approve', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id/save', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const postId = req.params.id;
    
    if (!req.user || !req.user.id) {
      console.error('Save route - req.user missing after middleware');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    console.log('Save attempt - Post ID:', postId, 'User ID:', userId);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const user = await User.findById(userId).populate('savedPosts');
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isSaved = user.savedPosts.some(savedPost => savedPost._id.toString() === postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(savedPost => savedPost._id.toString() !== postId);
      await user.save();
      res.json({ message: 'Post unsaved', saved: false, post });
    } else {
      user.savedPosts.push(post._id);
      await user.save();
      res.json({ message: 'Post saved', saved: true, post });
    }
  } catch (err) {
    console.error('Save toggle error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/saved', isAuthenticated, isUserRole, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log('Saved posts route - req.user missing after auth');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = req.user.id;

    const user = await User.findById(userId).populate('savedPosts', 'content image author status createdAt likes comments _id');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    let savedPosts = user.savedPosts || [];
    
    try {
      savedPosts = savedPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    } catch (sortErr) {
      console.error('Sort error (falling back to unsorted):', sortErr);
    }

    res.json(savedPosts);
  } catch (err) {
    console.error('Saved posts route error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/liked-status', isAuthenticated, isUserRole, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    const likedPosts = await Post.find({ likedBy: userId, status: 'approved' }).select('_id');
    const likedAnnouncements = await Announcement.find({ likedBy: userId }).select('_id');

    res.json({
      likedPosts: likedPosts.map(p => p._id.toString()),
      likedAnnouncements: likedAnnouncements.map(a => a._id.toString())
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === USERS ===
router.get('/users', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const users = await User.find({}, 'name email active role').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === COMMENTS ===
router.post('/announcements/:id/comments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const comment = {
      body: body.trim(),
      author: req.user.id,
      createdAt: new Date()
    };

    announcement.comments.push(comment);
    await announcement.save();

    res.json({ message: 'Comment added', announcement });
  } catch (err) {
    console.error('Add announcement comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/:id/comments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      body: body.trim(),
      author: req.user.id,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    res.json({ message: 'Comment added', post });
  } catch (err) {
    console.error('Add post comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/announcements/:id/comments', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).select('comments');
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement.comments || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('comments');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post.comments || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/announcements/:id/comments/:commentId', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    announcement.comments = announcement.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );
    
    await announcement.save();
    res.json({ message: 'Comment deleted', announcement });
  } catch (err) {
    console.error('Delete announcement comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id/comments/:commentId', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments = post.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );
    
    await post.save();
    res.json({ message: 'Comment deleted', post });
  } catch (err) {
    console.error('Delete post comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/announcements/:id/comments/:commentId/reply', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply text required' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const comment = announcement.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.reply = {
      body: reply.trim(),
      author: 'CPAG Admin',
      createdAt: new Date()
    };

    await announcement.save();

    const notificationService = req.app.get('notificationService');
    const commentAuthor = await User.findOne({ 
      $or: [{ name: comment.author }, { username: comment.author }] 
    });
    
    if (commentAuthor) {
      await notificationService.notifyAdminReply(
        commentAuthor._id,
        announcement,
        comment.body,
        req.params.commentId,
        'Announcement'
      );
    }

    res.json({ message: 'Reply added', announcement });
  } catch (err) {
    console.error('Reply to announcement comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id/comments/:commentId/reply', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply text required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.reply = {
      body: reply.trim(),
      author: 'CPAG Admin',
      createdAt: new Date()
    };

    await post.save();

    const notificationService = req.app.get('notificationService');
    const commentAuthor = await User.findOne({ 
      $or: [{ name: comment.author }, { username: comment.author }] 
    });
    
    if (commentAuthor) {
      await notificationService.notifyAdminReply(
        commentAuthor._id,
        post,
        comment.body,
        req.params.commentId,
        'Post'
      );
    }

    res.json({ message: 'Reply added', post });
  } catch (err) {
    console.error('Reply to post comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/community/posts/:id/comments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body required' });
    }

    const post = await CommunityPost.findById(req.params.id).populate('author', 'name username');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      body: body.trim(),
      author: req.user.id,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];

    try {
      if (post.author && post.author._id && post.author._id.toString() !== req.user.id.toString()) {
        const notificationService = req.app.get('notificationService');
        if (notificationService) {
          const commenter = await User.findById(req.user.id).select('name username');
          if (commenter) {
            const commenterName = commenter.name || commenter.username || 'Someone';
            await notificationService.notifyNewComment(
              post.author._id,
              commenterName,
              post,
              addedComment._id.toString()
            );
            console.log('✅ Comment notification sent');
          }
        }
      }
    } catch (notifError) {
      console.error('⚠️ Notification failed (non-critical):', notifError);
    }

    const populatedPost = await CommunityPost.findById(post._id).populate('author', 'name username');
    
    res.json({ message: 'Comment added', post: populatedPost });
  } catch (err) {
    console.error('Add community comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === LIKES ===
router.put('/announcements/:id/like', isAuthenticated, isUserRole, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('Like announcement route - req.user missing');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (!announcement.likedBy) {
      announcement.likedBy = [];
    }

    const likedByStrings = announcement.likedBy.map(id => id.toString());
    const hasLiked = likedByStrings.includes(userId.toString());

    if (hasLiked) {
      announcement.likedBy = announcement.likedBy.filter(
        id => id.toString() !== userId.toString()
      );
      announcement.likes = Math.max(0, (announcement.likes || 0) - 1);
      await announcement.save();
      res.json({ message: 'Unliked', liked: false, announcement });
    } else {
      announcement.likedBy.push(userId);
      announcement.likes = (announcement.likes || 0) + 1;
      await announcement.save();
      console.log('Announcement liked by user:', userId);
      res.json({ message: 'Liked', liked: true, announcement });
    }
  } catch (err) {
    console.error('Like announcement error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id/like', isAuthenticated, isUserRole, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.likedBy) {
      post.likedBy = [];
    }

    const likedByStrings = post.likedBy.map(id => id.toString());
    const hasLiked = likedByStrings.includes(userId.toString());

    if (hasLiked) {
      post.likedBy = post.likedBy.filter(
        id => id.toString() !== userId.toString()
      );
      post.likes = Math.max(0, (post.likes || 0) - 1);
      await post.save();
      console.log('Post unliked by user:', userId);
      res.json({ message: 'Unliked', liked: false, post });
    } else {
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
      await post.save();
      console.log('Post liked by user:', userId);
      res.json({ message: 'Liked', liked: true, post });
    }
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// === COMMUNITY FORUM ROUTES ===
// ============================================

router.get('/community/posts', async (req, res) => {
  try {
    const posts = await CommunityPost.find({ status: 'approved' })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Fetch community posts error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/community/posts', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { content, category } = req.body;
    if (!content || !category) {
      return res.status(400).json({ error: 'Content and category required' });
    }

    const post = new CommunityPost({
      content: content.trim(),
      category,
      author: req.user.id,
      status: 'pending'
    });

    await post.save();
    console.log('Community post created by user:', req.user.id);
    res.json({ message: 'Post submitted for review', post });
  } catch (err) {
    console.error('Create community post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/community/posts/my-posts', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ author: req.user.id })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Fetch user posts error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/community/posts/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { content, category } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    if (content) post.content = content.trim();
    if (category) post.category = category;
    
    if (post.status === 'approved') {
      post.status = 'pending';
    }

    await post.save();
    console.log('Community post edited by user:', req.user.id);
    res.json({ message: 'Post updated and sent for review', post });
  } catch (err) {
    console.error('Edit community post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/community/posts/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await CommunityPost.findByIdAndDelete(req.params.id);
    console.log('Community post deleted by user:', req.user.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete community post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/community/posts/:id/comments/:commentId/replies', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Reply body required' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const reply = {
      body: body.trim(),
      author: req.user.id,
      createdAt: new Date()
    };

    comment.replies.push(reply);
    await post.save();

    const populatedPost = await CommunityPost.findById(post._id).populate('author', 'name username');
    
    res.json({ message: 'Reply added', post: populatedPost });
  } catch (err) {
    console.error('❌ Add reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/community/posts/:id/report', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Report reason required' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const alreadyReported = post.reports.some(
      report => report.reportedBy.toString() === req.user.id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    const report = {
      reportedBy: req.user.id,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date()
    };

    post.reports.push(report);
    await post.save();

    res.json({ message: 'Report submitted. Thank you for helping maintain our community.', post });
  } catch (err) {
    console.error('Report post error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === ADMIN COMMUNITY ROUTES ===

router.get('/admin/community/posts', isAuthenticated, isContentModerator, async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate('author', 'name email')
      .populate('reports.reportedBy', 'name email')
      .sort({ createdAt: -1 });

    const pendingPosts = posts.filter(p => p.status === 'pending');
    const approvedPosts = posts.filter(p => p.status === 'approved');
    const rejectedPosts = posts.filter(p => p.status === 'rejected');
    const reportedPosts = posts.filter(p => p.reports.some(r => r.status === 'pending'));

    res.json({ 
      pendingPosts, 
      approvedPosts, 
      rejectedPosts,
      reportedPosts,
      allPosts: posts 
    });
  } catch (err) {
    console.error('❌ Admin fetch community posts error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/community/posts/:id/status', isAuthenticated, isContentModerator, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.status = status;
    await post.save();

    res.json({ message: `Post ${status}`, post });
  } catch (err) {
    console.error('❌ Update post status error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/community/posts/:id', isAuthenticated, isContentModerator, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('❌ Delete post error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/community/posts/:id/reports/:reportId', isAuthenticated, isContentModerator, async (req, res) => {
  try {
    const { status, deletePost } = req.body;
    if (!['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const report = post.reports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (deletePost) {
      await CommunityPost.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Post deleted successfully' });
    } else if (status === 'rejected') {
      report.status = 'rejected';
      await post.save();
      return res.json({ message: 'Report rejected', post });
    } else {
      report.status = 'resolved';
      post.status = 'rejected';
      await post.save();
      return res.json({ message: 'Post rejected', post });
    }
  } catch (err) {
    console.error('❌ Handle report error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/community/posts/:id/comments/:commentId', isAuthenticated, isContentModerator, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments = post.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );

    await post.save();
    
    res.json({ message: 'Comment deleted', post });
  } catch (err) {
    console.error('❌ Delete comment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// === APPOINTMENT ROUTES ===
// ============================================

router.get('/appointments/booked-slots', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: { $in: ['pending', 'confirmed'] }
    }).select('date time');
    
    const bookedSlots = appointments.map(apt => ({
      date: apt.date,
      time: apt.time
    }));
    
    res.json(bookedSlots);
  } catch (err) {
    console.error('Fetch booked slots error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/appointments/my-appointments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      user: req.user.id 
    }).sort({ date: -1, time: -1 });
    
    const current = appointments.find(apt => 
      ['pending', 'confirmed'].includes(apt.status)
    );
    
    const history = appointments.filter(apt => 
      ['cancelled', 'completed'].includes(apt.status)
    );
    
    res.json({ current, history });
  } catch (err) {
    console.error('Fetch user appointments error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { service, date, time, note } = req.body;
    
    if (!service || !date || !time) {
      return res.status(400).json({ error: 'Service, date, and time are required' });
    }
    
    const existingAppointment = await Appointment.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ 
        error: 'You already have an active appointment. Please cancel or complete it first.' 
      });
    }
    
    const slotTaken = await Appointment.findOne({
      date,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (slotTaken) {
      return res.status(400).json({ 
        error: 'This time slot is no longer available. Please select another time.' 
      });
    }
    
    const appointment = new Appointment({
      user: req.user.id,
      service,
      date,
      time,
      note: note || '',
      status: 'pending',
      bookedAt: new Date()
    });
    
    await appointment.save();
    console.log('Appointment created by user:', req.user.id);
    res.json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/appointments/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { service, date, time, note } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this appointment' });
    }
    
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ 
        error: 'Cannot edit cancelled or completed appointments' 
      });
    }
    
    if (date !== appointment.date || time !== appointment.time) {
      const slotTaken = await Appointment.findOne({
        _id: { $ne: appointment._id },
        date,
        time,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      if (slotTaken) {
        return res.status(400).json({ 
          error: 'This time slot is no longer available. Please select another time.' 
        });
      }
    }
    
    appointment.service = service || appointment.service;
    appointment.date = date || appointment.date;
    appointment.time = time || appointment.time;
    appointment.note = note !== undefined ? note : appointment.note;
    
    if (appointment.status === 'confirmed') {
      appointment.status = 'pending';
    }
    
    await appointment.save();
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/appointments/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    const hoursSinceBooking = (new Date() - new Date(appointment.bookedAt)) / (1000 * 60 * 60);
    
    if (hoursSinceBooking > 24) {
      return res.status(400).json({ 
        error: 'Cannot cancel after 24 hours. Please submit a cancellation request instead.' 
      });
    }
    
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments/:id/cancel-request', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (appointment.cancelRequest.requested) {
      return res.status(400).json({ 
        error: 'Cancellation request already submitted' 
      });
    }
    
    appointment.cancelRequest = {
      requested: true,
      reason: reason.trim(),
      requestedAt: new Date()
    };
    
    await appointment.save();
    
    res.json({ 
      message: 'Cancellation request submitted. Admin will contact you soon.', 
      appointment 
    });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/appointments', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'name email')
      .sort({ date: 1, time: 1 });
    
    const pending = appointments.filter(apt => apt.status === 'pending');
    const confirmed = appointments.filter(apt => apt.status === 'confirmed');
    const cancelRequests = appointments.filter(apt => 
      apt.cancelRequest.requested && !apt.cancelRequest.respondedAt
    );
    const completed = appointments.filter(apt => apt.status === 'completed');
    const cancelled = appointments.filter(apt => apt.status === 'cancelled');
    
    res.json({ 
      all: appointments,
      pending,
      confirmed,
      cancelRequests,
      completed,
      cancelled
    });
  } catch (err) {
    console.error('Admin fetch appointments error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/appointments/:id/status', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = status;
    
    if (status === 'confirmed') {
      appointment.confirmedAt = new Date();
    }
    
    if (status === 'cancelled') {
      appointment.cancelledAt = new Date();
    }
    
    await appointment.save();
    
    res.json({ message: `Appointment ${status}`, appointment });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/appointments/:id/cancel-request', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { approve, response } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (!appointment.cancelRequest.requested) {
      return res.status(400).json({ error: 'No cancellation request found' });
    }
    
    appointment.cancelRequest.adminResponse = response || (approve ? 'Approved' : 'Denied');
    appointment.cancelRequest.respondedAt = new Date();
    
    if (approve) {
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
    }
    
    await appointment.save();
    
    res.json({ 
      message: `Cancellation request ${approve ? 'approved' : 'denied'}`, 
      appointment 
    });
  } catch (err) {
    console.error('Admin cancel request response error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/appointments/:id', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Admin delete appointment error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/appointments/calendar', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = {
      status: { $in: ['pending', 'confirmed'] }
    };
    
    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    }
    
    const appointments = await Appointment.find(query)
      .populate('user', 'name email')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (err) {
    console.error('Admin calendar view error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;