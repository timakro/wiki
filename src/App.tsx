import { useState, type FC } from 'react'
import { Loader2, FileText } from 'lucide-react'
import type { ViewState } from './lib/types'
import { usePersistedFolder } from './hooks/usePersistedFolder'
import { useFileTree } from './hooks/useFileTree'
import { useFileEditor } from './hooks/useFileEditor'
import { useMediaQuery } from './hooks/useMediaQuery'
import { FolderPicker } from './components/FolderPicker'
import { ReactivatePrompt } from './components/ReactivatePrompt'
import { FileTree } from './components/FileTree'
import { Editor } from './components/Editor'

const App: FC = () => {
  const { folderHandle, permissionState, openFolder, reactivate, closeFolder } =
    usePersistedFolder()
  const { tree, isLoading, error: treeError, refresh } = useFileTree(folderHandle)
  const {
    openFile,
    content,
    isDirty,
    error: editorError,
    open: openFileEditor,
    setContent,
    close: closeFileEditor,
  } = useFileEditor()

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [view, setView] = useState<ViewState>('tree')

  // -- Handlers -------------------------------------------------------

  const handleSelectFile = (
    handle: FileSystemFileHandle,
    name: string,
    path: string
  ) => {
    openFileEditor(handle, name, path)
    if (!isDesktop) {
      setView('editor')
    }
  }

  const handleGoBack = () => {
    setView('tree')
  }

  const handleClose = () => {
    closeFileEditor()
    closeFolder()
  }

  // -- Loading state ---------------------------------------------------

  if (permissionState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Restoring folder...</span>
        </div>
      </div>
    )
  }

  // -- Handle needs reactivation (prompt state) ------------------------

  if (permissionState === 'prompt') {
    return <ReactivatePrompt onReactivate={reactivate} />
  }

  // -- No folder selected: show the picker -----------------------------

  if (!folderHandle) {
    return <FolderPicker onOpen={openFolder} />
  }

  // -- Folder selected: desktop layout (sidebar + editor) -------------

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[280px_1fr] h-screen bg-white overflow-hidden">
        {/* Sidebar */}
        <FileTree
          tree={tree}
          isLoading={isLoading}
          error={treeError}
          onSelectFile={handleSelectFile}
          onRefresh={refresh}
          onClose={closeFolder}
        />

        {/* Main area */}
        <div className="flex flex-col h-full overflow-hidden">
          {openFile ? (
            <Editor
              file={openFile}
              content={content}
              isDirty={isDirty}
              error={editorError}
              onChange={setContent}
              onClose={handleGoBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-sm">Select a markdown file to start editing</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // -- Mobile layout: view switching ----------------------------------

  if (view === 'editor' && openFile) {
    return (
      <div className="h-screen bg-white overflow-hidden">
        <Editor
          file={openFile}
          content={content}
          isDirty={isDirty}
          error={editorError}
          onChange={setContent}
          onClose={handleGoBack}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-white overflow-hidden">
      <FileTree
        tree={tree}
        isLoading={isLoading}
        error={treeError}
        onSelectFile={handleSelectFile}
        onRefresh={refresh}
        onClose={handleClose}
      />
    </div>
  )
}

export default App
