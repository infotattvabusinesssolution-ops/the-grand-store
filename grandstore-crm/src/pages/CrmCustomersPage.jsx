import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmCustomers } from '../hooks/useCrmCustomers';
import BulkImportCustomersModal from '../components/common/BulkImportCustomersModal';
import { 
  Users, Search, Phone, Mail, ChevronRight, ChevronLeft, 
  ChevronsLeft, ChevronsRight, X, RefreshCw, Upload, ShieldCheck, Tag
} from 'lucide-react';

export default function CrmCustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { customers, pagination, loading, params, setParams, refresh } = useCrmCustomers({
    page: 1,
    limit: 25
  });

  // Debounced search sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => {
        if ((prev.search || '') === searchTerm.trim()) return prev;
        setCurrentPage(1);
        return { ...prev, search: searchTerm.trim(), page: 1 };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, setParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, search: searchTerm.trim(), page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, search: '', page: 1 }));
  };

  const handleFilterType = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, customerType: type, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (pagination.pages && newPage > pagination.pages)) return;
    setCurrentPage(newPage);
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  const totalPatrons = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const activePage = pagination.page || currentPage || 1;
  const startItem = totalPatrons === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endItem = Math.min(activePage * pageSize, totalPatrons);

  // Generate pagination page numbers with smart ellipsis window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, activePage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Customer Directory & 360° Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 2
            </span>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-slate-900 text-white shadow-sm flex items-center gap-1.5">
              <Users size={12} className="text-blue-400" />
              {loading && !customers.length ? 'Loading...' : `${totalPatrons.toLocaleString()} Grand Store Patrons`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete directory of all Grand Store retail patrons, VIP collectors, and wholesale buyers
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refresh()}
            title="Refresh customer list"
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Upload size={14} /> Import Customers (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, customer code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Filter Tabs: All Patrons, Retail, VIP Collectors, Trade / Wholesale (Corporate removed) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto crm-scrollbar pb-1 md:pb-0 text-xs">
          <button
            onClick={() => handleFilterType('')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedType === '' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Patrons
          </button>
          <button
            onClick={() => handleFilterType('retail')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedType === 'retail' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Retail Patrons
          </button>
          <button
            onClick={() => handleFilterType('vip_collector')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedType === 'vip_collector' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            VIP Collectors
          </button>
          <button
            onClick={() => handleFilterType('trade_buyer')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedType === 'trade_buyer' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trade / Wholesale
          </button>
        </div>
      </div>

      {/* Customer Directory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Customer Name & Code</th>
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
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-blue-500" />
                      <p className="font-semibold text-slate-600">Retrieving Grand Store customer directory...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={28} className="text-slate-300" />
                      <p className="font-bold text-slate-700">No customers found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm 
                          ? `No patrons matched "${searchTerm}". Try a different keyword or phone number.`
                          : 'No patrons found in the selected category.'}
                      </p>
                      {(searchTerm || selectedType) && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            handleFilterType('');
                          }}
                          className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold transition-all text-xs cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const customerPhone = c.phone || c.phoneNumber || '';
                  const customerCode = c.legacyCustCode || c.referralCode || (c.legacyCustId ? `GS-${c.legacyCustId}` : null);
                  const isVip = c.crmCustomerType === 'vip_collector';
                  const isTrade = c.crmCustomerType === 'trade_buyer';

                  return (
                    <tr key={c._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                            isVip 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : isTrade 
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {c.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{c.name || 'Anonymous Patron'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 capitalize">
                                {c.crmSource ? c.crmSource.replace(/_/g, ' ') : (c.legacyCustId ? 'Grand Store Store' : 'Website')}
                              </span>
                              {customerCode && (
                                <span className="inline-flex items-center text-[9px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                  {customerCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700 font-medium flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${c.email}`} className="hover:underline hover:text-blue-600">
                            {c.email}
                          </a>
                        </p>
                        {customerPhone ? (
                          <p className="text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <a href={`tel:${customerPhone}`} className="hover:underline hover:text-blue-600">
                              {customerPhone}
                            </a>
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">No phone on file</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border capitalize ${
                          isVip
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isTrade
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isVip ? 'VIP Collector' : isTrade ? 'Trade Wholesale' : 'Retail Patron'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 capitalize flex items-center gap-1">
                          <ShieldCheck size={12} className="text-blue-500" />
                          {c.bidderLevel?.replace(/_/g, ' ') || 'Registered'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/customers/${c._id}`)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl font-bold transition-all text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          View 360° <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{startItem.toLocaleString()}</strong> to{' '}
              <strong className="text-slate-900">{endItem.toLocaleString()}</strong> of{' '}
              <strong className="text-slate-900">{totalPatrons.toLocaleString()}</strong> customers
            </span>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
              <span className="text-slate-400 text-[11px]">Per page:</span>
              {[25, 50, 100, 250, 1000].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    pageSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size === 1000 ? 'All' : size}
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(1)}
                disabled={activePage <= 1}
                title="First Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                title="Previous Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activePage === pageNumber
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage >= totalPages}
                title="Next Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={activePage >= totalPages}
                title="Last Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Customer Import CSV Modal */}
      <BulkImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
