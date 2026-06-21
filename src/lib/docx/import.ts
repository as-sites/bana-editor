/**
 * DOCX import pipeline.
 *
 * Reads a .docx file (produced by this application or a compatible Word
 * document) and converts it back into a DocumentModel that can be loaded
 * into the Tiptap editor.
 *
 * Approach:
 *   .docx (ZIP) → word/document.xml (XML) → parsed JS object → DocumentModel
 *
 * Limitations / TODOs:
 * - Round-trip fidelity is best-effort.  Complex formatting may be lost.
 * - Tables are not yet imported.
 * - Images are not yet imported.
 * - Numbering / list hierarchy is approximated.
 * - BANA-specific styles (TransNote, PrintPage) are mapped back to semantic
 *   nodes on import.
 */

import type {
  BlockNode,
  DocumentModel,
  InlineNode,
  InlineMark,
} from '../document-model/types.ts'
import { parseDocx } from './parser.ts'
import { BANA_STYLES } from './styles.ts'

// ─── XML shape helpers ────────────────────────────────────────────────────────

type XmlNode = Record<string, unknown>

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function getAttr(node: XmlNode, attr: string): string | undefined {
  return node[attr] as string | undefined
}

// ─── Run (w:r) parsing ────────────────────────────────────────────────────────

interface RunData {
  text: string
  marks: InlineMark[]
}

function parseRun(run: XmlNode): RunData {
  const marks: InlineMark[] = []
  const rPr = run['w:rPr'] as XmlNode | undefined

  if (rPr) {
    if (rPr['w:b'] !== undefined) marks.push({ type: 'bold' })
    if (rPr['w:i'] !== undefined) marks.push({ type: 'italic' })
    if (rPr['w:u'] !== undefined) marks.push({ type: 'underline' })
    if (rPr['w:strike'] !== undefined) marks.push({ type: 'strike' })
    if (rPr['w:vertAlign']) {
      const val = getAttr(rPr['w:vertAlign'] as XmlNode, '@_w:val')
      if (val === 'superscript') marks.push({ type: 'superscript' })
      if (val === 'subscript') marks.push({ type: 'subscript' })
    }
    if (rPr['w:highlight']) {
      marks.push({ type: 'highlight' })
    }
  }

  const tEl = run['w:t']
  let text = ''
  if (typeof tEl === 'string') {
    text = tEl
  } else if (tEl && typeof tEl === 'object') {
    const t = tEl as XmlNode
    text = (t['#text'] as string) ?? ''
  }

  return { text, marks }
}

function parseRuns(runs: unknown[]): InlineNode[] {
  const result: InlineNode[] = []
  for (const run of runs) {
    const r = run as XmlNode
    // Handle line breaks
    if (r['w:br'] !== undefined) {
      result.push({ type: 'hardBreak' })
      continue
    }
    const data = parseRun(r)
    if (data.text) {
      result.push({ type: 'text', text: data.text, marks: data.marks })
    }
  }
  return result
}

// ─── Paragraph (w:p) parsing ──────────────────────────────────────────────────

function parseParagraph(para: XmlNode): BlockNode | null {
  const pPr = para['w:pPr'] as XmlNode | undefined
  const styleEl = pPr?.['w:pStyle'] as XmlNode | undefined
  const styleId = styleEl ? getAttr(styleEl, '@_w:val') : undefined

  const runs = asArray(para['w:r'] as unknown)

  // ── Transcriber's Note ────────────────────────────────────────────────────
  if (styleId === BANA_STYLES.TranscribersNote) {
    return {
      type: 'transcribersNote',
      content: parseRuns(runs),
    }
  }

  // ── Print Page Indicator ──────────────────────────────────────────────────
  if (styleId === BANA_STYLES.PrintPageIndicator) {
    const content = parseRuns(runs)
    const pageNumber = content
      .filter(n => n.type === 'text')
      .map(n => (n as { type: 'text'; text: string }).text)
      .join('')
    return {
      type: 'printPageIndicator',
      pageNumber,
    }
  }

  // ── Headings ──────────────────────────────────────────────────────────────
  if (styleId?.startsWith('Heading')) {
    const levelStr = styleId.replace(/^Heading/, '')
    const level = parseInt(levelStr, 10)
    if (level >= 1 && level <= 6) {
      return {
        type: 'heading',
        level: level as 1 | 2 | 3 | 4 | 5 | 6,
        content: parseRuns(runs),
      }
    }
  }

  // ── Normal paragraph ──────────────────────────────────────────────────────
  const content = parseRuns(runs)
  return {
    type: 'paragraph',
    content,
  }
}

// ─── Document body parsing ────────────────────────────────────────────────────

function parseBody(body: XmlNode): BlockNode[] {
  const paragraphs = asArray(body['w:p'] as unknown)
  const blocks: BlockNode[] = []

  for (const para of paragraphs) {
    const block = parseParagraph(para as XmlNode)
    if (block) blocks.push(block)
  }

  return blocks
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Import a .docx file and convert it into a DocumentModel.
 */
export async function importDocx(input: File | ArrayBuffer): Promise<DocumentModel> {
  const parsed = await parseDocx(input)
  const doc = parsed.document as XmlNode

  const wordDocument = doc['w:document'] as XmlNode | undefined
  const body = wordDocument?.['w:body'] as XmlNode | undefined

  const content = body ? parseBody(body) : []

  return {
    schemaVersion: 1,
    content,
  }
}

/**
 * Convert a DocumentModel back into a Tiptap-compatible JSON object.
 * This is the inverse of tiptapJsonToDocumentModel().
 */
export function documentModelToTiptapJson(model: DocumentModel): unknown {
  return {
    type: 'doc',
    content: model.content.map(blockToTiptapNode),
  }
}

function inlineToTiptapNode(node: InlineNode): unknown {
  if (node.type === 'hardBreak') {
    return { type: 'hardBreak' }
  }
  const n: Record<string, unknown> = { type: 'text', text: node.text }
  if (node.marks && node.marks.length > 0) {
    n.marks = node.marks.map(m => {
      if (m.type === 'link') return { type: 'link', attrs: { href: m.href, title: m.title } }
      if (m.type === 'highlight') return { type: 'highlight', attrs: { color: m.color } }
      return { type: m.type }
    })
  }
  return n
}

function blockToTiptapNode(block: BlockNode): unknown {
  switch (block.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        ...(block.alignment ? { attrs: { textAlign: block.alignment } } : {}),
        content: block.content.map(inlineToTiptapNode),
      }
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.level },
        content: block.content.map(inlineToTiptapNode),
      }
    case 'bulletList':
      return {
        type: 'bulletList',
        content: block.items.map(item => ({
          type: 'listItem',
          content: item.content.map(blockToTiptapNode),
        })),
      }
    case 'orderedList':
      return {
        type: 'orderedList',
        attrs: { start: block.start },
        content: block.items.map(item => ({
          type: 'listItem',
          content: item.content.map(blockToTiptapNode),
        })),
      }
    case 'listItem':
      return {
        type: 'listItem',
        content: block.content.map(blockToTiptapNode),
      }
    case 'blockquote':
      return {
        type: 'blockquote',
        content: block.content.map(blockToTiptapNode),
      }
    case 'codeBlock':
      return {
        type: 'codeBlock',
        attrs: { language: block.language ?? null },
        content: [{ type: 'text', text: block.content }],
      }
    case 'horizontalRule':
      return { type: 'horizontalRule' }
    case 'image':
      return {
        type: 'image',
        attrs: { src: block.src, alt: block.alt ?? null, title: block.title ?? null },
      }
    case 'transcribersNote':
      return {
        type: 'transcribersNote',
        content: block.content.map(inlineToTiptapNode),
      }
    case 'printPageIndicator':
      return {
        type: 'printPageIndicator',
        attrs: { pageNumber: block.pageNumber },
      }
    default:
      return { type: 'paragraph', content: [] }
  }
}
