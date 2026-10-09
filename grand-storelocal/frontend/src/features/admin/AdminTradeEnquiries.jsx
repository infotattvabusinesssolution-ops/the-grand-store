import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Mail, Phone, Globe, Calendar, Check, X, Building2 } from 'lucide-react';

export default function AdminTradeEnquiries() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const res = await api.get(`/trade-enquiries`);
      const data = res.data;
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/trade-enquiries/${id}/status`, { status });
      
      const data = res.data;
      if (data.success) {
        setEnquiries(prev => prev.map(eq => eq._id === id ? { ...eq, status: data.data.status } : eq));
      }
    } catch (error) {
      console.error('Failed to update enquiry:', error);
      alert('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'reviewed': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'contacted': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-gold-gradient animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-gold-gradient mb-2">
            <Building2 size={20} />
            <span className="text-xs uppercase tracking-widest font-semibold">Trade Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-ivory)]">Customer & Trade Enquiries</h1>
          <p className="text-[var(--color-ivory-muted)] max-w-2xl text-lg leading-relaxed">
            Review and manage messages submitted via the homepage, contact form, and trade partnership portal.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="text-white/50 text-sm uppercase tracking-widest mb-2">Total Enquiries</div>
          <div className="text-4xl font-serif text-white">{enquiries.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="text-yellow-500/70 text-sm uppercase tracking-widest mb-2">Pending Review</div>
          <div className="text-4xl font-serif text-yellow-500">{enquiries.filter(e => e.status === 'pending').length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
          <div className="text-green-500/70 text-sm uppercase tracking-widest mb-2">Contacted</div>
          <div className="text-4xl font-serif text-green-500">{enquiries.filter(e => e.status === 'contacted').length}</div>
        </div>
      </div>

      {/* Enquiries List */}
      <div className="space-y-4">
        {enquiries.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.02]">
            <Building2 size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/50 text-lg">No enquiries found</p>
          </div>
        ) : (
          enquiries.map((enquiry) => (
            <div key={enquiry._id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                
                {/* Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div>
                    <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-1 flex items-center gap-2 flex-wrap">
                      {enquiry.fullname}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono font-medium ${
                        enquiry.source === 'app_promo'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : enquiry.source === 'contact'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {enquiry.source === 'app_promo' ? 'Homepage Form' : enquiry.source === 'contact' ? 'Contact Form' : 'Trade Enquiry'}
                      </span>
                    </h3>
                    {enquiry.companyname && (
                      <div className="text-white/60 text-sm">{enquiry.companyname}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <Mail size={16} className="text-gold-gradient" />
                      <a href={`mailto:${enquiry.email}`} className="hover:text-white transition-colors">{enquiry.email}</a>
                    </div>
                    {enquiry.phone && (
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <Phone size={16} className="text-gold-gradient" />
                        <a href={`tel:${enquiry.phone}`} className="hover:text-white transition-colors">{enquiry.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-white/50 text-xs mt-2">
                      <Calendar size={14} />
                      Submitted: {new Date(enquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="flex flex-col items-start lg:items-end gap-4 w-full lg:w-auto mt-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border ${getStatusColor(enquiry.status)}`}>
                    {enquiry.status}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {enquiry.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(enquiry._id, 'reviewed')}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-xs uppercase tracking-widest font-semibold transition-colors flex items-center gap-2"
                        >
                          Mark Reviewed
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(enquiry._id, 'rejected')}
                          className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-xs uppercase tracking-widest font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(enquiry.status === 'pending' || enquiry.status === 'reviewed') && (
                      <button 
                        onClick={() => handleUpdateStatus(enquiry._id, 'contacted')}
                        className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-xs uppercase tracking-widest font-semibold transition-colors"
                      >
                        Mark Contacted
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {enquiry.message && (
                <div className="w-full mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-white/80 text-sm leading-relaxed">
                  <strong>Message:</strong><br/>
                  {enquiry.message}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
