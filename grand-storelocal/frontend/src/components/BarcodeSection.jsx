import React, { useRef } from 'react';
import { Barcode, UploadCloud, Image as ImageIcon, X, Check, ExternalLink } from 'lucide-react';

/**
 * BarcodeSection
 * Reusable component for AddProduct and EditProduct forms.
 * Manages EAN-13, ITF-14, and Cloudinary barcode image uploads.
 */
export default function BarcodeSection({
  barcode,
  cartonBarcode,
  barcodePreview,
  onBarcodeChange,
  onCartonBarcodeChange,
  onBarcodeFileSelect,
  onRemoveBarcodeImage
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onBarcodeFileSelect) {
      onBarcodeFileSelect(file);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/[0.05]">
      <div className="flex items-center justify-between">
        <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4">
          <Barcode size={24} className="text-[#e1bd70]" />
          GS1 Barcodes & Verification
        </h2>
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/25">
          Cloudinary Enabled
        </span>
      </div>

      <p className="text-xs uppercase tracking-widest text-[#e1bd70]/80">
        Enter standard GS1 bottle & carton barcodes, and upload high-resolution barcode label images directly to Cloudinary.
      </p>

      {/* Barcode Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div className="relative z-0 w-full group">
          <input
            type="text"
            name="barcode"
            id="barcode"
            value={barcode || ''}
            onChange={(e) => onBarcodeChange(e.target.value)}
            className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] font-mono peer"
            placeholder=" "
          />
          <label
            htmlFor="barcode"
            className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Single Bottle Barcode (EAN-13: 13 Digits)
          </label>
        </div>

        <div className="relative z-0 w-full group">
          <input
            type="text"
            name="cartonBarcode"
            id="cartonBarcode"
            value={cartonBarcode || ''}
            onChange={(e) => onCartonBarcodeChange(e.target.value)}
            className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] font-mono peer"
            placeholder=" "
          />
          <label
            htmlFor="cartonBarcode"
            className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Carton / Case Barcode (ITF-14: 14 Digits)
          </label>
        </div>
      </div>

      {/* Cloudinary Barcode Image Uploader */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6">
        <label className="block text-xs uppercase tracking-widest text-stone-300 font-bold mb-2">
          Barcode Image / Thermal Sticker (Upload to Cloudinary)
        </label>
        <p className="text-xs text-stone-400 mb-4 font-light">
          Upload an official barcode sticker photo, thermal shipping label, or graphic scan. This is saved to Cloudinary and used for warehouse mobile scanning.
        </p>

        {barcodePreview ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-black/60 border border-white/5">
            <div className="p-3 bg-white rounded-xl shadow-md border border-stone-300 shrink-0">
              <img
                src={barcodePreview}
                alt="Barcode Preview"
                className="max-h-28 max-w-[220px] object-contain mx-auto"
              />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={13} /> Barcode image ready
                </span>
                {barcodePreview.includes('cloudinary') && (
                  <span className="text-[10px] text-[#e1bd70] px-2 py-0.5 rounded-full bg-[#c9a35b]/10 border border-[#c9a35b]/20">
                    ☁️ Cloudinary Hosted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                Will be synchronized to Cloudinary upon saving the product.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-stone-300 hover:text-white hover:border-[#c9a35b] transition-all"
                >
                  Change Image
                </button>
                {onRemoveBarcodeImage && (
                  <button
                    type="button"
                    onClick={onRemoveBarcodeImage}
                    className="px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                  >
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c9a35b]/30 hover:border-[#c9a35b] bg-[#c9a35b]/5 hover:bg-[#c9a35b]/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <UploadCloud size={30} className="text-[#c9a35b]" />
            <p className="text-xs text-stone-200 font-medium">
              Click to select barcode image for Cloudinary upload
            </p>
            <p className="text-[10px] text-stone-500">
              Supports PNG, JPG, WEBP, or SVG barcode label stickers
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
