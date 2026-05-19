import { useState, type FC } from 'react'
import { RefreshCw, X, Loader2, FileText, ChevronRight, File } from 'lucide-react'
import type { FileNode } from '../lib/types'

interface FileTreeProps {
  tree: FileNode[]
  isLoading: boolean
  error: string | null
  onSelectFile: (handle: FileSystemFileHandle, name: string, path: string) => void
  onRefresh: () => void
  onClose: () => void
}

export const FileTree: FC<FileTreeProps> = ({
  tree,
  isLoading,
  error,
  onSelectFile,
  onRefresh,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 shrink-0">
        <h2 className="text-base font-semibold text-gray-900">Files</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Refresh file tree"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close folder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading files...</span>
            </div>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No markdown files found</p>
            <p className="text-xs text-gray-300 mt-1">Add some .md files to this folder</p>
          </div>
        ) : (
          <div className="py-1">
            {tree.map((node) => (
              <TreeNode
                key={`${node.kind}-${node.name}`}
                node={node}
                depth={0}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Recursive TreeNode ──────────────────────────────────────────

interface TreeNodeProps {
  node: FileNode
  depth: number
  onSelectFile: (handle: FileSystemFileHandle, name: string, path: string) => void
}

const TreeNode: FC<TreeNodeProps> = ({ node, depth, onSelectFile }) => {
  const [expanded, setExpanded] = useState(depth < 1)

  if (node.kind === 'directory') {
    const hasChildren = node.children && node.children.length > 0

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 w-full px-4 py-1.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {/* Chevron (same column as file icon) */}
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <ChevronRight
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            ) : (
              <span className="w-3.5" />
            )}
          </span>

          <span className="text-sm text-gray-700 truncate">{node.name}</span>
        </button>

        {expanded && hasChildren && (
          <div>
            {node.children!.map((child) => (
              <TreeNode
                key={`${child.kind}-${child.name}`}
                node={child}
                depth={depth + 1}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // File node
  return (
    <button
      type="button"
      onClick={() => onSelectFile(node.handle as FileSystemFileHandle, node.name, node.name)}
      className="flex items-center gap-2 w-full px-4 py-1.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      {/* File icon */}
      <File className="w-4 h-4 shrink-0 text-gray-400" />
      <span className="text-sm text-gray-700 truncate">{node.name}</span>
    </button>
  )
}
