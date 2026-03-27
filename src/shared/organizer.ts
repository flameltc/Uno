import path from 'node:path'

import type { PreviewItem, PreviewResult, RuleConfig } from './types'
import { normalizeRules } from './rules'

interface GeneratePreviewItemsInput {
  sourceRoot: string
  outputRoot: string
  filePaths: string[]
  rules: RuleConfig[]
  existingTargetPaths: string[]
}

interface RuleMatchResult {
  rule: RuleConfig
  matchedKeywords: string[]
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLocaleLowerCase()
}

function normalizePathKey(targetPath: string) {
  return path.normalize(targetPath).toLocaleLowerCase()
}

function normalizeExtension(extension: string) {
  return extension.replace(/^\./, '').trim().toLocaleLowerCase()
}

function splitName(fileName: string) {
  const extension = path.extname(fileName)
  return {
    extension,
    stem: extension ? fileName.slice(0, -extension.length) : fileName
  }
}

function matchExtensions(fileName: string, rule: RuleConfig) {
  if (rule.extensions.length === 0) {
    return true
  }

  const currentExtension = normalizeExtension(path.extname(fileName))
  return rule.extensions.map(normalizeExtension).includes(currentExtension)
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

export function getRuleMatch(fileName: string, rule: RuleConfig): RuleMatchResult | null {
  if (!rule.enabled) {
    return null
  }

  if (!matchExtensions(fileName, rule)) {
    return null
  }

  const normalizedName = fileName.toLocaleLowerCase()
  const keywords = rule.keywords.map(normalizeKeyword).filter(Boolean)
  const excludeKeywords = rule.excludeKeywords.map(normalizeKeyword).filter(Boolean)

  if (keywords.length === 0) {
    return null
  }

  if (excludeKeywords.some((keyword) => normalizedName.includes(keyword))) {
    return null
  }

  const matchedKeywords = keywords.filter((keyword) => normalizedName.includes(keyword))
  const isMatch =
    rule.matchMode === 'all' ? matchedKeywords.length === keywords.length : matchedKeywords.length > 0

  return isMatch ? { rule, matchedKeywords } : null
}

export function matchRule(fileName: string, rules: RuleConfig[]) {
  return normalizeRules(rules)
    .map((rule) => getRuleMatch(fileName, rule))
    .find((entry): entry is RuleMatchResult => Boolean(entry))?.rule
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
  const normalizedRules = normalizeRules(rules)
  const sortedFiles = [...filePaths].sort((left, right) => left.localeCompare(right, 'zh-CN'))

  for (const sourcePath of sortedFiles) {
    const fileName = path.basename(sourcePath)
    const matchedEntry = normalizedRules
      .map((rule) => getRuleMatch(fileName, rule))
      .find((entry): entry is RuleMatchResult => Boolean(entry))

    if (!matchedEntry) {
      items.push({
        sourcePath,
        fileName,
        action: 'skip',
        status: 'unmatched',
        executionState: 'pending',
        message: '未命中任何规则，文件会保留在原位置。'
      })
      continue
    }

    const desiredTargetPath = path.join(outputRoot, matchedEntry.rule.outputFolderName, fileName)
    const resolvedTarget = resolveConflictPath(desiredTargetPath, occupiedPaths)
    occupiedPaths.add(normalizePathKey(resolvedTarget.targetPath))

    items.push({
      sourcePath,
      fileName,
      matchedRuleId: matchedEntry.rule.id,
      matchedRuleName: matchedEntry.rule.name,
      matchedKeywords: matchedEntry.matchedKeywords,
      targetPath: resolvedTarget.targetPath,
      finalTargetFileName: resolvedTarget.fileName,
      conflictResolution: resolvedTarget.conflictResolution,
      action: 'move',
      status: 'matched',
      executionState: 'pending',
      message:
        resolvedTarget.conflictResolution === 'auto-rename'
          ? `目标目录已有同名文件，预览中已改名为 ${resolvedTarget.fileName}。`
          : '已命中规则，准备整理到目标目录。'
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
