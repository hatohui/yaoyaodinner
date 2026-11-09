import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Leaf } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
	getGetSeasonalPricesQueryKey,
	useGetSeasonalPrices,
	useSetSeasonalPrice,
} from '@/api/seasonal-prices/seasonal-prices'
import { getGetOrdersQueryKey } from '@/api/orders/orders'
import type { SeasonalPriceDto } from '@/api/model'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAdminEvents } from '@/hooks/useAdminEvents'
import { useToast } from '@/hooks/useToast'

export function SeasonalPricesCard() {
	const { t, i18n } = useTranslation()
	const { selectedEvent } = useAdminEvents()
	const eventId = selectedEvent?.id ?? ''
	const params = { lang: i18n.language }
	const { data: dishes = [] } = useGetSeasonalPrices<SeasonalPriceDto[]>(
		eventId,
		params,
		{ query: { enabled: Boolean(eventId) } }
	)

	if (!selectedEvent || dishes.length === 0) return null

	return (
		<Card className='gap-3 rounded-2xl p-4'>
			<div className='flex flex-col gap-0.5'>
				<div className='flex items-center gap-2'>
					<Leaf className='size-4 text-primary' />
					<p className='text-sm font-semibold text-foreground'>
						{t('admin.seasonal.title')}
					</p>
				</div>
				<p className='text-xs text-muted-foreground'>
					{t('admin.seasonal.hint')}
				</p>
			</div>
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
	)
}

interface SeasonalPriceRowProps {
	eventId: string
	dish: SeasonalPriceDto
	lang: string
}

function SeasonalPriceRow({ eventId, dish, lang }: SeasonalPriceRowProps) {
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
		<li className='flex items-center justify-between gap-3 py-2'>
			<span className='min-w-0 truncate text-sm text-foreground'>
				{dish.foodName}
				{dish.variantLabel && (
					<span className='text-muted-foreground'> · {dish.variantLabel}</span>
				)}
			</span>
			<label className='flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground'>
				<Input
					type='number'
					inputMode='decimal'
					min={0}
					step='0.01'
					value={draft}
					placeholder='-'
					disabled={isPending}
					aria-label={t('admin.seasonal.price_for', { name: dish.foodName })}
					onChange={e => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
					className='h-8 w-24 rounded-full text-right tabular-nums'
				/>
				{dish.currency}
			</label>
		</li>
	)
}
