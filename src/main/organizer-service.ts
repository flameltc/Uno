import fs from 'node:fs/promises'
import path from 'node:path'

import { suggestFrequentFields } from '@shared/field-suggestions'
import { generatePreviewItems } from '@shared/organizer'
import type {
  FieldSuggestionRequest,
  FieldSuggestionResult,
  PreviewItem,
  PreviewRequest,
  PreviewResult,
  RunLog,
  RunSummary
} from '@shared/types'

export interface FileOps {
  mkdir: (targetDir: string) => Promise<void>
  rename: (sourcePath: string, targetPath: string) => Promise<void>
  copyFile: (sourcePath: string, targetPath: string) => Promise<void>
  unlink: (targetPath: string) => Promise<void>
}

const defaultFileOps: FileOps = {
  mkdir: async (targetDir) => {
    await fs.mkdir(targetDir, { recursive: true })
  },
  rename: fs.rename,
  copyFile: fs.copyFile,
  unlink: fs.unlink
}

function normalizeRootForComparison(targetPath: string) {
  const resolvedPath = path.resolve(targetPath)
  return process.platform === 'win32' ? resolvedPath.toLocaleLowerCase() : resolvedPath
}

function isSameOrNested(rootPath: string, candidatePath: string) {
  const relativePath = path.relative(rootPath, candidatePath)
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function buildIgnoredRoots(sourceRoot: string, outputRoot?: string, outputFolderNames: string[] = []) {
  if (!outputRoot) {
    return []
  }

  const normalizedSourceRoot = normalizeRootForComparison(sourceRoot)
  const normalizedOutputRoot = normalizeRootForComparison(outputRoot)

  if (normalizedSourceRoot === normalizedOutputRoot) {
    return [...new Set(outputFolderNames.map((name) => name.trim()).filter(Boolean))].map((folderName) =>
      path.join(outputRoot, folderName)
    )
  }

  if (isSameOrNested(sourceRoot, outputRoot)) {
    return [outputRoot]
  }

  return []
}

async function walkFiles(rootPath: string, ignoredRoots: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))) {
    const fullPath = path.join(rootPath, entry.name)
    if (ignoredRoots.some((ignoredRoot) => isSameOrNested(ignoredRoot, fullPath))) {
      continue
    }

    if (entry.isSymbolicLink()) {
      continue
    }

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, ignoredRoots)))
      continue
    }

    if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

export async function scanSourceFiles(sourceRoot: string, outputRoot?: string, outputFolderNames: string[] = []) {
  const ignoredRoots = buildIgnoredRoots(sourceRoot, outputRoot, outputFolderNames)
  const files = await walkFiles(sourceRoot, ignoredRoots)
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

export async function suggestFrequentFieldsFromDisk(
  request: FieldSuggestionRequest
): Promise<FieldSuggestionResult> {
  const filePaths = await scanSourceFiles(
    request.sourceRoot,
    request.outputRoot,
    request.rules?.map((rule) => rule.outputFolderName) ?? []
  )

  return {
    scannedFileCount: filePaths.length,
    suggestions: suggestFrequentFields(filePaths, request.maxResults)
  }
}

async function collectExistingTargetPaths(outputRoot: string) {
  if (!(await pathExists(outputRoot))) {
    return []
  }

  return walkFiles(outputRoot)
}

export async function generatePreviewFromDisk(request: PreviewRequest): Promise<PreviewResult> {
  const [filePaths, existingTargetPaths] = await Promise.all([
    scanSourceFiles(
      request.sourceRoot,
      request.outputRoot,
      request.rules.map((rule) => rule.outputFolderName)
    ),
    collectExistingTargetPaths(request.outputRoot)
  ])

  return generatePreviewItems({
    ...request,
    filePaths,
    existingTargetPaths
  })
}

function createRunSummary(items: PreviewItem[]): RunSummary {
  const moved = items.filter((item) => item.status === 'matched' && item.action === 'move').length
  const unmatched = items.filter((item) => item.status === 'unmatched').length
  const errors = items.filter((item) => item.status === 'error').length
  const renamed = items.filter((item) => item.conflictResolution === 'auto-rename').length

  return {
    total: items.length,
    matched: moved,
    unmatched,
    errors,
    renamed,
    moved,
    skipped: unmatched + errors
  }
}

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return '发生未知错误'
}

export async function executePreviewItems(items: PreviewItem[], fileOps: FileOps = defaultFileOps) {
  const executedItems: PreviewItem[] = []

  for (const item of items) {
    if (item.action === 'skip' || item.status !== 'matched' || !item.targetPath) {
      executedItems.push(item)
      continue
    }

    try {
      await fileOps.mkdir(path.dirname(item.targetPath))

      try {
        await fileOps.rename(item.sourcePath, item.targetPath)
        executedItems.push({
          ...item,
          message:
            item.conflictResolution === 'auto-rename'
              ? `已移动并自动重命名为 ${item.finalTargetFileName}。`
              : '已移动到目标目录。'
        })
      } catch (error) {
        if (getErrorCode(error) === 'EXDEV') {
          await fileOps.copyFile(item.sourcePath, item.targetPath)
          await fileOps.unlink(item.sourcePath)
          executedItems.push({
            ...item,
            message: '已通过复制后删除完成跨盘移动。'
          })
          continue
        }

        throw error
      }
    } catch (error) {
      executedItems.push({
        ...item,
        action: 'skip',
        status: 'error',
        message: `移动失败：${getErrorMessage(error)}`
      })
    }
  }

  return {
    items: executedItems,
    summary: createRunSummary(executedItems)
  }
}

export async function executePreviewRequest(request: PreviewRequest): Promise<RunLog> {
  const startedAt = new Date().toISOString()
  const preview = await generatePreviewFromDisk(request)
  const executed = await executePreviewItems(preview.items)

  return {
    runId: crypto.randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceRoot: request.sourceRoot,
    outputRoot: request.outputRoot,
    summary: executed.summary,
    items: executed.items
  }
}
