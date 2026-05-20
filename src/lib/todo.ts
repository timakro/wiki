export interface TodoItem {
  id: string
  text: string
  checked: boolean
  indent: number // 0 = top-level
}

const CHECKBOX_RE = /^(\s*)- \[([ x])\] (.*)/

/**
 * Detect whether markdown content is a todo-only list.
 * Heuristic: every non-empty line matches the checkbox pattern.
 */
export function isTodoContent(content: string): boolean {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (!CHECKBOX_RE.test(line)) return false
  }
  return lines.length > 0
}

/**
 * Parse checkbox markdown into TodoItem[].
 * Each item gets a random id. Indent = leading whitespace length / 2.
 */
export function parseTodoMarkdown(markdown: string): TodoItem[] {
  const items: TodoItem[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(CHECKBOX_RE)
    if (match) {
      const whitespace = match[1]
      const checked = match[2] === 'x'
      const text = match[3]
      items.push({
        id: crypto.randomUUID(),
        text,
        checked,
        indent: Math.floor(whitespace.length / 2),
      })
    }
    // Skip empty lines
  }

  return items
}

/**
 * Serialize TodoItem[] back to checkbox markdown.
 * Empty-text items are kept (they become `- [ ] ` lines).
 */
export function serializeTodoMarkdown(items: TodoItem[]): string {
  if (items.length === 0) return ''
  return items
    .map((item) => {
      const prefix = '  '.repeat(item.indent)
      const check = item.checked ? 'x' : ' '
      return `${prefix}- [${check}] ${item.text}`
    })
    .join('\n') + '\n'
}

// ─── Mutation helpers (all return new arrays) ──────────────────────

/**
 * Find the index of a descendant boundary given a starting index and its indent.
 * Returns the index of the first item at the same or lesser indent level,
 * or the end of the array.
 */
function getDescendantEndIndex(items: TodoItem[], startIndex: number): number {
  const baseIndent = items[startIndex].indent
  for (let i = startIndex + 1; i < items.length; i++) {
    if (items[i].indent <= baseIndent) return i
  }
  return items.length
}

/** Toggle a single item's checked state. */
function toggleSingle(items: TodoItem[], id: string): TodoItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  )
}

/**
 * Toggle an item's checked state. If the item is a parent (has descendants
 * at a deeper indent level), cascade check/uncheck to all descendants.
 */
export function toggleItem(items: TodoItem[], id: string): TodoItem[] {
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return items

  const toggled = toggleSingle(items, id)
  const newChecked = !items[idx].checked

  // Cascade to descendants if this item is checked/unchecked
  const end = getDescendantEndIndex(items, idx)
  const hasDescendants = end > idx + 1

  if (hasDescendants) {
    return toggled.map((item, i) => {
      if (i > idx && i < end) {
        return { ...item, checked: newChecked }
      }
      return item
    })
  }

  return toggled
}

/** Update the text of an item. */
export function updateItemText(items: TodoItem[], id: string, text: string): TodoItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, text } : item
  )
}

/**
 * Add a new empty item after the given `afterId` (or at the end if not provided).
 * If `text` is provided, use it.
 */
export function addItem(
  items: TodoItem[],
  afterId?: string,
  text = ''
): TodoItem[] {
  const newItem: TodoItem = {
    id: crypto.randomUUID(),
    text,
    checked: false,
    indent: 0,
  }

  if (!afterId) {
    return [...items, newItem]
  }

  const idx = items.findIndex((i) => i.id === afterId)
  if (idx === -1) return [...items, newItem]

  const result = [...items]
  result.splice(idx + 1, 0, newItem)
  return result
}

/** Remove an item by id. */
export function removeItem(items: TodoItem[], id: string): TodoItem[] {
  return items.filter((item) => item.id !== id)
}

/**
 * Reorder an item: move `activeId` before `overId`.
 */
export function reorderItem(
  items: TodoItem[],
  activeId: string,
  overId: string
): TodoItem[] {
  const activeIdx = items.findIndex((i) => i.id === activeId)
  const overIdx = items.findIndex((i) => i.id === overId)

  if (activeIdx === -1 || overIdx === -1) return items

  const result = [...items]
  const [moved] = result.splice(activeIdx, 1)
  // Re-find overIdx because splicing shifts indices
  const newOverIdx = result.findIndex((i) => i.id === overId)
  result.splice(newOverIdx, 0, moved)
  return result
}

/**
 * Change indent of an item by delta (±1), clamped to [0, 4].
 */
export function changeIndent(
  items: TodoItem[],
  id: string,
  delta: number
): TodoItem[] {
  return items.map((item) => {
    if (item.id !== id) return item
    const newIndent = Math.max(0, Math.min(4, item.indent + delta))
    return { ...item, indent: newIndent }
  })
}
