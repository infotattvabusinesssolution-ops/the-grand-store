import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { Calendar, CheckCircle, ArrowLeft, User, Phone, Mail, Building2, MapPin, Users, FileText, Clock } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';

const libraries = ['places'];
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

const PlacesAutocomplete = ({ value, onChange, inputCls }) => {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
    debounce: 300,
  });

  const handleInput = (e) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSelect = (val) => {
    setValue(val, false);
    clearSuggestions();
    onChange(val);
  };

  return (
    <div className="relative">
      <MapPin size={14} className="absolute left-3 top-3.5 text-stone-300" />
      <input
        className={`${inputCls} pl-9`}
        value={inputValue || value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="e.g. Spier Wine Farm, Stellenbosch"
      />
      {status === "OK" && (
        <ul className="absolute z-10 w-full bg-white border border-stone-200 shadow-xl mt-1 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm text-stone-700 border-b border-stone-100 last:border-0"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function HostEventPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    applicantName:    '',
    applicantEmail:   '',
    applicantPhone:   '',
    companyName:      '',
    eventName:        '',
    eventType:        '',
    eventDate:        '',
    eventVenue:       '',
    eventCapacity:    '',
    eventDescription: '',
    notes:            '',
    type:             'event',
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!form.applicantName.trim())  return 'Full name is required';
    if (!form.applicantEmail.trim()) return 'Email is required';
    if (!form.applicantPhone.trim()) return 'Phone number is required';
    return null;
  };

  const validateStep2 = () => {
    if (!form.eventName.trim())        return 'Event name is required';
    if (!form.eventDescription.trim()) return 'Event description is required';
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
          Thank you, <strong>{form.applicantName}</strong>. Your event hosting application is under review.
          We'll respond within <strong>48 hours</strong> to <strong>{form.applicantEmail}</strong>.
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
          <Link to="/" className="font-serif text-xl tracking-widest">The Grand Store</Link>
          <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft size={13} /> Back
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#7b263c] text-xs uppercase tracking-widest mb-4">
            <Calendar size={14} /> Event Hosting Application
          </div>
          <h1 className="font-serif text-5xl text-stone-900 leading-tight mb-4">
            Host Your Event<br />at Grand Store
          </h1>
          <p className="text-stone-500 text-lg max-w-xl">
            Wine tastings, masterclasses, farm dinners — if it celebrates the vine,
            we want to host it. Tell us about your event.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12">
          {['Your Details', 'Your Event', 'Submit'].map((label, i) => (
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

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white border border-stone-100 p-8 space-y-6">
            <h2 className="font-serif text-2xl text-stone-900 mb-2">Your Details</h2>
            <p className="text-stone-400 text-sm mb-6">Tell us about yourself or your organisation.</p>
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
              <Field label="Organisation / Estate">
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

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white border border-stone-100 p-8 space-y-6">
            <h2 className="font-serif text-2xl text-stone-900 mb-2">Your Event</h2>
            <p className="text-stone-400 text-sm mb-6">Tell us what kind of event you'd like to host.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Field label="Event Name" required>
                  <input className={inputCls} value={form.eventName}
                    onChange={e => set('eventName', e.target.value)} placeholder="e.g. Stellenbosch Summer Wine Masterclass" />
                </Field>
              </div>
              <Field label="Event Type">
                <select className={selectCls} value={form.eventType} onChange={e => set('eventType', e.target.value)}>
                  <option value="">Select type</option>
                  <option>Wine Tasting</option>
                  <option>Wine Masterclass</option>
                  <option>Farm Dinner</option>
                  <option>Harvest Experience</option>
                  <option>Cellar Tour</option>
                  <option>Spirits Tasting</option>
                  <option>Corporate Event</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Proposed Date">
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} type="date" value={form.eventDate}
                    onChange={e => set('eventDate', e.target.value)} />
                </div>
              </Field>
              <Field label="Venue / Location">
                {isLoaded ? (
                  <PlacesAutocomplete
                    value={form.eventVenue}
                    onChange={(val) => set('eventVenue', val)}
                    inputCls={inputCls}
                  />
                ) : (
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3.5 text-stone-300" />
                    <input className={`${inputCls} pl-9`} value={form.eventVenue}
                      onChange={e => set('eventVenue', e.target.value)} placeholder="Loading Google Maps..." disabled />
                  </div>
                )}
              </Field>
              <Field label="Expected Capacity">
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-3.5 text-stone-300" />
                  <input className={`${inputCls} pl-9`} type="number" value={form.eventCapacity}
                    onChange={e => set('eventCapacity', e.target.value)} placeholder="50" />
                </div>
              </Field>
              <div className="col-span-2">
                <Field label="Event Description" required>
                  <textarea rows={4} className={inputCls} value={form.eventDescription}
                    onChange={e => set('eventDescription', e.target.value)}
                    placeholder="Describe your event — what guests will experience, featured wines, dress code, ticketing..." />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Additional Notes">
                  <textarea rows={3} className={inputCls} value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Equipment needs, special requests, or anything else..." />
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

        {/* Info strip */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Review Time', value: '48 hours' },
            { label: 'Event Types', value: '6+' },
            { label: 'Support', value: 'Dedicated team' },
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
