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

  // Vendor Workflow
  getVendorSummary: () => crmClient.get('/vendors/summary'),
  updateVendorStage: (id, data) => crmClient.put(`/vendors/${id}/stage`, data),

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

  // Marketing Audiences, Campaigns & Legal Age Compliance (Section 8 of GS CRM 1.docx)
  getMarketingAudiences: () => crmClient.get('/marketing/audiences'),
  previewAudienceSegment: (segmentId) => crmClient.get(`/marketing/audiences/${segmentId}/preview`),
  getCampaigns: () => crmClient.get('/marketing/campaigns'),
  createCampaign: (data) => crmClient.post('/marketing/campaigns', data),
  updateCampaignStatus: (id, status) => crmClient.put(`/marketing/campaigns/${id}/status`, { status }),

  // Auctions & Private Tasting Operations
  getAuctionSummary: () => crmClient.get('/auctions/summary'),
  updateBidderKyc: (id, data) => crmClient.put(`/auctions/bidder/${id}/kyc`, data),
  recordHammerPayment: (id, data) => crmClient.put(`/auctions/lot/${id}/payment`, data),
  getEventGuests: (eventId) => crmClient.get(`/events/${eventId}/guests`),
  toggleGuestCheckIn: (bookingId) => crmClient.put(`/events/bookings/${bookingId}/checkin`),

  // 30-Day Vendor Settlements & Payouts
  getSettlementsSummary: () => crmClient.get('/settlements/summary'),
  createSettlement: (data) => crmClient.post('/settlements', data),
  processSettlementPayment: (id, data) => crmClient.put(`/settlements/${id}/pay`, data),
  disputeSettlement: (id, data) => crmClient.put(`/settlements/${id}/dispute`, data),

  // Staff Telemetry & SLA KPIs
  getStaffKpis: () => crmClient.get('/staff/kpis'),

  // Customer Product Support & Incident Tickets (Amazon/Flipkart Style)
  getCrmTickets: (params) => crmClient.get('/tickets', { params }),
  resolveCrmTicket: (id, data) => crmClient.put(`/tickets/${id}/resolve`, data),
  sendTicketReply: (id, message) => crmClient.post(`/tickets/${id}/messages`, { message })
};
