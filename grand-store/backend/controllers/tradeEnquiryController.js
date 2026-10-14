const TradeEnquiry = require('../models/TradeEnquiry');
const ExportEnquiry = require('../models/ExportEnquiry');
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

module.exports = {
  createEnquiry,
  getAdminEnquiries,
  updateEnquiryStatus
};
