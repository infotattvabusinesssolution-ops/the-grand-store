import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Palette,
  Minus,
  Undo2,
  Redo2,
  Quote,
  Eye,
  Edit3,
  Eraser,
  RotateCcw,
  X
} from 'lucide-react';

const stripToPlainText = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
};

// High-contrast, rich colors that are crisp and clearly readable on white
const COLOR_PALETTE = [
  { name: 'Charcoal Black', value: '#18181b' },
  { name: 'Royal Gold', value: '#b47e1c' },
  { name: 'Wine Red', value: '#991b1b' },
  { name: 'Sapphire Blue', value: '#1d4ed8' },
  { name: 'Forest Green', value: '#15803d' },
  { name: 'Imperial Purple', value: '#7e22ce' },
  { name: 'Terracotta', value: '#c2410c' },
  { name: 'Slate Gray', value: '#475569' },
];

export default function RichTextEditor({
  value = '',
  onChange,
  subject = '',
  emailFormat = 'normal',
  placeholder = 'Type your email message here normally... Highlight text to format headings, bold, colors, and lists.'
}) {
  const editorRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [savedSelection, setSavedSelection] = useState(null);
  const isInternalUpdate = useRef(false);

  // Sync external value into contentEditable when needed
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value, isPreview]);

  // Execute DOM command safely while keeping focus
  const executeCommand = (command, valueArg = null) => {
    if (isPreview) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, valueArg);
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    const html = editorRef.current.innerHTML;
    if (html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>') {
      onChange('');
    } else {
      onChange(html);
    }
  };

  // Format block (Headings / Paragraph / Quote)
  const handleFormatBlock = (tag) => {
    executeCommand('formatBlock', tag);
  };

  // Fore color change
  const handleColorSelect = (hex) => {
    executeCommand('foreColor', hex);
    setShowColorPicker(false);
  };

  // Clear Formatting
  const handleClearFormat = () => {
    executeCommand('removeFormat');
    executeCommand('foreColor', '#18181b');
  };

  // Save current selection for Link Dialog
  const openLinkDialog = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      setSavedSelection(range);
      setLinkText(range.toString());
    } else {
      setSavedSelection(null);
      setLinkText('');
    }
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const insertLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (savedSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }

    const cleanUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('mailto:') 
      ? linkUrl.trim() 
      : `https://${linkUrl.trim()}`;

    if (linkText.trim()) {
      const anchorHtml = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; font-weight: 600; text-decoration: underline;">${linkText.trim()}</a>`;
      document.execCommand('insertHTML', false, anchorHtml);
    } else {
      executeCommand('createLink', cleanUrl);
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setSavedSelection(null);
    handleEditorInput();
  };

  // Word & character stats
  const cleanText = (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const charCount = cleanText.length;
  const wordCount = cleanText ? cleanText.split(' ').length : 0;

  // Handle Paste
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    // Convert multi-line plain text to clean paragraphs
    const paragraphs = text
      .split(/\r?\n\r?\n/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p style="margin-bottom: 14px; line-height: 1.65;">${p.replace(/\r?\n/g, '<br/>')}</p>`)
      .join('');

    if (paragraphs) {
      document.execCommand('insertHTML', false, paragraphs);
    } else {
      document.execCommand('insertText', false, text);
    }
    handleEditorInput();
  };

  return (
    <div className="w-full flex flex-col border border-white/15 rounded-2xl overflow-hidden shadow-2xl bg-[#14120e]">
      {/* Single Unified Sleek Toolbar Row */}
      <div className="px-3.5 py-2.5 bg-[#1a1713] border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 select-none">
        {/* Left: All formatting tools in one clean ribbon */}
        {!isPreview ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Heading Styles */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<p>'); }}
                title="Normal Text"
                className="px-2.5 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-medium"
              >
                Normal
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<h1>'); }}
                title="Heading 1 (Main Title)"
                className="px-2 py-1 text-xs text-[#c9a35b] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-serif font-bold"
              >
                H1
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<h2>'); }}
                title="Heading 2 (Section Title)"
                className="px-2 py-1 text-xs text-[#c9a35b] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-serif font-bold"
              >
                H2
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<blockquote>'); }}
                title="Quote Block"
                className="p-1 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Quote size={13} />
              </button>
            </div>

            <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

            {/* Bold, Italic, Underline */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
                title="Bold (Ctrl+B)"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
                title="Italic (Ctrl+I)"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
                title="Underline (Ctrl+U)"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Underline size={14} />
              </button>
            </div>

            {/* Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Text Color"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 transition-colors cursor-pointer"
              >
                <Palette size={13} className="text-[#c9a35b]" />
                <span className="hidden sm:inline">Color</span>
              </button>

              {showColorPicker && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-[#1a1713] border border-white/20 rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Text Colors</span>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTE.map(col => (
                      <button
                        key={col.value}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleColorSelect(col.value); }}
                        title={col.name}
                        style={{ backgroundColor: col.value }}
                        className="w-7 h-7 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-md"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeCommand('foreColor', '#18181b');
                      setShowColorPicker(false);
                    }}
                    className="w-full text-center py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] text-white/80 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                  >
                    <RotateCcw size={11} /> Reset Color
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

            {/* Lists: Bullets & Numbers */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
                title="Bullet List"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('insertOrderedList'); }}
                title="Numbered List"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <ListOrdered size={14} />
              </button>
            </div>

            {/* Link & Divider */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onMouseDown={openLinkDialog}
                title="Insert Link"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Link2 size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('insertHorizontalRule'); }}
                title="Divider Line"
                className="p-1.5 text-white/80 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Minus size={14} />
              </button>
            </div>

            <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

            {/* Undo, Redo, Eraser (Clear Format) */}
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('undo'); }}
                title="Undo"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Undo2 size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); executeCommand('redo'); }}
                title="Redo"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Redo2 size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleClearFormat(); }}
                title="Clear Formatting (Reset text to clean normal style)"
                className="p-1.5 text-white/70 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Eraser size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Simulated Recipient Inbox Preview</span>
          </div>
        )}

        {/* Right: Preview Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ml-auto border ${
            isPreview
              ? 'bg-[#c9a35b] text-black border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
          }`}
          title="Toggle Email Preview"
        >
          {isPreview ? (
            <>
              <Edit3 size={13} />
              <span>Back to Editor</span>
            </>
          ) : (
            <>
              <Eye size={13} className="text-[#c9a35b]" />
              <span>Email Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content Box — Clean, Spacious White Document Canvas */}
      {!isPreview ? (
        <div className="relative bg-white min-h-[300px] max-h-[480px] overflow-y-auto pl-6 pr-4 py-5 transition-all editor-canvas-scroll">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onPaste={handlePaste}
            className="focus:outline-none focus:ring-0 leading-relaxed font-sans text-sm text-[#18181b] min-h-[220px] selection:bg-amber-100 selection:text-zinc-900"
            data-placeholder={placeholder}
          />

          {/* Subtle placeholder when empty */}
          {(!value || value === '<p><br></p>' || value === '<br>') && (
            <div className="absolute top-5 left-6 text-zinc-400 pointer-events-none text-sm font-sans select-none italic pr-8">
              {placeholder}
            </div>
          )}
        </div>
      ) : (
        /* Email Live Preview Tab */
        <div className="bg-[#0c0a08] min-h-[300px] max-h-[480px] overflow-y-auto p-5 preview-canvas-scroll">
          {emailFormat === 'plain' ? (
            /* Plain Text Mode Preview */
            <div className="max-w-[620px] mx-auto bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl text-zinc-900 font-sans">
              <div className="bg-zinc-100/90 px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div><span className="text-zinc-500 font-mono">From:</span> The Grand Store &lt;info@grandstore.co.za&gt;</div>
                  <div><span className="text-zinc-500 font-mono">Subject:</span> <strong className="text-zinc-800">{subject || '(No Subject)'}</strong></div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-200 text-zinc-700">
                  text/plain
                </span>
              </div>
              <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-800 bg-white min-h-[160px]">
                {stripToPlainText(value) || <span className="text-zinc-400 italic">No text composed yet.</span>}
              </div>
              <div className="px-6 py-2.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Dispatched strictly as plain text (no HTML tags)</span>
                <span className="font-mono text-[10px] text-zinc-500">MIME text/plain</span>
              </div>
            </div>
          ) : emailFormat === 'normal' ? (
            /* Clean Normal White Email Preview */
            <div className="max-w-[620px] mx-auto bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl text-zinc-900 font-sans">
              <div className="bg-zinc-50 px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div><span className="text-zinc-500 font-mono">From:</span> The Grand Store &lt;info@grandstore.co.za&gt;</div>
                  <div><span className="text-zinc-500 font-mono">Subject:</span> <strong className="text-zinc-800">{subject || '(No Subject)'}</strong></div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Clean Normal Email
                </span>
              </div>
              <div 
                className="p-6 text-zinc-900 text-sm leading-relaxed font-sans email-preview-clean bg-white min-h-[160px]"
                dangerouslySetInnerHTML={{
                  __html: value || '<p style="color: #9ca3af; font-style: italic;">No email content composed yet.</p>'
                }}
              />
              <div className="px-6 py-2.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Clean inbox format without flyer wrapper</span>
                <span className="font-mono text-[10px] text-zinc-500">Standard Email</span>
              </div>
            </div>
          ) : (
            /* Luxury Dark Flyer Mockup */
            <div className="max-w-[580px] mx-auto bg-[#050505] border border-white/15 rounded-2xl overflow-hidden shadow-2xl text-white">
              <div className="bg-gradient-to-b from-[#161410] to-[#0a0a0a] p-6 text-center border-b border-[#c9a35b]/30">
                <span className="text-[10px] tracking-[0.4em] uppercase text-[#c9a35b] font-serif block mb-1">
                  The Concierge Dispatch
                </span>
                <h3 className="font-serif text-2xl text-[#f5d77f] tracking-widest font-normal m-0">
                  THE GRAND STORE
                </h3>
                {subject && (
                  <p className="mt-2 text-xs text-white/60 italic font-serif">
                    &ldquo;{subject}&rdquo;
                  </p>
                )}
              </div>
              <div 
                className="p-6 text-white/90 text-sm leading-relaxed font-sans email-preview-content min-h-[160px]"
                dangerouslySetInnerHTML={{
                  __html: value || '<p style="color: rgba(255,255,255,0.4); font-style: italic; text-align: center;">No email content composed yet.</p>'
                }}
              />
              <div className="px-6 pb-6 pt-2 border-t border-white/5 text-xs text-white/60">
                <p className="m-0 mb-1">Best Regards,</p>
                <strong className="text-[#c9a35b] font-serif tracking-wide text-sm">
                  The Grand Store Team
                </strong>
              </div>
              <div className="bg-[#020202] p-4 text-center border-t border-white/10 text-[11px] text-white/40 leading-relaxed font-sans">
                <p className="m-0">© {new Date().getFullYear()} The Grand Store. All rights reserved.</p>
                <p className="m-0 mt-0.5 text-white/30">Official Concierge Dispatch &bull; support@grandstoreglobal.com</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slim Status Bar */}
      <div className="px-4 py-2 bg-[#1a1713] border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-white/70 font-mono">{wordCount}</strong></span>
          <span>Characters: <strong className="text-white/70 font-mono">{charCount}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#c9a35b] font-mono">
            {isPreview ? 'Preview Mode' : 'Clean Document Canvas'}
          </span>
        </div>
      </div>

      {/* Link Dialog Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1713] border border-[#c9a35b]/40 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-serif">
                <Link2 size={16} className="text-[#c9a35b]" /> Insert Link
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-bold block mb-1">
                  URL Destination
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://grandstoreglobal.com"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/60 font-bold block mb-1">
                  Display Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Visit Our Collection"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="px-4 py-1.5 bg-[#c9a35b] hover:bg-white text-black font-semibold text-xs rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS for high-contrast crisp readable typography */}
      <style>{`
        [contenteditable] {
          color: #18181b !important;
          caret-color: #18181b;
        }
        [contenteditable] p {
          margin: 0 0 14px 0;
          line-height: 1.65;
          color: #18181b;
        }
        [contenteditable] h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
          margin: 16px 0 8px 0;
          line-height: 1.3;
        }
        [contenteditable] h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          color: #1e293b;
          font-weight: 600;
          margin: 14px 0 6px 0;
          line-height: 1.3;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 24px;
          margin: 8px 0 14px 0;
          color: #18181b;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 24px;
          margin: 8px 0 14px 0;
          color: #18181b;
        }
        [contenteditable] li {
          margin-bottom: 6px;
          color: #18181b;
        }
        [contenteditable] blockquote {
          border-left: 3px solid #b47e1c;
          padding: 8px 16px;
          margin: 14px 0;
          background: #fdfaf5;
          border-radius: 0 8px 8px 0;
          color: #374151;
          font-style: italic;
        }
        [contenteditable] a {
          color: #1d4ed8;
          text-decoration: underline;
        }
        [contenteditable] hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 18px 0;
        }

        /* Clean preview styling */
        .email-preview-clean h1,
        .email-preview-clean h2 {
          color: #0f172a;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .email-preview-clean p {
          color: #18181b;
          margin-bottom: 12px;
          line-height: 1.65;
        }
        .email-preview-clean ol,
        .email-preview-clean ul {
          color: #18181b;
          padding-left: 22px;
          margin: 8px 0 12px 0;
        }
        .email-preview-clean li {
          color: #18181b;
          margin-bottom: 4px;
        }
        .email-preview-clean a {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Luxury dark preview styling */
        .email-preview-content h1 {
          color: #c9a35b;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          margin: 14px 0 8px 0;
        }
        .email-preview-content h2 {
          color: #c9a35b;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          margin: 12px 0 6px 0;
        }
        .email-preview-content p {
          margin: 0 0 14px 0;
          line-height: 1.65;
        }
        .email-preview-content a {
          color: #c9a35b;
          text-decoration: underline;
        }

        /* Document Canvas Sleek Custom Scrollbar */
        .editor-canvas-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .editor-canvas-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .editor-canvas-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 3px;
          border-radius: 9999px;
        }
        .editor-canvas-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
          transition: background-color 0.2s ease;
        }
        .editor-canvas-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .editor-canvas-scroll::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        /* Preview Canvas Sleek Custom Scrollbar */
        .preview-canvas-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(201, 163, 91, 0.35) transparent;
        }
        .preview-canvas-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .preview-canvas-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 3px;
          border-radius: 9999px;
        }
        .preview-canvas-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          transition: background-color 0.2s ease;
        }
        .preview-canvas-scroll::-webkit-scrollbar-thumb:hover {
          background: #c9a35b;
        }
        .preview-canvas-scroll::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}
