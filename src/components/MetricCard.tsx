import type { ReactNode } from 'react'

export function MetricCard({ icon, label, value, detail, positive }: { icon: ReactNode; label: string; value: string; detail: string; positive?: boolean }) {
  return <div className="flex min-h-[142px] flex-col rounded-[9px] border border-[#e5e8e5] bg-white p-4"><div className="mb-3 text-[#4e8e72]">{icon}</div><span className="text-[11px] text-[#879399]">{label}</span><strong className="my-1 text-[28px] font-bold text-[#2d3a42]">{value}</strong><small className={`text-[10px] ${positive ? 'text-[#388361]' : 'text-[#a0a9ad]'}`}>{positive && '↗ '}{detail}</small></div>
}
