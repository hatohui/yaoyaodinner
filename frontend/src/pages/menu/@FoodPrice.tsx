import { useTranslation } from 'react-i18next'
import type { FoodItemDto } from '@/api/model'
import { cn } from '@/utils/shadcn'

interface FoodPriceProps {
	food: FoodItemDto
	className?: string
}

/** The cheapest portion's price, labelled "From" when there are several. */
export function FoodPrice({ food, className }: FoodPriceProps) {
	const { t } = useTranslation()
	if (food.price === null || food.price === undefined || food.price <= 0) {
		return (
			<div className={cn('flex flex-col leading-tight', className)}>
				<span className='whitespace-nowrap text-sm font-semibold text-primary'>
					{food.shouldCalculate ? t('menu.seasonal_price') : t('orders.free')}
				</span>
			</div>
		)
	}

	return (
		<div className={cn('flex flex-col leading-tight', className)}>
			{(food.variantCount ?? 1) > 1 && (
				<span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
					{t('menu.price_from')}
				</span>
			)}
			<span className='whitespace-nowrap text-base font-bold tabular-nums text-foreground'>
				{food.price}{' '}
				<span className='text-xs font-semibold text-primary'>
					{food.currency}
				</span>
			</span>
		</div>
	)
}
