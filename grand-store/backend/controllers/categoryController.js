const Category = require('../models/Category');

const Product = require('../models/Product');
const { getCache, setCache } = require('../utils/cache');

// @desc    Get all active categories with their taxonomy
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const cacheKey = 'categories_all';
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // 1. Fetch configured categories from DB
    const configuredCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    // 2. Fetch products to build taxonomy
    const products = await Product.find({
      type: { $ne: 'accessory' },
      isCatalogDuplicate: { $ne: true }
    }).select('category type country subcategory brand').lean();

    const taxonomy = new Map();
    
    // Pre-populate taxonomy with configured categories
    for (const cat of configuredCategories) {
      taxonomy.set(cat.name, {
        countries: new Map(),
        brands: new Set(),
        subcategories: new Set(),
        slug: cat.slug,
        description: cat.description,
        brandLogos: cat.brandLogos || []
      });
    }

    // Process products
    for (const product of products) {
      const categoryName = String(product.category || product.type || '').trim();
      if (!categoryName) continue;
      
      // If we only want to show configured categories, we skip products that don't match.
      // Or we can dynamically add them if they exist in products but not configured.
      // The user wants admin to control categories, so let's only process if in taxonomy OR we dynamically add it if we want it to be fully dynamic.
      // Let's add it dynamically if it's not configured, but ideally they configure it.
      if (!taxonomy.has(categoryName)) {
        taxonomy.set(categoryName, {
          countries: new Map(),
          brands: new Set(),
          subcategories: new Set()
        });
      }

      const category = taxonomy.get(categoryName);
      const country = String(product.country || '').trim();
      const subcategory = String(product.subcategory || '').trim();
      const brand = String(product.brand || '').trim();
      
      if (brand) category.brands.add(brand);
      if (subcategory) category.subcategories.add(subcategory);
      if (country) {
        if (!category.countries.has(country)) category.countries.set(country, new Set());
        if (subcategory) category.countries.get(country).add(subcategory);
      }
    }

    const data = [...taxonomy.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, category], index) => ({
        id: index + 1,
        name,
        slug: category.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: category.description || '',
        brandLogos: category.brandLogos || [],
        icon: 'view-grid-outline', // Fallback icon, could add to model later
        brands: [...category.brands].sort(),
        subcategories: [...category.subcategories].sort(),
        countries: [...category.countries.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([country, subcategories]) => ({
            name: country,
            subcategories: [...subcategories].sort()
          }))
      }));

    setCache(cacheKey, { status: 1, data }, 300); // cache for 5 minutes

    res.status(200).json({ status: 1, data });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ status: 0, message: 'Server Error' });
  }
};

// @desc    Get all categories (including inactive)
// @route   GET /api/categories/admin
// @access  Private/Admin
const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, isActive, brandLogos } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      isActive: isActive !== undefined ? isActive : true,
      brandLogos: brandLogos || []
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive, brandLogos } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (brandLogos !== undefined) category.brandLogos = brandLogos;

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
