import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
	FLOORS,
	type FloorId,
	type OpenFloors,
} from '@/components/floor-plan/layout'
import { cn } from '@/utils/shadcn'

interface FloorTogglesProps {
	open: OpenFloors
	onToggle: (floor: FloorId) => void
}

export function FloorToggles({ open, onToggle }: FloorTogglesProps) {
	const { t } = useTranslation()
	const openCount = FLOORS.filter(floor => open[floor.id]).length

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-wrap gap-2'>
			{FLOORS.map(floor => {
				const isOpen = open[floor.id]
				const Icon = isOpen ? ChevronDown : ChevronRight
				return (
					<button
						key={floor.id}
						type='button'
						aria-expanded={isOpen}
						disabled={isOpen && openCount === 1}
						onClick={() => onToggle(floor.id)}
						className={cn(
							'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed',
							isOpen
								? 'border-primary/40 bg-primary/10 text-foreground'
								: 'border-border bg-card text-muted-foreground hover:text-foreground'
						)}
					>
						<Icon className='size-3.5' />
						{t(`floor_plan.${floor.labelKey}`)}
					</button>
				)
			})}
		</div>
	)
}
