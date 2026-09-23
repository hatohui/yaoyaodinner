import { UserSearch } from 'lucide-react'

export function MatchedPeople({ names }: { names: string[] }) {
	if (names.length === 0) return null
	return (
		<p className='flex items-center gap-1.5 rounded-xl bg-brand-muted px-2 py-1 text-xs text-primary'>
			<UserSearch className='size-3.5 shrink-0' />
			<span className='truncate'>{names.join(', ')}</span>
		</p>
	)
}
