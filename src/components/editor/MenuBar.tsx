/**
 * Application menu bar.
 *
 * Provides top-level document actions:
 * - New document
 * - Import .docx
 * - Export .docx
 */

import { useRef } from 'react'

interface MenuBarProps {
  onNew: () => void
  onImport: (file: File) => void
  onExport: () => void
  isExporting?: boolean
}

export function MenuBar({ onNew, onImport, onExport, isExporting }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      // Reset input so the same file can be imported again
      e.target.value = ''
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-300 bg-slate-800 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">BANA Editor</span>
        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white">UEB</span>
      </div>

      <nav className="flex items-center gap-1" aria-label="Document actions">
        <button
          type="button"
          onClick={onNew}
          className="rounded px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          New
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          Import .docx
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isExporting ? 'Exporting…' : 'Export .docx'}
        </button>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.dotx"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Import DOCX file"
        />
      </nav>
    </header>
  )
}
