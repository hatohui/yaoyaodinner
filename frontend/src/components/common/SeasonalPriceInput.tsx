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
import { cn } from '@/utils/shadcn'

interface SeasonalPriceInputProps {
	eventId: string
	dish: SeasonalPriceDto
	className?: string
}

export function SeasonalPriceInput({
	eventId,
	dish,
	className,
}: SeasonalPriceInputProps) {
	const { t } = useTranslation()
	const toast = useToast()
	const qc = useQueryClient()
	const saved = dish.price === null ? '' : String(dish.price)
	const [draft, setDraft] = useState(saved)
	const { mutate, isPending } = useSetSeasonalPrice({
		mutation: {
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: getGetSeasonalPricesQueryKey(eventId),
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
		<label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
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
					draft === '' && 'border-dashed',
					className
				)}
			/>
			{dish.currency}
		</label>
	)
}
