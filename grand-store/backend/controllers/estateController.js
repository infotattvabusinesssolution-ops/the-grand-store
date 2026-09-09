const EstateProfile = require('../models/EstateProfile');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ─── Helper: build slug from estate name ─────────────────────────────────────
const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── PUBLIC: List all published estates ──────────────────────────────────────
// GET /api/estates
exports.listEstates = async (req, res) => {
  try {
    const estates = await EstateProfile.find({ isPublished: true })
      .select('slug estateName region country tagline heroImageUrl followers awards')
      .lean();
    res.json(estates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get single estate by slug or ID ─────────────────────────────────
// GET /api/estates/:slug
exports.getEstate = async (req, res) => {
  try {
    const slugOrId = req.params.slug;
    let query = { slug: slugOrId, isPublished: true };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      query = {
        $or: [{ slug: slugOrId }, { _id: slugOrId }],
        isPublished: true,
      };
    }
    const estate = await EstateProfile.findOne(query)
      .populate('vendorId', 'name email')
      .lean();
    if (!estate) return res.status(404).json({ message: 'Estate not found' });

    // Also return this vendor's wine products from the shop
    // Note: Vendor added products use the 'type' field, while seeded products might use 'category'
    const products = await Product.find({ 
      vendorId: estate.vendorId._id,
      $or: [
        { category: 'Wine' },
        { type: { $regex: /^wine$/i } }
      ]
    }).lean();

    res.json({ estate, products });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── VENDOR: Get own estate profile ──────────────────────────────────────────
// GET /api/estates/my-profile
exports.getMyProfile = async (req, res) => {
  try {
    const estate = await EstateProfile.findOne({ vendorId: req.user._id }).lean();
    res.json(estate || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── VENDOR: Create or Update estate profile ─────────────────────────────────
// POST /api/estates/my-profile
exports.upsertMyProfile = async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate slug from estate name if not already set
    const existing = await EstateProfile.findOne({ vendorId: req.user._id });
    let slug = existing?.slug;
    if (!slug && data.estateName) {
      slug = slugify(data.estateName);
      // Ensure slug is unique by appending a suffix if needed
      let counter = 1;
      let candidate = slug;
      while (await EstateProfile.findOne({ slug: candidate, vendorId: { $ne: req.user._id } })) {
        candidate = `${slug}-${counter++}`;
      }
      slug = candidate;
    }

    const profile = await EstateProfile.findOneAndUpdate(
      { vendorId: req.user._id },
      { ...data, vendorId: req.user._id, slug },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ message: 'Estate profile saved', estate: profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── VENDOR: Publish / Unpublish ─────────────────────────────────────────────
// PATCH /api/estates/my-profile/publish
exports.togglePublish = async (req, res) => {
  try {
    const estate = await EstateProfile.findOne({ vendorId: req.user._id });
    if (!estate) return res.status(404).json({ message: 'No estate profile found. Create one first.' });

    estate.isPublished = !estate.isPublished;
    await estate.save();

    res.json({ message: estate.isPublished ? 'Estate published!' : 'Estate unpublished', isPublished: estate.isPublished });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── CUSTOMER: Follow / Unfollow ─────────────────────────────────────────────
// POST /api/estates/:id/follow
exports.toggleFollow = async (req, res) => {
  try {
    const estate = await EstateProfile.findById(req.params.id);
    if (!estate) return res.status(404).json({ message: 'Estate not found' });

    const userId = req.user._id;
    const alreadyFollowing = estate.followers.some(f => f.toString() === userId.toString());

    if (alreadyFollowing) {
      estate.followers = estate.followers.filter(f => f.toString() !== userId.toString());
    } else {
      estate.followers.push(userId);
    }

    await estate.save();
    res.json({ following: !alreadyFollowing, followerCount: estate.followers.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
