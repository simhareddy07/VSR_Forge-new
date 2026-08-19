const tones: Record<string, string> = { blue: 'bg-[#54789a]', coral: 'bg-[#d47d70]', violet: 'bg-[#8f76b1]', amber: 'bg-[#c28c55]', mint: 'bg-[#60a286]' }

export function Avatar({ initials, tone = 'blue' }: { initials: string; tone?: string }) {
  return <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white ${tones[tone] ?? tones.blue}`}>{initials}</div>
}
