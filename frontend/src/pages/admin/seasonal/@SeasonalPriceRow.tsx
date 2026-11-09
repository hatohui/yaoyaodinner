import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
	getGetSeasonalPricesQueryKey,
	useSetSeasonalPrice,
} from '@/api/seasonal-prices/seasonal-prices'
import { getGetOrdersQueryKey } from '@/api/orders/orders'
import type { SeasonalPriceDto } from '@/api/model'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'

interface SeasonalPriceRowProps {
	eventId: string
	dish: SeasonalPriceDto
	lang: string
}

export function SeasonalPriceRow({
	eventId,
	dish,
	lang,
}: SeasonalPriceRowProps) {
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
		<li className='flex items-center justify-between gap-3 px-4 py-2.5'>
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
