/**
 * Tiptap JSON fixture documents for use in tests.
 */

/** Minimal empty document */
export const emptyDoc = {
  type: 'doc',
  content: [],
}

/** Simple heading and paragraph document */
export const simpleHeadingDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello World' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is a paragraph.' }],
    },
  ],
}

/** Document with a Transcriber's Note */
export const transcribersNoteDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Before the note.' }],
    },
    {
      type: 'transcribersNote',
      content: [{ type: 'text', text: 'This word has been replaced.' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'After the note.' }],
    },
  ],
}

/** Document with a Print Page Indicator */
export const printPageIndicatorDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'End of page 41.' }],
    },
    {
      type: 'printPageIndicator',
      attrs: { pageNumber: '42' },
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Start of page 42.' }],
    },
  ],
}

/** Document with mixed formatting marks */
export const formattedDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Bold ', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'italic ', marks: [{ type: 'italic' }] },
        { type: 'text', text: 'underlined', marks: [{ type: 'underline' }] },
      ],
    },
  ],
}

/** Document with a bullet list */
export const bulletListDoc = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Item one' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Item two' }],
            },
          ],
        },
      ],
    },
  ],
}
