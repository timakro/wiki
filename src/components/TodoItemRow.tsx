import { type FC, useRef, useEffect, type KeyboardEvent } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { TodoItem } from '../lib/todo'

interface TodoItemRowProps {
  item: TodoItem
  isChecked?: boolean
  onToggle: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onAddBelow: (id: string) => void
  onDelete: (id: string) => void
  /** Props from @dnd-kit useSortable */
  setNodeRef?: (node: HTMLElement | null) => void
  style?: React.CSSProperties
  listeners?: Record<string, Function>
  attributes?: Record<string, any>
  /** Whether this row is the drag overlay (not interactive) */
  isDragOverlay?: boolean
}

export const TodoItemRow: FC<TodoItemRowProps> = ({
  item,
  isChecked = false,
  onToggle,
  onTextChange,
  onAddBelow,
  onDelete,
  setNodeRef,
  style,
  listeners,
  attributes,
  isDragOverlay = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when this is a newly created empty item
  useEffect(() => {
    if (item.text === '' && !isDragOverlay) {
      inputRef.current?.focus()
    }
  }, [item.id, item.text, isDragOverlay])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAddBelow(item.id)
    } else if (e.key === 'Backspace' && item.text === '') {
      e.preventDefault()
      onDelete(item.id)
    }
  }

  const rowContent = (
    <div
      className={`flex items-center gap-1.5 min-h-10 px-2 group ${
        isChecked ? 'opacity-50' : ''
      } ${isDragOverlay ? 'bg-white rounded-lg shadow-lg border border-gray-200' : ''}`}
      style={{
        paddingLeft: `${12 + item.indent * 24}px`,
        ...(isDragOverlay ? {} : style),
      }}
    >
      {/* Drag handle (always rendered, even in overlay, for visual consistency) */}
      <div
        {...(!isDragOverlay ? listeners ?? {} : {})}
        {...(!isDragOverlay ? attributes ?? {} : {})}
        className={`flex items-center justify-center w-6 h-8 shrink-0 text-gray-300 hover:text-gray-500 transition-colors touch-none ${
          isDragOverlay ? 'text-gray-400' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={isDragOverlay ? {} : { touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <label className="flex items-center justify-center w-5 h-5 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggle(item.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </label>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onKeyDown={handleKeyDown}
        className={`flex-1 min-w-0 bg-transparent border-none outline-none text-sm py-2 ${
          isChecked ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}
        spellCheck={false}
        autoComplete="off"
        enterKeyHint="enter"
      />

      {/* Delete button (visible on hover or when item/focus is within the row) */}
      {!isDragOverlay && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onDelete(item.id)}
          className="flex items-center justify-center w-8 h-8 shrink-0 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer"
          aria-label="Delete item"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  // If we have a ref from dnd-kit, wrap with it
  if (setNodeRef && !isDragOverlay) {
    return <div ref={setNodeRef}>{rowContent}</div>
  }

  return rowContent
}
