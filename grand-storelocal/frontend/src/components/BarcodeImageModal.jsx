import React, { useState, useRef } from 'react';
import { 
  Barcode, UploadCloud, X, Check, Copy, Eye, ExternalLink, 
  Trash2, Image as ImageIcon, Loader2, Sparkles
} from 'lucide-react';
import api from '../api';

/**
 * BarcodeImageModal
 * Allows Admin or Vendor to view, manage, and upload high-resolution
 * barcode images directly to Cloudinary for any retail product.
 */
export default function BarcodeImageModal({ product, isOpen, onClose, onUpdated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !product) return null;

  const currentBarcodeImage = previewUrl || product.barcodeImage || product.identity?.barcodeImage || '';
  const singleBarcode = product.barcode || product.identity?.barcode || 'N/A';
  const cartonBarcode = product.cartonBarcode || product.identity?.cartonBarcode || 'N/A';

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setSelectedFile(file);
    setError('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('barcodeImage', selectedFile);

      const targetId = product.id || product._id;
      const res = await api.post(`/products/${targetId}/barcode-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedBarcodeImage = res.data?.barcodeImage || res.data?.product?.barcodeImage;
      setSuccess('Barcode image successfully uploaded to Cloudinary!');
      setSelectedFile(null);

      if (onUpdated) {
        onUpdated({
          ...product,
          barcodeImage: updatedBarcodeImage,
          identity: {
            ...(product.identity || {}),
            barcodeImage: updatedBarcodeImage
          }
        });
      }

      setTimeout(() => {
        setSuccess('');
      }, 3500);
    } catch (err) {
      console.error('Failed to upload barcode image:', err);
      setError(err.response?.data?.message || 'Failed to upload barcode image to Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-[#0d0d0d] border border-[#c9a35b]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#c9a35b]/10 text-[#c9a35b] border border-[#c9a35b]/20">
              <Barcode size={20} />
            </div>
            <div>
              <h3 className="text-white font-serif text-lg tracking-wide flex items-center gap-2">
                Barcode & Cloudinary Image
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a35b]/20 text-[#e1bd70] font-sans font-bold uppercase tracking-wider">
                  Cloudinary
                </span>
              </h3>
              <p className="text-xs text-stone-400 truncate max-w-md">
                {product.name}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Barcode Number Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#141414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">
                Single EAN-13 Barcode
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-sm text-[#e1bd70]">
                <span>{singleBarcode}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(singleBarcode)}
                  className="text-stone-500 hover:text-[#c9a35b] transition-colors p-1"
                  title="Copy EAN-13"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">
                Carton ITF-14 Barcode
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-sm text-stone-300">
                <span>{cartonBarcode}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(cartonBarcode)}
                  className="text-stone-500 hover:text-[#c9a35b] transition-colors p-1"
                  title="Copy ITF-14"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Current Barcode Image Preview */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 text-center">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-bold block mb-3">
              Active Barcode Image
            </span>
            {currentBarcodeImage ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl shadow-lg border border-stone-200 inline-block max-w-full">
                  <img 
                    src={currentBarcodeImage} 
                    alt={`Barcode for ${product.name}`} 
                    className="max-h-36 max-w-full object-contain mx-auto"
                  />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <a 
                    href={currentBarcodeImage} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#e1bd70] hover:underline"
                  >
                    <ExternalLink size={12} /> Open Full Barcode
                  </a>
                  {currentBarcodeImage.includes('cloudinary') && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ☁️ Cloudinary Hosted
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-stone-500">
                <ImageIcon size={32} className="opacity-30 mb-2" />
                <p className="text-xs">No barcode image uploaded yet.</p>
                <p className="text-[11px] text-stone-600">Upload a scan, thermal label, or GS1 sticker graphic below.</p>
              </div>
            )}
          </div>

          {/* Cloudinary File Upload Box */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
              Upload New Barcode Image to Cloudinary
            </label>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#c9a35b]/30 hover:border-[#c9a35b] bg-[#c9a35b]/5 hover:bg-[#c9a35b]/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
            >
              <UploadCloud size={28} className="text-[#c9a35b]" />
              <p className="text-xs text-stone-200 font-medium">
                {selectedFile ? selectedFile.name : 'Click to browse or drag & drop barcode image'}
              </p>
              <p className="text-[10px] text-stone-500">
                Supports PNG, JPG, WEBP, or SVG barcode label stickers (Max 5MB)
              </p>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileSelect}
              className="hidden" 
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-950/20 p-2.5 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                <Check size={14} /> {success}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-5 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#d8b467] text-black font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#c9a35b]/20"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading to Cloudinary...
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                Upload Barcode to Cloudinary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
