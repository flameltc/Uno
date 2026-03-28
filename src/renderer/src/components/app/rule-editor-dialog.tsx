import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import type { RuleDraft } from '@renderer/lib/app-helpers'

export function RuleEditorDialog({
  draft,
  open,
  onChange,
  onOpenChange,
  onSave
}: {
  draft: RuleDraft
  open: boolean
  onChange: (draft: RuleDraft) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}) {
  const isAnyMode = draft.matchMode === 'any'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,840px)] overflow-hidden">
        <DialogHeader className="dialog-hero">
          <div className="dialog-hero-orb dialog-hero-orb-primary" />
          <div className="dialog-hero-orb dialog-hero-orb-secondary" />
          <div className="relative z-10">
            <p className="panel-kicker">Rule Editor</p>
            <DialogTitle className="mt-3 text-[1.7rem] tracking-[-0.05em]">
              {draft.id ? '编辑规则' : '新建规则'}
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-[620px] leading-7">
              设置关键词、排除词、扩展名和目标目录，定义这条规则在预览与整理中的命中方式。
            </DialogDescription>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="dialog-chip">输出路径由规则页优先级决定</span>
              <span className="dialog-chip">支持字段建议一键生成后再精修</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="dialog-form-grid">
            <div className="dialog-field">
              <Label htmlFor="rule-name" className="dialog-field-label">
                规则名称
              </Label>
              <Input
                id="rule-name"
                placeholder="例如：合同、发票、项目素材"
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
              />
              <p className="dialog-field-hint">用一个足够清晰的名字，方便在规则页快速搜索和排序。</p>
            </div>

            <div className="dialog-field">
              <Label htmlFor="rule-folder" className="dialog-field-label">
                输出子文件夹
              </Label>
              <Input
                id="rule-folder"
                placeholder="例如：合同"
                value={draft.outputFolderName}
                onChange={(event) => onChange({ ...draft, outputFolderName: event.target.value })}
              />
              <p className="dialog-field-hint">命中后会整理到这个子目录下，不需要填写完整路径。</p>
            </div>
          </div>

          <div className="dialog-field">
            <Label htmlFor="rule-keywords" className="dialog-field-label">
              包含关键词
            </Label>
            <Textarea
              id="rule-keywords"
              placeholder="支持逗号或换行，例如：合同, agreement, signed"
              value={draft.keywordsText}
              onChange={(event) => onChange({ ...draft, keywordsText: event.target.value })}
            />
            <p className="dialog-field-hint">文件名里只要出现这些词，就有机会命中这条规则。</p>
          </div>

          <div className="dialog-form-grid">
            <div className="dialog-field">
              <Label htmlFor="rule-excludes" className="dialog-field-label">
                排除关键词
              </Label>
              <Textarea
                id="rule-excludes"
                placeholder="例如：草稿, draft, 副本"
                value={draft.excludeKeywordsText}
                onChange={(event) => onChange({ ...draft, excludeKeywordsText: event.target.value })}
              />
              <p className="dialog-field-hint">命中排除词时会直接跳过，适合过滤临时文件和副本。</p>
            </div>

            <div className="dialog-field">
              <Label htmlFor="rule-extensions" className="dialog-field-label">
                扩展名限制
              </Label>
              <Textarea
                id="rule-extensions"
                placeholder="可选，例如：pdf, docx, jpg"
                value={draft.extensionsText}
                onChange={(event) => onChange({ ...draft, extensionsText: event.target.value })}
              />
              <p className="dialog-field-hint">留空表示不过滤扩展名；填写后只处理指定类型。</p>
            </div>
          </div>

          <div className="dialog-feature-grid">
            <div className="glass-tile p-5">
              <p className="text-sm font-semibold text-fg-default">匹配方式</p>
              <p className="mt-2 text-sm leading-7 text-fg-muted">
                决定这条规则是宽松归类，还是精确筛选。
              </p>

              <div className="mt-5 inline-flex w-full rounded-full border border-white/10 bg-black/25 p-1 shadow-panel">
                <button
                  type="button"
                  className={`match-mode-pill flex-1 ${isAnyMode ? 'match-mode-pill-active' : ''}`}
                  onClick={() => onChange({ ...draft, matchMode: 'any' })}
                >
                  任一关键词命中
                </button>
                <button
                  type="button"
                  className={`match-mode-pill flex-1 ${!isAnyMode ? 'match-mode-pill-active' : ''}`}
                  onClick={() => onChange({ ...draft, matchMode: 'all' })}
                >
                  关键词全部命中
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className={`match-mode-note ${isAnyMode ? 'match-mode-note-active' : ''}`}>
                  <p className="text-sm font-semibold text-fg-default">任一命中</p>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">
                    适合宽松归类，例如“合同 / 发票 / 素材图”这类只要出现任一词就可归档。
                  </p>
                </div>
                <div className={`match-mode-note ${!isAnyMode ? 'match-mode-note-active' : ''}`}>
                  <p className="text-sm font-semibold text-fg-default">全部命中</p>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">
                    适合精确筛选，例如“合同 + signed”或“invoice + paid”这样的组合条件。
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-tile p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg-default">启用规则</p>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">
                    关闭后这条规则不会参与预览、整理和字段建议生成后的执行计划。
                  </p>
                </div>
                <Switch checked={draft.enabled} onCheckedChange={(checked) => onChange({ ...draft, enabled: checked })} />
              </div>

              <div className="dialog-toggle-state">
                <span className={`dialog-toggle-dot ${draft.enabled ? 'dialog-toggle-dot-active' : ''}`} />
                <span>{draft.enabled ? '当前状态：启用中' : '当前状态：已停用'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="default" onClick={onSave}>
            保存规则
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
