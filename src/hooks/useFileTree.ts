import { useState, useEffect, useCallback } from 'react'
import { walkDirectory } from '../lib/fs'
import type { FileNode } from '../lib/types'

interface UseFileTreeReturn {
  tree: FileNode[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useFileTree(
  folderHandle: FileSystemDirectoryHandle | null
): UseFileTreeReturn {
  const [tree, setTree] = useState<FileNode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!folderHandle) {
      setTree([])
      setIsLoading(false)
      return
    }

    const handle = folderHandle
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const nodes = await walkDirectory(handle)
        if (!cancelled) {
          setTree(nodes)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load file tree'
          setError(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [folderHandle, refreshKey])

  return { tree, isLoading, error, refresh }
}
