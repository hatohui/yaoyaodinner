import type { SeasonalPriceDto } from '@/api/model'
import { SeasonalPriceInput } from '@/components/common/SeasonalPriceInput'

interface MenuSeasonalPricesProps {
	eventId: string
	dishes: SeasonalPriceDto[]
}

export function MenuSeasonalPrices({
	eventId,
	dishes,
}: MenuSeasonalPricesProps) {
	return (
		<div className='flex flex-col gap-1.5 border-t border-border px-3.5 py-3'>
			{dishes.map(dish => (
				<div key={dish.variantId} className='flex items-center gap-2'>
					{dishes.length > 1 && (
						<span className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
							{dish.variantLabel}
						</span>
					)}
					<SeasonalPriceInput eventId={eventId} dish={dish} />
				</div>
			))}
		</div>
	)
}
