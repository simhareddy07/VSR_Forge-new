import { useEffect, useState } from 'react'
import { activityApi } from '../activity-api'
import { Avatar } from '../components/Avatar'
import { PanelTitle } from '../components/Typography'
import type { Activity } from '../types'

const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : 'Just now'

export function ActivityPage() {
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	useEffect(() => { activityApi.list().then(setActivities).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load activity')).finally(() => setLoading(false)) }, [])
	return <section className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Project history" title="Everything happening across your projects" />{loading && <div className="mt-4 grid gap-3">{[1, 2, 3].map((item) => <div className="flex animate-pulse gap-3 border-b border-[#edf0ef] py-4" key={item}><div className="h-8 w-8 rounded-full bg-[#e5e8e5]" /><div className="flex-1"><div className="h-3 w-2/3 rounded bg-[#edf0ef]" /><div className="mt-2 h-2 w-1/3 rounded bg-[#edf0ef]" /></div></div>)}</div>}{!loading && error && <p role="alert" className="mt-4 rounded-md bg-[#fff0ec] p-4 text-xs text-[#b34f42]">{error}</p>}{!loading && !error && activities.length === 0 && <p className="mt-4 rounded-md bg-[#f5f7f5] p-5 text-xs text-[#76838a]">No activity has been recorded yet.</p>}{!loading && !error && activities.length > 0 && <div className="mt-3">{activities.map((activity) => <article className="flex gap-3 border-b border-[#edf0ef] py-4 last:border-0" key={activity.id}><Avatar initials={activity.actor.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()} tone="mint" /><div className="min-w-0 flex-1"><p className="text-xs text-[#536168]"><strong className="text-[#27313b]">{activity.actor.name}</strong> {activity.action}</p><time className="mt-1 block text-[10px] text-[#a0aaad]">{formatDate(activity.createdAt)}</time></div><span className="h-fit rounded-full bg-[#e7f0ea] px-2 py-1 text-[9px] font-bold text-[#39805f]">{activity.entityType}</span></article>)}</div>}</section>
}
