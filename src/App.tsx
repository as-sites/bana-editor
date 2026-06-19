/**
 * Root application component.
 *
 * Coordinates:
 * - Top-level menu bar (new / import / export)
 * - Tiptap editor with auto-save
 * - DOCX export/import via the document processing pipeline
 */

import { useCallback, useRef, useState } from 'react'
import { Editor } from '@/components/editor/Editor.tsx'
import { MenuBar } from '@/components/editor/MenuBar.tsx'
import { tiptapJsonToDocumentModel } from '@/lib/document-model/converter.ts'
import { exportDocx } from '@/lib/docx/export.ts'
import { importDocx, documentModelToTiptapJson } from '@/lib/docx/import.ts'
import { deleteDraft } from '@/lib/persistence/db.ts'

export function App() {
  const editorJsonRef = useRef<unknown>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kept as a ref because we only need the latest value at export time
  const handleContentChange = useCallback((json: unknown) => {
    editorJsonRef.current = json
  }, [])

  // setEditorContent is called via a key change to force-remount the editor
  const [editorKey, setEditorKey] = useState(0)
  const pendingContentRef = useRef<unknown>(null)

  const handleNew = useCallback(async () => {
    if (!confirm('Create a new document? Unsaved changes will be lost.')) return
    await deleteDraft()
    editorJsonRef.current = null
    pendingContentRef.current = null
    setEditorKey(k => k + 1)
  }, [])

  const handleImport = useCallback(async (file: File) => {
    setError(null)
    try {
      const model = await importDocx(file)
      const tiptapJson = documentModelToTiptapJson(model)
      pendingContentRef.current = tiptapJson
      setEditorKey(k => k + 1)
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [])

  const handleExport = useCallback(async () => {
    setError(null)
    const json = editorJsonRef.current
    if (!json) {
      setError('Nothing to export — start typing first.')
      return
    }
    setIsExporting(true)
    try {
      const model = tiptapJsonToDocumentModel(json)
      await exportDocx(model, 'bana-document.docx')
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <MenuBar
        onNew={handleNew}
        onImport={handleImport}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {error && (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <main className="min-h-0 flex-1">
        <Editor
          key={editorKey}
          onContentChange={handleContentChange}
          initialContent={pendingContentRef.current}
        />
      </main>
    </div>
  )
}
