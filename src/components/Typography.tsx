export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#7b8b87]">{children}</span>
}

export function PanelTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="mb-5 flex items-center justify-between"><div><Eyebrow>{eyebrow}</Eyebrow><h2 className="mt-1.5 font-display text-[22px] font-bold text-[#24323a]">{title}</h2></div>{action ? <button onClick={onAction} className="border-0 bg-transparent text-[11px] font-bold text-[#39805f] hover:text-[#176544]">{action}</button> : null}</div>
}
