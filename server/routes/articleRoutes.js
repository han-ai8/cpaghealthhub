// routes/articleRoutes.js
import express from 'express';
import {
  getArticles,
  getArticleById,
  getAllArticlesAdmin,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/articleController.js';

const router = express.Router();

// Public routes (for users)
router.get('/', getArticles);
router.get('/:id', getArticleById);

// Admin routes (add your auth middleware here if you have one)
// Example: router.get('/admin/all', authenticateAdmin, getAllArticlesAdmin);
router.get('/admin/all', getAllArticlesAdmin);
router.post('/admin/create', createArticle);
router.put('/admin/update/:id', updateArticle);
router.delete('/admin/delete/:id', deleteArticle);

export default router;