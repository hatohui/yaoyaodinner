import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	getGetSeasonalPricesQueryKey,
	useSetSeasonalPrice,
} from '@/api/seasonal-prices/seasonal-prices'
import { getGetOrdersQueryKey } from '@/api/orders/orders'
import type { SeasonalPriceDto } from '@/api/model'
import { UtensilsCrossed } from 'lucide-react'
import { StoredImage } from '@/components/common/StoredImage'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/shadcn'
import { useToast } from '@/hooks/useToast'

interface SeasonalPriceCardProps {
	eventId: string
	dish: SeasonalPriceDto
	lang: string
}

export function SeasonalPriceCard({
	eventId,
	dish,
	lang,
}: SeasonalPriceCardProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const saved = dish.price === null ? '' : String(dish.price)
	const [draft, setDraft] = useState(saved)
	const { mutate, isPending } = useSetSeasonalPrice({
		mutation: {
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: getGetSeasonalPricesQueryKey(eventId, { lang }),
				})
				qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() })
				toast.success(t('admin.seasonal.saved'))
			},
			onError: () => setDraft(saved),
		},
	})

	useEffect(() => setDraft(saved), [saved])

	const commit = () => {
		const value = draft.trim()
		const price = value === '' ? null : Math.round(Number(value) * 100) / 100
		if (value === saved || (price !== null && !(price >= 0))) {
			setDraft(saved)
			return
		}
		mutate({ eventId, variantId: dish.variantId, data: { price } })
	}

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
				<label className='mt-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
					<Input
						type='number'
						inputMode='decimal'
						min={0}
						step='0.01'
						value={draft}
						placeholder={t('admin.seasonal.not_set')}
						disabled={isPending}
						aria-label={t('admin.seasonal.price_for', { name: dish.foodName })}
						onChange={e => setDraft(e.target.value)}
						onBlur={commit}
						onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
						className={cn(
							'h-9 rounded-full text-right font-semibold tabular-nums',
							draft === '' && 'border-dashed'
						)}
					/>
					{dish.currency}
				</label>
			</div>
		</li>
	)
}
