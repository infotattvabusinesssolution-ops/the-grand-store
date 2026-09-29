import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Minus,
  Link, Image as ImageIcon, Trash2,
  Sparkles, Paperclip, Undo, Redo, ZoomIn, ZoomOut
} from 'lucide-react';
import DOMPurify from 'dompurify';

export default function CrmRichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write your message, quotation details, or campaign content here...',
  minHeight = '180px',
  allowVariables = true,
  onImageCountChange
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false,
    unorderedList: false,
    orderedList: false,
    formatBlock: 'p'
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // Save selection before clicking toolbar buttons
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore selection when executing commands
  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Convert plain text or template string to initial HTML if needed
  const formatInitialContent = (text) => {
    if (!text) return '';
    // If it looks like HTML (has tags), return sanitized
    if (/<[a-z][\s\S]*>/i.test(text)) {
      return DOMPurify.sanitize(text, {
        ADD_TAGS: ['img', 'hr'],
        ADD_ATTR: ['src', 'alt', 'style', 'class', 'target', 'width']
      });
    }
    // Otherwise convert plain text lines to paragraphs/breaks
    const paragraphs = text.split(/\r?\n\r?\n/);
    return paragraphs
      .map(p => `<p>${p.replace(/\r?\n/g, '<br/>')}</p>`)
      .join('');
  };

  // Synchronize internal editor content with incoming value prop
  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const targetHtml = formatInitialContent(value);

    // Only update if different to avoid cursor jumps
    if (currentHtml !== targetHtml && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = targetHtml;
      updateStats();
    }
  }, [value]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);

    const imgs = editorRef.current.querySelectorAll('img');
    const count = imgs.length;
    setImageCount(count);
    if (onImageCountChange) {
      onImageCountChange(count);
    }
  };

  // Update active formatting states based on cursor position
  const updateToolbarState = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        formatBlock: document.queryCommandValue('formatBlock') || 'p'
      });
    } catch {
      // Ignore queryCommand errors if editor not focused
    }
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    updateStats();
    updateToolbarState();

    if (onChange) {
      // Return clean HTML
      onChange(html);
    }
  };

  const executeCommand = (command, value = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    updateToolbarState();
    handleEditorInput();
  };

  // Format block (p, h1, h2, h3)
  const handleBlockChange = (e) => {
    const val = e.target.value;
    executeCommand('formatBlock', val === 'p' ? '<p>' : `<${val}>`);
  };

  // Insert clickable link
  const handleInsertLink = () => {
    saveSelection();
    const url = window.prompt('Enter destination URL (e.g. https://grandstore.co.za):', 'https://');
    if (!url || url.trim() === '' || url === 'https://') return;
    
    restoreSelection();
    executeCommand('createLink', url.trim());
  };

  // Insert image at cursor or append
  const insertImageAtCursor = (dataUrl, altText = 'Attached Image') => {
    editorRef.current?.focus();
    restoreSelection();

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = altText;
    img.className = 'crm-rich-image max-w-full rounded-xl my-2 border border-slate-200 shadow-sm cursor-pointer transition-all inline-block hover:ring-2 hover:ring-blue-500';
    img.style.maxHeight = '280px';
    img.style.objectFit = 'contain';

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);

      // Move cursor after the image and insert a clean break/space
      const space = document.createElement('p');
      space.innerHTML = '<br/>';
      img.parentNode?.insertBefore(space, img.nextSibling);

      range.setStartAfter(space);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Append directly to editor
      editorRef.current?.appendChild(img);
      const space = document.createElement('p');
      space.innerHTML = '<br/>';
      editorRef.current?.appendChild(space);
    }

    saveSelection();
    handleEditorInput();
  };

  // Handle file input for image attachment
  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    // Limit size to 4MB for responsive inline embedding
    if (file.size > 4 * 1024 * 1024) {
      alert('Image file is too large (maximum 4MB recommended for inline messages).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      insertImageAtCursor(event.target?.result, file.name);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle Drag & Drop of images directly into the editor canvas
  const handleDrop = (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (event) => {
          insertImageAtCursor(event.target?.result, imageFile.name);
        };
        reader.readAsDataURL(imageFile);
      }
    }
  };

  // Handle Clipboard Paste of images (Ctrl+V)
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            insertImageAtCursor(event.target?.result, 'Pasted Screenshot');
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
  };

  // Click on image inside editor to select and allow resizing / removal
  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setSelectedImage(e.target);
    } else {
      setSelectedImage(null);
    }
    saveSelection();
    updateToolbarState();
  };

  // Insert variable token (e.g. {{name}})
  const handleInsertVariable = (token) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertText', false, token);
    saveSelection();
    handleEditorInput();
  };

  // Image actions (resize, delete)
  const handleResizeImage = (widthPercent) => {
    if (!selectedImage) return;
    selectedImage.style.width = widthPercent;
    selectedImage.style.maxWidth = '100%';
    handleEditorInput();
  };

  const handleDeleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    handleEditorInput();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleImageFileSelect}
        className="hidden"
      />

      {/* Primary Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-700 select-none">
        {/* Heading / Paragraph Selector */}
        <select
          value={activeFormats.formatBlock.toLowerCase().replace(/[<>]/g, '')}
          onChange={handleBlockChange}
          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Text Style"
        >
          <option value="p">Normal Text</option>
          <option value="h1">Heading 1 (Large)</option>
          <option value="h2">Heading 2 (Medium)</option>
          <option value="h3">Heading 3 (Small)</option>
        </select>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Text Style Buttons */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.bold ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.italic ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.underline ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.strikeThrough ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Alignment Buttons */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.justifyLeft ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.justifyCenter ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.justifyRight ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Lists & Divider */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.unorderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Bullet List"
        >
          <List size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            activeFormats.orderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertHorizontalRule')}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Divider Line"
        >
          <Minus size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Link Insertion */}
        <button
          type="button"
          onClick={handleInsertLink}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Insert Link"
        >
          <Link size={14} />
        </button>

        {/* Inline Image Attachment Button */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all border border-blue-200 cursor-pointer shadow-xs"
          title="Attach & Embed Image Inline (PNG, JPG, WebP)"
        >
          <ImageIcon size={13} className="text-blue-600" />
          <span>Insert Image</span>
        </button>
      </div>

      {/* Selected Image Actions Toolbar (Appears when user clicks an image inside editor) */}
      {selectedImage && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold flex items-center gap-1">
              <ImageIcon size={13} /> Selected Image:
            </span>
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-200">
              <span className="text-[10px] text-slate-500">Size:</span>
              <button
                type="button"
                onClick={() => handleResizeImage('25%')}
                className="px-1 py-0.5 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleResizeImage('50%')}
                className="px-1 py-0.5 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleResizeImage('75%')}
                className="px-1 py-0.5 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleResizeImage('100%')}
                className="px-1 py-0.5 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700"
              >
                100%
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteSelectedImage}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold px-2 py-0.5 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
          >
            <Trash2 size={12} /> Remove Image
          </button>
        </div>
      )}

      {/* WYSIWYG Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        onClick={handleEditorClick}
        onKeyUp={() => {
          saveSelection();
          updateToolbarState();
        }}
        onMouseUp={() => {
          saveSelection();
          updateToolbarState();
        }}
        onDrop={handleDrop}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-3.5 focus:outline-none text-xs text-slate-800 leading-relaxed font-sans prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />

      {/* Bottom Tray: Personalization Variables & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
        {allowVariables && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Insert Variable:
            </span>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{name}}')}
              className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-mono text-blue-600 font-medium transition-colors cursor-pointer"
              title="Replaced with recipient's name"
            >
              + {'{{name}}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{email}}')}
              className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-mono text-blue-600 font-medium transition-colors cursor-pointer"
              title="Replaced with recipient's email"
            >
              + {'{{email}}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{phone}}')}
              className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-mono text-blue-600 font-medium transition-colors cursor-pointer"
              title="Replaced with recipient's phone number"
            >
              + {'{{phone}}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertVariable('{{company}}')}
              className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-mono text-blue-600 font-medium transition-colors cursor-pointer"
              title="Replaced with recipient's company"
            >
              + {'{{company}}'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 text-slate-400 ml-auto">
          <span>{wordCount} words</span>
          {imageCount > 0 && (
            <span className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              <ImageIcon size={11} /> {imageCount} {imageCount === 1 ? 'image' : 'images'} embedded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
