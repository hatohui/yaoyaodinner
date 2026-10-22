import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'

export function FloorPlanLegend() {
	const { t } = useTranslation()

	return (
		<p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
			<span className='relative size-4 shrink-0 rounded-full border-2 border-primary bg-card ring-2 ring-primary/40'>
				<MapPin className='absolute -top-2 left-1/2 size-2.5 -translate-x-1/2 fill-primary text-primary-foreground' />
			</span>
			{t('tables.your_table')}
		</p>
	)
}
