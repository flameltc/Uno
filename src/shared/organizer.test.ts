import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { generatePreviewItems, matchRule } from './organizer'

describe('matchRule', () => {
  it('matches any keyword case-insensitively and respects priority order', () => {
    const rules = [
      {
        id: 'r2',
        name: '发票',
        keywords: ['invoice'],
        outputFolderName: '发票',
        enabled: true,
        priority: 2
      },
      {
        id: 'r1',
        name: '合同',
        keywords: ['CONTRACT', 'agreement'],
        outputFolderName: '合同',
        enabled: true,
        priority: 1
      }
    ]

    const match = matchRule('Master-Agreement-2026.pdf', rules)

    expect(match?.id).toBe('r1')
  })

  it('ignores disabled rules and empty keywords', () => {
    const rules = [
      {
        id: 'r1',
        name: '忽略',
        keywords: [''],
        outputFolderName: '忽略',
        enabled: true,
        priority: 1
      },
      {
        id: 'r2',
        name: '简历',
        keywords: ['resume'],
        outputFolderName: '简历',
        enabled: false,
        priority: 2
      }
    ]

    const match = matchRule('candidate-resume.docx', rules)

    expect(match).toBeUndefined()
  })
})

describe('generatePreviewItems', () => {
  it('splits matched and unmatched files and keeps unmatched in place', () => {
    const preview = generatePreviewItems({
      sourceRoot: 'C:\\source',
      outputRoot: 'C:\\sorted',
      filePaths: [
        'C:\\source\\合同-张三.pdf',
        'C:\\source\\notes.txt'
      ],
      rules: [
        {
          id: 'contract',
          name: '合同',
          keywords: ['合同'],
          outputFolderName: '合同',
          enabled: true,
          priority: 1
        }
      ],
      existingTargetPaths: []
    })

    expect(preview.summary.total).toBe(2)
    expect(preview.summary.matched).toBe(1)
    expect(preview.summary.unmatched).toBe(1)
    expect(preview.items[0]?.targetPath).toBe(path.join('C:\\sorted', '合同', '合同-张三.pdf'))
    expect(preview.items[0]?.action).toBe('move')
    expect(preview.items[1]?.status).toBe('unmatched')
    expect(preview.items[1]?.action).toBe('skip')
  })

  it('auto-renames target files when filesystem or planned entries already occupy the name', () => {
    const preview = generatePreviewItems({
      sourceRoot: 'C:\\source',
      outputRoot: 'C:\\sorted',
      filePaths: [
        'C:\\source\\发票.pdf',
        'C:\\source\\nested\\发票.pdf'
      ],
      rules: [
        {
          id: 'invoice',
          name: '发票',
          keywords: ['发票'],
          outputFolderName: '发票',
          enabled: true,
          priority: 1
        }
      ],
      existingTargetPaths: [
        path.join('C:\\sorted', '发票', '发票.pdf')
      ]
    })

    expect(preview.items[0]?.finalTargetFileName).toBe('发票 (1).pdf')
    expect(preview.items[0]?.conflictResolution).toBe('auto-rename')
    expect(preview.items[1]?.finalTargetFileName).toBe('发票 (2).pdf')
    expect(preview.summary.renamed).toBe(2)
  })
})
