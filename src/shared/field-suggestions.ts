import path from 'node:path'

import type { FieldSuggestion } from './types'

const FIELD_SPLIT_PATTERN = /[\s_\-()[\]{}<>【】（）「」『』《》,，、]+/

function normalizeFieldKey(value: string) {
  return value.trim().toLocaleLowerCase()
}

function isMeaningfulField(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue.length >= 2 && !/^\d+$/.test(trimmedValue)
}

export function extractFileNameFields(fileName: string) {
  const stem = path.parse(path.basename(fileName)).name
  const uniqueFields = new Set<string>()

  for (const field of stem.split(FIELD_SPLIT_PATTERN)) {
    const trimmedField = field.trim()
    if (isMeaningfulField(trimmedField)) {
      uniqueFields.add(trimmedField)
    }
  }

  return [...uniqueFields]
}

export function suggestFrequentFields(fileNames: string[], maxResults = 12): FieldSuggestion[] {
  if (maxResults <= 0) {
    return []
  }

  const frequencyByField = new Map<string, FieldSuggestion>()

  for (const fileName of fileNames) {
    const baseName = path.basename(fileName)

    for (const field of extractFileNameFields(baseName)) {
      const normalizedField = normalizeFieldKey(field)
      const currentEntry = frequencyByField.get(normalizedField)

      if (currentEntry) {
        currentEntry.count += 1
        continue
      }

      frequencyByField.set(normalizedField, {
        value: field,
        count: 1,
        sampleFileName: baseName
      })
    }
  }

  return [...frequencyByField.values()]
    .filter((suggestion) => suggestion.count >= 2)
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, 'zh-CN'))
    .slice(0, maxResults)
}
