import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0'
);

const defaultBaseUrl = isLocalhost ? 'http://localhost:5015' : 'https://api.grandstoreglobal.com';
const apiBaseUrl = import.meta.env.VITE_API_URL || defaultBaseUrl;

export const crmClient = axios.create({
  baseURL: `${apiBaseUrl}/api/crm`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Automatic JWT auth token injection supporting isolated crmAdminToken first
crmClient.interceptors.request.use((config) => {
  try {
    // 1. Dedicated isolated CRM Admin token
    let token = localStorage.getItem('crmAdminToken');

    // 2. Dedicated CRM Admin info object
    if (!token) {
      const crmAdminInfoStr = localStorage.getItem('crmAdminInfo');
      if (crmAdminInfoStr) {
        const info = JSON.parse(crmAdminInfoStr);
        if (info && info.token && ['super_admin', 'admin', 'accountant', 'product_manager'].includes(info.role)) {
          token = info.token;
        }
      }
    }

    // 3. Fallback to adminToken
    if (!token) {
      token = localStorage.getItem('adminToken');
    }

    // 4. Fallback to userInfo ONLY if user has a staff role (never customer!)
    if (!token) {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.token && ['super_admin', 'admin', 'accountant', 'product_manager'].includes(userInfo.role)) {
          token = userInfo.token;
        }
      }
    }

    // 5. Final fallback to token if not confirmed customer
    if (!token) {
      const genericToken = localStorage.getItem('token');
      const uStr = localStorage.getItem('userInfo');
      let isCustomer = false;
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          if (u?.role === 'customer') isCustomer = true;
        } catch (e) {}
      }
      if (genericToken && !isCustomer) {
        token = genericToken;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Failed to parse auth token for CRM', e);
  }
  return config;
});

// Response interceptor: automatically catch 401/403, clean up contaminated tokens, and notify
crmClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('CRM access rejected (401/403). Clearing stale/customer tokens:', error.response.data?.message);
      localStorage.removeItem('crmAdminToken');
      localStorage.removeItem('crmAdminInfo');
      
      // If customer session was saved in userInfo, clear it
      try {
        const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (u?.role === 'customer') {
          localStorage.removeItem('userInfo');
          localStorage.removeItem('token');
        }
      } catch (e) {}

      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.dispatchEvent(new CustomEvent('crm:access-denied', {
          detail: { message: error.response.data?.message || 'Access denied' }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export const crmApi = {
  // Morning Screen Dashboard
  getDashboardSummary: () => crmClient.get('/dashboard/summary'),
  
  // Work Queue & Task Management
  getTasks: (params) => crmClient.get('/tasks', { params }),
  createTask: (data) => crmClient.post('/tasks', data),
  updateTaskStatus: (id, data) => crmClient.put(`/tasks/${id}/status`, data),
  addTaskNote: (id, note) => crmClient.post(`/tasks/${id}/notes`, { note }),

  // Customer 360
  getCustomers: (params) => crmClient.get('/customers', { params }),
  getCustomer360: (id) => crmClient.get(`/customers/${id}/360`),
  updateCustomerTier: (id, data) => crmClient.put(`/customers/${id}/tier`, data),
  addCustomerNote: (id, note) => crmClient.post(`/customers/${id}/notes`, { note }),
  bulkImportCustomers: (data) => crmClient.post('/customers/bulk-import', data),

  // Vendor 360 & Operations Directory
  getVendorSummary: () => crmClient.get('/vendors/summary'),
  getVendors: (params) => crmClient.get('/vendors', { params }),
  getVendor360: (id) => crmClient.get(`/vendors/${id}/360`),
  updateVendorStage: (id, data) => crmClient.put(`/vendors/${id}/stage`, data),
  updateVendorStatus: (id, data) => crmClient.put(`/vendors/${id}/status`, data),
  pingVendor: (id, data) => crmClient.post(`/vendors/${id}/ping`, data),

  // Order Operations Kanban & Logistics Exceptions
  getOrderBoard: () => crmClient.get('/orders/board'),
  updateOrderStage: (id, data) => crmClient.put(`/orders/${id}/stage`, data),
  updateLogisticsException: (id, data) => crmClient.put(`/shipments/${id}/exception`, data),

  // Global Trade (Export B2B)
  getExportEnquiries: () => crmClient.get('/export'),
  createExportEnquiry: (data) => crmClient.post('/export', data),
  updateExportDocumentation: (id, data) => crmClient.put(`/export/${id}/docs`, data),
  updateExportStage: (id, data) => crmClient.put(`/export/${id}/stage`, data),

  // Communications Hub & Phone Logs
  getCommunications: (params) => crmClient.get('/comms', { params }),
  logCommunication: (data) => crmClient.post('/comms', data),

  // Marketing Audiences, Categories, Campaigns & Legal Age Compliance (Section 8 of GS CRM 1.docx)
  getMarketingProducts: (params) => crmClient.get('/marketing/products', { params }),
  getMarketingAudiences: () => crmClient.get('/marketing/audiences'),
  createAudienceCategory: (data) => crmClient.post('/marketing/audiences', data),
  updateAudienceCategory: (id, data) => crmClient.put(`/marketing/audiences/${id}`, data),
  deleteAudienceCategory: (id) => crmClient.delete(`/marketing/audiences/${id}`),
  previewAudienceSegment: (segmentId) => crmClient.get(`/marketing/audiences/${segmentId}/preview`),
  importMarketingAudienceCsv: (data) => crmClient.post('/marketing/audiences/import-csv', data),
  getCampaigns: () => crmClient.get('/marketing/campaigns'),
  getCampaignDetails: (id) => crmClient.get(`/marketing/campaigns/${id}/details`),
  createCampaign: (data) => crmClient.post('/marketing/campaigns', data),
  updateCampaignStatus: (id, status) => crmClient.put(`/marketing/campaigns/${id}/status`, { status }),
  sendCampaignNow: (id) => crmClient.post(`/marketing/campaigns/${id}/send`),
  testSendCampaign: (id, testEmail) => crmClient.post(`/marketing/campaigns/${id}/test-send`, { testEmail }),
  syncCampaignAttribution: (id) => crmClient.post(`/marketing/campaigns/${id}/sync-attribution`),
  deleteCampaign: (id) => crmClient.delete(`/marketing/campaigns/${id}`),

  // Customer Product Vouchers & Coupons (Strictly Admin Products)
  getProductCoupons: () => crmClient.get('/marketing/coupons'),
  createProductCoupon: (data) => crmClient.post('/marketing/coupons', data),
  toggleProductCoupon: (id) => crmClient.put(`/marketing/coupons/${id}/toggle`),
  deleteProductCoupon: (id) => crmClient.delete(`/marketing/coupons/${id}`),

  // Auctions & Private Tasting Operations
  getAuctionSummary: () => crmClient.get('/auctions/summary'),
  getAllBidders: (params) => crmClient.get('/auctions/bidders', { params }),
  updateBidderKyc: (id, data) => crmClient.put(`/auctions/bidder/${id}/kyc`, data),
  recordHammerPayment: (id, data) => crmClient.put(`/auctions/lot/${id}/payment`, data),
  sendPaymentReminder: (id) => crmClient.post(`/auctions/lot/${id}/remind`),
  defaultLot: (id) => crmClient.put(`/auctions/lot/${id}/default`),
  approveAuctionLot: (id, data) => crmClient.put(`/auctions/lots/${id}/approve`, data),
  rejectAuctionLot: (id, data) => crmClient.put(`/auctions/lots/${id}/reject`, data),
  updateAuctionLot: (id, data) => crmClient.put(`/auctions/lots/${id}`, data),
  deleteAuctionLot: (id) => crmClient.delete(`/auctions/lots/${id}`),
  placeFloorBid: (id, data) => crmClient.post(`/auctions/lots/${id}/floor-bid`, data),
  declareHammerFall: (id, data) => crmClient.put(`/auctions/lots/${id}/hammer`, data),
  getLotBids: (id) => crmClient.get(`/auctions/lots/${id}/bids`),

  // Events Operations & Walk-in Door Desk
  getEventGuests: (eventId) => crmClient.get(`/events/${eventId}/guests`),
  toggleGuestCheckIn: (bookingId) => crmClient.put(`/events/bookings/${bookingId}/checkin`),
  registerWalkInGuest: (eventId, data) => crmClient.post(`/events/${eventId}/walk-in`, data),
  approveTastingEvent: (id, data) => crmClient.put(`/events/${id}/approve`, data),
  rejectTastingEvent: (id, data) => crmClient.put(`/events/${id}/reject`, data),
  updateTastingEvent: (id, data) => crmClient.put(`/events/${id}`, data),
  deleteTastingEvent: (id) => crmClient.delete(`/events/${id}`),

  // 30-Day Vendor Settlements & Payouts
  getSettlementsSummary: () => crmClient.get('/settlements/summary'),
  syncSettlements: () => crmClient.post('/settlements/sync'),
  createSettlement: (data) => crmClient.post('/settlements', data),
  processSettlementPayment: (id, data) => crmClient.put(`/settlements/${id}/pay`, data),
  disputeSettlement: (id, data) => crmClient.put(`/settlements/${id}/dispute`, data),

  // Staff Telemetry & SLA KPIs
  getStaffKpis: () => crmClient.get('/staff/kpis'),

  // Customer Product Support & Incident Tickets (Amazon/Flipkart Style)
  getCrmTickets: (params) => crmClient.get('/tickets', { params }),
  resolveCrmTicket: (id, data) => crmClient.put(`/tickets/${id}/resolve`, data),
  sendTicketReply: (id, message) => crmClient.post(`/tickets/${id}/messages`, { message }),

  // Sales & Platform Financials (Live Store Admin Parity)
  getSalesDashboard: async () => {
    try {
      return await crmClient.get('/sales/dashboard');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return await crmClient.get(`${apiBaseUrl}/api/admin/dashboard`);
      }
      throw err;
    }
  },
  getSalesFinance: async (params = { limit: 2000 }) => {
    try {
      return await crmClient.get('/sales/finance', { params });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return await crmClient.get(`${apiBaseUrl}/api/admin/finance`, { params });
      }
      throw err;
    }
  }
};
