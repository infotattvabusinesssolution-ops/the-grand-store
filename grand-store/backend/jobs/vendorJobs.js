const cron = require("node-cron");
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const { sendEmail } = require("../utils/emailService");
const { generateEmailTemplate } = require("../utils/emailTemplates");


const startVendorJobs = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running Vendor Trial Expiry Check...");
    try {
      const now = new Date();
      
      // 1. Expiration check
      const expiredVendors = await Vendor.find({
        trialStatus: "active",
        freeTrialExpiry: { $lte: now }
      });

      for (const vendor of expiredVendors) {
        vendor.trialStatus = "expired";
        vendor.paymentStatus = "unpaid";
        await vendor.save();

        const user = await User.findById(vendor.userId);
        if (user) {
          user.role = "vendor_approved_unpaid";
          await user.save();
          
          // Send Expiry Notification
          try {
            await sendEmail({
              to: user.email,
              subject: "Your Vendor Free Trial Has Expired",
              html: generateEmailTemplate("Your Vendor Free Trial Has Expired", `
                <h3>Your trial has expired</h3>
                <p>Hi ${user.name},</p>
                <p>Your free trial on The Grand Store has expired. Your products are now hidden and your dashboard access has been suspended.</p>
                <p>Please log in and pay the registration fee to restore your active vendor status.</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/payment" class="btn">Pay Registration Fee</a></p>
              `)
            });
          } catch (emailErr) {
            console.error("Failed to send trial expiry email to", user.email, emailErr);
          }
        }
      }

      // 2. Warning Check (7 days before)
      const warningDateStart = new Date(now);
      warningDateStart.setDate(warningDateStart.getDate() + 7);
      warningDateStart.setHours(0, 0, 0, 0);

      const warningDateEnd = new Date(warningDateStart);
      warningDateEnd.setHours(23, 59, 59, 999);

      const warningVendors = await Vendor.find({
        trialStatus: "active",
        freeTrialExpiry: { $gte: warningDateStart, $lte: warningDateEnd }
      });

      for (const vendor of warningVendors) {
        const user = await User.findById(vendor.userId);
        if (user) {
          try {
            const fee = vendor.registrationFee || 500; // fallback
            await sendEmail({
              to: user.email,
              subject: "Action Required: Your Free Trial is Expiring Soon",
              html: generateEmailTemplate("Action Required: Your Free Trial is Expiring Soon", `
                <h3>Your free trial expires in 7 days</h3>
                <p>Hi ${user.name},</p>
                <p>Your free trial on The Grand Store will expire on ${vendor.freeTrialExpiry.toLocaleDateString()}.</p>
                <p>To avoid any interruption to your store and keep your products visible to customers, please pay the registration fee of R${fee}.</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/payment" class="btn">Pay Registration Fee</a></p>
              `)
            });
          } catch (emailErr) {
            console.error("Failed to send 7-day warning email to", user.email, emailErr);
          }
        }
      }

    } catch (error) {
      console.error("Error running vendor trial expiry job", error);
    }

    // 3. Monthly Maintenance Fee Audit & Due Date Reminders
    try {
      console.log("Running Vendor Monthly Maintenance Fee Audit...");
      const PlatformSettings = require("../models/PlatformSettings");
      const { createInAppNotification } = require("../controllers/notificationController");

      const settings = (await PlatformSettings.findOne()) || {};
      const configuredFee = settings.vendorMonthlyMaintenanceFee || 500;
      const graceDays = settings.vendorMaintenanceGraceDays || 7;
      const now = new Date();

      // Find all active vendors
      const activeVendors = await Vendor.find({
        status: "approved",
        paymentStatus: "paid"
      });

      for (const vendor of activeVendors) {
        if (!vendor.maintenanceFee || !vendor.maintenanceFee.nextDueAt) {
          // Initialize if missing
          vendor.maintenanceFee = {
            amount: configuredFee,
            status: "paid",
            lastPaidAt: vendor.createdAt || now,
            nextDueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            paymentHistory: []
          };
          await vendor.save();
          continue;
        }

        const nextDue = new Date(vendor.maintenanceFee.nextDueAt);
        const msRemaining = nextDue.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
          // Fee is due or overdue
          const isOverdue = Math.abs(daysRemaining) > graceDays;
          const newStatus = isOverdue ? "overdue" : "due";

          if (vendor.maintenanceFee.status !== newStatus) {
            vendor.maintenanceFee.status = newStatus;
            await vendor.save();

            // Send in-app notification
            await createInAppNotification({
              recipient: vendor.userId,
              recipientType: "vendor",
              title: isOverdue ? "URGENT: Maintenance Fee Overdue" : "Monthly Maintenance Fee Due",
              message: `Your monthly maintenance fee of R ${vendor.maintenanceFee.amount || configuredFee} is ${isOverdue ? 'overdue' : 'now due'}. Please settle the payment to keep your store operational.`,
              type: "maintenance_fee",
              link: "/vendor/dashboard"
            });

            // Send email notification
            const user = await User.findById(vendor.userId);
            if (user && user.email) {
              try {
                await sendEmail({
                  to: user.email,
                  subject: isOverdue ? "Overdue Notice: Monthly Vendor Maintenance Fee" : "Action Required: Monthly Vendor Maintenance Fee Due",
                  html: generateEmailTemplate("Monthly Vendor Maintenance Fee Notice", `
                    <h3>Monthly Maintenance Fee Notice</h3>
                    <p>Hi ${user.name},</p>
                    <p>Your monthly maintenance fee of <strong>R ${vendor.maintenanceFee.amount || configuredFee}</strong> is ${isOverdue ? 'currently overdue' : 'due today'}.</p>
                    <p>Please log in to your vendor dashboard to process your payment and maintain full access to product sales and services.</p>
                    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/dashboard" class="btn">Pay Maintenance Fee</a></p>
                  `)
                });
              } catch (e) {
                console.error("Failed to email maintenance fee reminder to", user.email, e);
              }
            }
          }
        } else if (daysRemaining === 3) {
          // Upcoming 3-day reminder
          await createInAppNotification({
            recipient: vendor.userId,
            recipientType: "vendor",
            title: "Upcoming Monthly Maintenance Fee",
            message: `Your monthly maintenance fee of R ${vendor.maintenanceFee.amount || configuredFee} will be due in 3 days on ${nextDue.toLocaleDateString()}.`,
            type: "maintenance_fee",
            link: "/vendor/dashboard"
          });
        }
      }
    } catch (maintErr) {
      console.error("Error in vendor maintenance fee cron job:", maintErr);
    }
  });
};

module.exports = startVendorJobs;
