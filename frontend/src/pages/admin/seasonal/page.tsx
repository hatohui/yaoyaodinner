import { useTranslation } from 'react-i18next'
import { useGetSeasonalPrices } from '@/api/seasonal-prices/seasonal-prices'
import type { SeasonalPriceDto } from '@/api/model'
import { Spinner } from '@/components/ui/spinner'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { SeasonalPriceCard } from './@SeasonalPriceCard'

export default function AdminSeasonalPricesPage() {
	const { t, i18n } = useTranslation()
	const { selectedEvent } = useAdminEvents()
	const eventId = selectedEvent?.id ?? ''
	const { data: dishes = [], isLoading } = useGetSeasonalPrices<
		SeasonalPriceDto[]
	>(eventId, { lang: i18n.language }, { query: { enabled: Boolean(eventId) } })

	return (
		<div className='flex flex-col gap-6'>
			<h1 className='text-xl font-bold text-foreground'>
				{t('admin.seasonal.title')}
			</h1>

			{isLoading ? (
				<div className='flex justify-center py-16'>
					<Spinner />
				</div>
			) : dishes.length === 0 ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.seasonal.empty')}
				</p>
			) : (
				<ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
					{dishes.map(dish => (
						<SeasonalPriceCard
							key={dish.variantId}
							eventId={eventId}
							dish={dish}
						/>
					))}
				</ul>
			)}
		</div>
	)
}
