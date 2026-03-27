import { BookOpen, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export function GuidePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#eef7ff_100%)] px-6 py-6 shadow-float">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(9,105,218,0.16)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <BookOpen className="h-3.5 w-3.5" />
            Guide
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#0f172a]">规则说明和流程说明，分开放在这里。</h1>
          <p className="max-w-[760px] text-base leading-7 text-fg-muted">
            首页只负责执行主流程，规则页负责维护，而这一页专门解释“为什么这样设计”和“规则到底怎么生效”。
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
            <CardTitle className="flex items-center gap-2 text-base">
              <Workflow className="h-4 w-4 text-accent" />
              流程说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {[
              ['1', '选择源目录', '选择后会自动分析文件名里的高频字段。'],
              ['2', '选择输出根目录', '输出目录可以与源目录相同；相同时，一格会自动跳过已整理子目录。'],
              ['3', '生成规则', '高频字段可快速生成规则，也可以在规则页手工添加更复杂条件。'],
              ['4', '预览计划', '预览阶段只计算将发生什么，不会改动文件。'],
              ['5', '执行整理', '执行时会显示进度、当前文件，并支持取消。'],
              ['6', '查看历史 / 撤销', '最近任务可在首页直接撤销，避免误操作带来的风险。']
            ].map(([step, title, description]) => (
              <div key={step} className="workflow-step">
                <div className="workflow-index">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-fg-default">{title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#fffdf5_100%)]">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-accent" />
              规则说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-sm text-fg-muted">
            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-fg-default">包含关键词</p>
                <Badge variant="accent">必填</Badge>
              </div>
              <p className="mt-2">文件名中出现这些字段时，规则才有机会命中。</p>
            </div>

            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-fg-default">排除关键词</p>
                <Badge variant="warning">可选</Badge>
              </div>
              <p className="mt-2">如果文件名包含排除词，这条规则会被跳过，适合过滤草稿、临时文件、复印件等。</p>
            </div>

            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-fg-default">扩展名限制</p>
                <Badge variant="neutral">可选</Badge>
              </div>
              <p className="mt-2">如果只想处理 `pdf`、`docx`、`jpg` 之类的文件，可以在这里限制范围。</p>
            </div>

            <div className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-fg-default">匹配方式</p>
                <Badge variant="success">任一 / 全部</Badge>
              </div>
              <p className="mt-2">“任一关键词命中”适合宽松归类，“关键词全部命中”适合更精准的合同版本、签章件、特定项目文件。</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="border-b border-border-muted bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-accent" />
              安全策略
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 md:grid-cols-3">
            {[
              ['先预览，后执行', '除非你点击“确认后开始整理”，否则文件不会被移动。'],
              ['自动避免重名覆盖', '目标目录已有同名文件时会自动改名，不会覆盖已有文件。'],
              ['支持撤销和取消', '整理中可以取消；整理后可以撤销最近一次成功任务。']
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-border-default bg-canvas-default px-4 py-4">
                <p className="text-sm font-semibold text-fg-default">{title}</p>
                <p className="mt-2 text-sm text-fg-muted">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
