/**
 * Main editor component.
 *
 * Wraps Tiptap with:
 * - All required extensions
 * - Custom semantic node extensions (TranscribersNote, PrintPageIndicator)
 * - Auto-save to IndexedDB
 * - Toolbar with all formatting controls
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'

import { TranscribersNote } from '@/extensions/TranscribersNote.tsx'
import { PrintPageIndicator } from '@/extensions/PrintPageIndicator.tsx'
import { Toolbar } from './Toolbar.tsx'
import { saveDraft, loadDraft } from '@/lib/persistence/db.ts'

const AUTO_SAVE_DELAY = 1500 // ms

interface EditorProps {
  onContentChange?: (json: unknown) => void
  initialContent?: unknown
}

export function Editor({ onContentChange, initialContent }: EditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isLoaded, setIsLoaded] = useState(false)
  const [pageNumberInput, setPageNumberInput] = useState('')
  const [showPageNumberDialog, setShowPageNumberDialog] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions that conflict with our custom setup
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your document…',
      }),
      CharacterCount,
      Superscript,
      Subscript,
      TranscribersNote,
      PrintPageIndicator,
    ],
    content: '',
    onUpdate({ editor: ed }) {
      setSaveStatus('unsaved')
      const json = ed.getJSON()
      onContentChange?.(json)

      // Debounced auto-save
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaveStatus('saving')
        await saveDraft(json)
        setSaveStatus('saved')
      }, AUTO_SAVE_DELAY)
    },
  })

  // Restore draft on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // If initialContent was provided (e.g. from import), use it directly
      if (initialContent) {
        if (!cancelled && editor) {
          editor.commands.setContent(initialContent as Parameters<typeof editor.commands.setContent>[0])
          setSaveStatus('unsaved')
        }
        if (!cancelled) setIsLoaded(true)
        return
      }

      const saved = await loadDraft()
      if (!cancelled && saved && editor) {
        editor.commands.setContent(saved as Parameters<typeof editor.commands.setContent>[0])
        setSaveStatus('saved')
      }
      if (!cancelled) setIsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
    // Intentionally omitting `initialContent` from deps: we only want this
    // effect to run once when the editor instance is first created.  If
    // `initialContent` changes it means the parent remounted the component
    // with a new key, so the effect will re-run naturally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleInsertTranscribersNote = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent({
      type: 'transcribersNote',
      content: [{ type: 'text', text: '' }],
    }).run()
  }, [editor])

  const handleInsertPrintPageIndicator = useCallback(() => {
    setShowPageNumberDialog(true)
  }, [])

  const handleConfirmPageNumber = useCallback(() => {
    if (!editor) return
    const num = pageNumberInput.trim()
    editor.chain().focus().insertContent({
      type: 'printPageIndicator',
      attrs: { pageNumber: num || '?' },
    }).run()
    setPageNumberInput('')
    setShowPageNumberDialog(false)
  }, [editor, pageNumberInput])

  const charCount = editor?.storage.characterCount?.characters?.() ?? 0
  const wordCount = editor?.storage.characterCount?.words?.() ?? 0

  if (!editor) return null

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        editor={editor}
        onInsertTranscribersNote={handleInsertTranscribersNote}
        onInsertPrintPageIndicator={handleInsertPrintPageIndicator}
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-white">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <span className="text-sm text-slate-500">Loading…</span>
          </div>
        )}
        <EditorContent
          editor={editor}
          className="prose prose-slate mx-auto max-w-4xl px-8 py-6 focus:outline-none"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-1 text-xs text-slate-500">
        <span>
          {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} character{charCount !== 1 ? 's' : ''}
        </span>
        <span className={saveStatus === 'unsaved' ? 'text-amber-600' : 'text-slate-400'}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'All changes saved'}
        </span>
      </div>

      {/* Page number dialog */}
      {showPageNumberDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-base font-semibold text-slate-800">Insert Print Page Indicator</h2>
            <p className="mb-4 text-sm text-slate-600">
              Enter the print page number (e.g. "42", "xiv"):
            </p>
            <input
              type="text"
              value={pageNumberInput}
              onChange={e => setPageNumberInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmPageNumber()}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Page number"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowPageNumberDialog(false); setPageNumberInput('') }}
                className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPageNumber}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
