import { useEffect, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { PanelTitle } from '../components/Typography'
import { userApi } from '../user-api'
import type { ProjectUser } from '../types'

export function TeamPage({ onInvite }: { onInvite: () => void }) {
  const [people, setPeople] = useState<ProjectUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { userApi.getUsers().then(setPeople).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load team members')).finally(() => setLoading(false)) }, [])
  return <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><div className="flex items-start justify-between"><PanelTitle eyebrow="People directory" title="Engineering team" /><button onClick={onInvite} className="rounded-md bg-[#286f50] px-3 py-2 text-[10px] font-bold text-white">Invite</button></div>{loading && <p className="mt-4 rounded-md bg-[#f5f7f5] p-4 text-xs text-[#76838a]">Loading team members...</p>}{error && <p role="alert" className="mt-4 rounded-md bg-[#fff0ec] p-4 text-xs text-[#b34f42]">{error}</p>}{!loading && !error && people.length === 0 && <p className="mt-4 rounded-md bg-[#f5f7f5] p-4 text-xs text-[#76838a]">No users are available yet.</p>}{!loading && !error && people.map((person) => { const initials = person.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); return <div className="flex items-center gap-3 border-t border-[#edf0ef] py-3.5" key={person.id}><Avatar initials={initials} tone="mint" /><div><strong className="block text-xs">{person.name}</strong><small className="text-[10px] text-[#97a1a5]">{person.role} · {person.email}</small></div><MoreHorizontal className="ml-auto" size={16} /></div> })}</section><section className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Directory summary" title="Team members" /><div className="mt-5 font-display text-5xl font-bold text-[#2c7552]">{loading ? '—' : people.length}</div><p className="text-[11px] text-[#8a969c]">Registered users available for project membership and issue assignment.</p></section></div>
}
