/**
 * Internal document model types.
 *
 * This model sits between Tiptap's JSON representation and the DOCX output.
 * It uses UEB (Unified English Braille) as the target braille system.
 *
 * Design goals:
 * - Framework-agnostic: no Tiptap or docx imports
 * - Explicit semantic structure: all node types are named and stable
 * - Easily serialisable / deserialisable
 */

// ─── Inline marks ────────────────────────────────────────────────────────────

export type BoldMark = { type: 'bold' }
export type ItalicMark = { type: 'italic' }
export type UnderlineMark = { type: 'underline' }
export type StrikeMark = { type: 'strike' }
export type SuperscriptMark = { type: 'superscript' }
export type SubscriptMark = { type: 'subscript' }
export type HighlightMark = { type: 'highlight'; color?: string }
export type CodeMark = { type: 'code' }
export type LinkMark = { type: 'link'; href: string; title?: string }

export type InlineMark =
  | BoldMark
  | ItalicMark
  | UnderlineMark
  | StrikeMark
  | SuperscriptMark
  | SubscriptMark
  | HighlightMark
  | CodeMark
  | LinkMark

// ─── Inline content ──────────────────────────────────────────────────────────

export interface TextNode {
  type: 'text'
  text: string
  marks?: InlineMark[]
}

export interface HardBreakNode {
  type: 'hardBreak'
}

export type InlineNode = TextNode | HardBreakNode

// ─── Block content ───────────────────────────────────────────────────────────

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

export interface ParagraphBlock {
  type: 'paragraph'
  alignment?: TextAlignment
  content: InlineNode[]
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingBlock {
  type: 'heading'
  level: HeadingLevel
  content: InlineNode[]
}

export interface BulletListBlock {
  type: 'bulletList'
  items: ListItemBlock[]
}

export interface OrderedListBlock {
  type: 'orderedList'
  start: number
  items: ListItemBlock[]
}

export interface ListItemBlock {
  type: 'listItem'
  content: BlockNode[]
}

export interface BlockquoteBlock {
  type: 'blockquote'
  content: BlockNode[]
}

export interface CodeBlockBlock {
  type: 'codeBlock'
  language?: string
  content: string
}

export interface HorizontalRuleBlock {
  type: 'horizontalRule'
}

export interface ImageBlock {
  type: 'image'
  src: string
  alt?: string
  title?: string
}

// ─── Semantic nodes (BANA-specific) ──────────────────────────────────────────

/**
 * Transcriber's Note (TN): editorial note added by the braille transcriber.
 * In UEB, Transcriber's Notes are enclosed in special indicators.
 *
 * TODO: validate exact BANA formatting requirements for TNs.
 */
export interface TranscribersNoteBlock {
  type: 'transcribersNote'
  content: InlineNode[]
}

/**
 * Print Page Indicator: marks where a page break occurs in the print copy.
 * In UEB, this is typically rendered as a running head or cell-5 indicator.
 *
 * TODO: validate exact BANA formatting requirements for print page indicators.
 */
export interface PrintPageIndicatorBlock {
  type: 'printPageIndicator'
  /** The print page number or label (e.g. "42", "xiv") */
  pageNumber: string
}

export type SemanticBlock = TranscribersNoteBlock | PrintPageIndicatorBlock

// ─── Union of all block node types ───────────────────────────────────────────

export type BlockNode =
  | ParagraphBlock
  | HeadingBlock
  | BulletListBlock
  | OrderedListBlock
  | ListItemBlock
  | BlockquoteBlock
  | CodeBlockBlock
  | HorizontalRuleBlock
  | ImageBlock
  | TranscribersNoteBlock
  | PrintPageIndicatorBlock

// ─── Document root ───────────────────────────────────────────────────────────

export interface DocumentModel {
  /** Schema version – bump when the model changes in a breaking way */
  schemaVersion: 1
  title?: string
  content: BlockNode[]
}
