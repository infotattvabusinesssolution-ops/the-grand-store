const BlogPost = require('../models/BlogPost');

const DEFAULT_BLOGS = [
  {
    slug: 'top-10-must-try-premium-liquors-available-at-the-grand-store',
    title: 'Top 10 Must-Try Premium Liquors Available at The Grand Store',
    titleBefore: 'Top 10 Must-Try ',
    titleAccent: 'Premium Liquors',
    titleAfter: ' Available at The Grand Store',
    date: '14 Apr 2025',
    readTime: '5 min read',
    category: 'The Grand Edit',
    image: '/assets/blogs/premium-liquors.jpg',
    excerpt: 'A considered shortlist of celebrated Scotch, polished vodka, fine Cognac and distinctly South African bottles curated for the modern cabinet.',
    order: 0,
    isVisible: true,
    isFeatured: true
  },
  {
    slug: 'top-south-african-brandy-brands-you-can-order-online',
    title: 'Top South African Brandy Brands You Can Order Online',
    titleBefore: 'Top South African ',
    titleAccent: 'Brandy Brands',
    titleAfter: ' You Can Order Online',
    date: '26 Mar 2025',
    readTime: '4 min read',
    category: 'Brandy Journal',
    image: '/assets/blogs/south-african-brandy-brands.jpeg',
    excerpt: 'From Stellenbosch oak maturation to Robertson heritage, meet the local master distillers giving Cape potstill its world-class acclaim.',
    order: 1,
    isVisible: true,
    isFeatured: false
  },
  {
    slug: 'top-10-whiskey-brands-you-can-buy-online-in-south-africa',
    title: 'Top 10 Whiskey Brands You Can Buy Online in South Africa',
    titleBefore: 'Top 10 ',
    titleAccent: 'Whiskey Brands',
    titleAfter: ' You Can Buy Online in South Africa',
    date: '19 Mar 2025',
    readTime: '6 min read',
    category: 'Whisky Journal',
    image: '/assets/blogs/whiskey-brands.jpg',
    excerpt: 'Homegrown favourites and international icons for collectors discovering their next elegant everyday dram or investment bottle.',
    order: 2,
    isVisible: true,
    isFeatured: false
  }
];

const ensureDefaultBlogs = async () => {
  const count = await BlogPost.countDocuments();
  if (count === 0) {
    try {
      await BlogPost.insertMany(DEFAULT_BLOGS);
    } catch (e) {
      console.error('Failed to seed default blog posts:', e.message);
    }
  }
};

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// @desc    Get visible blog posts (Public)
// @route   GET /api/blogs
// @access  Public
const getPublicBlogs = async (req, res) => {
  try {
    await ensureDefaultBlogs();
    const blogs = await BlogPost.find({ isVisible: true }).sort({ order: 1, createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Failed to fetch blog posts', error: error.message });
  }
};

// @desc    Get single blog post by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    await ensureDefaultBlogs();
    const blog = await BlogPost.findOne({ slug: req.params.slug.toLowerCase(), isVisible: true });
    if (!blog) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ message: 'Failed to fetch article', error: error.message });
  }
};

// @desc    Get all blog posts (Admin)
// @route   GET /api/blogs/admin
// @access  Private/Admin
const getAdminBlogs = async (req, res) => {
  try {
    await ensureDefaultBlogs();
    const blogs = await BlogPost.find({}).sort({ order: 1, createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    res.status(500).json({ message: 'Failed to fetch blog posts', error: error.message });
  }
};

// @desc    Create new blog post
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
  try {
    const {
      title,
      titleBefore,
      titleAccent,
      titleAfter,
      slug,
      category,
      image,
      excerpt,
      content,
      readTime,
      date,
      order,
      isVisible,
      isFeatured
    } = req.body;

    if (!title || !excerpt || !image) {
      return res.status(400).json({ message: 'Title, excerpt, and image are required.' });
    }

    const calculatedSlug = slug ? generateSlug(slug) : generateSlug(title);

    // Check slug collision
    const existing = await BlogPost.findOne({ slug: calculatedSlug });
    if (existing) {
      return res.status(400).json({ message: `An article with slug "${calculatedSlug}" already exists.` });
    }

    const newBlog = await BlogPost.create({
      slug: calculatedSlug,
      title,
      titleBefore: titleBefore || '',
      titleAccent: titleAccent || '',
      titleAfter: titleAfter || '',
      category: category || 'The Grand Edit',
      image,
      excerpt,
      content: content || '',
      readTime: readTime || '5 min read',
      date: date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      order: Number(order) || 0,
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
      isFeatured: Boolean(isFeatured)
    });

    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Failed to create blog post', error: error.message });
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const {
      title,
      titleBefore,
      titleAccent,
      titleAfter,
      slug,
      category,
      image,
      excerpt,
      content,
      readTime,
      date,
      order,
      isVisible,
      isFeatured
    } = req.body;

    if (slug && generateSlug(slug) !== blog.slug) {
      const newSlug = generateSlug(slug);
      const existing = await BlogPost.findOne({ slug: newSlug, _id: { $ne: blog._id } });
      if (existing) {
        return res.status(400).json({ message: `Slug "${newSlug}" is already taken by another article.` });
      }
      blog.slug = newSlug;
    }

    if (title !== undefined) blog.title = title;
    if (titleBefore !== undefined) blog.titleBefore = titleBefore;
    if (titleAccent !== undefined) blog.titleAccent = titleAccent;
    if (titleAfter !== undefined) blog.titleAfter = titleAfter;
    if (category !== undefined) blog.category = category;
    if (image !== undefined) blog.image = image;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content !== undefined) blog.content = content;
    if (readTime !== undefined) blog.readTime = readTime;
    if (date !== undefined) blog.date = date;
    if (order !== undefined) blog.order = Number(order);
    if (isVisible !== undefined) blog.isVisible = Boolean(isVisible);
    if (isFeatured !== undefined) blog.isFeatured = Boolean(isFeatured);

    const updated = await blog.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Failed to update blog post', error: error.message });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await blog.deleteOne();
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Failed to delete article', error: error.message });
  }
};

module.exports = {
  getPublicBlogs,
  getBlogBySlug,
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog
};
