export interface FileNode {
  name: string
  kind: 'file' | 'directory'
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
  children?: FileNode[]
}

export type ViewState = 'tree' | 'editor'

export interface OpenFile {
  handle: FileSystemFileHandle
  name: string
  path: string
}
