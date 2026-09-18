import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { Gavel, CheckCircle, ArrowLeft, User, Phone, Mail, Building2, Package, FileText } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';

const API = import.meta.env.VITE_API_URL;

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2 font-medium">
      {label}{required && <span className="text-amber-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-stone-200 bg-white px-4 py-3 text-stone-800 placeholder-stone-300 text-sm focus:outline-none focus:border-[#7b263c] transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

export default function HostAuctionPage() {
  const { categories } = useCategories();
  const storeCategories = categories.map(c => c.name);
  const [step, setStep] = useState(1); // 1=applicant, 2=item, 3=done
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    applicantName:  '',
    applicantEmail: '',
    applicantPhone: '',
    companyName:    '',
    itemTitle:      '',
    itemCategory:   '',
    itemCondition:  '',
    estimatedValue: '',
    itemDescription:'',
    notes:          '',
    type:           'auction',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!form.applicantName.trim())  return 'Full name is required';
    if (!form.applicantEmail.trim()) return 'Email is required';
    if (!form.applicantPhone.trim()) return 'Phone number is required';
    return null;
  };

  const validateStep2 = () => {
    if (!form.itemTitle.trim())       return 'Item title is required';
    if (!form.itemDescription.trim()) return 'Item description is required';
    return null;
  };

  const nextStep = () => {
    const err = step === 1 ? validateStep1() : null;
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const submit = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/host-applications`, form);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <h1 className="font-serif text-4xl text-stone-900 mb-4">Application Received</h1>
        <p className="text-stone-500 text-lg leading-relaxed mb-8">
          Thank you, <strong>{form.applicantName}</strong>. We've received your auction hosting application
          and will review it within <strong>48 hours</strong>. We'll contact you at <strong>{form.applicantEmail}</strong>.
        </p>
        <div className="w-12 h-px bg-stone-200 mx-auto mb-8" />
        <Link to="/" className="inline-block bg-stone-900 text-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors">
          ← Return to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Header */}
      <div className="bg-stone-900 text-white px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-serif text-xl tracking-widest">The Grand Store</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft size={13} /> Back
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#7b263c] text-xs uppercase tracking-widest mb-4">
            <Gavel size={14} /> Auction Hosting Application
          </div>
          <h1 className="font-serif text-5xl text-stone-900 leading-tight mb-4">
            Host Your Lot<br />at Grand Store
          </h1>
          <p className="text-stone-500 text-lg max-w-xl">
            List a single premium wine, spirits, or collectible for auction on South Africa's finest
            wine marketplace. Complete the form below and our team will review your application.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12">
          {['Your Details', 'Your Item', 'Submit'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${
                i + 1 === step ? 'text-[#7b263c] font-semibold' :
                i + 1 < step  ? 'text-stone-400' : 'text-stone-300'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i + 1 < step  ? 'bg-green-100 text-green-600' :
                  i + 1 === step ? 'bg-[#7b263c] text-white' :
                  'bg-stone-200 text-stone-400'
                }`}>{i + 1 < step ? '✓' : i + 1}</span>
                {label}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-stone-200 mx-4" />}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 — Applicant details */}
        {step === 1 && (
          <div className="bg-white border border-stone-100 p-8 space-y-6">
            <h2 className="font-serif text-2xl text-stone-900 mb-2">Your Details</h2>
            <p className="text-stone-400 text-sm mb-6">Tell us who you are. This will be used to create your host account if approved.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Full Name" required>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} value={form.applicantName}
                    onChange={e => set('applicantName', e.target.value)} placeholder="Jane Smith" />
                </div>
              </Field>
              <Field label="Email Address" required>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} type="email" value={form.applicantEmail}
                    onChange={e => set('applicantEmail', e.target.value)} placeholder="jane@example.com" />
                </div>
              </Field>
              <Field label="Phone Number" required>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} value={form.applicantPhone}
                    onChange={e => set('applicantPhone', e.target.value)} placeholder="+27 82 000 0000" />
                </div>
              </Field>
              <Field label="Company / Estate Name">
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} value={form.companyName}
                    onChange={e => set('companyName', e.target.value)} placeholder="Optional" />
                </div>
              </Field>
            </div>
            <div className="pt-4 flex justify-end">
              <button onClick={nextStep}
                className="px-8 py-3 bg-stone-900 hover:bg-[#7b263c] text-white text-sm uppercase tracking-widest font-medium transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Item details */}
        {step === 2 && (
          <div className="bg-white border border-stone-100 p-8 space-y-6">
            <h2 className="font-serif text-2xl text-stone-900 mb-2">Your Item</h2>
            <p className="text-stone-400 text-sm mb-6">Describe the single item you want to list at auction. One item per application.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Field label="Item Title" required>
                  <div className="relative">
                    <Package size={14} className="absolute left-3 top-3.5 text-stone-300" />
                    <input className={`${inputCls} pl-9`} value={form.itemTitle}
                      onChange={e => set('itemTitle', e.target.value)} placeholder="e.g. 1982 Kanonkop Pinotage — 6-bottle case" />
                  </div>
                </Field>
              </div>
              <Field label="Category">
                <select className={selectCls} value={form.itemCategory} onChange={e => set('itemCategory', e.target.value)}>
                  <option value="">Select category</option>
                  {storeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Collectible">Collectible</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Condition">
                <select className={selectCls} value={form.itemCondition} onChange={e => set('itemCondition', e.target.value)}>
                  <option value="">Select condition</option>
                  <option>Mint / Sealed</option>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Estimated Value (R)">
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-stone-400 font-medium text-sm">R</span>
                    <input className={`${inputCls} pl-9`} type="number" value={form.estimatedValue}
                      onChange={e => set('estimatedValue', e.target.value)} placeholder="5000" />
                  </div>
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Item Description" required>
                  <textarea rows={4} className={inputCls} value={form.itemDescription}
                    onChange={e => set('itemDescription', e.target.value)}
                    placeholder="Describe your item — vintage, provenance, storage history, why it's special..." />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Additional Notes">
                  <textarea rows={3} className={inputCls} value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Any other information you'd like us to know..." />
                </Field>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button onClick={() => { setStep(1); setError(''); }}
                className="text-stone-400 hover:text-stone-700 text-sm uppercase tracking-widest transition-colors flex items-center gap-1.5">
                <ArrowLeft size={13} /> Back
              </button>
              <button onClick={submit} disabled={submitting}
                className="px-8 py-3 bg-[#7b263c] hover:bg-[#6a1f33] text-white text-sm uppercase tracking-widest font-medium transition-colors disabled:opacity-60 flex items-center gap-2">
                {submitting ? (
                  <><span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><FileText size={14} /> Submit Application</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Review Time', value: '48 hours' },
            { label: 'Commission', value: 'Competitive' },
            { label: 'Support', value: 'Dedicated host team' },
          ].map(item => (
            <div key={item.label} className="bg-white border border-stone-100 px-4 py-6">
              <p className="font-serif text-2xl text-stone-900 mb-1">{item.value}</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
