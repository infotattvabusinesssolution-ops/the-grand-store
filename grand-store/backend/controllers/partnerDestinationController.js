const PartnerDestination = require('../models/PartnerDestination');

const DEFAULT_PARTNERS = [
  {
    href: 'https://cigar.yogapranafitness.com/',
    image: '/assets/partners/cigar-connoisseur.webp',
    eyebrow: 'The Smoking Room',
    title: 'Cigar Connoisseur Club',
    description: 'African tobacco, rich heritage, and exceptional cigars for the considered collector.',
    label: 'Explore the club',
    order: 0,
    isVisible: true
  },
  {
    href: 'https://millionair.yogapranafitness.com/',
    image: '/assets/partners/millionaires-collection.webp',
    eyebrow: 'A Private World',
    title: 'Millionaires Collection',
    description: 'A distinctive world of premier sparkling wine and elevated private experiences.',
    label: 'Discover the collection',
    order: 1,
    isVisible: true
  }
];

// Helper to seed defaults if collection is empty or normalize legacy fields
const ensureDefaultPartners = async () => {
  const count = await PartnerDestination.countDocuments();
  if (count === 0) {
    try {
      await PartnerDestination.insertMany(DEFAULT_PARTNERS);
    } catch (e) {
      console.error('Failed to seed default partner destinations:', e.message);
    }
  } else {
    // Sync any legacy documents that had isActive instead of isVisible
    await PartnerDestination.updateMany(
      { isVisible: { $exists: false }, isActive: true },
      { $set: { isVisible: true } }
    );
  }
};

// @desc    Get visible partner destinations (Public)
// @route   GET /api/partners
// @access  Public
const getPublicPartners = async (req, res) => {
  try {
    await ensureDefaultPartners();
    const partners = await PartnerDestination.find({
      $or: [{ isVisible: true }, { isVisible: { $exists: false }, isActive: true }]
    }).sort({ order: 1, createdAt: 1 });
    res.json(partners);
  } catch (error) {
    console.error('Error fetching partner destinations:', error);
    res.status(500).json({ message: 'Failed to fetch partner destinations', error: error.message });
  }
};

// @desc    Get all partner destinations (Admin)
// @route   GET /api/partners/admin
// @access  Private/Admin
const getAdminPartners = async (req, res) => {
  try {
    await ensureDefaultPartners();
    const partners = await PartnerDestination.find({}).sort({ order: 1, createdAt: 1 });
    res.json(partners);
  } catch (error) {
    console.error('Error fetching admin partner destinations:', error);
    res.status(500).json({ message: 'Failed to fetch partner destinations', error: error.message });
  }
};

// @desc    Create new partner destination
// @route   POST /api/partners
// @access  Private/Admin
const createPartner = async (req, res) => {
  try {
    const { title, eyebrow, description, href, image, label, order, isVisible } = req.body;

    if (!title || !description || !href || !image) {
      return res.status(400).json({ message: 'Title, description, link URL, and image are required.' });
    }

    const partner = await PartnerDestination.create({
      title,
      eyebrow: eyebrow || 'Partner House',
      description,
      href,
      image,
      label: label || 'Explore house',
      order: Number(order) || 0,
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true
    });

    res.status(201).json(partner);
  } catch (error) {
    console.error('Error creating partner destination:', error);
    res.status(500).json({ message: 'Failed to create partner destination', error: error.message });
  }
};

// @desc    Update partner destination
// @route   PUT /api/partners/:id
// @access  Private/Admin
const updatePartner = async (req, res) => {
  try {
    const partner = await PartnerDestination.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner destination not found' });
    }

    const { title, eyebrow, description, href, image, label, order, isVisible } = req.body;

    if (title !== undefined) partner.title = title;
    if (eyebrow !== undefined) partner.eyebrow = eyebrow;
    if (description !== undefined) partner.description = description;
    if (href !== undefined) partner.href = href;
    if (image !== undefined) partner.image = image;
    if (label !== undefined) partner.label = label;
    if (order !== undefined) partner.order = Number(order);
    if (isVisible !== undefined) partner.isVisible = Boolean(isVisible);

    const updated = await partner.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating partner destination:', error);
    res.status(500).json({ message: 'Failed to update partner destination', error: error.message });
  }
};

// @desc    Delete partner destination
// @route   DELETE /api/partners/:id
// @access  Private/Admin
const deletePartner = async (req, res) => {
  try {
    const partner = await PartnerDestination.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner destination not found' });
    }

    await partner.deleteOne();
    res.json({ message: 'Partner destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner destination:', error);
    res.status(500).json({ message: 'Failed to delete partner destination', error: error.message });
  }
};

module.exports = {
  getPublicPartners,
  getAdminPartners,
  createPartner,
  updatePartner,
  deletePartner
};
