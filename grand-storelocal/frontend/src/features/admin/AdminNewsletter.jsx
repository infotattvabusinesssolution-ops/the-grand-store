import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Search, Filter, Send, X, Users, Globe, Clock, CheckCircle, XCircle, CheckSquare, Square, RotateCcw, Check, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';
import api from '../../api';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('All');
  const [countries, setCountries] = useState(['All']);
  
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Selection / Checklist state
  const [selectedEmails, setSelectedEmails] = useState([]);
  
  // Compose modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState('selected'); // 'selected' | 'all' | 'country'
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, [filterCountry]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/newsletter/subscribers', {
        params: { country: filterCountry }
      });
      setSubscribers(res.data || []);
      
      // Extract unique countries if 'All' is selected
      if (filterCountry === 'All') {
        const uniqueCountries = ['All', ...new Set((res.data || []).map(s => s.country || 'Unknown'))];
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter subscribers based on search term
  const filteredSubscribers = useMemo(() => {
    if (!activeSearch.trim()) return subscribers;
    const query = activeSearch.toLowerCase().trim();
    return subscribers.filter(sub => {
      const email = (sub.email || '').toLowerCase();
      const country = (sub.country || '').toLowerCase();
      const ip = (sub.ipAddress || '').toLowerCase();
      const status = (sub.status || '').toLowerCase();
      return email.includes(query) || country.includes(query) || ip.includes(query) || status.includes(query);
    });
  }, [subscribers, activeSearch]);

  const activeSubscribers = useMemo(() => {
    return filteredSubscribers.filter(s => s.status === 'subscribed');
  }, [filteredSubscribers]);

  const totalActiveCount = useMemo(() => {
    return subscribers.filter(s => s.status === 'subscribed').length;
  }, [subscribers]);

  // Handle Search Submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
  };

  // Selection handlers
  const isAllVisibleSelected = filteredSubscribers.length > 0 && filteredSubscribers.every(s => selectedEmails.includes(s.email));
  const isSomeVisibleSelected = filteredSubscribers.some(s => selectedEmails.includes(s.email)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      // Unselect all visible
      const visibleEmails = new Set(filteredSubscribers.map(s => s.email));
      setSelectedEmails(prev => prev.filter(email => !visibleEmails.has(email)));
    } else {
      // Select all visible
      const visibleEmails = filteredSubscribers.map(s => s.email);
      setSelectedEmails(prev => Array.from(new Set([...prev, ...visibleEmails])));
    }
  };

  const handleToggleSelectOne = (email) => {
    setSelectedEmails(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleSelectAllActive = () => {
    const activeEmails = activeSubscribers.map(s => s.email);
    setSelectedEmails(Array.from(new Set([...selectedEmails, ...activeEmails])));
  };

  const handleClearSelection = () => {
    setSelectedEmails([]);
  };

  // Open Compose Modal with default recipient mode
  const openComposeModal = (mode = null) => {
    if (mode) {
      setRecipientMode(mode);
    } else if (selectedEmails.length > 0) {
      setRecipientMode('selected');
    } else {
      setRecipientMode('all');
    }
    setIsModalOpen(true);
  };

  // Send Newsletter
  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !htmlContent) return;

    if (recipientMode === 'selected' && selectedEmails.length === 0) {
      setMessage({ type: 'error', text: 'Please check at least one subscriber in the list.' });
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const payload = {
        subject,
        htmlContent
      };

      if (recipientMode === 'selected') {
        payload.recipientEmails = selectedEmails;
      } else if (recipientMode === 'country') {
        payload.country = filterCountry;
      } else {
        payload.country = 'All';
      }

      const res = await api.post('/newsletter/send', payload);
      setMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
        setSubject('');
        setHtmlContent('');
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send newsletter' });
    } finally {
      setSending(false);
    }
  };

  // Calculate target recipient count for compose modal
  const targetRecipientCount = useMemo(() => {
    if (recipientMode === 'selected') return selectedEmails.length;
    if (recipientMode === 'country') {
      return subscribers.filter(s => s.status === 'subscribed' && (filterCountry === 'All' || s.country === filterCountry)).length;
    }
    return totalActiveCount;
  }, [recipientMode, selectedEmails, subscribers, filterCountry, totalActiveCount]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-ivory,#eee8dd)] font-normal tracking-wide mb-1 flex items-center gap-2.5">
            <Mail className="text-gold" size={24} /> Newsletter Campaigns
          </h1>
          <p className="text-white/50 text-sm">
            Search subscribers, select recipients via checklist, and send custom broadcasts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedEmails.length > 0 && (
            <button 
              onClick={() => openComposeModal('selected')}
              className="bg-gold hover:bg-[#d4af37] text-black px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
            >
              <Send size={15} /> Send to Selected ({selectedEmails.length})
            </button>
          )}
          <button 
            onClick={() => openComposeModal(selectedEmails.length > 0 ? 'selected' : 'all')}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 rounded-xl font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send size={15} /> Compose Email
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white">{subscribers.length}</div>
            <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Total Subscribers</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white">{totalActiveCount}</div>
            <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Active Subscribers</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-gold">{selectedEmails.length}</div>
            <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Selected Recipients</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar with Search Button */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email, country, IP address, or status..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/70 transition-colors font-sans"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button 
            type="submit"
            className="bg-gold hover:bg-white text-black font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
          >
            <Search size={14} /> Search
          </button>
        </form>

        {/* Country Filter and Quick Select */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-gold" />
            <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Country:</span>
            <select 
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer focus:text-gold"
            >
              {countries.map(c => (
                <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {activeSearch && (
            <button
              onClick={handleClearSearch}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Floating / Sticky Selection Bar (Visible when 1+ selected) */}
      {selectedEmails.length > 0 && (
        <div className="bg-gradient-to-r from-gold/15 via-gold/10 to-transparent border border-gold/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
              <CheckSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                <span className="text-gold font-mono">{selectedEmails.length}</span> subscriber{selectedEmails.length > 1 ? 's' : ''} checked in list
              </p>
              <p className="text-xs text-white/50">
                You can send targeted broadcasts exclusively to these checked recipients.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllActive}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Select All Active ({activeSubscribers.length})
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Clear Checklist
            </button>
            <button
              onClick={() => openComposeModal('selected')}
              className="px-4 py-1.5 bg-gold hover:bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Send size={13} /> Send to {selectedEmails.length} Selected
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table with Checklist */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white font-mono">{filteredSubscribers.length}</strong> subscribers</span>
            {activeSearch && <span>for query "<span className="text-gold">{activeSearch}</span>"</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" /> Active: {activeSubscribers.length}
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-2" /> Unsubscribed: {filteredSubscribers.length - activeSubscribers.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-white/50 text-[11px] uppercase tracking-widest font-semibold">
                <th className="p-4 w-12 text-center">
                  <button 
                    type="button" 
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-white/60 hover:text-gold transition-colors inline-flex items-center justify-center p-1"
                    title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare size={18} className="text-gold" />
                    ) : isSomeVisibleSelected ? (
                      <div className="w-[18px] h-[18px] border-2 border-gold rounded flex items-center justify-center">
                        <div className="w-2.5 h-1 bg-gold rounded-sm" />
                      </div>
                    ) : (
                      <Square size={18} className="text-white/40" />
                    )}
                  </button>
                </th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Country</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Status</th>
                <th className="p-4">Subscribed Date</th>
                <th className="p-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-white/50">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                      Loading subscribers...
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-white/50">
                    <Mail size={32} className="mx-auto mb-3 text-white/20" />
                    <p className="text-white/70 font-medium">No subscribers match your search criteria.</p>
                    {activeSearch && (
                      <button 
                        onClick={handleClearSearch}
                        className="mt-3 text-xs text-gold hover:underline"
                      >
                        Clear search and show all
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const isChecked = selectedEmails.includes(sub.email);
                  return (
                    <tr 
                      key={sub._id || sub.email} 
                      onClick={() => handleToggleSelectOne(sub.email)}
                      className={`transition-colors cursor-pointer ${
                        isChecked 
                          ? 'bg-gold/[0.08] hover:bg-gold/[0.12]' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button" 
                          onClick={() => handleToggleSelectOne(sub.email)}
                          className="cursor-pointer text-white/60 hover:text-gold transition-colors inline-flex items-center justify-center p-1"
                        >
                          {isChecked ? (
                            <CheckSquare size={18} className="text-gold" />
                          ) : (
                            <Square size={18} className="text-white/30" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/50'
                          }`}>
                            <Mail size={14} />
                          </div>
                          <span className={`font-mono text-sm ${isChecked ? 'text-gold font-bold' : 'text-white'}`}>
                            {sub.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-white/70">
                        <div className="flex items-center gap-2 text-xs">
                          <Globe size={13} className="text-white/40 shrink-0" />
                          <span>{sub.country || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white/50 font-mono text-xs">
                        {sub.ipAddress || '—'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          sub.status === 'subscribed' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'subscribed' ? 'bg-green-400' : 'bg-red-400'}`} />
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 text-white/40 text-xs font-mono">
                        {new Date(sub.createdAt || Date.now()).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmails([sub.email]);
                            openComposeModal('selected');
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-gold/20 hover:text-gold border border-white/10 rounded-lg text-xs font-medium text-white/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send size={11} /> Compose
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Newsletter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleSend} 
            className="bg-[#0f0e0c] border border-gold/30 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-lg text-white font-serif tracking-wide">Compose Newsletter Broadcast</h2>
                  <p className="text-white/40 text-xs">Configure recipients and craft your luxury campaign</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-white/50 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-6 scrollbar-thin">
              {message && (
                <div className={`p-4 rounded-xl border text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Recipient Targeting Radiobox Checklist */}
              <div className="space-y-3">
                <label className="block text-white/60 text-xs uppercase tracking-widest font-bold">
                  Target Recipients Selection
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Selected Subscribers (Checklist) */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'selected' 
                      ? 'bg-gold/15 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">Checked Checklist</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="selected" 
                        checked={recipientMode === 'selected'} 
                        onChange={() => setRecipientMode('selected')}
                        className="accent-gold w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-gold">{selectedEmails.length}</div>
                    <span className="text-[11px] text-white/50">Checked in table</span>
                  </label>

                  {/* Option 2: All Active Subscribers */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'all' 
                      ? 'bg-gold/15 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">All Active</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="all" 
                        checked={recipientMode === 'all'} 
                        onChange={() => setRecipientMode('all')}
                        className="accent-gold w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-white">{totalActiveCount}</div>
                    <span className="text-[11px] text-white/50">Global subscribers</span>
                  </label>

                  {/* Option 3: Country Filter */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'country' 
                      ? 'bg-gold/15 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">By Country</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="country" 
                        checked={recipientMode === 'country'} 
                        onChange={() => setRecipientMode('country')}
                        className="accent-gold w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-white truncate">{filterCountry}</div>
                    <span className="text-[11px] text-white/50">Current filtered country</span>
                  </label>
                </div>

                {/* Checked Emails Chip Preview when 'selected' is active */}
                {recipientMode === 'selected' && (
                  <div className="p-3 bg-black/60 border border-gold/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-gold flex items-center gap-1.5">
                        <CheckSquare size={13} /> {selectedEmails.length} Specific Recipients Chosen
                      </span>
                      {selectedEmails.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedEmails([])}
                          className="text-[10px] text-white/40 hover:text-red-400 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {selectedEmails.length === 0 ? (
                      <p className="text-xs text-amber-400/80 italic">
                        No subscribers checked yet! Close this modal or choose "All Active" above, or tick the checkboxes next to subscribers in the table.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                        {selectedEmails.map(email => (
                          <span 
                            key={email}
                            className="inline-flex items-center gap-1 bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg text-xs font-mono text-white/80"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(email)}
                              className="text-white/40 hover:text-white ml-0.5 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
                  Subject Line
                </label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors font-sans text-sm"
                  placeholder="e.g., Exclusive Allocation: Rare Scotch & Private Reserve Arrivals"
                  required
                />
              </div>

              {/* Email Body */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-xs uppercase tracking-widest font-bold">
                    Email Content (HTML Supported)
                  </label>
                  <span className="text-[10px] text-gold/80 font-mono">Wrapped in Grand Store luxury template</span>
                </div>
                <textarea 
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full flex-1 min-h-[180px] bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-gold transition-colors leading-relaxed placeholder-white/20"
                  placeholder="<h2>Private Release Announcement</h2><p>Dear Connoisseur,</p><p>We are delighted to present an exclusive allocation...</p>"
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/40 shrink-0">
              <div className="text-xs text-white/50 flex items-center gap-1.5">
                <Users size={14} className="text-gold" />
                <span>Will dispatch to <strong className="text-white font-mono">{targetRecipientCount}</strong> subscriber{targetRecipientCount === 1 ? '' : 's'}</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-white/60 hover:text-white rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={sending || !subject || !htmlContent || targetRecipientCount === 0}
                  className="flex-1 sm:flex-none bg-gold hover:bg-white text-black px-7 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                  {sending ? 'Sending Broadcast...' : <><Send size={15} /> Send Broadcast ({targetRecipientCount})</>}
                </button>
              </div>
            </div>
            
          </form>
        </div>
      )}
    </div>
  );
}
