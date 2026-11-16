import { useTranslation } from 'react-i18next'
import { Lock, UserCheck, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PlanAccess =
	| 'locked'
	| 'other_table'
	| 'pick_identity'
	| 'ai_closed'
	| 'ready'

interface PlanAccessHintProps {
	access: PlanAccess
	onJoin: () => void
	onShowPeople: () => void
}

export function PlanAccessHint({
	access,
	onJoin,
	onShowPeople,
}: PlanAccessHintProps) {
	const { t } = useTranslation()
	if (access === 'ready') return null

	const hint = {
		locked: {
			icon: Lock,
			text: t('plan_board.locked'),
			action: { label: t('plan_board.unlock'), onClick: onJoin },
		},
		other_table: {
			icon: Lock,
			text: t('plan_board.other_table'),
			action: null,
		},
		pick_identity: {
			icon: UserCheck,
			text: t('plan_board.pick_identity'),
			action: { label: t('plan_board.go_people'), onClick: onShowPeople },
		},
		ai_closed: {
			icon: Wand2,
			text: t('plan_board.ai_closed'),
			action: null,
		},
	}[access]
	const Icon = hint.icon

	return (
		<div className='flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2.5'>
			<Icon className='size-4 shrink-0 text-primary' />
			<p className='min-w-0 flex-1 text-sm text-foreground'>{hint.text}</p>
			{hint.action && (
				<Button
					size='sm'
					onClick={hint.action.onClick}
					className='shrink-0 rounded-full'
				>
					{hint.action.label}
				</Button>
			)}
		</div>
	)
}
