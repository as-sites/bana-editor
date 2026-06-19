import { describe, it, expect } from 'vitest'
import { extractStyles, extractParagraphTexts } from '@/lib/docx/parser.ts'

describe('extractStyles', () => {
  it('returns empty array for invalid input', () => {
    expect(extractStyles(null)).toEqual([])
    expect(extractStyles({})).toEqual([])
    expect(extractStyles({ 'w:styles': {} })).toEqual([])
  })

  it('extracts style definitions', () => {
    const parsedStyles = {
      'w:styles': {
        'w:style': [
          {
            '@_w:styleId': 'Normal',
            '@_w:type': 'paragraph',
            'w:name': { '@_w:val': 'Normal' },
          },
          {
            '@_w:styleId': 'Heading1',
            '@_w:type': 'paragraph',
            'w:name': { '@_w:val': 'Heading 1' },
            'w:basedOn': { '@_w:val': 'Normal' },
          },
          {
            '@_w:styleId': 'TransNote',
            '@_w:type': 'paragraph',
            'w:name': { "@_w:val": "Transcriber's Note" },
          },
        ],
      },
    }

    const styles = extractStyles(parsedStyles)
    expect(styles).toHaveLength(3)

    expect(styles[0]).toMatchObject({ id: 'Normal', type: 'paragraph', name: 'Normal' })
    expect(styles[1]).toMatchObject({ id: 'Heading1', type: 'paragraph', basedOn: 'Normal' })
    expect(styles[2]).toMatchObject({ id: 'TransNote', type: 'paragraph' })
  })

  it('handles styles without names gracefully', () => {
    const parsedStyles = {
      'w:styles': {
        'w:style': [
          {
            '@_w:styleId': 'CustomStyle',
            '@_w:type': 'character',
          },
        ],
      },
    }
    const styles = extractStyles(parsedStyles)
    expect(styles).toHaveLength(1)
    expect(styles[0]).toMatchObject({ id: 'CustomStyle', name: 'CustomStyle', type: 'character' })
  })
})

describe('extractParagraphTexts', () => {
  it('returns empty array for missing body', () => {
    expect(extractParagraphTexts({})).toEqual([])
    expect(extractParagraphTexts({ 'w:document': {} })).toEqual([])
  })

  it('extracts text from paragraphs', () => {
    const parsedDoc = {
      'w:document': {
        'w:body': {
          'w:p': [
            {
              'w:r': [
                { 'w:t': 'Hello' },
                { 'w:t': ' World' },
              ],
            },
            {
              'w:r': [
                { 'w:t': { '#text': 'Goodbye' } },
              ],
            },
          ],
        },
      },
    }

    const texts = extractParagraphTexts(parsedDoc)
    expect(texts).toHaveLength(2)
    expect(texts[0]).toBe('Hello World')
    expect(texts[1]).toBe('Goodbye')
  })
})
