import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmCustomers } from '../hooks/useCrmCustomers';
import StatusBadge from '../components/common/StatusBadge';
import BulkImportCustomersModal from '../components/common/BulkImportCustomersModal';
import { Users, Search, Phone, Mail, ChevronRight, UserCheck, Shield, Filter, Upload } from 'lucide-react';

export default function CrmCustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { customers, pagination, loading, params, setParams } = useCrmCustomers();

  const handleSearch = (e) => {
    e.preventDefault();
    setParams((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterType = (type) => {
    setSelectedType(type);
    setParams((prev) => ({ ...prev, customerType: type, page: 1 }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Customer Directory & 360° Management
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search patrons, review lifetime purchase values, and view full communication dossiers
          </p>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/25 cursor-pointer self-start sm:self-auto"
        >
          <Upload size={14} /> Import Customers (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto crm-scrollbar pb-1 md:pb-0 text-xs">
          <button
            onClick={() => handleFilterType('')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              selectedType === '' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Patrons
          </button>
          <button
            onClick={() => handleFilterType('vip_collector')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              selectedType === 'vip_collector' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            VIP Collectors
          </button>
          <button
            onClick={() => handleFilterType('trade_buyer')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              selectedType === 'trade_buyer' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trade / Wholesale
          </button>
          <button
            onClick={() => handleFilterType('corporate_client')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              selectedType === 'corporate_client' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Corporate
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Tier / Type</th>
                <th className="px-6 py-3.5">Bidder Level</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">360° Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {c.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name || 'Anonymous Patron'}</p>
                          <p className="text-[10px] text-slate-500 capitalize">Source: {c.crmSource?.replace(/_/g, ' ') || 'Website'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" /> {c.email}
                      </p>
                      {c.phone && (
                        <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-slate-400" /> {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border capitalize ${
                        c.crmCustomerType === 'vip_collector'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : c.crmCustomerType === 'trade_buyer'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.crmCustomerType?.replace(/_/g, ' ') || 'Retail'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 capitalize">
                        {c.bidderLevel?.replace(/_/g, ' ') || 'Registered'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/customers/${c._id}`)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl font-bold transition-all text-xs inline-flex items-center gap-1"
                      >
                        View 360° <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Customer Import CSV Modal */}
      <BulkImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setParams((prev) => ({ ...prev }));
        }}
      />
    </div>
  );
}
