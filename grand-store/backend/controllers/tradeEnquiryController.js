const mongoose = require('mongoose');
const TradeEnquiry = require('../models/TradeEnquiry');
const ExportEnquiry = require('../models/ExportEnquiry');
const TradeOrder = require('../models/TradeOrder');
const Counter = require('../models/Counter');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new trade enquiry or multi-vendor B2B export RFQ
// @route   POST /api/trade-enquiries
// @access  Public (No login required)
const createEnquiry = async (req, res) => {
  try {
    const { 
      fullname, 
      email, 
      phone, 
      companyname, 
      website, 
      message, 
      source,
      destinationCountry,
      destinationPort,
      incoterms,
      currency,
      targetArrivalDate,
      itemsRequested
    } = req.body;

    // Honeypot check
    if (website) {
      return res.status(200).json({ success: true, message: 'Enquiry received' });
    }

    if (!fullname || !email) {
      return res.status(400).json({ success: false, message: 'Please provide both your name and email address.' });
    }

    const enquiry = await TradeEnquiry.create({
      fullname,
      email,
      phone,
      companyname,
      message,
      source: source || 'enquiry'
    });

    let exportEnquiry = null;

    // If RFQ contains international export details or products requested
    if (destinationCountry || (Array.isArray(itemsRequested) && itemsRequested.length > 0)) {
      try {
        const year = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
          { id: `export_enquiry_${year}` },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        const seqNum = counter ? counter.seq : Math.floor(1000 + Math.random() * 9000);
        const code = `EXP-${year}-${String(seqNum).padStart(5, '0')}`;

        // Enrich items with vendorId if missing
        let enrichedItems = [];
        if (Array.isArray(itemsRequested) && itemsRequested.length > 0) {
          const productIds = itemsRequested.filter(it => it.productId).map(it => it.productId);
          const products = await Product.find({ _id: { $in: productIds } }).select('_id vendorId name');
          const pMap = {};
          products.forEach(p => { pMap[String(p._id)] = p; });

          enrichedItems = itemsRequested.map(it => {
            const foundProd = it.productId ? pMap[String(it.productId)] : null;
            return {
              ...it,
              vendorId: it.vendorId || foundProd?.vendorId || null,
              productName: it.productName || foundProd?.name || 'Selected Wine/Spirit',
              caseQuantity: Number(it.caseQuantity) || 10,
              bottlesPerCase: Number(it.bottlesPerCase) || 6
            };
          });
        }

        // Create Parent Export Enquiry
        exportEnquiry = await ExportEnquiry.create({
          enquiryCode: code,
          buyer: {
            companyName: companyname || 'International Trade Buyer',
            contactPerson: fullname,
            email,
            phone: phone || '',
            buyerType: 'importer_distributor'
          },
          destination: {
            country: destinationCountry || 'International Destination',
            destinationPort: destinationPort || ''
          },
          itemsRequested: enrichedItems.length > 0 ? enrichedItems : [{
            productName: message ? (message.length > 60 ? message.slice(0, 60) : message) : 'Fine Wine & Spirits Portfolio',
            caseQuantity: 20
          }],
          incoterms: incoterms || 'FOB',
          currency: currency || 'USD',
          targetArrivalDate: targetArrivalDate || null,
          stage: 'enquiry_received',
          notes: message || ''
        });

        // Parent-Child RFQ Splitting:
        // Group items by vendorId and create child sub-enquiries for each unique vendor
        const itemsByVendor = {};
        enrichedItems.forEach(item => {
          if (item.vendorId) {
            const vKey = String(item.vendorId);
            if (!itemsByVendor[vKey]) itemsByVendor[vKey] = [];
            itemsByVendor[vKey].push(item);
          }
        });

        const vendorIds = Object.keys(itemsByVendor);
        for (let i = 0; i < vendorIds.length; i++) {
          const vId = vendorIds[i];
          const subCode = `${code}-V${i + 1}`;
          const childEnquiry = await ExportEnquiry.create({
            enquiryCode: subCode,
            parentEnquiryId: exportEnquiry._id,
            vendorId: vId,
            buyer: exportEnquiry.buyer,
            destination: exportEnquiry.destination,
            itemsRequested: itemsByVendor[vId],
            incoterms: exportEnquiry.incoterms,
            currency: exportEnquiry.currency,
            stage: 'enquiry_received'
          });

          // Notify vendor
          try {
            const vRecord = await Vendor.findById(vId).select('userId');
            if (vRecord?.userId) {
              await Notification.create({
                recipient: vRecord.userId,
                recipientType: 'vendor',
                title: 'New International Trade RFQ',
                message: `An international buyer in ${destinationCountry || 'overseas'} requested quotation for ${itemsByVendor[vId].length} of your products (${subCode}).`,
                type: 'system',
                link: '/vendor/trade-rfqs',
                metadata: { enquiryId: childEnquiry._id, enquiryCode: subCode }
              });
            }
          } catch (vNotifErr) {
            console.warn('Could not notify vendor of RFQ:', vNotifErr.message);
          }
        }
      } catch (expErr) {
        console.warn('Failed to generate synced ExportEnquiry:', expErr.message);
      }
    }

    // Notify all admin users
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        const sourceLabel = exportEnquiry ? `Global Trade RFQ (${exportEnquiry.enquiryCode})` : (source === 'app_promo' ? 'Homepage Form' : source === 'contact' ? 'Contact Form' : 'Trade Enquiry');
        const notifs = admins.map(adminUser => ({
          recipient: adminUser._id,
          recipientType: 'admin',
          title: `New Trade Enquiry: ${fullname}`,
          message: `${fullname} (${email}) submitted an enquiry: "${message ? (message.length > 80 ? message.slice(0, 80) + '...' : message) : 'Trade quotation requested'}"`,
          type: 'system',
          link: exportEnquiry ? `/crm/export-trade` : '/admin/trade-enquiries',
          metadata: { enquiryId: enquiry._id, exportEnquiryId: exportEnquiry?._id, email, phone, source }
        }));
        await Notification.insertMany(notifs);
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch admin notification for enquiry:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: exportEnquiry 
        ? `Your international trade quotation request (${exportEnquiry.enquiryCode}) has been received. Our trade team and suppliers are preparing proforma pricing.`
        : 'Your message has been sent directly to the Grand Store trade team.',
      data: enquiry,
      exportEnquiry: exportEnquiry ? {
        id: exportEnquiry._id,
        enquiryCode: exportEnquiry.enquiryCode
      } : null
    });
  } catch (error) {
    console.error('Error creating trade enquiry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all trade enquiries
// @route   GET /api/trade-enquiries
// @access  Private/Admin
const getAdminEnquiries = async (req, res) => {
  try {
    const enquiries = await TradeEnquiry.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: enquiries
    });
  } catch (error) {
    console.error('Error fetching trade enquiries:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update trade enquiry status
// @route   PUT /api/trade-enquiries/:id/status
// @access  Private/Admin
const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const enquiry = await TradeEnquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.status = status;
    const updatedEnquiry = await enquiry.save();

    res.status(200).json({
      success: true,
      data: updatedEnquiry
    });
  } catch (error) {
    console.error('Error updating trade enquiry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get buyer quotation review by enquiry code
// @route   GET /api/trade-enquiries/quote-review/:code
// @access  Public (Buyer access via link)
const getBuyerQuotationByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const isObjectId = mongoose.isValidObjectId(code);
    const enquiry = await ExportEnquiry.findOne({
      $or: [
        { enquiryCode: code.toUpperCase() },
        ...(isObjectId ? [{ _id: code }] : [])
      ]
    })
    .populate('itemsRequested.productId', 'name image category brand price tradePrice channelSettings')
    .populate('vendorId', 'name email');

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation or export enquiry not found' });
    }

    const tradeOrder = await TradeOrder.findOne({ exportEnquiryId: enquiry._id });

    res.status(200).json({
      success: true,
      enquiry,
      tradeOrder: tradeOrder || null
    });
  } catch (error) {
    console.error('Error fetching buyer quotation:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving quotation' });
  }
};

// @desc    Buyer online acceptance and proforma confirmation
// @route   POST /api/trade-enquiries/quote-accept/:code
// @access  Public
const acceptBuyerQuotation = async (req, res) => {
  try {
    const { code } = req.params;
    const { buyerName, buyerCompany, signatureNote } = req.body;

    const isObjectId = mongoose.isValidObjectId(code);
    const enquiry = await ExportEnquiry.findOne({
      $or: [
        { enquiryCode: code.toUpperCase() },
        ...(isObjectId ? [{ _id: code }] : [])
      ]
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Advance enquiry stage to confirmed_order
    enquiry.stage = 'confirmed_order';
    if (!enquiry.quotation) enquiry.quotation = {};
    enquiry.quotation.status = 'accepted';

    enquiry.internalNotes.push({
      note: `Buyer accepted commercial quotation online. Signer: ${buyerName || enquiry.buyer?.contactPerson} (${buyerCompany || enquiry.buyer?.companyName}). Note: ${signatureNote || 'Terms accepted.'}`,
      authorName: 'International Buyer Portal'
    });
    await enquiry.save();

    // Check if TradeOrder already created
    let tradeOrder = await TradeOrder.findOne({ exportEnquiryId: enquiry._id });
    if (!tradeOrder) {
      const year = new Date().getFullYear();
      const counter = await Counter.findOneAndUpdate(
        { id: `trade_order_${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seqNum = counter ? counter.seq : Math.floor(1000 + Math.random() * 9000);
      const orderCode = `TO-${year}-${String(seqNum).padStart(5, '0')}`;

      let subtotal = 0;
      let totalCases = 0;
      const orderItems = (enquiry.itemsRequested || []).map(item => {
        const bpc = item.bottlesPerCase || 6;
        const cases = item.caseQuantity || 10;
        const unitPrice = item.targetPricePerCase || (enquiry.quotation?.vendorQuoteAmount ? enquiry.quotation.vendorQuoteAmount / (enquiry.itemsRequested.length || 1) : 450);
        const lineTotal = cases * unitPrice;
        subtotal += lineTotal;
        totalCases += cases;
        return {
          productId: item.productId,
          productName: item.productName || 'Export Wine Allocation',
          bottlesPerCase: bpc,
          caseQuantity: cases,
          unitPrice,
          pricePerBottle: Math.round(unitPrice / bpc),
          lineTotal
        };
      });

      const freight = enquiry.quotation?.freightAmount || 0;
      const insurance = enquiry.quotation?.insuranceAmount || 0;
      const commissionPct = enquiry.quotation?.platformCommissionPct || 10;
      const commissionAmount = Math.round(subtotal * (commissionPct / 100));
      const grandTotal = subtotal + freight + insurance;

      tradeOrder = await TradeOrder.create({
        orderCode,
        exportEnquiryId: enquiry._id,
        vendorId: enquiry.vendorId,
        vendorName: enquiry.buyer?.companyName || 'Producer',
        buyer: enquiry.buyer,
        destination: enquiry.destination,
        items: orderItems,
        incoterms: enquiry.incoterms || 'FOB',
        currency: enquiry.currency || 'USD',
        financials: {
          subtotalAmount: subtotal,
          freightAmount: freight,
          insuranceAmount: insurance,
          platformCommissionPct: commissionPct,
          platformCommissionAmount: commissionAmount,
          grandTotalAmount: grandTotal
        },
        paymentTerms: enquiry.financials?.paymentTerms || '30% deposit upon proforma sign-off, 70% against Bill of Lading',
        leadTimeDays: enquiry.quotation?.leadTimeDays || 14,
        status: 'proforma_issued',
        inventoryReserved: true,
        reservedCasesCount: totalCases,
        buyerSignedAt: new Date(),
        buyerSignatureNote: signatureNote || 'Accepted online via Buyer Portal',
        milestones: [
          { title: 'Quotation Accepted by Buyer', status: 'completed', completedAt: new Date() },
          { title: 'Commercial Proforma Issued', status: 'completed', completedAt: new Date() },
          { title: 'Deposit Pending', status: 'pending' },
          { title: 'Cellar Bottling & Palletizing', status: 'pending' },
          { title: 'Port Dispatch & Customs Health Inspection', status: 'pending' }
        ]
      });

      // Reserve inventory for products
      for (const item of orderItems) {
        if (item.productId) {
          const bottlesToReserve = item.caseQuantity * item.bottlesPerCase;
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { reservedTradeStock: bottlesToReserve }
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Quotation accepted and confirmed successfully! Official commercial trade order created.',
      tradeOrder,
      enquiry
    });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({ success: false, message: 'Server error accepting quotation' });
  }
};

module.exports = {
  createEnquiry,
  getAdminEnquiries,
  updateEnquiryStatus,
  getBuyerQuotationByCode,
  acceptBuyerQuotation
};
