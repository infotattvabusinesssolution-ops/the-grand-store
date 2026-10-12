import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  Palette,
  Minus,
  Undo2,
  Redo2,
  Code2,
  Eye,
  Sparkles,
  Quote,
  Check,
  X,
  ExternalLink,
  FileText,
  Moon,
  Eraser,
  RotateCcw
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

const FONT_OPTIONS = [
  { label: 'Default Serif', value: "'Playfair Display', Georgia, serif" },
  { label: 'Luxury Display', value: "'Cinzel', 'Times New Roman', serif" },
  { label: 'Modern Sans', value: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Classic Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Monospace', value: "monospace" },
];

const FONT_SIZES = [
  { label: 'Small (13px)', value: '2' },
  { label: 'Regular (15px)', value: '3' },
  { label: 'Medium (18px)', value: '4' },
  { label: 'Large (22px)', value: '5' },
  { label: 'Title (28px)', value: '6' },
];

// High-contrast, rich colors that are vibrant and easily visible
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
  placeholder = 'Type your message normally... Highlight text to format headings, fonts, colors, and lists.'
}) {
  const editorRef = useRef(null);
  const [mode, setMode] = useState('visual'); // 'visual' | 'code' | 'preview'
  const [canvasTheme, setCanvasTheme] = useState(() => {
    return emailFormat === 'luxury' ? 'dark' : 'paper';
  });

  useEffect(() => {
    if (emailFormat === 'luxury') {
      setCanvasTheme('dark');
    } else {
      setCanvasTheme('paper');
    }
  }, [emailFormat]);

  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [selectedSize, setSelectedSize] = useState('3');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [savedSelection, setSavedSelection] = useState(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const isInternalUpdate = useRef(false);

  // Sync external value into contentEditable when needed
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value, mode]);

  // Execute DOM command safely while keeping focus
  const executeCommand = (command, valueArg = null) => {
    if (mode !== 'visual') return;
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
    // Normalize empty content
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

  // Font family change
  const handleFontChange = (fontFamily) => {
    setSelectedFont(fontFamily);
    executeCommand('fontName', fontFamily);
  };

  // Font size change
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    executeCommand('fontSize', size);
  };

  // Fore color change
  const handleColorSelect = (hex) => {
    executeCommand('foreColor', hex);
    setShowColorPicker(false);
  };

  // Clear Formatting
  const handleClearFormat = () => {
    executeCommand('removeFormat');
    executeCommand('foreColor', canvasTheme === 'paper' ? '#18181b' : '#f4f4f5');
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
      const anchorColor = canvasTheme === 'paper' ? '#1d4ed8' : '#c9a35b';
      const anchorHtml = `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: ${anchorColor}; font-weight: 600; text-decoration: underline;">${linkText.trim()}</a>`;
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

  // Luxury Snippet Templates insertion
  const insertSnippet = (snippetHtml) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertHTML', false, snippetHtml);
    setShowSnippets(false);
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
    <div className="w-full flex flex-col border border-white/10 rounded-2xl bg-black/40 overflow-hidden shadow-xl">
      {/* Top Header Bar: Mode Switcher & Tools */}
      <div className="px-4 py-2.5 bg-black/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Editor Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'visual'
                ? 'bg-[#c9a35b] text-black shadow-[0_0_12px_rgba(201,163,91,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Type size={13} /> Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'preview'
                ? 'bg-[#c9a35b] text-black shadow-[0_0_12px_rgba(201,163,91,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye size={13} /> Email Preview
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'code'
                ? 'bg-[#c9a35b] text-black shadow-[0_0_12px_rgba(201,163,91,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 size={13} /> HTML Source
          </button>
        </div>

        {/* Right: Canvas Theme & Quick Templates */}
        <div className="flex items-center gap-2">
          {/* Canvas Mode Toggle */}
          <button
            type="button"
            onClick={() => setCanvasTheme(prev => prev === 'paper' ? 'dark' : 'paper')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 text-white border border-white/15 shadow-sm"
            title="Toggle Document Canvas (Light Paper vs Dark Theme)"
          >
            {canvasTheme === 'paper' ? (
              <>
                <FileText size={13} className="text-amber-400" />
                <span className="text-white font-semibold">📄 Paper Canvas</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-amber-400" />
                <span className="text-white font-semibold">🌙 Dark Canvas</span>
              </>
            )}
          </button>

          {/* Quick Luxury Snippets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSnippets(!showSnippets)}
              className="px-3 py-1.5 bg-[#c9a35b]/15 hover:bg-[#c9a35b]/25 border border-[#c9a35b]/30 rounded-xl text-xs text-[#c9a35b] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} /> Quick Templates
            </button>

            {showSnippets && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#14120e] border border-[#c9a35b]/30 rounded-2xl p-2 shadow-2xl z-30 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold px-2 py-1">
                  Insert Content Block
                </span>
                <button
                  type="button"
                  onClick={() => insertSnippet('<p style="margin-bottom: 14px;">Dear Valued Patron,</p>')}
                  className="text-left px-3 py-2 text-xs text-white/80 hover:text-[#c9a35b] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  🍷 VIP Salutation
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<h2 style="font-size: 22px; margin: 18px 0 8px 0;">Exclusive Cellar Allocation</h2><p style="margin-bottom: 14px;">We are delighted to present an ultra-rare allocation curated exclusively for our distinguished patrons.</p>')}
                  className="text-left px-3 py-2 text-xs text-white/80 hover:text-[#c9a35b] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  🍾 New Allocation Notice
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<div style="margin: 20px 0; padding: 18px; background: #faf8f5; border: 1px dashed #b47e1c; border-radius: 8px; text-align: center;"><p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #b47e1c; margin: 0 0 6px 0; font-weight: bold;">Exclusive Privilege Code</p><p style="font-size: 22px; font-weight: bold; color: #18181b; letter-spacing: 3px; margin: 0; font-family: monospace;">GRAND-VIP20</p><p style="font-size: 11px; color: #666; margin: 6px 0 0 0;">Valid on your next checkout acquisition</p></div>')}
                  className="text-left px-3 py-2 text-xs text-white/80 hover:text-[#c9a35b] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  🏷️ Privilege Code Box
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<div style="text-align: center; margin: 24px 0;"><a href="https://grandstoreglobal.com" style="display: inline-block; background-color: #b47e1c; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Explore Collection &rarr;</a></div>')}
                  className="text-left px-3 py-2 text-xs text-white/80 hover:text-[#c9a35b] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  🔘 Gold Action Button
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WYSIWYG Formatting Toolbar (Visible in Visual Mode) */}
      {mode === 'visual' && (
        <div className="p-2 bg-[#14120e] border-b border-white/10 flex flex-wrap items-center gap-1.5 select-none">
          {/* Headings */}
          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-xl border border-white/10">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<p>'); }}
              title="Normal Paragraph"
              className="px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Normal
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<h1>'); }}
              title="Heading 1 (Main Title)"
              className="px-2 py-1 text-xs text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-serif font-bold"
            >
              H1
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<h2>'); }}
              title="Heading 2 (Section Title)"
              className="px-2 py-1 text-xs text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-serif font-bold"
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<h3>'); }}
              title="Heading 3 (Sub-heading)"
              className="px-2 py-1 text-xs text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer font-serif font-medium"
            >
              H3
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('<blockquote>'); }}
              title="Quote Callout"
              className="p-1 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Quote size={13} />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Font Family Selector */}
          <select
            value={selectedFont}
            onChange={(e) => handleFontChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white/80 focus:outline-none focus:border-[#c9a35b] cursor-pointer"
            title="Font Family"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value} className="bg-[#14120e] text-white">
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size Selector */}
          <select
            value={selectedSize}
            onChange={(e) => handleSizeChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white/80 focus:outline-none focus:border-[#c9a35b] cursor-pointer"
            title="Font Size"
          >
            {FONT_SIZES.map(s => (
              <option key={s.value} value={s.value} className="bg-[#14120e] text-white">
                {s.label}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Inline Styles: Bold, Italic, Underline */}
          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
              title="Bold"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
              title="Italic"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
              title="Underline"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Underline size={14} />
            </button>
          </div>

          {/* Color Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 transition-colors cursor-pointer"
            >
              <Palette size={13} className="text-[#c9a35b]" />
              <span>Color</span>
            </button>

            {showColorPicker && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-[#14120e] border border-white/20 rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">High-Contrast Palette</span>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PALETTE.map(col => (
                    <button
                      key={col.value}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleColorSelect(col.value); }}
                      title={col.name}
                      style={{ backgroundColor: col.value }}
                      className="w-8 h-8 rounded-lg border-2 border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-md"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand('foreColor', canvasTheme === 'paper' ? '#18181b' : '#f4f4f5');
                    setShowColorPicker(false);
                  }}
                  className="w-full text-center py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] text-white/80 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <RotateCcw size={11} /> Reset to Default Text Color
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}
              title="Align Left"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}
              title="Align Center"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}
              title="Align Right"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <AlignRight size={14} />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
              title="Bullet List"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('insertOrderedList'); }}
              title="Numbered List"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Link2 size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCommand('insertHorizontalRule'); }}
              title="Insert Horizontal Divider"
              className="p-1.5 text-white/70 hover:text-[#c9a35b] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Minus size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Undo / Redo / Clear Format */}
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
      )}

      {/* Editor Body Area */}
      <div className={`relative min-h-[260px] max-h-[420px] flex flex-col overflow-hidden transition-colors ${
        canvasTheme === 'paper' ? 'editor-paper bg-[#ececf0]' : 'editor-dark bg-black/50'
      }`}>
        {mode === 'visual' && (
          <div className="relative flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            {/* White Document Sheet Container */}
            <div className={`w-full max-w-[760px] mx-auto rounded-2xl transition-all ${
              canvasTheme === 'paper'
                ? 'bg-white border border-zinc-200/90 shadow-md p-6 sm:p-8 min-h-[240px]'
                : 'bg-[#0f0e0c] border border-white/10 p-5 sm:p-7 min-h-[240px]'
            }`}>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onPaste={handlePaste}
                className={`focus:outline-none focus:ring-0 leading-relaxed font-sans text-sm min-h-[190px] ${
                  canvasTheme === 'paper'
                    ? 'text-zinc-900 selection:bg-amber-100 selection:text-zinc-900'
                    : 'text-white/90 selection:bg-[#c9a35b]/30 selection:text-white'
                }`}
                data-placeholder={placeholder}
              />

              {/* Subtle placeholder when empty */}
              {(!value || value === '<p><br></p>' || value === '<br>') && (
                <div className={`pointer-events-none text-sm font-sans select-none italic -mt-[190px] ${
                  canvasTheme === 'paper' ? 'text-zinc-400' : 'text-white/25'
                }`}>
                  {placeholder}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HTML Code Source View */}
        {mode === 'code' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full flex-1 min-h-[260px] p-5 bg-[#090807] text-[#c9a35b] font-mono text-xs focus:outline-none focus:border-[#c9a35b] leading-relaxed resize-none scrollbar-thin placeholder-white/20"
            placeholder="<p>Enter custom HTML directly...</p>"
          />
        )}

        {/* Email Live Preview */}
        {mode === 'preview' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] scrollbar-thin">
            {emailFormat === 'plain' ? (
              /* Pure Plain Text Simulated Inbox Preview */
              <div className="max-w-[580px] mx-auto bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl text-zinc-900 font-sans">
                <div className="bg-zinc-100/90 px-5 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div><span className="text-zinc-500 font-mono">From:</span> The Grand Store &lt;info@grandstore.co.za&gt;</div>
                    <div><span className="text-zinc-500 font-mono">Subject:</span> <strong className="text-zinc-800">{subject || '(No Subject)'}</strong></div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-200 text-zinc-700">
                    text/plain
                  </span>
                </div>
                <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-800 selection:bg-zinc-200 bg-white min-h-[160px]">
                  {stripToPlainText(value) || <span className="text-zinc-400 italic">No text composed yet.</span>}
                </div>
                <div className="px-6 py-2.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Dispatched strictly as plain text (no HTML)</span>
                  <span className="font-mono text-[10px] text-zinc-500">MIME text/plain</span>
                </div>
              </div>
            ) : emailFormat === 'normal' ? (
              /* Clean Normal Text Email Preview */
              <div className="max-w-[580px] mx-auto bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl text-zinc-900 font-sans">
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
                  <span>Clean standard inbox format &bull; White background</span>
                  <span className="font-mono text-[10px] text-zinc-500">Standard Email</span>
                </div>
              </div>
            ) : (
              /* Luxury Dark Flyer Mockup */
              <div className="max-w-[560px] mx-auto bg-[#050505] border border-white/15 rounded-2xl overflow-hidden shadow-2xl text-white">
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
      </div>

      {/* Footer Bar: Stats & Helper */}
      <div className="px-4 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <div className="flex items-center gap-4">
          <span>Words: <strong className="text-white/70 font-mono">{wordCount}</strong></span>
          <span>Characters: <strong className="text-white/70 font-mono">{charCount}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#c9a35b]/80 font-mono">
            {mode === 'visual' ? (canvasTheme === 'paper' ? 'Visual Paper Mode' : 'Visual Dark Mode') : mode === 'code' ? 'Raw HTML Mode' : 'Live Preview Mode'}
          </span>
        </div>
      </div>

      {/* Link Dialog Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#14120e] border border-[#c9a35b]/40 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-serif">
                <Link2 size={16} className="text-[#c9a35b]" /> Insert Hyperlink
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
                  Destination URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://grandstoreglobal.com/shop"
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
                  placeholder="e.g. View Private Cellar"
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

      {/* Scoped CSS to guarantee high contrast in both Paper and Dark canvas */}
      <style>{`
        /* ================= PAPER / LIGHT CANVAS STYLES ================= */
        .editor-paper [contenteditable] {
          color: #18181b !important;
          caret-color: #18181b;
        }
        .editor-paper [contenteditable] p {
          margin: 0 0 12px 0;
          line-height: 1.65;
          color: #18181b;
        }
        .editor-paper [contenteditable] h1 {
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
          margin: 14px 0 8px 0;
          line-height: 1.25;
        }
        .editor-paper [contenteditable] h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          color: #1e293b;
          font-weight: 600;
          margin: 12px 0 6px 0;
          line-height: 1.3;
        }
        .editor-paper [contenteditable] h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          color: #334155;
          font-weight: 600;
          margin: 10px 0 4px 0;
        }
        .editor-paper [contenteditable] ul {
          list-style-type: disc;
          padding-left: 24px;
          margin: 8px 0 12px 0;
          color: #18181b;
        }
        .editor-paper [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 24px;
          margin: 8px 0 12px 0;
          color: #18181b;
        }
        .editor-paper [contenteditable] li {
          margin-bottom: 4px;
          color: #18181b;
        }
        .editor-paper [contenteditable] blockquote {
          border-left: 3px solid #b47e1c;
          padding: 8px 14px;
          margin: 14px 0;
          background: #fdfaf5;
          border-radius: 0 8px 8px 0;
          color: #374151;
          font-style: italic;
        }
        .editor-paper [contenteditable] a {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .editor-paper [contenteditable] hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 18px 0;
        }

        /* ================= DARK CANVAS STYLES ================= */
        .editor-dark [contenteditable] {
          color: #f4f4f5 !important;
          caret-color: #c9a35b;
        }
        .editor-dark [contenteditable] p {
          margin: 0 0 12px 0;
          line-height: 1.65;
          color: #e4e4e7;
        }
        .editor-dark [contenteditable] h1 {
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
          font-size: 24px;
          color: #c9a35b;
          font-weight: 700;
          margin: 14px 0 8px 0;
          line-height: 1.25;
        }
        .editor-dark [contenteditable] h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          color: #c9a35b;
          font-weight: 600;
          margin: 12px 0 6px 0;
          line-height: 1.3;
        }
        .editor-dark [contenteditable] h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          color: #e5a93c;
          font-weight: 600;
          margin: 10px 0 4px 0;
        }
        .editor-dark [contenteditable] ul {
          list-style-type: disc;
          padding-left: 24px;
          margin: 8px 0 12px 0;
          color: #e4e4e7;
        }
        .editor-dark [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 24px;
          margin: 8px 0 12px 0;
          color: #e4e4e7;
        }
        .editor-dark [contenteditable] li {
          margin-bottom: 4px;
          color: #e4e4e7;
        }
        .editor-dark [contenteditable] blockquote {
          border-left: 3px solid #c9a35b;
          padding: 8px 14px;
          margin: 14px 0;
          background: rgba(201, 163, 91, 0.08);
          border-radius: 0 8px 8px 0;
          color: #ded8ce;
          font-style: italic;
        }
        .editor-dark [contenteditable] a {
          color: #c9a35b;
          text-decoration: underline;
        }
        .editor-dark [contenteditable] hr {
          border: 0;
          border-top: 1px solid rgba(201, 163, 91, 0.35);
          margin: 18px 0;
        }

        /* Clean preview styling */
        .email-preview-clean h1,
        .email-preview-clean h2,
        .email-preview-clean h3 {
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
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
          font-size: 24px;
          margin: 14px 0 8px 0;
        }
        .email-preview-content h2 {
          color: #c9a35b;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          margin: 12px 0 6px 0;
        }
        .email-preview-content h3 {
          color: #e5a93c;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          margin: 10px 0 4px 0;
        }
        .email-preview-content p {
          margin: 0 0 14px 0;
          line-height: 1.65;
        }
        .email-preview-content a {
          color: #c9a35b;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
