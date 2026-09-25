const ExportEnquiry = require('../../models/ExportEnquiry');
const Counter = require('../../models/Counter');
const CrmTask = require('../../models/CrmTask');

/**
 * Get all international export enquiries.
 */
exports.getExportEnquiries = async (req, res) => {
  try {
    const enquiries = await ExportEnquiry.find()
      .populate('assignedTradeManager', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, enquiries });
  } catch (error) {
    console.error('Error fetching export enquiries:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve export workspace data' });
  }
};

/**
 * Create a new international B2B export enquiry with auto-generated EXP-YYYY-XXXXX code.
 */
exports.createExportEnquiry = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { id: `export_enquiry_${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqNum = counter ? counter.seq : Math.floor(1000 + Math.random() * 9000);
    const code = `EXP-${year}-${String(seqNum).padStart(5, '0')}`;

    const buyerData = {
      companyName: req.body.importerName || req.body.buyer?.companyName || 'International Buyer',
      contactPerson: req.body.contactPerson || req.body.buyer?.contactPerson || req.body.importerName || 'Procurement Officer',
      email: req.body.email || req.body.buyer?.email || 'trade@exportpartner.com',
      phone: req.body.phone || req.body.buyer?.phone || '',
      buyerType: req.body.buyerType || req.body.buyer?.buyerType || 'importer_distributor'
    };

    const destinationData = {
      country: req.body.country || req.body.destination?.country || 'United Kingdom',
      city: req.body.city || req.body.destination?.city || 'London',
      destinationPort: req.body.destinationPort || req.body.destination?.destinationPort || ''
    };

    const itemsData = req.body.itemsRequested || (req.body.productsRequired ? [{
      productName: req.body.productsRequired,
      caseQuantity: req.body.palletQuantity ? req.body.palletQuantity * 50 : 10
    }] : [{
      productName: 'Fine Wine Allocations',
      caseQuantity: 10
    }]);

    const enquiry = new ExportEnquiry({
      ...req.body,
      buyer: buyerData,
      destination: destinationData,
      itemsRequested: itemsData,
      enquiryCode: code,
      assignedTradeManager: req.body.assignedTradeManager || req.user?._id
    });

    await enquiry.save();

    // Auto-generate follow-up task in Daily Operations Queue (Safe async)
    await CrmTask.create({
      title: `Prepare Export Quote: ${enquiry.buyer?.companyName || enquiry.buyer?.contactPerson} (${enquiry.destination?.country})`,
      category: 'export_quote',
      priority: 'high',
      dueDate: enquiry.nextFollowUpDate || new Date(Date.now() + 48 * 60 * 60 * 1000),
      dueAt: enquiry.nextFollowUpDate || new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedTo: enquiry.assignedTradeManager || req.user?._id,
      assignedBy: req.user?._id
    }).catch(e => console.warn('Could not auto-generate task for export:', e.message));

    return res.status(201).json({ success: true, enquiry });
  } catch (error) {
    console.error('Error creating export enquiry:', error);
    return res.status(500).json({ success: false, message: 'Failed to create export enquiry', error: error.message });
  }
};

/**
 * Update export documentation checklist.
 */
exports.updateExportDocumentation = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentKey, verified, fileUrl, documentationChecklist } = req.body;

    const enquiry = await ExportEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Export record not found' });

    if (!enquiry.documentationChecklist) {
      enquiry.documentationChecklist = {};
    }

    if (documentationChecklist && typeof documentationChecklist === 'object') {
      for (const [key, val] of Object.entries(documentationChecklist)) {
        const isVer = typeof val === 'object' ? Boolean(val.verified) : Boolean(val);
        const fUrl = typeof val === 'object' && val.fileUrl ? val.fileUrl : enquiry.documentationChecklist[key]?.fileUrl;
        enquiry.documentationChecklist[key] = {
          verified: isVer,
          fileUrl: fUrl
        };
      }
    } else if (documentKey) {
      enquiry.documentationChecklist[documentKey] = {
        verified: Boolean(verified),
        fileUrl: fileUrl || enquiry.documentationChecklist[documentKey]?.fileUrl
      };
    }

    await enquiry.save();

    return res.status(200).json({ success: true, enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update documentation checklist' });
  }
};

/**
 * Update export pipeline stage.
 */
exports.updateExportStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    const enquiry = await ExportEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Export record not found' });

    enquiry.stage = stage;
    if (notes) {
      enquiry.internalNotes.push({
        note: notes,
        author: req.user?._id,
        authorName: req.user?.name || 'Trade Manager'
      });
    }

    await enquiry.save();

    return res.status(200).json({ success: true, enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update export stage' });
  }
};
