import { ArrowLeft } from 'lucide-react'
import type { FC } from 'react'

interface TopBarProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  right?: React.ReactNode
}

export const TopBar: FC<TopBarProps> = ({ title, onBack, showBack, right }) => {
  return (
    <header className="flex items-center h-14 px-4 border-b border-gray-200 bg-white shrink-0 gap-3">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
          aria-label="Back to file tree"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <h1 className="text-base font-semibold text-gray-900 truncate flex-1">
        {title}
      </h1>

      {right && <div className="flex items-center gap-1">{right}</div>}
    </header>
  )
}
