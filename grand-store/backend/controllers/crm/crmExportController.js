const ExportEnquiry = require('../../models/ExportEnquiry');
const Counter = require('../../models/Counter');
const CrmTask = require('../../models/CrmTask');
const Vendor = require('../../models/Vendor');
const Product = require('../../models/Product');

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

/**
 * Add an internal note to the export enquiry / customer dossier.
 */
exports.addExportNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, authorName } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const enquiry = await ExportEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Export record not found' });
    }

    if (!enquiry.internalNotes) {
      enquiry.internalNotes = [];
    }

    const staffName = req.user?.name || authorName || 'Trade Manager';
    const newNote = {
      note: note.trim(),
      author: req.user?._id,
      authorName: staffName,
      createdAt: new Date()
    };

    enquiry.internalNotes.push(newNote);
    await enquiry.save();

    // Optionally sync note to Customer profile if registered in User model
    if (enquiry.buyer?.email) {
      try {
        const User = require('../../models/User');
        const customer = await User.findOne({ email: enquiry.buyer.email.toLowerCase() });
        if (customer) {
          if (!customer.crmInternalNotes) customer.crmInternalNotes = [];
          customer.crmInternalNotes.push({
            note: `[Export ${enquiry.enquiryCode}]: ${note.trim()}`,
            author: req.user?._id,
            authorName: staffName,
            createdAt: new Date()
          });
          await customer.save();
        }
      } catch (syncErr) {
        console.warn('Note synced to enquiry, customer sync skipped:', syncErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Note added to export dossier',
      enquiry,
      note: newNote,
      internalNotes: enquiry.internalNotes
    });
  } catch (error) {
    console.error('Error adding export note:', error);
    return res.status(500).json({ success: false, message: 'Failed to add note to export enquiry' });
  }
};

/**
 * Get all vendors registered with international export capabilities or export profiles.
 */
exports.getExportVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      $or: [
        { sellingCapabilities: { $in: ['international', 'both'] } },
        { vendorType: 'international' },
        { 'exportProfile.isExportApproved': { $in: ['approved', 'pending_approval', 'rejected'] } },
        { 'customsInfo.exportCode': { $exists: true, $ne: '' } }
      ]
    })
      .populate('userId', 'name email createdAt role')
      .sort({ updatedAt: -1 });

    // Enhance vendors with trade product count
    const vendorIds = [
      ...vendors.map(v => v._id),
      ...vendors.map(v => v.userId?._id || v.userId).filter(Boolean)
    ];
    const tradeProductCounts = await Product.aggregate([
      {
        $match: {
          vendorId: { $in: vendorIds },
          $or: [
            { 'channelSettings.trade.enabled': true },
            { exportReady: true },
            { tradePrice: { $gt: 0 } }
          ]
        }
      },
      {
        $group: {
          _id: '$vendorId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    tradeProductCounts.forEach(item => {
      countMap[String(item._id)] = item.count;
    });

    const enrichedVendors = vendors.map(v => {
      const vId = String(v._id);
      const uId = String(v.userId?._id || v.userId || '');
      const count = countMap[vId] || countMap[uId] || 0;
      return {
        ...v.toObject(),
        tradeProductCount: count
      };
    });

    return res.status(200).json({
      success: true,
      vendors: enrichedVendors,
      total: enrichedVendors.length
    });
  } catch (error) {
    console.error('Error fetching export vendors:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve export vendors', error: error.message });
  }
};

/**
 * Update vendor export verification status and compliance sign-off.
 */
exports.updateVendorExportVerification = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, reviewerNotes } = req.body;

    if (!['approved', 'pending_approval', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid export approval status' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (!vendor.exportProfile) {
      vendor.exportProfile = {};
    }

    vendor.exportProfile.approvalStatus = status;
    vendor.exportProfile.isExportApproved = status;
    vendor.exportProfile.verifiedAt = new Date();
    vendor.exportProfile.verifiedBy = req.user?._id;
    if (reviewerNotes !== undefined) {
      vendor.exportProfile.reviewerNotes = reviewerNotes;
    }

    // Also update any matching product export statuses if approved
    if (status === 'approved') {
      const vUserIds = [vendor._id, vendor.userId].filter(Boolean);
      await Product.updateMany(
        { vendorId: { $in: vUserIds }, 'channelSettings.trade.enabled': true },
        { $set: { 'channelSettings.trade.exportApprovalStatus': 'approved' } }
      );
    }

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor export capability set to ${status}`,
      vendor
    });
  } catch (error) {
    console.error('Error updating vendor export verification:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vendor verification', error: error.message });
  }
};

/**
 * Automated Export Supplier Matching Tool:
 * Scans verified export vendors & master catalogue matching category, volume, destination market, lead time.
 */
exports.matchExportSuppliers = async (req, res) => {
  try {
    const { 
      category, 
      destinationMarket, 
      volumeCases = 10, 
      maxLeadTimeDays,
      incoterm 
    } = req.body;

    // Find export approved or capability-enabled vendors
    const vendorQuery = {
      $or: [
        { 'exportProfile.isExportApproved': 'approved' },
        { sellingCapabilities: { $in: ['international', 'both'] } },
        { vendorType: 'international' }
      ]
    };

    if (category) {
      vendorQuery.productCategories = { $regex: new RegExp(category, 'i') };
    }

    const vendors = await Vendor.find(vendorQuery).populate('userId', 'name email');

    // Find trade products for these vendors
    const vendorIds = [
      ...vendors.map(v => v._id),
      ...vendors.map(v => v.userId?._id || v.userId).filter(Boolean)
    ];
    const productQuery = {
      vendorId: { $in: vendorIds },
      $or: [
        { 'channelSettings.trade.enabled': true },
        { exportReady: true },
        { tradePrice: { $gt: 0 } }
      ]
    };

    if (category) {
      productQuery.$and = [
        {
          $or: [
            { type: { $regex: new RegExp(category, 'i') } },
            { category: { $regex: new RegExp(category, 'i') } }
          ]
        }
      ];
    }

    const products = await Product.find(productQuery);

    // Group products by vendor
    const productsByVendor = {};
    products.forEach(p => {
      const vId = String(p.vendorId);
      if (!productsByVendor[vId]) productsByVendor[vId] = [];
      productsByVendor[vId].push(p);
    });

    // Score and rank matches
    const matches = vendors.map(vendor => {
      const vId = String(vendor._id);
      const uId = String(vendor.userId?._id || vendor.userId || '');
      const vendorProducts = productsByVendor[vId] || productsByVendor[uId] || [];
      const ep = vendor.exportProfile || {};
      
      let matchScore = 50; // base score for export capability
      const matchReasons = [];

      // Verification bonus
      const isApproved = ep.approvalStatus === 'approved' || ep.isExportApproved === 'approved';
      if (isApproved) {
        matchScore += 25;
        matchReasons.push('Verified Export Supplier');
      } else {
        matchReasons.push('Pending Export Audit');
      }

      // Market destination check
      if (destinationMarket) {
        const destLower = destinationMarket.toLowerCase();
        const restricted = (ep.restrictedMarkets || []).map(m => m.toLowerCase());
        const targets = (ep.targetMarkets || []).map(m => m.toLowerCase());

        if (restricted.some(r => destLower.includes(r))) {
          matchScore -= 50;
          matchReasons.push(`Restricted for ${destinationMarket}`);
        } else if (targets.some(t => destLower.includes(t) || t === 'all' || t === 'global')) {
          matchScore += 15;
          matchReasons.push(`Target Export Market Match: ${destinationMarket}`);
        }
      }

      // Incoterm check
      if (incoterm && ep.supportedIncoterms && ep.supportedIncoterms.length > 0) {
        if (ep.supportedIncoterms.includes(incoterm.toUpperCase())) {
          matchScore += 10;
          matchReasons.push(`Supports ${incoterm.toUpperCase()} Shipping`);
        }
      }

      // Capacity check
      if (ep.monthlyCapacityCases && ep.monthlyCapacityCases >= volumeCases) {
        matchScore += 10;
        matchReasons.push(`Sufficient capacity (${ep.monthlyCapacityCases.toLocaleString()} cases/mo)`);
      }

      // Product availability
      if (vendorProducts.length > 0) {
        matchScore += 10;
        matchReasons.push(`${vendorProducts.length} export product(s) available in catalogue`);
      }

      const finalScore = Math.min(100, Math.max(0, matchScore));

      return {
        vendor: {
          _id: vendor._id,
          businessName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || vendor.userId?.name || 'Producer',
          exportCode: ep.customsExportCode || vendor.customsInfo?.exportCode || 'N/A',
          isExportApproved: ep.isExportApproved || 'pending_approval',
          exportExperienceYears: ep.exportExperienceYears || 0,
          monthlyCapacityCases: ep.monthlyCapacityCases || 'Not specified',
          supportedIncoterms: ep.supportedIncoterms || ['FOB', 'EXW'],
          productCategories: vendor.productCategories || []
        },
        matchingProducts: vendorProducts.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.category || p.type,
          price: p.price,
          tradePrice: p.tradePrice || p.channelSettings?.trade?.volumePricingTiers?.[0]?.pricePerBottle || Math.round(p.price * 0.65),
          moqBottles: p.channelSettings?.trade?.minimumOrderQuantityBottles || p.minOrderQuantity || 60,
          bottlesPerCase: p.channelSettings?.trade?.bottlesPerCase || 6,
          casesPerPallet: p.channelSettings?.trade?.casesPerPallet || 56,
          image: p.image
        })),
        matchScore: finalScore,
        matchReasons
      };
    });

    // Sort by highest match score first
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      query: { category, destinationMarket, volumeCases, maxLeadTimeDays, incoterm },
      totalMatches: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error running supplier matching engine:', error);
    return res.status(500).json({ success: false, message: 'Supplier matching error', error: error.message });
  }
};

/**
 * Manage vendor quotation and platform commission on export enquiry.
 */
exports.updateExportQuoteAndCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { platformCommissionPct, vendorQuotes, proformaAdjustments, status } = req.body;

    const enquiry = await ExportEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Export enquiry not found' });
    }

    if (platformCommissionPct !== undefined) {
      enquiry.platformCommissionPct = Number(platformCommissionPct);
    }

    if (Array.isArray(vendorQuotes)) {
      enquiry.vendorQuotes = vendorQuotes;
    }

    if (status) {
      enquiry.stage = status;
    }

    // Recalculate quotation if requested
    if (proformaAdjustments) {
      enquiry.financials = {
        ...enquiry.financials?.toObject?.() || {},
        ...proformaAdjustments
      };
    }

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Export quote and commission updated successfully',
      enquiry
    });
  } catch (error) {
    console.error('Error updating export quote:', error);
    return res.status(500).json({ success: false, message: 'Failed to update export quote', error: error.message });
  }
};

