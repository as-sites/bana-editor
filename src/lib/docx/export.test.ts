import { describe, it, expect } from 'vitest'
import { documentModelToDocx } from '@/lib/docx/export.ts'
import { tiptapJsonToDocumentModel } from '@/lib/document-model/converter.ts'
import {
  emptyDoc,
  simpleHeadingDoc,
  transcribersNoteDoc,
  printPageIndicatorDoc,
} from '../../test/fixtures/tiptap-docs.ts'

describe('documentModelToDocx', () => {
  it('creates a Document from an empty model without throwing', () => {
    const model = tiptapJsonToDocumentModel(emptyDoc)
    expect(() => documentModelToDocx(model)).not.toThrow()
  })

  it('creates a Document from a heading document without throwing', () => {
    const model = tiptapJsonToDocumentModel(simpleHeadingDoc)
    expect(() => documentModelToDocx(model)).not.toThrow()
  })

  it('creates a Document with a Transcriber\'s Note without throwing', () => {
    const model = tiptapJsonToDocumentModel(transcribersNoteDoc)
    expect(() => documentModelToDocx(model)).not.toThrow()
  })

  it('creates a Document with a Print Page Indicator without throwing', () => {
    const model = tiptapJsonToDocumentModel(printPageIndicatorDoc)
    expect(() => documentModelToDocx(model)).not.toThrow()
  })

  it('returns a Document instance', () => {
    const model = tiptapJsonToDocumentModel(simpleHeadingDoc)
    const doc = documentModelToDocx(model)
    // docx Document serialises to a zip blob – check it's not null/undefined
    expect(doc).toBeTruthy()
  })
})
