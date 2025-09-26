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

  // Title is read-only and already computed from sessionType by parent
  const title = session.title || `Session ${session.number ?? ''}`.trim();

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
        spellcheck: 'false',
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

  // Save on blur
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
      {/* Read-only title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-white text-xl font-semibold">
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
  );
}
