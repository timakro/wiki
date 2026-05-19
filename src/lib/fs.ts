import type { FileNode } from './types'

export async function openWikiFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
  return handle
}

export async function requestReadWritePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const result = await handle.requestPermission({ mode: 'readwrite' })
  return result === 'granted'
}

export async function readFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile()
  return await file.text()
}

export async function writeFile(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(content)
    await writable.close()
  } catch (err) {
    // If close() fails, try to abort the writable
    try {
      await writable.abort()
    } catch {
      // ignore abort errors
    }
    throw err
  }
}

export async function walkDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path = ''
): Promise<FileNode[]> {
  const entries: FileNode[] = []
  const allowedExtensions = new Set(['.md'])

  for await (const [name, handle] of dirHandle.entries()) {
    const entryPath = path ? `${path}/${name}` : name

    if (handle.kind === 'directory') {
      // Skip hidden directories
      if (name.startsWith('.')) continue

      const children = await walkDirectory(handle, entryPath)
      // Only include directories that have (or could have) markdown files
      if (children.length > 0) {
        entries.push({
          name,
          kind: 'directory',
          handle,
          children,
        })
      }
    } else {
      // Only include markdown files
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
      if (allowedExtensions.has(ext)) {
        entries.push({
          name,
          kind: 'file',
          handle,
        })
      }
    }
  }

  // Sort: directories first, then files, alphabetically within each group
  entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return entries
}

export function getFileExtension(filename: string): string {
  const i = filename.lastIndexOf('.')
  return i >= 0 ? filename.slice(i).toLowerCase() : ''
}

export function isMarkdownFile(filename: string): boolean {
  return getFileExtension(filename) === '.md'
}
