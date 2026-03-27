import { describe, expect, it } from 'vitest'

import { suggestFrequentFields } from './field-suggestions'

describe('suggestFrequentFields', () => {
  it('extracts recurring fields, counts each file once, and ignores numeric noise', () => {
    const suggestions = suggestFrequentFields(
      [
        '合同-合同-张三-2025.pdf',
        '合同-李四-2024.pdf',
        '发票-张三-2024.pdf',
        'notes.txt'
      ],
      10
    )

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: '合同',
          count: 2,
          sampleFileName: '合同-合同-张三-2025.pdf'
        }),
        expect.objectContaining({
          value: '张三',
          count: 2,
          sampleFileName: '合同-合同-张三-2025.pdf'
        })
      ])
    )
    expect(suggestions.map((suggestion) => suggestion.value)).not.toContain('2024')
    expect(suggestions.map((suggestion) => suggestion.value)).not.toContain('2025')
    expect(suggestions.every((suggestion) => suggestion.count >= 2)).toBe(true)
  })

  it('respects the max result limit after sorting by frequency', () => {
    const suggestions = suggestFrequentFields(
      ['合同-张三.pdf', '合同-李四.pdf', '合同-王五.pdf', '发票-张三.pdf', '发票-王五.pdf'],
      1
    )

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]).toMatchObject({
      value: '合同',
      count: 3
    })
  })

  it('filters filler tokens and keeps recurring meaningful fields', () => {
    const suggestions = suggestFrequentFields(
      [
        'Invoice-final-copy-Acme.pdf',
        'Invoice-final-copy-Globex.pdf',
        'Invoice-review-copy-Acme.pdf',
        'Receipt-copy-Globex.pdf'
      ],
      10
    )

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'invoice', count: 3 }),
        expect.objectContaining({ value: 'acme', count: 2 }),
        expect.objectContaining({ value: 'globex', count: 2 })
      ])
    )
    expect(suggestions.map((suggestion) => suggestion.value)).not.toContain('copy')
    expect(suggestions.map((suggestion) => suggestion.value)).not.toContain('final')
  })
})
