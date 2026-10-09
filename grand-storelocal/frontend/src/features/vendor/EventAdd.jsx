import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, MapPin, Tag, Plus, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const toDateInput = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function EventAdd({ onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    type: 'Wine Tasting',
    format: 'Physical',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    city: '',
    description: '',
    hostName: '',
    capacity: ''
  });

  const [imageFile, setImageFile] = useState(null);
  
  const [ticketTiers, setTicketTiers] = useState([
    { name: 'General', price: '', quantity: '', benefits: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user || (user.role !== 'vendor_active' && user.role !== 'event_host')) {
    return (
      <div className="min-h-screen bg-[#0a0907] pt-0 pb-20 px-4 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-md w-full text-center">
          Only approved vendors can create events.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTicketChange = (index, field, value) => {
    const newTiers = [...ticketTiers];
    newTiers[index][field] = value;
    setTicketTiers(newTiers);
  };

  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { name: '', price: '', quantity: '', benefits: '' }]);
  };

  const removeTicketTier = (index) => {
    if (ticketTiers.length > 1) {
      setTicketTiers(ticketTiers.filter((_, i) => i !== index));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.endTime <= formData.startTime) {
      setError('Event end time must be later than its start time.');
      return;
    }
    const tierCapacity = ticketTiers.reduce((sum, tier) => sum + Number(tier.quantity || 0), 0);
    if (tierCapacity > Number(formData.capacity)) {
      setError('Combined ticket quantities cannot exceed the total event capacity.');
      return;
    }

    setSubmitting(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (imageFile) {
        payload.append('image', imageFile);
      }

      // Process ticket tiers: convert benefits string to array
      const processedTiers = ticketTiers.map(t => ({
        name: t.name,
        price: Number(t.price),
        quantity: Number(t.quantity),
        benefits: t.benefits.split(',').map(b => b.trim()).filter(Boolean)
      }));
      payload.append('ticketTiers', JSON.stringify(processedTiers));

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/events`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (onNotify) onNotify(response.data?.message || 'Event submitted for admin approval!');
      navigate(user.role === 'event_host' ? '/event-manager/events' : '/vendor/events');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0907] pt-0 pb-20 px-4 text-[#eee8dd]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Create <span className="text-[#e1bd70]" >Event</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">Host a tasting, masterclass, or global experience.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basics */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium border-b border-white/10 pb-4">Event Basics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Event Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none appearance-none">
                  <option>Wine Tasting</option>
                  <option>Whisky Experience</option>
                  <option>Masterclass</option>
                  <option>Winemaker Dinner</option>
                  <option>Festival</option>
                  <option>Virtual Tasting</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Host Name</label>
                <input type="text" name="hostName" value={formData.hostName} onChange={handleChange} placeholder="e.g. John Smith" className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Event Image *</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-2 text-sm file:bg-[#c9a35b] file:text-black file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-[#e1bd70]" />
              </div>
            </div>
          </section>

          {/* Logistics */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium border-b border-white/10 pb-4 flex items-center gap-2"><Calendar className="text-[#e1bd70]" size={20}/> Date, Time & Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Date *</label>
                <input type="date" name="date" min={toDateInput()} value={formData.date} onChange={handleChange} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Start Time *</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">End Time *</label>
                <input type="time" name="endTime" min={formData.startTime || undefined} value={formData.endTime} onChange={handleChange} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Format *</label>
                <select name="format" value={formData.format} onChange={handleChange} className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none appearance-none">
                  <option>Physical</option>
                  <option>Virtual</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Venue / Link *</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Total Capacity (People) *</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required min="1" className="w-full md:w-1/3 bg-[#0a0907] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none" />
            </div>
          </section>



          {/* Tickets */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium border-b border-white/10 pb-4 flex items-center gap-2"><Tag className="text-[#e1bd70]" size={20}/> Ticket Tiers</h2>
            
            {ticketTiers.map((tier, index) => (
              <div key={index} className="bg-[#0a0907] border border-white/5 p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-[#eee8dd]">Tier {index + 1}</h3>
                  {ticketTiers.length > 1 && (
                    <button type="button" onClick={() => removeTicketTier(index)} className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300">
                      <Trash2 size={16}/> Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Name *</label>
                    <input type="text" value={tier.name} onChange={(e) => handleTicketChange(index, 'name', e.target.value)} placeholder="e.g. General, VIP" required className="w-full bg-[#11100d] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Price (ZAR) *</label>
                    <input type="number" value={tier.price} onChange={(e) => handleTicketChange(index, 'price', e.target.value)} required min="0" className="w-full bg-[#11100d] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Quantity Available *</label>
                    <input type="number" value={tier.quantity} onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)} required min="1" className="w-full bg-[#11100d] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none text-sm" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#918a7f] mb-2">Benefits (Comma separated)</label>
                  <input type="text" value={tier.benefits} onChange={(e) => handleTicketChange(index, 'benefits', e.target.value)} placeholder="e.g. 5 tastings, Food pairing, Free bottle" className="w-full bg-[#11100d] border border-white/10 rounded-lg p-3 focus:border-[#c9a35b] outline-none text-sm" />
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addTicketTier} className="text-[#e1bd70] text-sm font-semibold uppercase tracking-wider flex items-center gap-2 hover:text-[#e1bd70]">
              <Plus size={16} /> Add Ticket Tier
            </button>
          </section>

          <div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-bold uppercase tracking-wider py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 "
            >
              {submitting ? 'Submitting Event...' : <><CheckCircle2 size={20} /> Submit for Approval</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
