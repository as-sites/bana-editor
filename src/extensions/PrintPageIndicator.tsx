/**
 * Tiptap extension: Print Page Indicator
 *
 * A Print Page Indicator marks where a page break occurs in the printed
 * source document.  In UEB braille, print page changes are indicated using
 * a cell-5 indicator followed by the page number.
 *
 * This extension is implemented as a leaf (atomic) node because a page
 * indicator has no inner content – it only carries the page number attribute.
 *
 * TODO: Validate exact BANA/UEB requirements for print page indicators.
 */

import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

// ─── React view component ─────────────────────────────────────────────────────

function PrintPageIndicatorView({ node }: NodeViewProps) {
  const pageNumber = node.attrs.pageNumber as string

  return (
    <NodeViewWrapper>
      <div
        className="my-2 flex items-center gap-2 select-none"
        data-node-type="printPageIndicator"
        contentEditable={false}
      >
        <div className="h-px flex-1 bg-blue-300" />
        <span className="rounded border border-blue-400 bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700">
          p.{pageNumber || '?'}
        </span>
        <div className="h-px flex-1 bg-blue-300" />
      </div>
    </NodeViewWrapper>
  )
}

// ─── Extension definition ─────────────────────────────────────────────────────

export const PrintPageIndicator = Node.create({
  name: 'printPageIndicator',

  group: 'block',

  // Leaf node – no inner content
  atom: true,

  addAttributes() {
    return {
      pageNumber: {
        default: '',
        parseHTML: element => element.getAttribute('data-page-number') ?? '',
        renderHTML: attributes => ({
          'data-page-number': (attributes.pageNumber as string) ?? '',
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-node-type="printPageIndicator"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-node-type': 'printPageIndicator',
        class: 'print-page-indicator',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PrintPageIndicatorView)
  },
})
