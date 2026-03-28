import fs from 'node:fs/promises'
import path from 'node:path'

import { suggestFrequentFields } from '@shared/field-suggestions'
import { generatePreviewItems } from '@shared/organizer'
import { normalizeRules } from '@shared/rules'
import type {
  FieldSuggestionRequest,
  FieldSuggestionResult,
  PreviewItem,
  PreviewRequest,
  PreviewResult,
  RunLog,
  RunSummary,
  TaskKind,
  TaskPhase,
  TaskProgressEvent
} from '@shared/types'

export interface FileOps {
  mkdir: (targetDir: string) => Promise<void>
  rename: (sourcePath: string, targetPath: string) => Promise<void>
  copyFile: (sourcePath: string, targetPath: string) => Promise<void>
  unlink: (targetPath: string) => Promise<void>
  access?: (targetPath: string) => Promise<void>
}

export interface TaskControl {
  taskId?: string
  kind?: TaskKind
  isCancelled?: () => boolean
  onProgress?: (event: TaskProgressEvent) => void | Promise<void>
}

export class TaskCancelledError extends Error {
  constructor(message = '任务已取消') {
    super(message)
    this.name = 'TaskCancelledError'
  }
}

const defaultFileOps: FileOps = {
  mkdir: async (targetDir) => {
    await fs.mkdir(targetDir, { recursive: true })
  },
  rename: fs.rename,
  copyFile: fs.copyFile,
  unlink: fs.unlink,
  access: fs.access
}

function normalizeRootForComparison(targetPath: string) {
  const resolvedPath = path.resolve(targetPath)
  return process.platform === 'win32' ? resolvedPath.toLocaleLowerCase() : resolvedPath
}

function isSameOrNested(rootPath: string, candidatePath: string) {
  const relativePath = path.relative(rootPath, candidatePath)
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

async function pathExists(targetPath: string, fileOps: Pick<FileOps, 'access'> = defaultFileOps) {
  try {
    const access: NonNullable<FileOps['access']> = fileOps.access ?? defaultFileOps.access ?? fs.access
    await access(targetPath)
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

function ensureNotCancelled(task?: TaskControl) {
  if (task?.isCancelled?.()) {
    throw new TaskCancelledError()
  }
}

async function emitProgress(
  task: TaskControl | undefined,
  phase: TaskPhase,
  message: string,
  processed: number,
  total?: number,
  currentPath?: string,
  state: TaskProgressEvent['state'] = 'running'
) {
  if (!task?.onProgress || !task.taskId || !task.kind) {
    return
  }

  await task.onProgress({
    taskId: task.taskId,
    kind: task.kind,
    phase,
    state,
    message,
    processed,
    total,
    percent: typeof total === 'number' && total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : undefined,
    currentPath
  })
}

async function walkFiles(
  rootPath: string,
  ignoredRoots: string[] = [],
  task?: TaskControl,
  phase: TaskPhase = 'scanning-source',
  recursive = true
) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))) {
    ensureNotCancelled(task)

    const fullPath = path.join(rootPath, entry.name)
    if (ignoredRoots.some((ignoredRoot) => isSameOrNested(ignoredRoot, fullPath))) {
      continue
    }

    if (entry.isSymbolicLink()) {
      continue
    }

    if (entry.isDirectory()) {
      if (!recursive) {
        continue
      }

      files.push(...(await walkFiles(fullPath, ignoredRoots, task, phase, true)))
      continue
    }

    if (entry.isFile()) {
      files.push(fullPath)
      await emitProgress(task, phase, '正在扫描文件…', files.length, undefined, fullPath)
    }
  }

  return files
}

function buildUniqueRestorePath(targetPath: string, occupiedPaths: Set<string>) {
  const normalizedTarget = normalizeRootForComparison(targetPath)
  if (!occupiedPaths.has(normalizedTarget)) {
    return targetPath
  }

  const parsed = path.parse(targetPath)
  let counter = 1

  while (true) {
    const candidate = path.join(parsed.dir, `${parsed.name} (restored ${counter})${parsed.ext}`)
    const normalizedCandidate = normalizeRootForComparison(candidate)
    if (!occupiedPaths.has(normalizedCandidate)) {
      return candidate
    }
    counter += 1
  }
}

async function reserveRestorePath(targetPath: string, occupiedPaths: Set<string>, fileOps: FileOps) {
  let candidate = targetPath

  while (occupiedPaths.has(normalizeRootForComparison(candidate)) || (await pathExists(candidate, fileOps))) {
    occupiedPaths.add(normalizeRootForComparison(candidate))
    candidate = buildUniqueRestorePath(targetPath, occupiedPaths)
  }

  occupiedPaths.add(normalizeRootForComparison(candidate))
  return candidate
}

export async function scanSourceFiles(
  sourceRoot: string,
  outputRoot?: string,
  outputFolderNames: string[] = [],
  task?: TaskControl,
  recursive = false
) {
  ensureNotCancelled(task)
  const ignoredRoots = buildIgnoredRoots(sourceRoot, outputRoot, outputFolderNames)
  const files = await walkFiles(sourceRoot, ignoredRoots, task, 'scanning-source', recursive)
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

export async function suggestFrequentFieldsFromDisk(
  request: FieldSuggestionRequest,
  task?: TaskControl
): Promise<FieldSuggestionResult> {
  await emitProgress(task, 'queued', '准备分析文件名字段…', 0)
  const filePaths = await scanSourceFiles(
    request.sourceRoot,
    request.outputRoot,
    request.rules?.map((rule) => rule.outputFolderName) ?? [],
    task,
    request.recursive ?? false
  )
  ensureNotCancelled(task)
  await emitProgress(task, 'planning', '正在提取高频字段…', filePaths.length, filePaths.length)

  const result = {
    scannedFileCount: filePaths.length,
    suggestions: suggestFrequentFields(filePaths, request.maxResults)
  }

  await emitProgress(
    task,
    'completed',
    `字段分析完成，共发现 ${result.suggestions.length} 条建议。`,
    result.scannedFileCount,
    result.scannedFileCount,
    undefined,
    'completed'
  )
  return result
}

async function collectExistingTargetPaths(outputRoot: string, task?: TaskControl) {
  if (!(await pathExists(outputRoot))) {
    return []
  }

  return walkFiles(outputRoot, [], task, 'scanning-output', true)
}

export async function generatePreviewFromDisk(
  request: PreviewRequest,
  task?: TaskControl
): Promise<PreviewResult> {
  const normalizedRequest = {
    ...request,
    rules: normalizeRules(request.rules)
  }

  await emitProgress(task, 'queued', '准备生成预览计划…', 0)

  const [filePaths, existingTargetPaths] = await Promise.all([
    scanSourceFiles(
      normalizedRequest.sourceRoot,
      normalizedRequest.outputRoot,
      normalizedRequest.rules.map((rule) => rule.outputFolderName),
      task,
      normalizedRequest.recursive ?? false
    ),
    collectExistingTargetPaths(normalizedRequest.outputRoot, task)
  ])

  ensureNotCancelled(task)
  await emitProgress(task, 'planning', '正在计算预览结果…', filePaths.length, filePaths.length)

  const preview = generatePreviewItems({
    ...normalizedRequest,
    filePaths,
    existingTargetPaths
  })

  await emitProgress(
    task,
    'completed',
    `预览完成，共处理 ${preview.summary.total} 个文件。`,
    preview.summary.total,
    preview.summary.total,
    undefined,
    'completed'
  )

  return preview
}

function createRunSummary(items: PreviewItem[]): RunSummary {
  const moved = items.filter((item) => item.executionState === 'moved' || item.executionState === 'copied').length
  const copied = items.filter((item) => item.executionState === 'copied').length
  const unmatched = items.filter((item) => item.status === 'unmatched').length
  const errors = items.filter((item) => item.status === 'error').length
  const renamed = items.filter((item) => item.conflictResolution === 'auto-rename').length
  const undone = items.filter((item) => item.executionState === 'undone').length
  const undoErrors = items.filter((item) => item.executionState === 'undo-error').length

  return {
    total: items.length,
    matched: items.filter((item) => item.status === 'matched').length,
    unmatched,
    errors,
    renamed,
    moved,
    copied,
    skipped: items.filter((item) => item.executionState === 'skipped' || item.executionState === 'error').length,
    undone,
    undoErrors
  }
}

function getErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '发生未知错误'
}

export async function executePreviewItems(
  items: PreviewItem[],
  fileOps: FileOps = defaultFileOps,
  task?: TaskControl
) {
  const executedItems: PreviewItem[] = []
  const actionableCount = items.filter(
    (item) => item.action === 'move' && item.status === 'matched' && item.targetPath
  ).length
  let completedCount = 0

  for (const item of items) {
    ensureNotCancelled(task)

    if (item.action === 'skip' || item.status !== 'matched' || !item.targetPath) {
      executedItems.push({
        ...item,
        executionState: item.status === 'error' ? 'error' : 'skipped'
      })
      continue
    }

    try {
      await emitProgress(task, 'executing', '正在整理文件…', completedCount, actionableCount, item.sourcePath)
      await fileOps.mkdir(path.dirname(item.targetPath))

      try {
        await fileOps.rename(item.sourcePath, item.targetPath)
        executedItems.push({
          ...item,
          executionState: 'moved',
          message:
            item.conflictResolution === 'auto-rename'
              ? `已整理并自动改名为 ${item.finalTargetFileName}。`
              : '已整理到目标目录。'
        })
      } catch (error) {
        if (getErrorCode(error) === 'EXDEV') {
          await fileOps.copyFile(item.sourcePath, item.targetPath)
          await fileOps.unlink(item.sourcePath)
          executedItems.push({
            ...item,
            executionState: 'copied',
            message: '跨盘整理已通过复制后删除源文件完成。'
          })
          completedCount += 1
          continue
        }

        throw error
      }
    } catch (error) {
      executedItems.push({
        ...item,
        action: 'skip',
        status: 'error',
        executionState: 'error',
        message: `整理失败：${getErrorMessage(error)}`
      })
      completedCount += 1
      continue
    }

    completedCount += 1
  }

  const summary = createRunSummary(executedItems)
  await emitProgress(
    task,
    'completed',
    `整理完成，成功处理 ${summary.moved} 个文件。`,
    actionableCount,
    actionableCount,
    undefined,
    'completed'
  )

  return {
    items: executedItems,
    summary
  }
}

export async function executePreviewRequest(request: PreviewRequest, task?: TaskControl): Promise<RunLog> {
  const startedAt = new Date().toISOString()
  const preview = await generatePreviewFromDisk(request, task)
  const executed = await executePreviewItems(preview.items, defaultFileOps, task)

  return {
    runId: crypto.randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceRoot: request.sourceRoot,
    outputRoot: request.outputRoot,
    summary: executed.summary,
    items: executed.items,
    isUndoAvailable: executed.summary.moved > 0
  }
}

export async function undoRunLog(
  runLog: RunLog,
  fileOps: FileOps = defaultFileOps,
  task?: TaskControl
): Promise<RunLog> {
  const actionableItems = runLog.items.filter(
    (item) => (item.executionState === 'moved' || item.executionState === 'copied') && item.targetPath
  )
  const occupiedRestorePaths = new Set<string>()
  let completedCount = 0
  const updatedItems: PreviewItem[] = []

  for (const item of runLog.items) {
    ensureNotCancelled(task)

    if (!item.targetPath || (item.executionState !== 'moved' && item.executionState !== 'copied')) {
      updatedItems.push(item)
      continue
    }

    await emitProgress(task, 'undoing', '正在撤销上一次整理…', completedCount, actionableItems.length, item.targetPath)

    try {
      const safeRestorePath = await reserveRestorePath(item.sourcePath, occupiedRestorePaths, fileOps)
      await fileOps.mkdir(path.dirname(safeRestorePath))

      try {
        await fileOps.rename(item.targetPath, safeRestorePath)
      } catch (error) {
        if (getErrorCode(error) === 'EXDEV') {
          await fileOps.copyFile(item.targetPath, safeRestorePath)
          await fileOps.unlink(item.targetPath)
        } else {
          throw error
        }
      }

      updatedItems.push({
        ...item,
        executionState: 'undone',
        restoredSourcePath: safeRestorePath,
        message:
          safeRestorePath === item.sourcePath
            ? '已撤销整理并恢复到原路径。'
            : `原路径已有文件，已恢复到 ${safeRestorePath}。`
      })
    } catch (error) {
      updatedItems.push({
        ...item,
        executionState: 'undo-error',
        status: 'error',
        message: `撤销失败：${getErrorMessage(error)}`
      })
    }

    completedCount += 1
  }

  const updatedLog: RunLog = {
    ...runLog,
    finishedAt: new Date().toISOString(),
    items: updatedItems,
    summary: createRunSummary(updatedItems),
    isUndoAvailable: false,
    undoneAt: new Date().toISOString()
  }

  await emitProgress(
    task,
    'completed',
    `撤销完成，恢复 ${updatedLog.summary.undone} 个文件。`,
    completedCount,
    actionableItems.length,
    undefined,
    'completed'
  )

  return updatedLog
}
