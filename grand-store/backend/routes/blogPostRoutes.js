const express = require('express');
const router = express.Router();
const {
  getPublicBlogs,
  getBlogBySlug,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogPostController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPublicBlogs);
router.get('/:slug', getBlogBySlug);

// Admin routes
router.get('/admin/all', protect, admin, getAdminBlogs);
router.post('/', protect, admin, createBlog);
router.put('/:id', protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);

module.exports = router;
