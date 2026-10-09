import { useState, useEffect } from 'react';
import LocationInput from '../../components/LocationInput';
import { Navigation, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const VendorShippingProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    pickupAddress: { street: '', city: '', postalCode: '', country: 'South Africa', lat: null, lng: null },
    defaultDimensions: { length: 35, width: 25, height: 30, unit: 'cm' },
    defaultWeight: { value: 9, unit: 'kg' },
    shippingZones: [
      { name: 'Johannesburg', rate: 150 },
      { name: 'Cape Town', rate: 100 },
      { name: 'Durban', rate: 170 },
      { name: 'Pretoria', rate: 160 }
    ],
    freeDeliveryThreshold: 1500,
    handlingTimeDays: 2
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [postnetStores, setPostnetStores] = useState(null);
  const [postnetLoading, setPostnetLoading] = useState(false);

  useEffect(() => {
    const fetchPostnetStores = async () => {
      if (!profile?.pickupAddress?.city) return;
      const addr = profile.pickupAddress;
      const addressString = `${addr.street || ""}, ${addr.city || ""}, ${addr.country || "South Africa"}`;

      try {
        setPostnetLoading(true);
        let queryParams = `address=${encodeURIComponent(addressString)}`;
        if (addr.lat && addr.lng) {
            queryParams += `&lat=${addr.lat}&lng=${addr.lng}`;
        }
        const res = await api.get(`/postnet/locator?${queryParams}`);
        const data = res.data;
        if (data.stores) {
          setPostnetStores(data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch PostNet stores:", error);
      } finally {
        setPostnetLoading(false);
      }
    };

    fetchPostnetStores();
  }, [profile?.pickupAddress?.street, profile?.pickupAddress?.city]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/vendor/shipping-profile`);
        const data = res.data;
        if (Object.keys(data).length > 0) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching shipping profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e, section, field) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    if (section) {
      setProfile({
        ...profile,
        [section]: { ...profile[section], [field]: value }
      });
    } else {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleZoneChange = (index, field, value) => {
    const updatedZones = [...profile.shippingZones];
    updatedZones[index][field] = field === 'rate' ? parseFloat(value) : value;
    setProfile({ ...profile, shippingZones: updatedZones });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/vendor/shipping-profile`, { shippingProfile: profile });
      setMessage('Shipping profile updated successfully!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update shipping profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gold">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-playfair font-bold text-gold mb-8">Shipping Profile</h1>
      <p className="text-white/60 mb-6">Configure your warehouse location, default packaging, and shipping rates.</p>

      {message && (
        <div className="bg-gold/20 text-gold p-4 mb-6 border border-gold/50 rounded">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Pickup Address */}
        <div className="bg-black/40 border border-gold/30 p-6 rounded-lg">
          <h2 className="text-xl text-gold mb-4">Pickup Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 mb-1">Street Address</label>
              <LocationInput className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.pickupAddress.street || ''} 
                onChange={(e) => handleChange(e, 'pickupAddress', 'street')} 
                onPlaceDetails={({ city, postalCode, country, lat, lng }) => {
                  setProfile(prev => ({
                    ...prev,
                    pickupAddress: {
                      ...prev.pickupAddress,
                      city: city || prev.pickupAddress.city,
                      postalCode: postalCode || prev.pickupAddress.postalCode,
                      country: country || prev.pickupAddress.country,
                      lat: lat || prev.pickupAddress.lat,
                      lng: lng || prev.pickupAddress.lng
                    }
                  }));
                }}
                required placeholder="Start typing address..." />
            </div>
            <div>
              <label className="block text-white/70 mb-1">City</label>
              <input type="text" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.pickupAddress.city || ''} onChange={(e) => handleChange(e, 'pickupAddress', 'city')} required />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Postal Code</label>
              <input type="text" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.pickupAddress.postalCode || ''} onChange={(e) => handleChange(e, 'pickupAddress', 'postalCode')} required />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Country</label>
              <input type="text" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.pickupAddress.country || 'South Africa'} onChange={(e) => handleChange(e, 'pickupAddress', 'country')} required />
            </div>
          </div>

          {/* Nearest PostNet Stores */}
          <div className="mt-6">
            {postnetLoading ? (
              <div className="text-sm text-white/60">Locating nearest PostNet stores for drop-off...</div>
            ) : postnetStores && postnetStores.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-gold/20 rounded-xl p-4 shadow-lg shadow-gold/5 flex items-center justify-center min-h-[80px]">
                <p className="text-white/60 text-sm">No nearby PostNet stores found within 50km.</p>
              </div>
            ) : postnetStores && postnetStores.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gold/20 rounded-xl p-4 shadow-lg shadow-gold/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="p-2 bg-gold/10 text-gold rounded-lg">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <h3 className="text-md font-serif text-white">Nearest PostNet Drop-off Locations</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                  {postnetStores.slice(0, 4).map((store, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/10 hover:border-gold/30 rounded-lg p-3 group transition-colors">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store + ' ' + store.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-between items-start gap-2"
                      >
                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-gold transition-colors">{store.store}</h4>
                        <ExternalLink size={14} className="text-white/40 opacity-50 group-hover:text-gold transition-colors mt-0.5 flex-shrink-0" />
                      </a>
                      <p className="text-xs text-white/60 mb-2 truncate">{store.address}</p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-xs font-mono text-gold">{store.telephone}</span>
                        <span className="text-[10px] uppercase tracking-widest bg-gold/10 text-gold px-2 py-0.5 rounded">
                          {store.distance ? store.distance.toFixed(1) : '?'} KM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Packaging Defaults */}
        <div className="bg-black/40 border border-gold/30 p-6 rounded-lg">
          <h2 className="text-xl text-gold mb-4">Default Packaging (e.g. 6-bottle box)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white/70 mb-1">Length ({profile.defaultDimensions.unit})</label>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.defaultDimensions.length || 0} onChange={(e) => handleChange(e, 'defaultDimensions', 'length')} />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Width ({profile.defaultDimensions.unit})</label>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.defaultDimensions.width || 0} onChange={(e) => handleChange(e, 'defaultDimensions', 'width')} />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Height ({profile.defaultDimensions.unit})</label>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.defaultDimensions.height || 0} onChange={(e) => handleChange(e, 'defaultDimensions', 'height')} />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Weight ({profile.defaultWeight.unit})</label>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.defaultWeight.value || 0} onChange={(e) => handleChange(e, 'defaultWeight', 'value')} />
            </div>
          </div>
        </div>

        {/* Shipping Rates */}
        <div className="bg-black/40 border border-gold/30 p-6 rounded-lg">
          <h2 className="text-xl text-gold mb-4">Domestic Shipping Zones</h2>
          <p className="text-white/60 mb-4 text-sm">Set your flat rates for domestic shipping. The system will match the customer's city to these zones.</p>
          
          <div className="space-y-4">
            {profile.shippingZones.map((zone, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-white/70 mb-1">Zone Name / City</label>
                  <input type="text" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                    value={zone.name} onChange={(e) => handleZoneChange(index, 'name', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-white/70 mb-1">Flat Rate (R)</label>
                  <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                    value={zone.rate} onChange={(e) => handleZoneChange(index, 'rate', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-black/40 border border-gold/30 p-6 rounded-lg">
          <h2 className="text-xl text-gold mb-4">Shipping Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 mb-1">Free Delivery Threshold (R)</label>
              <p className="text-white/40 text-xs mb-2">Leave blank or 0 for no free delivery</p>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.freeDeliveryThreshold || ''} onChange={(e) => handleChange(e, null, 'freeDeliveryThreshold')} />
            </div>
            <div>
              <label className="block text-white/70 mb-1">Handling Time (Days)</label>
              <p className="text-white/40 text-xs mb-2">Days before package is handed to courier</p>
              <input type="number" className="w-full bg-black border border-gold/30 rounded p-2 text-white focus:border-gold" 
                value={profile.handlingTimeDays || 0} onChange={(e) => handleChange(e, null, 'handlingTimeDays')} />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="bg-gold text-black px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-yellow-600 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Shipping Profile'}
        </button>
      </form>
    </div>
  );
};

export default VendorShippingProfile;
