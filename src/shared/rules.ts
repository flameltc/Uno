import type { RuleConfig, RuleMatchMode } from './types'

export const DEFAULT_RULE_MATCH_MODE: RuleMatchMode = 'any'

function normalizeStringList(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

export function normalizeRule(rule: Partial<RuleConfig> & Pick<RuleConfig, 'id'>, priority: number): RuleConfig {
  return {
    id: rule.id,
    name: rule.name?.trim() || '未命名规则',
    keywords: normalizeStringList(rule.keywords),
    excludeKeywords: normalizeStringList(rule.excludeKeywords),
    extensions: normalizeStringList(rule.extensions).map((extension) =>
      extension.startsWith('.') ? extension.slice(1).toLocaleLowerCase() : extension.toLocaleLowerCase()
    ),
    outputFolderName: rule.outputFolderName?.trim() || '未分类',
    enabled: rule.enabled ?? true,
    priority,
    matchMode: rule.matchMode ?? DEFAULT_RULE_MATCH_MODE
  }
}

export function normalizeRules(rules: RuleConfig[]) {
  return [...rules]
    .sort((left, right) => left.priority - right.priority)
    .map((rule, index) => normalizeRule(rule, index + 1))
}

export function parseRuleKeywords(text: string) {
  return normalizeStringList(text.split(/[\n,，]+/))
}

export function parseRuleExtensions(text: string) {
  return normalizeStringList(text.split(/[\n,，\s]+/)).map((extension) =>
    extension.startsWith('.') ? extension.slice(1).toLocaleLowerCase() : extension.toLocaleLowerCase()
  )
}

export function createRuleFromSuggestion(value: string, priority: number): RuleConfig {
  const trimmedValue = value.trim()
  return normalizeRule(
    {
      id: crypto.randomUUID(),
      name: trimmedValue,
      keywords: [trimmedValue],
      excludeKeywords: [],
      extensions: [],
      outputFolderName: trimmedValue,
      enabled: true,
      matchMode: DEFAULT_RULE_MATCH_MODE
    },
    priority
  )
}

export function buildRuleDuplicateKey(rule: RuleConfig) {
  return JSON.stringify({
    name: rule.name.trim().toLocaleLowerCase(),
    outputFolderName: rule.outputFolderName.trim().toLocaleLowerCase(),
    keywords: [...rule.keywords].map((value) => value.toLocaleLowerCase()).sort(),
    excludeKeywords: [...rule.excludeKeywords].map((value) => value.toLocaleLowerCase()).sort(),
    extensions: [...rule.extensions].map((value) => value.toLocaleLowerCase()).sort(),
    matchMode: rule.matchMode
  })
}
