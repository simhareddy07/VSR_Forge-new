import { Bell } from 'lucide-react'
import { Avatar } from './Avatar'

export function Topbar({ onNotify, onProfile }: { onNotify: () => void; onProfile: () => void }) {
  return <header className="flex h-[72px] items-center justify-between border-b border-[#e5e8e5] bg-[#fbfcfb] px-5 sm:px-10 lg:px-14"><div className="flex items-center gap-3 text-xs"><span className="text-[#9ba5aa]">Projects</span><b className="font-normal text-[#c5cacb]">/</b><strong>Pulse Commerce</strong></div><div className="flex items-center gap-5"><button onClick={onNotify} className="relative border-0 bg-transparent p-1 text-[#829097]" aria-label="Notifications"><Bell size={18} /><i className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#de6e5f]" /></button><button onClick={onProfile} className="rounded-full border-2 border-transparent p-0.5 hover:border-[#a9cdb9]" aria-label="Open profile"><Avatar initials="VR" /></button></div></header>
}
