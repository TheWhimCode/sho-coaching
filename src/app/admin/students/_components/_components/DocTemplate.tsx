// src/app/admin/students/_components/_components/DocTemplate.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NoteSession as Session } from '@/app/admin/students/_components/SessionNotes';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

type Props = { session: Session; onChange?: (patch: Partial<Session>) => void };

const DEFAULT_TEMPLATE = `## General
- 

## Earlygame
- 

## Midgame
- 

## Lategame
- 
`;

export default function DocTemplate({ session, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 🔹 Editable title (independent of markdown)
  const [title, setTitle] = useState(
    session.title || `Session ${session.number ?? ''}`.trim()
  );
  useEffect(() => {
    setTitle(session.title || `Session ${session.number ?? ''}`.trim());
  }, [session.id, session.title, session.number]);

  const initialMarkdown = useMemo(
    () => (session.content?.trim() ? session.content : DEFAULT_TEMPLATE),
    [session.content]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Placeholder.configure({ placeholder: 'Start writing the session notes…' }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none ' +
          'w-full min-h-[360px] block ' +
          'rounded-xl bg-transparent text-zinc-100 ' +
          'outline-none focus:ring-2 focus:ring-zinc-500/40 p-6 leading-2',
              spellcheck: 'false',          // ⬅️ turn off red squiggles

      },
    },
    immediatelyRender: false,
    onUpdate({ editor }) {
      const md =
        ((editor.storage as any).markdown?.getMarkdown?.() as string) ?? '';
      onChange?.({ content: md });
    },
  });

  // Seed once on mount
  useEffect(() => {
    if (!editor) return;
    const hasSetMarkdown = typeof (editor.commands as any).setMarkdown === 'function';
    if (hasSetMarkdown) {
      (editor.chain() as any).setMarkdown(initialMarkdown).run();
    } else {
      editor.commands.setContent(initialMarkdown);
    }
    if (!session.content?.trim()) onChange?.({ content: initialMarkdown });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Reseed when switching sessions
  useEffect(() => {
    if (!editor) return;
    const hasSetMarkdown = typeof (editor.commands as any).setMarkdown === 'function';
    if (hasSetMarkdown) {
      (editor.chain() as any).setMarkdown(initialMarkdown).run();
    } else {
      editor.commands.setContent(initialMarkdown);
    }
    if (!session.content?.trim()) onChange?.({ content: initialMarkdown });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, editor]);

  // Also save on blur — cleanup returns void
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const md =
        ((editor.storage as any).markdown?.getMarkdown?.() as string) ?? '';
      onChange?.({ content: md });
    };
    editor.on('blur', handler);
    return () => { editor.off('blur', handler); };
  }, [editor, onChange]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 🔹 Editable title (not markdown) */}
      <div className="flex items-center justify-between gap-3">
        <input
          className="flex-1 bg-transparent text-white text-xl font-semibold outline-none border border-transparent
                     focus:border-zinc-600/60 rounded-md px-2 py-1"
          value={title}
          placeholder={`Session ${session.number ?? ''}`.trim() || 'Session'}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            onChange?.({ title: v });
          }}
          onBlur={(e) => onChange?.({ title: e.target.value.trim() })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          }}
        />
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
  );
}
