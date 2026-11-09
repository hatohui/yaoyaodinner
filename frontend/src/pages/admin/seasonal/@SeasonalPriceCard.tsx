import { useTranslation } from 'react-i18next'
import { UtensilsCrossed } from 'lucide-react'
import type { SeasonalPriceDto } from '@/api/model'
import { SeasonalPriceInput } from '@/components/common/SeasonalPriceInput'
import { StoredImage } from '@/components/common/StoredImage'

interface SeasonalPriceCardProps {
	eventId: string
	dish: SeasonalPriceDto
}

export function SeasonalPriceCard({ eventId, dish }: SeasonalPriceCardProps) {
	const { t } = useTranslation()

	return (
		<li className='flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card'>
			<div className='flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted'>
				<StoredImage
					imageKey={dish.imageUrl}
					alt={dish.foodName}
					className='size-full object-cover'
					fallback={
						<UtensilsCrossed className='size-6 text-muted-foreground' />
					}
				/>
			</div>
			<div className='flex flex-1 flex-col gap-2 p-3'>
				<div className='flex min-w-0 flex-col'>
					<p className='m-0 line-clamp-2 min-h-[2lh] text-sm font-semibold leading-snug text-foreground'>
						{dish.foodName}
					</p>
					<p className='m-0 flex justify-between gap-2 text-xs text-muted-foreground'>
						<span className='truncate'>{dish.variantLabel}</span>
						<span className='shrink-0'>
							{t('admin.food.ordered_count', { count: dish.orderedCount })}
						</span>
					</p>
				</div>
				<div className='mt-auto'>
					<SeasonalPriceInput eventId={eventId} dish={dish} />
				</div>
			</div>
		</li>
	)
}
