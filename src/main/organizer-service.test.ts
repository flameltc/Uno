import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { executePreviewItems, scanSourceFiles } from './organizer-service'
import type { PreviewItem } from '@shared/types'

const tempDirs: string[] = []

async function makeTempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'namesort-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { force: true, recursive: true }))
  )
})

describe('scanSourceFiles', () => {
  it('skips the output root when it is nested inside the source root', async () => {
    const sourceRoot = await makeTempDir()
    const nestedDir = path.join(sourceRoot, 'contracts')
    const outputRoot = path.join(sourceRoot, 'sorted')
    await fs.mkdir(nestedDir, { recursive: true })
    await fs.mkdir(path.join(outputRoot, '发票'), { recursive: true })
    await fs.writeFile(path.join(nestedDir, '合同.pdf'), 'a')
    await fs.writeFile(path.join(outputRoot, '发票', 'existing.pdf'), 'b')

    const files = await scanSourceFiles(sourceRoot, outputRoot)

    expect(files).toEqual([path.join(nestedDir, '合同.pdf')])
  })
})

describe('executePreviewItems', () => {
  it('moves files into their target directory and preserves unmatched items', async () => {
    const workspace = await makeTempDir()
    const sourceFile = path.join(workspace, '合同.pdf')
    const targetFile = path.join(workspace, 'sorted', '合同', '合同.pdf')
    await fs.writeFile(sourceFile, 'content')

    const items: PreviewItem[] = [
      {
        sourcePath: sourceFile,
        fileName: '合同.pdf',
        matchedRuleId: 'rule-1',
        matchedRuleName: '合同',
        targetPath: targetFile,
        finalTargetFileName: '合同.pdf',
        conflictResolution: 'none',
        action: 'move',
        status: 'matched'
      },
      {
        sourcePath: path.join(workspace, 'notes.txt'),
        fileName: 'notes.txt',
        action: 'skip',
        status: 'unmatched'
      }
    ]

    const result = await executePreviewItems(items)

    await expect(fs.readFile(targetFile, 'utf8')).resolves.toBe('content')
    await expect(fs.access(sourceFile)).rejects.toThrow()
    expect(result.summary.moved).toBe(1)
    expect(result.summary.unmatched).toBe(1)
  })

  it('falls back to copy and unlink when rename fails with EXDEV', async () => {
    const items: PreviewItem[] = [
      {
        sourcePath: 'C:\\source\\invoice.pdf',
        fileName: 'invoice.pdf',
        matchedRuleId: 'rule-1',
        matchedRuleName: '发票',
        targetPath: 'D:\\sorted\\发票\\invoice.pdf',
        finalTargetFileName: 'invoice.pdf',
        conflictResolution: 'none',
        action: 'move',
        status: 'matched'
      }
    ]

    const calls: string[] = []
    const result = await executePreviewItems(items, {
      mkdir: async (dir) => {
        calls.push(`mkdir:${dir}`)
      },
      rename: async () => {
        const error = new Error('cross-device')
        Object.assign(error, { code: 'EXDEV' })
        throw error
      },
      copyFile: async (from, to) => {
        calls.push(`copy:${from}->${to}`)
      },
      unlink: async (file) => {
        calls.push(`unlink:${file}`)
      }
    })

    expect(calls).toContain('copy:C:\\source\\invoice.pdf->D:\\sorted\\发票\\invoice.pdf')
    expect(calls).toContain('unlink:C:\\source\\invoice.pdf')
    expect(result.summary.moved).toBe(1)
    expect(result.items[0]?.message).toContain('已通过复制后删除完成跨盘移动')
  })
})
