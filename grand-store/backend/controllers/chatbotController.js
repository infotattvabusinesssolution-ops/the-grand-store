const ChatbotFAQ = require('../models/ChatbotFAQ');
const {
  buildWebsiteKnowledge,
  cleanText
} = require('../services/chatbotKnowledgeService');
const {
  generateGroundedAnswer,
  getProviderOrder
} = require('../services/chatbotAiService');

const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || '+27824967256';

// @desc  Answer a customer using current public website data and managed FAQs
// @route POST /api/chatbot/message
// @access Public
exports.getAnswer = async (req, res) => {
  try {
    const message = cleanText(req.body?.message, 800);
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const faqs = await ChatbotFAQ.find({ isActive: true })
      .sort({ priority: -1 })
      .lean();
    const knowledge = await buildWebsiteKnowledge({ message, faqs });

    if (getProviderOrder().length) {
      try {
        const result = await generateGroundedAnswer({
          message,
          context: knowledge.context
        });
        return res.json({
          matched: knowledge.hasDirectEvidence,
          grounded: true,
          answer: result.answer,
          provider: result.provider,
          sources: knowledge.sources
        });
      } catch (error) {
        console.warn('Chatbot AI providers unavailable:', error.failures || error.message);
      }
    }

    // Keep the chatbot useful if every external AI provider is unavailable.
    if (knowledge.bestFaq) {
      return res.json({
        matched: true,
        grounded: true,
        question: knowledge.bestFaq.question,
        answer: knowledge.bestFaq.answer,
        category: knowledge.bestFaq.category,
        provider: 'faq',
        sources: knowledge.sources
      });
    }

    return res.json({
      matched: false,
      grounded: false,
      answer: "I couldn't confirm that from the current website information. Please contact our team on WhatsApp and we'll be happy to help.",
      whatsapp: SUPPORT_WHATSAPP,
      sources: [
        { label: 'Contact support', url: '/contact-us' },
        { label: 'Help & FAQs', url: '/faq' }
      ]
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get all active FAQs grouped by category (for quick-reply buttons)
// @route GET /api/chatbot/faqs
// @access Public
exports.getPublicFAQs = async (req, res) => {
  try {
    const faqs = await ChatbotFAQ.find({ isActive: true })
      .select('category question')
      .sort({ category: 1, priority: -1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get all FAQs (admin)
// @route GET /api/chatbot/admin/faqs
// @access Admin
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await ChatbotFAQ.find().sort({ category: 1, priority: -1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Create FAQ entry
// @route POST /api/chatbot/admin/faqs
// @access Admin
exports.createFAQ = async (req, res) => {
  try {
    const { category, keywords, question, answer, isActive, priority } = req.body;
    const faq = await ChatbotFAQ.create({
      category,
      keywords,
      question,
      answer,
      isActive,
      priority
    });
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Update FAQ entry
// @route PUT /api/chatbot/admin/faqs/:id
// @access Admin
exports.updateFAQ = async (req, res) => {
  try {
    const faq = await ChatbotFAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Delete FAQ entry
// @route DELETE /api/chatbot/admin/faqs/:id
// @access Admin
exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await ChatbotFAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
