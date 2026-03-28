import type { NoticeState } from '@renderer/lib/app-helpers'
import { getNoticeClasses } from '@renderer/lib/app-helpers'
import { cn } from '@renderer/lib/utils'

function getNoticeTitle(tone: NoticeState['tone']) {
  if (tone === 'success') {
    return '操作完成'
  }

  if (tone === 'warning') {
    return '需要注意'
  }

  if (tone === 'danger') {
    return '操作失败'
  }

  return '当前状态'
}

export function NoticeBanner({ notice }: { notice: NoticeState | null }) {
  if (!notice) {
    return null
  }

  return (
    <div className={cn('notice-banner', getNoticeClasses(notice.tone))}>
      <div className="notice-banner-copy">
        <p className="notice-banner-title">{getNoticeTitle(notice.tone)}</p>
        <p className="notice-banner-message">{notice.message}</p>
      </div>
    </div>
  )
}
