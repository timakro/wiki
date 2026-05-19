import { KeyRound } from 'lucide-react'
import type { FC } from 'react'

interface ReactivatePromptProps {
  onReactivate: () => void
}

export const ReactivatePrompt: FC<ReactivatePromptProps> = ({ onReactivate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Key icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
          <KeyRound className="w-10 h-10 text-blue-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Needed</h1>
          <p className="mt-2 text-gray-500 leading-relaxed">
            Your wiki folder was found, but browser permission to access it has expired.
            Tap the button below to re-grant access.
          </p>
        </div>

        <button
          type="button"
          onClick={onReactivate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-sm hover:bg-blue-500 active:scale-[0.97] transition-all cursor-pointer"
        >
          <KeyRound className="w-5 h-5" />
          Re-activate Folder
        </button>

        <p className="text-xs text-gray-400">
          A browser prompt will ask you to confirm access to your wiki folder.
        </p>
      </div>
    </div>
  )
}
