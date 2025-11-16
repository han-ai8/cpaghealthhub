// controllers/articleController.js
import Article from '../models/Article.js';
import User from '../models/User.js'; 
// Get all articles (for users - only published)
export const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ published: true })
      .sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single article by ID
export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all articles (including unpublished)
export const getAllArticlesAdmin = async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Keep your other functions...

// Admin: Create new article (UPDATE THIS)
export const createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, category, author, published } = req.body;
    
    const article = new Article({
      title,
      content,
      excerpt,
      category,
      author,
      published
    });
    
    const savedArticle = await article.save();

    // ✅ ADD THIS: Send notifications if published
    if (published) {
      const notificationService = req.app.get('notificationService');
      const allUsers = await User.find({ role: 'user' }).select('_id');
      const userIds = allUsers.map(u => u._id);
      
      await notificationService.notifyNewArticle(savedArticle, userIds);
    }

    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Admin: Update article
export const updateArticle = async (req, res) => {
  try {
    const { title, content, excerpt, category, author, published } = req.body;
    
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { title, content, excerpt, category, author, published },
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: Delete article
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};