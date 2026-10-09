const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  createInAppNotification,
} = require('../controllers/notificationController');

async function runNotificationTestSuite() {
  console.log('=== STARTING NOTIFICATION SYSTEM TEST SUITE ===');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/grand-store';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // Find or create test user
    let user = await User.findOne({ email: 'test_notification_user@grandstore.co.za' });
    if (!user) {
      user = await User.create({
        name: 'Notification Test Patron',
        email: 'test_notification_user@grandstore.co.za',
        password: 'Password123!',
        role: 'customer',
        isEmailVerified: true,
      });
    }

    // Clean up previous test notifications
    await Notification.deleteMany({ recipient: user._id });

    // 1. Create Sample Notifications of various types matching web & mobile
    const notif1 = await createInAppNotification({
      recipient: user._id,
      title: 'Order Dispatched #GS-ORD-9021',
      message: 'Your parcel containing 1x Glenfiddich 21Y Reserva Rum Cask has been handed to RAM Couriers.',
      type: 'delivery',
      metadata: { orderId: 'GS-ORD-9021' },
      link: '/customer/orders',
    });
    console.log('✅ TEST 1: Created delivery notification:', notif1.title);

    const notif2 = await createInAppNotification({
      recipient: user._id,
      title: 'Auction Won! Lot #17EB7',
      message: 'Congratulations! You won the 1982 Bordeaux Grand Vin at R18,500. Click to complete secure settlement.',
      type: 'auction',
      metadata: { lotId: '6a9edb94537d52a425cc4b5c' },
      link: '/auction/6a9edb94537d52a425cc4b5c?celebrate=true',
    });
    console.log('✅ TEST 2: Created auction won notification:', notif2.title);

    const notif3 = await createInAppNotification({
      recipient: user._id,
      title: 'VIP Cellar Tasting Pass Confirmed',
      message: 'Your reservation for the Islay Single Malts Masterclass is confirmed. Present your digital pass at reception.',
      type: 'event',
      metadata: { eventId: 'evt_islay_masterclass' },
      link: '/events',
    });
    console.log('✅ TEST 3: Created event tasting notification:', notif3.title);

    // 2. Query notifications and unread count
    const unread = await Notification.countDocuments({ recipient: user._id, isRead: false });
    if (unread !== 3) {
      throw new Error(`Expected 3 unread notifications, got ${unread}`);
    }
    console.log(`✅ TEST 4: Query unread count verified: ${unread}`);

    // 3. Mark single notification as read
    await Notification.findOneAndUpdate(
      { _id: notif1._id, recipient: user._id },
      { isRead: true }
    );
    const updatedUnread = await Notification.countDocuments({ recipient: user._id, isRead: false });
    if (updatedUnread !== 2) {
      throw new Error(`Expected 2 unread notifications after read, got ${updatedUnread}`);
    }
    console.log(`✅ TEST 5: Mark single notification read verified. Remaining unread: ${updatedUnread}`);

    // 4. Mark all as read
    await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { isRead: true }
    );
    const allReadCount = await Notification.countDocuments({ recipient: user._id, isRead: false });
    if (allReadCount !== 0) {
      throw new Error(`Expected 0 unread after markAllAsRead, got ${allReadCount}`);
    }
    console.log(`✅ TEST 6: Mark all notifications read verified. Remaining unread: ${allReadCount}`);

    // 5. Delete single notification
    await Notification.findOneAndDelete({ _id: notif3._id, recipient: user._id });
    const remainingCount = await Notification.countDocuments({ recipient: user._id });
    if (remainingCount !== 2) {
      throw new Error(`Expected 2 notifications after delete, got ${remainingCount}`);
    }
    console.log(`✅ TEST 7: Single notification deletion verified. Remaining: ${remainingCount}`);

    // Clean up
    await Notification.deleteMany({ recipient: user._id });
    await User.deleteOne({ _id: user._id });
    console.log('🧹 Cleaned up temporary notification test user from database.');
    await mongoose.disconnect();
    console.log('\n=== ALL 7 NOTIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ NOTIFICATION TEST FAILED:', err);
    process.exit(1);
  }
}

runNotificationTestSuite();
