import { Folder, FolderOpen } from 'lucide-react'
import type { FC } from 'react'

interface FolderPickerProps {
  onOpen: () => void
}

export const FolderPicker: FC<FolderPickerProps> = ({ onOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Folder icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Folder className="w-10 h-10 text-blue-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wiki</h1>
          <p className="mt-2 text-gray-500 leading-relaxed">
            Open a folder containing your markdown files to browse and edit them.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-sm hover:bg-blue-500 active:scale-[0.97] transition-all cursor-pointer"
        >
          <FolderOpen className="w-5 h-5" />
          Open Wiki Folder
        </button>

        <p className="text-xs text-gray-400">
          Your files stay on your device. No data is uploaded anywhere.
        </p>
      </div>
    </div>
  )
}