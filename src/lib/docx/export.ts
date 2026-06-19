/**
 * DOCX export pipeline.
 *
 * Converts the internal DocumentModel into a .docx file and triggers a
 * browser download.
 *
 * Pipeline:
 *   DocumentModel → docx Document → Blob → browser download
 *
 * Limitations / TODOs:
 * - Style definitions are approximated. Without the official BANA .dotx
 *   template we cannot guarantee Duxbury compatibility.
 * - Images are not yet exported (only alt text is preserved).
 * - Table support is not yet implemented.
 *
 * TODO: Validate output against Duxbury DBT.
 * TODO: Import and reuse style definitions from an official BANA .dotx template.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Packer,
  HighlightColor,
  type IParagraphOptions,
  type IRunOptions,
} from 'docx'
import { saveAs } from 'file-saver'

import type {
  BlockNode,
  DocumentModel,
  InlineNode,
  InlineMark,
  ParagraphBlock,
  HeadingBlock,
  ListItemBlock,
} from '../document-model/types.ts'
import { BANA_STYLES, HEADING_STYLE_MAP } from './styles.ts'

// ─── Inline content helpers ───────────────────────────────────────────────────

function marksToRunOptions(marks: InlineMark[]): IRunOptions {
  let bold: boolean | undefined
  let italics: boolean | undefined
  let underline: {} | undefined
  let strike: boolean | undefined
  let superScript: boolean | undefined
  let subScript: boolean | undefined
  let highlight: (typeof HighlightColor)[keyof typeof HighlightColor] | undefined
  let font: string | undefined

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        bold = true
        break
      case 'italic':
        italics = true
        break
      case 'underline':
        underline = {}
        break
      case 'strike':
        strike = true
        break
      case 'superscript':
        superScript = true
        break
      case 'subscript':
        subScript = true
        break
      case 'highlight':
        highlight = HighlightColor.YELLOW
        break
      case 'code':
        font = 'Courier New'
        break
    }
  }

  return {
    ...(bold !== undefined && { bold }),
    ...(italics !== undefined && { italics }),
    ...(underline !== undefined && { underline }),
    ...(strike !== undefined && { strike }),
    ...(superScript !== undefined && { superScript }),
    ...(subScript !== undefined && { subScript }),
    ...(highlight !== undefined && { highlight }),
    ...(font !== undefined && { font }),
  }
}

function inlineNodesToRuns(nodes: InlineNode[]): TextRun[] {
  const runs: TextRun[] = []
  for (const node of nodes) {
    if (node.type === 'text') {
      const runOptions = marksToRunOptions(node.marks ?? [])
      runs.push(new TextRun({ text: node.text, ...runOptions }))
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ break: 1 }))
    }
  }
  // Ensure at least one run so paragraphs are not empty
  if (runs.length === 0) {
    runs.push(new TextRun(''))
  }
  return runs
}

// ─── Alignment mapping ────────────────────────────────────────────────────────

type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType]

function mapAlignment(alignment: string | undefined): AlignmentValue | undefined {
  switch (alignment) {
    case 'center':
      return AlignmentType.CENTER
    case 'right':
      return AlignmentType.RIGHT
    case 'justify':
      return AlignmentType.JUSTIFIED
    default:
      return undefined
  }
}

// ─── Block converters ─────────────────────────────────────────────────────────

function convertParagraph(block: ParagraphBlock): Paragraph {
  const alignment = mapAlignment(block.alignment)
  const options: IParagraphOptions = {
    style: BANA_STYLES.Normal,
    children: inlineNodesToRuns(block.content),
    ...(alignment !== undefined && { alignment }),
  }
  return new Paragraph(options)
}

type HeadingLevelValue = (typeof HeadingLevel)[keyof typeof HeadingLevel]

const HEADING_LEVEL_MAP: Record<number, HeadingLevelValue> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

function convertHeading(block: HeadingBlock): Paragraph {
  const heading = HEADING_LEVEL_MAP[block.level] ?? HeadingLevel.HEADING_1
  const style = HEADING_STYLE_MAP[block.level] ?? BANA_STYLES.Heading1
  return new Paragraph({
    heading,
    style,
    children: inlineNodesToRuns(block.content),
  })
}

function convertListItem(item: ListItemBlock, style: string, level = 0): Paragraph[] {
  const paras: Paragraph[] = []
  for (const block of item.content) {
    if (block.type === 'paragraph') {
      paras.push(
        new Paragraph({
          style,
          indent: { left: level * 360 },
          children: inlineNodesToRuns(block.content),
        }),
      )
    } else {
      // Nested lists / blocks inside list items
      paras.push(...convertBlock(block))
    }
  }
  return paras
}

function convertBlock(block: BlockNode): Paragraph[] {
  switch (block.type) {
    case 'paragraph':
      return [convertParagraph(block)]

    case 'heading':
      return [convertHeading(block)]

    case 'horizontalRule':
      return [new Paragraph({ children: [new PageBreak()] })]

    case 'bulletList': {
      const paras: Paragraph[] = []
      for (const item of block.items) {
        paras.push(...convertListItem(item, BANA_STYLES.ListBullet))
      }
      return paras
    }

    case 'orderedList': {
      const paras: Paragraph[] = []
      for (const item of block.items) {
        paras.push(...convertListItem(item, BANA_STYLES.ListNumber))
      }
      return paras
    }

    case 'listItem':
      return convertListItem(block, BANA_STYLES.Normal)

    case 'blockquote': {
      const paras: Paragraph[] = []
      for (const child of block.content) {
        paras.push(...convertBlock(child))
      }
      return paras
    }

    case 'codeBlock':
      return [
        new Paragraph({
          children: [new TextRun({ text: block.content, font: 'Courier New' })],
        }),
      ]

    case 'image':
      // TODO: Support actual image embedding. Currently outputs alt text only.
      return [
        new Paragraph({
          children: [new TextRun({ text: block.alt ?? '[image]', italics: true })],
        }),
      ]

    case 'transcribersNote':
      // TODO: Validate that 'TransNote' style is recognised by Duxbury DBT.
      return [
        new Paragraph({
          style: BANA_STYLES.TranscribersNote,
          children: inlineNodesToRuns(block.content),
        }),
      ]

    case 'printPageIndicator':
      // TODO: Validate that 'PrintPage' style is recognised by Duxbury DBT.
      return [
        new Paragraph({
          style: BANA_STYLES.PrintPageIndicator,
          children: [new TextRun({ text: block.pageNumber })],
        }),
      ]

    default:
      return []
  }
}

// ─── Consecutive empty paragraph removal ─────────────────────────────────────

/**
 * Remove consecutive empty paragraphs, keeping at most one.
 */
function deduplicateEmptyParagraphs(paragraphs: Paragraph[]): Paragraph[] {
  const result: Paragraph[] = []
  let prevWasEmpty = false
  for (const para of paragraphs) {
    const isEmpty = isParagraphEmpty(para)
    if (isEmpty && prevWasEmpty) continue
    result.push(para)
    prevWasEmpty = isEmpty
  }
  return result
}

function isParagraphEmpty(para: Paragraph): boolean {
  // Access the paragraph's root element children to check for non-empty runs.
  // We use the internal `root` property that docx exposes on XmlComponent.
  // This avoids serialising the entire object just to check for content.
  const root = (para as unknown as { root: unknown[] }).root
  if (!Array.isArray(root) || root.length === 0) return true
  // Any child beyond index 0 (the w:pPr properties element) indicates content
  return root.length <= 1
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a DocumentModel into a docx Document.
 */
export function documentModelToDocx(model: DocumentModel): Document {
  const allParagraphs: Paragraph[] = []

  for (const block of model.content) {
    allParagraphs.push(...convertBlock(block))
  }

  const paragraphs = deduplicateEmptyParagraphs(allParagraphs)

  return new Document({
    // TODO: Add BANA template styles once the official .dotx is available.
    styles: {
      paragraphStyles: [
        {
          id: BANA_STYLES.TranscribersNote,
          name: "Transcriber's Note",
          basedOn: BANA_STYLES.Normal,
          run: { italics: true },
          paragraph: { indent: { left: 720 } },
        },
        {
          id: BANA_STYLES.PrintPageIndicator,
          name: 'Print Page Indicator',
          basedOn: BANA_STYLES.Normal,
          run: { bold: true },
        },
        {
          id: BANA_STYLES.ListBullet,
          name: 'List Bullet',
          basedOn: BANA_STYLES.Normal,
          paragraph: { indent: { left: 360 } },
        },
        {
          id: BANA_STYLES.ListNumber,
          name: 'List Number',
          basedOn: BANA_STYLES.Normal,
          paragraph: { indent: { left: 360 } },
        },
      ],
    },
    sections: [
      {
        children: paragraphs,
      },
    ],
  })
}

/**
 * Export a DocumentModel to a .docx file and trigger browser download.
 */
export async function exportDocx(model: DocumentModel, filename = 'document.docx'): Promise<void> {
  const doc = documentModelToDocx(model)
  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename)
}
