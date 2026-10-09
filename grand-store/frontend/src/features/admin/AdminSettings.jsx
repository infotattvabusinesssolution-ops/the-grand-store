import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Settings, Save, RefreshCw, Percent, Truck, ShieldCheck, ShoppingBag, Users, Gift, Send, AlertCircle, CheckCircle2, Landmark, Plus, Trash2, RotateCcw, UserCheck, UploadCloud, FileText, Coins, Sparkles, DollarSign, Scale, ShieldAlert } from "lucide-react";
import api from '../../api';
import Price from '../../components/ui/Price';

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const goldText = "text-[#c9a35b]";
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get(`/settings/public`);
        const data = res.data || {};
        if (!data.bankDetailsList || data.bankDetailsList.length === 0) {
          const bd = data.bankDetails || {};
          data.bankDetailsList = [
            { id: 'bank_name', key: 'Bank Name', value: bd.bankName || 'Standard Bank' },
            { id: 'account_name', key: 'Account Holder', value: bd.accountName || 'The Grand Store PTY LTD' },
            { id: 'account_number', key: 'Account Number', value: bd.accountNumber || '0123456789' },
            { id: 'branch_code', key: 'Branch Code', value: bd.branchCode || '051001' },
            { id: 'account_type', key: 'Account Type', value: bd.accountType || 'Business Cheque' },
            { id: 'swift_code', key: 'SWIFT / BIC Code', value: bd.swiftCode || 'SBZAJJ' },
            { id: 'reference_note', key: 'Reference Instructions', value: bd.referenceNote || 'Use Order ID or Bidder Number as deposit reference' }
          ];
        }
        if (!data.bidderKycIdTypes || data.bidderKycIdTypes.length === 0) {
          data.bidderKycIdTypes = ['National ID', 'Passport', 'Driver License'];
        }
        if (!data.bidderKycFields || data.bidderKycFields.length === 0) {
          data.bidderKycFields = [
            { id: 'fullName', key: 'fullName', label: 'Full Legal Name', type: 'text', placeholder: 'As printed on your official identification document', required: true, helpText: 'Official legal identity', enabled: true },
            { id: 'dateOfBirth', key: 'dateOfBirth', label: 'Date of Birth', type: 'date', placeholder: '', required: true, helpText: 'Must be 18+ for legal liquor & auction qualification', enabled: true },
            { id: 'idType', key: 'idType', label: 'Identification Document Type', type: 'select', options: ['National ID', 'Passport', 'Driver License'], placeholder: '', required: true, helpText: 'Select your ID type', enabled: true },
            { id: 'idNumber', key: 'idNumber', label: 'ID / Passport / Document Number', type: 'text', placeholder: 'e.g. 9204155029087 or A12345678', required: true, helpText: 'Official unique document number', enabled: true },
            { id: 'idDocumentUrl', key: 'idDocumentUrl', label: 'Passport or ID Document Upload', type: 'file', placeholder: '', required: true, helpText: 'Upload a clear photo or PDF scan of your passport or ID document (Max 10MB)', enabled: true },
            { id: 'proofOfResidenceUrl', key: 'proofOfResidenceUrl', label: 'Proof of Residence Document (Optional)', type: 'file', placeholder: '', required: false, helpText: 'Utility bill or bank statement less than 3 months old', enabled: true }
          ];
        }
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleTypeChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleBankKeyChange = (id, field, val) => {
    setSettings(prev => {
      const list = [...(prev.bankDetailsList || [])];
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], [field]: val };
      }
      return { ...prev, bankDetailsList: list };
    });
  };

  const handleAddBankKey = () => {
    setSettings(prev => {
      const list = [...(prev.bankDetailsList || [])];
      list.push({
        id: `custom_key_${Date.now()}`,
        key: '',
        value: ''
      });
      return { ...prev, bankDetailsList: list };
    });
  };

  const handleDeleteBankKey = (id) => {
    setSettings(prev => {
      const list = (prev.bankDetailsList || []).filter(item => item.id !== id);
      return { ...prev, bankDetailsList: list };
    });
  };

  const handleResetBankKeys = () => {
    const defaultList = [
      { id: 'bank_name', key: 'Bank Name', value: 'Standard Bank' },
      { id: 'account_name', key: 'Account Holder', value: 'The Grand Store PTY LTD' },
      { id: 'account_number', key: 'Account Number', value: '0123456789' },
      { id: 'branch_code', key: 'Branch Code', value: '051001' },
      { id: 'account_type', key: 'Account Type', value: 'Business Cheque' },
      { id: 'swift_code', key: 'SWIFT / BIC Code', value: 'SBZAJJ' },
      { id: 'reference_note', key: 'Reference Instructions', value: 'Use Order ID or Bidder Number as deposit reference' }
    ];
    setSettings(prev => ({ ...prev, bankDetailsList: defaultList }));
  };

  const handleKycFieldChange = (id, field, val) => {
    setSettings(prev => {
      const list = [...(prev.bidderKycFields || [])];
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], [field]: val };
      }
      return { ...prev, bidderKycFields: list };
    });
  };

  const handleAddKycField = () => {
    setSettings(prev => {
      const list = [...(prev.bidderKycFields || [])];
      list.push({
        id: `kyc_f_${Date.now()}`,
        key: `custom_${Date.now().toString().slice(-4)}`,
        label: 'New Qualification Field',
        type: 'text',
        options: [],
        placeholder: '',
        required: true,
        helpText: '',
        enabled: true
      });
      return { ...prev, bidderKycFields: list };
    });
  };

  const handleDeleteKycField = (id) => {
    setSettings(prev => {
      const list = (prev.bidderKycFields || []).filter(item => item.id !== id);
      return { ...prev, bidderKycFields: list };
    });
  };

  const handleResetKycFields = () => {
    const defaultList = [
      { id: 'fullName', key: 'fullName', label: 'Full Legal Name', type: 'text', placeholder: 'As printed on your official identification document', required: true, helpText: 'Official legal identity', enabled: true },
      { id: 'dateOfBirth', key: 'dateOfBirth', label: 'Date of Birth', type: 'date', placeholder: '', required: true, helpText: 'Must be 18+ for legal liquor & auction qualification', enabled: true },
      { id: 'idType', key: 'idType', label: 'Identification Document Type', type: 'select', options: settings?.bidderKycIdTypes || ['National ID', 'Passport', 'Driver License'], placeholder: '', required: true, helpText: 'Select your ID type', enabled: true },
      { id: 'idNumber', key: 'idNumber', label: 'ID / Passport / Document Number', type: 'text', placeholder: 'e.g. 9204155029087 or A12345678', required: true, helpText: 'Official unique document number', enabled: true },
      { id: 'idDocumentUrl', key: 'idDocumentUrl', label: 'Passport or ID Document Upload', type: 'file', placeholder: '', required: true, helpText: 'Upload a clear photo or PDF scan of your passport or ID document (Max 10MB)', enabled: true },
      { id: 'proofOfResidenceUrl', key: 'proofOfResidenceUrl', label: 'Proof of Residence Document (Optional)', type: 'file', placeholder: '', required: false, helpText: 'Utility bill or bank statement less than 3 months old', enabled: true }
    ];
    setSettings(prev => ({ ...prev, bidderKycFields: defaultList }));
  };

  const handleAddIdType = () => {
    const promptVal = window.prompt('Enter new document type name (e.g. Foreign Passport, Asylum Document):');
    if (!promptVal || !promptVal.trim()) return;
    setSettings(prev => {
      const types = [...(prev.bidderKycIdTypes || [])];
      if (!types.includes(promptVal.trim())) {
        types.push(promptVal.trim());
      }
      return { ...prev, bidderKycIdTypes: types };
    });
  };

  const handleDeleteIdType = (val) => {
    setSettings(prev => {
      const types = (prev.bidderKycIdTypes || []).filter(t => t !== val);
      return { ...prev, bidderKycIdTypes: types };
    });
  };

  const handleIdTypeChange = (index, val) => {
    setSettings(prev => {
      const types = [...(prev.bidderKycIdTypes || [])];
      types[index] = val;
      return { ...prev, bidderKycIdTypes: types };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/settings`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save settings. Make sure you are logged in as admin.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestBirthdayEmail = async () => {
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/auth/test-birthday-email');
      setTestEmailResult({ type: 'success', text: res.data.message || 'Test birthday email sent successfully!' });
      setTimeout(() => setTestEmailResult(null), 5000);
    } catch (err) {
      setTestEmailResult({ type: 'error', text: err.response?.data?.message || 'Failed to send test email. Check SMTP settings.' });
      setTimeout(() => setTestEmailResult(null), 7000);
    } finally {
      setTestEmailSending(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-gold-gradient animate-pulse">Loading settings...</div>;
  }

  const FeeCard = ({ icon: Icon, title, description, children }) => (
    <div className="p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-lg border border-[var(--color-gold)]/20">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-[var(--color-ivory)] font-serif text-lg">{title}</h3>
          <p className="text-xs text-[var(--color-ivory-muted)]">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const FeeRow = ({ label, field, note, isAmount = false }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">{label}</label>
        {note && <p className="text-[10px] text-white/30 italic">{note}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={isAmount ? "100" : "0.1"}
          min="0"
          max={isAmount ? undefined : "100"}
          value={settings[field] !== undefined ? settings[field] : ""}
          onChange={e => handleChange(field, e.target.value)}
          className="w-28 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
        <span className="text-[var(--color-ivory-muted)] text-sm w-4">{isAmount || field.endsWith("Fee") ? "R" : "%"}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-12">
      <section>
        <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-3">
          Platform <span className={goldText} >Rates & Fees</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-sm">
          Set the global rates for taxes, shipping, commissions, and refundable bidding deposits.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SETTINGS FORM */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-serif text-xl mb-6 border-b border-white/10 pb-4">Standard Shop Fees</h2>
            <div className="space-y-6">
              <FeeRow label="VAT Rate" field="vatPct" note="Value Added Tax (Deducted from vendor)" />
              <FeeRow label="Marketplace Commission" field="marketplaceCommissionPct" note="The Grand Store's cut on shop product sales" />
              <FeeRow label="Standard Shipping Fee (ZAR)" field="shippingFee" isAmount={true} note="Fallback flat-rate delivery fee charged to customer" />
            </div>
          </div>

          {/* POSTNET COURIER RATES */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="text-white font-serif text-xl flex items-center gap-2">
                <Truck className="text-[var(--color-gold)]" size={20} /> PostNet Delivery & Collection Rates
              </h2>
              <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-mono bg-[#c9a35b]/10 px-2.5 py-1 rounded-full border border-[#c9a35b]/20">
                Courier Rates
              </span>
            </div>
            <div className="space-y-6">
              <FeeRow label="PostNet Standard Home Delivery (ZAR)" field="postnetStandardFee" isAmount={true} note="Door-to-door courier delivery (2–5 business days, default R120)" />
              <FeeRow label="PostNet Express Home Delivery (ZAR)" field="postnetExpressFee" isAmount={true} note="Priority overnight delivery (1–2 business days, default R180)" />
              <FeeRow label="PostNet Store Collection Point (ZAR)" field="postnetPickupFee" isAmount={true} note="PostNet-to-PostNet branch collection (2–3 business days, default R100)" />
            </div>
          </div>

          {/* SUPER COINS LOYALTY ECONOMY & MARGIN ENGINE */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h2 className="text-white font-serif text-xl flex items-center gap-2">
                  <Coins className="text-[var(--color-gold)]" size={22} /> Super Coins Economy & Margin Engine
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Manage Super Coin monetary value, earning ratios, maximum redemption caps, and the 15% platform margin safety threshold.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, superCoinsEnabled: prev.superCoinsEnabled === false ? true : false }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.superCoinsEnabled !== false ? 'bg-[#c9a35b]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                    settings.superCoinsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-6">
              {/* Coin Value */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Super Coin Value (ZAR per Coin)
                  </label>
                  <p className="text-[10px] text-white/40">
                    Monetary conversion rate for discounts (e.g. 0.10 means 1 Super Coin = R0.10; 100 coins = R10.00 discount)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] text-xs font-mono font-bold">1 COIN =</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settings.superCoinValue !== undefined ? settings.superCoinValue : 0.10}
                    onChange={e => handleChange('superCoinValue', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-white/60 text-xs font-mono">ZAR</span>
                </div>
              </div>

              {/* Earn Rate */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Coins Earned Per R100 Spent
                  </label>
                  <p className="text-[10px] text-white/40">
                    Earn rate awarded strictly on eligible product subtotal (excludes taxes, delivery fees, and redeemed coin discounts)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={settings.superCoinsEarnRatePer100 !== undefined ? settings.superCoinsEarnRatePer100 : 10}
                    onChange={e => handleChange('superCoinsEarnRatePer100', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-white/60 text-xs font-mono">Coins</span>
                </div>
              </div>

              {/* Max Redemption % Cap */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Max Order Redemption Cap (%)
                  </label>
                  <p className="text-[10px] text-white/40">
                    Maximum percentage of eligible product subtotal that can be offset using Super Coins per checkout (default 10%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={settings.superCoinsMaxRedemptionPct !== undefined ? settings.superCoinsMaxRedemptionPct : 10}
                    onChange={e => handleChange('superCoinsMaxRedemptionPct', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-white/60 text-xs font-mono">%</span>
                </div>
              </div>

              {/* Platform Margin Protection Threshold */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5 bg-[var(--color-gold)]/5 p-3 rounded-lg border border-[var(--color-gold)]/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-gold)] mb-0.5 font-bold">
                      Platform Minimum Margin Protection Threshold (%)
                    </label>
                    <span className="text-[9px] uppercase font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Margin Shield
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">
                    Automated mathematical margin safety engine. Clamps coin redemption dynamically so Grand Store's net contribution rate never falls below this percentage after gateway and vendor costs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.superCoinsMinPlatformMarginPct !== undefined ? settings.superCoinsMinPlatformMarginPct : 15}
                    onChange={e => handleChange('superCoinsMinPlatformMarginPct', e.target.value)}
                    className="w-24 bg-black/80 border border-[var(--color-gold)]/40 rounded-lg px-3 py-2 text-sm text-[var(--color-gold)] font-mono font-bold text-right focus:outline-none focus:border-[var(--color-gold)] transition-colors [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-[var(--color-gold)] text-xs font-mono font-bold">%</span>
                </div>
              </div>

              {/* Expiry Duration */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Coin Validity / Expiry (Months)
                  </label>
                  <p className="text-[10px] text-white/40">
                    Timeframe before earned Super Coins expire from customer balance (default 12 months from issuance)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="60"
                    value={settings.superCoinsExpiryMonths !== undefined ? settings.superCoinsExpiryMonths : 12}
                    onChange={e => handleChange('superCoinsExpiryMonths', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-white/60 text-xs font-mono">Months</span>
                </div>
              </div>

              {/* Action Rewards Grid */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="text-xs uppercase tracking-widest text-[var(--color-gold)] font-bold flex items-center gap-2">
                  <Sparkles size={14} /> Action-Based Super Coin Rewards
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">Welcome Registration</div>
                      <div className="text-[10px] text-white/40">On creating account</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsRegistrationReward !== undefined ? settings.superCoinsRegistrationReward : 100}
                        onChange={e => handleChange('superCoinsRegistrationReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">Profile Completion</div>
                      <div className="text-[10px] text-white/40">Adding phone & details</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsProfileReward !== undefined ? settings.superCoinsProfileReward : 100}
                        onChange={e => handleChange('superCoinsProfileReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">First Purchase Bonus</div>
                      <div className="text-[10px] text-white/40">After first delivered order</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsFirstPurchaseReward !== undefined ? settings.superCoinsFirstPurchaseReward : 500}
                        onChange={e => handleChange('superCoinsFirstPurchaseReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">Product Review</div>
                      <div className="text-[10px] text-white/40">Verified customer feedback</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsReviewReward !== undefined ? settings.superCoinsReviewReward : 50}
                        onChange={e => handleChange('superCoinsReviewReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">Referral Completed</div>
                      <div className="text-[10px] text-white/40">Invited friend orders</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsReferralReward !== undefined ? settings.superCoinsReferralReward : 500}
                        onChange={e => handleChange('superCoinsReferralReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-white">Birthday Celebration</div>
                      <div className="text-[10px] text-white/40">Annual gift on birthday</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={settings.superCoinsBirthdayReward !== undefined ? settings.superCoinsBirthdayReward : 200}
                        onChange={e => handleChange('superCoinsBirthdayReward', e.target.value)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-right"
                      />
                      <span className="text-[10px] text-[var(--color-gold)]">🪙</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-serif text-xl mb-6 border-b border-white/10 pb-4">Auction Fees & Bidding Deposits</h2>
            <div className="space-y-6">
              <FeeRow label="Auction Commission" field="auctionCommissionPct" note="Deducted from the vendor's winning bid payout" />
              <FeeRow label="Buyer Premium" field="buyerPremiumPct" note="Extra charge paid by the winning buyer" />
              <FeeRow label="BAR Charge" field="barChargePct" note="Buyer Admin Reserve paid by buyer" />
              <div className="pt-2 border-t border-white/5 space-y-6">
                <FeeRow 
                  label="Refundable Premium Deposit" 
                  field="auctionPremiumDepositAmount" 
                  isAmount={true} 
                  note="Security guarantee paid by 18+ buyers to unlock Premium VIP bidding limits (100% refundable to bank)" 
                />
                <FeeRow 
                  label="Standard Bidding Limit" 
                  field="auctionStandardBiddingLimit" 
                  isAmount={true} 
                  note="Default bidding ceiling for verified 18+ bidders without a deposit" 
                />
                <FeeRow 
                  label="Premium VIP Bidding Limit" 
                  field="auctionPremiumBiddingLimit" 
                  isAmount={true} 
                  note="High-value bidding ceiling unlocked upon deposit verification" 
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-serif text-xl mb-6 border-b border-white/10 pb-4">Other Fees</h2>
            <div className="space-y-6">
              <FeeRow label="Event Ticket Commission" field="eventCommissionPct" note="Deducted from event organizer payouts" />
              <FeeRow label="Payment Gateway Fee" field="gatewayFeePct" note="Internal cost tracking (not shown to customers)" />
            </div>
          </div>

          {/* "WHO PAYS?" FUNDING SOURCE ENGINE */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h2 className="text-white font-serif text-xl flex items-center gap-2">
                  <Scale className="text-[var(--color-gold)]" size={22} /> "Who Pays?" Funding Source Engine
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Configure the financial absorption source for every transaction fee, promotion, and reward.
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-mono bg-[#c9a35b]/10 px-2.5 py-1 rounded-full border border-[#c9a35b]/20">
                Cost Attribution
              </span>
            </div>

            <div className="space-y-6">
              {/* Gateway Fee */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Payment Gateway Fee ({settings.gatewayFeePct || 2.5}%)
                  </label>
                  <span className="text-[10px] text-white/40">Default: Grand Store</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'grand_store', label: 'Grand Store' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'split', label: '50:50 Split' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysGatewayFee', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysGatewayFee || 'grand_store') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promotions & Coupons */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Promotional / Coupon Discounts
                  </label>
                  <span className="text-[10px] text-white/40">Default: Grand Store</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'grand_store', label: 'Grand Store' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'split', label: '50:50 Split' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysPromotion', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysPromotion || 'grand_store') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refer & Earn */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Refer & Earn Rewards
                  </label>
                  <span className="text-[10px] text-white/40">Default: Grand Store</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'grand_store', label: 'Grand Store' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'split', label: '50:50 Split' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysReferral', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysReferral || 'grand_store') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Super Coins */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Super Coins Redemptions
                  </label>
                  <span className="text-[10px] text-white/40">Default: Grand Store</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'grand_store', label: 'Grand Store' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'split', label: '50:50 Split' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysSuperCoins', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysSuperCoins || 'grand_store') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Courier Shipping */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Courier Delivery
                  </label>
                  <span className="text-[10px] text-white/40">Default: Customer</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'customer', label: 'Customer' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'grand_store', label: 'Grand Store' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysCourier', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysCourier || 'customer') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transit Insurance */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                    Transit Insurance
                  </label>
                  <span className="text-[10px] text-white/40">Default: Customer</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'customer', label: 'Customer' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'grand_store', label: 'Grand Store' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTypeChange('whoPaysInsurance', opt.id)}
                      className={`py-2 px-3 text-xs rounded-lg font-semibold border transition-all ${
                        (settings.whoPaysInsurance || 'customer') === opt.id
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-sm'
                          : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="text-white font-serif text-xl flex items-center gap-2">
                <span>Vendor Maintenance & Platform Fees</span>
              </h2>
              <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-mono bg-[#c9a35b]/10 px-2.5 py-1 rounded-full border border-[#c9a35b]/20">
                Monthly Billing
              </span>
            </div>
            <div className="space-y-6">
              <FeeRow 
                label="Monthly Maintenance Fee" 
                field="vendorMonthlyMaintenanceFee" 
                isAmount={true} 
                note="Recurring fee charged to active vendors every 30 days after registration fee" 
              />
              <FeeRow 
                label="Grace Period (Days)" 
                field="vendorMaintenanceGraceDays" 
                isAmount={true} 
                note="Number of days before an unpaid maintenance fee is flagged overdue" 
              />
            </div>
          </div>

          {/* REFER & EARN PROGRAM CONFIGURATION */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h2 className="text-white font-serif text-xl flex items-center gap-2">
                  <Users className="text-[var(--color-gold)]" size={20} /> Refer & Earn Program
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Rewards the person who shares the link with cash credit once their friend completes their first purchase.
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-mono bg-[#c9a35b]/10 px-2.5 py-1 rounded-full border border-[#c9a35b]/20">
                1st Order Trigger
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Field 1: Referrer Reward Credit Amount */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Referrer Reward Credit
                  </label>
                  <p className="text-[10px] text-white/40">
                    Amount credited to the referrer's wallet after their friend makes their first paid purchase
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={settings.referralRewardAmount !== undefined ? settings.referralRewardAmount : 50}
                    onChange={e => handleChange('referralRewardAmount', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('referralRewardType', 'fixed')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.referralRewardType !== 'percentage' ? 'bg-[var(--color-gold)] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      ZAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('referralRewardType', 'percentage')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.referralRewardType === 'percentage' ? 'bg-[var(--color-gold)] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>

              {/* Field 2: Max Rewarded People Per Referrer (Cap) */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                      Max Rewarded Friends Per Referrer
                    </label>
                    <span className="text-[10px] uppercase font-mono text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2 py-0.5 rounded border border-[var(--color-gold)]/20">
                      Reward Cap
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40">
                    How many people a referrer can earn R{settings.referralRewardAmount || 50} from (e.g. 5 people = max R{(settings.referralRewardAmount || 50) * (settings.referralMaxRewardedUsers || 5)} rewards). Enter <strong className="text-white">0</strong> for unlimited friends.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="5"
                    value={settings.referralMaxRewardedUsers !== undefined ? settings.referralMaxRewardedUsers : 5}
                    onChange={e => handleChange('referralMaxRewardedUsers', e.target.value)}
                    className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span className="text-xs text-white/40 font-mono w-14">
                    {(settings.referralMaxRewardedUsers === 0 || settings.referralMaxRewardedUsers === '0') ? 'Unlimited' : 'People'}
                  </span>
                </div>
              </div>

              {/* Field 3: Optional Welcome Discount for the Friend */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                      Give Welcome Discount To Friend
                    </label>
                    <p className="text-[10px] text-white/30 italic">
                      Default is disabled (refer & earn rewards the referrer only). Enable if you also want the friend to receive a discount on their 1st purchase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, referralWelcomeDiscountEnabled: !prev.referralWelcomeDiscountEnabled }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.referralWelcomeDiscountEnabled ? 'bg-[#c9a35b]' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                        settings.referralWelcomeDiscountEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings.referralWelcomeDiscountEnabled && (
                  <div className="flex items-center justify-between gap-4 pl-4 border-l-2 border-[var(--color-gold)]/40">
                    <div className="flex-1">
                      <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                        Friend's Welcome Discount Amount
                      </label>
                      <p className="text-[10px] text-white/30">Deducted from friend's first order total</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.referralWelcomeDiscount || 0}
                        onChange={e => handleChange('referralWelcomeDiscount', e.target.value)}
                        className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-right focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleTypeChange('referralWelcomeDiscountType', 'fixed')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.referralWelcomeDiscountType !== 'percentage' ? 'bg-[var(--color-gold)] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                          ZAR
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTypeChange('referralWelcomeDiscountType', 'percentage')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.referralWelcomeDiscountType === 'percentage' ? 'bg-[var(--color-gold)] text-black' : 'text-white/40 hover:text-white'}`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CUSTOMER BIRTHDAY AUTOMATION & PROMOTIONS */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="text-white font-serif text-xl flex items-center gap-2">
                <Gift className="text-[var(--color-gold)]" size={22} /> Customer Birthday Automation
              </h2>
              <span className="text-xs uppercase tracking-widest text-[var(--color-gold)] font-mono bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full border border-[var(--color-gold)]/20">
                Daily 8:00 AM SMTP
              </span>
            </div>

            <div className="space-y-6">
              {/* Toggle 1: Birthday Greeting Email */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Automated Birthday Greeting Emails
                  </label>
                  <p className="text-[10px] text-white/30 italic">
                    Automatically dispatch a prestigious birthday email to customers on their birthday
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('birthdayEmailEnabled', settings.birthdayEmailEnabled === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.birthdayEmailEnabled !== false ? 'bg-[#c9a35b]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                      settings.birthdayEmailEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Promotional Discount / Voucher */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Include Promotional Discount / Voucher
                  </label>
                  <p className="text-[10px] text-white/30 italic">
                    When enabled, email includes an exclusive discount code. If disabled, sends greeting only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('birthdayDiscountEnabled', settings.birthdayDiscountEnabled === false ? true : false)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.birthdayDiscountEnabled !== false ? 'bg-[#c9a35b]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                      settings.birthdayDiscountEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.birthdayDiscountEnabled !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                      Discount Percentage (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.birthdayDiscountPercent || 15}
                        onChange={e => handleChange('birthdayDiscountPercent', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
                      />
                      <span className="ml-2 text-xs text-white/40 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                      Birthday Promo Code
                    </label>
                    <input
                      type="text"
                      value={settings.birthdayPromoCode || 'BDAY-LUXURY15'}
                      onChange={e => handleChange('birthdayPromoCode', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Custom Birthday Celebration Wish
                </label>
                <textarea
                  rows="2"
                  value={settings.birthdayCustomMessage || ''}
                  onChange={e => handleChange('birthdayCustomMessage', e.target.value)}
                  placeholder="To commemorate another distinguished year, we invite you to indulge in South Africa’s finest reserve vintages..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors placeholder:text-white/20 resize-none"
                />
              </div>

              {/* Test Email Dispatcher */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-white/50">
                  Preview email formatting with your current SMTP settings.
                </p>
                <button
                  type="button"
                  onClick={handleSendTestBirthdayEmail}
                  disabled={testEmailSending}
                  className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {testEmailSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Send Test Birthday Email
                </button>
              </div>

              {testEmailResult && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testEmailResult.type === 'error' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}>
                  {testEmailResult.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                  <span>{testEmailResult.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* 18+ BIDDER LEGAL QUALIFICATION & KYC REQUIREMENTS */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-5 gap-3">
              <div>
                <h2 className="text-white font-serif text-xl flex items-center gap-2">
                  <UserCheck className="text-[var(--color-gold)]" size={22} /> 18+ Bidder Legal Qualification & KYC Requirements
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Configure the mandatory identity & qualification fields (Passport, ID, DOB, Name, Document Uploads) required for patrons to bid.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetKycFields}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset to standard 18+ KYC template"
                >
                  <RotateCcw size={13} /> Reset Template
                </button>
                <button
                  type="button"
                  onClick={handleAddKycField}
                  className="px-3 py-1.5 bg-[var(--color-gold)]/15 hover:bg-[var(--color-gold)]/25 border border-[var(--color-gold)]/40 text-[var(--color-gold)] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Core Age & Upload Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Minimum Qualification Age
                  </label>
                  <p className="text-[10px] text-white/40 mb-2">
                    Legal minimum age calculated from patron's date of birth (Strict CPA compliance)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={settings.bidderKycMinAge || 18}
                      onChange={(e) => setSettings(prev => ({ ...prev, bidderKycMinAge: parseInt(e.target.value, 10) || 18 }))}
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono text-center focus:border-[var(--color-gold)] outline-none"
                    />
                    <span className="text-xs text-[var(--color-gold)] font-bold">Years (18+)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">
                    Mandatory Document Upload
                  </label>
                  <p className="text-[10px] text-white/40 mb-2">
                    Enforce high-resolution photo or PDF upload of official ID or Passport
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, bidderKycRequireDocumentUpload: !prev.bidderKycRequireDocumentUpload }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.bidderKycRequireDocumentUpload !== false ? 'bg-[#c9a35b]' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          settings.bidderKycRequireDocumentUpload !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-white/70">
                      {settings.bidderKycRequireDocumentUpload !== false ? 'Strict Upload Required' : 'Upload Optional'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Types Selector Editor */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold">
                      Allowed Identification Document Types
                    </label>
                    <p className="text-[10px] text-white/40">
                      Options available in the document type dropdown/selector (e.g. Passport, National ID, Driver License)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIdType}
                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--color-gold)] rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Document Type
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(settings.bidderKycIdTypes || []).map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-black/70 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => handleIdTypeChange(idx, e.target.value)}
                        className="bg-transparent text-white font-medium outline-none text-xs w-28 sm:w-36"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteIdType(t)}
                        className="text-white/30 hover:text-rose-400 p-0.5 cursor-pointer"
                        title="Remove option"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurable Qualification Fields List */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-[var(--color-gold)] font-bold">
                  Configured Qualification Fields (Keys, Labels & Requirements)
                </label>

                {(settings.bidderKycFields || []).map((field, index) => (
                  <div 
                    key={field.id || index}
                    className="p-4 bg-black/50 border border-white/10 hover:border-[var(--color-gold)]/30 rounded-xl space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={field.label || ''}
                          placeholder="Field Label (e.g. Full Legal Name)"
                          onChange={(e) => handleKycFieldChange(field.id, 'label', e.target.value)}
                          className="bg-transparent text-white text-sm font-semibold outline-none focus:border-b border-[var(--color-gold)] px-1 py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(e) => handleKycFieldChange(field.id, 'required', e.target.checked)}
                            className="rounded accent-[var(--color-gold)]"
                          />
                          <span className={field.required ? 'text-[var(--color-gold)] font-semibold' : ''}>Required</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteKycField(field.id)}
                          className="text-rose-400/60 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                          title="Delete Field"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">Key Identifier</label>
                        <input
                          type="text"
                          value={field.key || ''}
                          placeholder="fieldKey"
                          onChange={(e) => handleKycFieldChange(field.id, 'key', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-[var(--color-gold)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">Field Type</label>
                        <select
                          value={field.type || 'text'}
                          onChange={(e) => handleKycFieldChange(field.id, 'type', e.target.value)}
                          className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="text">Text Input</option>
                          <option value="date">Date Picker (e.g. DOB)</option>
                          <option value="select">Dropdown / Option Selection</option>
                          <option value="file">Document Upload (Photo/PDF)</option>
                          <option value="number">Number</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">Placeholder / Instructions</label>
                        <input
                          type="text"
                          value={field.placeholder || field.helpText || ''}
                          placeholder="Placeholder / instructions for customer"
                          onChange={(e) => handleKycFieldChange(field.id, 'placeholder', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddKycField}
                  className="w-full py-2.5 border border-dashed border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <Plus size={15} /> Add Another Qualification Requirement Field
                </button>
              </div>

              {/* Customer Live Preview */}
              <div className="p-4 rounded-xl bg-black/70 border border-[var(--color-gold)]/30 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-gold)] font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Customer Modal Preview (18+ Qualification Form)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Real-Time Sync</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80 pt-2 border-t border-white/10">
                  {(settings.bidderKycFields || []).filter(f => f.enabled !== false).map((f, idx) => (
                    <div key={f.id || idx} className="bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white/60 font-semibold">{f.label || f.key}:</span>
                        {f.required && <span className="text-[10px] text-[var(--color-gold)] font-bold">*Required</span>}
                      </div>
                      <span className="text-[11px] font-mono text-white/40 block">
                        [{f.type?.toUpperCase()}] {f.placeholder || f.helpText || 'Customer input'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-5 gap-3">
              <div>
                <h2 className="text-white font-serif text-xl flex items-center gap-2">
                  <Landmark className="text-[var(--color-gold)]" size={20} /> Official EFT & Bank Details (Editable Keys)
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Add, rename, update, or delete any banking key and its value. These keys appear live on Customer Banking (/customer/banking) and Checkout.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetBankKeys}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset to standard EFT bank keys template"
                >
                  <RotateCcw size={13} /> Reset Template
                </button>
                <button
                  type="button"
                  onClick={handleAddBankKey}
                  className="px-3 py-1.5 bg-[var(--color-gold)]/15 hover:bg-[var(--color-gold)]/25 border border-[var(--color-gold)]/40 text-[var(--color-gold)] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Add Key
                </button>
              </div>
            </div>

            {/* Dynamic Keys List */}
            <div className="space-y-3">
              {(settings.bankDetailsList || []).map((item, index) => (
                <div 
                  key={item.id || index}
                  className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-black/40 border border-white/10 hover:border-[var(--color-gold)]/30 rounded-xl p-3 transition-all"
                >
                  <span className="text-[11px] font-mono text-white/30 w-6 text-center shrink-0 hidden sm:block">
                    #{index + 1}
                  </span>

                  {/* Editable Key Name */}
                  <div className="w-full sm:w-2/5">
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-[var(--color-gold)]/80 mb-1 sm:hidden">
                      Key Name / Label
                    </label>
                    <input
                      type="text"
                      placeholder="Key Name (e.g. Bank Name)"
                      value={item.key || ''}
                      onChange={(e) => handleBankKeyChange(item.id, 'key', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-gold)] placeholder:text-white/20 outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  <span className="hidden sm:inline text-white/30 font-mono text-sm">:</span>

                  {/* Editable Key Value */}
                  <div className="w-full sm:flex-1">
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-white/40 mb-1 sm:hidden">
                      Value
                    </label>
                    <input
                      type="text"
                      placeholder="Value (e.g. Standard Bank)"
                      value={item.value || ''}
                      onChange={(e) => handleBankKeyChange(item.id, 'value', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBankKey(item.id)}
                    className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer self-end sm:self-center"
                    title={`Delete "${item.key || 'key'}"`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {(!settings.bankDetailsList || settings.bankDetailsList.length === 0) && (
                <div className="text-center py-8 border border-dashed border-white/15 rounded-xl text-white/40 text-xs">
                  No bank detail keys configured. Click <strong className="text-[var(--color-gold)] cursor-pointer" onClick={handleAddBankKey}>+ Add Key</strong> or <strong className="text-[var(--color-gold)] cursor-pointer" onClick={handleResetBankKeys}>Reset Template</strong> to add keys.
                </div>
              )}

              {/* Add Key Button at bottom of list */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddBankKey}
                  className="w-full py-2.5 border border-dashed border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={15} /> Add Another Bank Detail Key
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="mt-5 p-4 rounded-xl bg-black/70 border border-[var(--color-gold)]/30 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-gold)] font-medium">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Live Customer-Facing Preview ({settings.bankDetailsList?.length || 0} Keys Active)</span>
                  <span className="text-[10px] text-white/40 font-mono">Real-Time Sync</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80 pt-2 border-t border-white/10 font-sans">
                  {(settings.bankDetailsList || []).filter(item => item.key).map((item, idx) => (
                    <div key={item.id || idx} className="bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                      <span className="text-white/40 block text-[10px] uppercase font-mono tracking-wider">{item.key}:</span>
                      <strong className="text-white font-medium break-all font-mono text-xs">{item.value || '—'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#b58b38] hover:bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
          {saved && <p className="text-green-400 text-center text-sm font-medium">Settings saved successfully!</p>}
        </div>

        {/* LIVE CALCULATORS */}
        <div className="space-y-6">
          {/* Shop Calculator */}
          <div className="bg-black/60 border border-[var(--color-gold)]/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
            <h3 className="text-[var(--color-gold)] font-serif text-xl mb-6 flex items-center gap-2">
              <ShoppingBag size={20} /> Shop Purchase Example
            </h3>
            {(() => {
              const subtotal = 1000;
              const shipping = settings.shippingFee || 0;
              const vat = parseFloat(((subtotal * settings.vatPct) / 100).toFixed(2));
              const commission = parseFloat(((subtotal * settings.marketplaceCommissionPct) / 100).toFixed(2));
              const customerPays = subtotal + shipping;
              const vendorGets = subtotal - vat - commission + shipping;
              
              return (
                <div className="space-y-4 text-sm font-mono relative z-10">
                  <div className="flex justify-between text-gray-400">
                    <span>Product Subtotal:</span><span className="text-white"><Price amount={subtotal.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Fee:</span><span className="text-white">+ <Price amount={shipping.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/10 pt-3">
                    <span>CUSTOMER PAYS:</span><span><Price amount={customerPays.toFixed(2)} /></span>
                  </div>
                  
                  <div className="border-t border-white/10 my-4"></div>
                  
                  <div className="flex justify-between text-gray-400">
                    <span>Gross Product Sales:</span><span className="text-white"><Price amount={subtotal.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>VAT Deducted ({settings.vatPct}%):</span><span className="text-yellow-500/80">- <Price amount={vat.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Marketplace Commission ({settings.marketplaceCommissionPct}%):</span><span className="text-red-400/80">- <Price amount={commission.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Reimbursed:</span><span className="text-white">+ <Price amount={shipping.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between font-bold text-green-400 border-t border-white/10 pt-3">
                    <span>VENDOR PAYOUT:</span><span><Price amount={vendorGets.toFixed(2)} /></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Auction Calculator */}
          <div className="bg-black/60 border border-[var(--color-gold)]/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
            <h3 className="text-[var(--color-gold)] font-serif text-xl mb-6 flex items-center gap-2">
              <Settings size={20} /> Auction Example
            </h3>
            {(() => {
              const wb = 10000;
              const bp = parseFloat(((wb * settings.buyerPremiumPct) / 100).toFixed(2));
              const bar = parseFloat(((wb * settings.barChargePct) / 100).toFixed(2));
              const vat = parseFloat(((wb * settings.vatPct) / 100).toFixed(2));
              const ship = settings.shippingFee || 0;
              const customerPays = parseFloat((wb + bp + bar + ship + vat).toFixed(2));
              const comm = parseFloat(((wb * settings.auctionCommissionPct) / 100).toFixed(2));
              const vendorGets = parseFloat((wb - comm - vat).toFixed(2));
              
              return (
                <div className="space-y-4 text-sm font-mono relative z-10">
                  <div className="flex justify-between text-gray-400">
                    <span>Winning Bid:</span><span className="text-white"><Price amount={wb.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Buyer Premium ({settings.buyerPremiumPct}%):</span><span className="text-white">+ <Price amount={bp.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>BAR Charge ({settings.barChargePct}%):</span><span className="text-white">+ <Price amount={bar.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping:</span><span className="text-white">+ <Price amount={ship.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>VAT ({settings.vatPct}%):</span><span className="text-white">+ <Price amount={vat.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/10 pt-3">
                    <span>BUYER PAYS:</span><span><Price amount={customerPays.toFixed(2)} /></span>
                  </div>
                  
                  <div className="border-t border-white/10 my-4"></div>
                  
                  <div className="flex justify-between text-gray-400">
                    <span>Winning Bid:</span><span className="text-white"><Price amount={wb.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Auction Commission ({settings.auctionCommissionPct}%):</span><span className="text-red-400/80">- <Price amount={comm.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>VAT Deducted ({settings.vatPct}%):</span><span className="text-yellow-500/80">- <Price amount={vat.toFixed(2)} /></span>
                  </div>
                  <div className="flex justify-between font-bold text-green-400 border-t border-white/10 pt-3">
                    <span>VENDOR PAYOUT:</span><span><Price amount={vendorGets.toFixed(2)} /></span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Refer & Earn Calculator */}
          <div className="bg-black/60 border border-[var(--color-gold)]/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
            <h3 className="text-[var(--color-gold)] font-serif text-xl mb-6 flex items-center gap-2">
              <Users size={20} /> Refer & Earn Example
            </h3>
            {(() => {
              const orderTotal = 1000;
              let welcomeDiscount = 0;
              if (settings.referralWelcomeDiscountEnabled) {
                if (settings.referralWelcomeDiscountType === 'percentage') {
                  welcomeDiscount = (orderTotal * (settings.referralWelcomeDiscount || 0)) / 100;
                } else {
                  welcomeDiscount = settings.referralWelcomeDiscount || 0;
                }
              }
              const friendPays = Math.max(0, orderTotal - welcomeDiscount);
              
              let referrerGets = 0;
              if (settings.referralRewardType === 'percentage') {
                referrerGets = (orderTotal * (settings.referralRewardAmount || 50)) / 100;
              } else {
                referrerGets = settings.referralRewardAmount !== undefined ? settings.referralRewardAmount : 50;
              }

              const maxUsers = settings.referralMaxRewardedUsers !== undefined ? Number(settings.referralMaxRewardedUsers) : 5;
              const maxPotentialEarnings = maxUsers > 0 ? (maxUsers * referrerGets) : null;
              
              return (
                <div className="space-y-4 text-sm font-mono relative z-10">
                  <div className="text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
                    Scenario 1: Friend's First Purchase
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Friend's Order Total:</span><span className="text-white"><Price amount={orderTotal.toFixed(2)} /></span>
                  </div>
                  {settings.referralWelcomeDiscountEnabled && welcomeDiscount > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Welcome Discount Applied:</span><span className="text-yellow-500/80">- <Price amount={welcomeDiscount.toFixed(2)} /></span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white border-t border-white/10 pt-3">
                    <span>FRIEND PAYS:</span><span><Price amount={friendPays.toFixed(2)} /></span>
                  </div>
                  
                  <div className="border-t border-white/10 my-4"></div>
                  
                  <div className="text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
                    Scenario 2: Referrer's Reward (Per Friend's 1st Order)
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Referrer's Wallet Balance Increases By:</span>
                    <span className="text-green-400 font-bold">+ <Price amount={referrerGets.toFixed(2)} /></span>
                  </div>

                  <div className="border-t border-white/10 my-4"></div>

                  <div className="text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
                    Scenario 3: Configured Cap & Earning Limit
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Rewarded Friends Allowed:</span>
                    <span className="text-white font-bold">{maxUsers === 0 ? 'Unlimited' : `${maxUsers} Friends`}</span>
                  </div>
                  {maxPotentialEarnings !== null && (
                    <div className="flex justify-between text-gray-400">
                      <span>Max Total Referrer Earnings:</span>
                      <span className="text-[var(--color-gold)] font-bold"><Price amount={maxPotentialEarnings.toFixed(2)} /></span>
                    </div>
                  )}
                  
                  <p className="text-xs text-white/40 mt-2 font-sans italic">
                    * The referrer can apply their accumulated <Price amount={referrerGets.toFixed(2)} /> rewards as a direct discount at checkout on their next order.
                  </p>
                </div>
              );
            })()}
          </div>
          
        </div>
      </div>
    </div>
  );
}
