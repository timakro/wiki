import { useState, useEffect, useCallback } from 'react'
import { openWikiFolder, requestReadWritePermission } from '../lib/fs'
import { saveHandle, loadHandle, clearHandle } from '../lib/db'

interface UsePersistedFolderReturn {
  folderHandle: FileSystemDirectoryHandle | null
  isOpening: boolean
  openFolder: () => Promise<void>
  closeFolder: () => Promise<void>
}

export function usePersistedFolder(): UsePersistedFolderReturn {
  const [folderHandle, setFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null)
  const [isOpening, setIsOpening] = useState(true)

  // On mount, try to restore the folder handle from IndexedDB
  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const handle = await loadHandle()
        if (!handle || cancelled) {
          if (!cancelled) setIsOpening(false)
          return
        }

        const granted = await requestReadWritePermission(handle)
        if (!granted || cancelled) {
          // Permission denied or revoked — clear stale handle
          await clearHandle()
          if (!cancelled) setIsOpening(false)
          return
        }

        if (!cancelled) {
          setFolderHandle(handle)
        }
      } catch {
        // Handle might be stale or browser doesn't support the API
        await clearHandle().catch(() => {})
      } finally {
        if (!cancelled) setIsOpening(false)
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  const openFolder = useCallback(async () => {
    try {
      setIsOpening(true)
      const handle = await openWikiFolder()
      await saveHandle(handle)
      setFolderHandle(handle)
    } catch (err) {
      // User cancelled the picker or an error occurred
      console.error('Failed to open folder:', err)
    } finally {
      setIsOpening(false)
    }
  }, [])

  const closeFolder = useCallback(async () => {
    await clearHandle()
    setFolderHandle(null)
  }, [])

  return { folderHandle, isOpening, openFolder, closeFolder }
}
