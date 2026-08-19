import { useState } from 'react'
import { PanelTitle } from './Typography'
import { Avatar } from './Avatar'

const initialEvents = [['RK', 'coral', 'Rahul moved BUG-101 to In progress', '12 min ago'], ['PS', 'violet', 'Priya created FEAT-104', '38 min ago'], ['AM', 'amber', 'Ananya commented on BUG-102', '1 hr ago'], ['VR', 'blue', 'You assigned TASK-103 to Vijay', '2 hrs ago']]

export function ActivityPanel() {
  const [showAll, setShowAll] = useState(false)
  const events = showAll ? [...initialEvents, ['KP', 'mint', 'Kiran completed TASK-098', 'Yesterday']] : initialEvents
  return <aside className="rounded-[9px] border border-[#e5e8e5] bg-white p-5"><PanelTitle eyebrow="Live updates" title="Activity" />{events.map(([initials, tone, text, time]) => <div className="flex gap-2.5 border-b border-[#edf0ef] py-3.5" key={`${text}-${time}`}><Avatar initials={initials} tone={tone} /><div><p className="text-[10px] text-[#76838a]">{text}</p><small className="text-[9px] text-[#adb5b7]">{time}</small></div></div>)}<button onClick={() => setShowAll((current) => !current)} className="mt-4 border-0 bg-transparent p-0 text-[11px] font-bold text-[#39805f]">{showAll ? 'Show recent activity' : 'View activity log →'}</button></aside>
}
