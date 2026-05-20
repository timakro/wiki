import { useState, useCallback, useRef, useEffect, type FC } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import {
  parseTodoMarkdown,
  serializeTodoMarkdown,
  toggleItem,
  updateItemText,
  addItem,
  removeItem,
  isTodoContent,
  type TodoItem,
} from '../lib/todo'
import { TodoItemRow } from './TodoItemRow'

interface TodoEditorProps {
  content: string
  onChange: (content: string) => void
}

// ─── Sortable wrapper around TodoItemRow ───────────────────────────

interface SortableRowProps {
  item: TodoItem
  isChecked: boolean
  onToggle: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onAddBelow: (id: string) => void
  onDelete: (id: string) => void
  /** Suggestion props (only for unchecked items) */
  suggestions?: { id: string; text: string }[]
  suggestionRef?: React.RefObject<HTMLDivElement | null>
  onSelectSuggestion?: (id: string) => void
}

const SortableRow: FC<SortableRowProps> = ({
  item,
  isChecked,
  onToggle,
  onTextChange,
  onAddBelow,
  onDelete,
  suggestions,
  suggestionRef,
  onSelectSuggestion,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <TodoItemRow
        item={item}
        isChecked={isChecked}
        onToggle={onToggle}
        onTextChange={onTextChange}
        onAddBelow={onAddBelow}
        onDelete={onDelete}
        listeners={listeners}
        attributes={{ ...attributes, role: 'button', tabIndex: undefined }}
      />

      {/* Suggestion dropdown for this row */}
      {suggestions && suggestions.length > 0 && suggestionRef && onSelectSuggestion && (
        <div
          ref={suggestionRef}
          className="absolute left-[68px] right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSuggestion(s.id)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer truncate"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helper: reorder items within a checked/unchecked section ──────

function reorderSection(
  items: TodoItem[],
  checked: boolean,
  activeId: string,
  overId: string
): TodoItem[] {
  const sectionItems = items.filter((i) => i.checked === checked)
  const oldIdx = sectionItems.findIndex((i) => i.id === activeId)
  const newIdx = sectionItems.findIndex((i) => i.id === overId)

  if (oldIdx === -1 || newIdx === -1) return items

  const reordered = [...sectionItems]
  const [moved] = reordered.splice(oldIdx, 1)
  reordered.splice(newIdx, 0, moved)

  let sectionIdx = 0
  return items.map((item) => {
    if (item.checked === checked) {
      return reordered[sectionIdx++]
    }
    return item
  })
}

// ─── Main TodoEditor ────────────────────────────────────────────────

export const TodoEditor: FC<TodoEditorProps> = ({ content, onChange }) => {
  const [items, setItems] = useState<TodoItem[]>(() => parseTodoMarkdown(content))
  const [checkedCollapsed, setCheckedCollapsed] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const [suggestionSourceId, setSuggestionSourceId] = useState<string | null>(null)
  const [suggestionFilter, setSuggestionFilter] = useState('')
  const suggestionRef = useRef<HTMLDivElement>(null)

  // Track whether a content change came from our own sync vs externally
  const isInternalUpdateRef = useRef(false)
  const contentRef = useRef(content)

  // Re-parse when content changes externally (not from our own sync)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      // Change came from us — ignore to avoid feedback loop
      isInternalUpdateRef.current = false
      return
    }
    setItems(parseTodoMarkdown(content))
  }, [content])

  // Sync to parent via onChange whenever items change
  const sync = useCallback(
    (newItems: TodoItem[]) => {
      setItems(newItems)
      const markdown = serializeTodoMarkdown(newItems)
      contentRef.current = markdown
      isInternalUpdateRef.current = true
      onChange(markdown)
    },
    [onChange]
  )

  // ── Sensors (require slight movement to activate drag) ─────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // ── Drag handlers ───────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragId(null)

      if (!over || active.id === over.id) return

      const activeItem = items.find((i) => i.id === active.id)
      if (!activeItem) return

      // Reorder within the section
      const newItems = reorderSection(items, activeItem.checked, active.id as string, over.id as string)

      sync(newItems)
    },
    [items, sync]
  )

  // ── Item mutation handlers ──────────────────────────────────────

  const handleToggle = useCallback(
    (id: string) => {
      sync(toggleItem(items, id))
    },
    [items, sync]
  )

  const handleTextChange = useCallback(
    (id: string, text: string) => {
      sync(updateItemText(items, id, text))
    },
    [items, sync]
  )

  const handleAddBelow = useCallback(
    (id: string) => {
      sync(addItem(items, id))
    },
    [items, sync]
  )

  const handleAddEntry = useCallback(() => {
    // Add after the last unchecked item (or at very end if none unchecked)
    const lastUnchecked = [...items].reverse().find((i) => !i.checked)
    sync(addItem(items, lastUnchecked?.id))
  }, [items, sync])

  const handleDelete = useCallback(
    (id: string) => {
      sync(removeItem(items, id))
    },
    [items, sync]
  )

  // ── Suggestion logic ────────────────────────────────────────────

  const checkedItems = items.filter((i) => i.checked)
  const uncheckedItems = items.filter((i) => !i.checked)

  const filteredSuggestions =
    suggestionFilter.trim().length > 0
      ? checkedItems.filter((i) =>
          i.text.toLowerCase().includes(suggestionFilter.trim().toLowerCase())
        )
      : []

  const handleSuggestionTyping = useCallback(
    (id: string, text: string) => {
      setSuggestionSourceId(id)
      setSuggestionFilter(text)
    },
    []
  )

  const handleSelectSuggestion = useCallback(
    (checkedItemId: string) => {
      if (!suggestionSourceId) return

      // Uncheck the matched checked item
      let newItems = toggleItem(items, checkedItemId)

      // Remove the source item (it was the empty stub)
      newItems = removeItem(newItems, suggestionSourceId)

      sync(newItems)
      setSuggestionSourceId(null)
      setSuggestionFilter('')
    },
    [items, sync, suggestionSourceId]
  )

  // Close suggestions on click outside
  useEffect(() => {
    if (!suggestionSourceId) return
    const handleClick = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setSuggestionSourceId(null)
        setSuggestionFilter('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [suggestionSourceId])

  // ── Compute dragged item for overlay ────────────────────────────

  const draggedItem = activeDragId
    ? items.find((i) => i.id === activeDragId)
    : null

  // ── Render ──────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-white overflow-y-auto">
        {/* Unchecked items */}
        <div>
          {uncheckedItems.length > 0 && (
            <div className="relative">
              <SortableContext
                items={uncheckedItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {uncheckedItems.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    isChecked={false}
                    onToggle={handleToggle}
                    onTextChange={(id, text) => {
                      handleTextChange(id, text)
                      // Only trigger suggestions for fresh/empty entries
                      if (text.length <= 1) {
                        handleSuggestionTyping(id, text)
                      }
                    }}
                    onAddBelow={handleAddBelow}
                    onDelete={handleDelete}
                    suggestions={
                      suggestionSourceId === item.id && filteredSuggestions.length > 0
                        ? filteredSuggestions
                        : undefined
                    }
                    suggestionRef={suggestionSourceId === item.id ? suggestionRef : undefined}
                    onSelectSuggestion={handleSelectSuggestion}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>

        {/* Add entry button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleAddEntry}
            className="flex items-center gap-1.5 w-full min-h-10 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ paddingLeft: `${12}px`, paddingRight: '8px' }}
          >
            {/* Spacer matching drag handle width */}
            <span className="w-6 shrink-0" />
            {/* Plus icon where checkbox would be */}
            <span className="flex items-center justify-center w-5 h-5 shrink-0">
              <Plus className="w-4 h-4" />
            </span>
            <span className="py-2">Add entry</span>
          </button>
        </div>

        {/* Checked items section */}
        {checkedItems.length > 0 && (
          <div className="shrink-0 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCheckedCollapsed((c) => !c)}
              className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {checkedCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-500">
                {checkedItems.length} checked items
              </span>
            </button>

            {!checkedCollapsed && (
              <div className="pb-2">
                <SortableContext
                  items={checkedItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {checkedItems.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      isChecked={true}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      onAddBelow={handleAddBelow}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedItem ? (
          <TodoItemRow
            item={draggedItem}
            isChecked={draggedItem.checked}
            onToggle={() => {}}
            onTextChange={() => {}}
            onAddBelow={() => {}}
            onDelete={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// Re-export so Editor.tsx can use the same detection
export { isTodoContent }
