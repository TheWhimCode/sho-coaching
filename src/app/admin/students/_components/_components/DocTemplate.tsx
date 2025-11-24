'use client'

import { useEffect, useMemo, useState } from 'react'
import type { NoteSession as Session } from '@/app/admin/students/_components/SessionNotes'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import FocusBlock from '@/app/_components/extensions/FocusBlock'

type Props = { session: Session; onChange?: (patch: Partial<Session>) => void }

const DEFAULT_HTML = `
  <h2>General</h2>
  <ul><li></li></ul>

  <h2>Earlygame</h2>
  <ul><li></li></ul>

  <h2>Midgame</h2>
  <ul><li></li></ul>

  <h2>Lategame</h2>
  <ul><li></li></ul>
`.trim()

export default function DocTemplate({ session, onChange }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [title, setTitle] = useState(session.title)
  useEffect(() => {
    setTitle(session.title)
  }, [session.id, session.title])

  const initialHTML = useMemo(() => {
    const raw = (session.content ?? '').trim()
    if (!raw) return DEFAULT_HTML
    const looksLikeHtml = raw.startsWith('<')
    return looksLikeHtml ? raw : DEFAULT_HTML
  }, [session.content])

  const editor = useEditor({
    extensions: [
      FocusBlock.configure({}),
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Placeholder.configure({ placeholder: 'Start writing the session notes…' }),
    ],
    editorProps: {
      attributes: {
        class:
          'tiptap prose prose-invert prose-normalized ' +
          'max-w-[62ch] w-full min-h-[360px] block ' +
          'rounded-xl bg-transparent text-zinc-100 ' +
          'text-[17px] leading-[1.55] ' +
          'outline-none focus:ring-2 focus:ring-zinc-500/40 p-6',
        spellcheck: 'false',
      },
    },
    content: '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange?.({ content: html })
    },
  })

  // Seed once on mount
  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(initialHTML, { emitUpdate: false })
    if (!session.content?.trim()) onChange?.({ content: initialHTML })
  }, [editor])

  // Reseed when switching sessions
  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(initialHTML, { emitUpdate: false })
    if (!session.content?.trim()) onChange?.({ content: initialHTML })
  }, [session.id, editor])

  // Save on blur
// Save on blur
useEffect((): void | (() => void) => {
  if (!editor) return
  const handler = () => {
    const html = editor.getHTML()
    onChange?.({ content: html })
  }
  editor.on('blur', handler)
  return () => editor.off('blur', handler)
}, [editor, onChange])


  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-white text-xl font-semibold px-2 py-1">
          {title}
        </div>
        <span className="text-xs text-zinc-400">
          {new Date(session.createdAt).toLocaleString()}
        </span>
      </div>

      {mounted ? (
        <EditorContent editor={editor} key={session.id} />
      ) : (
        <div className="w-full min-h-[360px] rounded-xl bg-transparent p-4" />
      )}
    </div>
  )
}
