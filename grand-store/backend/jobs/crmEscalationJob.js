const cron = require('node-cron');
const CrmTask = require('../models/CrmTask');

/**
 * Hourly Cron Job: Scans open tasks and marks them as isOverdue if past due date.
 */
function startCrmEscalationJobs() {
  // Run at the top of every hour (0 * * * *)
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await CrmTask.updateMany(
        {
          status: { $in: ['open', 'in_progress'] },
          dueDate: { $lt: now },
          isOverdue: false
        },
        {
          $set: { isOverdue: true }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[CRM Escalation] Flagged ${result.modifiedCount} tasks as overdue.`);
      }
    } catch (err) {
      console.error('[CRM Escalation Error]:', err);
    }
  });

  console.log('CRM Escalation hourly job scheduled');
}

module.exports = startCrmEscalationJobs;
