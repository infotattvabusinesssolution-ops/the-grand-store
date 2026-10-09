import React, { useEffect } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Download, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function ReceiptPreviewModal({
  isOpen,
  onClose,
  proofUrl,
  fileName = '',
  fileSize = '',
  reference = '',
  title = 'Proof of Payment Receipt'
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !proofUrl) return null;

  const isImage = /\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(proofUrl);
  const isPdf = /\.pdf($|\?)/i.test(proofUrl) || proofUrl.includes('/raw/upload/') || (!isImage && proofUrl.includes('pdf'));

  const displayName = fileName || (isPdf ? 'EFT_Payment_Proof.pdf' : 'Receipt_Screenshot.jpg');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0d0d0d] border border-[var(--color-gold)]/40 rounded-2xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Luxury Ambient Light */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-[var(--color-gold)]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] flex-shrink-0">
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                  {title}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  Attached
                </span>
              </div>
              <p className="text-xs text-[var(--color-ivory-muted)] truncate flex items-center gap-2 mt-0.5">
                <span className="font-mono text-white/70">{displayName}</span>
                {fileSize && <span>• {fileSize}</span>}
                {reference && <span>• Ref: <strong className="text-[var(--color-gold)]">{reference}</strong></span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ml-3"
            title="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Document Display Canvas */}
        <div className="flex-1 overflow-auto rounded-xl bg-black/80 border border-white/10 p-2 sm:p-4 flex items-center justify-center min-h-[320px] max-h-[62vh] relative z-10">
          {isImage ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img 
                src={proofUrl} 
                alt="Receipt Proof" 
                className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/5 select-none" 
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <iframe 
                src={`${proofUrl}#toolbar=0&navpanes=0`} 
                title="PDF Receipt Viewer" 
                className="w-full h-[58vh] rounded-lg border-0 bg-[#141414]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-white/10 flex-shrink-0 relative z-10 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span className="text-white/80">Document securely attached & verified for desk reconciliation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-bold uppercase tracking-widest text-xs rounded-xl shadow-[0_4px_16px_rgba(201,163,91,0.3)] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
