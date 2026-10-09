import React, { useState, useEffect } from 'react';
import { Landmark, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../api';

let cachedSettings = null;

export default function StoreBankDetailsCard({
  reference,
  referenceLabel = 'Payment Reference',
  title = 'Grand Store Escrow Banking Details',
  subtitle = 'Official institutional South African EFT settlement account',
  bankDetailsList: propBankList,
  bankDetails: propBankDetails,
  compact = false,
  className = '',
  onNotify
}) {
  const [keysList, setKeysList] = useState(propBankList || cachedSettings?.bankDetailsList || null);
  const [bankDetails, setBankDetails] = useState(propBankDetails || cachedSettings?.bankDetails || null);
  const [loading, setLoading] = useState(!keysList);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (propBankList && propBankList.length > 0) {
      setKeysList(propBankList);
      if (propBankDetails) setBankDetails(propBankDetails);
      setLoading(false);
      return;
    }

    if (cachedSettings?.bankDetailsList?.length > 0) {
      setKeysList(cachedSettings.bankDetailsList);
      setBankDetails(cachedSettings.bankDetails);
      setLoading(false);
      return;
    }

    let active = true;
    api.get('/settings/public')
      .then((res) => {
        if (!active) return;
        cachedSettings = res.data;
        const list = Array.isArray(res.data?.bankDetailsList) && res.data.bankDetailsList.length > 0
          ? res.data.bankDetailsList
          : [
              { id: 'bank_name', key: 'Bank Name', value: res.data?.bankDetails?.bankName || 'Standard Bank' },
              { id: 'account_name', key: 'Account Holder', value: res.data?.bankDetails?.accountName || 'The Grand Store PTY LTD' },
              { id: 'account_number', key: 'Account Number', value: res.data?.bankDetails?.accountNumber || '0123456789' },
              { id: 'branch_code', key: 'Branch Code', value: res.data?.bankDetails?.branchCode || '051001' },
              { id: 'account_type', key: 'Account Type', value: res.data?.bankDetails?.accountType || 'Business Cheque' },
              { id: 'swift_code', key: 'SWIFT / BIC Code', value: res.data?.bankDetails?.swiftCode || 'SBZAJJ' },
              { id: 'reference_note', key: 'Reference Instructions', value: res.data?.bankDetails?.referenceNote || 'Use Order ID or Bidder Number as deposit reference' }
            ];
        setKeysList(list);
        setBankDetails(res.data?.bankDetails);
      })
      .catch((err) => {
        console.error('Failed to load public bank settings:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propBankList, propBankDetails]);

  const handleCopy = (text, id, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onNotify) {
      onNotify(`${label} copied to clipboard`);
    }
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2500);
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[var(--color-gold)] min-h-[160px] ${className}`}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  const activeKeys = (keysList || []).filter((item) => item && item.key && item.key.trim());
  const bankNameItem = activeKeys.find((k) => /bank\s*name/i.test(k.key));
  const bankNameDisplay = bankNameItem?.value || bankDetails?.bankName || 'Standard Bank';

  return (
    <div className={`bg-gradient-to-br from-[#12110e] via-[#0a0a09] to-[#050505] border border-[var(--color-gold)]/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden text-left ${className}`}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] shrink-0">
            <Landmark size={18} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-serif text-white font-medium flex items-center gap-2">
              {title}
            </h4>
            <p className="text-[11px] text-white/50 leading-tight">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
          <ShieldCheck size={11} /> {bankNameDisplay}
        </span>
      </div>

      {/* Dynamic Key-Value Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 gap-2.5' : 'sm:grid-cols-2 md:grid-cols-3 gap-3'} relative z-10`}>
        {activeKeys.map((item, idx) => {
          const isAccNum = /account\s*num/i.test(item.key) || /account\s*no/i.test(item.key);
          const isRefNote = /reference/i.test(item.key) || /instructions/i.test(item.key);
          const isBankTitle = /bank\s*name/i.test(item.key);
          const isCopied = copiedId === (item.id || idx);

          return (
            <div
              key={item.id || idx}
              className={`p-3 rounded-xl border transition-all ${
                isAccNum 
                  ? 'bg-black/60 border-[var(--color-gold)]/30 sm:col-span-2' 
                  : isRefNote
                  ? 'bg-black/40 border-white/10 sm:col-span-2 md:col-span-3'
                  : 'bg-black/40 border-white/5 hover:border-white/15'
              }`}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
                {item.key}
              </span>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`break-all ${
                    isAccNum
                      ? 'font-mono text-base sm:text-lg font-bold text-white tracking-widest'
                      : isRefNote
                      ? 'text-xs text-[var(--color-gold)] font-medium'
                      : isBankTitle
                      ? 'text-sm font-semibold text-white'
                      : 'text-xs sm:text-sm font-medium text-white'
                  }`}
                >
                  {item.value || '—'}
                </span>
                {item.value && (
                  <button
                    type="button"
                    onClick={() => handleCopy(item.value, item.id || idx, item.key)}
                    className="p-1.5 text-white/30 hover:text-[var(--color-gold)] hover:bg-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title={`Copy ${item.key}`}
                  >
                    {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Highlighted Order/Payment Reference */}
        {reference && (
          <div className={`p-3.5 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/40 ${compact ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-3'} flex items-center justify-between gap-3`}>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-gold)] block mb-0.5 font-bold">
                {referenceLabel} <span className="text-white/60 font-normal">(Required as deposit ref)</span>
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wider">
                {reference}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(reference, 'ref_prop', referenceLabel)}
              className="px-3 py-1.5 bg-gold-gradient text-black font-bold uppercase tracking-wider text-[11px] rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Copy Reference"
            >
              {copiedId === 'ref_prop' ? (
                <>
                  <Check size={13} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Ref
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
