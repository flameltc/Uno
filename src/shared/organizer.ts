import path from 'node:path'

import type { PreviewItem, PreviewResult, RuleConfig } from './types'

interface GeneratePreviewItemsInput {
  sourceRoot: string
  outputRoot: string
  filePaths: string[]
  rules: RuleConfig[]
  existingTargetPaths: string[]
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLocaleLowerCase()
}

function normalizePathKey(targetPath: string) {
  return path.normalize(targetPath).toLocaleLowerCase()
}

function sortRules(rules: RuleConfig[]) {
  return [...rules]
    .map((rule, index) => ({ rule, index }))
    .sort((left, right) => left.rule.priority - right.rule.priority || left.index - right.index)
    .map((entry) => entry.rule)
}

export function matchRule(fileName: string, rules: RuleConfig[]) {
  const normalizedName = fileName.toLocaleLowerCase()

  return sortRules(rules).find((rule) => {
    if (!rule.enabled) {
      return false
    }

    const keywords = rule.keywords.map(normalizeKeyword).filter(Boolean)
    if (keywords.length === 0) {
      return false
    }

    return keywords.some((keyword) => normalizedName.includes(keyword))
  })
}

function splitName(fileName: string) {
  const extension = path.extname(fileName)
  return {
    extension,
    stem: extension ? fileName.slice(0, -extension.length) : fileName
  }
}

function resolveConflictPath(targetPath: string, occupiedPaths: Set<string>) {
  if (!occupiedPaths.has(normalizePathKey(targetPath))) {
    return {
      targetPath,
      fileName: path.basename(targetPath),
      conflictResolution: 'none' as const
    }
  }

  const directory = path.dirname(targetPath)
  const { stem, extension } = splitName(path.basename(targetPath))

  let counter = 1
  while (true) {
    const candidateFileName = `${stem} (${counter})${extension}`
    const candidatePath = path.join(directory, candidateFileName)
    if (!occupiedPaths.has(normalizePathKey(candidatePath))) {
      return {
        targetPath: candidatePath,
        fileName: candidateFileName,
        conflictResolution: 'auto-rename' as const
      }
    }
    counter += 1
  }
}

export function generatePreviewItems({
  sourceRoot: _sourceRoot,
  outputRoot,
  filePaths,
  rules,
  existingTargetPaths
}: GeneratePreviewItemsInput): PreviewResult {
  const occupiedPaths = new Set(existingTargetPaths.map(normalizePathKey))
  const items: PreviewItem[] = []

  const sortedFiles = [...filePaths].sort((left, right) => left.localeCompare(right, 'zh-CN'))

  for (const sourcePath of sortedFiles) {
    const fileName = path.basename(sourcePath)
    const matchedRule = matchRule(fileName, rules)

    if (!matchedRule) {
      items.push({
        sourcePath,
        fileName,
        action: 'skip',
        status: 'unmatched',
        message: '未命中任何规则，文件保持原地不动。'
      })
      continue
    }

    const desiredTargetPath = path.join(outputRoot, matchedRule.outputFolderName, fileName)
    const resolvedTarget = resolveConflictPath(desiredTargetPath, occupiedPaths)
    occupiedPaths.add(normalizePathKey(resolvedTarget.targetPath))

    items.push({
      sourcePath,
      fileName,
      matchedRuleId: matchedRule.id,
      matchedRuleName: matchedRule.name,
      targetPath: resolvedTarget.targetPath,
      finalTargetFileName: resolvedTarget.fileName,
      conflictResolution: resolvedTarget.conflictResolution,
      action: 'move',
      status: 'matched',
      message:
        resolvedTarget.conflictResolution === 'auto-rename'
          ? `目标目录已存在同名文件，预览中已改名为 ${resolvedTarget.fileName}。`
          : '已命中规则，准备移动。'
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    items,
    summary: {
      total: items.length,
      matched: items.filter((item) => item.status === 'matched').length,
      unmatched: items.filter((item) => item.status === 'unmatched').length,
      errors: items.filter((item) => item.status === 'error').length,
      renamed: items.filter((item) => item.conflictResolution === 'auto-rename').length
    }
  }
}
