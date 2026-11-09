import { useTranslation } from 'react-i18next'
import { useGetSeasonalPrices } from '@/api/seasonal-prices/seasonal-prices'
import type { SeasonalPriceDto } from '@/api/model'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { SeasonalPriceRow } from './@SeasonalPriceRow'

export default function AdminSeasonalPricesPage() {
	const { t, i18n } = useTranslation()
	const { selectedEvent } = useAdminEvents()
	const eventId = selectedEvent?.id ?? ''
	const { data: dishes = [], isLoading } = useGetSeasonalPrices<
		SeasonalPriceDto[]
	>(eventId, { lang: i18n.language }, { query: { enabled: Boolean(eventId) } })

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-1'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.seasonal.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>
					{t('admin.seasonal.hint')}
				</p>
			</div>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : dishes.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.seasonal.empty')}
				</p>
			) : (
				<Card className='gap-0 overflow-hidden rounded-2xl p-0'>
					<ul className='flex flex-col divide-y divide-border/60'>
						{dishes.map(dish => (
							<SeasonalPriceRow
								key={dish.variantId}
								eventId={eventId}
								dish={dish}
								lang={i18n.language}
							/>
						))}
					</ul>
				</Card>
			)}
		</div>
	)
}
