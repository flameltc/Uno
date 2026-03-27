import path from 'node:path'

import type { FieldSuggestion, SuggestionSource } from './types'

const FIELD_SPLIT_PATTERN = /[\s_\-()[\]{}<>【】（）「」『』《》、,，.]+/
const LATIN_SPLIT_PATTERN = /(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/
const CJK_SEGMENT_PATTERN = /[\p{Script=Han}]{2,}/gu
const LATIN_SEGMENT_PATTERN = /[A-Za-z][A-Za-z0-9]{1,}/g
const FILLER_TOKENS = new Set([
  'copy',
  'final',
  'review',
  'draft',
  'scan',
  'scanned',
  'new',
  'old',
  'file',
  'document',
  'img',
  'image',
  'wechat',
  'whatsapp',
  'screenshot',
  'export',
  'temp',
  'tmp',
  'edited'
])
const CJK_STOPWORDS = ['已整理', '整理后', '扫描件', '截图', '副本', '最终版', '草稿', '新建']

function normalizeFieldKey(value: string) {
  return value.trim().toLocaleLowerCase()
}

function isNumericNoise(value: string) {
  return /^\d+$/.test(value) || /^\d{4}([_-]?\d{1,2}){0,2}$/.test(value)
}

function isMeaningfulField(value: string) {
  const trimmedValue = value.trim()
  if (trimmedValue.length < 2) {
    return false
  }

  if (isNumericNoise(trimmedValue)) {
    return false
  }

  const normalizedValue = normalizeFieldKey(trimmedValue)
  if (FILLER_TOKENS.has(normalizedValue)) {
    return false
  }

  if (CJK_STOPWORDS.some((token) => trimmedValue.includes(token))) {
    return false
  }

  return true
}

function addCandidate(
  bucket: Map<string, { value: string; source: SuggestionSource }>,
  value: string,
  source: SuggestionSource
) {
  const trimmedValue = value.trim()
  if (!isMeaningfulField(trimmedValue)) {
    return
  }

  const normalizedValue = normalizeFieldKey(trimmedValue)
  if (!bucket.has(normalizedValue)) {
    bucket.set(normalizedValue, {
      value: trimmedValue,
      source
    })
  }
}

function buildCjkSubstrings(value: string) {
  const substrings = new Set<string>()

  for (let length = 2; length <= Math.min(4, value.length); length += 1) {
    for (let index = 0; index <= value.length - length; index += 1) {
      substrings.add(value.slice(index, index + length))
    }
  }

  return [...substrings]
}

export function extractFileNameFields(fileName: string) {
  const stem = path.parse(path.basename(fileName)).name
  const uniqueFields = new Map<string, { value: string; source: SuggestionSource }>()

  for (const field of stem.split(FIELD_SPLIT_PATTERN)) {
    const trimmedField = field.trim()
    if (!trimmedField) {
      continue
    }

    addCandidate(uniqueFields, trimmedField, 'token')

    for (const part of trimmedField.split(LATIN_SPLIT_PATTERN)) {
      addCandidate(uniqueFields, part, 'token')
    }

    for (const latinPart of trimmedField.match(LATIN_SEGMENT_PATTERN) ?? []) {
      addCandidate(uniqueFields, latinPart, 'token')
    }

    for (const cjkPart of trimmedField.match(CJK_SEGMENT_PATTERN) ?? []) {
      addCandidate(uniqueFields, cjkPart, 'phrase')

      if (cjkPart.length >= 4) {
        for (const substring of buildCjkSubstrings(cjkPart)) {
          addCandidate(uniqueFields, substring, 'substring')
        }
      }
    }
  }

  return [...uniqueFields.values()]
}

export function suggestFrequentFields(fileNames: string[], maxResults = 12): FieldSuggestion[] {
  if (maxResults <= 0) {
    return []
  }

  const frequencyByField = new Map<string, FieldSuggestion>()

  for (const fileName of fileNames) {
    const baseName = path.basename(fileName)

    for (const field of extractFileNameFields(baseName)) {
      const normalizedField = normalizeFieldKey(field.value)
      const currentEntry = frequencyByField.get(normalizedField)

      if (currentEntry) {
        currentEntry.count += 1
        continue
      }

      frequencyByField.set(normalizedField, {
        value: normalizedField,
        count: 1,
        sampleFileName: baseName,
        confidence: field.source === 'token' ? 0.95 : field.source === 'phrase' ? 0.84 : 0.72,
        source: field.source
      })
    }
  }

  return [...frequencyByField.values()]
    .filter((suggestion) => suggestion.count >= 2)
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.confidence - left.confidence ||
        left.value.localeCompare(right.value, 'zh-CN')
    )
    .slice(0, maxResults)
}
