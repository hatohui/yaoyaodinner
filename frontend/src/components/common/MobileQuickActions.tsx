import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useQuickActions } from '@/hooks/useQuickActions'

interface MobileQuickActionsProps {
	onNavigate: (to: string) => void
}

const tileClass =
	'flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 text-center text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary'

function TileContent({
	icon: Icon,
	label,
}: {
	icon: LucideIcon
	label: string
}) {
	return (
		<>
			<span className='flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary'>
				<Icon className='size-4' />
			</span>
			{label}
		</>
	)
}

export function MobileQuickActions({ onNavigate }: MobileQuickActionsProps) {
	const actions = useQuickActions()
	if (actions.length === 0) return null

	return (
		<div className='grid auto-cols-fr grid-flow-col gap-2 px-4'>
			{actions.map(action =>
				'to' in action ? (
					<Link
						key={action.key}
						to={action.to}
						onClick={() => onNavigate(action.to)}
						className={tileClass}
					>
						<TileContent icon={action.icon} label={action.label} />
					</Link>
				) : 'href' in action ? (
					<a
						key={action.key}
						href={action.href}
						target='_blank'
						rel='noopener noreferrer'
						className={tileClass}
					>
						<TileContent icon={action.icon} label={action.label} />
					</a>
				) : (
					<button
						key={action.key}
						type='button'
						onClick={action.onSelect}
						className={tileClass}
					>
						<TileContent icon={action.icon} label={action.label} />
					</button>
				)
			)}
		</div>
	)
}
