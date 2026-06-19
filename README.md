# BANA Editor

A browser-only rich-text editor for producing Microsoft Word (`.docx`) documents compatible with **Duxbury DBT** braille translation software and **BANA** (Braille Authority of North America) workflows.

Target braille system: **UEB (Unified English Braille)**.

---

## Features

- **Rich text editing** powered by [Tiptap](https://tiptap.dev/) — headings, lists, bold/italic/underline/strike, alignment, blockquotes, code blocks, and more.
- **Custom BANA semantic nodes**
  - 🟡 **Transcriber's Note** — editorial notes added by the braille transcriber (UEB TN indicators).
  - 🔵 **Print Page Indicator** — marks where a page break occurs in the print source.
- **Auto-save** — editor state is automatically persisted to IndexedDB and restored on reload.
- **DOCX export** — converts the editor document to a `.docx` file with BANA-approximate Word styles.
- **DOCX import** — reads existing `.docx` files back into the editor, preserving semantic structure.
- **100% client-side** — no backend, no cloud sync.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| Tiptap | ProseMirror-based rich text editor |
| docx | DOCX generation |
| JSZip + fast-xml-parser | DOCX inspection / import |
| idb | IndexedDB persistence wrapper |
| Tailwind CSS v4 | Styling |
| Vitest | Unit testing |
| Oxlint | Linting |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 26+
- [pnpm](https://pnpm.io/) 9+

If you have [mise](https://mise.jdx.dev/) installed, it will automatically use the correct Node version from `.mise.toml`.

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
pnpm test:ui       # browser UI
pnpm test:coverage # with coverage
```

### Lint

```bash
pnpm lint
```

---

## Project Structure

```
src/
  components/
    editor/
      Editor.tsx           # Main Tiptap editor with auto-save
      Toolbar.tsx          # Formatting toolbar
      MenuBar.tsx          # New / Import / Export actions
  extensions/
    TranscribersNote.tsx   # Custom Tiptap block node
    PrintPageIndicator.tsx # Custom Tiptap leaf node
  lib/
    document-model/
      types.ts             # Framework-agnostic document model types
      converter.ts         # Tiptap JSON → DocumentModel
    docx/
      export.ts            # DocumentModel → .docx download
      import.ts            # .docx → DocumentModel → Tiptap JSON
      parser.ts            # JSZip/fast-xml-parser DOCX utilities
      styles.ts            # BANA Word style name constants
    persistence/
      db.ts                # IndexedDB draft storage (idb)
  test/
    fixtures/              # Tiptap JSON fixture documents
    setup.ts               # Vitest global setup
```

---

## BANA / Duxbury Notes

> **Important**: The BANA Word style names used in this project (`TransNote`, `PrintPage`, etc.) are approximations based on publicly available BANA guidelines. They have **not** been validated against an official BANA `.dotx` template or tested in Duxbury DBT.

TODOs are left throughout the code where validation against official BANA templates or Duxbury behaviour is required. See particularly:

- `src/lib/docx/styles.ts` — style name constants
- `src/lib/docx/export.ts` — style application logic
- `src/extensions/TranscribersNote.tsx` — UEB TN indicator encoding
- `src/extensions/PrintPageIndicator.tsx` — UEB print page indicator encoding

The primary acceptance criterion is **successful import into Duxbury DBT**, not simply correct rendering in Microsoft Word.
