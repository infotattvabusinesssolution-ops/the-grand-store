import { useRef } from 'react';
import { ImagePlus, Minus } from 'lucide-react';

export const resolveProductImageUrl = (source) => {
  const value = String(source || '').trim().replace(/\\/g, '/');
  if (!value) return '';
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith('/assets/') || value.startsWith('/logo')) return value;
  if (value.includes('uploads/')) {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5015').replace(/\/$/, '');
    return `${apiUrl}/${value.slice(value.indexOf('uploads/'))}`;
  }
  return value.startsWith('/') ? value : `/${value}`;
};

export const existingImageEntries = (image, gallery = []) => (
  [image, ...(Array.isArray(gallery) ? gallery : [])]
    .map((url, index) => ({
      id: `existing-${index}-${url}`,
      kind: 'existing',
      url,
      preview: resolveProductImageUrl(url)
    }))
    .filter((entry) => entry.url)
    .slice(0, 5)
);

export default function ProductImageManager({ entries, onChange, required = false }) {
  const inputRef = useRef(null);
  const remainingSlots = Math.max(0, 5 - entries.length);

  const addImages = (event) => {
    const files = Array.from(event.target.files || []).slice(0, remainingSlots);
    if (!files.length) return;
    const stamp = Date.now();
    const additions = files.map((file, index) => ({
      id: `upload-${stamp}-${index}-${file.name}`,
      kind: 'upload',
      file,
      preview: URL.createObjectURL(file)
    }));
    onChange([...entries, ...additions]);
    event.target.value = '';
  };

  const removeImage = (entry) => {
    if (entry.kind === 'upload' && entry.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(entry.preview);
    }
    onChange(entries.filter((candidate) => candidate.id !== entry.id));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-ivory-muted)]">
            Product images (up to 5){required ? ' *' : ''}
          </label>
          <p className="mt-2 text-sm font-light text-[var(--color-ivory-muted)]">
            The first image is the main storefront image. New files upload to Cloudinary when you save.
          </p>
        </div>
        <span className="shrink-0 text-xs text-white/40">{entries.length}/5</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="group relative h-28 w-24 overflow-hidden rounded-2xl border border-[var(--color-gold)]/30 bg-black/40">
            <img src={entry.preview} alt={`Product image ${index + 1}`} className="h-full w-full object-contain p-2" />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-black/80 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-[#e1bd70]">Main</span>
            )}
            <button
              type="button"
              onClick={() => removeImage(entry)}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-black/85 text-red-300 transition-colors hover:bg-red-500 hover:text-white"
              aria-label={`Remove image ${index + 1}`}
              title="Remove image"
            >
              <Minus size={15} />
            </button>
          </div>
        ))}

        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-gold)]/40 bg-[var(--color-gold)]/5 text-[#e1bd70] transition-colors hover:bg-[var(--color-gold)]/10"
          >
            <ImagePlus size={23} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Add image</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={addImages}
        className="sr-only"
      />
      {entries.length >= 5 && <p className="mt-3 text-xs text-amber-300/80">Maximum of five images reached.</p>}
    </div>
  );
}
