const { VendorAcademyLesson, VendorAcademyConfig } = require('../models/VendorAcademy');

const DEFAULT_LESSONS = [
  {
    title: 'How to sell more on Grand Store',
    description: 'Learn best practices for listing allocation wines, spirits, and positioning your luxury inventory for maximum buyer traction.',
    category: 'Selling & Growth',
    duration: '4:12',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Optimize your bottle listings by detailing provenance, storage conditions (temperature control), and including professional high-resolution photos.',
    badge: 'Essential',
    sortOrder: 1,
    isPublished: true,
  },
  {
    title: 'How to photograph wine bottles & spirits',
    description: 'A masterclass in lighting, reflections, capsule seals, and clean studio backgrounds for premium bottles.',
    category: 'Photography & Presentation',
    duration: '6:45',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Avoid direct camera flash. Position soft side lights at 45 degrees and use a neutral dark or white matte backdrop to eliminate reflection.',
    badge: 'Featured',
    sortOrder: 2,
    isPublished: true,
  },
  {
    title: 'How to write great product descriptions',
    description: 'Craft compelling tasting notes, harvest vintage background, and food pairing recommendations that convert collectors.',
    category: 'Selling & Growth',
    duration: '3:30',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Include nose, palate, finish, oak maturation details, and drinking window suggestions to build immediate collector confidence.',
    badge: '',
    sortOrder: 3,
    isPublished: true,
  },
  {
    title: 'Understanding your dashboard payouts & fees',
    description: 'A comprehensive walkthrough of vendor settlement cycles, PayFast processing, commissions, and statement reconciliation.',
    category: 'Payouts & Finance',
    duration: '5:00',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Payments are disbursed directly to your registered South African business bank account according to standard settlement terms.',
    badge: 'Crucial',
    sortOrder: 4,
    isPublished: true,
  },
  {
    title: 'How to prepare and pack orders safely',
    description: 'Protective inflatable bottle sleeves, double-wall corrugated boxing, and tamper-evident courier sealing.',
    category: 'Fulfillment & Packaging',
    duration: '8:20',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Fragile liquids must always use certified molded pulp or air-column packaging to avoid transit damage and insurance invalidation.',
    badge: 'Important',
    sortOrder: 5,
    isPublished: true,
  },
  {
    title: 'Selling to trade & corporate hospitality customers',
    description: 'Unlock corporate gift orders, private cellar acquisitions, and bulk allocation shipments through verified business accounts.',
    category: 'Trade & B2B',
    duration: '7:15',
    videoUrl: '',
    thumbnail: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?q=80&w=600&auto=format&fit=crop',
    articleContent: 'Corporate buyers value consistent stock volume and VAT invoicing. Keep inventory counts updated in real-time.',
    badge: '',
    sortOrder: 6,
    isPublished: true,
  },
];

// Helper to get or create config singleton
const getOrCreateConfig = async () => {
  let config = await VendorAcademyConfig.findOne();
  if (!config) {
    config = await VendorAcademyConfig.create({});
  }
  return config;
};

// GET /api/academy (Public/Vendor view)
const getPublicAcademy = async (req, res) => {
  try {
    let config = await getOrCreateConfig();
    let lessons = await VendorAcademyLesson.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    // Auto-seed if database is currently empty
    if (lessons.length === 0) {
      await VendorAcademyLesson.insertMany(DEFAULT_LESSONS);
      lessons = await VendorAcademyLesson.find({ isPublished: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    }

    res.json({
      config,
      lessons,
    });
  } catch (error) {
    console.error('Error fetching public vendor academy:', error);
    res.status(500).json({ message: 'Failed to load Vendor Academy content' });
  }
};

// GET /api/academy/admin (Admin view with all lessons, published & unpublished)
const getAdminAcademy = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    let lessons = await VendorAcademyLesson.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    if (lessons.length === 0) {
      await VendorAcademyLesson.insertMany(DEFAULT_LESSONS);
      lessons = await VendorAcademyLesson.find()
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    }

    res.json({
      config,
      lessons,
    });
  } catch (error) {
    console.error('Error fetching admin vendor academy:', error);
    res.status(500).json({ message: 'Failed to load Vendor Academy admin data' });
  }
};

// POST /api/academy/admin (Create new lesson)
const createLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      videoUrl,
      duration,
      thumbnail,
      articleContent,
      badge,
      sortOrder,
      isPublished,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Lesson title is required' });
    }

    const lesson = await VendorAcademyLesson.create({
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'Selling & Growth',
      videoUrl: videoUrl?.trim() || '',
      duration: duration?.trim() || '5:00',
      thumbnail: thumbnail?.trim() || '',
      articleContent: articleContent?.trim() || '',
      badge: badge?.trim() || '',
      sortOrder: Number(sortOrder) || 0,
      isPublished: isPublished !== false,
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error creating vendor academy lesson:', error);
    res.status(500).json({ message: 'Failed to create lesson' });
  }
};

// PUT /api/academy/admin/:id (Update lesson)
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await VendorAcademyLesson.findById(id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const fields = [
      'title',
      'description',
      'category',
      'videoUrl',
      'duration',
      'thumbnail',
      'articleContent',
      'badge',
      'sortOrder',
      'isPublished',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });

    await lesson.save();
    res.json(lesson);
  } catch (error) {
    console.error('Error updating vendor academy lesson:', error);
    res.status(500).json({ message: 'Failed to update lesson' });
  }
};

// DELETE /api/academy/admin/:id (Delete lesson)
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await VendorAcademyLesson.findByIdAndDelete(id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor academy lesson:', error);
    res.status(500).json({ message: 'Failed to delete lesson' });
  }
};

// PUT /api/academy/admin/config (Update academy config & support channels)
const updateConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();

    const allowed = [
      'heroTitle',
      'heroSubtitle',
      'sidebarLabel',
      'sidebarBadge',
      'isEnabled',
      'whatsappNumber',
      'whatsappMessage',
      'ticketUrl',
      'helpCentreUrl',
      'requestCallPhone',
    ];

    allowed.forEach((k) => {
      if (req.body[k] !== undefined) {
        config[k] = req.body[k];
      }
    });

    await config.save();
    res.json(config);
  } catch (error) {
    console.error('Error updating vendor academy config:', error);
    res.status(500).json({ message: 'Failed to update configuration' });
  }
};

// POST /api/academy/admin/seed (Reset to default curriculum)
const seedDefaults = async (req, res) => {
  try {
    await VendorAcademyLesson.deleteMany({});
    await VendorAcademyLesson.insertMany(DEFAULT_LESSONS);
    const lessons = await VendorAcademyLesson.find().sort({ sortOrder: 1 });
    res.json({ message: 'Vendor Academy curriculum reset to standard defaults', lessons });
  } catch (error) {
    console.error('Error resetting defaults:', error);
    res.status(500).json({ message: 'Failed to reset curriculum' });
  }
};

module.exports = {
  getPublicAcademy,
  getAdminAcademy,
  createLesson,
  updateLesson,
  deleteLesson,
  updateConfig,
  seedDefaults,
};
