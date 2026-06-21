/**
 * Tiptap extension: Transcriber's Note
 *
 * A Transcriber's Note (TN) is an editorial note added by the braille
 * transcriber, not part of the original print text.  In UEB it is enclosed
 * within special Transcriber's Note opening/closing indicators.
 *
 * This extension implements TN as a block-level node that can contain inline
 * content.  It is rendered with a distinctive visual style so the author can
 * easily identify it in the editor.
 *
 * TODO: Validate exact BANA/UEB requirements for Transcriber's Notes.
 */

import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'

// ─── React view component ─────────────────────────────────────────────────────

function TranscribersNoteView(_props: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div
        className="my-3 rounded border-l-4 border-amber-500 bg-amber-50 px-4 py-2 text-amber-900"
        data-node-type="transcribersNote"
      >
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-600">
          Transcriber's Note
        </span>
        <NodeViewContent className="text-sm" />
      </div>
    </NodeViewWrapper>
  )
}

// ─── Extension definition ─────────────────────────────────────────────────────

export const TranscribersNote = Node.create({
  name: 'transcribersNote',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {}
  },

  parseHTML() {
    return [{ tag: 'div[data-node-type="transcribersNote"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-node-type': 'transcribersNote', class: 'transcribers-note' }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TranscribersNoteView)
  },
})
