import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import CrmLayout from './components/layout/CrmLayout';
import CrmDashboardPage from './pages/CrmDashboardPage';
import CrmCustomersPage from './pages/CrmCustomersPage';
import CrmCustomerDetailPage from './pages/CrmCustomerDetailPage';
import CrmVendorWorkflowPage from './pages/CrmVendorWorkflowPage';
import CrmOrdersBoardPage from './pages/CrmOrdersBoardPage';
import CrmExportTradePage from './pages/CrmExportTradePage';
import CrmCommsHubPage from './pages/CrmCommsHubPage';
import CrmMarketingPage from './pages/CrmMarketingPage';
import CrmAuctionEventsPage from './pages/CrmAuctionEventsPage';
import CrmSettlementsPage from './pages/CrmSettlementsPage';
import CrmStaffKpisPage from './pages/CrmStaffKpisPage';
import CrmSalesPage from './pages/CrmSalesPage';
import CrmLoginPage from './pages/CrmLoginPage';
import { Agentation } from 'agentation';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          {/* Standalone Secure Login Portal */}
          <Route path="/login" element={<CrmLoginPage />} />

          {/* Protected Main CRM Operations Layout */}
          <Route path="/" element={<CrmLayout />}>
            <Route index element={<CrmDashboardPage />} />
            <Route path="dashboard" element={<CrmDashboardPage />} />
            <Route path="work-queue" element={<CrmDashboardPage />} />
            
            <Route path="customers" element={<CrmCustomersPage />} />
            <Route path="customers/:id" element={<CrmCustomerDetailPage />} />
            
            <Route path="vendors" element={<CrmVendorWorkflowPage />} />
            <Route path="orders" element={<CrmOrdersBoardPage />} />
            <Route path="export-trade" element={<CrmExportTradePage />} />
            <Route path="communications" element={<CrmCommsHubPage />} />
            <Route path="marketing" element={<CrmMarketingPage />} />
            <Route path="auctions-events" element={<CrmAuctionEventsPage />} />
            <Route path="settlements" element={<CrmSettlementsPage />} />
            <Route path="sales" element={<CrmSalesPage />} />
            <Route path="staff-telemetry" element={<CrmStaffKpisPage />} />

            {/* Legacy Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Visual feedback toolbar for AI coding agents */}
        <Agentation />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
  );
}
