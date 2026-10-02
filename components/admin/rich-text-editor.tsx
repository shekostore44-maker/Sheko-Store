"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react"

/**
 * Small WYSIWYG editor for product descriptions. Stores HTML; the store
 * sanitizes it before rendering (phase 4).
 */
export function RichTextEditor({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (html: string) => void
  id?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: value,
    immediatelyRender: false, // avoids a hydration mismatch with server rendering
    shouldRerenderOnTransaction: true, // keeps toolbar active states in sync
    editorProps: {
      attributes: {
        id: id ?? "",
        dir: "rtl",
        class:
          "prose-sheko min-h-40 px-3 py-2.5 text-sm leading-relaxed outline-none [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  })

  const tools = editor
    ? [
        {
          icon: Heading2,
          label: "عنوان",
          active: editor.isActive("heading", { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          icon: Heading3,
          label: "عنوان فرعي",
          active: editor.isActive("heading", { level: 3 }),
          run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          icon: Bold,
          label: "عريض",
          active: editor.isActive("bold"),
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          icon: Italic,
          label: "مائل",
          active: editor.isActive("italic"),
          run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          icon: List,
          label: "قائمة نقطية",
          active: editor.isActive("bulletList"),
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          icon: ListOrdered,
          label: "قائمة مرقمة",
          active: editor.isActive("orderedList"),
          run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          icon: Undo2,
          label: "تراجع",
          active: false,
          run: () => editor.chain().focus().undo().run(),
        },
        {
          icon: Redo2,
          label: "إعادة",
          active: false,
          run: () => editor.chain().focus().redo().run(),
        },
      ]
    : []

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 overflow-hidden rounded-lg border focus-within:ring-3">
      <div
        role="toolbar"
        aria-label="تنسيق الوصف"
        className="bg-muted flex flex-wrap gap-1 border-b p-1.5"
      >
        {tools.map(({ icon: Icon, label, active, run }) => (
          <button
            key={label}
            type="button"
            onClick={run}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={`rounded-md p-1.5 transition ${active ? "bg-brand-navy text-brand-ice" : "text-brand-navy hover:bg-white"}`}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
