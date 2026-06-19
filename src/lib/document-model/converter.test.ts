import { describe, it, expect } from 'vitest'
import { tiptapJsonToDocumentModel } from '@/lib/document-model/converter.ts'
import {
  emptyDoc,
  simpleHeadingDoc,
  transcribersNoteDoc,
  printPageIndicatorDoc,
  formattedDoc,
  bulletListDoc,
} from '../../test/fixtures/tiptap-docs.ts'

describe('tiptapJsonToDocumentModel', () => {
  it('converts an empty document', () => {
    const model = tiptapJsonToDocumentModel(emptyDoc)
    expect(model.schemaVersion).toBe(1)
    expect(model.content).toHaveLength(0)
  })

  it('converts heading and paragraph', () => {
    const model = tiptapJsonToDocumentModel(simpleHeadingDoc)
    expect(model.content).toHaveLength(2)

    const heading = model.content[0]
    expect(heading.type).toBe('heading')
    if (heading.type === 'heading') {
      expect(heading.level).toBe(1)
      expect(heading.content[0]).toMatchObject({ type: 'text', text: 'Hello World' })
    }

    const para = model.content[1]
    expect(para.type).toBe('paragraph')
    if (para.type === 'paragraph') {
      expect(para.content[0]).toMatchObject({ type: 'text', text: 'This is a paragraph.' })
    }
  })

  it('converts a Transcriber\'s Note', () => {
    const model = tiptapJsonToDocumentModel(transcribersNoteDoc)
    expect(model.content).toHaveLength(3)

    const tn = model.content[1]
    expect(tn.type).toBe('transcribersNote')
    if (tn.type === 'transcribersNote') {
      expect(tn.content[0]).toMatchObject({ type: 'text', text: 'This word has been replaced.' })
    }
  })

  it('converts a Print Page Indicator', () => {
    const model = tiptapJsonToDocumentModel(printPageIndicatorDoc)
    expect(model.content).toHaveLength(3)

    const ppi = model.content[1]
    expect(ppi.type).toBe('printPageIndicator')
    if (ppi.type === 'printPageIndicator') {
      expect(ppi.pageNumber).toBe('42')
    }
  })

  it('preserves inline marks', () => {
    const model = tiptapJsonToDocumentModel(formattedDoc)
    const para = model.content[0]
    expect(para.type).toBe('paragraph')
    if (para.type !== 'paragraph') return

    const [bold, italic, underline] = para.content
    expect(bold.type).toBe('text')
    if (bold.type === 'text') {
      expect(bold.marks).toEqual(expect.arrayContaining([{ type: 'bold' }]))
    }
    expect(italic.type).toBe('text')
    if (italic.type === 'text') {
      expect(italic.marks).toEqual(expect.arrayContaining([{ type: 'italic' }]))
    }
    expect(underline.type).toBe('text')
    if (underline.type === 'text') {
      expect(underline.marks).toEqual(expect.arrayContaining([{ type: 'underline' }]))
    }
  })

  it('converts a bullet list', () => {
    const model = tiptapJsonToDocumentModel(bulletListDoc)
    expect(model.content).toHaveLength(1)

    const list = model.content[0]
    expect(list.type).toBe('bulletList')
    if (list.type === 'bulletList') {
      expect(list.items).toHaveLength(2)
      expect(list.items[0].type).toBe('listItem')
    }
  })

  it('ignores unknown node types gracefully', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'unknownNode', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'ok' }] },
      ],
    }
    const model = tiptapJsonToDocumentModel(doc)
    // unknownNode is skipped; only paragraph remains
    expect(model.content).toHaveLength(1)
    expect(model.content[0].type).toBe('paragraph')
  })
})
