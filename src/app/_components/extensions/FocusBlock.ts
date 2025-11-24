import { Node, mergeAttributes } from '@tiptap/core'

const FocusBlock = Node.create({
  name: 'focusBlock',
  group: 'block',
  content: 'block+',
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-focus-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-focus-block': '' }), 0]
  },

  addCommands() {
    return {
      toggleFocusBlock:
        () =>
        ({ state, commands }: any) => {
          const { selection } = state
          const { $from } = selection

          const node = $from.parent
          const isList =
            node.type.name === 'listItem' ||
            node.type.name === 'bulletList' ||
            node.type.name === 'orderedList'

          const before = $from.node($from.depth - 1)
          const isLeadPlusList =
            before &&
            before.type.name === 'paragraph' &&
            node.type.name === 'orderedList'

          if (isList || isLeadPlusList) {
            return (commands as any).toggleWrap(this.name)
          }

          return false
        },
    } as any
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-f': () =>
        (this.editor.commands as any).toggleFocusBlock(),
    }
  },
})

export default FocusBlock
