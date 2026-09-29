import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { cn } from '@/utils/shadcn'

const swatch = 'relative size-4 shrink-0 rounded-full border-2 bg-card'

export function FloorPlanLegend() {
	const { t } = useTranslation()

	const items = [
		{
			key: 'open',
			label: t('floor_plan.legend_open'),
			className: 'border-primary/50',
		},
		{
			key: 'full',
			label: t('floor_plan.legend_full'),
			className: 'border-destructive/50',
		},
		{
			key: 'mine',
			label: t('tables.your_table'),
			className: 'border-primary ring-2 ring-primary/40',
		},
	]

	return (
		<ul className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground'>
			{items.map(item => (
				<li key={item.key} className='flex items-center gap-1.5'>
					<span className={cn(swatch, item.className)}>
						{item.key === 'mine' && (
							<MapPin className='absolute -top-2 left-1/2 size-2.5 -translate-x-1/2 fill-primary text-primary-foreground' />
						)}
					</span>
					{item.label}
				</li>
			))}
		</ul>
	)
}
