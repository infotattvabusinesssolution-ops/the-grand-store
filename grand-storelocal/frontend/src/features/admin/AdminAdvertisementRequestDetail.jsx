import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Mail, Phone, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api';

export default function AdminAdvertisementRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await api.get(`/advertisements/requests/${id}`);
        setRequest(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  if (loading) return <div className="p-8 text-[var(--color-ivory)]">Loading request details...</div>;
  if (error || !request) return <div className="p-8 text-red-500">Error: {error || 'Request not found'}</div>;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/admin/advertisement-requests')}
        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Requests
      </button>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10 bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[#d8b76d] font-serif text-3xl mb-2">{request.productName}</h1>
              <div className="flex items-center gap-4 text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest">
                <span className="flex items-center gap-1"><Building2 size={12} /> {request.companyName}</span>
                <span className="flex items-center gap-1"><User size={12} /> {request.contactName}</span>
              </div>
            </div>
            <span className={`px-4 py-2 text-[10px] uppercase tracking-widest rounded-full font-bold ${
              request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
              request.status === 'approved' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
              'bg-red-500/20 text-red-500 border border-red-500/30'
            }`}>
              {request.status}
            </span>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-[10px] uppercase tracking-widest text-[#d8b76d] font-bold mb-4">The Pitch</h2>
          <div className="bg-[#111] border border-white/5 rounded-xl p-6 mb-8">
            <p className="text-[var(--color-ivory)] leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {request.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-[10px] uppercase tracking-widest text-[#d8b76d] font-bold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--color-ivory)]">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Mail size={14} className="text-[var(--color-ivory-muted)]" />
                  </div>
                  <a href={`mailto:${request.email}`} className="hover:text-[#c9a35b] transition-colors">{request.email}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-ivory)]">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Phone size={14} className="text-[var(--color-ivory-muted)]" />
                  </div>
                  <a href={`tel:${request.phone}`} className="hover:text-[#c9a35b] transition-colors">{request.phone}</a>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-[10px] uppercase tracking-widest text-[#d8b76d] font-bold mb-4">Submission Details</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--color-ivory)]">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Calendar size={14} className="text-[var(--color-ivory-muted)]" />
                  </div>
                  <span>{new Date(request.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--color-ivory)]">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Clock size={14} className="text-[var(--color-ivory-muted)]" />
                  </div>
                  <span>{new Date(request.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
