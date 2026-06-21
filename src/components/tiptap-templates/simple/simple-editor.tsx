"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"

// --- BANA Extensions ---
import { TranscribersNote } from "@/extensions/TranscribersNote"
import { PrintPageIndicator } from "@/extensions/PrintPageIndicator"

// --- Persistence ---
import { saveDraft, loadDraft } from "@/lib/persistence/db"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { FileText, Bookmark } from "lucide-react"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

const AUTO_SAVE_DELAY = 1500

interface SimpleEditorProps {
  onContentChange?: (json: unknown) => void
  initialContent?: unknown
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  onInsertTranscribersNote,
  onInsertPrintPageIndicator,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  onInsertTranscribersNote: () => void
  onInsertPrintPageIndicator: () => void
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          variant="ghost"
          onClick={onInsertTranscribersNote}
          aria-label="Insert Transcriber's Note"
          tooltip="Transcriber's Note"
        >
          <FileText className="tiptap-button-icon" />
        </Button>
        <Button
          variant="ghost"
          onClick={onInsertPrintPageIndicator}
          aria-label="Insert Print Page Indicator"
          tooltip="Print Page Indicator"
        >
          <Bookmark className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ onContentChange, initialContent }: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main")
  const toolbarRef = useRef<HTMLDivElement>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const [isLoaded, setIsLoaded] = useState(false)
  const [pageNumberInput, setPageNumberInput] = useState("")
  const [showPageNumberDialog, setShowPageNumberDialog] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      CharacterCount,
      Placeholder.configure({ placeholder: "Start typing your document…" }),
      TranscribersNote,
      PrintPageIndicator,
    ],
    content: undefined,
    onUpdate({ editor: ed }) {
      setSaveStatus("unsaved")
      const json = ed.getJSON()
      onContentChange?.(json)

      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving")
        await saveDraft(json)
        setSaveStatus("saved")
      }, AUTO_SAVE_DELAY)
    },
  })

  // Restore draft on mount, or apply content from DOCX import
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (initialContent) {
        if (!cancelled && editor) {
          editor.commands.setContent(
            initialContent as Parameters<typeof editor.commands.setContent>[0],
          )
          setSaveStatus("unsaved")
        }
        if (!cancelled) setIsLoaded(true)
        return
      }

      const saved = await loadDraft()
      if (!cancelled && saved && editor) {
        editor.commands.setContent(
          saved as Parameters<typeof editor.commands.setContent>[0],
        )
        setSaveStatus("saved")
      }
      if (!cancelled) setIsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
    // Only runs when the editor instance is first created. Remounting with a
    // new key handles the case where initialContent changes (DOCX import).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleInsertTranscribersNote = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent({ type: "transcribersNote" }).run()
  }, [editor])

  const handleInsertPrintPageIndicator = useCallback(() => {
    setShowPageNumberDialog(true)
  }, [])

  const handleConfirmPageNumber = useCallback(() => {
    if (!editor) return
    const num = pageNumberInput.trim()
    editor
      .chain()
      .focus()
      .insertContent({
        type: "printPageIndicator",
        attrs: { pageNumber: num || "?" },
      })
      .run()
    setPageNumberInput("")
    setShowPageNumberDialog(false)
  }, [editor, pageNumberInput])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  const charCount = editor?.storage.characterCount?.characters?.() ?? 0
  const wordCount = editor?.storage.characterCount?.words?.() ?? 0

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={
            isMobile
              ? { bottom: `calc(100% - ${height - rect.y}px)` }
              : undefined
          }
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              onInsertTranscribersNote={handleInsertTranscribersNote}
              onInsertPrintPageIndicator={handleInsertPrintPageIndicator}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div className="simple-editor-scroll-area">
          {!isLoaded && (
            <div className="simple-editor-loading">
              <span>Loading…</span>
            </div>
          )}
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
        </div>

        <div className="simple-editor-status-bar">
          <span>
            {wordCount} word{wordCount !== 1 ? "s" : ""} · {charCount}{" "}
            character{charCount !== 1 ? "s" : ""}
          </span>
          <span
            className={
              saveStatus === "unsaved"
                ? "simple-editor-status--unsaved"
                : "simple-editor-status--saved"
            }
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "unsaved"
                ? "Unsaved changes"
                : "All changes saved"}
          </span>
        </div>
      </EditorContext.Provider>

      {showPageNumberDialog && (
        <div className="simple-editor-dialog-overlay">
          <div className="simple-editor-dialog">
            <h2>Insert Print Page Indicator</h2>
            <p>Enter the print page number (e.g. "42", "xiv"):</p>
            <input
              type="text"
              value={pageNumberInput}
              onChange={(e) => setPageNumberInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmPageNumber()}
              placeholder="Page number"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className="simple-editor-dialog-actions">
              <button
                type="button"
                onClick={() => {
                  setShowPageNumberDialog(false)
                  setPageNumberInput("")
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="simple-editor-dialog-confirm"
                onClick={handleConfirmPageNumber}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
