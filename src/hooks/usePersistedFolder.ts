import { useState, useEffect, useCallback, useRef } from 'react'
import { openWikiFolder } from '../lib/fs'
import { saveHandle, loadHandle, clearHandle } from '../lib/db'

type PermissionState = 'loading' | 'granted' | 'prompt' | 'denied' | 'no-handle'

interface UsePersistedFolderReturn {
  folderHandle: FileSystemDirectoryHandle | null
  permissionState: PermissionState
  openFolder: () => Promise<void>
  reactivate: () => Promise<void>
  closeFolder: () => Promise<void>
}

export function usePersistedFolder(): UsePersistedFolderReturn {
  const [folderHandle, setFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null)
  const [permissionState, setPermissionState] =
    useState<PermissionState>('loading')
  const storedHandleRef = useRef<FileSystemDirectoryHandle | null>(null)

  // On mount, try to restore the folder handle from IndexedDB
  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const handle = await loadHandle()
        if (!handle || cancelled) {
          if (!cancelled) setPermissionState('no-handle')
          return
        }

        storedHandleRef.current = handle

        // Outside a user gesture this returns 'prompt' or 'granted'.
        // We never deny here — 'prompt' means "needs a click to re-grant".
        const result = await handle.requestPermission({ mode: 'readwrite' })

        if (cancelled) return

        if (result === 'granted') {
          setFolderHandle(handle)
          setPermissionState('granted')
        } else if (result === 'denied') {
          // Persistently denied — clear and start fresh
          await clearHandle()
          storedHandleRef.current = null
          setPermissionState('no-handle')
        } else {
          // 'prompt' — handle exists but needs a user gesture
          setPermissionState('prompt')
        }
      } catch {
        // requestPermission can throw (e.g. SecurityError outside user gesture
        // in some Chrome versions). Don't clear the handle — keep it and show
        // the reactivate prompt so the user can re-grant permission on click.
        if (!cancelled) {
          if (storedHandleRef.current) {
            setPermissionState('prompt')
          } else {
            setPermissionState('no-handle')
          }
        }
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  const openFolder = useCallback(async () => {
    try {
      setPermissionState('loading')
      const handle = await openWikiFolder()
      await saveHandle(handle)
      storedHandleRef.current = handle
      setFolderHandle(handle)
      setPermissionState('granted')
    } catch (err) {
      // User cancelled the picker or an error occurred
      console.error('Failed to open folder:', err)
      setPermissionState('no-handle')
    }
  }, [])

  const reactivate = useCallback(async () => {
    const handle = storedHandleRef.current
    if (!handle) {
      setPermissionState('no-handle')
      return
    }

    setPermissionState('loading')

    // This runs inside a user gesture (click), so the browser prompt will show
    try {
      const result = await handle.requestPermission({ mode: 'readwrite' })

      if (result === 'granted') {
        setFolderHandle(handle)
        setPermissionState('granted')
      } else if (result === 'denied') {
        await clearHandle()
        storedHandleRef.current = null
        setPermissionState('no-handle')
      } else {
        // Still 'prompt' — this shouldn't happen from a click, but handle gracefully
        setPermissionState('prompt')
      }
    } catch {
      setPermissionState('prompt')
    }
  }, [])

  const closeFolder = useCallback(async () => {
    await clearHandle()
    storedHandleRef.current = null
    setFolderHandle(null)
    setPermissionState('no-handle')
  }, [])

  return { folderHandle, permissionState, openFolder, reactivate, closeFolder }
}
