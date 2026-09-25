const CrmCommunication = require('../../models/CrmCommunication');
const CrmTask = require('../../models/CrmTask');

/**
 * Get unified communications stream.
 */
exports.getCommunications = async (req, res) => {
  try {
    const { channel, unassigned, search, limit = 50 } = req.query;
    const query = {};

    if (channel && channel !== 'all') {
      query.channel = channel;
    }

    if (unassigned === 'true') {
      query.assignedStaff = { $exists: false };
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { messageBody: { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'sender.email': { $regex: search, $options: 'i' } }
      ];
    }

    const comms = await CrmCommunication.find(query)
      .populate('customer', 'name email phone crmCustomerType')
      .populate('vendor', 'storeName email phone')
      .populate('assignedStaff', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, count: comms.length, comms });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve communications' });
  }
};

/**
 * Log a customer/vendor message, phone call, or email.
 */
exports.logCommunication = async (req, res) => {
  try {
    const {
      channel,
      direction,
      customer,
      vendor,
      subject,
      messageBody,
      recipient,
      phoneCallDetails,
      linkedEntity,
      createFollowUp,
      followUpDueDate
    } = req.body;

    const finalBody = messageBody || req.body.summary || req.body.notes || req.body.message;

    if (!channel || !finalBody) {
      return res.status(400).json({ success: false, message: 'Channel and message body are required' });
    }

    const comm = new CrmCommunication({
      channel,
      direction: direction || 'inbound',
      customer,
      vendor,
      subject: subject || (req.body.summary ? req.body.summary.slice(0, 40) : 'Customer Communication'),
      messageBody: finalBody,
      sender: {
        name: req.user?.name || 'Staff',
        email: req.user?.email,
        userId: req.user?._id
      },
      recipient,
      phoneCallDetails,
      linkedEntity,
      assignedStaff: req.user?._id
    });

    await comm.save();

    // Auto-create follow-up task if flagged
    if (createFollowUp && followUpDueDate) {
      await CrmTask.create({
        title: `Follow-up on ${channel.replace(/_/g, ' ')}: ${subject || messageBody.slice(0, 30)}`,
        category: channel === 'phone_call' ? 'scheduled_call' : 'customer_enquiry',
        priority: 'high',
        dueDate: followUpDueDate,
        assignedTo: req.user?._id,
        assignedBy: req.user?._id,
        linkedEntity
      });
    }

    return res.status(201).json({ success: true, message: 'Communication logged', communication: comm });
  } catch (error) {
    console.error('Error logging communication:', error);
    return res.status(500).json({ success: false, message: 'Failed to log communication' });
  }
};
