import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Heading } from '@tiptap/extension-heading';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { Node } from '@tiptap/core';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { contentLibraryService } from '../../../services/contentLibraryService';

const CATEGORIES = [
  'Notes',
  'Exclusions',
  'Shipping Conditions',
  'Materials & Specifications',
  'Scope of Works',
  'Programme of Delivery',
  'Price & Payment Terms',
  'Guarantees',
  'Termination & Disputes',
  'Conduct & Corrupt Gifts',
  'Appendices',
];

// Custom indent extension (no external package needed)
const IndentExtension = Extension?.create({
  name: 'indent',
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // Use editor.isActive to correctly detect list item context
        if (editor?.isActive('listItem')) {
          return editor?.commands?.sinkListItem('listItem');
        }

        // For regular paragraphs, use setIndent command
        return editor?.commands?.increaseIndent?.() ?? false;
      },
      'Shift-Tab': ({ editor }) => {
        if (editor?.isActive('listItem')) {
          return editor?.commands?.liftListItem('listItem');
        }

        return editor?.commands?.decreaseIndent?.() ?? false;
      },
    };
  },
  addCommands() {
    return {
      increaseIndent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;
        state?.doc?.nodesBetween(from, to, (node, pos) => {
          if (node?.type?.name === 'paragraph' || node?.type?.name === 'heading') {
            const currentIndent = node?.attrs?.indent || 0;
            if (currentIndent < 4 && dispatch) {
              tr?.setNodeMarkup(pos, undefined, { ...node?.attrs, indent: currentIndent + 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      decreaseIndent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;
        state?.doc?.nodesBetween(from, to, (node, pos) => {
          if (node?.type?.name === 'paragraph' || node?.type?.name === 'heading') {
            const currentIndent = node?.attrs?.indent || 0;
            if (currentIndent > 0 && dispatch) {
              tr?.setNodeMarkup(pos, undefined, { ...node?.attrs, indent: currentIndent - 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});

// Paragraph extension override to support indent attribute
const IndentableParagraph = Node?.create({
  name: 'paragraph',
  priority: 1001,
  group: 'block',
  content: 'inline*',
  addAttributes() {
    return {
      indent: {
        default: 0,
        parseHTML: (element) => {
          const ml = element?.style?.marginLeft;
          if (!ml) return 0;
          const val = parseFloat(ml);
          return Math.round(val / 1.5) || 0;
        },
        renderHTML: (attributes) => {
          if (!attributes?.indent || attributes?.indent === 0) return {};
          return { style: `margin-left: ${attributes?.indent * 1.5}rem` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'p' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0];
  },
});

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Black', value: '#000000' },
  { label: 'Dark Gray', value: '#374151' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Green', value: '#22C55E' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Pink', value: '#EC4899' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#FEF08A' },
  { label: 'Green', value: '#BBF7D0' },
  { label: 'Blue', value: '#BFDBFE' },
  { label: 'Pink', value: '#FBCFE8' },
  { label: 'Orange', value: '#FED7AA' },
  { label: 'Purple', value: '#E9D5FF' },
];

// Toolbar separator
const Sep = () => <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;

// Toolbar button
const TBtn = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => { e?.preventDefault(); onClick?.(); }}
    className={`h-7 min-w-[28px] px-1 flex items-center justify-center rounded text-xs transition-colors shrink-0 ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

// Color picker dropdown
const ColorPicker = ({ colors, currentColor, onSelect, icon, title }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref?.current && !ref?.current?.contains(e?.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e?.preventDefault(); setOpen(o => !o); }}
        className="h-7 px-1.5 flex items-center gap-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
      >
        <span className="text-xs">{icon}</span>
        <div
          className="w-3 h-1.5 rounded-sm border border-border"
          style={{ backgroundColor: currentColor || 'transparent' }}
        />
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 w-36">
          <div className="grid grid-cols-4 gap-1">
            {colors?.map((c) => (
              <button
                key={c?.value}
                type="button"
                title={c?.label}
                onMouseDown={(e) => { e?.preventDefault(); onSelect(c?.value); setOpen(false); }}
                className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center"
                style={{ backgroundColor: c?.value || 'transparent' }}
              >
                {!c?.value && <span className="text-[8px] text-muted-foreground">✕</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Find & Replace panel
const FindReplacePanel = ({ editor, onClose }) => {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const countMatches = useCallback((searchTerm) => {
    if (!editor || !searchTerm) { setMatchCount(0); return; }
    const text = editor?.getText();
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text?.match(regex);
    setMatchCount(matches ? matches?.length : 0);
  }, [editor]);

  useEffect(() => { countMatches(find); }, [find, countMatches]);

  const handleReplace = () => {
    if (!editor || !find) return;
    const html = editor?.getHTML();
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = html?.replace(regex, replace);
    editor?.commands?.setContent(newHtml);
    countMatches(find);
  };

  const handleReplaceAll = () => {
    if (!editor || !find) return;
    const html = editor?.getHTML();
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = html?.replace(regex, replace);
    editor?.commands?.setContent(newHtml);
    setMatchCount(0);
  };

  return (
    <div className="border-b border-border bg-muted/30 px-3 py-2 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Find & Replace</span>
      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="Find..."
          value={find}
          onChange={(e) => setFind(e?.target?.value)}
          className="h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32"
        />
        {find && <span className="text-[10px] text-muted-foreground shrink-0">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>}
      </div>
      <input
        type="text"
        placeholder="Replace with..."
        value={replace}
        onChange={(e) => setReplace(e?.target?.value)}
        className="h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36"
      />
      <button
        type="button"
        onMouseDown={(e) => { e?.preventDefault(); handleReplace(); }}
        className="h-7 px-2 text-xs bg-muted hover:bg-muted/80 text-foreground rounded border border-border transition-colors"
      >Replace</button>
      <button
        type="button"
        onMouseDown={(e) => { e?.preventDefault(); handleReplaceAll(); }}
        className="h-7 px-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >Replace All</button>
      <button
        type="button"
        onMouseDown={(e) => { e?.preventDefault(); onClose(); }}
        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
      >
        <Icon name="X" size={12} />
      </button>
    </div>
  );
};

// Table insert popup
const TableInsertPopup = ({ onInsert, onClose }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref?.current && !ref?.current?.contains(e?.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 w-52"
      onMouseDown={(e) => e?.stopPropagation()}
    >
      <p className="text-xs font-medium text-foreground mb-2">Insert Table</p>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-muted-foreground w-12">Rows</label>
        <input
          type="number"
          min={1}
          max={20}
          value={rows}
          onChange={(e) => setRows(Math.max(1, parseInt(e?.target?.value) || 1))}
          className="h-6 w-16 px-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-muted-foreground w-12">Cols</label>
        <input
          type="number"
          min={1}
          max={10}
          value={cols}
          onChange={(e) => setCols(Math.max(1, parseInt(e?.target?.value) || 1))}
          className="h-6 w-16 px-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e?.stopPropagation();
          onInsert(rows, cols);
          setTimeout(() => onClose(), 50);
        }}
        className="w-full h-7 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >Insert</button>
    </div>
  );
};

// Main TipTap Editor component
const TipTapEditor = ({ value, onChange, placeholder }) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showTablePopup, setShowTablePopup] = useState(false);
  const [startAt, setStartAt] = useState(1);
  const tableButtonRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit?.configure({
        heading: false,
        horizontalRule: false,
        paragraph: false,
        bulletList: {
          HTMLAttributes: { class: 'tiptap-bullet-list' },
        },
        orderedList: {
          HTMLAttributes: { class: 'tiptap-ordered-list' },
          keepAttributes: true,
        },
      }),
      IndentableParagraph,
      Heading?.configure({ levels: [1, 2, 3] }),
      TextAlign?.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight?.configure({ multicolor: true }),
      HorizontalRule,
      Table?.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      IndentExtension,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor?.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content focus:outline-none',
      },
    },
  });

  // Sync external value changes (e.g. when editing a different entry)
  useEffect(() => {
    if (editor && value !== editor?.getHTML()) {
      editor?.commands?.setContent(value || '');
    }
  }, [value, editor]);

  const wordCount = editor?.storage?.characterCount?.words?.() ?? 0;
  const charCount = editor?.storage?.characterCount?.characters?.() ?? 0;

  const currentTextColor = editor?.getAttributes('textStyle')?.color || '';
  const currentHighlight = editor?.getAttributes('highlight')?.color || '';

  const headingValue = editor?.isActive('heading', { level: 1 })
    ? 'h1' : editor?.isActive('heading', { level: 2 })
    ? 'h2' : editor?.isActive('heading', { level: 3 })
    ? 'h3' : 'p';

  const setHeading = (val) => {
    if (!editor) return;
    if (val === 'p') {
      editor?.chain()?.focus()?.setParagraph()?.run();
    } else {
      const level = parseInt(val?.replace('h', ''));
      editor?.chain()?.focus()?.toggleHeading({ level })?.run();
    }
  };

  const applyStartAt = () => {
    if (!editor) return;
    const num = Math.max(1, parseInt(startAt) || 1);
    // If already inside an ordered list, just update the start attribute
    // If not, toggle the ordered list on first, then set the attribute
    if (editor?.isActive('orderedList')) {
      editor?.chain()?.focus()?.updateAttributes('orderedList', { start: num })?.run();
    } else {
      editor?.chain()?.focus()?.toggleOrderedList()?.run();
      editor?.chain()?.focus()?.updateAttributes('orderedList', { start: num })?.run();
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      {/* ── Toolbar ── */}
      <div className="bg-muted/40 border-b border-border">
        {/* Row 1: Undo/Redo | Heading | Alignment | Bold/Italic/Underline/Strike */}
        <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-border/50">
          {/* Undo / Redo */}
          <TBtn title="Undo (Ctrl+Z)" onClick={() => editor?.chain()?.focus()?.undo()?.run()} disabled={!editor?.can()?.undo()}>
            <Icon name="Undo2" size={13} />
          </TBtn>
          <TBtn title="Redo (Ctrl+Y)" onClick={() => editor?.chain()?.focus()?.redo()?.run()} disabled={!editor?.can()?.redo()}>
            <Icon name="Redo2" size={13} />
          </TBtn>

          <Sep />

          {/* Heading selector */}
          <select
            value={headingValue}
            onChange={(e) => setHeading(e?.target?.value)}
            onMouseDown={(e) => e?.stopPropagation()}
            className="h-7 px-1.5 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <Sep />

          {/* Text formatting */}
          <TBtn title="Bold (Ctrl+B)" active={editor?.isActive('bold')} onClick={() => editor?.chain()?.focus()?.toggleBold()?.run()}>
            <Icon name="Bold" size={13} />
          </TBtn>
          <TBtn title="Italic (Ctrl+I)" active={editor?.isActive('italic')} onClick={() => editor?.chain()?.focus()?.toggleItalic()?.run()}>
            <Icon name="Italic" size={13} />
          </TBtn>
          <TBtn title="Underline (Ctrl+U)" active={editor?.isActive('underline')} onClick={() => editor?.chain()?.focus()?.toggleUnderline?.()?.run()}>
            <Icon name="Underline" size={13} />
          </TBtn>
          <TBtn title="Strikethrough" active={editor?.isActive('strike')} onClick={() => editor?.chain()?.focus()?.toggleStrike()?.run()}>
            <Icon name="Strikethrough" size={13} />
          </TBtn>

          <Sep />

          {/* Alignment */}
          <TBtn title="Align Left" active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain()?.focus()?.setTextAlign('left')?.run()}>
            <Icon name="AlignLeft" size={13} />
          </TBtn>
          <TBtn title="Align Centre" active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain()?.focus()?.setTextAlign('center')?.run()}>
            <Icon name="AlignCenter" size={13} />
          </TBtn>
          <TBtn title="Align Right" active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain()?.focus()?.setTextAlign('right')?.run()}>
            <Icon name="AlignRight" size={13} />
          </TBtn>
          <TBtn title="Justify" active={editor?.isActive({ textAlign: 'justify' })} onClick={() => editor?.chain()?.focus()?.setTextAlign('justify')?.run()}>
            <Icon name="AlignJustify" size={13} />
          </TBtn>

          <Sep />

          {/* Colour pickers */}
          <ColorPicker
            colors={TEXT_COLORS}
            currentColor={currentTextColor}
            onSelect={(c) => {
              if (!c) editor?.chain()?.focus()?.unsetColor()?.run();
              else editor?.chain()?.focus()?.setColor(c)?.run();
            }}
            icon="A"
            title="Text Colour"
          />
          <ColorPicker
            colors={HIGHLIGHT_COLORS}
            currentColor={currentHighlight}
            onSelect={(c) => {
              if (!c) editor?.chain()?.focus()?.unsetHighlight()?.run();
              else editor?.chain()?.focus()?.setHighlight({ color: c })?.run();
            }}
            icon="🖊"
            title="Highlight Colour"
          />
        </div>

        {/* Row 2: Lists | Start At | HR | Table | Find & Replace */}
        <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5">
          {/* Bullet list */}
          <TBtn title="Bullet List (Tab to indent, Shift+Tab to outdent)" active={editor?.isActive('bulletList')} onClick={() => editor?.chain()?.focus()?.toggleBulletList()?.run()}>
            <Icon name="List" size={13} />
          </TBtn>

          {/* Ordered list */}
          <TBtn title="Numbered List" active={editor?.isActive('orderedList')} onClick={() => editor?.chain()?.focus()?.toggleOrderedList()?.run()}>
            <Icon name="ListOrdered" size={13} />
          </TBtn>

          {/* Start At for numbered list */}
          <div className="flex items-center gap-1 ml-0.5" title="Start numbered list at...">
            <span className="text-[10px] text-muted-foreground shrink-0">Start at</span>
            <input
              type="number"
              min={1}
              value={startAt}
              onChange={(e) => setStartAt(e?.target?.value)}
              onMouseDown={(e) => e?.stopPropagation()}
              className="h-6 w-12 px-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none"
            />
            <button
              type="button"
              title="Apply start number"
              onMouseDown={(e) => { e?.preventDefault(); applyStartAt(); }}
              className="h-6 px-1.5 text-[10px] bg-muted hover:bg-muted/80 text-foreground rounded border border-border transition-colors"
            >↵</button>
          </div>

          <Sep />

          {/* Indent / Outdent */}
          <TBtn title="Increase Indent (Tab)" active={false} disabled={false} onClick={() => {
            if (!editor) return;
            if (editor?.isActive('listItem')) {
              editor?.chain()?.focus()?.sinkListItem('listItem')?.run();
            } else {
              editor?.chain()?.focus()?.increaseIndent()?.run();
            }
          }}>
            <Icon name="Indent" size={13} />
          </TBtn>
          <TBtn title="Decrease Indent (Shift+Tab)" active={false} disabled={false} onClick={() => {
            if (!editor) return;
            if (editor?.isActive('listItem')) {
              editor?.chain()?.focus()?.liftListItem('listItem')?.run();
            } else {
              editor?.chain()?.focus()?.decreaseIndent()?.run();
            }
          }}>
            <Icon name="Outdent" size={13} />
          </TBtn>

          <Sep />

          {/* Horizontal rule */}
          <TBtn title="Insert Horizontal Rule" onClick={() => editor?.chain()?.focus()?.setHorizontalRule()?.run()} active={false} disabled={false}>
            <Icon name="Minus" size={13} />
          </TBtn>

          {/* Table */}
          <div className="relative" ref={tableButtonRef}>
            <TBtn title="Insert Table" active={editor?.isActive('table')} onClick={() => setShowTablePopup(o => !o)}>
              <Icon name="Table" size={13} />
            </TBtn>
            {showTablePopup && (
              <TableInsertPopup
                onInsert={(r, c) => {
                  if (editor) {
                    editor?.view?.focus();
                    editor?.chain()?.insertTable({ rows: r, columns: c, withHeaderRow: true })?.run();
                  }
                }}
                onClose={() => setShowTablePopup(false)}
              />
            )}
          </div>

          {/* Table row/col controls — only visible when inside a table */}
          {editor?.isActive('table') && (
            <>
              <Sep />
              <TBtn title="Add Row Below" onClick={() => editor?.chain()?.focus()?.addRowAfter()?.run()}>
                <span className="text-[10px] font-mono">+R</span>
              </TBtn>
              <TBtn title="Delete Row" onClick={() => editor?.chain()?.focus()?.deleteRow()?.run()}>
                <span className="text-[10px] font-mono">-R</span>
              </TBtn>
              <TBtn title="Add Column After" onClick={() => editor?.chain()?.focus()?.addColumnAfter()?.run()}>
                <span className="text-[10px] font-mono">+C</span>
              </TBtn>
              <TBtn title="Delete Column" onClick={() => editor?.chain()?.focus()?.deleteColumn()?.run()}>
                <span className="text-[10px] font-mono">-C</span>
              </TBtn>
              <TBtn title="Delete Table" onClick={() => editor?.chain()?.focus()?.deleteTable()?.run()}>
                <Icon name="Trash2" size={12} />
              </TBtn>
            </>
          )}

          <Sep />

          {/* Find & Replace toggle */}
          <TBtn title="Find & Replace" active={showFindReplace} onClick={() => setShowFindReplace(o => !o)}>
            <Icon name="Search" size={13} />
          </TBtn>
        </div>
      </div>
      {/* Find & Replace panel */}
      {showFindReplace && (
        <FindReplacePanel editor={editor} onClose={() => setShowFindReplace(false)} />
      )}
      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <style>{`
          .tiptap-editor-content {
            min-height: 160px;
            max-height: 300px;
            overflow-y: auto;
            padding: 12px;
            font-size: 0.875rem;
            line-height: 1.6;
            color: inherit;
          }
          .tiptap-editor-content h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
          .tiptap-editor-content h2 { font-size: 1.25rem; font-weight: 600; margin: 0.4rem 0; }
          .tiptap-editor-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.3rem 0; }
          .tiptap-editor-content p { margin: 0.25rem 0; }
          .tiptap-editor-content p[data-indent="1"] { margin-left: 1.5rem; }
          .tiptap-editor-content p[data-indent="2"] { margin-left: 3rem; }
          .tiptap-editor-content p[data-indent="3"] { margin-left: 4.5rem; }
          .tiptap-editor-content p[data-indent="4"] { margin-left: 6rem; }
          /* Multi-level bullet points */
          .tiptap-editor-content ul { list-style: none; padding-left: 1.25rem; margin: 0.25rem 0; }
          .tiptap-editor-content ul li { position: relative; padding-left: 1rem; }
          .tiptap-editor-content ul li::before { content: '●'; position: absolute; left: 0; font-size: 0.6em; top: 0.3em; }
          .tiptap-editor-content ul ul li::before { content: '○'; }
          .tiptap-editor-content ul ul ul li::before { content: '■'; font-size: 0.5em; top: 0.4em; }
          /* Ordered lists */
          .tiptap-editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.25rem 0; }
          .tiptap-editor-content ol li { padding-left: 0.25rem; list-style-type: decimal; }
          .tiptap-editor-content ol ol li { list-style-type: lower-alpha; }
          .tiptap-editor-content ol ol ol li { list-style-type: lower-roman; }
          /* Nested lists */
          .tiptap-editor-content li > ul,
          .tiptap-editor-content li > ol { margin: 0; }
          /* Horizontal rule */
          .tiptap-editor-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 0.75rem 0; }
          /* Table */
          .tiptap-editor-content table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
          .tiptap-editor-content th, .tiptap-editor-content td { border: 1px solid #d1d5db; padding: 6px 10px; font-size: 0.8rem; }
          .tiptap-editor-content th { background: rgba(0,0,0,0.04); font-weight: 600; }
          .tiptap-editor-content .selectedCell { background: rgba(59,130,246,0.1); }
          /* Placeholder */
          .tiptap-editor-content p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
      {/* Word / character count footer */}
      <div className="flex items-center justify-end gap-3 px-3 py-1.5 border-t border-border bg-muted/20">
        <span className="text-[10px] text-muted-foreground">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        <span className="text-[10px] text-muted-foreground">{charCount} char{charCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

// ── Entry Form ──────────────────────────────────────────────────────────────
const EntryForm = ({ category, entry, onSave, onCancel }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset when entry changes
  useEffect(() => {
    setTitle(entry?.title || '');
    setContent(entry?.content || '');
    setError(null);
  }, [entry]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (entry?.id) {
        await contentLibraryService?.update(entry?.id, { title: title?.trim(), content });
      } else {
        await contentLibraryService?.create({ category, title: title?.trim(), content });
      }
      onSave?.();
    } catch (err) {
      setError(err?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/20 border border-border rounded-xl p-4 mb-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">
        {entry?.id ? 'Edit Entry' : 'Add New Entry'}
      </h4>
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
        <Input
          type="text"
          placeholder="Entry title..."
          value={title}
          onChange={(e) => setTitle(e?.target?.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Content</label>
        <TipTapEditor
          value={content}
          onChange={setContent}
          placeholder="Enter content..."
        />
      </div>
      {error && (
        <p className="text-xs text-destructive mb-3">{error}</p>
      )}
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={saving || !title?.trim()}>
          {saving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </form>
  );
};

// ── Entry Card ──────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onEdit, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${entry?.title}"?`)) return;
    setDeleting(true);
    try {
      await contentLibraryService?.remove(entry?.id);
      onDelete?.();
    } catch {
      setDeleting(false);
    }
  };

  const preview = entry?.content
    ? entry?.content?.replace(/<[^>]+>/g, '')?.slice(0, 120)
    : '';

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-brand transition-smooth">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate mb-1">{entry?.title}</h4>
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2">{preview}...</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit?.(entry)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            title="Edit"
          >
            <Icon name="Pencil" size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
            title="Delete"
          >
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Content Library ────────────────────────────────────────────────────
const ContentLibrary = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES?.[0]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const loadEntries = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const data = await contentLibraryService?.getByCategory(category);
      setEntries(data);
    } catch (err) {
      setError(err?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(selectedCategory);
    setShowForm(false);
    setEditingEntry(null);
  }, [selectedCategory]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingEntry(null);
    loadEntries(selectedCategory);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="flex gap-0 bg-card border border-border rounded-xl overflow-hidden" style={{ minHeight: '65vh' }}>
      {/* Left: Vertical category list */}
      <div className="w-[220px] shrink-0 border-r border-border bg-muted/20 flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {CATEGORIES?.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-smooth flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Entries panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{selectedCategory}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries?.length} {entries?.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          {!showForm && (
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={() => { setEditingEntry(null); setShowForm(true); }}
            >
              Add New Entry
            </Button>
          )}
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto p-5">
          {showForm && (
            <EntryForm
              category={selectedCategory}
              entry={editingEntry}
              onSave={handleSaved}
              onCancel={handleCancelForm}
            />
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 text-destructive text-sm py-4">
              <Icon name="AlertCircle" size={16} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && entries?.length > 0 && (
            <div className="flex flex-col gap-3">
              {entries?.map((entry) => (
                <EntryCard
                  key={entry?.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={() => loadEntries(selectedCategory)}
                />
              ))}
            </div>
          )}

          {!loading && !error && entries?.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon name="FileText" size={24} className="text-muted-foreground" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">No entries yet</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Add your first entry for {selectedCategory}
              </p>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={() => { setEditingEntry(null); setShowForm(true); }}
              >
                Add New Entry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentLibrary;
