/**
 * DOCX parsing utilities using JSZip + fast-xml-parser.
 *
 * A .docx file is a ZIP archive containing XML files.  This module provides
 * utilities for reading and inspecting those files.
 *
 * Key files inside a .docx:
 *   word/document.xml   – main document body
 *   word/styles.xml     – paragraph and character style definitions
 *   word/numbering.xml  – list/numbering definitions
 *   [Content_Types].xml – part types manifest
 */

import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

// ─── Shared parser configuration ─────────────────────────────────────────────

// Elements that always appear as arrays in OOXML documents
const ARRAY_ELEMENTS = new Set([
  'w:p', 'w:r', 'w:t', 'w:pPr', 'w:rPr',
  'w:style', 'w:abstractNum', 'w:num',
  'w:lvl', 'w:ilvl',
])

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  trimValues: true,
  isArray: (name: string) => ARRAY_ELEMENTS.has(name),
}

function makeParser(): XMLParser {
  return new XMLParser(parserOptions)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedDocx {
  /** Raw text content of word/document.xml */
  documentXml: string
  /** Raw text content of word/styles.xml, if present */
  stylesXml?: string
  /** Raw text content of word/numbering.xml, if present */
  numberingXml?: string
  /** Raw text content of [Content_Types].xml */
  contentTypesXml?: string
  /** Parsed JS object from document.xml */
  document: unknown
  /** Parsed JS object from styles.xml */
  styles?: unknown
  /** Parsed JS object from numbering.xml */
  numbering?: unknown
}

export interface StyleInfo {
  id: string
  name: string
  type: string
  basedOn?: string
}

// ─── Core parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a .docx File or ArrayBuffer and return its key XML components.
 */
export async function parseDocx(input: File | ArrayBuffer): Promise<ParsedDocx> {
  const zip = await JSZip.loadAsync(input)

  const readFile = async (path: string): Promise<string | undefined> => {
    const file = zip.file(path)
    if (!file) return undefined
    return file.async('string')
  }

  const [documentXml, stylesXml, numberingXml, contentTypesXml] = await Promise.all([
    readFile('word/document.xml'),
    readFile('word/styles.xml'),
    readFile('word/numbering.xml'),
    readFile('[Content_Types].xml'),
  ])

  if (!documentXml) {
    throw new Error('Invalid DOCX: word/document.xml not found')
  }

  const parser = makeParser()

  return {
    documentXml,
    stylesXml,
    numberingXml,
    contentTypesXml,
    document: parser.parse(documentXml),
    styles: stylesXml ? parser.parse(stylesXml) : undefined,
    numbering: numberingXml ? parser.parse(numberingXml) : undefined,
  }
}

// ─── Style inspection ─────────────────────────────────────────────────────────

/**
 * Extract a flat list of style definitions from a parsed styles.xml object.
 * Useful for inspecting BANA template styles.
 */
export function extractStyles(parsedStyles: unknown): StyleInfo[] {
  const result: StyleInfo[] = []
  try {
    const styles = parsedStyles as Record<string, unknown>
    const stylesRoot = styles['w:styles'] as Record<string, unknown> | undefined
    if (!stylesRoot) return result

    const styleList = stylesRoot['w:style']
    if (!Array.isArray(styleList)) return result

    for (const style of styleList) {
      const s = style as Record<string, unknown>
      const id = s['@_w:styleId'] as string | undefined
      const type = s['@_w:type'] as string | undefined
      const nameEl = s['w:name'] as Record<string, unknown> | undefined
      const name = nameEl?.['@_w:val'] as string | undefined
      const basedOnEl = s['w:basedOn'] as Record<string, unknown> | undefined
      const basedOn = basedOnEl?.['@_w:val'] as string | undefined

      if (id && type) {
        result.push({ id, name: name ?? id, type, basedOn })
      }
    }
  } catch {
    // Silently return what we have so far
  }
  return result
}

/**
 * Extract paragraph text blocks from a parsed document.xml object.
 * Returns an array of plain-text strings, one per paragraph.
 */
export function extractParagraphTexts(parsedDocument: unknown): string[] {
  const result: string[] = []
  try {
    const doc = parsedDocument as Record<string, unknown>
    const body = (doc['w:document'] as Record<string, unknown>)?.['w:body'] as Record<string, unknown> | undefined
    if (!body) return result

    const paragraphs = body['w:p'] as unknown[]
    if (!Array.isArray(paragraphs)) return result

    for (const para of paragraphs) {
      const p = para as Record<string, unknown>
      const runs = p['w:r']
      if (!Array.isArray(runs)) continue

      let text = ''
      for (const run of runs) {
        const r = run as Record<string, unknown>
        const t = r['w:t']
        if (typeof t === 'string') text += t
        else if (t && typeof (t as Record<string, unknown>)['#text'] === 'string') {
          text += (t as Record<string, unknown>)['#text']
        }
      }
      result.push(text)
    }
  } catch {
    // Silently return what we have so far
  }
  return result
}
