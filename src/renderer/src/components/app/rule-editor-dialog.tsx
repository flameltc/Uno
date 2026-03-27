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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader className="bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_100%)]">
          <DialogTitle>{draft.id ? '编辑规则' : '新建规则'}</DialogTitle>
          <DialogDescription>
            规则会按优先级从上到下匹配。你可以设置包含词、排除词、扩展名和匹配方式。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rule-name">规则名称</Label>
              <Input
                id="rule-name"
                placeholder="例如：合同、发票、素材图"
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-folder">输出子文件夹</Label>
              <Input
                id="rule-folder"
                placeholder="例如：合同"
                value={draft.outputFolderName}
                onChange={(event) => onChange({ ...draft, outputFolderName: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-keywords">包含关键词</Label>
            <Textarea
              id="rule-keywords"
              placeholder="支持逗号或换行，例如：合同, agreement"
              value={draft.keywordsText}
              onChange={(event) => onChange({ ...draft, keywordsText: event.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rule-excludes">排除关键词</Label>
              <Textarea
                id="rule-excludes"
                placeholder="命中这些词时会跳过，例如：草稿, draft"
                value={draft.excludeKeywordsText}
                onChange={(event) => onChange({ ...draft, excludeKeywordsText: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-extensions">扩展名限制</Label>
              <Textarea
                id="rule-extensions"
                placeholder="可选，例如：pdf, docx, jpg"
                value={draft.extensionsText}
                onChange={(event) => onChange({ ...draft, extensionsText: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-3">
              <p className="text-sm font-semibold text-fg-default">匹配方式</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={draft.matchMode === 'any' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...draft, matchMode: 'any' })}
                >
                  任一关键词命中
                </Button>
                <Button
                  size="sm"
                  variant={draft.matchMode === 'all' ? 'default' : 'outline'}
                  onClick={() => onChange({ ...draft, matchMode: 'all' })}
                >
                  关键词全部命中
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg-default">启用规则</p>
                  <p className="text-sm text-fg-muted">关闭后不会参与建议、预览和整理。</p>
                </div>
                <Switch checked={draft.enabled} onCheckedChange={(checked) => onChange({ ...draft, enabled: checked })} />
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
