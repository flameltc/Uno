import type { NoticeState } from '@renderer/lib/app-helpers'
import { cn } from '@renderer/lib/utils'
import { getNoticeClasses } from '@renderer/lib/app-helpers'

export function NoticeBanner({ notice }: { notice: NoticeState | null }) {
  if (!notice) {
    return null
  }

  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm font-medium shadow-panel', getNoticeClasses(notice.tone))}>
      {notice.message}
    </div>
  )
}
