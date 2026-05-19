import { useRef, useEffect, type FC } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { OpenFile } from '../lib/types'

interface EditorProps {
  file: OpenFile
  content: string
  isDirty: boolean
  error: string | null
  onChange: (content: string) => void
  onClose: () => void
}

export const Editor: FC<EditorProps> = ({
  file,
  content,
  isDirty,
  error,
  onChange,
  onClose,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus the textarea when a file is opened
  useEffect(() => {
    textareaRef.current?.focus()
  }, [file.handle])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200 shrink-0 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer md:hidden"
          aria-label="Back to file tree"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {file.path}
          </h2>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full resize-none border-0 bg-white text-gray-900 p-4 text-sm font-mono leading-relaxed outline-none placeholder-gray-300"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        placeholder="Start typing..."
      />
    </div>
  )
}
