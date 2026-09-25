const Order = require('../../models/Order');
const Shipment = require('../../models/Shipment');
const Vendor = require('../../models/Vendor');
const TradeEnquiry = require('../../models/TradeEnquiry');
const WineEnquiry = require('../../models/WineEnquiry');
const CigarEnquiry = require('../../models/CigarEnquiry');
const CrmTask = require('../../models/CrmTask');

/**
 * Returns consolidated Morning Screen metrics and actionable work queues.
 */
exports.getDailyOperationsSummary = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    const [
      ordersTodayCount,
      newOrdersList,
      tradeEnquiriesCount,
      wineEnquiriesCount,
      cigarEnquiriesCount,
      pendingVendorsList,
      delayedShipmentsList,
      overdueTasksList,
      todayTasksList
    ] = await Promise.all([
      // 1. Orders Today Count
      Order.countDocuments({ createdAt: { $gte: todayStart } }),

      // 2. Recent Orders Today
      Order.find({ createdAt: { $gte: todayStart } })
        .select('orderId totalAmount status isPaid createdAt user orderItems shippingAddress')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(10),

      // 3. Open Customer Enquiries
      TradeEnquiry.countDocuments({ status: { $in: ['new', 'pending', 'under_review', 'Open'] } }),
      WineEnquiry.countDocuments({ status: { $in: ['new', 'pending', 'in_progress', 'Open'] } }),
      CigarEnquiry.countDocuments({ status: { $in: ['new', 'pending', 'in_progress', 'Open'] } }),

      // 4. Pending Vendor Verifications
      Vendor.find({ status: 'pending' })
        .select('name storeName email phone kycDocuments kycStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(10),

      // 5. Delayed Shipments Requiring Operations Attention
      Shipment.find({
        status: { $in: ['Delayed', 'Failed', 'Exception'] }
      })
      .populate('orderId', 'orderId user shippingAddress totalAmount')
      .sort({ updatedAt: -1 })
      .limit(15),

      // 6. Overdue Follow-up Tasks
      CrmTask.find({
        status: { $in: ['open', 'in_progress'] },
        dueDate: { $lt: now }
      })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 })
      .limit(20),

      // 7. Today's Scheduled Work Queue
      CrmTask.find({
        status: { $in: ['open', 'in_progress'] },
        dueDate: { $gte: todayStart, $lte: todayEnd }
      })
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, dueDate: 1 })
      .limit(50)
    ]);

    const totalNewEnquiries = tradeEnquiriesCount + wineEnquiriesCount + cigarEnquiriesCount;
    const vendorTasksCount = pendingVendorsList.length;

    return res.status(200).json({
      success: true,
      metrics: {
        ordersToday: ordersTodayCount,
        newEnquiries: totalNewEnquiries,
        vendorTasks: vendorTasksCount,
        overdueFollowups: overdueTasksList.length,
        breakdown: {
          tradeEnquiries: tradeEnquiriesCount,
          wineEnquiries: wineEnquiriesCount,
          cigarEnquiries: cigarEnquiriesCount,
          pendingVendorDocs: pendingVendorsList.length
        }
      },
      attentionRequired: {
        overdueTasks: overdueTasksList,
        delayedShipments: delayedShipmentsList,
        pendingVendorRegistrations: pendingVendorsList
      },
      workQueue: {
        todayTasks: todayTasksList,
        recentOrders: newOrdersList
      }
    });
  } catch (error) {
    console.error('Error in getDailyOperationsSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily operations data',
      error: error.message
    });
  }
};

/**
 * Get tasks with multi-factor filtering.
 */
exports.getTasks = async (req, res) => {
  try {
    const { status, category, priority, assignedTo, overdue, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (overdue === 'true') {
      query.status = { $in: ['open', 'in_progress'] };
      query.dueDate = { $lt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      CrmTask.find(query)
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email')
        .sort({ dueDate: 1, priority: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CrmTask.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getTasks:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tasks' });
  }
};

/**
 * Create a new task.
 */
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      assignedTo,
      dueDate,
      reminderDate,
      linkedEntity
    } = req.body;

    const calculatedDueDate = dueDate 
      ? new Date(dueDate) 
      : req.body.dueHours 
      ? new Date(Date.now() + Number(req.body.dueHours) * 3600000) 
      : req.body.dueAt 
      ? new Date(req.body.dueAt) 
      : null;

    if (!title || !calculatedDueDate) {
      return res.status(400).json({ success: false, message: 'Title and due date are required' });
    }

    const validCategories = [
      'customer_enquiry', 'order_fulfilment', 'shipment_delay', 'vendor_verification',
      'vendor_product_review', 'export_quote', 'auction_followup', 'tasting_event',
      'scheduled_call', 'vip_clients', 'logistics', 'auctions', 'compliance', 'settlements', 'general'
    ];
    const catInput = category || req.body.department;
    const finalCategory = validCategories.includes(catInput) ? catInput : 'general';

    const task = new CrmTask({
      title,
      description,
      category: finalCategory,
      priority: priority || 'medium',
      assignedTo: assignedTo || req.user?._id,
      assignedBy: req.user?._id,
      dueDate: calculatedDueDate,
      dueAt: calculatedDueDate,
      reminderDate,
      linkedEntity
    });

    await task.save();

    const populatedTask = await CrmTask.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

/**
 * Update task status (Enforces Golden Staff Rule: Completion reason mandatory on close).
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionReason, resolutionOutcome, internalNote } = req.body;

    const task = await CrmTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (status === 'completed') {
      if (!completionReason || completionReason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'A documented completion reason is required to close this task (Golden Staff Rule).'
        });
      }
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedBy = req.user?._id;
      task.completionReason = completionReason;
      task.resolutionOutcome = resolutionOutcome || 'resolved_in_full';
      task.isOverdue = false;
    } else if (status) {
      task.status = status;
      if (status === 'in_progress') {
        task.completedAt = null;
        task.completedBy = null;
      }
    }

    if (internalNote) {
      task.internalNotes.push({
        note: internalNote,
        author: req.user?._id,
        authorName: req.user?.name || 'Staff'
      });
    }

    await task.save();

    const updated = await CrmTask.findById(id)
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name');

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updated
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
};

/**
 * Append an internal note to task history.
 */
exports.addTaskNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const task = await CrmTask.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.internalNotes.push({
      note,
      author: req.user?._id,
      authorName: req.user?.name || 'Staff'
    });

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Note added to task',
      internalNotes: task.internalNotes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add note to task' });
  }
};
