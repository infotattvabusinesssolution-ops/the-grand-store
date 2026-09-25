import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Search, Filter, Send, X, Users, Globe, Clock, CheckCircle, 
  XCircle, CheckSquare, Square, RotateCcw, Check, Sparkles, UserCheck, 
  ShieldAlert, Flame, Crown, Store, Trophy, Dice5, Gift, Phone, User, Award 
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';

// Helper to normalize any source string into the 3 canonical store keys
export const getStoreCategory = (source) => {
  const s = (source || '').toLowerCase();
  if (s.includes('cigar')) return 'cigar-store';
  if (s.includes('million')) return 'millionaires-collection';
  return 'grand-store';
};

const STORE_TABS = [
  {
    key: 'All',
    label: 'All Stores',
    subtitle: 'Unified Audience',
    icon: Globe,
    color: '#e2e8f0',
    activeClass: 'bg-white/10 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]',
    badgeClass: 'bg-white/10 text-white/90 border-white/20',
  },
  {
    key: 'grand-store',
    label: 'The Grand Store',
    subtitle: 'Flagship Luxury',
    icon: Store,
    color: '#c9a35b',
    activeClass: 'bg-[#c9a35b]/20 border-[#c9a35b] text-[#c9a35b] shadow-[0_0_20px_rgba(201,163,91,0.25)]',
    badgeClass: 'bg-[#c9a35b]/15 text-[#c9a35b] border-[#c9a35b]/30',
  },
  {
    key: 'cigar-store',
    label: 'Cigar Store',
    subtitle: 'Mcigar Club',
    icon: Flame,
    color: '#f59e0b',
    activeClass: 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    key: 'millionaires-collection',
    label: 'Millionaires Store',
    subtitle: 'Private Vault',
    icon: Crown,
    color: '#c084fc',
    activeClass: 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.25)]',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
];

export default function AdminNewsletter() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse initial store filter from URL query param if present
  const initialStore = useMemo(() => {
    const p = (searchParams.get('store') || '').toLowerCase();
    if (p.includes('cigar')) return 'cigar-store';
    if (p.includes('million')) return 'millionaires-collection';
    if (p.includes('grand')) return 'grand-store';
    if (p === 'all') return 'All';
    return 'All';
  }, []);

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterSource, setFilterSource] = useState(initialStore); // 'All' | 'grand-store' | 'cigar-store' | 'millionaires-collection'
  const [targetSource, setTargetSource] = useState('grand-store'); // For compose modal
  const [countries, setCountries] = useState(['All']);
  
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Selection / Checklist state
  const [selectedEmails, setSelectedEmails] = useState([]);
  
  // Compose modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState('selected'); // 'selected' | 'all' | 'country' | 'source'
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // M Collection Bottle Giveaway & Random Draw state
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [spinningName, setSpinningName] = useState('');
  const [drawWinner, setDrawWinner] = useState(null);
  const [drawError, setDrawError] = useState('');
  const [drawActionLoading, setDrawActionLoading] = useState(false);

  // Sync store param when URL changes externally
  useEffect(() => {
    const p = (searchParams.get('store') || '').toLowerCase();
    if (p.includes('cigar')) setFilterSource('cigar-store');
    else if (p.includes('million')) setFilterSource('millionaires-collection');
    else if (p.includes('grand')) setFilterSource('grand-store');
    else setFilterSource('All');
  }, [searchParams]);

  useEffect(() => {
    fetchSubscribers();
  }, [filterCountry]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCountry !== 'All') {
        params.country = filterCountry;
      }
      const res = await api.get('/newsletter/subscribers', { params });
      const data = res.data || [];
      setSubscribers(data);
      
      // Extract unique countries if 'All' is selected
      if (filterCountry === 'All') {
        const uniqueCountries = ['All', ...new Set(data.map(s => s.country || 'Unknown'))];
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Switch active store tab & update URL query param
  const handleSwitchStore = (storeKey) => {
    setFilterSource(storeKey);
    const newParams = new URLSearchParams(searchParams);
    if (storeKey === 'All') {
      newParams.delete('store');
    } else {
      newParams.set('store', storeKey);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Calculate live subscriber counts across all stores
  const storeCounts = useMemo(() => {
    let grandStore = 0;
    let cigarStore = 0;
    let millionaires = 0;
    let grandActive = 0;
    let cigarActive = 0;
    let millionActive = 0;

    subscribers.forEach(s => {
      const cat = getStoreCategory(s.source);
      const isActive = s.status === 'subscribed';
      if (cat === 'cigar-store') {
        cigarStore++;
        if (isActive) cigarActive++;
      } else if (cat === 'millionaires-collection') {
        millionaires++;
        if (isActive) millionActive++;
      } else {
        grandStore++;
        if (isActive) grandActive++;
      }
    });

    const activeTotal = subscribers.filter(s => s.status === 'subscribed').length;

    return {
      all: subscribers.length,
      allActive: activeTotal,
      grandStore,
      grandActive,
      cigarStore,
      cigarActive,
      millionaires,
      millionActive,
    };
  }, [subscribers]);

  // Filter subscribers first by active store tab
  const storeFilteredSubscribers = useMemo(() => {
    if (filterSource === 'All') return subscribers;
    return subscribers.filter(s => getStoreCategory(s.source) === filterSource);
  }, [subscribers, filterSource]);

  // Filter subscribers based on search term
  const filteredSubscribers = useMemo(() => {
    if (!activeSearch.trim()) return storeFilteredSubscribers;
    const query = activeSearch.toLowerCase().trim();
    return storeFilteredSubscribers.filter(sub => {
      const email = (sub.email || '').toLowerCase();
      const country = (sub.country || '').toLowerCase();
      const ip = (sub.ipAddress || '').toLowerCase();
      const status = (sub.status || '').toLowerCase();
      const source = (sub.source || 'grand-store').toLowerCase();
      return email.includes(query) || country.includes(query) || ip.includes(query) || status.includes(query) || source.includes(query);
    });
  }, [storeFilteredSubscribers, activeSearch]);

  const activeSubscribers = useMemo(() => {
    return filteredSubscribers.filter(s => s.status === 'subscribed');
  }, [filteredSubscribers]);

  const currentTabActiveCount = useMemo(() => {
    if (filterSource === 'grand-store') return storeCounts.grandActive;
    if (filterSource === 'cigar-store') return storeCounts.cigarActive;
    if (filterSource === 'millionaires-collection') return storeCounts.millionActive;
    return storeCounts.allActive;
  }, [filterSource, storeCounts]);

  // M Collection Giveaway Candidates & Winners
  const giveawayCandidates = useMemo(() => {
    return subscribers.filter(s => getStoreCategory(s.source) === 'millionaires-collection');
  }, [subscribers]);

  const giveawayWinners = useMemo(() => {
    return giveawayCandidates.filter(s => s.isWinner);
  }, [giveawayCandidates]);

  const eligibleCandidates = useMemo(() => {
    return giveawayCandidates.filter(s => !s.isWinner && s.status === 'subscribed');
  }, [giveawayCandidates]);

  const handleOpenDrawModal = () => {
    setDrawWinner(null);
    setDrawError('');
    setIsDrawing(false);
    setSpinningName('');
    setIsDrawModalOpen(true);
  };

  const handleStartRandomDraw = async () => {
    if (eligibleCandidates.length === 0) {
      setDrawError('No eligible non-winner candidates available for the draw.');
      return;
    }
    setIsDrawing(true);
    setDrawError('');
    setDrawWinner(null);

    try {
      // 1. Call backend API to select winner safely and record in DB
      const res = await api.post('/newsletter/mcollection/draw-winner', {
        prize: 'M Collection Brut Réserve Cuvée'
      });
      const winnerData = res.data.winner;

      // 2. Animate a lottery spinning effect through candidate names/emails
      const spinCandidates = eligibleCandidates.map(c => c.name || c.email);
      let counter = 0;
      const totalSpins = 24;
      const intervalTime = 90;

      const interval = setInterval(() => {
        counter++;
        const randomIdx = Math.floor(Math.random() * spinCandidates.length);
        setSpinningName(spinCandidates[randomIdx]);

        if (counter >= totalSpins) {
          clearInterval(interval);
          setSpinningName(winnerData.name || winnerData.email);
          setDrawWinner(winnerData);
          setIsDrawing(false);
          // Refresh list to update table and winner badges
          fetchSubscribers();
        }
      }, intervalTime);
    } catch (err) {
      console.error('Error drawing winner:', err);
      setDrawError(err.response?.data?.message || 'Failed to draw winner. Please try again.');
      setIsDrawing(false);
    }
  };

  const handleResetWinner = async (subId) => {
    if (!window.confirm('Are you sure you want to reset this winner status back to regular candidate?')) {
      return;
    }
    try {
      setDrawActionLoading(true);
      await api.post(`/newsletter/mcollection/reset-winner/${subId}`);
      await fetchSubscribers();
    } catch (err) {
      console.error('Error resetting winner:', err);
      alert(err.response?.data?.message || 'Failed to reset winner.');
    } finally {
      setDrawActionLoading(false);
    }
  };

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
      const visibleEmails = new Set(filteredSubscribers.map(s => s.email));
      setSelectedEmails(prev => prev.filter(email => !visibleEmails.has(email)));
    } else {
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

  // Open Compose Modal
  const openComposeModal = (mode = null) => {
    if (mode) {
      setRecipientMode(mode);
    } else if (selectedEmails.length > 0) {
      setRecipientMode('selected');
    } else if (filterSource !== 'All') {
      setRecipientMode('source');
      setTargetSource(filterSource);
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
        if (filterSource !== 'All') payload.source = filterSource;
      } else if (recipientMode === 'source') {
        payload.source = targetSource;
      } else {
        payload.country = 'All';
        if (filterSource !== 'All') payload.source = filterSource;
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
      return subscribers.filter(s => s.status === 'subscribed' && (filterCountry === 'All' || s.country === filterCountry) && (filterSource === 'All' || getStoreCategory(s.source) === filterSource)).length;
    }
    if (recipientMode === 'source') {
      if (targetSource === 'cigar-store') return storeCounts.cigarActive;
      if (targetSource === 'millionaires-collection') return storeCounts.millionActive;
      return storeCounts.grandActive;
    }
    return storeCounts.allActive;
  }, [recipientMode, selectedEmails, subscribers, filterCountry, filterSource, targetSource, storeCounts]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-[#c9a35b] font-mono font-bold bg-[#c9a35b]/10 border border-[#c9a35b]/20 px-2.5 py-0.5 rounded-full">
              Unified Campaign Hub
            </span>
          </div>
          <h1 className="text-2xl font-serif text-[var(--color-ivory,#eee8dd)] font-normal tracking-wide mb-1 flex items-center gap-2.5">
            <Mail className="text-[#c9a35b]" size={24} /> Newsletter Subscribers
          </h1>
          <p className="text-white/50 text-sm">
            Manage subscriber audiences across Grand Store, Cigar Store, and Millionaires Store from a single console.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedEmails.length > 0 && (
            <button 
              onClick={() => openComposeModal('selected')}
              className="bg-[#c9a35b] hover:bg-[#d4af37] text-black px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(201,163,91,0.3)] cursor-pointer"
            >
              <Send size={15} /> Send to Selected ({selectedEmails.length})
            </button>
          )}
          <button 
            onClick={() => openComposeModal(selectedEmails.length > 0 ? 'selected' : (filterSource !== 'All' ? 'source' : 'all'))}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 rounded-xl font-medium text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send size={15} /> Compose Broadcast
          </button>
        </div>
      </div>

      {/* LUXURY STORE SWITCHER (One Route — Switch between Grand Store, Cigar Store, or Millionaires Store) */}
      <div className="bg-[#0a0a0a] border border-white/10 p-2.5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-2.5">
          <div className="flex items-center gap-2">
            <Store size={14} className="text-[#c9a35b]" />
            <span className="text-xs uppercase tracking-widest text-white/60 font-bold">Select Store Newsletter</span>
          </div>
          <span className="text-[11px] text-white/40 font-mono">
            Active: <span className="text-[#c9a35b] font-bold">{STORE_TABS.find(t => t.key === filterSource)?.label || 'All Stores'}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = filterSource === tab.key;
            const count = tab.key === 'All' 
              ? storeCounts.all 
              : tab.key === 'grand-store' 
              ? storeCounts.grandStore 
              : tab.key === 'cigar-store' 
              ? storeCounts.cigarStore 
              : storeCounts.millionaires;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSwitchStore(tab.key)}
                className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isActive 
                    ? tab.activeClass 
                    : 'bg-black/40 border-white/5 hover:border-white/15 hover:bg-white/[0.03] text-white/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-black/40 text-current' : 'bg-white/5 text-white/50'
                  }`}>
                    <Icon size={18} style={{ color: isActive ? tab.color : undefined }} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-white/80'}`}>
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-white/40 font-normal">
                      {tab.subtitle}
                    </div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${tab.badgeClass}`}>
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards (Interactive — Click to filter by store) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <div 
          onClick={() => handleSwitchStore('All')}
          className={`bg-[#0a0a0a] border p-5 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all ${
            filterSource === 'All' 
              ? 'border-white/30 bg-white/[0.03] shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
              : 'border-white/5 hover:border-white/15'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Users size={22} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white">{storeCounts.all}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Total Subscribers</div>
              <div className="text-[10px] text-green-400 font-mono mt-0.5">{storeCounts.allActive} active</div>
            </div>
          </div>
          {filterSource === 'All' && (
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          )}
        </div>

        {/* Card 2: Grand Store */}
        <div 
          onClick={() => handleSwitchStore('grand-store')}
          className={`bg-[#0a0a0a] border p-5 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all ${
            filterSource === 'grand-store' 
              ? 'border-[#c9a35b]/50 bg-[#c9a35b]/[0.05] shadow-[0_0_15px_rgba(201,163,91,0.15)]' 
              : 'border-white/5 hover:border-[#c9a35b]/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#c9a35b]/10 rounded-xl flex items-center justify-center text-[#c9a35b]">
              <Store size={22} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#c9a35b]">{storeCounts.grandStore}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">The Grand Store</div>
              <div className="text-[10px] text-[#c9a35b]/70 font-mono mt-0.5">{storeCounts.grandActive} active</div>
            </div>
          </div>
          {filterSource === 'grand-store' && (
            <span className="w-2 h-2 rounded-full bg-[#c9a35b] animate-pulse" />
          )}
        </div>

        {/* Card 3: Cigar Store */}
        <div 
          onClick={() => handleSwitchStore('cigar-store')}
          className={`bg-[#0a0a0a] border p-5 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all ${
            filterSource === 'cigar-store' 
              ? 'border-amber-500/50 bg-amber-500/[0.05] shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
              : 'border-white/5 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
              <Flame size={22} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-amber-400">{storeCounts.cigarStore}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Cigar Store</div>
              <div className="text-[10px] text-amber-400/70 font-mono mt-0.5">{storeCounts.cigarActive} active</div>
            </div>
          </div>
          {filterSource === 'cigar-store' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </div>

        {/* Card 4: Millionaires Store */}
        <div 
          onClick={() => handleSwitchStore('millionaires-collection')}
          className={`bg-[#0a0a0a] border p-5 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all ${
            filterSource === 'millionaires-collection' 
              ? 'border-purple-500/50 bg-purple-500/[0.05] shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
              : 'border-white/5 hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-300">
              <Crown size={22} />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-purple-300">{storeCounts.millionaires}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">Millionaires Store</div>
              <div className="text-[10px] text-purple-300/70 font-mono mt-0.5">{storeCounts.millionActive} active</div>
            </div>
          </div>
          {filterSource === 'millionaires-collection' && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* M Collection Bottle Giveaway & Random Draw Section */}
      {filterSource === 'millionaires-collection' && (
        <div className="bg-gradient-to-r from-purple-950/60 via-[#180e29] to-[#0a0a0a] border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Trophy size={28} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Exclusive Campaign
                </span>
                <span className="text-white/40 text-xs font-mono">
                  Source: millionair.yogapranafitness.com/#giveaway
                </span>
              </div>
              <h3 className="text-xl font-serif text-white tracking-wide mt-1 flex items-center gap-2">
                Stand a Chance to Win M Collection Bottles
              </h3>
              <p className="text-white/60 text-xs max-w-xl mt-1 leading-relaxed">
                Visitors subscribe on the M Collection website to enter the bottle draw. Run the interactive random draw machine below to randomly crown a verified winner from eligible entries.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300">
                  <Users size={14} />
                  <span>Pool Size: <strong className="font-mono text-white">{giveawayCandidates.length}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle size={14} />
                  <span>Eligible for Draw: <strong className="font-mono text-white">{eligibleCandidates.length}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Trophy size={14} />
                  <span>Crowned Winners: <strong className="font-mono text-white">{giveawayWinners.length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {giveawayWinners.length > 0 && (
              <div className="text-right sm:mr-2">
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Latest Winner</div>
                <div className="text-white font-mono text-xs font-semibold">
                  {giveawayWinners[0].name || giveawayWinners[0].email}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenDrawModal}
              disabled={eligibleCandidates.length === 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 via-[#d4af37] to-amber-500 hover:from-white hover:to-amber-200 text-black font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Dice5 size={18} />
              Start Random Draw ({eligibleCandidates.length})
            </button>
          </div>
        </div>
      )}

      {/* Search & Country Filter Toolbar */}
      <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email, country, IP address, or status..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a35b]/70 transition-colors font-sans"
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
            className="bg-[#c9a35b] hover:bg-white text-black font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
          >
            <Search size={14} /> Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Filter */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-[#c9a35b]" />
            <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Country:</span>
            <select 
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer focus:text-[#c9a35b]"
            >
              {countries.map(c => (
                <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {(activeSearch || filterCountry !== 'All' || filterSource !== 'All') && (
            <button
              onClick={() => {
                handleClearSearch();
                setFilterCountry('All');
                handleSwitchStore('All');
              }}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white bg-white/5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={13} /> Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Floating Selection Bar (when 1+ selected) */}
      {selectedEmails.length > 0 && (
        <div className="bg-gradient-to-r from-[#c9a35b]/15 via-[#c9a35b]/10 to-transparent border border-[#c9a35b]/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a35b]/20 flex items-center justify-center text-[#c9a35b]">
              <CheckSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                <span className="text-[#c9a35b] font-mono">{selectedEmails.length}</span> subscriber{selectedEmails.length > 1 ? 's' : ''} checked in list
              </p>
              <p className="text-xs text-white/50">
                Send targeted campaigns exclusively to these selected recipients across stores.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllActive}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Select All Active in Tab ({activeSubscribers.length})
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => openComposeModal('selected')}
              className="px-4 py-1.5 bg-[#c9a35b] hover:bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Send size={13} /> Send to {selectedEmails.length} Selected
            </button>
          </div>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-mono">{filteredSubscribers.length}</strong> subscribers
              {filterSource !== 'All' && (
                <span className="text-[#c9a35b] font-medium ml-1">
                  for {STORE_TABS.find(t => t.key === filterSource)?.label}
                </span>
              )}
            </span>
            {activeSearch && <span>matching "<span className="text-[#c9a35b]">{activeSearch}</span>"</span>}
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
                    className="cursor-pointer text-white/60 hover:text-[#c9a35b] transition-colors inline-flex items-center justify-center p-1"
                    title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare size={18} className="text-[#c9a35b]" />
                    ) : isSomeVisibleSelected ? (
                      <div className="w-[18px] h-[18px] border-2 border-[#c9a35b] rounded flex items-center justify-center">
                        <div className="w-2.5 h-1 bg-[#c9a35b] rounded-sm" />
                      </div>
                    ) : (
                      <Square size={18} className="text-white/40" />
                    )}
                  </button>
                </th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Store / Channel</th>
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
                  <td colSpan="8" className="p-12 text-center text-white/50">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-[#c9a35b] border-t-transparent animate-spin" />
                      Loading subscribers...
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-white/50">
                    <Mail size={32} className="mx-auto mb-3 text-white/20" />
                    <p className="text-white/70 font-medium">No subscribers found in this category.</p>
                    {(activeSearch || filterSource !== 'All') && (
                      <button 
                        onClick={() => {
                          handleClearSearch();
                          handleSwitchStore('All');
                        }}
                        className="mt-3 text-xs text-[#c9a35b] hover:underline cursor-pointer"
                      >
                        Clear filters and view all subscribers
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const isChecked = selectedEmails.includes(sub.email);
                  const storeCat = getStoreCategory(sub.source);

                  return (
                    <tr 
                      key={sub._id || sub.email} 
                      onClick={() => handleToggleSelectOne(sub.email)}
                      className={`transition-colors cursor-pointer ${
                        isChecked 
                          ? 'bg-[#c9a35b]/[0.08] hover:bg-[#c9a35b]/[0.12]' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button" 
                          onClick={() => handleToggleSelectOne(sub.email)}
                          className="cursor-pointer text-white/60 hover:text-[#c9a35b] transition-colors inline-flex items-center justify-center p-1"
                        >
                          {isChecked ? (
                            <CheckSquare size={18} className="text-[#c9a35b]" />
                          ) : (
                            <Square size={18} className="text-white/30" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            sub.isWinner 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50' 
                              : isChecked ? 'bg-[#c9a35b]/20 text-[#c9a35b]' : 'bg-white/5 text-white/50'
                          }`}>
                            {sub.isWinner ? <Trophy size={15} /> : <Mail size={14} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm ${sub.isWinner ? 'text-amber-300 font-bold' : isChecked ? 'text-[#c9a35b] font-bold' : 'text-white'}`}>
                                {sub.email}
                              </span>
                              {sub.isWinner && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                                  <Trophy size={10} /> WINNER
                                </span>
                              )}
                              {sub.isGiveawayEntry && !sub.isWinner && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  🎟️ Giveaway Entry
                                </span>
                              )}
                            </div>
                            {(sub.name || sub.phone) && (
                              <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                                {sub.name && (
                                  <span className="flex items-center gap-1 text-white/70">
                                    <User size={11} className="text-[#c9a35b]" /> {sub.name}
                                  </span>
                                )}
                                {sub.phone && (
                                  <span className="flex items-center gap-1 font-mono text-white/60">
                                    <Phone size={11} className="text-[#c9a35b]" /> {sub.phone}
                                  </span>
                                )}
                              </div>
                            )}
                            {sub.isWinner && (
                              <div className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1.5">
                                <span>Prize: {sub.prize || 'M Collection Brut Réserve Cuvée'}</span>
                                {sub.wonAt && (
                                  <span className="text-white/40">
                                    ({new Date(sub.wonAt).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Store / Source Badge */}
                      <td className="p-4">
                        {storeCat === 'cigar-store' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Flame size={12} className="text-amber-400" /> Cigar Store
                          </span>
                        ) : storeCat === 'millionaires-collection' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Crown size={12} className="text-purple-300" /> Millionaires
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#c9a35b]/15 text-[#c9a35b] border border-[#c9a35b]/30">
                            <Store size={12} className="text-[#c9a35b]" /> Grand Store
                          </span>
                        )}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.isWinner && (
                            <button
                              type="button"
                              onClick={() => handleResetWinner(sub._id)}
                              disabled={drawActionLoading}
                              title="Reset winner status"
                              className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg text-xs font-medium text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={11} /> Reset
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmails([sub.email]);
                              openComposeModal('selected');
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-[#c9a35b]/20 hover:text-[#c9a35b] border border-white/10 rounded-lg text-xs font-medium text-white/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send size={11} /> Compose
                          </button>
                        </div>
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
            className="bg-[#0f0e0c] border border-[#c9a35b]/30 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/20 flex items-center justify-center text-[#c9a35b]">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-lg text-white font-serif tracking-wide">Compose Newsletter Broadcast</h2>
                  <p className="text-white/40 text-xs">Target specific store audiences and dispatch luxury campaigns</p>
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

              {/* Recipient Targeting Mode */}
              <div className="space-y-3">
                <label className="block text-white/60 text-xs uppercase tracking-widest font-bold">
                  Target Audience
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Option 1: Selected Subscribers */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'selected' 
                      ? 'bg-[#c9a35b]/15 border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">Checked List</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="selected" 
                        checked={recipientMode === 'selected'} 
                        onChange={() => setRecipientMode('selected')}
                        className="accent-[#c9a35b] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-[#c9a35b]">{selectedEmails.length}</div>
                    <span className="text-[11px] text-white/50">Checked in table</span>
                  </label>

                  {/* Option 2: All Active Subscribers */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'all' 
                      ? 'bg-[#c9a35b]/15 border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">All Stores</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="all" 
                        checked={recipientMode === 'all'} 
                        onChange={() => setRecipientMode('all')}
                        className="accent-[#c9a35b] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-white">{storeCounts.allActive}</div>
                    <span className="text-[11px] text-white/50">All active subscribers</span>
                  </label>

                  {/* Option 3: By Specific Store */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'source' 
                      ? 'bg-[#c9a35b]/15 border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">By Store</span>
                      <input 
                        type="radio" 
                        name="recipientMode" 
                        value="source" 
                        checked={recipientMode === 'source'} 
                        onChange={() => setRecipientMode('source')}
                        className="accent-[#c9a35b] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-[#c9a35b]">
                      {targetSource === 'cigar-store' 
                        ? storeCounts.cigarActive 
                        : targetSource === 'millionaires-collection' 
                        ? storeCounts.millionActive 
                        : storeCounts.grandActive}
                    </div>
                    <span className="text-[11px] text-white/50 truncate">
                      {targetSource === 'cigar-store' ? 'Cigar Store' : targetSource === 'millionaires-collection' ? 'Millionaires' : 'Grand Store'}
                    </span>
                  </label>

                  {/* Option 4: By Country */}
                  <label className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    recipientMode === 'country' 
                      ? 'bg-[#c9a35b]/15 border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.2)]' 
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
                        className="accent-[#c9a35b] w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="text-lg font-mono font-bold text-white truncate">{filterCountry}</div>
                    <span className="text-[11px] text-white/50">Current filtered country</span>
                  </label>
                </div>

                {/* Sub-selector when By Store is chosen */}
                {recipientMode === 'source' && (
                  <div className="p-4 bg-black/60 border border-[#c9a35b]/30 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wider text-white/60 font-bold">
                      Select Target Store:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Grand Store */}
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        targetSource === 'grand-store'
                          ? 'bg-[#c9a35b]/15 border-[#c9a35b] text-[#c9a35b]'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}>
                        <input 
                          type="radio" 
                          name="targetSourceRadio" 
                          value="grand-store" 
                          checked={targetSource === 'grand-store'}
                          onChange={() => setTargetSource('grand-store')}
                          className="accent-[#c9a35b] w-3.5 h-3.5"
                        />
                        <Store size={14} className="text-[#c9a35b]" />
                        <span className="text-xs font-semibold">Grand Store ({storeCounts.grandActive})</span>
                      </label>

                      {/* Cigar Store */}
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        targetSource === 'cigar-store'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}>
                        <input 
                          type="radio" 
                          name="targetSourceRadio" 
                          value="cigar-store" 
                          checked={targetSource === 'cigar-store'}
                          onChange={() => setTargetSource('cigar-store')}
                          className="accent-amber-400 w-3.5 h-3.5"
                        />
                        <Flame size={14} className="text-amber-400" />
                        <span className="text-xs font-semibold">Cigar Store ({storeCounts.cigarActive})</span>
                      </label>

                      {/* Millionaires Collection */}
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        targetSource === 'millionaires-collection'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-white/5 border-white/10 text-white/70'
                      }`}>
                        <input 
                          type="radio" 
                          name="targetSourceRadio" 
                          value="millionaires-collection" 
                          checked={targetSource === 'millionaires-collection'}
                          onChange={() => setTargetSource('millionaires-collection')}
                          className="accent-purple-400 w-3.5 h-3.5"
                        />
                        <Crown size={14} className="text-purple-300" />
                        <span className="text-xs font-semibold">Millionaires Store ({storeCounts.millionActive})</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Checked Emails Chip Preview */}
                {recipientMode === 'selected' && (
                  <div className="p-3 bg-black/60 border border-[#c9a35b]/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#c9a35b] flex items-center gap-1.5">
                        <CheckSquare size={13} /> {selectedEmails.length} Specific Recipients Chosen
                      </span>
                      {selectedEmails.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedEmails([])}
                          className="text-[10px] text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {selectedEmails.length === 0 ? (
                      <p className="text-xs text-amber-400/80 italic">
                        No subscribers checked yet! Close this modal or choose "By Store" or "All Stores" above, or tick the checkboxes next to subscribers in the table.
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

              {/* Subject Line */}
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
                  Subject Line
                </label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a35b] transition-colors font-sans text-sm"
                  placeholder="e.g., Exclusive Allocation: Rare Cuban Arrivals & Vintage Reserves"
                  required
                />
              </div>

              {/* HTML Body */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/60 text-xs uppercase tracking-widest font-bold">
                    Email Content (HTML Supported)
                  </label>
                  <span className="text-[10px] text-[#c9a35b]/80 font-mono">Dispatched with luxury header branding</span>
                </div>
                <textarea 
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full flex-1 min-h-[180px] bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:border-[#c9a35b] transition-colors leading-relaxed placeholder-white/20"
                  placeholder="<h2>Exclusive Drop Notice</h2><p>Dear Connoisseur,</p><p>We are delighted to present a private release...</p>"
                  required
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/40 shrink-0">
              <div className="text-xs text-white/50 flex items-center gap-1.5">
                <Users size={14} className="text-[#c9a35b]" />
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
                  className="flex-1 sm:flex-none bg-[#c9a35b] hover:bg-white text-black px-7 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(201,163,91,0.3)]"
                >
                  {sending ? 'Sending Broadcast...' : <><Send size={15} /> Send Broadcast ({targetRecipientCount})</>}
                </button>
              </div>
            </div>
            
          </form>
        </div>
      )}
      {/* M Collection Random Draw Machine Modal */}
      {isDrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e0914] border border-amber-400/40 rounded-3xl w-full max-w-xl shadow-[0_0_60px_rgba(212,175,55,0.25)] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-purple-500/20 flex justify-between items-center bg-purple-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Dice5 size={22} className={isDrawing ? 'animate-spin' : ''} />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-white tracking-wide">M Collection Grand Bottle Draw</h3>
                  <p className="text-white/40 text-xs">Official Random Selector for M Collection Brut Réserve Giveaway</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsDrawModalOpen(false)} 
                className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                disabled={isDrawing}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex flex-col items-center text-center">
              {drawError && (
                <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {drawError}
                </div>
              )}

              {/* Prize Showcase Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs uppercase tracking-widest font-semibold mb-6">
                <Gift size={14} /> Prize: 1x Authentic M Collection Brut Réserve Cuvée
              </div>

              {/* Animated Slot Box */}
              <div className="w-full bg-black/70 border-2 border-amber-400/30 rounded-2xl p-6 relative overflow-hidden shadow-inner min-h-[140px] flex flex-col items-center justify-center">
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#0e0914] to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#0e0914] to-transparent pointer-events-none" />

                {isDrawing ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="text-[11px] uppercase tracking-widest text-amber-400 font-mono">
                      Rolling Random Candidates...
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider break-all px-2">
                      {spinningName || 'Selecting Candidate...'}
                    </div>
                    <div className="text-xs text-white/40 font-mono">
                      {eligibleCandidates.length} eligible candidates in pool
                    </div>
                  </div>
                ) : drawWinner ? (
                  <div className="space-y-3 animate-in zoom-in-95 duration-300">
                    <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-300 font-bold bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/40">
                      <Trophy size={14} className="text-amber-400" /> WINNER SELECTED!
                    </div>
                    <div className="text-2xl sm:text-3xl font-serif text-white font-bold tracking-wide">
                      {drawWinner.name || 'Connoisseur'}
                    </div>
                    <div className="text-sm font-mono text-amber-300 font-semibold break-all">
                      {drawWinner.email}
                    </div>
                    {drawWinner.phone && (
                      <div className="text-xs font-mono text-white/60">
                        📞 {drawWinner.phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-white/40 text-xs uppercase tracking-widest">
                      Draw Pool Ready
                    </div>
                    <div className="text-xl font-mono text-white">
                      {eligibleCandidates.length} Candidates Waiting
                    </div>
                    <p className="text-xs text-white/50 max-w-sm">
                      Click the draw button below to initiate the cryptographic random selection algorithm.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-8 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartRandomDraw}
                  disabled={isDrawing || eligibleCandidates.length === 0}
                  className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-amber-400 via-[#d4af37] to-amber-500 hover:from-white hover:to-amber-200 text-black font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Dice5 size={16} />
                  {isDrawing ? 'Drawing...' : drawWinner ? 'Draw Another Winner' : 'Start Random Draw'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawModalOpen(false)}
                  disabled={isDrawing}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
