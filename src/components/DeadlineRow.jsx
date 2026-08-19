import { typeCls, formatWeight } from '../lib/stress'

const editIcon = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const deleteIcon = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

/**
 * Shared deadline row for Dashboard's "All Deadlines" and Courses' upcoming/past lists.
 * Stacks into two lines on mobile, collapses to the original single-line row at md:.
 * Edit/delete/toggle are entirely optional — omit them for a read-only row (Dashboard).
 */
export default function DeadlineRow({
  deadline,
  courseLabel,
  dueLabel,
  dueDateColorClass = 'text-[#9999AA]',
  dueDateMinWidth = 'min-w-[44px]',
  dimmed = false,
  onToggleComplete,
  onEdit,
  onDelete,
}) {
  const d = deadline
  const hasActions = onEdit || onDelete

  return (
    <div className={`flex flex-col gap-1.5 md:flex-row md:items-center md:gap-4 ${hasActions ? 'group' : ''}`}>
      <div className="flex items-center gap-2 md:flex-1 md:min-w-0">
        {onToggleComplete && (
          <div className="relative shrink-0 group/check">
            <button
              onClick={() => onToggleComplete(d.id)}
              className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
            >
              <span className="w-5 h-5 rounded-full border-2 border-[#D0D0DC] hover:border-green-500 transition-colors block" />
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F0F0F] text-white text-[10px] font-semibold rounded-md whitespace-nowrap opacity-0 group-hover/check:opacity-100 transition-opacity pointer-events-none">
              Mark as complete
            </span>
          </div>
        )}

        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md min-w-[72px] text-center ${dimmed ? 'opacity-70' : ''} ${typeCls(d.type)}`}>
          {d.type}
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-sm font-bold truncate ${dimmed ? 'text-[#6B6B80]' : 'text-[#0F0F0F]'}`}>{d.title}</span>
          {courseLabel && <span className="text-[11px] text-[#9999AA] shrink-0">{courseLabel}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 md:shrink-0">
        <span className="text-[11px] font-semibold shrink-0 text-[#9999AA]">{formatWeight(d.weight) ?? '—'}</span>
        <span className={`text-sm font-semibold shrink-0 ${dueDateMinWidth} text-right ${dueDateColorClass}`}>
          {dueLabel}
        </span>

        {hasActions && (
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(d)}
                title="Edit"
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg text-[#9999AA] hover:text-[#5B5BD6] hover:bg-[#EDEDFF] transition-colors"
              >
                {editIcon}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(d.id)}
                title="Delete"
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg text-[#9999AA] hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                {deleteIcon}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
