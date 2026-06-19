import { describe, it, expect } from 'vitest'
import { documentModelToTiptapJson } from '@/lib/docx/import.ts'
import { tiptapJsonToDocumentModel } from '@/lib/document-model/converter.ts'
import {
  simpleHeadingDoc,
  transcribersNoteDoc,
  printPageIndicatorDoc,
  bulletListDoc,
} from '../../test/fixtures/tiptap-docs.ts'

/**
 * Round-trip tests: TiptapJSON → DocumentModel → TiptapJSON.
 *
 * These verify that conversion to the document model and back produces
 * semantically equivalent content (not byte-identical JSON).
 */
describe('documentModelToTiptapJson round-trip', () => {
  it('round-trips a heading document', () => {
    const model = tiptapJsonToDocumentModel(simpleHeadingDoc)
    const json = documentModelToTiptapJson(model) as {
      type: string
      content: Array<{ type: string; attrs?: Record<string, unknown>; content?: unknown[] }>
    }

    expect(json.type).toBe('doc')
    expect(json.content).toHaveLength(2)
    expect(json.content[0].type).toBe('heading')
    expect(json.content[0].attrs?.level).toBe(1)
    expect(json.content[1].type).toBe('paragraph')
  })

  it('round-trips a Transcriber\'s Note', () => {
    const model = tiptapJsonToDocumentModel(transcribersNoteDoc)
    const json = documentModelToTiptapJson(model) as {
      content: Array<{ type: string }>
    }

    expect(json.content[1].type).toBe('transcribersNote')
  })

  it('round-trips a Print Page Indicator', () => {
    const model = tiptapJsonToDocumentModel(printPageIndicatorDoc)
    const json = documentModelToTiptapJson(model) as {
      content: Array<{ type: string; attrs?: { pageNumber?: string } }>
    }

    expect(json.content[1].type).toBe('printPageIndicator')
    expect(json.content[1].attrs?.pageNumber).toBe('42')
  })

  it('round-trips a bullet list', () => {
    const model = tiptapJsonToDocumentModel(bulletListDoc)
    const json = documentModelToTiptapJson(model) as {
      content: Array<{ type: string; content?: unknown[] }>
    }

    expect(json.content[0].type).toBe('bulletList')
    expect(json.content[0].content).toHaveLength(2)
  })
})
