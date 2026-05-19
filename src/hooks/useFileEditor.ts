import { useState, useRef, useCallback, useEffect } from 'react'
import { readFile, writeFile } from '../lib/fs'
import type { OpenFile } from '../lib/types'

interface UseFileEditorReturn {
  openFile: OpenFile | null
  content: string
  isDirty: boolean
  error: string | null
  open: (handle: FileSystemFileHandle, name: string, path: string) => Promise<void>
  setContent: (content: string) => void
  close: () => void
}

const AUTOSAVE_DELAY = 1500

export function useFileEditor(): UseFileEditorReturn {
  const [openFile, setOpenFile] = useState<OpenFile | null>(null)
  const [content, setContentState] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)
  const handleRef = useRef<FileSystemFileHandle | null>(null)

  // Refs to always read the latest values without stale closures
  const contentRef = useRef(content)
  const savedContentRef = useRef(savedContent)
  useEffect(() => {
    contentRef.current = content
  }, [content])
  useEffect(() => {
    savedContentRef.current = savedContent
  }, [savedContent])

  // Tracks whether content changed while a save was in flight
  const pendingRef = useRef(false)

  // The actual save function – no dependencies, reads from refs only
  const doSave = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return

    if (savingRef.current) {
      pendingRef.current = true
      return
    }

    savingRef.current = true
    setError(null)

    const contentAtStart = contentRef.current

    try {
      await writeFile(handle, contentAtStart)

      // Only mark as saved if content hasn't changed since the write started.
      // If it has, we'll re-save below.
      if (contentRef.current === contentAtStart) {
        setSavedContent(contentAtStart)
      } else {
        // Content changed during the write – we need another save
        pendingRef.current = true
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save file'
      setError(message)
    } finally {
      savingRef.current = false

      if (pendingRef.current) {
        pendingRef.current = false
        // Schedule a follow-up save to flush the latest content
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(doSave, AUTOSAVE_DELAY)
      }
    }
  }, [])

  // Register beforeunload and visibilitychange handlers
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (savingRef.current) {
        e.preventDefault()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && handleRef.current) {
        // Flush synchronously (fire-and-forget – browser keeps the page alive
        // briefly for the write to finish)
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        doSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [doSave])

  const open = useCallback(
    async (handle: FileSystemFileHandle, name: string, path: string) => {
      // Cancel any pending save before switching files
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      // If a save is in-flight, wait for it then re-check
      if (handleRef.current && savingRef.current) {
        try {
          // We can't easily await the in-flight save from here,
          // so we retry with a small delay instead
          await new Promise<void>((resolve) => {
            const check = () => {
              if (!savingRef.current) {
                resolve()
              } else {
                setTimeout(check, 50)
              }
            }
            check()
          })
        } catch {
          // ignore
        }
      }

      try {
        const text = await readFile(handle)
        handleRef.current = handle
        setOpenFile({ handle, name, path })
        setContentState(text)
        setSavedContent(text)
        pendingRef.current = false
        setError(null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to read file'
        setError(message)
      }
    },
    [],
  )

  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent)

      // Debounced autosave – always cancels the previous timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        doSave()
      }, AUTOSAVE_DELAY)
    },
    [doSave],
  )

  const close = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    handleRef.current = null
    pendingRef.current = false
    setOpenFile(null)
    setContentState('')
    setSavedContent('')
    setError(null)
  }, [])

  const isDirty = content !== savedContent && openFile !== null

  return {
    openFile,
    content,
    isDirty,
    error,
    open,
    setContent,
    close,
  }
}
