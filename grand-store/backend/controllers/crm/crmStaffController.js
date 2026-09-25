const User = require('../../models/User');
const CrmTask = require('../../models/CrmTask');

// @desc    Get Staff Performance & SLA Compliance KPIs
// @route   GET /api/crm/staff/kpis
// @access  Staff / CRM / Admin
exports.getStaffKpis = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all staff members (admin, staff, accountant, product_manager)
    const staffMembers = await User.find({
      role: { $in: ['admin', 'super_admin', 'staff', 'accountant', 'product_manager'] }
    }).select('name email role avatar lastLogin');

    // Aggregate task performance for each staff member
    const staffKpiList = await Promise.all(
      staffMembers.map(async (member) => {
        const totalAssigned = await CrmTask.countDocuments({
          assignedTo: member._id,
          createdAt: { $gte: thirtyDaysAgo }
        });

        const completedTasks = await CrmTask.find({
          assignedTo: member._id,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        });

        const completedCount = completedTasks.length;

        // SLA Compliance: completed before dueAt
        const onTimeCount = completedTasks.filter(t => {
          if (!t.dueAt || !t.completedAt) return true;
          return new Date(t.completedAt) <= new Date(t.dueAt);
        }).length;

        const slaCompliancePct = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100;

        const overdueCount = await CrmTask.countDocuments({
          assignedTo: member._id,
          status: { $in: ['open', 'in_progress', 'escalated'] },
          dueAt: { $lt: new Date() }
        });

        const activeCount = await CrmTask.countDocuments({
          assignedTo: member._id,
          status: { $in: ['open', 'in_progress', 'escalated'] }
        });

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          totalAssigned,
          completedCount,
          onTimeCount,
          activeCount,
          overdueCount,
          slaCompliancePct,
          performanceRating: slaCompliancePct >= 90 ? 'Excellent' : slaCompliancePct >= 75 ? 'Good' : 'Needs Attention'
        };
      })
    );

    // Team aggregated totals
    const totalTeamTasks = staffKpiList.reduce((acc, s) => acc + s.totalAssigned, 0);
    const totalTeamCompleted = staffKpiList.reduce((acc, s) => acc + s.completedCount, 0);
    const totalTeamOverdue = staffKpiList.reduce((acc, s) => acc + s.overdueCount, 0);
    const avgTeamSla = staffKpiList.length > 0
      ? Math.round(staffKpiList.reduce((acc, s) => acc + s.slaCompliancePct, 0) / staffKpiList.length)
      : 100;

    res.json({
      success: true,
      teamSummary: {
        totalTeamTasks,
        totalTeamCompleted,
        totalTeamOverdue,
        avgTeamSla,
        activeStaffCount: staffMembers.length
      },
      staff: staffKpiList.sort((a, b) => b.completedCount - a.completedCount)
    });
  } catch (err) {
    console.error('Error fetching staff KPIs:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving staff KPIs' });
  }
};
