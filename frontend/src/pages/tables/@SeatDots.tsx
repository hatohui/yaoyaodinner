import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { cn } from '@/utils/shadcn'

const MAX_DOTS = 12

interface SeatDotsProps {
	seated: number
	capacity: number
}

export function SeatDots({ seated, capacity }: SeatDotsProps) {
	const { t } = useTranslation()
	const full = seated >= capacity
	const label = t('tables.seats_taken', { seated, capacity })

	if (capacity > MAX_DOTS) {
		return (
			<span
				aria-label={label}
				className='flex items-center gap-1.5 text-xs font-medium text-foreground/80'
			>
				<Users className='size-3.5 text-primary' />
				{seated}/{capacity}
			</span>
		)
	}

	return (
		<span role='img' aria-label={label} title={label} className='flex items-center gap-2'>
			<span className='flex items-center gap-1'>
				{Array.from({ length: capacity }, (_, i) => (
					<span
						key={i}
						className={cn(
							'size-2.5 rounded-full',
							i >= seated
								? 'border-[1.5px] border-primary/60'
								: full
									? 'bg-muted-foreground'
									: 'bg-primary'
						)}
					/>
				))}
			</span>
			<span className='text-xs font-medium tabular-nums text-foreground/80'>
				{seated}/{capacity}
			</span>
		</span>
	)
}
