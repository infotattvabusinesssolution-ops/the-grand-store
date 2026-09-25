import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-sales-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom'
});
after(() => server.close());

const { default: CrmSalesPage } = await server.ssrLoadModule('/src/pages/CrmSalesPage.jsx');
const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');

const mockSalesData = {
  stats: {
    totalRevenue: 2540000,
    totalCommission: 381000,
    totalUsers: 1420,
    totalVendors: 38,
    breakdown: {
      shop: { revenue: 1800000, commission: 270000 },
      auctions: { revenue: 540000, commission: 81000 },
      events: { revenue: 200000, commission: 30000 }
    }
  },
  metrics: {
    totalProcessed: 2540000,
    totalPlatformRevenue: 381000,
    totalVatCollected: 331304,
    totalPendingPayables: 1827696
  },
  transactions: [
    { _id: 'tx1', gsReference: 'GS-TX-901', createdAt: '2026-09-25T10:00:00Z', module: 'shop', type: 'payment', status: 'cleared', amount: 15000, netAmount: 12750 }
  ],
  shopOrders: [
    {
      _id: 'ord1', orderId: 'SHP-101', createdAt: '2026-09-25T10:00:00Z',
      subTotal: 12000, shippingCost: 250, vatAmount: 1800, totalPrice: 14050,
      commissionAmount: 1800, user: { name: 'Lord Sterling', email: 'sterling@luxury.za' },
      orderItems: [{ name: 'Château Margaux 2015', price: 6000, quantity: 2 }]
    }
  ],
  adminShopOrders: [
    {
      _id: 'ord1', orderId: 'SHP-101', createdAt: '2026-09-25T10:00:00Z',
      subTotal: 12000, shippingCost: 250, vatAmount: 1800, totalPrice: 14050,
      commissionAmount: 0, user: { name: 'Lord Sterling', email: 'sterling@luxury.za' },
      orderItems: [{ name: 'Château Margaux 2015', price: 6000, quantity: 2 }]
    }
  ],
  vendorShopOrders: [],
  auctionOrders: [
    {
      _id: 'auc1', orderId: 'AUC-501', createdAt: '2026-09-25T11:00:00Z',
      subTotal: 45000, vatAmount: 6750, totalPrice: 51750, commissionAmount: 7762.5,
      user: { name: 'Lady Eleanor', email: 'eleanor@cellar.za' }
    }
  ],
  eventBookings: [
    {
      _id: 'ev1', gsReference: 'EVT-301', bookingDate: '2026-09-25T12:00:00Z',
      subTotal: 4000, vatAmount: 600, totalPrice: 4600, commissionAmount: 600, organizerPayable: 3400,
      user: { name: 'Sommelier Dave', email: 'dave@tastings.za' }
    }
  ],
  vendorPayments: [
    {
      _id: 'vp1', gsReference: 'VREG-101', createdAt: '2026-09-25T13:00:00Z',
      amount: 15000, gateway: 'PayFast', description: 'Annual Winery Partner Fee',
      user: { name: 'Kanonkop Wine Estate' }
    }
  ],
  managementSummary: {
    totalSales: 1800000,
    totalVendorPayouts: 1440000,
    grossCommission: 270000,
    promosAbsorbed: 15000,
    referralAbsorbed: 5000,
    coinsAbsorbed: 12000,
    gatewayAbsorbed: 45000,
    courierAbsorbed: 18000,
    netContribution: 175000,
    netMarginPct: 9.72
  },
  getOrderFinancialDetails: (order) => ({
    hasAdmin: true,
    hasVendor: false,
    isMixed: false,
    adminSubtotal: 12000,
    vendorSubtotal: 0,
    totalVendorPayout: 0,
    actualCommission: 0,
    customerShipping: 250,
    shippingMargin: 50
  }),
  loading: false,
  error: null,
  lastRefreshed: new Date(),
  refresh: () => {}
};

test('CrmSalesPage renders with 100% text parity to admin dashboard', () => {
  const html = renderToStaticMarkup(
    React.createElement(ToastProvider, null,
      React.createElement(CrmSalesPage, { overrideSales: mockSalesData })
    )
  );

  // Header & Subtitle
  assert.match(html, /Platform/);
  assert.match(html, /Overview/);
  assert.match(html, /Real-time metrics and financial pulse of The Grand Store/);

  // 4 Top KPIs
  assert.match(html, /Total Platform Revenue/);
  assert.match(html, /Total GS Commission/);
  assert.match(html, /Registered Users/);
  assert.match(html, /Approved Vendors/);

  // 3 Module Breakdown Boxes
  assert.match(html, /Retail Shop/);
  assert.match(html, /Live Auctions/);
  assert.match(html, /Events &amp; Experiences|Events & Experiences/);

  // Master Transaction Ledger Header
  assert.match(html, /Master Transaction Ledger/);

  // 4 Financial Control Metric Boxes
  assert.match(html, /Total Processed \(Sales\)/);
  assert.match(html, /VAT Collected/);
  assert.match(html, /Owed to Vendors/);

  // Section 15 Management Profitability Dashboard
  assert.match(html, /Management Profitability Dashboard/);
  assert.match(html, /Executive Accounting • Section 15/);
  assert.match(html, /Standard 15% Platform Commission/);

  // 8 Deduction Tiles
  assert.match(html, /Total Sales/);
  assert.match(html, /Vendor Payouts/);
  assert.match(html, /Gross Margin/);
  assert.match(html, /Promos Absorbed/);
  assert.match(html, /Refer &amp; Earn|Refer & Earn/);
  assert.match(html, /Super Coins/);
  assert.match(html, /Gateway Fees/);
  assert.match(html, /Courier Costs/);

  // Contribution Summary
  assert.match(html, /Gross Contribution/);
  assert.match(html, /Net Grand Store Contribution/);
  assert.match(html, /True Net Margin/);

  // Report Exports
  assert.match(html, /Download financial reports/);
  assert.match(html, /Overall Excel report/);

  // 7 Tabs
  assert.match(html, /Admin Products/);
  assert.match(html, /Vendor Products/);
  assert.match(html, /All Purchases/);
  assert.match(html, /Event Tickets/);
  assert.match(html, /Auctions/);
  assert.match(html, /Vendor Reg\./);
  assert.match(html, /Ledger/);
});
