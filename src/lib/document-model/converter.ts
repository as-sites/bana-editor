/**
 * Converts Tiptap's ProseMirror JSON representation into the internal
 * DocumentModel.  We deliberately avoid importing Tiptap here so that this
 * module can also be used in tests without needing a DOM.
 */

import type {
  BlockNode,
  BulletListBlock,
  DocumentModel,
  HeadingBlock,
  HeadingLevel,
  HorizontalRuleBlock,
  ImageBlock,
  InlineNode,
  InlineMark,
  ListItemBlock,
  OrderedListBlock,
  ParagraphBlock,
  PrintPageIndicatorBlock,
  TextAlignment,
  TranscribersNoteBlock,
} from './types.ts'

// ─── Tiptap JSON shapes (minimal typing) ─────────────────────────────────────

interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TiptapNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: TiptapMark[]
  content?: TiptapNode[]
}

// ─── Inline conversion ────────────────────────────────────────────────────────

function convertMarks(marks: TiptapMark[] | undefined): InlineMark[] {
  if (!marks) return []
  const result: InlineMark[] = []
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result.push({ type: 'bold' })
        break
      case 'italic':
        result.push({ type: 'italic' })
        break
      case 'underline':
        result.push({ type: 'underline' })
        break
      case 'strike':
        result.push({ type: 'strike' })
        break
      case 'superscript':
        result.push({ type: 'superscript' })
        break
      case 'subscript':
        result.push({ type: 'subscript' })
        break
      case 'highlight':
        result.push({ type: 'highlight', color: mark.attrs?.color as string | undefined })
        break
      case 'code':
        result.push({ type: 'code' })
        break
      case 'link':
        result.push({ type: 'link', href: (mark.attrs?.href as string) ?? '', title: mark.attrs?.title as string | undefined })
        break
    }
  }
  return result
}

function convertInlineContent(nodes: TiptapNode[] | undefined): InlineNode[] {
  if (!nodes) return []
  const result: InlineNode[] = []
  for (const node of nodes) {
    if (node.type === 'text') {
      result.push({
        type: 'text',
        text: node.text ?? '',
        marks: convertMarks(node.marks),
      })
    } else if (node.type === 'hardBreak') {
      result.push({ type: 'hardBreak' })
    }
    // Other inline node types are ignored for now
  }
  return result
}

// ─── Block conversion ─────────────────────────────────────────────────────────

function convertParagraph(node: TiptapNode): ParagraphBlock {
  const alignment = node.attrs?.textAlign as TextAlignment | undefined
  return {
    type: 'paragraph',
    ...(alignment ? { alignment } : {}),
    content: convertInlineContent(node.content),
  }
}

function convertHeading(node: TiptapNode): HeadingBlock {
  const level = (node.attrs?.level as HeadingLevel) ?? 1
  return {
    type: 'heading',
    level,
    content: convertInlineContent(node.content),
  }
}

function convertBulletList(node: TiptapNode): BulletListBlock {
  return {
    type: 'bulletList',
    items: (node.content ?? []).map(convertListItem),
  }
}

function convertOrderedList(node: TiptapNode): OrderedListBlock {
  return {
    type: 'orderedList',
    start: (node.attrs?.start as number) ?? 1,
    items: (node.content ?? []).map(convertListItem),
  }
}

function convertListItem(node: TiptapNode): ListItemBlock {
  return {
    type: 'listItem',
    content: convertBlocks(node.content),
  }
}

function convertHorizontalRule(): HorizontalRuleBlock {
  return { type: 'horizontalRule' }
}

function convertImage(node: TiptapNode): ImageBlock {
  return {
    type: 'image',
    src: (node.attrs?.src as string) ?? '',
    alt: node.attrs?.alt as string | undefined,
    title: node.attrs?.title as string | undefined,
  }
}

function convertTranscribersNote(node: TiptapNode): TranscribersNoteBlock {
  return {
    type: 'transcribersNote',
    content: convertInlineContent(node.content),
  }
}

function convertPrintPageIndicator(node: TiptapNode): PrintPageIndicatorBlock {
  return {
    type: 'printPageIndicator',
    pageNumber: (node.attrs?.pageNumber as string) ?? '',
  }
}

function convertBlocks(nodes: TiptapNode[] | undefined): BlockNode[] {
  if (!nodes) return []
  const result: BlockNode[] = []
  for (const node of nodes) {
    switch (node.type) {
      case 'paragraph':
        result.push(convertParagraph(node))
        break
      case 'heading':
        result.push(convertHeading(node))
        break
      case 'bulletList':
        result.push(convertBulletList(node))
        break
      case 'orderedList':
        result.push(convertOrderedList(node))
        break
      case 'listItem':
        result.push(convertListItem(node))
        break
      case 'blockquote':
        result.push({ type: 'blockquote', content: convertBlocks(node.content) })
        break
      case 'codeBlock':
        result.push({
          type: 'codeBlock',
          language: node.attrs?.language as string | undefined,
          content: node.content?.[0]?.text ?? '',
        })
        break
      case 'horizontalRule':
        result.push(convertHorizontalRule())
        break
      case 'image':
        result.push(convertImage(node))
        break
      case 'transcribersNote':
        result.push(convertTranscribersNote(node))
        break
      case 'printPageIndicator':
        result.push(convertPrintPageIndicator(node))
        break
      default:
        // Unknown block types are silently skipped
        break
    }
  }
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a Tiptap JSON document (as produced by editor.getJSON()) into the
 * internal DocumentModel.
 */
export function tiptapJsonToDocumentModel(json: unknown): DocumentModel {
  const doc = json as TiptapNode
  return {
    schemaVersion: 1,
    content: convertBlocks(doc.content),
  }
}
