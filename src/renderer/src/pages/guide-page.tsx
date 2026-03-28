import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export function GuidePage() {
  const workflowSteps = [
    ['1', '选择源目录', '选择后会自动分析文件名里的高频字段，并作为后续规则建议的基础。'],
    ['2', '选择输出根目录', '输出目录可以与源目录同根；同根时，一格会自动跳过已经整理过的输出子目录。'],
    ['3', '生成或调整规则', '高频字段可以快速生成规则，也可以在规则页手动补充更复杂的筛选条件。'],
    ['4', '生成预览计划', '预览阶段只计算将发生什么，不会真正移动任何文件。'],
    ['5', '开始整理', '执行时会显示进度、当前文件和可取消状态，长任务也能清楚掌握节奏。'],
    ['6', '查看历史 / 撤销', '最近一次成功任务支持撤销，降低误操作和试错成本。']
  ] as const

  const ruleItems = [
    ['包含关键词', '必填', '文件名中出现这些字段时，这条规则才有机会命中。'],
    ['排除关键词', '可选', '命中排除词时会直接跳过，适合过滤草稿、临时文件、复制件等。'],
    ['扩展名限制', '可选', '如果只想处理 pdf、docx、jpg 等特定文件，可以在这里限定范围。'],
    ['匹配方式', '任一 / 全部', '“任一命中”适合宽松归类，“全部命中”适合精确筛选。']
  ] as const

  const safetyItems = [
    ['先预览，后执行', '除非你点击“开始整理”，否则文件不会被真正移动。'],
    ['自动避免重名覆盖', '目标目录已存在同名文件时会自动改名，不会直接覆盖。'],
    ['支持取消和撤销', '整理过程中可取消；整理完成后可撤销最近一次成功任务。']
  ] as const

  return (
    <div className="space-y-6">
      <section className="hero-panel px-7 py-7 md:px-8 md:py-8">
        <div className="hero-orb hero-orb-primary" />
        <div className="hero-orb hero-orb-secondary" />

        <div className="relative z-10 max-w-[980px]">
          <p className="panel-kicker">Guide</p>
          <h1 className="mt-4 text-[clamp(2.3rem,4vw,4rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-fg-default">
            工作流说明 / 规则生效方式 / 安全边界
          </h1>
          <p className="mt-4 max-w-[820px] text-base leading-8 text-fg-muted">
            首页负责执行主流程，规则页负责长期维护，这里专门解释每一步为什么这样设计，以及文件整理计划到底是怎么被计算出来的。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="accent">先预览后执行</Badge>
            <Badge variant="neutral">支持同根目录整理</Badge>
            <Badge variant="success">最近任务可撤销</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">主流程</CardTitle>
          </CardHeader>
          <CardContent className="guide-steps-grid">
            {workflowSteps.map(([step, title, description]) => (
              <div key={step} className="guide-step-card">
                <div className="guide-step-index">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-fg-default">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-fg-muted">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">规则说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ruleItems.map(([title, badge, description]) => (
              <div key={title} className="guide-rule-card">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-fg-default">{title}</p>
                  <Badge variant={badge === '必填' ? 'accent' : badge === '任一 / 全部' ? 'success' : 'neutral'}>
                    {badge}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-fg-muted">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">安全策略</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {safetyItems.map(([title, description]) => (
              <div key={title} className="guide-safety-card">
                <p className="text-sm font-semibold text-fg-default">{title}</p>
                <p className="mt-3 text-sm leading-7 text-fg-muted">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
