import { MoreHorizontal } from 'lucide-react'
import type { Issue } from '../types'
import { Avatar } from './Avatar'

const typeStyles: Record<string, string> = { Bug: 'bg-[#ffede8] text-[#d06050]', Feature: 'bg-[#f2eefa] text-[#8266b4]', Task: 'bg-[#e8f1fb] text-[#527ca8]' }

export function IssueCard({ issue, onOpen, onArchive }: { issue: Issue; onOpen: () => void; onArchive: () => void }) {
  return <article className="mb-2.5 min-h-36 rounded-md border border-[#e6eae8] p-3 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex justify-between"><button onClick={onOpen} className={`rounded border-0 px-1.5 py-1 text-[9px] font-bold ${typeStyles[issue.type]}`}>{issue.type}</button><button onClick={onArchive} className="border-0 bg-transparent p-0 text-[#829097]" aria-label={`Archive ${issue.id}`}><MoreHorizontal size={16} /></button></div><button onClick={onOpen} className="my-2.5 block border-0 bg-transparent p-0 text-left text-[11px] font-bold leading-snug text-[#39474f]">{issue.title}</button><div className="flex justify-between text-[9px] text-[#879297]"><span>{issue.priority}</span><span className="text-[#aab3b5]">{issue.id}</span></div><div className="mt-2.5 flex items-center gap-1.5 border-t border-[#edf0ef] pt-2 text-[9px] text-[#879298]"><Avatar initials={issue.initials} tone={issue.tone} />{issue.assignee}</div></article>
}
